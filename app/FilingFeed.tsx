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

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function FilingFeed() {
  const [filings, setFilings] = useState<FilingItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFilings() {
      try {
        const response = await fetch("http://localhost:8000/api/filings", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load filings.");
        }

        const data: FilingItem[] = await response.json();

        setFilings(data);
        setError("");
      } catch {
        setError("Unable to connect to the filings API.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilings();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#26303d] bg-[#090d13] px-5 py-8 text-sm text-zinc-500">
        Loading filings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (filings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-10 text-center">
        <div className="text-sm font-medium text-zinc-300">
          No filings available
        </div>

        <p className="mt-2 text-xs text-zinc-600">
          Filing records will appear here after they are added.
        </p>
      </div>
    );
  }

  return (
    <div className="table-shell">
      <div className="hidden grid-cols-[90px_90px_minmax(0,1fr)_170px_90px] gap-4 border-b border-[#26303d] bg-white/[0.015] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 lg:grid">
        <div>Ticker</div>
        <div>Form</div>
        <div>Filing</div>
        <div>Status</div>
        <div className="text-right">Source</div>
      </div>

      {filings.map((filing) => (
        <div
          key={filing.id}
          className="table-row lg:grid-cols-[90px_90px_minmax(0,1fr)_170px_90px]"
        >
          <div className="flex items-center justify-between lg:block">
            <div className="text-sm font-semibold text-white">
              {filing.ticker}
            </div>

            <div className="text-xs text-cyan-300 lg:hidden">
              {filing.form_type}
            </div>
          </div>

          <div className="hidden text-xs font-medium text-cyan-300 lg:block">
            {filing.form_type}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-200">
              {filing.title}
            </div>

            <div className="mt-1 truncate text-xs text-zinc-600">
              Filing ID #{filing.id}
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {formatStatus(filing.status)}
            </span>
          </div>

          <div className="lg:text-right">
            <a
              href={filing.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-zinc-500 transition hover:text-cyan-300"
            >
              Open source
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}