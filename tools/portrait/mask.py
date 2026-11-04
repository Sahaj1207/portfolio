"""Cut the person out of the photo with a hand-traced, feathered polygon mask."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
SRC = Path(sys.argv[1])

# Silhouette traced in the source image's pixel coordinates (896x1200).
OUTLINE = [
    # hair, left to right over the top
    (398, 418), (420, 392), (450, 375), (485, 366), (520, 368), (548, 382), (560, 405), (560, 440),
    # right ear and jaw
    (570, 458), (588, 470), (594, 490), (583, 502),
    # right side of the neck down to the collar
    (580, 512), (580, 550), (586, 565), (592, 580), (598, 592), (608, 598),
    # collar and right shoulder / arm
    (615, 605), (632, 615), (660, 628), (720, 648), (765, 682), (795, 722), (812, 790), (822, 870), (826, 960),
    (828, 1010),
    # bottom edge of the crop
    (380, 1010),
    # left side of the suit
    (370, 860), (360, 760), (358, 720), (378, 692), (420, 662), (460, 640), (470, 630),
    # neck, left ear, left side of hair
    (474, 600), (455, 582), (438, 572), (424, 552), (418, 528), (404, 505), (392, 478), (388, 448),
]


def build():
    img = Image.open(SRC).convert("RGB")
    assert img.size == (896, 1200), img.size
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).polygon(OUTLINE, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))

    box = (300, 330, 880, 1010)
    img, mask = img.crop(box), mask.crop(box)

    preview = Image.composite(img, Image.new("RGB", img.size, (255, 0, 255)), mask)
    preview.save(HERE / "mask-preview.png")
    img.save(HERE / "crop.png")
    mask.save(HERE / "crop-mask.png")
    print("crop", img.size)


if __name__ == "__main__":
    build()
