import os
import shutil
from collections import Counter

# Path to the images directory
images_dir = "/Users/yeshwanthbalaji/Desktop/Sem-7/full_stack_dev/trafficManag/backend/datasets/archive/vip_cup_2020/fisheye-day-30062020/images/train"

# Directory to save sample images
sample_dir = "/Users/yeshwanthbalaji/Desktop/Sem-7/full_stack_dev/trafficManag/backend/sample_images"
os.makedirs(sample_dir, exist_ok=True)

# List all files in the directory
image_files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]

# Extract city names from filenames
cities = [filename.split('_')[0] for filename in image_files]

# Count frequency of each city
city_counts = Counter(cities)

# Print the results and save one sample image per city
saved_samples = set()
for filename in image_files:
    city = filename.split('_')[0]
    if city not in saved_samples:
        src = os.path.join(images_dir, filename)
        dst = os.path.join(sample_dir, filename)
        shutil.copy(src, dst)
        saved_samples.add(city)

for city, count in city_counts.items():
    print(f"File name which starts with {city}: {count} images")