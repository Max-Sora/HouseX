import Link from "next/link";
import styles from "./page.module.css";

// Shown on every page (from the layout), above the footer.
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
    text: "Enter the address, upload the plan PDF and follow five short steps. No code books, map lookups or permit experience needed.",
  },
  {
    title: "Accessible",
    text: "Plain-language results that work on a phone, with every rule linked to its source. Ask questions in the chat in your own language.",
  },
];

export default function WhyHouseX() {
  return (
    <div className={styles.whyWrap}>
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
    </div>
  );
}
