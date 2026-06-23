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
        const response = await fetch("http://localhost:8000/api/status");

        if (!response.ok) {
          throw new Error("Backend did not respond correctly");
        }

        const result = await response.json();
        setData(result);
      } catch {
        setError("Backend not connected");
      }
    }

    checkApi();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className="mb-2 text-sm text-zinc-500">Backend Connection</div>

      {data ? (
        <>
          <div className="text-lg font-semibold text-emerald-300">
            {data.status.toUpperCase()}
          </div>
          <p className="mt-2 text-sm text-zinc-400">{data.message}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {data.app} API powered by {data.backend}
          </p>
        </>
      ) : (
        <>
          <div className="text-lg font-semibold text-red-300">
            {error || "Checking..."}
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Make sure FastAPI is running on port 8000.
          </p>
        </>
      )}
    </div>
  );
}