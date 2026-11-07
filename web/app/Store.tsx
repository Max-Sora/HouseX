"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { FixPackage } from "@/lib/fix";
import type { Report } from "@/lib/types";
import { DEFAULTS, type Assumptions } from "./Savings";

// Shared across pages so a report, its fix package and the savings inputs survive navigation.
// Also kept in sessionStorage so a reload of the tab keeps them.
interface Store {
  loaded: boolean;
  projectType: string;
  setProjectType: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  report: Report | null;
  setReport: (r: Report | null) => void;
  pkg: FixPackage | null;
  setPkg: (p: FixPackage | null) => void;
  assume: Assumptions;
  setAssume: (a: Assumptions) => void;
  fixing: boolean;
  fixError: string | null;
  draft: () => Promise<boolean>;
}

const Ctx = createContext<Store | null>(null);
const KEY = "housex-session";

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projectType, setProjectType] = useState("duplex");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [pkg, setPkg] = useState<FixPackage | null>(null);
  const [assume, setAssume] = useState<Assumptions>(DEFAULTS);
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      if (saved) {
        setProjectType(saved.projectType ?? "duplex");
        setDistrict(saved.district ?? "");
        setAddress(saved.address ?? "");
        setReport(saved.report ?? null);
        setPkg(saved.pkg ?? null);
        setAssume({ ...DEFAULTS, ...saved.assume });
      }
    } catch {
      // storage unavailable or corrupt: start empty
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(
        KEY,
        JSON.stringify({ projectType, district, address, report, pkg, assume }),
      );
    } catch {
      // storage full or blocked: state still lives in memory
    }
  }, [loaded, projectType, district, address, report, pkg, assume]);

  async function draft() {
    if (!report) return false;
    setFixing(true);
    setFixError(null);
    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Drafting failed");
      setPkg(data);
      return true;
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "Drafting failed");
      return false;
    } finally {
      setFixing(false);
    }
  }

  return (
    <Ctx.Provider
      value={{
        loaded,
        projectType,
        setProjectType,
        district,
        setDistrict,
        address,
        setAddress,
        report,
        setReport,
        pkg,
        setPkg,
        assume,
        setAssume,
        fixing,
        fixError,
        draft,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
