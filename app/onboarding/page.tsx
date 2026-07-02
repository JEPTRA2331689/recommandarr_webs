"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { BetaLoginResult } from "@/types";

type Tab = "new" | "return";
type NewStep = "build" | "paste" | "importing";

function JellyfinLinkBuilder({ onUrlReady }: { onUrlReady: (url: string) => void }) {
  const [serverIp, setServerIp] = useState("");
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  const port = serverIp.includes(":") ? "" : ":8096";
  const base = serverIp ? `http://${serverIp}${port}` : "";
  const generatedUrl = base && userId && apiKey
    ? `${base}/Users/${userId}/Items?Recursive=true&IncludeItemTypes=Movie,Series&Fields=ProviderIds,UserData,RunTimeTicks&api_key=${apiKey}`
    : "";

  function copyAndContinue() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    onUrlReady(generatedUrl);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Step 1 */}
      <div className="rounded-card border border-border bg-surface p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[11px] font-bold text-secondary">1</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-1">Adresse IP de ton serveur Jellyfin</p>
            <p className="text-xs text-text-secondary mb-2">Regarde l'URL quand tu ouvres Jellyfin dans ton navigateur. Ex : <code className="text-secondary">192.168.2.45</code> ou <code className="text-secondary">192.168.2.45:8096</code></p>
            <input
              type="text"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value.trim())}
              placeholder="192.168.2.45 ou 192.168.2.45:8096"
              className="w-full rounded-input border border-border bg-surface-alt px-3 py-2 font-mono text-sm text-text-primary placeholder-text-secondary/40 focus:border-secondary focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-card border border-border bg-surface p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[11px] font-bold text-secondary">2</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-1">Ton User ID Jellyfin</p>
            <p className="text-xs text-text-secondary mb-1">Dans Jellyfin :</p>
            <ol className="text-xs text-text-secondary space-y-0.5 list-decimal list-inside mb-2">
              <li>Tableau de bord → <strong className="text-text-primary">Utilisateurs</strong></li>
              <li>Clique sur ton nom → regarde l'URL</li>
              <li>L'URL contient <code className="text-secondary">userId=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</code></li>
            </ol>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value.trim())}
              placeholder="0ddca661ccb2482dbbc389210b9d4b25"
              className="w-full rounded-input border border-border bg-surface-alt px-3 py-2 font-mono text-sm text-text-primary placeholder-text-secondary/40 focus:border-secondary focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-card border border-border bg-surface p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[11px] font-bold text-secondary">3</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-1">Ta clé API Jellyfin</p>
            <p className="text-xs text-text-secondary mb-1">Dans Jellyfin :</p>
            <ol className="text-xs text-text-secondary space-y-0.5 list-decimal list-inside mb-2">
              <li>Tableau de bord → <strong className="text-text-primary">Clés API</strong> (section Avancé)</li>
              <li>Clique <strong className="text-text-primary">+ Nouvelle clé</strong></li>
              <li>Nom : <code className="text-secondary">Recommandarr</code> → confirme</li>
              <li>Copie la clé générée</li>
            </ol>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-input border border-border bg-surface-alt px-3 py-2 font-mono text-sm text-text-primary placeholder-text-secondary/40 focus:border-secondary focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Generated URL */}
      {generatedUrl ? (
        <div className="rounded-card border border-secondary/30 bg-secondary/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-widest">Ton lien généré</p>
          <p className="break-all rounded-input bg-surface-alt px-3 py-2 font-mono text-[11px] text-text-primary leading-relaxed">
            {generatedUrl}
          </p>
          <div className="flex gap-2">
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-button border border-secondary/30 py-2.5 text-center text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors"
            >
              Ouvrir dans le navigateur →
            </a>
            <button
              onClick={copyAndContinue}
              className="rounded-button bg-primary px-4 py-2.5 text-sm font-semibold text-text-primary hover:brightness-110 transition-all"
            >
              {copied ? "✓ Copié !" : "Copier"}
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            Ouvre le lien, tu verras un JSON. Copie tout (<kbd className="rounded bg-surface-alt px-1 text-text-primary">Ctrl+A</kbd> → <kbd className="rounded bg-surface-alt px-1 text-text-primary">Ctrl+C</kbd>) puis colle-le à l'étape suivante.
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-text-secondary">
          Remplis les 3 champs pour générer ton lien.
        </p>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setToken, setAccessKey } = useAppStore();
  const [tab, setTab] = useState<Tab>("new");

  // ── Tab "Nouveau" ──
  const [newStep, setNewStep] = useState<NewStep>("build");
  const [email, setEmail] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [importError, setImportError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Tab "Retour" ──
  const [returnKey, setReturnKey] = useState("");
  const [returnError, setReturnError] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  async function handleImport() {
    setImportError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setImportError("Saisis une adresse email valide.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      setImportError("JSON invalide. Vérifie que tu as bien copié la réponse complète.");
      return;
    }

    // Jellyfin wraps items in { Items: [...] } — extract the array
    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as { Items?: unknown[] }).Items ?? parsed;

    setNewStep("importing");
    try {
      const result = await api.post<{ accessKey: string }>("/api/beta/import", { email: trimmedEmail, items }, { skipAuth: true });
      setAccessKey(result.accessKey);
      router.push("/preparing");
    } catch (e: unknown) {
      setNewStep("paste");
      setImportError(e instanceof Error ? e.message : "Erreur lors de l'import. Réessaie.");
    }
  }

  async function handleReturnLogin() {
    const key = returnKey.trim();
    if (!key) return;
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
      setReturnError("Format invalide. La clé doit être du type XXXX-YYYY (lettres et chiffres).");
      return;
    }
    setReturnError("");
    setReturnLoading(true);
    try {
      const result = await api.post<BetaLoginResult>("/api/beta/login", { accessKey: returnKey.trim() }, { skipAuth: true });
      setToken(result.token);
      setAccessKey(returnKey.trim());
      router.push("/recommendations");
    } catch (e: unknown) {
      setReturnError(e instanceof Error ? e.message : "Clé invalide ou expirée.");
    } finally {
      setReturnLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header minimal */}
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold text-text-primary">
          Swipe<span className="text-accent">Film</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Titre */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold text-text-primary">Accès beta</h1>
            <p className="mt-2 text-text-secondary">
              Première fois ou tu reviens avec ta clé ?
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex rounded-input border border-border bg-surface p-1">
            {([ { id: "new", label: "Nouveau" }, { id: "return", label: "Déjà un compte" } ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-input py-2.5 text-sm font-medium transition-all ${
                  tab === t.id
                    ? "bg-primary text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Nouveau ── */}
          {tab === "new" && (
            <div>
              {/* Progress indicator */}
              {(newStep === "build" || newStep === "paste") && (
                <div className="mb-6 flex items-center gap-2">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${newStep === "build" || newStep === "paste" ? "bg-secondary" : "bg-border"}`} />
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${newStep === "paste" ? "bg-secondary" : "bg-border"}`} />
                  <div className="h-1.5 flex-1 rounded-full bg-border" />
                </div>
              )}

              {newStep === "build" && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">Génère ton lien Jellyfin</p>
                    <p className="mt-1 text-xs text-text-secondary">On construit l'URL pour récupérer ta bibliothèque.</p>
                  </div>
                  <JellyfinLinkBuilder onUrlReady={() => {}} />
                  <button
                    onClick={() => setNewStep("paste")}
                    className="w-full rounded-button bg-primary py-4 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    J'ai ouvert le lien et copié le JSON →
                  </button>
                </div>
              )}

              {newStep === "paste" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setNewStep("build")} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                      ← Retour
                    </button>
                    <span className="text-xs text-text-secondary">Étape 2 sur 2</span>
                  </div>

                  <div className="rounded-card border border-secondary/20 bg-secondary/5 p-4">
                    <p className="text-sm font-semibold text-secondary mb-2">Comment copier le JSON</p>
                    <ol className="space-y-1.5 text-xs text-text-secondary list-decimal list-inside">
                      <li>Ouvre ton lien généré dans le navigateur</li>
                      <li>Tu vois du texte JSON — clique n'importe où sur la page</li>
                      <li>Sélectionne tout : <kbd className="rounded bg-surface-alt px-1 py-0.5 font-mono text-text-primary">Ctrl+A</kbd></li>
                      <li>Copie : <kbd className="rounded bg-surface-alt px-1 py-0.5 font-mono text-text-primary">Ctrl+C</kbd></li>
                      <li>Colle ici avec <kbd className="rounded bg-surface-alt px-1 py-0.5 font-mono text-text-primary">Ctrl+V</kbd></li>
                    </ol>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      Ton adresse email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      className="w-full rounded-input border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder-text-secondary/40 focus:border-accent focus:outline-none transition-colors"
                    />
                    <p className="mt-1 text-xs text-text-secondary">Sert à identifier ton compte — aucune newsletter.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      Colle le JSON ici
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder='{"Items": [...], "TotalRecordCount": 500}'
                      rows={8}
                      className="w-full rounded-input border border-border bg-surface px-4 py-3 font-mono text-xs text-text-primary placeholder-text-secondary/50 resize-none focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>

                  {importError && (
                    <p className="rounded-input border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
                      {importError}
                    </p>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={!jsonText.trim() || !email.trim()}
                    className="w-full rounded-button bg-primary py-4 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Importer ma bibliothèque →
                  </button>
                </div>
              )}

              {newStep === "importing" && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <div className="text-center">
                    <p className="font-medium text-text-primary">Analyse en cours…</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      On construit ton profil de goûts — genres, réalisateurs, acteurs.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Tab Retour ── */}
          {tab === "return" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Ta clé d&apos;accès
                </label>
                <input
                  type="text"
                  value={returnKey}
                  onChange={(e) => setReturnKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-YYYY"
                  maxLength={9}
                  className="w-full rounded-input border border-border bg-surface px-4 py-3 text-center font-display text-2xl tracking-[0.25em] text-text-primary placeholder-text-secondary/40 focus:border-accent focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleReturnLogin()}
                />
              </div>

              {returnError && (
                <p className="rounded-input border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
                  {returnError}
                </p>
              )}

              <button
                onClick={handleReturnLogin}
                disabled={returnLoading || returnKey.length < 9}
                className="w-full rounded-button bg-primary py-4 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {returnLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-text-primary border-t-transparent animate-spin" />
                    Connexion…
                  </span>
                ) : (
                  "Accéder à mes recommandations →"
                )}
              </button>

              <p className="text-center text-xs text-text-secondary">
                Tu n&apos;as pas encore de clé ?{" "}
                <button onClick={() => setTab("new")} className="text-accent underline-offset-2 hover:underline">
                  Crée ton accès beta
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
