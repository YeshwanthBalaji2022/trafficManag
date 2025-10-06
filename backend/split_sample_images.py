import os
import json
from juncSplitter import JunctionSplitter
from pathlib import Path

# Load nt.json
with open('nt.json', 'r') as f:
    nt_data = json.load(f)  

# Directory containing sample images
input_dir = 'datasets/archive/vip_cup_2020/fisheye-day-30062020/images/train'
output_dir = 'split_output_grouped'
os.makedirs(output_dir, exist_ok=True)

# List all image files in the directory
image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff'))]

results = {'processed': 0, 'skipped': [], 'failed': [], 'output_paths': {}}
totImg = len(image_files)
cnt = 0
for img_file in image_files:
    cnt+=1
    perc = (cnt / totImg) * 100 if totImg else 0
    print(f"File No: {cnt}/{totImg} ------ Percentage: {perc:.2f}")
    matched_key = None
    for key in nt_data:
        if img_file.startswith(key):
            matched_key = key
            break
    if not matched_key or nt_data[matched_key] == "No_need":
        results['skipped'].append(img_file)
        continue
    try:
        coords = nt_data[matched_key]
        splitter = JunctionSplitter(coords)
        img_path = os.path.join(input_dir, img_file)
        # Create a folder for this image group
        group_dir = os.path.join(output_dir, matched_key)
        os.makedirs(group_dir, exist_ok=True)
        # Split and save in subfolders by direction
        out_paths = {}
        for direction, angle in coords['roadAngles'].items():
            direction_dir = os.path.join(group_dir, direction)
            os.makedirs(direction_dir, exist_ok=True)
            out = splitter.split_image(img_path, group_dir)
            # Move the output file to the correct subfolder
            out_file = out[direction]
            new_out_file = os.path.join(direction_dir, os.path.basename(out_file))
            os.replace(out_file, new_out_file)
            out_paths[direction] = new_out_file
        results['output_paths'][img_file] = out_paths
        results['processed'] += 1
    except Exception as e:
        results['failed'].append({'file': img_file, 'error': str(e)})

# Save results
with open(os.path.join(output_dir, 'split_results.json'), 'w') as f:
    json.dump(results, f, indent=2)

print(f"Processed: {results['processed']}")
print(f"Skipped: {len(results['skipped'])}")
print(f"Failed: {len(results['failed'])}")
