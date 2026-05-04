#!/usr/bin/env python3
"""
Advanced Hybrid Crowd Counter (Global + Tiled Inference).

Features:
- **Hybrid Detection**: Combines a full-image scan (for context) with high-res tiled scans (for small details).
- **SAHI-like Slicing**: Splits images into overlapping quadrants to maintain resolution for small faces.
- **NMS Fusion**: Merges detections from all passes and removes duplicates using Non-Maximum Suppression.
- **MPS/CUDA Acceleration**: Optimized for Apple Silicon and NVIDIA GPUs.
"""

import os
import time
import csv
import re
import requests
from datetime import datetime
import cv2
import torch
import numpy as np
import torchvision
from ultralytics import YOLO

# ---------------- SETTINGS ----------------
WATCH_DIR = "upload"        # Input folder
CSV_PATH = "counts.csv"     # Output log
CHECK_INTERVAL = 3          # Scan frequency (seconds)
ALERT_THRESHOLD = 400       # Trigger email if count > this
ALERT_COOLDOWN = 300        # Seconds between emails

# ACCURACY SETTINGS
MODEL_PATH = "yolov8l.pt"   # Large model for better feature extraction
CONF_THRES_GLOBAL = 0.25    # Standard confidence for full image
CONF_THRES_TILE = 0.15      # Lower confidence for small tiles to catch hidden faces
IOU_THRES = 0.6             # Fusion IoU threshold

# Slicing Settings
SLICE_HEIGHT = 640
SLICE_WIDTH = 640
OVERLAP_HEIGHT_RATIO = 0.2
OVERLAP_WIDTH_RATIO = 0.2

SAVE_VIS = True             # Save debug images
VIS_DIR = "vis"             # Visualization output
# ------------------------------------------

TIMESTAMP_RE = re.compile(r"(\d{14})")

def choose_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def parse_timestamp(filename):
    m = TIMESTAMP_RE.search(filename)
    if not m:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ts = m.group(1)
    try:
        return datetime.strptime(ts, "%Y%m%d%H%M%S").strftime("%Y-%m-%d %H:%M:%S")
    except:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def ensure_dir(d):
    os.makedirs(d, exist_ok=True)

def get_slices(image_height, image_width, slice_height, slice_width, overlap_height_ratio, overlap_width_ratio):
    slices = []
    y_overlap = int(slice_height * overlap_height_ratio)
    x_overlap = int(slice_width * overlap_width_ratio)

    y_grid = []
    y = 0
    while y < image_height:
        y_grid.append(y)
        if y + slice_height >= image_height:
            if y != image_height - slice_height:
                y_grid.append(image_height - slice_height)
            break
        y += slice_height - y_overlap

    x_grid = []
    x = 0
    while x < image_width:
        x_grid.append(x)
        if x + slice_width >= image_width:
            if x != image_width - slice_width:
                x_grid.append(image_width - slice_width)
            break
        x += slice_width - x_overlap

    for y in y_grid:
        for x in x_grid:
            # Ensure we don't go out of bounds (though logic above should prevent it for standard sizes)
            # Clip coordinates to be safe
            y = max(0, y)
            x = max(0, x)
            h = min(slice_height, image_height - y)
            w = min(slice_width, image_width - x)
            slices.append([x, y, w, h])
            
    return slices

