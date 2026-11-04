"""Builds the data for the code-token portrait.

  1. Tokenizes the site's own source (src/**) and keeps the most frequent code tokens.
  2. Rasterizes them into a single-channel signed-distance-field (SDF) atlas.
  3. Importance-samples the portrait into blue-noise particle targets, each assigned a token.

Outputs (deterministic, committed to the repo):
  public/particles/atlas.png     SDF glyph atlas, 2048x2048, 8-bit
  public/particles/tokens.json   manifest: token list, atlas UV rects, metrics
  public/particles/targets.bin   per particle: u16 x, u16 y, u16 token, u8 tone, u8 seed

Usage:  python tools/particles/build_particles.py [--preview]
"""
from __future__ import annotations

import hashlib
import json
import re
import struct
import sys
from collections import Counter
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
OUT = ROOT / "public" / "particles"
PORTRAIT = ROOT / "assets" / "source" / "crop.png"
MATTE = ROOT / "assets" / "source" / "matte.png"
FONT = Path("C:/Windows/Fonts/CascadiaMono.ttf")  # Cascadia Mono, SIL Open Font License

MAX_TOKENS = 400
MAX_TOKEN_LEN = 14
MAX_SINGLE_CHAR = 16
ATLAS = 2048
FONT_PX = 40
CELL_H = 56
SDF_SPREAD = 6  # px of distance encoded on each side of the glyph edge
PARTICLES = 40_000
SEED = 1207

# ── 1. Tokenize ────────────────────────────────────────────────

TOKEN_RE = re.compile(
    r"=>|===|!==|&&|\|\||\?\?|\+=|-=|<=|>=|==|!=|::"
    r"|[A-Za-z_$][\w$]*"
    r"|\d+(?:\.\d+)?"
    r"|[{}()\[\];:.,<>+\-*/%=!?&|^~#@]"
)
COMMENT_RE = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)
STRING_RE = re.compile(r"`(?:\\.|[^`\\])*`|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'", re.S)


def source_files() -> list[Path]:
    files = [p for p in SRC.rglob("*") if p.suffix in {".ts", ".tsx", ".css"}]
    # Content files are mostly English prose; the portrait should be made of code.
    return sorted(p for p in files if "content" not in p.parts)


def tokenize() -> list[str]:
    counts: Counter[str] = Counter()
    for path in source_files():
        text = path.read_text(encoding="utf-8")
        text = COMMENT_RE.sub(" ", text)
        text = STRING_RE.sub(" ", text)
        counts.update(t for t in TOKEN_RE.findall(text) if len(t) <= MAX_TOKEN_LEN)
    # Frequency first, then alphabetical, so the result never depends on file order.
    ranked = [t for t, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]
    # Punctuation is the most frequent but reads as dots; words and operators read as code.
    # Put them first (tokens earlier in the list are drawn more often) and keep a little punctuation.
    words = [t for t in ranked if len(t) > 1]
    marks = [t for t in ranked if len(t) == 1][:MAX_SINGLE_CHAR]
    return words[: MAX_TOKENS - len(marks)] + marks


# ── 2. SDF atlas ───────────────────────────────────────────────


