import { CostBenefitView } from "../Views";
import styles from "../page.module.css";

export const metadata = { title: "Cost benefit · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1>Cost benefit</h1>
        <p className={styles.lede}>What a faster permit is worth on a construction loan, plus the consultant hours you don't spend</p>
      </header>
      <CostBenefitView />
    </main>
  );
}