def run_hybrid_inference(model, image_path, device):
    """
    Runs inference on the full image AND tiles, then merges results.
    """
    # 1. Read Image
    img = cv2.imread(image_path)
    if img is None:
        return [], 0
        
    ih, iw, _ = img.shape
    
    all_boxes = []   # List of [x1, y1, x2, y2]
    all_scores = []  # List of conf
    all_cls = []     # List of class

    # --- A. Global Pass (Full Context) ---
    # Improves detection of large objects and overall scene understanding
    results_global = model.predict(
        source=img,
        conf=CONF_THRES_GLOBAL,
        iou=0.7,
        imgsz=1280, # High res inference
        classes=[0],
        verbose=False,
        device=device
    )
    
    if len(results_global) > 0:
        boxes = results_global[0].boxes
        if boxes is not None:
            all_boxes.append(boxes.xyxy.cpu())
            all_scores.append(boxes.conf.cpu())
            all_cls.append(boxes.cls.cpu())

    # --- B. Tiled Pass (Small Object Details) ---
    # Splits image into overlapping crops to maintain resolution for small faces
    slices = get_slices(ih, iw, SLICE_HEIGHT, SLICE_WIDTH, OVERLAP_HEIGHT_RATIO, OVERLAP_WIDTH_RATIO)
    
    tile_images = []
    tile_coords = []
    
    for (x, y, w, h) in slices:
        crop = img[y:y+h, x:x+w]
        tile_images.append(crop)
        tile_coords.append((x, y))

    if tile_images:
        # Batch inference on tiles
        results_tiles = model.predict(
            source=tile_images,
            conf=CONF_THRES_TILE, # Lower threshold for tiles
            iou=0.6,
            imgsz=SLICE_HEIGHT,
            classes=[0],
            verbose=False,
            device=device
        )

        for i, res in enumerate(results_tiles):
            if res.boxes is None or len(res.boxes) == 0:
                continue
            
            # Offset boxes back to global coordinates
            tx, ty = tile_coords[i]
            
            # xyxy local coordinates
            local_boxes = res.boxes.xyxy.cpu()
            local_scores = res.boxes.conf.cpu()
            local_cls = res.boxes.cls.cpu()
            
            # Add offset
            offset_boxes = local_boxes.clone()
            offset_boxes[:, 0] += tx
            offset_boxes[:, 1] += ty
            offset_boxes[:, 2] += tx
            offset_boxes[:, 3] += ty
            
            all_boxes.append(offset_boxes)
            all_scores.append(local_scores)
            all_cls.append(local_cls)

    # --- C. Fusion (NMS) ---
    if not all_boxes:
        return np.array([]), 0

    # Concatenate all detections
    merged_boxes = torch.cat(all_boxes)
    merged_scores = torch.cat(all_scores)
    merged_cls = torch.cat(all_cls)

    # Apply global NMS to remove duplicates from overlapping tiles/global pass
    keep_indices = torchvision.ops.nms(merged_boxes, merged_scores, IOU_THRES)
    
    final_boxes = merged_boxes[keep_indices]
    final_scores = merged_scores[keep_indices]
    final_cls = merged_cls[keep_indices]
    
    # Format for visualization (xyxy, conf, cls) - convert to numpy
    final_results = []
    for i in range(len(final_boxes)):
        box = final_boxes[i].numpy()
        conf = final_scores[i].item()
        cls = final_cls[i].item()
        final_results.append([*box, conf, cls])
        
    return np.array(final_results), len(final_results)

def generate_heatmap(image, detections):
    """
    Generates a crowd density heatmap.
    """
    h, w, _ = image.shape
    # Create a blank float mask
    density_map = np.zeros((h, w), dtype=np.float32)
    
    # Gaussian kernel size based on image size (adaptive)
    k_size = max(15, int(w / 100))
    if k_size % 2 == 0: k_size += 1
    sigma = k_size / 3.0
    
    for det in detections:
        x1, y1, x2, y2, _, _ = det
        # Center of the person
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        
        # Draw a gaussian blob
        # Simple approximation: Draw a circle on a temp layer and blur it
        temp_layer = np.zeros((h, w), dtype=np.float32)
        cv2.circle(temp_layer, (cx, cy), k_size, (1,), -1)
        
        # Accumulate
        density_map += temp_layer

    # Blur the accumulated map to smooth it
    density_map = cv2.GaussianBlur(density_map, (k_size*3, k_size*3), sigma)
    
    # Normalize to 0-255
    if np.max(density_map) > 0:
        density_map = density_map / np.max(density_map) * 255
    
    density_map = density_map.astype(np.uint8)
    
    # Apply colormap (JET is standard for heatmaps)
    heatmap = cv2.applyColorMap(density_map, cv2.COLORMAP_JET)
    
    # Overlay on original image
    # Weight: 0.6 original + 0.4 heatmap
    overlay = cv2.addWeighted(image, 0.6, heatmap, 0.4, 0)
    return overlay

