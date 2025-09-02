#!/usr/bin/env python3
"""
Continuously watch a folder for new images, detect people, and log counts to CSV.
- Filenames must contain timestamp: yyyymmddhhmmss (e.g., 20250902233045.jpg)
- Only counts 'person' class (COCO class 0).
- Optionally saves visualizations with bounding boxes.
"""

import os
import time
import csv
import re
from datetime import datetime

import torch
from ultralytics import YOLO
import cv2

# ---------------- SETTINGS ----------------
WATCH_DIR = "/Users/parthivsuryakb/Downloads/sparkd-main/uploads"
       # folder where ESP32-CAM saves snapshots
CSV_PATH = "counts.csv"     # output file for results
CHECK_INTERVAL = 3          # seconds between scans
MODEL_PATH = "yolov8l.pt"   # YOLO model (auto-download if missing)
CONF_THRES = 0.15           # confidence threshold
IOU_THRES = 0.6             # NMS IoU threshold
IMG_SIZE = 1280              # inference image size
SAVE_VIS = True             # save annotated images?
VIS_DIR = "vis"             # folder for visualizations
# ------------------------------------------

TIMESTAMP_RE = re.compile(r"(\d{14})")  # yyyymmddhhmmss

def choose_device():
    """Pick best available device: CUDA > MPS > CPU"""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def parse_timestamp(filename: str) -> str:
    """Extract timestamp from filename if possible, else return empty string"""
    m = TIMESTAMP_RE.search(filename)
    if not m:
        return ""
    ts = m.group(1)
    try:
        return datetime.strptime(ts, "%Y%m%d%H%M%S").isoformat()
    except ValueError:
        return ""

def ensure_dir(d):
    os.makedirs(d, exist_ok=True)

def main():
    device = choose_device()
    print(f"[INFO] Using device: {device}")

    # Load YOLO model
    model = YOLO(MODEL_PATH)
    model.to(device)

    if SAVE_VIS:
        ensure_dir(VIS_DIR)

    # Track processed files
    processed = set()

    # Initialize CSV
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["filename", "timestamp_iso", "count"])

    print(f"[INFO] Watching folder: {WATCH_DIR}")

    while True:
        try:
            # Find all new image files
            files = sorted(f for f in os.listdir(WATCH_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png")))
            new_files = [f for f in files if f not in processed]

            if new_files:
                batch_paths = [os.path.join(WATCH_DIR, f) for f in new_files]
                results = model(
                    batch_paths,
                    conf=CONF_THRES,
                    iou=IOU_THRES,
                    imgsz=IMG_SIZE,
                    verbose=False,
                    device=device
                )

                with open(CSV_PATH, "a", newline="") as f:
                    writer = csv.writer(f)
                    for img_path, res in zip(batch_paths, results):
                        # Count only "person" class (COCO ID = 0)
                        count = sum(1 for b in res.boxes if int(b.cls[0]) == 0)
                        ts_iso = parse_timestamp(os.path.basename(img_path))
                        writer.writerow([os.path.basename(img_path), ts_iso, count])
                        print(f"[NEW] {os.path.basename(img_path)} → {count} people")
                        processed.add(os.path.basename(img_path))

                        if SAVE_VIS:
                            im = cv2.imread(img_path)
                            if im is not None:
                                for b in res.boxes:
                                    if int(b.cls[0]) != 0:
                                        continue
                                    x1, y1, x2, y2 = map(int, b.xyxy[0].cpu().numpy())
                                    conf = float(b.conf[0])
                                    cv2.rectangle(im, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                    cv2.putText(im, f"person {conf:.2f}", (x1, max(0, y1-6)),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                                out_path = os.path.join(VIS_DIR, os.path.basename(img_path))
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