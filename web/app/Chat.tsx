"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "./Store";
import styles from "./chat.module.css";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What documents does a new duplex need in Irvine?",
  "What are the ADU setback limits?",
  "Why did my plan fail?",
  "How is the cost benefit calculated?",
];

// Minimal formatting for answers: **bold**, [links](url) and "- " list lines. Built as React nodes, never raw HTML.
function inline(text: string, key: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  return parts.map((p, i) => {
    const bold = p.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={`${key}-${i}`}>{bold[1]}</strong>;
    const link = p.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link)
      return (
        <a key={`${key}-${i}`} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    return p;
  });
}

function Formatted({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length)
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {list.map((l, i) => (
            <li key={i}>{inline(l, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      );
    list = [];
  };
  text.split("\n").forEach((line, i) => {
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) return list.push(item[1]);
    flush();
    if (line.trim())
      blocks.push(<p key={`p-${i}`}>{inline(line, `p-${i}`)}</p>);
  });
  flush();
  return <>{blocks}</>;
}

export default function Chat() {
  const { report } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, report }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content: "Sorry, the assistant is unavailable right now.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Ask HouseX">
          <div className={styles.head}>
            <div>
              <strong>Ask HouseX</strong>
              <span>
                Answers from Irvine&rsquo;s rules
                {report ? " and your report" : ""}, with sources
              </span>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className={styles.list} ref={listRef}>
            {messages.length === 0 && (
              <div className={styles.starters}>
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? styles.user : styles.bot}
              >
                {m.role === "assistant" && !m.content ? (
                  <span className={styles.typing}>Thinking…</span>
                ) : m.role === "assistant" ? (
                  <Formatted text={m.content} />
                ) : (
                  m.content
                )}
              </div>
            ))}
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={4000}
              placeholder="Ask about permits, rules or your report"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
          <p className={styles.note}>
            Not legal advice. Confirm with the City of Irvine before you rely on
            an answer
          </p>
        </div>
      )}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Ask HouseX a question"}
      >
        {open ? "Close" : "Ask a question"}
      </button>
    </>
  );
}
