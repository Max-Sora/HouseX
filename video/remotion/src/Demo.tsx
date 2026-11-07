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
import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import narration from "./narration.json";
import rects from "./rects.json";

const { fontFamily: SANS } = loadSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const FPS = 30;
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
};

type SegKey = "1" | "2" | "3" | "4" | "5" | "6" | "7";
const N = narration as Record<SegKey, { audio: number; text: string }>;
// Scene length = narration + a short breath; the demo gets extra room for the screens.
const EXTRA: Record<SegKey, number> = {
  "1": 1.3,
  "2": 0.8,
  "3": 0.9,
  "4": 3.2,
  "5": 0.8,
  "6": 0.8,
  "7": 2.4,
};
export const SCENES = (["1", "2", "3", "4", "5", "6", "7"] as SegKey[]).map(
  (k) => ({
    key: k,
    frames: Math.round((N[k].audio + EXTRA[k]) * FPS),
  }),
);
export const TOTAL = SCENES.reduce((s, x) => s + x.frames, 0);

// ---------- helpers ----------

const ease = Easing.bezier(0.22, 1, 0.36, 1);

function useIn(delay = 0, dur = 18) {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

const Rise: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Count: React.FC<{
  to: number;
  delay?: number;
  dur?: number;
  prefix?: string;
  suffix?: string;
}> = ({ to, delay = 0, dur = 30, prefix = "", suffix = "" }) => {
  const p = useIn(delay, dur);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {Math.round(to * p).toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Rise>
    <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted }}>
      {children}
    </div>
  </Rise>
);

const Card: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => (
  <Rise delay={delay} style={{ flex: 1 }}>
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: 40,
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  </Rise>
);

const Big: React.FC<{ color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  color = C.ink,
  style,
  children,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 68,
      lineHeight: 1.1,
      color,
      ...style,
    }}
  >
    {children}
  </div>
);
const Small: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 30, lineHeight: 1.4, color: C.sec, marginTop: 16 }}>
    {children}
  </div>
);

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      padding: "120px 160px 200px",
      justifyContent: "center",
      fontFamily: SANS,
      color: C.ink,
    }}
  >
    {children}
  </AbsoluteFill>
);

const H: React.FC<{
  delay?: number;
  size?: number;
  children: React.ReactNode;
}> = ({ delay = 4, size = 76, children }) => (
  <Rise delay={delay}>
    <div
      style={{
        fontSize: size,
        lineHeight: 1.08,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        marginTop: 20,
        maxWidth: 1500,
      }}
    >
      {children}
    </div>
  </Rise>
);

const Stamp: React.FC<{ delay?: number; size?: number }> = ({
  delay = 0,
  size = 72,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: f - delay,
    fps,
    config: { damping: 11, stiffness: 160 },
  });
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "0.08em",
        color: C.red,
        border: `${size / 12}px solid ${C.red}`,
        borderRadius: 10,
        padding: `${size / 6}px ${size / 2.6}px`,
        opacity: Math.min(1, s * 1.5),
        transform: `rotate(-4deg) scale(${interpolate(s, [0, 1], [2.2, 1])})`,
      }}
    >
      FAIL
    </span>
  );
};

// Subtitles: the narration split into sentences, timed by length.
const Subtitles: React.FC<{ text: string; audio: number }> = ({
  text,
  audio,
}) => {
  const f = useCurrentFrame();
  const parts = text
    .match(/[^.?!]+[.?!]?/g)!
    .map((s) => s.trim())
    .filter(Boolean);
  const total = parts.reduce((s, p) => s + p.length, 0);
  let t = 0;
  const now = f / FPS;
  let current = parts[parts.length - 1];
  for (const p of parts) {
    const len = (p.length / total) * audio;
    if (now < t + len) {
      current = p;
      break;
    }
    t += len;
  }
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 56,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 34,
          lineHeight: 1.35,
          color: "#fdfbf7",
          background: "rgba(31,27,22,0.86)",
          padding: "14px 28px",
          borderRadius: 12,
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {current}
      </div>
    </AbsoluteFill>
  );
};

