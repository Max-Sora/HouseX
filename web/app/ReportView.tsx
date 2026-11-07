"use client";

import { useState } from "react";
import Link from "next/link";
import type { Finding, FindingKind } from "@/lib/types";
import { useStore } from "./Store";
import NeedReport from "./NeedReport";
import More from "./More";
import styles from "./page.module.css";

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
      {(f.planValue || f.required) && (
        <p className={styles.values}>
          {f.planValue && <span>Plans: {f.planValue}</span>}
          {f.required && <span>Required: {f.required}</span>}
        </p>
      )}
      <More>
        <p>{f.detail}</p>
        {f.evidence && <p className={styles.evidence}>Evidence: {f.evidence}</p>}
        {f.source && (
          <a className={styles.source} href={f.source.url} target="_blank" rel="noreferrer">
            {f.source.title}
            {f.source.section ? ` · ${f.source.section}` : ""}
          </a>
        )}
      </More>
    </li>
  );
}

export default function ReportView() {
  const { report, loaded } = useStore();
  const [docType, setDocType] = useState("All");
  if (!loaded) return null;
  if (!report) return <NeedReport />;

  const count = (k: FindingKind) =>
    report.findings.filter((f) => f.kind === k).length;

  return (
    <section>
      <div className={styles.titleBlock}>
        <div className={styles.stampCell}>
          <span
            className={`${styles.stamp} ${styles[report.result.toLowerCase()]}`}
          >
            {report.result}
          </span>
        </div>
        <div className={styles.cells}>
          {(
            [
              ["Missing documents", count("missing_document"), true],
              ["Corrections", count("violation"), true],
              ["Not stated", count("unknown"), false],
              ["Passed", count("passed"), false],
            ] as [string, number, boolean][]
          ).map(([label, n, red]) => (
            <div key={label} className={styles.cell}>
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
            ["Rules checked", report.rulesChecked],
          ].map(([label, v]) => (
            <div key={label} className={styles.cell}>
              <span className={styles.cellLabel}>{label}</span>
              <span className={styles.cellValue}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {report.site && (
        <details className={styles.section} open>
          <summary>
            Lot facts from public records
            <em>
              Looked up from the project address, used in the checks below
            </em>
          </summary>
          <table className={styles.table}>
            <tbody>
              {(
                [
                  ["Matched address", report.site.matched_address],
                  ["Parcel (APN)", report.site.apn],
                  [
                    "Lot area",
                    report.site.lot_area_sf === null
                      ? null
                      : `${report.site.lot_area_sf.toLocaleString()} sf`,
                  ],
                  ["Zoning (city map)", report.site.zoning],
                  ["FEMA flood zone", report.site.flood_zone],
                  [
                    "Fire hazard severity zone",
                    report.site.fire_hazard ??
                      (report.site.lat !== null ? "None mapped" : null),
                  ],
                ] as [string, string | null][]
              ).map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v ?? "not found"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className={styles.lookups}>
            {report.site.lookups.map((l) => (
              <li key={l.label}>
                <span className={l.ok ? styles.ok : styles.miss}>
                  {l.ok ? "found" : "not found"}
                </span>{" "}
                {l.label} ·{" "}
                <a
                  className={styles.source}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.publisher}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {SECTIONS.map((s) => {
        const items = report.findings.filter((f) => f.kind === s.kind);
        if (!items.length) return null;
        const cat = (f: Finding) => f.category ?? "Other";
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
            {s.kind === "missing_document" && (
              <div
                className={styles.chips}
                role="group"
                aria-label="Filter by document type"
              >
                {["All", ...new Set(items.map(cat))].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.chip}
                    aria-pressed={docType === c}
                    onClick={() => setDocType(c)}
                  >
                    {c}{" "}
                    <span>
                      {c === "All"
                        ? items.length
                        : items.filter((f) => cat(f) === c).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <ul>
              {items
                .filter(
                  (f) =>
                    s.kind !== "missing_document" ||
                    docType === "All" ||
                    cat(f) === docType,
                )
                .map((f, i) => (
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

      <p className={styles.next}>
        <Link href="/savings">Next: what this saves →</Link>
      </p>
    </section>
  );
}
