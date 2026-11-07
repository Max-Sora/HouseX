// Shapes shared by the rule file, the Claude extraction step and the report.

export type Status = "VERIFIED" | "UNVERIFIED";

export interface Source {
  title: string;
  url: string;
  section?: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  applies_to: string[];
  detect_hints: string[];
  source: Source;
  status: Status;
  note?: string;
}

export interface ZoningDistrict {
  code: string;
  name: string;
  allows: string[];
  max_density_du_per_acre: number | null;
  min_lot_area_sf: number | null;
  max_height_ft: number | null;
  setbacks_ft: {
    front: number | null;
    side: number | null;
    rear: number | null;
  };
  max_lot_coverage_pct: number | null;
  parking_spaces_per_unit: number | null;
  source: Source;
  status: Status;
  note?: string;
}

export interface StateLawRule {
  id: string;
  rule: string;
  value?: number | null;
  unit?: string;
  applies_when?: string;
  source: Source;
  status: Status;
}

export interface CodeTrigger {
  id: string;
  rule: string;
  applies_to: string[];
  construction_types?: string[];
  applies_when: string;
  required_evidence_on_plans: string;
  source: Source;
  status: Status;
}

// "UL" = unlimited, as printed in the code tables.
export type Limits = Record<string, number | "UL" | null>;

export interface AllowableRow {
  occupancy: string;
  construction_type: string;
  height_ft: Limits;
  stories: Limits;
  area_per_story_sf: Limits;
  source: Source;
  status: Status;
}

export interface ConstructionRules {
  checked: string;
  code_edition: string;
  project_types: Record<string, { code: string; occupancy: string; note: string; source: Source; status: Status }>;
  allowable: AllowableRow[];
  requirements: {
    id: string;
    applies_to: string[];
    construction_types: string[];
    rule: string;
    required_evidence_on_plans: string;
    source: Source;
    status: Status;
  }[];
}

export interface RuleSet {
  city: string;
  checked: string;
  required_documents: RequiredDocument[];
  zoning_districts: ZoningDistrict[];
  state_law: StateLawRule[];
  code_triggers: CodeTrigger[];
  process: { id: string; rule: string; source: Source; status: Status }[];
  construction?: ConstructionRules;
}

// What Claude reads off the plan set. Every value is null when the plans do not say.
export interface ExtractedPlan {
  project: {
    address: string | null;
    jurisdiction_on_plans: string | null;
    project_type: "duplex" | "triplex" | "other" | "unknown";
    unit_count: number | null;
    stories: number | null;
    building_height_ft: number | null;
    lot_area_sf: number | null;
    total_floor_area_sf: number | null;
    lot_coverage_pct: number | null;
    zoning_district_on_plans: string | null;
    occupancy_group: string | null;
    construction_type: string | null;
    sprinklered: boolean | null;
    sprinkler_system: string | null;
    building_footprint_sf: number | null;
    parking_spaces: number | null;
    setbacks_ft: {
      front: number | null;
      side: number | null;
      rear: number | null;
    };
    code_editions_cited: string[];
  };
  sheet_index: { sheet_id: string; title: string }[];
  required_items: {
    id: string;
    status: "present" | "missing" | "unclear";
    evidence: string;
  }[];
  code_triggers: {
    id: string;
    status: "addressed" | "not_addressed" | "unclear" | "not_applicable";
    evidence: string;
  }[];
  outdated_citations: { text: string; why: string }[];
  notes: string;
}

export type FindingKind =
  | "missing_document"
  | "violation"
  | "passed"
  | "needs_human"
  | "unknown";

export interface Finding {
  kind: FindingKind;
  title: string;
  detail: string;
  planValue?: string;
  required?: string;
  evidence?: string;
  source?: Source;
  sourceStatus?: Status;
}

export interface Report {
  result: "PASS" | "FAIL" | "INCOMPLETE";
  city: string;
  rulesChecked: string;
  district: string | null;
  projectType: string;
  findings: Finding[];
  extracted: ExtractedPlan;
}