// ---------- scenes ----------

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 14 } });
  return (
    <Stage>
      <Kicker>
        Claude Impact Lab · UCI × SoCal Affordable Housing · Lane 2: Clear it
      </Kicker>
      <div
        style={{
          fontSize: 168,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          marginTop: 24,
          opacity: s,
          transform: `translateY(${(1 - s) * 40}px)`,
        }}
      >
        HouseX
      </div>
      <Rise delay={22}>
        <div style={{ fontSize: 44, color: C.sec, marginTop: 24 }}>
          Find every correction before the city does
        </div>
      </Rise>
      <Rise delay={34}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 28,
            color: C.muted,
            marginTop: 48,
          }}
        >
          Team HouseX
        </div>
      </Rise>
    </Stage>
  );
};

const Problem: React.FC = () => (
  <Stage>
    <Kicker>The problem</Kicker>
    <H>
      About four years from land to keys, and every month of waiting adds cost
    </H>
    <div style={{ display: "flex", gap: 32, marginTop: 64 }}>
      <Card delay={40}>
        <Big>
          ~<Count to={4} delay={40} dur={24} /> years
        </Big>
        <Small>from finding land to handing over keys</Small>
      </Card>
      <Card delay={150}>
        <Big>
          <Count to={34} delay={150} /> cities
        </Big>
        <Small>in Orange County, each with its own checklist</Small>
      </Card>
      <Card delay={250} style={{ borderColor: C.red }}>
        <Big color={C.red}>1 document</Big>
        <Small>missing sends a permit application back as incomplete</Small>
      </Card>
    </div>
  </Stage>
);

