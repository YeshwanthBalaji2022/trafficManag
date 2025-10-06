import os
import cv2
import json
from ultralytics import YOLO  # pip install ultralytics

input_root = 'split_output_grouped'
output_json = 'vehicle_counts.json'

# Load YOLOv8n model (pretrained on COCO)
model = YOLO('yolov8n.pt')  # You can use yolov5s.pt or yolov8n.pt

results = {}

for group in os.listdir(input_root):
    group_path = os.path.join(input_root, group)
    if not os.path.isdir(group_path):
        continue
    results[group] = {}
    for direction in ['north', 'east', 'west', 'south']:
        dir_path = os.path.join(group_path, direction)
        if not os.path.isdir(dir_path):
            continue
        images = sorted([f for f in os.listdir(dir_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        vehicle_counts = []
        for img_name in images:
            img_path = os.path.join(dir_path, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue
            # Run detection
            results_list = model(img)
            count = 0
            # Count vehicles (car=2, motorcycle=3, bus=5, truck=7 in COCO)
            for det in results_list[0].boxes.cls:
                if int(det) in [2, 3, 5, 7]:
                    count += 1
            vehicle_counts.append({'image': img_name, 'vehicles': count})
        results[group][direction] = vehicle_counts

# Save results
with open(output_json, 'w') as f:
    json.dump(results, f, indent=2)

print(f"Vehicle counts saved to {output_json}")
