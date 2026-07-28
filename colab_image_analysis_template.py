# Google Colab Template: Silverleaf Nightshade Image Analysis
# This script calculates Specific Leaf Area (SLA) and Herbivory Damage %
# using OpenCV and computer vision techniques.

# --- 1. Install & Import Libraries ---
# !pip install opencv-python-headless matplotlib numpy scikit-image

import cv2
import numpy as np
import matplotlib.pyplot as plt
from skimage.measure import regionprops, label
from google.colab import files

# --- 2. Upload Image ---
print("Please upload a picture of the leaf on a WHITE background with a ruler.")
uploaded = files.upload()
image_path = list(uploaded.keys())[0]

# --- 3. Process Image ---
# Load image
img = cv2.imread(image_path)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Thresholding to separate leaf from white background
# Since background is white, leaf is darker. We use an inverse binary threshold.
_, thresh = cv2.threshold(img_gray, 200, 255, cv2.THRESH_BINARY_INV)

# Find contours (the outline of the leaf)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if not contours:
    print("No leaf detected. Check lighting and background contrast.")
else:
    # Assume the largest contour is the leaf
    leaf_contour = max(contours, key=cv2.contourArea)
    
    # Calculate Total Leaf Area (Pixels)
    leaf_area_pixels = cv2.contourArea(leaf_contour)
    
    # Create a mask for the intact leaf (filling in the herbivory holes)
    hull = cv2.convexHull(leaf_contour)
    mask_intact = np.zeros_like(img_gray)
    cv2.drawContours(mask_intact, [hull], -1, 255, thickness=cv2.FILLED)
    
    intact_area_pixels = np.count_nonzero(mask_intact)
    
    # Calculate Herbivory
    # Herbivory holes = Area of Hull (intact) - Actual Leaf Area
    herbivory_area_pixels = intact_area_pixels - leaf_area_pixels
    herbivory_percentage = (herbivory_area_pixels / intact_area_pixels) * 100
    
    # --- 4. Visualizing Results ---
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    axes[0].imshow(img_rgb)
    axes[0].set_title('Original Image')
    axes[0].axis('off')
    
    axes[1].imshow(thresh, cmap='gray')
    axes[1].set_title('Leaf Mask')
    axes[1].axis('off')
    
    # Draw hull in red to show "intact" leaf shape vs actual shape
    img_hull = img_rgb.copy()
    cv2.drawContours(img_hull, [hull], -1, (255, 0, 0), 3) # Red outline for hull
    axes[2].imshow(img_hull)
    axes[2].set_title('Convex Hull (Intact Area)')
    axes[2].axis('off')
    
    plt.tight_layout()
    plt.show()

    # --- 5. Final Output ---
    print(f"--- Analysis Results ---")
    print(f"Total Intact Area (Pixels): {intact_area_pixels}")
    print(f"Actual Leaf Area (Pixels): {leaf_area_pixels}")
    print(f"Herbivory Damage Area (Pixels): {herbivory_area_pixels}")
    print(f"Herbivory Damage Percentage: {herbivory_percentage:.2f}%")
    
    print("\nNote: To convert pixels to cm^2 (Specific Leaf Area),")
    print("you must click on the ruler in the image to calibrate pixels-per-cm.")
    print("Example: If 1 cm = 100 pixels, then Area (cm^2) = Area (Pixels) / (100^2)")
