import { SavingsView } from "../Views";
import styles from "../page.module.css";

export const metadata = { title: "Savings · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.kicker}>Step 3 of 6</p>
        <h1>Savings</h1>
        <p className={styles.lede}>Weeks and dollars saved by catching these problems before you submit</p>
      </header>
      <SavingsView withFix={false} />
    </main>
  );
}
