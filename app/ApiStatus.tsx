"use client";

import { useEffect, useState } from "react";

type ApiStatusResponse = {
  app: string;
  backend: string;
  status: string;
  message: string;
};

export default function ApiStatus() {
  const [data, setData] = useState<ApiStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch("http://localhost:8000/api/status", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        const result: ApiStatusResponse = await response.json();

        setData(result);
        setError("");
      } catch {
        setData(null);
        setError("Backend unavailable");
      } finally {
        setIsChecking(false);
      }
    }

    checkApi();
  }, []);

  const isConnected = Boolean(data);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isConnected
              ? "bg-[#8ee68b] shadow-[0_0_14px_rgba(142,230,139,0.48)]"
              : isChecking
                ? "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.35)]"
                : "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.35)]"
          }`}
        />

        <div>
          <div className="text-xs font-medium text-zinc-300">
            Backend status
          </div>

          <div className="mt-0.5 text-[11px] text-zinc-600">
            {isConnected
              ? "FastAPI connected"
              : isChecking
                ? "Checking connection"
                : error}
          </div>
        </div>
      </div>

      <div
        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
          isConnected
            ? "border-[#8ee68b]/20 bg-[#8ee68b]/10 text-[#a8f5a5]"
            : isChecking
              ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
              : "border-red-400/20 bg-red-400/10 text-red-300"
        }`}
      >
        {isConnected ? "Online" : isChecking ? "Checking" : "Offline"}
      </div>
    </div>
  );
}