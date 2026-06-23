"use client";

import { useEffect, useState } from "react";

type FilingItem = {
  id: number;
  ticker: string;
  form_type: string;
  title: string;
  source_url: string;
  status: string;
};

export default function FilingFeed() {
  const [filings, setFilings] = useState<FilingItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFilings() {
      try {
        const response = await fetch("http://localhost:8000/api/filings");

        if (!response.ok) {
          throw new Error("Could not load filings");
        }

        const data = await response.json();
        setFilings(data);
      } catch {
        setError("Could not connect to filings API");
      }
    }

    fetchFilings();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-300">
        {error}
      </div>
    );
  }

  if (filings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-zinc-400">
        Loading filings...
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {filings.map((filing) => (
        <div
          key={filing.id}
          className="rounded-2xl border border-white/10 bg-black/30 p-5 transition hover:border-cyan-400/30"
        >
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">{filing.ticker}</div>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
              {filing.form_type}
            </span>
          </div>

          <p className="mt-3 text-lg text-white">{filing.title}</p>

          <div className="mt-4 text-sm text-zinc-500">
            Status: {filing.status}
          </div>

          <div className="mt-2 truncate text-xs text-zinc-600">
            {filing.source_url}
          </div>
        </div>
      ))}
    </div>
  );
}