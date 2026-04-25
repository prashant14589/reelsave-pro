"use client";

import { useState, useEffect } from "react";

const FREE_LIMIT = 5;
const STORAGE_KEY = "reelsave_downloads";

function getDailyCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    if (date !== new Date().toDateString()) return 0;
    return count;
  } catch {
    return 0;
  }
}

function incrementDailyCount(): number {
  const current = getDailyCount();
  const next = current + 1;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: new Date().toDateString(), count: next })
  );
  return next;
}

type State = "idle" | "loading" | "success" | "error" | "ratelimit";

interface DownloadResult {
  downloadUrl: string;
  filename: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [usedCount, setUsedCount] = useState(0);

  useEffect(() => {
    setUsedCount(getDailyCount());
  }, []);

  const remaining = FREE_LIMIT - usedCount;
  const isLimitReached = usedCount >= FREE_LIMIT;

  async function handleDownload() {
    if (!url.trim()) return;
    if (isLimitReached) {
      setState("ratelimit");
      return;
    }

    setState("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const newCount = incrementDailyCount();
      setUsedCount(newCount);
      setResult(data);
      setState("success");
    } catch {
      setState("error");
      setErrorMsg("Network error. Check your connection and try again.");
    }
  }

  function handleReset() {
    setUrl("");
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E1306C] to-[#833AB4] flex items-center justify-center text-xs font-bold">
            R
          </div>
          <span className="font-semibold text-sm tracking-tight">
            ReelSave Pro
          </span>
        </div>
        <div className="text-xs text-white/30">
          {remaining > 0 ? (
            <span>
              {remaining} free {remaining === 1 ? "download" : "downloads"} left
              today
            </span>
          ) : (
            <span className="text-[#E1306C]">Daily limit reached</span>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-16">
        {/* Glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E1306C]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E1306C] animate-pulse" />
              No watermarks · No login · Free to start
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center text-4xl sm:text-5xl font-bold tracking-tight mb-3 leading-tight">
            Download Instagram
            <br />
            <span className="bg-gradient-to-r from-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              Reels instantly
            </span>
          </h1>
          <p className="text-center text-white/40 text-sm sm:text-base mb-10">
            Paste any Instagram Reel link. Get the video in seconds.
          </p>

          {/* Download widget */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
            {/* Rate limit state */}
            {state === "ratelimit" && (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">⏳</div>
                <div className="text-sm font-medium text-white mb-1">
                  Daily limit reached
                </div>
                <div className="text-xs text-white/40 mb-4">
                  You've used all 5 free downloads today. Resets at midnight.
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#E1306C] hover:underline"
                >
                  Try another URL tomorrow
                </button>
              </div>
            )}

            {/* Success state */}
            {state === "success" && result && (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✅</div>
                <div className="text-sm font-medium text-white mb-1">
                  Ready to download
                </div>
                <div className="text-xs text-white/40 mb-5">
                  {result.filename}
                </div>
                <a
                  href={result.downloadUrl}
                  download={result.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#E1306C] hover:bg-[#c01558] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center mb-3"
                >
                  ↓ Download Video
                </a>
                <button
                  onClick={handleReset}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Download another
                </button>
              </div>
            )}

            {/* Idle + loading + error state */}
            {(state === "idle" || state === "loading" || state === "error") && (
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (state === "error") setState("idle");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                    placeholder="https://www.instagram.com/reel/..."
                    disabled={state === "loading"}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E1306C]/50 focus:bg-white/8 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleDownload}
                    disabled={
                      state === "loading" || !url.trim() || isLimitReached
                    }
                    className="flex-shrink-0 bg-[#E1306C] hover:bg-[#c01558] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors flex items-center gap-2"
                  >
                    {state === "loading" ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
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
                        <span className="hidden sm:inline">Fetching...</span>
                      </>
                    ) : (
                      <>
                        <span>↓</span>
                        <span className="hidden sm:inline">Download</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error message */}
                {state === "error" && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-3">
                    <span className="text-red-400 text-xs mt-0.5">⚠</span>
                    <span className="text-red-300 text-xs">{errorMsg}</span>
                  </div>
                )}

                {/* Free tier counter */}
                <div className="flex items-center justify-between text-xs text-white/25 px-1">
                  <span>
                    Free tier: {usedCount}/{FREE_LIMIT} used today
                  </span>
                  <span>No account needed</span>
                </div>
              </>
            )}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              { icon: "🚫", label: "No watermarks" },
              { icon: "🔒", label: "No login required" },
              { icon: "📱", label: "Works on mobile" },
              { icon: "⚡", label: "HD quality" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-white/30"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs text-white/20">
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
