"use client";

import { useState } from "react";
import styles from "./page.module.css";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const LOANS = [1_000_000, 1_500_000];
const MONTHS = [1, 2, 3];

// Interest-only construction loan: every month of delay costs principal × rate ÷ 12.
export default function CostBenefit({
  monthsFromReport,
  withFixMonths,
}: {
  monthsFromReport: number;
  withFixMonths: number | null;
}) {
  const [loan, setLoan] = useState(1_000_000);
  const [rate, setRate] = useState(10);
  const [months, setMonths] = useState(+monthsFromReport.toFixed(1));
  const monthly = (loan * rate) / 100 / 12;
  const rows = [...new Set([...LOANS, loan])].sort((a, b) => a - b);

  return (
    <section>
      <div className={styles.savingsHead}>
        <div>
          <span className={styles.cellLabel}>Monthly interest</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(monthly)}
          </span>
        </div>
        <div>
          <span className={styles.cellLabel}>Months saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>{months}</span>
        </div>
        <div>
          <span className={styles.cellLabel}>Interest saved</span>
          <span className={`${styles.cellValue} ${styles.big}`}>
            {usd(monthly * months)}
          </span>
        </div>
      </div>
      <p className={styles.meta}>
        Construction loans are usually interest-only, so every month a project
        waits on permits costs a month of interest. {usd(loan)} at {rate}% is{" "}
        {usd(monthly)} a month.
      </p>

      <div className={styles.assumptions}>
        <label>
          <span>Loan amount tied up in the project ($)</span>
          <input
            type="number"
            min={0}
            step={50000}
            value={loan}
            onChange={(e) => setLoan(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>Interest rate, interest-only (%)</span>
          <input
            type="number"
            min={0}
            step={0.25}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
          />
          <span className={styles.basis}>
            ASSUMPTION: typical construction loan rate, from the team
          </span>
        </label>
        <label>
          <span>Months saved</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) || 0)}
          />
          <span className={styles.basis}>
            This report&rsquo;s estimate: {monthsFromReport.toFixed(1)} months
            with the check
            {withFixMonths !== null
              ? `, ${withFixMonths.toFixed(1)} with the correction package`
              : ""}{" "}
            (from the Savings step)
          </span>
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Loan tied up</th>
              <th>Per month</th>
              {MONTHS.map((m) => (
                <th key={m}>
                  {m} month{m > 1 ? "s" : ""} saved
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const m = (l * rate) / 100 / 12;
              return (
                <tr key={l}>
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
      <p className={styles.meta}>
        At {rate}% interest-only. An estimate, not a promise; change the inputs
        to match the loan.
      </p>
    </section>
  );
}
