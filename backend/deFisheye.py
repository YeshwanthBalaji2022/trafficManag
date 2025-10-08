import cv2
import numpy as np

# Path to the fisheye image
fisheye_img_path = "sample_images/01_fisheye_day_000489.jpg"  # Change to your image path if needed
output_img_path = "defisheye_output.jpg"

# Read the image
img = cv2.imread(fisheye_img_path)
h, w = img.shape[:2]

# Camera matrix and distortion coefficients (example values, may need tuning)
K = np.array([[w/2, 0, w/2],
              [0, w/2, h/2],
              [0, 0, 1]])
D = np.array([-0.3, 0.7, 0, 0])  # Example distortion coefficients
# Undistort
map1, map2 = cv2.fisheye.initUndistortRectifyMap(
    K, D, np.eye(3), K, (w, h), cv2.CV_16SC2)
undistorted_img = cv2.remap(img, map1, map2, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

# Save the result
cv2.imwrite(output_img_path, undistorted_img)
print(f"Saved undistorted image as {output_img_path}")