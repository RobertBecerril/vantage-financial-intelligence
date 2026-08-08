"use client";

import { useState } from "react";

type PipelineResult = {
  status: string;
  ticker: string;
  form_type: string;
  requested_filing_limit: number;
  documents_available: number;
  chunked_documents: number;
  chunks_created_or_found: number;
  embedded_count: number;
  embedding_model: string | null;
  comparison_id: number;
  report_id: number;
  message: string;
};

type PipelinePanelProps = {
  onPipelineComplete?: () => void;
};

export default function PipelinePanel({
  onPipelineComplete,
}: PipelinePanelProps) {
  const [ticker, setTicker] = useState("");
  const [formType, setFormType] = useState("10-Q");
  const [limit, setLimit] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState("");

  async function runPipeline(event: React.FormEvent) {
    event.preventDefault();

    const cleanedTicker = ticker.trim().toUpperCase();

    if (!cleanedTicker) {
      setError("Enter a ticker symbol.");
      return;
    }

    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/pipeline/${cleanedTicker}?form_type=${formType}&limit=${limit}`,
        {
          method: "POST",
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "The analysis pipeline failed."
        );
      }

      setResult(responseData);
      onPipelineComplete?.();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("An unexpected pipeline error occurred.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={runPipeline}
        className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
      >
        <div>
          <h3 className="text-base font-semibold text-white">
            Run company analysis
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Ingest recent SEC filings, chunk documents, generate embeddings,
            compare filing changes, and create an AI intelligence report in one
            workflow.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[140px_120px_110px_auto] lg:w-auto">
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="Ticker"
            maxLength={10}
            disabled={isRunning}
            aria-label="Ticker symbol"
            className="field h-11 uppercase"
          />

          <select
            value={formType}
            onChange={(event) => setFormType(event.target.value)}
            disabled={isRunning}
            aria-label="Filing type"
            className="field h-11"
          >
            <option value="10-Q">10-Q</option>
            <option value="10-K">10-K</option>
          </select>

          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            disabled={isRunning}
            aria-label="Filing limit"
            className="field h-11"
          >
            <option value={2}>2 filings</option>
            <option value={3}>3 filings</option>
            <option value={4}>4 filings</option>
            <option value={5}>5 filings</option>
          </select>

          <button
            type="submit"
            disabled={isRunning}
            className="primary-button h-11 whitespace-nowrap"
          >
            {isRunning ? "Running..." : "Run Analysis"}
          </button>
        </div>
      </form>

      {isRunning && (
        <div className="rounded-xl border border-[#8ee68b]/20 bg-[#8ee68b]/[0.04] px-4 py-3 text-sm text-[#a8f5a5]">
          Running full Vantage pipeline. This may take a minute while filings
          are embedded and analyzed.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-[#8ee68b]/20 bg-black/30 p-5 shadow-xl shadow-black/20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="text-base font-semibold text-white">
                Pipeline completed for {result.ticker}
              </div>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-600">
                {result.message}
              </p>
            </div>

            <span className="rounded-lg border border-[#8ee68b]/20 bg-[#8ee68b]/10 px-3 py-1.5 text-xs font-semibold text-[#a8f5a5]">
              {result.status}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Documents</div>

              <div className="mt-3 text-2xl font-semibold text-white">
                {result.documents_available}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Chunks</div>

              <div className="mt-3 text-2xl font-semibold text-white">
                {result.chunks_created_or_found}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Embedded</div>

              <div className="mt-3 text-2xl font-semibold text-white">
                {result.embedded_count}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Comparison</div>

              <div className="mt-3 text-2xl font-semibold text-white">
                #{result.comparison_id}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Report</div>

              <div className="mt-3 text-2xl font-semibold text-white">
                #{result.report_id}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="muted-label">Model</div>

              <div className="mt-3 truncate text-sm font-medium text-zinc-300">
                {result.embedding_model || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}