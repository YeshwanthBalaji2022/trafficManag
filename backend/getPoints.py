# import cv2

# # Load your image
# img_path = 'image.jpg'
# img = cv2.imread(img_path)

# # List to store selected points
# points = []

# def mouse_callback(event, x, y, flags, param):
#     if event == cv2.EVENT_LBUTTONDOWN:
#         points.append((x, y))
#         cv2.circle(img, (x, y), 5, (0, 0, 255), -1)
#         cv2.imshow('Image', img)

# cv2.namedWindow('Image')
# cv2.setMouseCallback('Image', mouse_callback)

# print("Click points on the image for your region. Press ESC to finish.")

# while True:
#     cv2.imshow('Image', img)
#     key = cv2.waitKey(1) & 0xFF
#     if key == 27:  # ESC key to exit
#         break

# cv2.destroyAllWindows()
# print("Selected points:", points)



# # import cv2
# # import numpy as np

# # img_path = 'image.jpg'
# # img = cv2.imread(img_path)

# # # Points from your annotation
# # direction_regions = {
# #     "North": [(14, 150), (514, 474), (1028, 150), (688, 22)],
# #     "West": [(7, 815), (475, 450), (950, 772), (561, 1073)],
# #     "East": [(1084, 188), (1504, 389), (1904, 417), (1902, 73)],
# #     "South": [(1032, 797), (1532, 391), (1909, 554), (1800, 1200)]
# # }

# # # Define colors for each region
# # colors = {
# #     "North": (255, 0, 0),
# #     "West": (0, 255, 0),
# #     "East": (0, 0, 255),
# #     "South": (255, 255, 0)
# # }

# # # Draw polygons on image
# # for direction, points in direction_regions.items():
# #     pts = np.array(points, np.int32)
# #     pts = pts.reshape((-1, 1, 2))
# #     cv2.polylines(img, [pts], isClosed=True, color=colors[direction], thickness=3)
# #     # Optional: put text label at the centroid
# #     centroid = tuple(np.mean(pts, axis=0).astype(int)[0])
# #     cv2.putText(img, direction, centroid, cv2.FONT_HERSHEY_SIMPLEX, 1, colors[direction], 2, cv2.LINE_AA)

# # cv2.imshow('Validation', img)
# # cv2.waitKey(0)
# # cv2.destroyAllWindows()


import cv2
import numpy as np

img = cv2.imread('image.jpg')

# Provided hexagonal regions (6 points each)
direction_regions = {
    "North": [(5, 8), (5, 144), (426, 445), (979, 182), (549, 8), (12, 8)],
    "East": [(1060, 181), (1502, 376), (1914, 290), (1913, 145), (1537, 126), (1071, 180)],
    "West": [(4, 867), (442, 475), (881, 790), (562, 1072), (18, 1075), (7, 882)],
    "South": [(988, 832), (1520, 382), (1911, 579), (1911, 1064), (1291, 1074), (1000, 843)]
}

colors = {
    "North": (0, 0, 255),
    "West": (0, 255, 0),
    "East": (255, 0, 0),
    "South": (255, 255, 0)
}

for dir_name, points in direction_regions.items():
    pts = np.array(points, np.int32).reshape((-1, 1, 2))
    cv2.polylines(img, [pts], isClosed=True, color=colors[dir_name], thickness=3)
    centroid = tuple(np.mean(pts, axis=0).astype(int)[0])
    cv2.putText(img, dir_name, centroid, cv2.FONT_HERSHEY_SIMPLEX, 1, colors[dir_name], 2)

cv2.imshow("Hexagonal Regions Validation", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
