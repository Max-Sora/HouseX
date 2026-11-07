import styles from "./page.module.css";

// Explanations, evidence and legal sources stay out of the way until the reader asks for them.
export default function More({
  children,
  label = "Details and source",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <details className={styles.more}>
      <summary>{label}</summary>
      <div className={styles.moreBody}>{children}</div>
    </details>
  );
}
