"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rules } from "@/lib/rules";
import { useStore } from "./Store";
import WaitPanel from "./WaitPanel";
import styles from "./page.module.css";

const SAMPLES = [
  {
    file: "fresno-county-duplex-option-1_sheets-1-7.pdf",
    type: "duplex",
    label: "Try a real duplex plan set",
    note: "Fresno County pre-approved plans, sheets 1–7",
  },
  {
    file: "fictional-duplex-passing.pdf",
    type: "duplex",
    label: "Try a passing duplex",
    note: "made up, written to meet every rule HouseX checks",
  },
  {
    file: "fictional-triplex-cover-sheet.pdf",
    type: "triplex",
    label: "Try the fictional triplex",
    note: "made up, with deliberate errors",
  },
];

// The check form: address, plan set, project type and district. Opens the report when done.
export default function PreCheck() {
  const router = useRouter();
  const {
    projectType,
    setProjectType,
    district,
    setDistrict,
    address,
    setAddress,
    setReport,
    setPkg,
  } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("projectType", projectType);
    body.append("district", district);
    body.append("address", address);
    try {
      const res = await fetch("/api/check", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setPkg(null);
      setReport(data);
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.address}>
        Project address
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city, ZIP"
          autoComplete="street-address"
          maxLength={200}
        />
        <span>
          Used to look up the lot&rsquo;s zoning, parcel size, flood zone and
          fire hazard zone
        </span>
      </label>
      <label className={styles.drop}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span>{file ? file.name : "Choose a plan set PDF"}</span>
      </label>
      <div className={styles.samples}>
        {SAMPLES.map((x) => (
          <button
            key={x.file}
            type="button"
            className={styles.sample}
            onClick={async () => {
              const blob = await (await fetch(`/samples/${x.file}`)).blob();
              setFile(new File([blob], x.file, { type: "application/pdf" }));
              setProjectType(x.type);
            }}
          >
            <span className={styles.sampleLabel}>{x.label}</span> {x.note}
          </button>
        ))}
      </div>
      <div className={styles.row}>
        <label>
          Project
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          >
            {rules.project_types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zoning district
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">Not sure</option>
            {rules.zoning_districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} {d.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!file || loading}>
          {loading ? "Reading plans…" : "Run pre-check"}
        </button>
      </div>
      {loading && (
        <WaitPanel
          title="Pre-checking your plan set"
          typical="1 to 2 minutes"
          steps={[
            { label: "Uploading your plan set", at: 0 },
            ...(address.trim() ? [{ label: "Looking up the lot in Irvine's zoning and parcel maps", at: 2 }] : []),
            { label: "AI is reading every sheet of your plans", at: 5 },
            { label: "AI is finding the project data: units, height, setbacks, parking", at: 22 },
            { label: "Checking against Irvine's submittal checklist", at: 42 },
            { label: "Checking zoning, building code and state housing law", at: 58 },
            { label: "Linking every finding to its source", at: 74 },
          ]}
        />
      )}
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