const Purpose: React.FC = () => {
  const f = useCurrentFrame();
  const words =
    "Tells a small builder or nonprofit everything an Irvine plan set is missing, before they submit".split(
      " ",
    );
  return (
    <Stage>
      <Kicker>What HouseX does</Kicker>
      <div
        style={{
          fontSize: 80,
          lineHeight: 1.1,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          marginTop: 24,
          maxWidth: 1550,
        }}
      >
        {words.map((w, i) => {
          const p = interpolate(f - 4 - i * 3.2, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span key={i} style={{ opacity: 0.12 + p * 0.88 }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
      <Rise delay={70}>
        <div style={{ fontSize: 38, color: C.sec, marginTop: 40 }}>
          Address + plan PDF in. Missing documents, rule conflicts and a drafted
          fix out, each with its source.
        </div>
      </Rise>
    </Stage>
  );
};

// One screenshot inside a browser frame, with a slow push toward a focus point and an optional highlight box.
type Shot = {
  src: string;
  from: number;
  to: number;
  zoom: [number, number];
  focus: [number, number];
  box?: [number, number, number, number];
  label: string;
};

const Browser: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const dur = shot.to - shot.from;
  const t = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const fade = interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boxIn = interpolate(f, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const W = 1440;
  const Hh = 810;
  // Scale the 1920×1080 screenshot, then slide so the focus point drifts toward the window center,
  // never showing past the screenshot's edges.
  const s = (W / 1920) * interpolate(t, [0, 1], shot.zoom);
  const [fx, fy] = shot.focus;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const left = clamp(interpolate(t, [0, 1], [fx * (W / 1920), W / 2]) - fx * s, W - 1920 * s, 0);
  const top = clamp(interpolate(t, [0, 1], [fy * (W / 1920), Hh / 2]) - fy * s, Hh - 1080 * s, 0);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 40, opacity: fade }}>
      <div
        style={{
          width: W,
          height: Hh + 48,
          borderRadius: 16,
          overflow: "hidden",
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 64px rgba(31,27,22,0.18)",
        }}
      >
        <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: C.raised }}>
          {["#e5484d", "#f5b83d", "#4cc38a"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <span style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginLeft: 16 }}>localhost:3000</span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: MONO,
              fontSize: 22,
              color: C.ink,
              opacity: interpolate(f, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            Live demo · {shot.label}
          </span>
        </div>
        <div style={{ width: W, height: Hh, overflow: "hidden", position: "relative" }}>
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
            <Img src={staticFile(shot.src)} style={{ width: 1920, height: 1080 }} />
            {shot.box && (
              <div
                style={{
                  position: "absolute",
                  left: shot.box[0] - 12,
                  top: shot.box[1] - 12,
                  width: shot.box[2] - shot.box[0] + 24,
                  height: shot.box[3] - shot.box[1] + 24,
                  border: `5px solid ${C.red}`,
                  borderRadius: 14,
                  opacity: boxIn,
                  transform: `scale(${interpolate(boxIn, [0, 1], [1.06, 1])})`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Demo: React.FC<{ frames: number }> = ({ frames }) => {
  // Boxes are where each key element sat in its screenshot, measured during capture.
  const R = rects as Record<string, number[]>;
  const at = (name: string, zoom: [number, number], label: string): Omit<Shot, "from" | "to"> => {
    const b = R[name] as [number, number, number, number];
    return { src: `${name}.png`, zoom, label, box: b, focus: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] };
  };
  const raw = [
    at("02-address", [1.0, 1.3], "1 · Type the address"),
    at("03-loaded", [1.05, 1.3], "2 · Load a real duplex plan set"),
    at("04-running", [1.1, 1.35], "3 · Run the check"),
    at("05-report", [1.0, 1.2], "4 · FAIL: 23 missing, 12 corrections"),
    at("07-fees", [1.05, 1.35], "5 · Filter missing documents by Fees"),
    at("08-correction", [1.05, 1.25], "6 · Every correction links to its source"),
  ];
  const weights = [1, 1, 0.8, 1.3, 1.1, 1.3];
  const sum = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const shots: Shot[] = raw.map((r, i) => {
    const from = Math.round((acc / sum) * frames);
    acc += weights[i];
    const to = Math.round((acc / sum) * frames);
    return { ...r, from, to };
  });
  return (
    <AbsoluteFill>
      {shots.map((s) => (
        <Sequence key={s.src} from={s.from} durationInFrames={s.to - s.from}>
          <Browser shot={s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Arrow: React.FC<{ delay: number }> = ({ delay }) => {
  const p = useIn(delay, 16);
  return (
    <div style={{ width: 90, display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 70 * p,
          height: 4,
          background: C.muted,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -2,
            top: -8,
            borderLeft: `14px solid ${C.muted}`,
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            opacity: p,
          }}
        />
      </div>
    </div>
  );
};

const AiSystem: React.FC = () => (
  <Stage>
    <Kicker>The AI system</Kicker>
    <H>The AI reads. A rule engine decides.</H>
    <div style={{ display: "flex", alignItems: "stretch", marginTop: 64 }}>
      <Card delay={20}>
        <div style={{ fontSize: 44, fontWeight: 500 }}>
          Claude reads the plans
        </div>
        <Small>Reports only what is printed, with the sheet as evidence</Small>
        <Rise delay={70}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              color: C.muted,
              marginTop: 24,
              background: C.raised,
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            A-100: “2022 CALIFORNIA ENERGY CODE”
          </div>
        </Rise>
      </Card>
      <Arrow delay={115} />
      <Card delay={120}>
        <div style={{ fontSize: 44, fontWeight: 500 }}>Rule engine decides</div>
        <Small>
          Plain code makes every pass/fail call. The AI never decides
        </Small>
        <Rise delay={170}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              marginTop: 24,
              display: "flex",
              gap: 16,
            }}
          >
            <span style={{ color: C.red }}>2022 ≠ 2025 → correction</span>
          </div>
        </Rise>
      </Card>
      <Arrow delay={235} />
      <Card delay={240}>
        <div style={{ fontSize: 44, fontWeight: 500 }}>
          Every rule is sourced
        </div>
        <Small>Linked to Irvine&rsquo;s or the state&rsquo;s own page</Small>
        <Rise delay={280}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              color: C.sec,
              marginTop: 24,
              textDecoration: "underline",
            }}
          >
            energy.ca.gov · 2025 Energy Code
          </div>
        </Rise>
      </Card>
    </div>
  </Stage>
);

const Result: React.FC = () => {
  const f = useCurrentFrame();
  const strike = interpolate(f, [230, 250], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Stage>
      <Kicker>The result</Kicker>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 64,
          marginTop: 40,
        }}
      >
        <Stamp delay={8} />
        <Rise delay={20}>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              maxWidth: 1250,
            }}
          >
            A duplex approved by Fresno County in 2024 fails in Irvine
          </div>
        </Rise>
      </div>
      <div style={{ display: "flex", gap: 32, marginTop: 64 }}>
        <Card delay={90}>
          <Big color={C.red}>
            <Count to={12} delay={90} />
          </Big>
          <Small>concrete corrections</Small>
        </Card>
        <Card delay={150}>
          <Big color={C.red}>
            <Count to={23} delay={150} />
          </Big>
          <Small>missing documents, grouped by type</Small>
        </Card>
        <Card delay={220}>
          <Big style={{ fontSize: 54, whiteSpace: "nowrap" }}>
            <span style={{ position: "relative", color: C.muted }}>
              2022
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "52%",
                  height: 6,
                  width: `${strike}%`,
                  background: C.red,
                }}
              />
            </span>{" "}
            → 2025
          </Big>
          <Small>code editions: Irvine now requires 2025</Small>
        </Card>
        <Card delay={330}>
          <Big color={C.green}>&lt; 2 min</Big>
          <Small>to find them, instead of a city correction round</Small>
        </Card>
      </div>
    </Stage>
  );
};

const Return: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  const fill = interpolate(f, [150, 210], [0, 85 / 535], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const end = interpolate(f, [frames - 75, frames - 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Stage>
        <div style={{ opacity: 1 - end }}>
          <Kicker>Expected return</Kicker>
          <H>Fewer correction rounds, fewer months of loan interest</H>
          <div style={{ display: "flex", gap: 32, marginTop: 64 }}>
            <Card delay={30}>
              <Big color={C.green}>
                <Count to={8333} delay={30} dur={40} prefix="$" />
              </Big>
              <Small>
                a month on a $1M construction loan at 10% (team assumption)
              </Small>
            </Card>
            <Card delay={150}>
              <Big>$85k of $535k</Big>
              <div
                style={{
                  height: 14,
                  background: C.raised,
                  borderRadius: 7,
                  marginTop: 20,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${fill * 100}%`,
                    background: C.red,
                  }}
                />
              </div>
              <Small>
                is time cost in the challenge brief&rsquo;s example home
              </Small>
            </Card>
            <Card delay={300}>
              <Big>1 rule file</Big>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 20,
                }}
              >
                {Array.from({ length: 34 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: i === 0 ? C.ink : C.raised,
                      border: `1px solid ${C.line}`,
                      opacity: interpolate(
                        f,
                        [310 + i * 2, 318 + i * 2],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                      ),
                    }}
                  />
                ))}
              </div>
              <Small>per new city: the path to all 34 OC cities</Small>
            </Card>
          </div>
        </div>
      </Stage>
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
          style={{ fontSize: 140, fontWeight: 500, letterSpacing: "-0.04em" }}
        >
          HouseX
        </div>
        <div style={{ fontSize: 40, color: C.sec, marginTop: 16 }}>
          Find every correction before the city does
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 28,
            color: C.muted,
            marginTop: 40,
          }}
        >
          github.com/joyzhang14-14/HouseX
        </div>
      </AbsoluteFill>
    </>
  );
};

// ---------- composition ----------

const SCENE: Record<SegKey, React.FC<{ frames: number }>> = {
  "1": Title,
  "2": Problem,
  "3": Purpose,
  "4": Demo,
  "5": AiSystem,
  "6": Result,
  "7": Return,
};

export const HouseXDemo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* faint drafting grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          opacity: 0.35,
        }}
      />
      {SCENES.map((s) => {
        const Scene = SCENE[s.key];
        const seq = (
          <Sequence key={s.key} from={from} durationInFrames={s.frames}>
            <Scene frames={s.frames} />
            <Audio src={staticFile(`seg${s.key}.wav`)} />
            {s.key !== "1" && (
              <Subtitles text={N[s.key].text} audio={N[s.key].audio} />
            )}
          </Sequence>
        );
        from += s.frames;
        return seq;
      })}
    </AbsoluteFill>
  );
};
