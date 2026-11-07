"use client";

import { useEffect, useState } from "react";
import styles from "./wait.module.css";

// Shown while a long request runs. The server answers once at the end, so steps advance on a timer
// matched to how long each stage usually takes; the last step stays active until the answer arrives.
export type WaitStep = { label: string; at: number };

const FACTS = [
  "Irvine requires fire sprinklers in all new residential buildings.",
  "In Irvine, every new roof must be Class A fire-rated.",
  "Irvine requires outside wiring on private property to run underground.",
  "New homes must divert 75% of concrete and asphalt and 65% of other construction waste.",
  "Irvine's plan review clock doesn't start until the review fees are paid.",
  "A school fee certificate is needed before Irvine issues a building permit.",
  "State law caps ADU side and rear setbacks at 4 feet.",
  "Cities must say whether an ADU application is complete within 15 business days.",
];

export default function WaitPanel({
  title,
  steps,
  typical,
}: {
  title: string;
  steps: WaitStep[];
  typical: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(t);
  }, []);

  const current = steps.reduce((i, s, n) => (elapsed >= s.at ? n : i), 0);
  const progress = 95 * (1 - Math.exp(-elapsed / 40));
  const fact = FACTS[Math.floor(elapsed / 7) % FACTS.length];
  const mm = Math.floor(elapsed / 60);
  const ss = String(Math.floor(elapsed % 60)).padStart(2, "0");

  return (
    <div className={styles.panel} role="status" aria-live="polite">
      <div className={styles.top}>
        <div className={styles.sheet} aria-hidden="true">
          <svg viewBox="0 0 120 84" className={styles.plan}>
            <rect x="2" y="2" width="116" height="80" rx="3" />
            <path d="M14 14h56v40H14z M70 14h36v26H70z M70 40h36v14H70z M14 54h40v18H14z M54 54h52v18H54z" />
            <path
              d="M40 14v12 M70 30h-8 M88 40v-6 M30 54v8 M78 54v6"
              className={styles.thin}
            />
            <rect
              x="96"
              y="66"
              width="16"
              height="10"
              className={styles.titleBlock}
            />
          </svg>
          <span className={styles.scan} />
        </div>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.meta}>
            {mm}:{ss} · usually {typical}
          </p>
        </div>
      </div>

      <div className={styles.bar}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className={styles.steps}>
        {steps.map((s, i) => {
          const state =
            i < current ? "done" : i === current ? "active" : "todo";
          return (
            <li key={s.label} className={styles[state]}>
              <span className={styles.mark} aria-hidden="true">
                {state === "done" ? "✓" : ""}
              </span>
              {s.label}
              {state === "active" && (
                <span className={styles.dots} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      <p key={fact} className={styles.fact}>
        <span>While you wait</span> {fact}
      </p>
    </div>
  );
}
