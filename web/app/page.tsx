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
        <p className={styles.kicker}>HouseX · {rules.city} plan pre-check</p>
        <h1>Find every correction before the city does</h1>
        <p className={styles.lede}>
          Upload a duplex or triplex plan set. HouseX reads it with Claude and
          checks it against {rules.city}&rsquo;s submittal checklist, zoning
          standards and state housing law. Every finding links to its source.
        </p>
      </header>
      <PreCheck districts={districts} rulesChecked={rules.checked} rules={rules} />
      <footer className={styles.footer}>
        <span>Prototype built at the UCI Impact Lab, not legal advice and not a city decision</span>
        <span>Rules checked {rules.checked}. Items marked unverified are leads, not facts</span>
        <span>Structural, mechanical, electrical and plumbing design are left to a licensed plan checker</span>
      </footer>
    </main>
  );
}
