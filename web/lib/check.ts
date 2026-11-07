import type {
  ConstructionRules,
  ExtractedPlan,
  Finding,
  Report,
  RuleSet,
  ZoningDistrict,
} from "./types";

const fmt = (v: number | null, unit: string) =>
  v === null ? "not stated" : `${v} ${unit}`;

function zoningFindings(
  d: ZoningDistrict,
  p: ExtractedPlan["project"],
): Finding[] {
  const out: Finding[] = [];
  const base = { source: d.source, sourceStatus: d.status };

  // max: plan value must be <= limit; min: plan value must be >= limit
  const compare = (
    title: string,
    plan: number | null,
    limit: number | null,
    unit: string,
    mode: "max" | "min",
  ) => {
    if (limit === null) {
      out.push({
        kind: "unknown",
        title,
        detail: `City standard for district ${d.code} not confirmed, so this was not checked.`,
        ...base,
      });
      return;
    }
    if (plan === null) {
      out.push({
        kind: "unknown",
        title,
        detail:
          "The plans do not state this value. A plan checker will ask for it.",
        required: `${mode === "max" ? "≤" : "≥"} ${limit} ${unit}`,
        ...base,
      });
      return;
    }
    const ok = mode === "max" ? plan <= limit : plan >= limit;
    out.push({
      kind: ok ? "passed" : "violation",
      title,
      detail: ok
        ? "Meets the district standard."
        : `Plan shows ${plan} ${unit}; district ${d.code} ${mode === "max" ? "allows at most" : "requires at least"} ${limit} ${unit}.`,
      planValue: fmt(plan, unit),
      required: `${mode === "max" ? "≤" : "≥"} ${limit} ${unit}`,
      ...base,
    });
  };

  compare(
    "Building height",
    p.building_height_ft,
    d.max_height_ft,
    "ft",
    "max",
  );
  compare(
    "Front setback",
    p.setbacks_ft.front,
    d.setbacks_ft.front,
    "ft",
    "min",
  );
  compare("Side setback", p.setbacks_ft.side, d.setbacks_ft.side, "ft", "min");
  compare("Rear setback", p.setbacks_ft.rear, d.setbacks_ft.rear, "ft", "min");
  compare(
    "Lot coverage",
    p.lot_coverage_pct,
    d.max_lot_coverage_pct,
    "%",
    "max",
  );
  compare("Lot area", p.lot_area_sf, d.min_lot_area_sf, "sf", "min");

  const density =
    p.unit_count !== null && p.lot_area_sf
      ? +(p.unit_count / (p.lot_area_sf / 43560)).toFixed(1)
      : null;
  compare("Density", density, d.max_density_du_per_acre, "units/acre", "max");

  const parkingRequired =
    d.parking_spaces_per_unit !== null && p.unit_count !== null
      ? d.parking_spaces_per_unit * p.unit_count
      : null;
  compare("Parking spaces", p.parking_spaces, parkingRequired, "spaces", "min");
  return out;
}

