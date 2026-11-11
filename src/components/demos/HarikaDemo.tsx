"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * A scripted walk through HARIKA on a small Windows desktop: memory, planning, permissioned
 * tools, and "continue this chat", which drafts a reply and sends nothing without a yes.
 * The real HARIKA is a Windows app; these four runs are pre-written.
 */

type Step = { kind: "memory" | "plan" | "tool" | "ok"; text: string };
type Script = { id: string; ask: string; steps: Step[]; answer: string; effect?: "reminder" | "code" | "chat" };

const SCRIPTS: Script[] = [
  {
    id: "exam",
    ask: "What did I tell you about my exam?",
    steps: [
      { kind: "memory", text: "Searched episodic memory and facts about you" },
      { kind: "ok", text: "Found: DBMS exam, Friday 10 am (you mentioned it on Monday)" },
    ],
    answer: "Your DBMS exam is on Friday at 10 am. Want me to block Thursday evening for revision?",
  },
  {
    id: "remind",
    ask: "Remind me to call Mom at 6",
    steps: [
      { kind: "plan", text: "Understood: a reminder, today at 6:00 pm" },
      { kind: "tool", text: "reminders.create(“Call Mom”, 18:00) · allowed" },
      { kind: "ok", text: "Reminder saved" },
    ],
    answer: "Done. I'll remind you to call Mom at 6:00 pm.",
    effect: "reminder",
  },
  {
    id: "code",
    ask: "Open my portfolio project in VS Code",
    steps: [
      { kind: "plan", text: "Plan: find the folder → open it in VS Code" },
      { kind: "tool", text: "files.search(“Sahaj_Portfolio”) → D:\\Sahaj_Portfolio" },
      { kind: "tool", text: "open_application(“Code”, folder) · allowed" },
      { kind: "ok", text: "VS Code is open on the folder" },
    ],
    answer: "Opened D:\\Sahaj_Portfolio in VS Code.",
    effect: "code",
  },
  {
    id: "chat",
    ask: "Continue this chat: tell Riya I'll be late",
    steps: [
      { kind: "tool", text: "screen_reader: read the visible conversation · allowed" },
      { kind: "plan", text: "Drafting a reply in your usual tone" },
    ],
    answer: "Here's a draft. Send it?",
    effect: "chat",
  },
];

type Run = { script: Script; shown: number; done: boolean };