def main():
    device = choose_device()
    print(f"[INFO] Hybrid Crowd Counter (Global+Tiled) initialized on {device}")
    
    # Load model
    print(f"[INFO] Loading model: {MODEL_PATH}...")
    try:
        model = YOLO(MODEL_PATH)
        model.to(device)
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        return

    ensure_dir(WATCH_DIR)
    if SAVE_VIS:
        ensure_dir(VIS_DIR)

    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="") as f:
            csv.writer(f).writerow(["filename", "timestamp_iso", "count", "process_time_ms"])

    processed_files = set()
    last_alert_time = 0
    print(f"[INFO] Watching {WATCH_DIR}...")

    while True:
        try:
            current_files = sorted([f for f in os.listdir(WATCH_DIR) if not f.startswith('.')])
            new_files = [f for f in current_files if f not in processed_files]

            if new_files:
                for filename in new_files:
                    path = os.path.join(WATCH_DIR, filename)
                    start_t = time.time()
                    
                    # Run Hybrid Inference
                    detections, count = run_hybrid_inference(model, path, device)
                    
                    elapsed_ms = (time.time() - start_t) * 1000
                    ts_iso = parse_timestamp(filename)

                    # Log to CSV
                    with open(CSV_PATH, "a", newline="") as f:
                        csv.writer(f).writerow([filename, ts_iso, count, f"{elapsed_ms:.0f}"])

                    print(f" [PROCESSED] {filename} | Count: {count} | Time: {elapsed_ms:.0f}ms")

                    # --- ALERT SYSTEM ---
                    # Check for overcrowding (skip manual uploads)
                    if count > ALERT_THRESHOLD and not filename.startswith("manual_"):
                        current_time = time.time()
                        if (current_time - last_alert_time) > ALERT_COOLDOWN:
                            try:
                                print(f"[ALERT] Count {count} > {ALERT_THRESHOLD}. Sending email...")
                                requests.post("http://localhost:5001/send-email", json={
                                    "to": "sparkd.team@gmail.com",
                                    "subject": f"🚨 Critical Crowd Alert: {count} People Detected",
                                    "body": f"WARNING: High crowd density detected.\n\nTime: {datetime.now()}\nCount: {count}\nThreshold: {ALERT_THRESHOLD}\n\nPlease deploy staff immediately."
                                }, timeout=2)
                                last_alert_time = current_time
                                print("[ALERT] Email sent successfully.")
                            except Exception as e:
                                print(f"[ERROR] Failed to send alert: {e}")
                    # --------------------

                    # Visualization
                    if SAVE_VIS:
                        img = cv2.imread(path)
                        if img is not None:
                            # 1. Standard Box Visualization
                            vis_img = img.copy()
                            for det in detections:
                                x1, y1, x2, y2, conf, cls = det
                                start_point = (int(x1), int(y1))
                                end_point = (int(x2), int(y2))
                                cv2.rectangle(vis_img, start_point, end_point, (0, 255, 0), 2)
                                
                            cv2.putText(vis_img, f"Count: {count}", (30, 50), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)

                            save_path = os.path.join(VIS_DIR, filename)
                            cv2.imwrite(save_path, vis_img)
                            
                            # 2. Heatmap Visualization
                            heatmap_img = generate_heatmap(img, detections)
                            heatmap_path = os.path.join(VIS_DIR, f"heatmap_{filename}")
                            cv2.imwrite(heatmap_path, heatmap_img)

                    processed_files.add(filename)

            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            print("\n[INFO] Stopping...")
            break
        except Exception as e:
            print(f" [ERROR] Loop exception: {e}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()