"use client";

import { useState } from "react";
import type { Finding, FindingKind, Report, RuleSet } from "@/lib/types";
import Requirements from "./Requirements";
import styles from "./page.module.css";

type District = { code: string; name: string; allows: string[] };

const SECTIONS: { kind: FindingKind; title: string; blurb: string }[] = [
  {
    kind: "missing_document",
    title: "Missing documents",
    blurb: "Without these the city marks the application incomplete",
  },
  {
    kind: "violation",
    title: "Corrections needed",
    blurb: "The plans conflict with a written rule",
  },
  {
    kind: "unknown",
    title: "Not stated or not checked",
    blurb: "The plans don't say, or the rule isn't confirmed yet",
  },
  {
    kind: "needs_human",
    title: "Needs a human plan checker",
    blurb: "Flagged for a licensed plan checker, never decided here",
  },
  { kind: "passed", title: "Passed", blurb: "Meets the rule as written" },
];

const SAMPLES = [
  {
    file: "fresno-county-duplex-option-1_sheets-1-7.pdf",
    type: "duplex",
    label: "Try a real duplex plan set",
    note: "Fresno County pre-approved plans, sheets 1–7",
  },
  {
    file: "fictional-triplex-cover-sheet.pdf",
    type: "triplex",
    label: "Try the fictional triplex",
    note: "made up, with deliberate errors",
  },
];

function FindingRow({ f }: { f: Finding }) {
  const mark = f.kind === "violation" || f.kind === "missing_document";
  return (
    <li className={`${styles.finding} ${mark ? styles.mark : ""}`}>
      <div className={styles.findingHead}>
        <strong>{f.title}</strong>
        {f.sourceStatus === "UNVERIFIED" && (
          <span className={styles.badge}>unverified source</span>
        )}
      </div>
      <p>{f.detail}</p>
      {(f.planValue || f.required) && (
        <p className={styles.values}>
          {f.planValue && <span>Plans: {f.planValue}</span>}
          {f.required && <span>Required: {f.required}</span>}
        </p>
      )}
      {f.evidence && <p className={styles.evidence}>Evidence: {f.evidence}</p>}
      {f.source && (
        <a
          className={styles.source}
          href={f.source.url}
          target="_blank"
          rel="noreferrer"
        >
          {f.source.title}
          {f.source.section ? ` · ${f.source.section}` : ""}
        </a>
      )}
    </li>
  );
}

export default function PreCheck({
  districts,
  rulesChecked,
  rules,
}: {
  districts: District[];
  rulesChecked: string;
  rules: RuleSet;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [projectType, setProjectType] = useState("duplex");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setReport(null);
    const body = new FormData();
    body.append("file", file);
    body.append("projectType", projectType);
    body.append("district", district);
    try {
      const res = await fetch("/api/check", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  const count = (k: FindingKind) =>
    report?.findings.filter((f) => f.kind === k).length ?? 0;

  return (
    <>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.drop}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span>{file ? file.name : "Choose a plan set PDF"}</span>
        </label>
        <div className={styles.samples}>
          {SAMPLES.map((x) => (
            <button
              key={x.file}
              type="button"
              className={styles.sample}
              onClick={async () => {
                const blob = await (await fetch(`/samples/${x.file}`)).blob();
                setFile(new File([blob], x.file, { type: "application/pdf" }));
                setProjectType(x.type);
              }}
            >
              <span className={styles.sampleLabel}>{x.label}</span> {x.note}
            </button>
          ))}
        </div>
        <div className={styles.row}>
          <label>
            Project
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
            >
              <option value="duplex">Duplex (2 units)</option>
              <option value="triplex">Triplex (3 units)</option>
            </select>
          </label>
          <label>
            Zoning district
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">Not sure</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} {d.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!file || loading}>
            {loading ? "Reading plans…" : "Run pre-check"}
          </button>
        </div>
        {loading && (
          <p className={styles.hint}>
            Reading every sheet, 1 to 2 minutes
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {report && (
        <section className={styles.report}>
          <div className={styles.titleBlock}>
            <div className={styles.stampCell}>
              <span
                className={`${styles.stamp} ${styles[report.result.toLowerCase()]}`}
              >
                {report.result}
              </span>
            </div>
            <div className={styles.cells}>
              {[
                ["Missing documents", count("missing_document"), true],
                ["Corrections", count("violation"), true],
                ["Not stated", count("unknown"), false],
                ["Passed", count("passed"), false],
              ].map(([label, n, red]) => (
                <div key={label as string} className={styles.cell}>
                  <span className={styles.cellLabel}>{label}</span>
                  <span
                    className={`${styles.cellValue} ${styles.figure} ${red && n ? styles.corr : ""}`}
                  >
                    {n}
                  </span>
                </div>
              ))}
              {[
                ["City", report.city],
                ["Project", report.projectType],
                ["District", report.district ?? "Not identified"],
                ["Rules checked", rulesChecked],
              ].map(([label, v]) => (
                <div key={label} className={styles.cell}>
                  <span className={styles.cellLabel}>{label}</span>
                  <span className={styles.cellValue}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {SECTIONS.map((s) => {
            const items = report.findings.filter((f) => f.kind === s.kind);
            if (!items.length) return null;
            return (
              <details
                key={s.kind}
                className={styles.section}
                open={s.kind !== "passed"}
              >
                <summary>
                  {s.title} <span>({items.length})</span>
                  <em>{s.blurb}</em>
                </summary>
                <ul>
                  {items.map((f, i) => (
                    <FindingRow key={i} f={f} />
                  ))}
                </ul>
              </details>
            );
          })}

          <details className={styles.section}>
            <summary>What HouseX read from the plans</summary>
            <table className={styles.table}>
              <tbody>
                {Object.entries(report.extracted.project).map(([k, v]) => (
                  <tr key={k}>
                    <th>
                      {k.charAt(0).toUpperCase() + k.slice(1).replaceAll("_", " ")}
                    </th>
                    <td>
                      {v === null
                        ? "not stated"
                        : typeof v === "object"
                          ? JSON.stringify(v)
                          : String(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.extracted.sheet_index.length > 0 && (
              <p className={styles.meta}>
                Sheets:{" "}
                {report.extracted.sheet_index
                  .map((s) => `${s.sheet_id} ${s.title}`)
                  .join(" · ")}
              </p>
            )}
            {report.extracted.notes && (
              <p className={styles.meta}>Notes: {report.extracted.notes}</p>
            )}
          </details>
        </section>
      )}

      <Requirements rules={rules} projectType={projectType} district={district || report?.district || ""} />
    </>
  );
}
