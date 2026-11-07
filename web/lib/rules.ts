import type { ConstructionRules, RuleSet } from "./types";
import irvine from "@/data/irvine-rules.json";
import construction from "@/data/construction-types.json";
import more from "@/data/new-project-types.json";

const c = construction as ConstructionRules;
const base = irvine as RuleSet;
// SFR, SFR + ADU and mixed-use rules, researched separately and merged here.
const extra = more as unknown as {
  project_types: { id: string; label: string }[];
  existing_document_ids_by_type: Record<string, string[]>;
  new_required_documents: RuleSet["required_documents"];
  existing_code_trigger_ids_by_type: Record<string, string[]>;
  new_code_triggers: RuleSet["code_triggers"];
  new_state_law: RuleSet["state_law"];
  new_zoning_districts: RuleSet["zoning_districts"];
  construction_project_types: ConstructionRules["project_types"];
  new_construction_requirements: ConstructionRules["requirements"];
};

// Add a new project type to every existing rule the research tagged for it.
function tag<T extends { id: string; applies_to: string[] }>(items: T[], byType: Record<string, string[]>): T[] {
  return items.map((item) => ({
    ...item,
    applies_to: [...item.applies_to, ...Object.keys(byType).filter((t) => byType[t].includes(item.id))],
  }));
}

const allConstruction: ConstructionRules = {
  ...c,
  project_types: { ...c.project_types, ...extra.construction_project_types },
  requirements: [...c.requirements, ...extra.new_construction_requirements],
};

export const rules: RuleSet = {
  ...base,
  project_types: [
    { id: "duplex", label: "Duplex (2 units)" },
    { id: "triplex", label: "Triplex (3 units)" },
    ...extra.project_types,
  ],
  construction: allConstruction,
  required_documents: [
    ...tag(base.required_documents, extra.existing_document_ids_by_type),
    ...extra.new_required_documents,
  ],
  zoning_districts: [...base.zoning_districts, ...extra.new_zoning_districts].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  ),
  state_law: [...base.state_law, ...extra.new_state_law],
  // Construction-type requirements join the city's code checklist so they are read, checked and shown the same way.
  code_triggers: [
    ...tag(base.code_triggers, extra.existing_code_trigger_ids_by_type),
    ...extra.new_code_triggers,
    ...allConstruction.requirements.map((r) => ({
      id: r.id,
      rule: r.rule,
      applies_to: r.applies_to,
      construction_types: r.construction_types,
      applies_when: r.construction_types.includes("any")
        ? "Any construction type."
        : `Construction type ${r.construction_types.join(", ")}.`,
      required_evidence_on_plans: r.required_evidence_on_plans,
      source: r.source,
      status: r.status,
    })),
  ],
};