// "Type V-B", "VB", "v-b" -> "V-B"
export function normalizeType(raw: string | null): string | null {
  const m = raw?.toUpperCase().replace(/TYPE|\s/g, "").match(/^(IV|V|I{1,3})-?(A|B|HT)$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function sprinklerColumn(p: ExtractedPlan["project"]): string {
  const s = (p.sprinkler_system ?? "").toUpperCase().replace(/\s/g, "");
  if (s.includes("13R")) return "S13R";
  if (s.includes("13D")) return "S13D";
  if (s.includes("13")) return "S";
  return "NS";
}

function constructionFindings(c: ConstructionRules, projectType: string, p: ExtractedPlan["project"]): Finding[] {
  const pt = c.project_types[projectType];
  if (!pt) return [];
  const type = normalizeType(p.construction_type);
  if (!type) {
    return [{
      kind: "unknown",
      title: "Construction type",
      detail: "The plans do not state a construction type (for example V-B), so allowable height, stories and area were not checked.",
      source: pt.source,
      sourceStatus: pt.status,
    }];
  }
  const row = c.allowable.find((r) => r.occupancy === pt.occupancy && r.construction_type === type);
  if (!row) {
    return [{ kind: "unknown", title: `Construction type ${type}`, detail: `No verified ${c.code_edition} limits for ${pt.occupancy} Type ${type}.` }];
  }
  const col = sprinklerColumn(p);
  const label = `${pt.occupancy}, Type ${type}, ${col === "NS" ? "no sprinklers" : col}`;
  const out: Finding[] = [];
  const limit = (title: string, plan: number | null, max: number | null | undefined, unit: string) => {
    if (max === null || max === undefined) {
      out.push({ kind: "unknown", title, detail: `No verified limit for ${label}.`, source: row.source, sourceStatus: row.status });
    } else if (plan === null) {
      out.push({ kind: "unknown", title, detail: "The plans do not state this value.", required: `≤ ${max} ${unit}`, source: row.source, sourceStatus: row.status });
    } else {
      const ok = plan <= max;
      out.push({
        kind: ok ? "passed" : "violation",
        title,
        detail: ok ? `Within the limit for ${label}.` : `Plan shows ${plan} ${unit}; ${label} allows at most ${max} ${unit}.`,
        planValue: `${plan} ${unit}`,
        required: `≤ ${max} ${unit}`,
        source: row.source,
        sourceStatus: row.status,
      });
    }
  };
  limit("Allowable height (construction type)", p.building_height_ft, row.height_ft[col], "ft");
  limit("Allowable stories (construction type)", p.stories, row.stories[col], "stories");
  limit("Allowable area per story (construction type)", p.building_footprint_sf, row.area_per_story_sf[col === "S" ? "S1" : col], "sf");
  return out;
}

export function runCheck(
  rules: RuleSet,
  plan: ExtractedPlan,
  districtCode: string | null,
  projectType: string,
): Report {
  const findings: Finding[] = [];
  const p = plan.project;

  // 1. Completeness: every required document for this project type.
  for (const doc of rules.required_documents.filter((d) =>
    d.applies_to.includes(projectType),
  )) {
    const seen = plan.required_items.find((r) => r.id === doc.id);
    const status = seen?.status ?? "missing";
    findings.push({
      kind: status === "present" ? "passed" : "missing_document",
      title: doc.name,
      detail:
        status === "present"
          ? "Included in the plan set."
          : status === "unclear"
            ? "Referenced but not included in this PDF."
            : doc.description,
      evidence: seen?.evidence,
      source: doc.source,
      sourceStatus: doc.status,
    });
  }

  // 2. Zoning: objective standards for the chosen district, or the one printed on the plans.
  const fromPlans = p.zoning_district_on_plans?.match(/\d+\.\d+/)?.[0] ?? null;
  const district =
    rules.zoning_districts.find(
      (d) => d.code === (districtCode || fromPlans),
    ) ?? null;
  if (district) findings.push(...zoningFindings(district, p));
  else
    findings.push({
      kind: "unknown",
      title: "Zoning district",
      detail:
        "No zoning district selected, so setbacks, height, density and parking were not checked.",
    });

  // 3. Building and energy code items the plans must show.
  const type = normalizeType(p.construction_type);
  if (rules.construction) findings.push(...constructionFindings(rules.construction, projectType, p));
  for (const t of rules.code_triggers.filter((t) => t.applies_to.includes(projectType))) {
    const ct = t.construction_types;
    if (ct && !ct.includes("any") && type && !ct.includes(type)) continue;
    const seen = plan.code_triggers.find((c) => c.id === t.id);
    if (!seen || seen.status === "not_applicable") continue;
    findings.push({
      kind:
        seen.status === "addressed"
          ? "passed"
          : seen.status === "not_addressed"
            ? "violation"
            : "needs_human",
      title: t.rule,
      detail:
        seen.status === "addressed"
          ? "Shown on the plans."
          : `Plans should show: ${t.required_evidence_on_plans}`,
      evidence: seen.evidence,
      source: t.source,
      sourceStatus: t.status,
    });
  }

  // 4. Outdated legal or code citations printed on the plans.
  for (const c of plan.outdated_citations) {
    findings.push({
      kind: "violation",
      title: `Outdated citation: ${c.text}`,
      detail: c.why,
    });
  }

  // 5. What HouseX never decides.
  findings.push({
    kind: "needs_human",
    title: "Structural and MEP review",
    detail:
      "HouseX does not check structural, mechanical, electrical or plumbing design. A licensed plan checker must review these.",
  });

  const has = (k: Finding["kind"]) => findings.some((f) => f.kind === k);
  const result =
    has("missing_document") || has("violation")
      ? "FAIL"
      : has("unknown")
        ? "INCOMPLETE"
        : "PASS";

  return {
    result,
    city: rules.city,
    rulesChecked: rules.checked,
    district: district?.code ?? null,
    projectType,
    findings,
    extracted: plan,
  };
}
