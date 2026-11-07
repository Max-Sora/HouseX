"use client";

import type { Report } from "@/lib/types";
import styles from "./page.module.css";

export interface Assumptions {
  monthlyCostPerHome: number;
  completenessWeeks: number;
  reviewWeeks: number;
  hoursPerItem: number;
  hoursPerItemWithPackage: number;
  hourlyRate: number;
}

// Each default says where it comes from; the person can change any of them.
export const DEFAULTS: Assumptions = {
  monthlyCostPerHome: 1770,
  completenessWeeks: 3,
  reviewWeeks: 6,
  hoursPerItem: 1.5,
  hoursPerItemWithPackage: 0.5,
  hourlyRate: 150,
};

const FIELDS: {
  key: keyof Assumptions;
  label: string;
  unit: string;
  basis: string;
  url?: string;
  fixOnly?: boolean;
}[] = [
  {
    key: "monthlyCostPerHome",
    label: "Waiting cost per home per month",
    unit: "$",
    basis:
      "Derived from the challenge brief's mock example: $85k of loan interest, taxes, insurance and management over a ~4-year timeline. Not a real deal",
    url: "https://github.com/travcjohnson/claude-impact-lab-uci/blob/main/docs/background.md",
  },
  {
    key: "completenessWeeks",
    label: "Completeness review per round",
    unit: "weeks",
    basis:
      "AB 2234 (Gov Code 65913.3) gives the city up to 15 days to decide completeness; rounded to 3 weeks with resubmittal",
    url: "https://lcf.ca.gov/Housing/",
  },
  {
    key: "reviewWeeks",
    label: "Plan check review per round",
    unit: "weeks",
    basis:
      "AB 2234 allows up to 30 business days for 25 or fewer units. Irvine's own turnaround (Bulletin 279) not read",
    url: "https://lcf.ca.gov/Housing/",
  },
  {
    key: "hoursPerItem",
    label: "Hours to research and draft one fix yourself",
    unit: "hours",
    basis: "ASSUMPTION",
    fixOnly: true,
  },
  {
    key: "hoursPerItemWithPackage",
    label: "Hours per fix with the drafted package",
    unit: "hours",
    basis: "ASSUMPTION: review and adapt the draft",
    fixOnly: true,
  },
  {
    key: "hourlyRate",
    label: "Design professional rate",
    unit: "$/hour",
    basis: "ASSUMPTION",
    fixOnly: true,
  },
];

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const wk = (n: number) => `${n.toFixed(1)} weeks`;

export function estimate(report: Report, a: Assumptions) {
  const count = (k: string) =>
    report.findings.filter((f) => f.kind === k).length;
  const missing = count("missing_document");
  const fixes = count("violation") + count("unknown");
  const units =
    report.extracted.project.unit_count ??
    ({ sfr: 1, duplex: 2, triplex: 3, sfr_adu: 2 } as Record<string, number>)[
      report.projectType
    ] ??
    1;
  // ASSUMPTION: catching each kind of problem before submittal avoids one city round of that kind.
  const bounce = missing > 0 ? 1 : 0;
  const correctionRound = fixes > 0 ? 1 : 0;
  const checkWeeks =
    bounce * a.completenessWeeks + correctionRound * a.reviewWeeks;
  const perWeek = (a.monthlyCostPerHome * units * 12) / 52;
  const items = missing + fixes;
  const prepHoursSaved =
    items * Math.max(0, a.hoursPerItem - a.hoursPerItemWithPackage);
  const prepWeeks = prepHoursSaved / 40;
  return {
    missing,
    fixes,
    units,
    bounce,
    correctionRound,
    items,
    perWeek,
    check: { weeks: checkWeeks, money: checkWeeks * perWeek },
    fix: {
      weeks: checkWeeks + prepWeeks,
      money: (checkWeeks + prepWeeks) * perWeek + prepHoursSaved * a.hourlyRate,
      prepHoursSaved,
      prepWeeks,
      laborSaved: prepHoursSaved * a.hourlyRate,
    },
  };
}

export default function Savings({
  report,
  assumptions,
  onChange,
  withFix,
}: {
  report: Report;
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  withFix: boolean;
}) {
  const e = estimate(report, assumptions);
  const total = withFix ? e.fix : e.check;

  return (
    <section>
      <div className={styles.savingsHead}>
        <div>
          <span className={styles.cellLabel}>Time saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {wk(total.weeks)}
          </span>
        </div>
        <div>
          <span className={styles.cellLabel}>Money saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(total.money)}
          </span>
        </div>
        <div>
          <span className={styles.cellLabel}>
            {withFix
              ? "Compared with the check alone"
              : "Homes in this project"}
          </span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {withFix ? `+${usd(e.fix.money - e.check.money)}` : e.units}
          </span>
        </div>
      </div>
      <p className={styles.meta}>
        An estimate from the assumptions below, not a promise. Change any number
        to match your project.
      </p>

      <table className={styles.table}>
        <tbody>
          <tr>
            <th>Incomplete-application round avoided</th>
            <td>
              {e.bounce
                ? `${e.missing} missing documents found before submittal → ${wk(assumptions.completenessWeeks)}`
                : "No missing documents found"}
            </td>
          </tr>
          <tr>
            <th>Correction round avoided</th>
            <td>
              {e.correctionRound
                ? `${e.fixes} corrections and unstated values found → ${wk(assumptions.reviewWeeks)}`
                : "No corrections found"}
            </td>
          </tr>
          <tr>
            <th>Waiting cost of that time</th>
            <td>
              {wk(e.check.weeks)} × {usd(e.perWeek)} per week ({e.units} home
              {e.units === 1 ? "" : "s"}) = {usd(e.check.money)}
            </td>
          </tr>
          {withFix && (
            <>
              <tr>
                <th>Design time saved by the package</th>
                <td>
                  {e.items} items × ({assumptions.hoursPerItem} −{" "}
                  {assumptions.hoursPerItemWithPackage}) hours ={" "}
                  {e.fix.prepHoursSaved.toFixed(1)} hours ×{" "}
                  {usd(assumptions.hourlyRate)} = {usd(e.fix.laborSaved)}
                </td>
              </tr>
              <tr>
                <th>Faster resubmittal</th>
                <td>
                  {e.fix.prepHoursSaved.toFixed(1)} hours at 40 hours a week ={" "}
                  {wk(e.fix.prepWeeks)} less waiting ={" "}
                  {usd(e.fix.prepWeeks * e.perWeek)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <details className={styles.section}>
        <summary>
          Assumptions <em>Edit to match your project</em>
        </summary>
        <div className={styles.assumptions}>
          {FIELDS.filter((f) => withFix || !f.fixOnly).map((f) => (
            <label key={f.key}>
              <span>
                {f.label} <span className={styles.unit}>({f.unit})</span>
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={assumptions[f.key]}
                onChange={(ev) =>
                  onChange({
                    ...assumptions,
                    [f.key]: Number(ev.target.value) || 0,
                  })
                }
              />
              <span className={styles.basis}>
                {f.url ? (
                  <a
                    className={styles.source}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.basis}
                  </a>
                ) : (
                  f.basis
                )}
              </span>
            </label>
          ))}
        </div>
      </details>
    </section>
  );
}
