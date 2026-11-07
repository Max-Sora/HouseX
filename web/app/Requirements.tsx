import type { RuleSet, Source, Status } from "@/lib/types";
import More from "./More";
import styles from "./page.module.css";

const trio = (l: Record<string, number | "UL" | null>, keys: string[]) =>
  keys.map((k) => (l[k] === null || l[k] === undefined ? "—" : l[k]!.toLocaleString())).join(" / ");
const ft = (v: number | null, unit = "") =>
  v === null ? "varies / not confirmed" : `${v}${unit}`;

function Title({ text, status }: { text: string; status: Status }) {
  return (
    <div className={styles.findingHead}>
      <strong>{text}</strong>
      {status === "UNVERIFIED" && <span className={styles.badge}>unverified</span>}
    </div>
  );
}

function Cite({ source, status }: { source: Source; status: Status }) {
  return (
    <p className={styles.cite}>
      <a
        className={styles.source}
        href={source.url}
        target="_blank"
        rel="noreferrer"
      >
        {source.title}
        {source.section ? ` · ${source.section}` : ""}
      </a>
      {status === "UNVERIFIED" && (
        <span className={styles.badge}>unverified source</span>
      )}
    </p>
  );
}

export default function Requirements({
  rules,
  projectType,
  district,
}: {
  rules: RuleSet;
  projectType: string;
  district: string;
}) {
  const docs = rules.required_documents.filter((d) =>
    d.applies_to.includes(projectType),
  );
  const codes = rules.code_triggers.filter((t) =>
    t.applies_to.includes(projectType),
  );
  const label = rules.project_types.find((t) => t.id === projectType)?.label ?? projectType;
  const laws = rules.state_law.filter((l) => !l.applies_to || l.applies_to.includes(projectType));
  const c = rules.construction;
  const pt = c?.project_types[projectType];
  const rows = c && pt ? c.allowable.filter((r) => r.occupancy === pt.occupancy) : [];
  const districts = district
    ? rules.zoning_districts.filter((d) => d.code === district)
    : rules.zoning_districts;

  return (
    <section className={styles.requirements}>
      <h2>
        {rules.city} requirements for {label}
      </h2>
      <p className={styles.meta}>
        Every rule HouseX checks, with its source. Checked {rules.checked}.
      </p>

      <details className={styles.section}>
        <summary>
          Submittal documents <span>({docs.length})</span>
          <em>What the completeness review expects in the package</em>
        </summary>
        <ul>
          {docs.map((d) => (
            <li key={d.id} className={styles.finding}>
              <Title text={d.name} status={d.status} />
              <More>
                <p>{d.description}</p>
                {d.note && <p className={styles.evidence}>{d.note}</p>}
                <Cite source={d.source} status={d.status} />
              </More>
            </li>
          ))}
        </ul>
      </details>

      <details className={styles.section}>
        <summary>
          Zoning standards{" "}
          <span>
            ({districts.length} district{districts.length === 1 ? "" : "s"})
          </span>
          <em>Objective limits by district; many areas also follow planning-area standards</em>
        </summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>District</th>
                <th>Density</th>
                <th>Height</th>
                <th>Setbacks F / S / R</th>
                <th>Coverage</th>
                <th>Parking</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.code}>
                  <td>
                    <strong>{d.code}</strong> {d.name}
                  </td>
                  <td>{ft(d.max_density_du_per_acre, " units/ac")}</td>
                  <td>{ft(d.max_height_ft, " ft")}</td>
                  <td>
                    {[
                      d.setbacks_ft.front,
                      d.setbacks_ft.side,
                      d.setbacks_ft.rear,
                    ]
                      .map((v) => (v === null ? "—" : `${v} ft`))
                      .join(" / ")}
                  </td>
                  <td>{ft(d.max_lot_coverage_pct, "%")}</td>
                  <td>{ft(d.parking_spaces_per_unit, " per unit")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          {districts.map((d) => (
            <li key={d.code} className={styles.finding}>
              <Title text={`District ${d.code} notes`} status={d.status} />
              <More>
                {d.note && <p className={styles.evidence}>{d.note}</p>}
                <Cite source={d.source} status={d.status} />
              </More>
            </li>
          ))}
        </ul>
      </details>

      <details className={styles.section}>
        <summary>
          Building, fire and energy code <span>({codes.length})</span>
          <em>What the plans must show</em>
        </summary>
        <ul>
          {codes.map((t) => (
            <li key={t.id} className={styles.finding}>
              <Title text={t.rule} status={t.status} />
              <More>
                <p className={styles.evidence}>Applies when: {t.applies_when}</p>
                <p>Plans must show: {t.required_evidence_on_plans}</p>
                <Cite source={t.source} status={t.status} />
              </More>
            </li>
          ))}
        </ul>
      </details>

      {c && pt && (
        <details className={styles.section}>
          <summary>
            Construction type limits <span>({pt.code}, occupancy {pt.occupancy})</span>
            <em>
              Allowable height, stories and area per story by construction type and sprinkler system, {c.code_edition}
            </em>
          </summary>
          <More label="How this project type is classified">
            <p className={styles.evidence}>{pt.note}</p>
          </More>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Height ft (NS / 13R / 13)</th>
                  <th>Stories (NS / 13R / 13)</th>
                  <th>Area per story sf (NS / 13R / 13)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.construction_type}>
                    <td>
                      <strong>{r.construction_type}</strong>
                      {r.status === "UNVERIFIED" && <span className={styles.badge}>unverified</span>}
                    </td>
                    <td>{trio(r.height_ft, ["NS", "S13R", "S"])}</td>
                    <td>{trio(r.stories, ["NS", "S13R", "S"])}</td>
                    <td>{trio(r.area_per_story_sf, ["NS", "S13R", "S1"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows[0] && (
            <More label="Source">
              <Cite source={rows[0].source} status={rows[0].status} />
            </More>
          )}
        </details>
      )}

      <details className={styles.section}>
        <summary>
          State housing law <span>({laws.length})</span>
          <em>Limits on what the city may require, such as SB 9</em>
        </summary>
        <ul>
          {laws.map((s) => (
            <li key={s.id} className={styles.finding}>
              <Title text={s.rule} status={s.status} />
              <More>
                {s.applies_when && <p className={styles.evidence}>Applies when: {s.applies_when}</p>}
                <Cite source={s.source} status={s.status} />
              </More>
            </li>
          ))}
        </ul>
      </details>

      <details className={styles.section}>
        <summary>
          Process and timelines <span>({rules.process.length})</span>
          <em>How submittal, completeness review and plan check work</em>
        </summary>
        <ul>
          {rules.process.map((s) => (
            <li key={s.id} className={styles.finding}>
              <Title text={s.rule} status={s.status} />
              <More label="Source">
                <Cite source={s.source} status={s.status} />
              </More>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
