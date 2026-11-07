import { FixView } from "../Views";
import styles from "../page.module.css";

export const metadata = { title: "Fix my plan · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.kicker}>Step 4 of 6</p>
        <h1>Fix my plan</h1>
        <p className={styles.lede}>A drafted correction package for your architect to review and stamp</p>
      </header>
      <FixView />
    </main>
  );
}
