"use client";

import Link from "next/link";
import { rules } from "@/lib/rules";
import { useStore } from "./Store";
import NeedReport from "./NeedReport";
import StepNav from "./StepNav";
import Savings, { estimate } from "./Savings";
import Fix from "./Fix";
import CostBenefit from "./CostBenefit";
import Requirements from "./Requirements";
import styles from "./page.module.css";

export function SavingsView({ withFix }: { withFix: boolean }) {
  const { report, pkg, assume, setAssume, loaded } = useStore();
  if (!loaded) return null;
  if (!report) return <NeedReport />;
  if (withFix && !pkg) {
    return (
      <section className={styles.fixIntro}>
        <h3>No correction package yet</h3>
        <p>
          Draft the correction package first to see the savings with fixes
          included.
        </p>
        <Link href="/fix" className={styles.primary}>
          Go to Fix my plan
        </Link>
      </section>
    );
  }
  return (
    <>
      <Savings
        report={report}
        assumptions={assume}
        onChange={setAssume}
        withFix={withFix}
      />
      <StepNav
        back={withFix ? "/fix" : "/report"}
        next={
          withFix
            ? { href: "/cost-benefit", label: "Continue: cost benefit for your loan" }
            : { href: "/fix", label: "Continue: draft my fixes" }
        }
      />
    </>
  );
}

export function FixView() {
  const { report, pkg, fixing, fixError, draft, loaded } = useStore();
  if (!loaded) return null;
  if (!report) return <NeedReport />;
  return (
    <>
      <Fix
        report={report}
        pkg={pkg}
        loading={fixing}
        error={fixError}
        onDraft={draft}
      />
      {pkg ? (
        <StepNav back="/savings" next={{ href: "/savings-after-fix", label: "Continue: savings with the fixes" }} />
      ) : (
        <StepNav back="/savings" />
      )}
    </>
  );
}

export function CostBenefitView() {
  const { report, pkg, assume, loaded } = useStore();
  if (!loaded) return null;
  const e = report ? estimate(report, assume) : null;
  return (
    <>
    <CostBenefit
      monthsFromReport={e ? (e.check.weeks * 12) / 52 : null}
      withFixMonths={e && pkg ? (e.fix.weeks * 12) / 52 : null}
      pagesFromReport={
        report ? report.extracted.sheet_index.length || null : null
      }
    />
    <StepNav back={report ? (pkg ? "/savings-after-fix" : "/savings") : "/"} next={{ href: "/", label: "Start a new check" }} />
    </>
  );
}

export function RequirementsView() {
  const { projectType, setProjectType, district, setDistrict, report } =
    useStore();
  return (
    <>
      <div className={styles.row}>
        <label>
          Project
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          >
            {rules.project_types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zoning district
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">All districts</option>
            {rules.zoning_districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Requirements
        rules={rules}
        projectType={projectType}
        district={district || report?.district || ""}
      />
    </>
  );
}
