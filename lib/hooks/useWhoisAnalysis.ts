"use client";

import { useCallback, useState } from "react";
import { analyzeDomain } from "@/lib/whois";

export type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok";
      registrarRaw: string | null;
      registrarValue: string | null;
      hasExpiration: boolean;
    }
  | { status: "blocked"; registrarRaw: string }
  | { status: "unregistered" }
  | { status: "error"; message: string };

interface UseWhoisAnalysisOptions {
  setExpiration: (value: string) => void;
  setRegistrar: (value: string) => void;
}

export function useWhoisAnalysis({ setExpiration, setRegistrar }: UseWhoisAnalysisOptions) {
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [registrarBlocked, setRegistrarBlocked] = useState(false);

  const updateRegistrar = useCallback(
    (value: string) => {
      setRegistrar(value);
      setRegistrarBlocked(false);
    },
    [setRegistrar]
  );

  const run = useCallback(
    async (domain: string) => {
      setAnalysis({ status: "loading" });
      try {
        const result = await analyzeDomain(domain);
        if (!result.registrar.allowed) {
          setRegistrar("");
          setExpiration(result.expirationDate ?? "");
          setRegistrarBlocked(true);
          setAnalysis({
            status: "blocked",
            registrarRaw: result.registrar.raw ?? "Unknown registrar",
          });
        } else if (!result.registered) {
          setRegistrarBlocked(false);
          setAnalysis({ status: "unregistered" });
        } else {
          const value = result.registrar.value ?? "";
          setRegistrar(value);
          setExpiration(result.expirationDate ?? "");
          setRegistrarBlocked(false);
          setAnalysis({
            status: "ok",
            registrarRaw: result.registrar.raw,
            registrarValue: value || null,
            hasExpiration: !!result.expirationDate,
          });
        }
      } catch (err) {
        setRegistrarBlocked(false);
        setAnalysis({
          status: "error",
          message: err instanceof Error ? err.message : "WHOIS lookup failed",
        });
      }
    },
    [setExpiration, setRegistrar]
  );

  const reset = useCallback(() => {
    setAnalysis({ status: "idle" });
    setRegistrarBlocked(false);
  }, []);

  return { analysis, registrarBlocked, updateRegistrar, run, reset };
}
