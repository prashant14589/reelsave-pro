"use client";

import { useState, useEffect } from "react";

const FREE_LIMIT = 5;
const STORAGE_KEY = "reelsave_downloads";

// ─── Rate-limit helpers (unchanged) ──────────────────────────────────────────

function getDailyCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { count, date } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return 0;
    return count;
  } catch {
    return 0;
  }
}

function incrementDailyCount(): number {
  const next = getDailyCount() + 1;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: next, date: new Date().toDateString() })
  );
  return next;
}

// ─── Types ────────────────────────────────────────────────────────────────────

// PORTED: added "downloading" state and "quality" field
type State =
  | "idle"
  | "loading"
  | "success"
  | "downloading"
  | "error"
  | "ratelimit";

interface DownloadResult {
  downloadUrl: string;
  filename: string;
  quality?: string; // PORTED from insta-download
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [usedCount, setUsedCount] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(""); // PORTED

  useEffect(() => {
    setUsedCount(getDailyCount());
  }, []);

  const isLimitReached = usedCount >= FREE_LIMIT;

  async function handleDownload() {
    if (!url.trim() || isLimitReached) return;

    if (isLimitReached) {
      setState("ratelimit");
      return;
    }

    setState("loading");
    setResult(null);
    setErrorMsg("");
    setThumbnailUrl(""); // PORTED: reset thumbnail

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setState("ratelimit");
          return;
        }
        setState("error");
        setErrorMsg(data.error || "Something went wrong. Try again.");
        return;
      }

      // PORTED: extract reel ID for thumbnail preview
      const reelIdMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
      const reelId = reelIdMatch?.[2] || "";
      if (reelId) {
        setThumbnailUrl(`https://www.instagram.com/p/${reelId}/media/?size=m`);
      }

      const newCount = incrementDailyCount();
      setUsedCount(newCount);
      setResult(data);
      setState("success");

      // PORTED: auto-trigger download after showing the success modal
      setTimeout(() => {
        triggerDownload(data.downloadUrl, data.filename);
      }, 500);
    } catch {
      setState("error");
      setErrorMsg("Network error. Check your connection and try again.");
    }
  }

  // PORTED: blob-based download so the browser saves the file directly
  async function triggerDownload(downloadUrl: string, filename: string) {
    try {
      setState("downloading");
      const response = await fetch(downloadUrl, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setState("success");
    } catch (err) {
      console.error("Download error:", err);
      setState("success"); // fall back gracefully
    }
  }

  function handleReset() {
    setUrl("");
    setState("idle");
    setResult(null);
    setErrorMsg("");
    setThumbnailUrl(""); // PORTED: clear thumbnail
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E1306C] to-[#833AB4] flex items-center justify-center text-sm">
            ▼
          </div>
          <span className="font-semibold text-sm tracking-tight">
            ReelSave Pro
          </span>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-5 py-3 sm:py-4">
        {/* Glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E1306C]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl relative mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E1306C] animate-pulse" />
              No watermarks · No login · Free to start
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-1 sm:mb-2 leading-tight">
            Download Instagram
            <br />
            <span className="bg-gradient-to-r from-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              Reels instantly
            </span>
          </h1>
          <p className="text-center text-white/40 text-sm sm:text-base mb-4 sm:mb-6">
            Paste any Instagram Reel link. Get the video in seconds.
          </p>

          {/* Download widget */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 backdrop-blur-sm">
            {/* Rate limit */}
            {state === "ratelimit" && (
              <div className="text-center py-4 sm:py-6">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⏳</div>
                <div className="text-xs sm:text-sm font-medium text-white mb-1">
                  Daily limit reached
                </div>
                <div className="text-xs text-white/40 mb-3 sm:mb-4">
                  You've used all 5 free downloads today. Resets at midnight.
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#E1306C] hover:text-[#ff3d8a] transition-colors underline"
                >
                  Try another link tomorrow
                </button>
              </div>
            )}

            {/* PORTED: Success + downloading states */}
            {(state === "success" || state === "downloading") && result && (
              <div className="text-center py-2 sm:py-3">
                {/* downloading spinner */}
                {state === "downloading" && (
                  <div className="mb-2 sm:mb-3">
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <svg
                        className="animate-spin w-6 sm:w-8 h-6 sm:h-8 text-[#E1306C]"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-white mb-1">
                      📥 Video started to download
                    </div>
                  </div>
                )}

                {/* success checkmark */}
                {state === "success" && (
                  <>
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">✅</div>
                    <div className="text-xs sm:text-sm font-medium text-white mb-3 sm:mb-4">
                      Download Complete
                    </div>
                  </>
                )}

                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#E1306C] hover:text-[#ff3d8a] transition-colors underline"
                >
                  Download another
                </button>

                {/* PORTED: inline video player */}
                {state === "success" && result.downloadUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-black">
                    <video
                      data-testid="result-video"
                      controls
                      className="w-full aspect-video bg-black"
                      controlsList="nodownload"
                    >
                      <source src={result.downloadUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* PORTED: thumbnail preview */}
                {thumbnailUrl && state === "success" && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Idle / loading / error */}
            {(state === "idle" || state === "loading" || state === "error") && (
              <>
                <div className="flex flex-col sm:flex-row gap-2 mb-2 sm:mb-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                    placeholder="https://www.instagram.com/reel/..."
                    disabled={state === "loading"}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E1306C]/50 focus:bg-white/8 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleDownload}
                    disabled={
                      state === "loading" || !url.trim() || isLimitReached
                    }
                    className="flex-shrink-0 bg-[#E1306C] hover:bg-[#c01558] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center sm:justify-start gap-1 sm:gap-2 w-full sm:w-auto"
                  >
                    {state === "loading" ? (
                      <>
                        <svg
                          className="animate-spin w-3.5 sm:w-4 h-3.5 sm:h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>↓</span>
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error */}
                {state === "error" && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 mb-2 sm:mb-3">
                    <span className="text-red-400 text-xs mt-0.5">⚠</span>
                    <span className="text-red-300 text-xs">{errorMsg}</span>
                  </div>
                )}

                {/* Counter */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-white/25 px-1 gap-1 sm:gap-0">
                  <span>
                    Free tier: {usedCount}/{FREE_LIMIT} used today
                  </span>
                  <span className="hidden sm:inline">No account needed</span>
                </div>
              </>
            )}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 flex-wrap px-2">
            {[
              { icon: "🚫", label: "No watermarks" },
              { icon: "🔒", label: "No login required" },
              { icon: "⚡", label: "Instant download" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-xs sm:text-xs text-white/30"
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-5 sm:px-6 py-4 sm:py-5 mt-6 sm:mt-8">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-white/20 gap-2 sm:gap-4">
          <span>© 2025 ReelSave Pro</span>
          <div className="flex gap-4">
            <a
              href="/privacy"
              className="hover:text-white/40 transition-colors"
            >
              Privacy
            </a>
            <a href="/terms" className="hover:text-white/40 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