def glyph_sdf(token: str, font: ImageFont.FreeTypeFont) -> np.ndarray:
    pad = SDF_SPREAD + 2
    w = int(font.getlength(token)) + 2 * pad
    img = Image.new("L", (w, CELL_H), 0)
    ImageDraw.Draw(img).text((pad, CELL_H // 2), token, font=font, fill=255, anchor="lm")
    mask = (np.asarray(img) > 127).astype(np.uint8)
    inside = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    outside = cv2.distanceTransform(1 - mask, cv2.DIST_L2, 5)
    signed = inside - outside  # > 0 inside the glyph
    return np.clip(128 + signed * (127 / SDF_SPREAD), 0, 255).astype(np.uint8)


def build_atlas(tokens: list[str]):
    font = ImageFont.truetype(str(FONT), FONT_PX)
    atlas = np.zeros((ATLAS, ATLAS), np.uint8)
    rects = []
    x = y = 0
    for t in tokens:
        g = glyph_sdf(t, font)
        h, w = g.shape
        if x + w > ATLAS:
            x, y = 0, y + CELL_H
        if y + h > ATLAS:
            raise SystemExit(f"atlas full after {len(rects)} tokens")
        atlas[y : y + h, x : x + w] = g
        rects.append({"t": t, "x": x, "y": y, "w": w, "h": h})
        x += w
    used_h = y + CELL_H
    return atlas, rects, used_h


# ── 3. Portrait targets ────────────────────────────────────────


def portrait_tone() -> tuple[np.ndarray, np.ndarray]:
    """Brightness per pixel with local contrast, so eyes, glasses and hair read in glyphs."""
    rgb = Image.open(PORTRAIT).convert("L")
    alpha = np.asarray(Image.open(MATTE).convert("L"), np.float32) / 255
    gray = np.asarray(rgb, np.float32) / 255
    blur = np.asarray(rgb.filter(ImageFilter.GaussianBlur(24)), np.float32) / 255
    lo, hi = np.percentile(gray[alpha > 0.5], [2, 98])
    tone = 0.25 * np.clip((gray - lo) / (hi - lo), 0, 1) + 0.75 * np.clip(0.5 + (gray - blur) * 3, 0, 1)
    return np.clip(tone, 0, 1), alpha


def sample_targets(n_tokens: int):
    """Stratified (jittered-grid) importance sampling: near blue-noise, cheap and deterministic."""
    rng = np.random.default_rng(SEED)
    tone, alpha = portrait_tone()
    h, w = tone.shape
    density = (alpha * (0.12 + 0.88 * tone**1.4)).astype(np.float64)

    # Grid spacing chosen so the expected accepted count slightly exceeds the budget.
    spacing = np.sqrt(density.sum() / (PARTICLES * 1.15))
    gx = np.arange(0, w, spacing)
    gy = np.arange(0, h, spacing)
    xs, ys = np.meshgrid(gx, gy)
    xs = (xs + rng.random(xs.shape) * spacing).ravel()
    ys = (ys + rng.random(ys.shape) * spacing).ravel()
    inside = (xs < w) & (ys < h)
    xs, ys = xs[inside], ys[inside]
    d = density[ys.astype(int), xs.astype(int)]
    keep = rng.random(d.shape) < d
    xs, ys = xs[keep], ys[keep]
    t = tone[ys.astype(int), xs.astype(int)]

    # Random order means any prefix is an evenly spread subset: quality tiers just draw fewer.
    order = rng.permutation(len(xs))[:PARTICLES]
    xs, ys, t = xs[order], ys[order], t[order]

    # Frequent tokens appear more often, but every token gets a chance.
    weights = 1 / np.sqrt(np.arange(1, n_tokens + 1))
    tok = rng.choice(n_tokens, size=len(xs), p=weights / weights.sum())
    seed = rng.integers(0, 256, size=len(xs))
    return xs / w, ys / h, tok, t, seed, w / h


def write_targets(path: Path, u, v, tok, tone, seed):
    with path.open("wb") as f:
        for i in range(len(u)):
            f.write(struct.pack("<HHHBB", round(u[i] * 65535), round(v[i] * 65535), int(tok[i]), round(tone[i] * 255), int(seed[i])))


def preview(rects, atlas, u, v, tok, tone, aspect, path: Path):
    """Draws the portrait from the generated data, as glyphs, to eyeball the result."""
    H = 1400
    W = round(H * aspect)
    canvas = Image.new("RGB", (W, H), (7, 7, 12))
    cells = [Image.fromarray(atlas[r["y"] : r["y"] + r["h"], r["x"] : r["x"] + r["w"]]) for r in rects]
    for i in range(len(u)):
        cell = cells[tok[i]]
        size = 5 + tone[i] * 9
        gw = max(1, round(cell.width * size / CELL_H))
        gh = max(1, round(size))
        g = cell.resize((gw, gh), Image.BILINEAR).point(lambda p: 255 if p > 128 else 0)
        col = (int(124 + (0 - 124) * v[i]), int(92 + (212 - 92) * v[i]), 255)
        canvas.paste(col, (round(u[i] * W - gw / 2), round(v[i] * H - gh / 2)), g)
    canvas.save(path)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tokens = tokenize()
    atlas, rects, used_h = build_atlas(tokens)
    atlas_path = OUT / "atlas.png"
    Image.fromarray(atlas[:used_h]).save(atlas_path, optimize=True)

    u, v, tok, tone, seed, aspect = sample_targets(len(tokens))
    write_targets(OUT / "targets.bin", u, v, tok, tone, seed)

    manifest = {
        "version": 1,
        "atlas": {"width": ATLAS, "height": used_h, "cellHeight": CELL_H, "sdfSpread": SDF_SPREAD, "fontPx": FONT_PX},
        "portrait": {"aspect": round(aspect, 5), "count": len(u), "stride": 8},
        "tokens": [[r["t"], r["x"], r["y"], r["w"], r["h"]] for r in rects],
    }
    (OUT / "tokens.json").write_text(json.dumps(manifest, separators=(",", ":")), encoding="utf-8")

    total = 0
    for p in sorted(OUT.iterdir()):
        size = p.stat().st_size
        total += size
        print(f"{p.name:14} {size / 1024:8.1f} KB  sha256 {hashlib.sha256(p.read_bytes()).hexdigest()[:12]}")
    print(f"{'total':14} {total / 1024:8.1f} KB   tokens {len(tokens)}  particles {len(u)}")
    print("top tokens:", " ".join(tokens[:24]))

    if "--preview" in sys.argv:
        preview(rects, atlas, u, v, tok, tone, aspect, Path(__file__).parent / "preview.png")
        print("preview written")


if __name__ == "__main__":
    main()
