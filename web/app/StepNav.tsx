import Link from "next/link";
import BackButton from "./BackButton";
import styles from "./page.module.css";

// One way forward: a back link and a single main button to the next step.
export default function StepNav({
  back,
  next,
}: {
  back?: string;
  next?: { href: string; label: string };
}) {
  return (
    <nav className={styles.stepNav} aria-label="Step navigation">
      {back === "history" ? (
        <BackButton className={styles.back} />
      ) : back ? (
        <Link href={back} className={styles.back}>
          ← Back
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className={styles.primary}>
          {next.label}
        </Link>
      )}
    </nav>
  );
}
