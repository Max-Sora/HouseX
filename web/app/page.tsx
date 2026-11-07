import { rules } from "@/lib/rules";
import PreCheck from "./PreCheck";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>HouseX · {rules.city} plan pre-check</p>
        <h1>Find every correction before the city does</h1>
        <p className={styles.lede}>
          Upload a residential or mixed-use plan set. HouseX reads it with Claude and checks it against{" "}
          {rules.city}&rsquo;s submittal checklist, zoning standards and state housing law. Every finding links to its
          source.
        </p>
      </header>
      <PreCheck />
    </main>
  );
}
