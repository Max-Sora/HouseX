import type {
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

  // 2. Zoning: objective standards for the chosen district.
  const district =
    rules.zoning_districts.find((d) => d.code === districtCode) ?? null;
  if (district) findings.push(...zoningFindings(district, p));
  else
    findings.push({
      kind: "unknown",
      title: "Zoning district",
      detail:
        "No zoning district selected, so setbacks, height, density and parking were not checked.",
    });

  // 3. Building and energy code items the plans must show.
  for (const t of rules.code_triggers) {
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
