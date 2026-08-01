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

export default function PipelinePanel({ onPipelineComplete }: PipelinePanelProps) {
  const [ticker, setTicker] = useState("MU");
  const [formType, setFormType] = useState("10-Q");
  const [limit, setLimit] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState("");

  async function runPipeline(event: React.FormEvent<HTMLFormElement>) {
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
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 className="text-base font-semibold text-white">
            Run company analysis
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
            Ingest recent SEC filings, chunk documents, generate embeddings,
            compare filing changes, and create an AI intelligence report in one
            workflow.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[120px_110px_90px_auto] lg:w-auto">
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="MU"
            maxLength={10}
            disabled={isRunning}
            aria-label="Ticker symbol"
            className="field h-10 uppercase"
          />

          <select
            value={formType}
            onChange={(event) => setFormType(event.target.value)}
            disabled={isRunning}
            aria-label="Filing type"
            className="field h-10"
          >
            <option value="10-Q">10-Q</option>
            <option value="10-K">10-K</option>
          </select>

          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            disabled={isRunning}
            aria-label="Filing limit"
            className="field h-10"
          >
            <option value={2}>2 filings</option>
            <option value={3}>3 filings</option>
            <option value={4}>4 filings</option>
            <option value={5}>5 filings</option>
          </select>

          <button
            type="submit"
            disabled={isRunning}
            className="primary-button h-10 whitespace-nowrap"
          >
            {isRunning ? "Running..." : "Run Analysis"}
          </button>
        </div>
      </form>

      {isRunning && (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-300">
          Running full Vantage pipeline. This may take a minute while filings are
          embedded and analyzed.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-[#26303d] bg-[#090d13] p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="text-sm font-semibold text-white">
                Pipeline completed for {result.ticker}
              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-600">
                {result.message}
              </p>
            </div>

            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              {result.status}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Documents</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {result.documents_available}
              </div>
            </div>

            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Chunks</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {result.chunks_created_or_found}
              </div>
            </div>

            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Embedded</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {result.embedded_count}
              </div>
            </div>

            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Comparison</div>
              <div className="mt-2 text-lg font-semibold text-white">
                #{result.comparison_id}
              </div>
            </div>

            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Report</div>
              <div className="mt-2 text-lg font-semibold text-white">
                #{result.report_id}
              </div>
            </div>

            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-3">
              <div className="muted-label">Model</div>
              <div className="mt-2 truncate text-xs font-medium text-zinc-300">
                {result.embedding_model || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}