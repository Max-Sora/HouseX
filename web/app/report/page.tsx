import ReportView from "../ReportView";
import styles from "../page.module.css";

export const metadata = { title: "Report · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1>Report</h1>
        <p className={styles.lede}>What the city would send back, found before you submit</p>
      </header>
      <ReportView />
    </main>
  );
}
