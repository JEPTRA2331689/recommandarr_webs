"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { EngineMetrics } from "@/types";
import { Navbar } from "@/components/Navbar";

type ActionStatus = "idle" | "running" | "done" | "error";

interface Action {
  id: string;
  label: string;
  desc: string;
  endpoint: string;
  method: "POST" | "DELETE";
  icon: React.ReactNode;
  status: ActionStatus;
  lastMessage: string;
}

function IconRefresh() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

const INITIAL_ACTIONS: Omit<Action, "status" | "lastMessage">[] = [
  {
    id: "update",
    label: "Mettre à jour le profil",
    desc: "Recalcule tes goûts à partir de tous tes swipes. À faire après une session de swipe intensive.",
    endpoint: "/api/recommendations/profile/update",
    method: "POST",
    icon: <IconBrain />,
  },
  {
    id: "discover",
    label: "Régénérer le Discover",
    desc: "Recalcule tes sections de recommandations personnalisées. À faire si tes recommandations semblent obsolètes.",
    endpoint: "/api/recommendations/discover",
    method: "POST",
    icon: <IconRefresh />,
  },
  {
    id: "enrich",
    label: "Enrichir la bibliothèque",
    desc: "Récupère les métadonnées TMDB manquantes (affiches, synopsis, genres) pour les films importés.",
    endpoint: "/api/tmdb/enrich",
    method: "POST",
    icon: <IconSparkle />,
  },
];

