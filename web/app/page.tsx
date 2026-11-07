import { rules } from "@/lib/rules";
import PreCheck from "./PreCheck";
import styles from "./page.module.css";

export default function Home() {
  const districts = rules.zoning_districts.map((d) => ({
    code: d.code,
    name: d.name,
    allows: d.allows,
  }));
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>HouseX · Pre-Check for {rules.city}, CA</p>
        <h1>Find every correction before the city does.</h1>
        <p className={styles.lede}>
          Upload a duplex or triplex plan set. HouseX reads it with Claude, then
          checks it against {rules.city}&rsquo;s submittal list, zoning
          standards and state housing law, citing a source for every finding.
        </p>
      </header>
      <PreCheck districts={districts} rulesChecked={rules.checked} />
      <footer className={styles.footer}>
        Prototype for the UCI Impact Lab. Not legal advice and not a city
        decision. Rules were checked on {rules.checked}; items marked
        &ldquo;unverified&rdquo; are leads, not facts. Structural and MEP design
        are never checked.
      </footer>
    </main>
  );
}
