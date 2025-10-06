import os
import cv2
from collections import defaultdict

input_dir = 'datasets/archive/vip_cup_2020/fisheye-day-30062020/images/train'
output_dir = 'stitched_videos'
os.makedirs(output_dir, exist_ok=True)

# Group images by prefix before first underscore
groups = defaultdict(list)
for fname in os.listdir(input_dir):
    if not fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff')):
        continue
    prefix = fname.split('_')[0]
    groups[prefix].append(fname)

for prefix, files in groups.items():
    files.sort()  # Sort for correct order
    first_img_path = os.path.join(input_dir, files[0])
    img = cv2.imread(first_img_path)
    if img is None:
        continue
    height, width, _ = img.shape
    video_path = os.path.join(output_dir, f'{prefix}.mp4')
    out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*'mp4v'), 10, (width, height))
    for fname in files:
        img_path = os.path.join(input_dir, fname)
        img = cv2.imread(img_path)
        if img is not None:
            out.write(img)
    out.release()
    print(f'Saved video: {video_path}')
