import type { ConstructionRules, RuleSet } from "./types";
import irvine from "@/data/irvine-rules.json";
import construction from "@/data/construction-types.json";

const c = construction as ConstructionRules;
const base = irvine as RuleSet;

// Construction-type requirements join the city's code checklist so they are read, checked and shown the same way.
export const rules: RuleSet = {
  ...base,
  project_types: [
    { id: "duplex", label: "Duplex (2 units)" },
    { id: "triplex", label: "Triplex (3 units)" },
  ],
  construction: c,
  code_triggers: [
    ...base.code_triggers,
    ...c.requirements.map((r) => ({
      id: r.id,
      rule: r.rule,
      applies_to: r.applies_to,
      construction_types: r.construction_types,
      applies_when: r.construction_types.includes("any") ? "Any construction type." : `Construction type ${r.construction_types.join(", ")}.`,
      required_evidence_on_plans: r.required_evidence_on_plans,
      source: r.source,
      status: r.status,
    })),
  ],
};
