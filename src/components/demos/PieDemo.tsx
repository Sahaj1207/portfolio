"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * PIE's idea in a browser sketch: click a word on a "photo" of a receipt, retype it, and it
 * is redrawn in the same type on rebuilt paper, with the rest of the line reflowed. PIE does
 * this on the phone for real PDFs and photos with PDFium and a shared C++ engine.
 */

const W = 560;
const H = 380;
type Style = { font: string; size: number; weight: string; color: string; family: string };
type Line = { y: number; x: number; style: Style; words: string[] };

const mono: Style = { family: "Courier New", font: '"Courier New", Courier, monospace', size: 18, weight: "400", color: "#2f2b26" };
const head: Style = { family: "Georgia", font: "Georgia, serif", size: 30, weight: "700", color: "#1f1c18" };
const small: Style = { family: "Georgia", font: "Georgia, serif", size: 15, weight: "400", color: "#5a544b" };

const ORIGINAL: Line[] = [
  { y: 64, x: 70, style: head, words: ["City", "Bakery"] },
  { y: 92, x: 70, style: small, words: ["14", "Market", "Road,", "Belagavi"] },
  { y: 150, x: 70, style: mono, words: ["Sourdough", "loaf", "....", "₹180"] },
  { y: 182, x: 70, style: mono, words: ["Croissant", "x2", "......", "₹160"] },
  { y: 214, x: 70, style: mono, words: ["Filter", "coffee", "....", "₹60"] },
  { y: 262, x: 70, style: mono, words: ["Total", "..........", "₹400"] },
  { y: 318, x: 70, style: small, words: ["Thank", "you", "for", "visiting!"] },
];

const fontOf = (s: Style) => `${s.weight} ${s.size}px ${s.font}`;

/** Deterministic paper: warm base, soft light falloff, fine grain. */
function paintPaper(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(W * 0.4, H * 0.3, 40, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, "#f7f2e8");
  g.addColorStop(1, "#e4dccd");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const img = ctx.getImageData(0, 0, W, H);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = ((seed / 2147483647) - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

type Box = { line: number; word: number; x: number; y: number; w: number; h: number };

export function PieDemo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const paper = useRef<HTMLCanvasElement | null>(null);
  const [lines, setLines] = useState<Line[]>(ORIGINAL);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [editing, setEditing] = useState<Box | null>(null);
  const [value, setValue] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);

  const draw = useCallback((ls: Line[], highlight?: Box | null) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    if (!paper.current) {
      paper.current = document.createElement("canvas");
      paper.current.width = W;
      paper.current.height = H;
      paintPaper(paper.current.getContext("2d")!);
    }
    ctx.drawImage(paper.current, 0, 0);
    const out: Box[] = [];
    ls.forEach((line, li) => {
      ctx.font = fontOf(line.style);
      ctx.fillStyle = line.style.color;
      ctx.textBaseline = "alphabetic";
      const space = ctx.measureText(" ").width;
      let x = line.x;
      line.words.forEach((word, wi) => {
        const w = ctx.measureText(word).width;
        ctx.fillText(word, x, line.y);
        out.push({ line: li, word: wi, x: x - 3, y: line.y - line.style.size, w: w + 6, h: line.style.size * 1.3 });
        x += w + space;
      });
    });
    if (highlight) {
      ctx.strokeStyle = "#2d55c8";
      ctx.lineWidth = 2;
      ctx.strokeRect(highlight.x, highlight.y, highlight.w, highlight.h);
    }
    setBoxes(out);
  }, []);

  useEffect(() => {
    draw(showOriginal ? ORIGINAL : lines, editing);
  }, [draw, lines, editing, showOriginal]);

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (showOriginal) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const hit = boxes.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (!hit) return;
    // Keep the browser from moving focus off the editor that's about to open.
    e.preventDefault();
    const style = lines[hit.line].style;
    haptic("tick");
    setEditing(hit);
    setValue(lines[hit.line].words[hit.word]);
    setSteps([`Found “${lines[hit.line].words[hit.word]}” · ${style.family} ${style.size}px · ${style.color}`]);
  };

  const commit = () => {
    if (!editing) return;
    const next = value.trim();
    const old = lines[editing.line].words[editing.word];
    setEditing(null);
    if (!next || next === old) {
      setSteps([]);
      return;
    }
    const style = lines[editing.line].style;
    setLines((ls) => ls.map((l, i) => (i === editing.line ? { ...l, words: l.words.map((w, j) => (j === editing.word ? next : w)) } : l)));
    setSteps([
      `Found “${old}” · ${style.family} ${style.size}px · ${style.color}`,
      "Rebuilt the paper behind the line, with no generative fill",
      `Drew “${next}” in the same type and reflowed the line`,
    ]);
    haptic("success");
  };

  // The editor sits exactly over the word, in the word's own font, scaled with the canvas.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const style = editing ? lines[editing.line].style : null;

  return (
    <div className="demo pie-demo">
      <div className="pie-stage">
        <div className="pie-photo">
          <canvas ref={canvas} width={W} height={H} onPointerDown={pick} aria-label="A photo of a bakery receipt. Click a word to edit it." />
          {editing && style && (
            <input
              autoFocus
              className="pie-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") (setEditing(null), setSteps([]));
              }}
              aria-label="New text"
              spellCheck={false}
              style={{
                left: editing.x * scale,
                top: editing.y * scale,
                minWidth: editing.w * scale,
                height: editing.h * scale,
                font: `${style.weight} ${style.size * scale}px ${style.font}`,
                color: style.color,
              }}
            />
          )}
        </div>
      </div>
      <div className="demo-side">
        <p className="demo-label">Try it</p>
        <p className="demo-hint">Click any word on the receipt, type a replacement and press Enter.</p>
        <ol className="pie-steps" aria-live="polite">
          {steps.length === 0 ? <li className="idle">Waiting for a word…</li> : steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <div className="demo-buttons">
          <button type="button" aria-pressed={showOriginal} onClick={() => setShowOriginal((v) => !v)}>
            {showOriginal ? "Show edited" : "Compare with original"}
          </button>
          <button type="button" onClick={() => (setLines(ORIGINAL), setSteps([]), setEditing(null))}>Reset</button>
        </div>
        <p className="demo-fine">
          A browser sketch of the idea. The real PIE does this on your phone, offline, for PDFs and photos, matching
          fonts and rebuilding backgrounds with PDFium and a shared C++ engine.
        </p>
      </div>
    </div>
  );
}