function ActionCard({
  action,
  onRun,
}: {
  action: Action;
  onRun: (id: string) => void;
}) {
  const isRunning = action.status === "running";

  return (
    <div className="flex items-start gap-4 rounded-card border border-border bg-surface p-5">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-button border transition-colors ${
        action.status === "done" ? "border-success/30 bg-success/10 text-success"
        : action.status === "error" ? "border-error/30 bg-error/10 text-error"
        : "border-secondary/20 bg-secondary/8 text-secondary"
      }`}>
        {isRunning ? (
          <div className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        ) : action.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary text-sm">{action.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{action.desc}</p>
        {action.lastMessage && (
          <p className={`mt-2 text-xs font-medium ${action.status === "error" ? "text-error" : "text-success"}`}>
            {action.lastMessage}
          </p>
        )}
      </div>
      <button
        onClick={() => onRun(action.id)}
        disabled={isRunning}
        className="flex-shrink-0 rounded-button border border-border px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-secondary/40 hover:text-secondary disabled:opacity-40 disabled:pointer-events-none"
      >
        {isRunning ? "En cours…" : "Lancer"}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { accessKey, logout, clearToken } = useAppStore();

  function handleLogout() {
    clearToken();
    router.replace("/");
  }
  const { ready } = useAuthGuard(true);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [actions, setActions] = useState<Action[]>(
    INITIAL_ACTIONS.map((a) => ({ ...a, status: "idle", lastMessage: "" }))
  );

  // ── Delete flow ──────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    api.get<EngineMetrics>("/api/metrics/engine").then(setMetrics).catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (showDeleteModal) {
      setTimeout(() => deleteInputRef.current?.focus(), 100);
    } else {
      setDeleteInput("");
      setDeleteError("");
    }
  }, [showDeleteModal]);

  function updateAction(id: string, patch: Partial<Action>) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function runAction(id: string) {
    const action = actions.find((a) => a.id === id);
    if (!action) return;
    updateAction(id, { status: "running", lastMessage: "" });
    try {
      await api.post(action.endpoint);
      updateAction(id, { status: "done", lastMessage: "Terminé avec succès." });
    } catch (e: unknown) {
      updateAction(id, {
        status: "error",
        lastMessage: e instanceof Error ? e.message : "Erreur — vérifie que le backend est actif.",
      });
    }
  }

  async function handleDelete() {
    if (!accessKey || deleteInput.trim().toUpperCase() !== accessKey) {
      setDeleteError("La clé saisie ne correspond pas à ton identifiant.");
      return;
    }
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await api.delete("/api/beta/account");
      clearToken();
      logout();
      router.replace("/");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Erreur lors de la suppression.");
      setDeleteLoading(false);
    }
  }

  if (!ready) return null;

  const pearson = metrics?.pearsonCorrelation;
  const mae = metrics?.mae;
  const totalSwipes = metrics?.totalSwipes ?? 0;
  const progress = metrics ? Math.min(100, Math.round((metrics.coldStartProgress ?? 0) * 100)) : 0;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <Navbar activePage="recommendations" variant="overlay" />


      <main className="mx-auto max-w-4xl px-6 py-12 space-y-10">

        {/* ── Identifiant ─────────────────────────────────── */}
        <section>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Mon compte</h1>
          <div className="rounded-card border border-secondary/25 bg-secondary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Clé d'accès unique</p>
              <p className="font-display text-3xl font-bold tracking-[0.2em] text-secondary">{accessKey}</p>
              <p className="mt-1 text-xs text-text-secondary">C'est ton seul identifiant. Ne la partage pas.</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(accessKey ?? "")}
              className="flex-shrink-0 rounded-pill border border-secondary/30 px-4 py-2 text-sm text-secondary hover:bg-secondary/10 transition-colors"
            >
              Copier
            </button>
          </div>
        </section>

        {/* ── Métriques ────────────────────────────────────── */}
        {metrics && (
          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">État du moteur</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Swipes", value: totalSwipes.toString(), color: "text-text-primary" },
                { label: "Pearson", value: pearson != null ? pearson.toFixed(3) : "—", color: "text-secondary" },
                { label: "MAE", value: mae != null ? mae.toFixed(2) : "—", color: "text-error" },
                { label: "Cold start", value: `${progress}%`, color: "text-success" },
              ].map((m) => (
                <div key={m.label} className="rounded-card border border-border bg-surface p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">{m.label}</p>
                  <p className={`font-display text-2xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-surface-alt overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">
                {(metrics.swipesForReliableMetrics - totalSwipes) > 0
                  ? `Encore ${metrics.swipesForReliableMetrics - totalSwipes} swipes pour des métriques fiables`
                  : "Métriques fiables ✓"}
              </p>
            </div>
          </section>
        )}

        {/* ── Actions moteur ───────────────────────────────── */}
        <section>
          <h2 className="font-display text-lg font-semibold text-text-primary mb-1">Actions manuelles</h2>
          <p className="text-sm text-text-secondary mb-4">Lance manuellement les opérations du moteur de recommandation.</p>
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} onRun={runAction} />
            ))}
          </div>
        </section>

        {/* ── Navigation rapide ────────────────────────────── */}
        <section className="flex gap-3">
          <Link
            href="/swipe"
            className="flex-1 rounded-button bg-primary py-3 text-center text-sm font-semibold text-text-primary hover:brightness-110 transition-all"
          >
            Swiper des films →
          </Link>
          <Link
            href="/recommendations"
            className="flex-1 rounded-button border border-border py-3 text-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Mes recommandations
          </Link>
        </section>

        {/* ── Zone danger ──────────────────────────────────── */}
        <section>
          <div className="rounded-card border border-error/25 bg-error/5 p-6">
            <h2 className="font-display text-base font-semibold text-error mb-1">Zone dangereuse</h2>
            <p className="text-sm text-text-secondary mb-4">
              Supprimer ton compte efface définitivement ta clé d'accès, ton profil de goûts et tous tes swipes. Cette action est irréversible.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-button border border-error/40 px-5 py-2.5 text-sm font-semibold text-error hover:bg-error/10 transition-colors"
            >
              Supprimer mon compte
            </button>
          </div>
        </section>

      </main>

      {/* ── Modal confirmation suppression ───────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-sheet border border-error/30 bg-surface p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-error/15 border border-error/30">
                <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Supprimer le compte ?</p>
                <p className="mt-0.5 text-xs text-text-secondary">Cette action est définitive et irréversible.</p>
              </div>
            </div>

            <div className="mb-4 rounded-input border border-error/20 bg-error/5 px-3 py-2.5">
              <p className="text-xs text-text-secondary">
                Écris ta clé d'accès pour confirmer :{" "}
                <span className="font-mono font-bold text-error">{accessKey}</span>
              </p>
            </div>

            <input
              ref={deleteInputRef}
              type="text"
              value={deleteInput}
              onChange={(e) => { setDeleteInput(e.target.value.toUpperCase()); setDeleteError(""); }}
              placeholder={accessKey ?? "XXXX-YYYY"}
              maxLength={9}
              className="mb-3 w-full rounded-input border border-border bg-surface-alt px-4 py-3 text-center font-display text-xl tracking-[0.2em] text-text-primary placeholder-text-secondary/30 focus:border-error focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            />

            {deleteError && (
              <p className="mb-3 text-xs text-error">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-button border border-border py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteInput !== accessKey}
                className="flex-1 rounded-button bg-error py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Suppression…
                  </span>
                ) : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
