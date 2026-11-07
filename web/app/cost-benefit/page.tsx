import { CostBenefitView } from "../Views";
import styles from "../page.module.css";

export const metadata = { title: "Cost benefit · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.kicker}>HouseX · savings calculator</p>
        <h1>Cost benefit</h1>
        <p className={styles.lede}>What a faster permit is worth on a construction loan, plus the consultant hours you don&apos;t spend</p>
      </header>
      <CostBenefitView />
    </main>
  );
}
