import os
import cv2
from pathlib import Path

input_root = 'split_output_grouped'
output_root = 'joined_videos'
os.makedirs(output_root, exist_ok=True)

# Get all group folders (prefixes)
for group in os.listdir(input_root):
    group_path = os.path.join(input_root, group)
    if not os.path.isdir(group_path):
        continue
    for direction in ['north', 'east', 'west', 'south']:
        dir_path = os.path.join(group_path, direction)
        if not os.path.isdir(dir_path):
            continue
        images = sorted([f for f in os.listdir(dir_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        if not images:
            continue
        # Read first image to get size
        first_img = cv2.imread(os.path.join(dir_path, images[0]))
        height, width, _ = first_img.shape
        video_path = os.path.join(output_root, f"{group}_{direction}.mp4")
        out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*'mp4v'), 5, (width, height))
        for img_name in images:
            img = cv2.imread(os.path.join(dir_path, img_name))
            if img is not None:
                out.write(img)
        out.release()
        print(f"Saved video: {video_path}")