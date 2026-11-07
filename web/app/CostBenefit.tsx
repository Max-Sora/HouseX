"use client";

import { useState } from "react";
import styles from "./page.module.css";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const LOANS = [1_000_000, 1_500_000];
const MONTHS = [1, 2, 3];
const RATES = [100, 150, 200, 250];
const HOURS = [10, 20, 30];

// Two savings: interest on an interest-only construction loan for the months saved,
// and consultant hours not spent chasing corrections, scaled by the size of the plan set.
export default function CostBenefit({
  monthsFromReport,
  withFixMonths,
  pagesFromReport,
}: {
  monthsFromReport: number | null;
  withFixMonths: number | null;
  pagesFromReport: number | null;
}) {
  const [loan, setLoan] = useState(1_000_000);
  const [rate, setRate] = useState(10);
  const [months, setMonths] = useState(
    monthsFromReport !== null ? +monthsFromReport.toFixed(1) : 1,
  );
  const [pages, setPages] = useState(pagesFromReport ?? 10);
  const [hoursPerPage, setHoursPerPage] = useState(1);
  const [hourly, setHourly] = useState(200);

  const monthly = (loan * rate) / 100 / 12;
  const interest = monthly * months;
  const hours = pages * hoursPerPage;
  const consultant = hours * hourly;
  const loans = [...new Set([...LOANS, loan])].sort((a, b) => a - b);

  const num =
    (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
      set(Number(e.target.value) || 0);

  return (
    <section>
      <div className={styles.savingsHead}>
        <div>
          <span className={styles.cellLabel}>Loan interest saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(interest)}
          </span>
        </div>
        <div>
          <span className={styles.cellLabel}>Consultant time saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(consultant)}
          </span>
        </div>
        <div>
          <span className={styles.cellLabel}>Total</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(interest + consultant)}
          </span>
        </div>
      </div>

      <div className={styles.calc}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Your project</th>
              <th>Value</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Amount tied up in construction ($)</td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={loan}
                  onChange={num(setLoan)}
                />
              </td>
              <td rowSpan={2}>
                {usd(loan)} × {rate}% ÷ 12 = <strong>{usd(monthly)}</strong> a
                month
              </td>
            </tr>
            <tr>
              <td>
                Interest rate, interest-only (%)
                <span className={styles.basis}>
                  Team assumption: typical construction loan
                </span>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={rate}
                  onChange={num(setRate)}
                />
              </td>
            </tr>
            <tr>
              <td>
                Months saved
                <span className={styles.basis}>
                  {monthsFromReport !== null
                    ? `This report's estimate: ${monthsFromReport.toFixed(1)} with the check${withFixMonths !== null ? `, ${withFixMonths.toFixed(1)} with fixes` : ""}`
                    : "Run a pre-check to estimate this from your plans"}
                </span>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={months}
                  onChange={num(setMonths)}
                />
              </td>
              <td>
                {usd(monthly)} × {months} = <strong>{usd(interest)}</strong>
              </td>
            </tr>
            <tr>
              <td>
                Pages in the plan set
                <span className={styles.basis}>
                  {pagesFromReport
                    ? `${pagesFromReport} sheets listed in this report's sheet index`
                    : "Count the sheets in your set"}
                </span>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={pages}
                  onChange={num(setPages)}
                />
              </td>
              <td rowSpan={2}>
                {pages} × {hoursPerPage} = <strong>{hours} hours</strong> saved
              </td>
            </tr>
            <tr>
              <td>
                Consultant hours saved per page
                <span className={styles.basis}>
                  ASSUMPTION: review, research and corrections per sheet
                </span>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={hoursPerPage}
                  onChange={num(setHoursPerPage)}
                />
              </td>
            </tr>
            <tr>
              <td>
                Consultant or architect rate ($/hour)
                <span className={styles.basis}>
                  Typical range $100 to $250+ an hour
                </span>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={hourly}
                  onChange={num(setHourly)}
                />
              </td>
              <td>
                {hours} × {usd(hourly)} = <strong>{usd(consultant)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className={styles.subhead}>Loan interest saved</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Amount tied up</th>
              <th>Per month at {rate}%</th>
              {MONTHS.map((m) => (
                <th key={m}>
                  {m} month{m > 1 ? "s" : ""} saved
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => {
              const m = (l * rate) / 100 / 12;
              return (
                <tr key={l} className={l === loan ? styles.current : undefined}>
                  <td>{usd(l)}</td>
                  <td>{usd(m)}</td>
                  {MONTHS.map((n) => (
                    <td key={n}>{usd(m * n)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subhead}>Consultant time saved</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rate</th>
              {HOURS.map((h) => (
                <th key={h}>{h} hours saved</th>
              ))}
              <th>Your {hours} hours</th>
            </tr>
          </thead>
          <tbody>
            {RATES.map((r) => (
              <tr key={r} className={r === hourly ? styles.current : undefined}>
                <td>{usd(r)}/hour</td>
                {HOURS.map((h) => (
                  <td key={h}>{usd(r * h)}</td>
                ))}
                <td>{usd(r * hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.meta}>
        An estimate from the inputs above, not a promise. Change any value to
        match your project.
      </p>
    </section>
  );
}
