import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import vo from "./vo.json";
import rects from "./rects.json";

const { fontFamily: SANS } = loadSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const FPS30 = 30;
const C = {
  bg: "#f7f4ee",
  panel: "#fdfbf7",
  raised: "#efe9df",
  ink: "#1f1b16",
  sec: "#5e554a",
  muted: "#7b7266",
  line: "rgba(31,27,22,0.12)",
  red: "#b42318",
  green: "#16794a",
  mark: "#f6dfa6",
};
const ease = Easing.bezier(0.22, 1, 0.36, 1);

type Id = "audience" | "problem" | "purpose" | "demo" | "payoff";
const V = vo as Record<Id, { seconds: number; text: string }>;
// Each scene lasts its narration plus a beat; the demo and the ending get room for visuals.
const PAD: Record<Id, number> = { audience: 0.3, problem: 0.4, purpose: 0.3, demo: 1.1, payoff: 1.5 };
const TRANSITION = 10;
const ORDER: Id[] = ["audience", "problem", "purpose", "demo", "payoff"];
const LEN = Object.fromEntries(
  ORDER.map((id) => [id, Math.round((V[id].seconds + PAD[id]) * FPS30)]),
) as Record<Id, number>;
export const TOTAL30 =
  ORDER.reduce((s, id) => s + LEN[id], 0) - TRANSITION * (ORDER.length - 1);

// ---------- small building blocks ----------

const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function useP(delay: number, dur = 14) {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, dur], [0, 1], {
    ...clampOpts,
    easing: ease,
  });
}

