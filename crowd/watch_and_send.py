#!/usr/bin/env python3
"""
Continuously watch a folder for new images, detect people, log counts, and send to server.
- Filenames must contain timestamp: yyyymmddhhmmss (e.g., 20250902233045.jpg)
- Only counts 'person' class (COCO class 0).
"""

import os
import time
import csv
import re
from datetime import datetime
import requests

import torch
from ultralytics import YOLO
import cv2

# ---------------- SETTINGS ----------------
WATCH_DIR = "/Users/parthivsuryakb/Downloads/sparkd-main/uploads"
CSV_PATH = "counts.csv"
CHECK_INTERVAL = 3
MODEL_PATH = "yolov8n.pt"
CONF_THRES = 0.15
IOU_THRES = 0.6
IMG_SIZE = 1280
SAVE_VIS = True
VIS_DIR = "visnew"

# Replace this with your ngrok public URL later
SERVER_URL = "http://127.0.0.1:5001/uploads"
# ------------------------------------------

TIMESTAMP_RE = re.compile(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})")  # ISO format


def choose_device():
    # Force CPU for stability during testing
    return torch.device("cpu")
    # if torch.cuda.is_available():
    #     return torch.device("cuda")
    # if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
    #     return torch.device("mps")
    # return torch.device("cpu")


def parse_timestamp(filename: str) -> str:
    m = TIMESTAMP_RE.search(filename)
    if not m:
        return ""
    ts = m.group(1)
    try:
        # Parse ISO format directly
        dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S")
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return ""


def ensure_dir(d):
    os.makedirs(d, exist_ok=True)


def send_to_server(timestamp, count, img_path):
    # Prepare the payload (metadata)
    data = {"timestamp": timestamp, "count": count}
    
    # Open the image file in binary mode
    try:
        with open(img_path, 'rb') as f:
            files = {'image': (os.path.basename(img_path), f, 'image/jpeg')}
            # Send both data and files
            r = requests.post(SERVER_URL, data=data, files=files, timeout=5)
            print(f"[SENT] Image {os.path.basename(img_path)} → {r.status_code}")
    except Exception as e:
        print(f"[ERROR] sending to server: {e}")


def main():
    device = choose_device()
    print(f"[INFO] Using device: {device}")

    model = YOLO(MODEL_PATH)
    model.to(device)

    if SAVE_VIS:
        ensure_dir(VIS_DIR)

    processed = set()

    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["filename", "timestamp", "count"])

    print(f"[INFO] Watching folder: {WATCH_DIR}")

    while True:
        try:
            files = sorted(f for f in os.listdir(WATCH_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png")))
            new_files = [f for f in files if f not in processed]

            if new_files:
                print(f"[DEBUG] Found {len(new_files)} new files. Processing one by one...")
                
                with open(CSV_PATH, "a", newline="") as f:
                    writer = csv.writer(f)
                    
                    for filename in new_files:
                        img_path = os.path.join(WATCH_DIR, filename)
                        
                        # Run inference on single image
                        results = model(img_path, conf=CONF_THRES, iou=IOU_THRES, imgsz=IMG_SIZE,
                                        verbose=False, device=device)
                        
                        # Results is a list (usually len 1 for single source)
                        for res in results:
                            count = sum(1 for b in res.boxes if int(b.cls[0]) == 0)
                            ts_str = parse_timestamp(filename)
                            writer.writerow([filename, ts_str, count])
                            print(f"[NEW] {filename} → {count} people")
                            processed.add(filename)

                            # Send live to server
                            if ts_str:
                                send_to_server(ts_str, count, img_path)

                            if SAVE_VIS:
                                im = cv2.imread(img_path)
                                if im is not None:
                                    for b in res.boxes:
                                        if int(b.cls[0]) != 0:
                                            continue
                                        x1, y1, x2, y2 = map(int, b.xyxy[0].cpu().numpy())
                                        conf = float(b.conf[0])
                                        cv2.rectangle(im, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                        cv2.putText(im, f"person {conf:.2f}", (x1, max(0, y1 - 6)),
                                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                                    out_path = os.path.join(VIS_DIR, filename)
                                    cv2.imwrite(out_path, im)

            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            print("\n[INFO] Stopped by user")
            break
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()