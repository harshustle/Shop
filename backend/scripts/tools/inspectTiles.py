from PIL import Image
import numpy as np

im = Image.open(r'C:\Users\hsriv\.gemini\antigravity-ide\brain\8591f1c3-6588-489a-a9cf-ba6f0a5e37bb\.user_uploaded\media_1789591499391.png').convert('RGB')
arr = np.array(im)
w, h = im.size

# Find the background white color (e.g. 255, 255, 255)
# Anything that is not white or near-white:
is_colored = np.any(arr < 250, axis=2)

# Project horizontally to find non-white column bands
# and vertically to find rows
# Let's print out the row ranges where non-white pixels exist
row_counts = is_colored.sum(axis=1)
bands = []
in_band = False
start = 0
for y, count in enumerate(row_counts):
    if count > 5 and not in_band:
        in_band = True
        start = y
    elif count <= 5 and in_band:
        in_band = False
        bands.append((start, y - 1))
if in_band:
    bands.append((start, h - 1))

print("Vertical content bands:")
for b in bands:
    print(f"y={b[0]} to {b[1]} (height={b[1]-b[0]+1}) max_colored_pixels={row_counts[b[0]:b[1]+1].max()}")
