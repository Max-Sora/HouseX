import Link from "next/link";
import styles from "./page.module.css";

export default function NeedReport() {
  return (
    <section className={styles.fixIntro}>
      <h3>No pre-check yet</h3>
      <p>Run a pre-check on a plan set first. This page uses its results.</p>
      <Link href="/" className={styles.primary}>
        Go to Check
      </Link>
    </section>
  );
}
