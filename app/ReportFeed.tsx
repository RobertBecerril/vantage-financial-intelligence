"use client";

import { useEffect, useState } from "react";

type ReportItem = {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  confidence_score: string;
  evidence: string;
};

export default function ReportFeed() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [ticker, setTicker] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function fetchReports() {
    try {
      const response = await fetch("http://localhost:8000/api/reports");

      if (!response.ok) {
        throw new Error("Could not load reports");
      }

      const data = await response.json();
      setReports(data);
      setError("");
    } catch {
      setError("Could not connect to reports API");
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function generateReport(event: React.FormEvent) {
    event.preventDefault();

    const cleanedTicker = ticker.trim().toUpperCase();

    if (!cleanedTicker) {
      setStatus("Enter a ticker first.");
      return;
    }

    setIsGenerating(true);
    setStatus(`Generating AI report for ${cleanedTicker}...`);

    try {
      const response = await fetch(
        `http://localhost:8000/api/ai/reports/${cleanedTicker}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Could not generate AI report"
        );
      }

      setTicker("");
      setStatus(`${cleanedTicker} AI report generated successfully.`);

      await fetchReports();
    } catch (error) {
      if (error instanceof Error) {
        setStatus(error.message);
      } else {
        setStatus("Could not generate AI report.");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={generateReport}
        className="rounded-2xl border border-white/10 bg-black/30 p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="Enter ticker, e.g. AAPL"
            maxLength={10}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/40"
          />

          <button
            type="submit"
            disabled={isGenerating}
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate AI Report"}
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          The backend retrieves stored chunks for the ticker, sends the
          evidence to OpenAI, and saves the resulting report in SQLite.
        </p>
      </form>

      {status && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {reports.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-zinc-400">
          No reports generated yet.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {reports.map((report) => (
            <article
              key={report.id}
              className="rounded-3xl border border-white/10 bg-black/30 p-6 transition hover:border-cyan-400/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold">{report.ticker}</div>
                  <h3 className="mt-2 text-lg font-medium text-white">
                    {report.title}
                  </h3>
                </div>

                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                  {report.confidence_score}
                </span>
              </div>

              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-zinc-300">
                {report.summary}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-zinc-300">
                  Retrieved Evidence
                </div>

                <pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-zinc-500">
                  {report.evidence}
                </pre>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}