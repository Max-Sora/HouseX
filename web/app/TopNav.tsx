"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./Store";
import { estimate } from "./Savings";
import styles from "./nav.module.css";

export default function TopNav() {
  const path = usePathname();
  const { report, pkg, assume, fixing } = useStore();
  const e = report ? estimate(report, assume) : null;
  const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const links: {
    href: string;
    label: string;
    meta?: string;
    needsReport?: boolean;
  }[] = [
    { href: "/", label: "Check" },
    {
      href: "/report",
      label: "Report",
      meta: report?.result,
      needsReport: true,
    },
    {
      href: "/savings",
      label: "Savings",
      meta: e ? usd(e.check.money) : undefined,
      needsReport: true,
    },
    {
      href: "/fix",
      label: "Fix my plan",
      meta: fixing ? "drafting…" : undefined,
      needsReport: true,
    },
    {
      href: "/savings-after-fix",
      label: "Savings after fix",
      meta: e && pkg ? usd(e.fix.money) : undefined,
      needsReport: true,
    },
    { href: "/cost-benefit", label: "Cost benefit" },
    { href: "/requirements", label: "Requirements" },
  ];

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          HouseX
        </Link>
        <nav aria-label="Pages" className={styles.links}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.link} ${l.needsReport && !report ? styles.dim : ""}`}
              aria-current={path === l.href ? "page" : undefined}
            >
              {l.label}
              {l.meta && <span className={styles.meta}>{l.meta}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
