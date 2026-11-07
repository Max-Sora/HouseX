"use client";

import { useState } from "react";
import type { Finding, FindingKind, Report } from "@/lib/types";
import styles from "./page.module.css";

type District = { code: string; name: string; allows: string[] };

const SECTIONS: { kind: FindingKind; title: string; blurb: string }[] = [
  {
    kind: "missing_document",
    title: "Missing documents",
    blurb: "The city will mark the application incomplete without these.",
  },
  {
    kind: "violation",
    title: "Corrections needed",
    blurb: "The plans conflict with a written rule.",
  },
  {
    kind: "unknown",
    title: "Not stated or not checked",
    blurb: "The plans don't say, or the rule isn't confirmed yet.",
  },
  {
    kind: "needs_human",
    title: "Needs a human plan checker",
    blurb: "HouseX flags these but never decides them.",
  },
  { kind: "passed", title: "Passed", blurb: "Meets the rule as written." },
];

function FindingRow({ f }: { f: Finding }) {
  return (
    <li className={styles.finding}>
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
}: {
  districts: District[];
  rulesChecked: string;
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
      if (!res.ok) throw new Error(data.error ?? "Check failed.");
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed.");
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
        <button
          type="button"
          className={styles.sample}
          onClick={async () => {
            const blob = await (
              await fetch("/samples/fictional-triplex-cover-sheet.pdf")
            ).blob();
            setFile(
              new File([blob], "fictional-triplex-cover-sheet.pdf", {
                type: "application/pdf",
              }),
            );
            setProjectType("triplex");
          }}
        >
          Or try a fictional triplex sample (made up, with deliberate errors)
        </button>
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
            Claude is reading every sheet. This takes about a minute.
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {report && (
        <section className={styles.report}>
          <div className={styles.summary}>
            <span
              className={`${styles.stamp} ${styles[report.result.toLowerCase()]}`}
            >
              {report.result}
            </span>
            <div>
              <p>
                <strong>{count("missing_document")}</strong> missing documents ·{" "}
                <strong>{count("violation")}</strong> corrections ·{" "}
                <strong>{count("unknown")}</strong> not stated ·{" "}
                <strong>{count("passed")}</strong> passed
              </p>
              <p className={styles.meta}>
                {report.city} rules checked {rulesChecked} ·{" "}
                {report.projectType}
                {report.district
                  ? ` · district ${report.district}`
                  : " · no district selected"}
              </p>
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
                    <th>{k.replaceAll("_", " ")}</th>
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
    </>
  );
}
