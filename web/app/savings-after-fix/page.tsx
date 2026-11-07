import { SavingsView } from "../Views";
import styles from "../page.module.css";

export const metadata = { title: "Savings after fix · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.kicker}>Step 5 of 6</p>
        <h1>Savings after fix</h1>
        <p className={styles.lede}>The same estimate with HouseX drafting the corrections for you</p>
      </header>
      <SavingsView withFix />
    </main>
  );
}
