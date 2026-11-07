import { rules } from "@/lib/rules";
import Link from "next/link";
import PreCheck from "./PreCheck";
import styles from "./page.module.css";

const WHY: { title: string; text: string; link?: { href: string; label: string } }[] = [
  {
    title: "Save money",
    text: "Construction loans charge interest every month a project waits. Fixing problems before you submit keeps months off the clock.",
    link: { href: "/cost-benefit", label: "Estimate your savings →" },
  },
  {
    title: "Save time",
    text: "Get the missing documents and rule conflicts in 1 to 2 minutes, instead of learning them from a city review that can take up to 30 business days per round.",
  },
  {
    title: "Easy to use",
    text: "Enter the address, upload the plan PDF and follow six short steps. No code books, map lookups or permit experience needed.",
  },
  {
    title: "Accessible",
    text: "Plain-language results that work on a phone, with every rule linked to its source. Ask questions in the chat in your own language.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>HouseX · {rules.city} plan pre-check · Step 1 of 5</p>
        <h1>Find every correction before the city does</h1>
        <p className={styles.lede}>
          Upload a residential or mixed-use plan set. HouseX reads it with Claude and checks it against{" "}
          {rules.city}&rsquo;s submittal checklist, zoning standards and state housing law. Every finding links to its
          source.
        </p>
      </header>
      <PreCheck />
      <p className={styles.hint}>
        Want to see the rules first?{" "}
        <Link href="/requirements" className={styles.inlineLink}>
          See everything {rules.city} requires
        </Link>{" "}
        or{" "}
        <Link href="/cost-benefit" className={styles.inlineLink}>
          estimate your savings
        </Link>
      </p>

      <section className={styles.why} aria-labelledby="why">
        <h2 id="why">Why use HouseX?</h2>
        <div className={styles.whyGrid}>
          {WHY.map((w) => (
            <div key={w.title}>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
              {w.link && (
                <Link href={w.link.href} className={styles.inlineLink}>
                  {w.link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
