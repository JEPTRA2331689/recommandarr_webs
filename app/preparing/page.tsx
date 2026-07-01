"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { BetaLoginResult } from "@/types";

type StepStatus = "pending" | "running" | "done" | "error";

interface Step {
  id: string;
  label: string;
  sublabel: string;
  status: StepStatus;
}

const INITIAL_STEPS: Step[] = [
  {
    id: "login",
    label: "Activation de ton accès",
    sublabel: "Génération du token d'authentification",
    status: "pending",
  },
  {
    id: "profile",
    label: "Construction du profil de goûts",
    sublabel: "Analyse des genres, réalisateurs et acteurs de ta bibliothèque",
    status: "pending",
  },
  {
    id: "discover",
    label: "Génération de ton premier Discover",
    sublabel: "Le moteur calcule tes premières recommandations personnalisées",
    status: "pending",
  },
  {
    id: "ready",
    label: "Moteur prêt",
    sublabel: "Tout est en place pour ton premier swipe",
    status: "pending",
  },
];

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success/20 border border-success/40">
        <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/20 border border-secondary/40">
        <div className="h-3.5 w-3.5 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-error/20 border border-error/40">
        <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt border border-border">
      <div className="h-2 w-2 rounded-full bg-text-secondary/30" />
    </div>
  );
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      setValue(Math.floor(target * (1 - Math.pow(1 - progress, 3))));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{value}</>;
}

export default function PreparingPage() {
  const router = useRouter();
  const { accessKey: storedKey, _hasHydrated, setToken } = useAppStore();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [accessKey, setLocalAccessKey] = useState<string | null>(null);
  const [libraryCount] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [fatalError, setFatalError] = useState("");
  const [copied, setCopied] = useState(false);
  const ran = useRef(false);

  function setStep(id: string, status: StepStatus) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }

  function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  useEffect(() => {
    if (!_hasHydrated) return;
    if (ran.current) return;
    ran.current = true;

    const key = storedKey;
    if (!key) {
      router.replace("/onboarding");
      return;
    }
    setLocalAccessKey(key);

    async function run() {
      // ── Étape 1 : Login ──────────────────────────────────────
      setStep("login", "running");
      try {
        const result = await api.post<BetaLoginResult>(
          "/api/beta/login",
          { accessKey: key },
          { skipAuth: true }
        );
        setToken(result.token);
        setStep("login", "done");
      } catch {
        setStep("login", "error");
        setFatalError("Impossible d'activer l'accès. Retourne à l'onboarding et réessaie.");
        return;
      }

      // ── Étape 2 : Construction du profil ─────────────────────
      await delay(600);
      setStep("profile", "running");
      try {
        await api.post("/api/recommendations/profile/update");
        setStep("profile", "done");
      } catch {
        setStep("profile", "error");
      }

      // ── Étape 3 : Premier Discover ────────────────────────────
      await delay(600);
      setStep("discover", "running");
      try {
        await api.post("/api/recommendations/discover");
        setStep("discover", "done");
      } catch {
        setStep("discover", "error");
      }

      // ── Étape 4 : Prêt ───────────────────────────────────────
      await delay(600);
      setStep("ready", "running");
      await delay(800);
      setStep("ready", "done");
      setAllDone(true);
    }

    run();
  }, [router, setToken, storedKey, _hasHydrated]);


  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = (doneCount / steps.length) * 100;

  if (fatalError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="rounded-card border border-error/30 bg-error/5 p-8 max-w-sm w-full">
          <svg className="mx-auto mb-4 h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="font-semibold text-text-primary mb-2">Une erreur est survenue</p>
          <p className="text-sm text-text-secondary mb-6">{fatalError}</p>
          <Link
            href="/onboarding"
            className="inline-block rounded-button bg-primary px-6 py-3 text-sm font-semibold text-text-primary hover:brightness-110 transition-all"
          >
            Retourner à l'onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header minimal */}
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold text-text-primary">
          Swipe<span className="text-secondary">Film</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Titre */}
          <div className="mb-10 text-center">
            {allDone ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 border border-success/30">
                  <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h1 className="font-display text-3xl font-bold text-text-primary">Tout est prêt !</h1>
                <p className="mt-2 text-text-secondary">Ton profil est actif. Commence à swiper.</p>
              </>
            ) : (
              <>
                <div className="relative mx-auto mb-4 h-14 w-14">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-alt" />
                    <circle
                      cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3"
                      className="text-secondary transition-all duration-700"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-secondary">
                    {Math.round(progress)}%
                  </span>
                </div>
                <h1 className="font-display text-3xl font-bold text-text-primary">Préparation en cours…</h1>
                <p className="mt-2 text-text-secondary">On configure tout pour toi, ça prend quelques secondes.</p>
              </>
            )}
          </div>

          {/* Barre de progression globale */}
          <div className="mb-8 h-1 w-full rounded-full bg-surface-alt overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Étapes */}
          <div className="space-y-3 mb-8">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-card border p-4 transition-all duration-500 ${
                  step.status === "running"
                    ? "border-secondary/30 bg-secondary/5"
                    : step.status === "done"
                    ? "border-success/20 bg-success/5"
                    : step.status === "error"
                    ? "border-error/30 bg-error/5"
                    : "border-border bg-surface opacity-50"
                }`}
              >
                <StepIcon status={step.status} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold transition-colors ${
                    step.status === "done" ? "text-success"
                    : step.status === "running" ? "text-text-primary"
                    : step.status === "error" ? "text-error"
                    : "text-text-secondary"
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{step.sublabel}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats après discover */}
          {libraryCount > 0 && (
            <div className="mb-6 rounded-card border border-secondary/20 bg-secondary/5 p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Films prêts à découvrir</p>
              <p className="font-display text-4xl font-bold text-secondary">
                <CountUp target={libraryCount} />
              </p>
            </div>
          )}

          {/* Clé d'accès */}
          {allDone && accessKey && (
            <div className="mb-6 rounded-card border border-border bg-surface p-5 text-center">
              <p className="text-xs text-text-secondary mb-2">Ta clé d'accès — note-la !</p>
              <p className="font-display text-3xl font-bold tracking-[0.25em] text-secondary mb-3">
                {accessKey}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(accessKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-pill border border-secondary/30 px-4 py-1.5 text-xs text-secondary hover:bg-secondary/10 transition-colors"
              >
                {copied ? "✓ Copié !" : "Copier la clé"}
              </button>
            </div>
          )}

          {/* CTA final */}
          {allDone && (
            <div className="space-y-3">
              <button
                onClick={() => router.push("/swipe")}
                className="w-full rounded-button bg-primary py-4 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Commencer à swiper →
              </button>
              <button
                onClick={() => router.push("/account")}
                className="w-full rounded-button border border-border py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Mon compte
              </button>
            </div>
          )}

          {/* Message pendant le chargement */}
          {!allDone && !fatalError && (
            <p className="text-center text-xs text-text-secondary">
              Ne ferme pas cette page — la préparation se lance en ce moment.
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