const In: React.FC<{
  d?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ d = 0, y = 28, children, style }) => {
  const p = useP(d);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Pop: React.FC<{
  d: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ d, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: f - d,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  return (
    <div
      style={{
        opacity: Math.min(1, s * 2),
        transform: `scale(${0.6 + 0.4 * s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Scene: React.FC<{ children: React.ReactNode; center?: boolean }> = ({
  children,
  center,
}) => (
  <AbsoluteFill
    style={{
      background: C.bg,
      fontFamily: SANS,
      color: C.ink,
      padding: "110px 150px 190px",
      justifyContent: "center",
      alignItems: center ? "center" : "flex-start",
      textAlign: center ? "center" : "left",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <In>
    <div
      style={{
        fontFamily: MONO,
        fontSize: 30,
        color: C.muted,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </div>
  </In>
);

// Subtitles: the line split into short phrases, timed by length.
const Caption: React.FC<{ id: Id }> = ({ id }) => {
  const f = useCurrentFrame();
  const { text, seconds } = V[id];
  const parts = text
    .match(/[^.?!,]+[.?!,]?/g)!
    .map((s) => s.trim())
    .filter(Boolean);
  const total = parts.reduce((s, p) => s + p.length, 0);
  let t = 0;
  let cur = parts[parts.length - 1];
  for (const p of parts) {
    const len = (p.length / total) * seconds;
    if (f / FPS30 < t + len) {
      cur = p;
      break;
    }
    t += len;
  }
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 60,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.3,
          color: C.panel,
          background: "rgba(31,27,22,0.88)",
          padding: "12px 28px",
          borderRadius: 14,
          maxWidth: 1400,
          textAlign: "center",
        }}
      >
        {cur}
      </div>
    </AbsoluteFill>
  );
};

// ---------- scenes ----------

const Audience: React.FC = () => (
  <Scene>
    <Kicker>HouseX · for Orange County</Kicker>
    <In d={4}>
      <div
        style={{
          fontSize: 132,
          fontWeight: 500,
          letterSpacing: "-0.035em",
          lineHeight: 1.02,
          marginTop: 20,
        }}
      >
        Building in
        <br />
        Orange County?
      </div>
    </In>
    <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
      {["Builders", "Architects", "Developers"].map((t, i) => (
        <Pop key={t} d={6 + i * 14}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 500,
              padding: "14px 30px",
              borderRadius: 40,
              background: C.ink,
              color: C.panel,
            }}
          >
            {t}
          </div>
        </Pop>
      ))}
    </div>
  </Scene>
);

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const years = interpolate(f, [6, 50], [0, 4], { ...clampOpts, easing: ease });
  const extra = interpolate(f, [86, 130], [0, 1], {
    ...clampOpts,
    easing: ease,
  });
  return (
    <Scene>
      <In>
        <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
          <span
            style={{
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: 168,
              letterSpacing: "-0.04em",
            }}
          >
            {Math.floor(years)}+
          </span>
          <span style={{ fontSize: 64, fontWeight: 500 }}>
            years from land to keys
          </span>
        </div>
      </In>
      {/* timeline: four years, then the delay one missing document adds */}
      <div
        style={{ position: "relative", width: 1500, height: 64, marginTop: 36 }}
      >
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 0,
            height: 12,
            width: (years / 4) * 1200,
            background: C.ink,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 1200,
            height: 12,
            width: extra * 300,
            background: C.red,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1220,
            top: -34,
            fontFamily: MONO,
            fontSize: 30,
            color: C.red,
            opacity: extra,
          }}
        >
          + months
        </div>
        {[0, 1, 2, 3, 4].map((y) => (
          <div
            key={y}
            style={{
              position: "absolute",
              left: y * 300 - 1,
              top: 14,
              width: 2,
              height: 36,
              background: C.muted,
              opacity: years >= y ? 1 : 0.2,
            }}
          />
        ))}
      </div>
      <In d={78} style={{ marginTop: 48 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
          }}
        >
          <span style={{ color: C.red }}>1 missing document</span> could delay a
          project
          <br />
          by months, and cause real financial losses
        </div>
      </In>
    </Scene>
  );
};

const Purpose: React.FC = () => {
  const f = useCurrentFrame();
  const mark = interpolate(f, [52, 72], [0, 100], {
    ...clampOpts,
    easing: ease,
  });
  return (
    <Scene>
      <Kicker>What HouseX does</Kicker>
      <In d={4}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            marginTop: 24,
            maxWidth: 1550,
          }}
        >
          Checks your plan set against Irvine&rsquo;s permit rules,{" "}
          <span style={{ position: "relative", whiteSpace: "nowrap" }}>
            <span
              style={{
                position: "absolute",
                left: -8,
                right: -8,
                bottom: 6,
                height: "42%",
                background: C.mark,
                zIndex: -1,
                clipPath: `inset(0 ${100 - mark}% 0 0)`,
              }}
            />
            before you submit
          </span>
        </div>
      </In>
    </Scene>
  );
};

// Quick-cut demo: real screens in a browser frame, each with a short label chip.
type Shot = {
  name: string;
  zoom: [number, number];
  chip: string;
  weight: number;
};
const SHOTS: Shot[] = [
  {
    name: "03-loaded",
    zoom: [1.0, 1.15],
    chip: "Address + plans",
    weight: 1.2,
  },
  {
    name: "04-running",
    zoom: [1.1, 1.25],
    chip: "Under 2 minutes",
    weight: 0.9,
  },
  {
    name: "05-report",
    zoom: [1.0, 1.18],
    chip: "23 missing documents · 12 code conflicts",
    weight: 1.6,
  },
  {
    name: "07-fees",
    zoom: [1.05, 1.3],
    chip: "Missing documents, by type",
    weight: 1.2,
  },
  {
    name: "08-correction",
    zoom: [1.05, 1.22],
    chip: "Every finding linked to its source",
    weight: 1.6,
  },
];

const Shot: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const W = 1500;
  const H = 844;
  const b = (rects as Record<string, number[]>)[shot.name];
  const [fx, fy] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  const s = (W / 1920) * interpolate(t, [0, 1], shot.zoom);
  const lim = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));
  const left = lim(
    interpolate(t, [0, 1], [fx * (W / 1920), W / 2]) - fx * s,
    W - 1920 * s,
    0,
  );
  const top = lim(
    interpolate(t, [0, 1], [fy * (W / 1920), H / 2]) - fy * s,
    H - 1080 * s,
    0,
  );
  const box = interpolate(f, [5, 13], [0, 1], clampOpts);
  return (
    <AbsoluteFill
      style={{ background: C.bg, alignItems: "center", paddingTop: 36 }}
    >
      <div
        style={{
          width: W,
          height: H + 46,
          borderRadius: 18,
          overflow: "hidden",
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 30px 80px rgba(31,27,22,0.20)",
        }}
      >
        <div
          style={{
            height: 46,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 20px",
            background: C.raised,
          }}
        >
          {["#e5484d", "#f5b83d", "#4cc38a"].map((c) => (
            <span
              key={c}
              style={{ width: 13, height: 13, borderRadius: 7, background: c }}
            />
          ))}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 18,
              color: C.muted,
              marginLeft: 16,
            }}
          >
            HouseX
          </span>
        </div>
        <div
          style={{
            width: W,
            height: H,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 1920,
              height: 1080,
              left,
              top,
              transformOrigin: "0 0",
              transform: `scale(${s})`,
            }}
          >
            <Img
              src={staticFile(`${shot.name}.png`)}
              style={{ width: 1920, height: 1080 }}
            />
            <div
              style={{
                position: "absolute",
                left: b[0] - 12,
                top: b[1] - 12,
                width: b[2] - b[0] + 24,
                height: b[3] - b[1] + 24,
                border: `5px solid ${C.red}`,
                borderRadius: 14,
                opacity: box,
                transform: `scale(${1.06 - 0.06 * box})`,
              }}
            />
          </div>
        </div>
      </div>
      <Pop
        d={3}
        style={{ position: "absolute", left: 210 + 24, top: 36 + 46 + 24 }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 34,
            padding: "10px 22px",
            borderRadius: 30,
            background: C.ink,
            color: C.panel,
            boxShadow: "0 10px 30px rgba(31,27,22,0.25)",
          }}
        >
          {shot.chip}
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

const Demo: React.FC<{ frames: number }> = ({ frames }) => {
  const sum = SHOTS.reduce((s, x) => s + x.weight, 0);
  let acc = 0;
  return (
    <AbsoluteFill>
      {SHOTS.map((shot) => {
        const from = Math.round((acc / sum) * frames);
        acc += shot.weight;
        const dur = Math.round((acc / sum) * frames) - from;
        return (
          <Sequence
            key={shot.name}
            from={from}
            durationInFrames={dur}
            name={shot.chip}
          >
            <Shot shot={shot} dur={dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Payoff: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  const end = interpolate(f, [frames - 50, frames - 34], [0, 1], {
    ...clampOpts,
    easing: ease,
  });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Scene>
        <div style={{ opacity: 1 - end }}>
          {[
            "Fewer correction rounds.",
            "Fewer months of loan interest.",
            "Fewer consulting fees.",
          ].map(
            (t, i) => (
              <In key={t} d={[2, 32, 74][i]}>
                <div
                  style={{
                    fontSize: 92,
                    fontWeight: 500,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.1,
                  }}
                >
                  {t}
                </div>
              </In>
            ),
          )}
          <In d={100} style={{ marginTop: 36 }}>
            <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted }}>
              A $1M construction loan at 10% costs{" "}
              <span style={{ color: C.green }}>$8,333</span> a month (team
              assumption)
            </div>
          </In>
        </div>
      </Scene>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: end,
          fontFamily: SANS,
          color: C.ink,
        }}
      >
        <div
          style={{
            fontSize: 168,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            transform: `scale(${0.94 + 0.06 * end})`,
          }}
        >
          HouseX
        </div>
        <div style={{ fontSize: 44, color: C.sec, marginTop: 12 }}>
          Find every correction before the city does
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 28,
            color: C.muted,
            marginTop: 36,
          }}
        >
          github.com/joyzhang14-14/HouseX
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

const BODY: Record<Id, React.FC<{ frames: number }>> = {
  audience: Audience,
  problem: Problem,
  purpose: Purpose,
  demo: Demo,
  payoff: Payoff,
};

export const HouseX30: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <TransitionSeries>
      {ORDER.flatMap((id, i) => {
        const Body = BODY[id];
        const seq = (
          <TransitionSeries.Sequence
            key={id}
            name={id}
            durationInFrames={LEN[id]}
          >
            <Body frames={LEN[id]} />
            <Audio src={staticFile(`vo/${id}.wav`)} />
            <Caption id={id} />
          </TransitionSeries.Sequence>
        );
        if (i === ORDER.length - 1) return [seq];
        const presentation =
          id === "purpose" || id === "audience"
            ? slide({ direction: "from-right" })
            : fade();
        return [
          seq,
          <TransitionSeries.Transition
            key={`${id}-t`}
            presentation={presentation}
            timing={
              id === "audience"
                ? springTiming({
                    config: { damping: 200 },
                    durationInFrames: TRANSITION,
                  })
                : linearTiming({ durationInFrames: TRANSITION })
            }
          />,
        ];
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