export function HarikaDemo() {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [typed, setTyped] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [code, setCode] = useState(false);
  const [draft, setDraft] = useState<null | "asking" | "sent" | "cancelled" | "shorter">(null);
  const [chat, setChat] = useState(["Riya: are you coming to the 7 pm show?", "Riya: we're saving you a seat"]);
  const stage = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  // Ctrl + Shift + Space inside the demo opens the command bar, like on Windows.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") setOpen(false);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const start = (s: Script) => {
    clear();
    setOpen(true);
    setTyped(s.ask);
    setRun({ script: s, shown: 0, done: false });
    setDraft(null);
    haptic("light");
    s.steps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setRun((r) => (r ? { ...r, shown: i + 1 } : r)), 650 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        setRun((r) => (r ? { ...r, done: true } : r));
        if (s.effect === "reminder") {
          setToast("Reminder set · Call Mom at 6:00 pm");
          timers.current.push(setTimeout(() => setToast(null), 3200));
        }
        if (s.effect === "code") setCode(true);
        if (s.effect === "chat") setDraft("asking");
        haptic("success");
      }, 650 * (s.steps.length + 1)),
    );
  };

  const draftText = draft === "shorter" ? "Running late, sorry! Be there by 7:20." : "Hey Riya, I'm running about 20 minutes late, sorry! Save me that seat, I'll be there by 7:20.";

  const free = () => {
    const match = SCRIPTS.find((s) => s.ask.toLowerCase().includes(typed.toLowerCase().trim().slice(0, 12)) && typed.trim());
    if (match) return start(match);
    clear();
    setRun({
      script: { id: "free", ask: typed, steps: [], answer: "In this demo I can only run the four examples below. The real HARIKA answers anything, on your Windows PC." },
      shown: 0,
      done: true,
    });
  };

  return (
    <div className="demo harika-demo">
      <div ref={stage} className="hd-stage" tabIndex={-1}>
        <p className="hd-badge">Scripted demo of the Windows app</p>

        {draft && (
          <div className="hd-chat" aria-label="Chat with Riya">
            <p className="hd-chat-head">Riya</p>
            {chat.map((m, i) => <p key={i} className={m.startsWith("You:") ? "me" : ""}>{m.replace(/^(Riya|You): /, "")}</p>)}
          </div>
        )}
        {code && (
          <div className="hd-code" aria-label="VS Code window">
            <p className="hd-code-head"><span />Sahaj_Portfolio — Visual Studio Code</p>
            <pre>{"src/\n  app/page.tsx\n  components/Island.tsx\n  lib/islandGL.ts\n"}</pre>
          </div>
        )}

        {open && (
          <div className="hd-bar" role="dialog" aria-label="Ask HARIKA">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                free();
              }}
            >
              <span className="hd-orb small" aria-hidden="true" />
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ask HARIKA anything…" aria-label="Ask HARIKA" autoFocus />
              <kbd>↵</kbd>
            </form>
            {run && (
              <div className="hd-run" aria-live="polite">
                {run.script.steps.slice(0, run.shown).map((s) => (
                  <p key={s.text} className={`hd-step ${s.kind}`}>
                    <span>{s.kind === "memory" ? "Memory" : s.kind === "plan" ? "Plan" : s.kind === "tool" ? "Tool" : "Done"}</span>
                    {s.text}
                  </p>
                ))}
                {run.done && <p className="hd-answer">{run.script.answer}</p>}
                {run.done && run.script.effect === "chat" && draft && draft !== "sent" && draft !== "cancelled" && (
                  <div className="hd-draft">
                    <p>{draftText}</p>
                    <div>
                      <button type="button" onClick={() => (setChat((c) => [...c, `You: ${draftText}`]), setDraft("sent"), haptic("success"))}>Send it</button>
                      <button type="button" onClick={() => setDraft("shorter")}>Make it shorter</button>
                      <button type="button" onClick={() => setDraft("cancelled")}>No</button>
                    </div>
                  </div>
                )}
                {draft === "sent" && <p className="hd-step ok"><span>Done</span>Sent, because you said yes.</p>}
                {draft === "cancelled" && <p className="hd-step"><span>Done</span>Cancelled. Nothing was sent.</p>}
              </div>
            )}
          </div>
        )}

        {toast && <p className="hd-toast" role="status">{toast}</p>}

        <div className="fd-taskbar">
          <span className="fd-start" aria-hidden="true" />
          <span aria-hidden="true" /><span aria-hidden="true" />
          <button type="button" className="hd-tray" onClick={() => setOpen((o) => !o)} aria-label="Open HARIKA (Ctrl + Shift + Space)">
            <span className="hd-orb" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="demo-side">
        <p className="demo-label">Ask HARIKA</p>
        <p className="demo-hint">Click the orb in the tray, or press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Space</kbd> on the desktop. Then try:</p>
        <div className="demo-buttons stack">
          {SCRIPTS.map((s) => (
            <button key={s.id} type="button" onClick={() => start(s)}>{s.ask}</button>
          ))}
          <button type="button" onClick={() => (clear(), setRun(null), setOpen(false), setCode(false), setDraft(null), setTyped(""), setChat(["Riya: are you coming to the 7 pm show?", "Riya: we're saving you a seat"]))}>Reset</button>
        </div>
        <p className="demo-fine">
          The real HARIKA lives in the Windows tray: layered memory, a planner that checks its own plans, permissioned
          tools, Gmail, Calendar and Spotify, and nothing sent on your behalf without your yes.
        </p>
      </div>
    </div>
  );
}
