"use client";

import type { FixPackage } from "@/lib/fix";
import type { Report } from "@/lib/types";
import WaitPanel from "./WaitPanel";
import styles from "./page.module.css";

function toMarkdown(report: Report, pkg: FixPackage): string {
  const docs = report.findings.filter((f) => f.kind === "missing_document");
  return [
    `# Correction package: ${report.projectType} in ${report.city}`,
    "",
    "Drafted by HouseX for review by a licensed professional. Not a city decision and not legal advice.",
    "",
    "## Title sheet notes",
    "",
    ...pkg.title_sheet_notes.map((n) => `- ${n}`),
    "",
    "## Fixes",
    "",
    ...pkg.fixes.flatMap((f, i) => [
      `### ${i + 1}. ${f.finding}`,
      "",
      `- **Who:** ${f.who}`,
      `- **Sheet:** ${f.sheet}`,
      `- **Action:** ${f.action}`,
      "",
      "```",
      f.draft_text,
      "```",
      "",
    ]),
    "## Documents to add",
    "",
    ...docs.map(
      (d) => `- [ ] ${d.title}${d.source ? ` (${d.source.url})` : ""}`,
    ),
    "",
    "## Letter to the plan checker",
    "",
    pkg.cover_letter,
    "",
  ].join("\n");
}

export default function Fix({
  report,
  pkg,
  loading,
  error,
  onDraft,
}: {
  report: Report;
  pkg: FixPackage | null;
  loading: boolean;
  error: string | null;
  onDraft: () => void;
}) {
  const docs = report.findings.filter((f) => f.kind === "missing_document");

  if (!pkg) {
    return (
      <section className={styles.fixIntro}>
        <h3>We can draft the fixes for you</h3>
        <p>
          HouseX writes a correction package from this report: the updated
          title-sheet notes and code list, the exact text for each correction, a
          checklist of the {docs.length} missing documents with the city form
          for each, and a letter to the plan checker. Your architect reviews,
          adjusts and stamps it.
        </p>
        <button
          type="button"
          className={styles.primary}
          onClick={onDraft}
          disabled={loading}
        >
          {loading ? "Drafting the package…" : "Draft my correction package"}
        </button>
        {loading && (
          <WaitPanel
            title="Drafting your correction package"
            typical="about 2 minutes"
            steps={[
              { label: "Collecting the findings from your report", at: 0 },
              { label: "AI is drafting the updated title-sheet notes and code list", at: 4 },
              { label: "AI is writing the exact fix for each correction", at: 25 },
              { label: "Matching each missing document to the city's form", at: 70 },
              { label: "AI is writing your letter to the plan checker", at: 95 },
            ]}
          />
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>
    );
  }

  const download = () => {
    const blob = new Blob([toMarkdown(report, pkg)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `housex-correction-package-${report.projectType}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section>
      <div className={styles.fixBar}>
        <p className={styles.meta}>
          Drafts for a licensed professional to review and stamp. Values marked
          [designer to confirm] still need a decision.
        </p>
        <button type="button" className={styles.primary} onClick={download}>
          Download package
        </button>
      </div>

      <details className={styles.section} open>
        <summary>
          Title sheet notes <span>({pkg.title_sheet_notes.length})</span>
          <em>Replace the code list and general notes on the title sheet</em>
        </summary>
        <pre className={styles.draft}>{pkg.title_sheet_notes.join("\n")}</pre>
      </details>

      <details className={styles.section} open>
        <summary>
          Fixes <span>({pkg.fixes.length})</span>
          <em>One drafted change per finding</em>
        </summary>
        <ul>
          {pkg.fixes.map((f, i) => (
            <li key={i} className={styles.finding}>
              <strong>{f.finding}</strong>
              <p className={styles.values}>
                <span>{f.who}</span>
                <span>{f.sheet}</span>
              </p>
              <p>{f.action}</p>
              <pre className={styles.draft}>{f.draft_text}</pre>
            </li>
          ))}
        </ul>
      </details>

      <details className={styles.section}>
        <summary>
          Documents to add <span>({docs.length})</span>
          <em>Each links to the city&rsquo;s source for the form</em>
        </summary>
        <ul>
          {docs.map((d, i) => (
            <li key={i} className={styles.finding}>
              <strong>{d.title}</strong>
              {d.source && (
                <a
                  className={styles.source}
                  href={d.source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.source.title}
                </a>
              )}
            </li>
          ))}
        </ul>
      </details>

      <details className={styles.section}>
        <summary>
          Letter to the plan checker{" "}
          <em>Edit names and dates before sending</em>
        </summary>
        <pre className={styles.draft}>{pkg.cover_letter}</pre>
      </details>
    </section>
  );
}
