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
        setError("Backend unavailable");
      }
    }

    checkApi();
  }, []);

  const isConnected = Boolean(data);

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#26303d] bg-[#0c1118] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected
              ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.45)]"
              : "bg-red-400"
          }`}
        />

        <div>
          <div className="text-xs font-medium text-zinc-300">
            Backend status
          </div>

          <div className="mt-0.5 text-[11px] text-zinc-600">
            {isConnected ? "FastAPI connected" : error || "Checking connection"}
          </div>
        </div>
      </div>

      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
          isConnected ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {isConnected ? "Online" : "Offline"}
      </div>
    </div>
  );
}