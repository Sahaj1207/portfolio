"""Refine the hand-traced silhouette into a precise matte with GrabCut.

The traced polygon seeds GrabCut: its eroded core is certain foreground, a band around its
edge is 'probably' either way, and everything further out is certain background."""
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).parent

img = cv2.imread(str(HERE / "crop.png"))
seed = cv2.imread(str(HERE / "crop-mask.png"), cv2.IMREAD_GRAYSCALE) > 127

k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
core = cv2.erode(seed.astype(np.uint8), k(14)).astype(bool)
outer = cv2.dilate(seed.astype(np.uint8), k(18)).astype(bool)

gc = np.full(seed.shape, cv2.GC_BGD, np.uint8)
gc[outer] = cv2.GC_PR_BGD
gc[seed] = cv2.GC_PR_FGD
gc[core] = cv2.GC_FGD

bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(img, gc, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)

# Keep only the largest connected piece and fill pinholes.
n, labels, stats, _ = cv2.connectedComponentsWithStats(fg)
fg = (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k(3))
fg = cv2.erode(fg, k(1))  # pull the edge in a pixel so no background fringe survives

# Soft 1-2 px edge so it doesn't look like a sticker.
alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 1.2)
cv2.imwrite(str(HERE / "matte.png"), (alpha * 255).astype(np.uint8))

a = alpha[..., None]
magenta = (img * a + np.array([255, 0, 255]) * (1 - a)).astype(np.uint8)
dark = (img * a + img * 0.18 * (1 - a)).astype(np.uint8)
cv2.imwrite(str(HERE / "matte-preview.png"), np.hstack([magenta, dark]))
print("done", fg.mean().round(3))
