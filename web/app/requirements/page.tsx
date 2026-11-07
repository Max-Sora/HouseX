import { RequirementsView } from "../Views";
import StepNav from "../StepNav";
import styles from "../page.module.css";

export const metadata = { title: "Requirements · HouseX" };

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1>Requirements</h1>
        <p className={styles.lede}>Everything Irvine requires for each project type, with the source for every rule</p>
      </header>
      <RequirementsView />
      <StepNav back="/" next={{ href: "/", label: "Back to the check" }} />
    </main>
  );
}
