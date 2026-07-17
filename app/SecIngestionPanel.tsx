"use client";

import { FormEvent, useState } from "react";

type SecIngestionResult = {
  ticker: string;
  form_type: string;
  requested: number;
  created: number;
  skipped: number;
  created_document_ids: number[];
  skipped_accession_numbers: string[];
  created_chunk_count: number;
};

export default function SecIngestionPanel() {
  const [ticker, setTicker] = useState("AAPL");
  const [formType, setFormType] = useState("10-Q");
  const [limit, setLimit] = useState(2);

  const [result, setResult] = useState<SecIngestionResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  async function ingestFilings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTicker = ticker.trim().toUpperCase();

    if (!cleanedTicker) {
      setError("Enter a ticker symbol.");
      return;
    }

    setIsIngesting(true);
    setResult(null);
    setError("");
    setMessage(`Fetching ${cleanedTicker} ${formType} filings from the SEC...`);

    try {
      const params = new URLSearchParams({
        form_type: formType,
        limit: String(limit),
      });

      const response = await fetch(
        `http://localhost:8000/api/sec/ingest/${cleanedTicker}?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "Unable to ingest SEC filings."
        );
      }

      setResult(responseData);
      setMessage(
        `${cleanedTicker} ingestion complete: ${responseData.created} created, ${responseData.skipped} skipped.`
      );
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("An unexpected SEC ingestion error occurred.");
      }

      setMessage("");
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={ingestFilings}
        className="grid gap-4 border-b border-[#26303d] pb-6 lg:grid-cols-[1fr_180px_140px_auto]"
      >
        <div>
          <label className="muted-label" htmlFor="sec-ticker">
            Ticker
          </label>

          <input
            id="sec-ticker"
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="AAPL"
            maxLength={10}
            disabled={isIngesting}
            className="field mt-2 h-10 uppercase"
          />
        </div>

        <div>
          <label className="muted-label" htmlFor="sec-form-type">
            Form type
          </label>

          <select
            id="sec-form-type"
            value={formType}
            onChange={(event) => setFormType(event.target.value)}
            disabled={isIngesting}
            className="field mt-2 h-10"
          >
            <option value="10-Q">10-Q</option>
            <option value="10-K">10-K</option>
          </select>
        </div>

        <div>
          <label className="muted-label" htmlFor="sec-limit">
            Limit
          </label>

          <input
            id="sec-limit"
            type="number"
            min={1}
            max={5}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            disabled={isIngesting}
            className="field mt-2 h-10"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isIngesting}
            className="primary-button h-10 w-full whitespace-nowrap"
          >
            {isIngesting ? "Ingesting..." : "Ingest filings"}
          </button>
        </div>
      </form>

      {(message || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-400/20 bg-red-400/5 text-red-300"
              : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
          }`}
        >
          {error || message}
        </div>
      )}

      {result ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card">
            <div className="muted-label">Ticker</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {result.ticker}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              {result.form_type}
            </div>
          </div>

          <div className="metric-card">
            <div className="muted-label">Created</div>
            <div className="mt-2 text-lg font-semibold text-emerald-300">
              {result.created}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              New documents stored
            </div>
          </div>

          <div className="metric-card">
            <div className="muted-label">Skipped</div>
            <div className="mt-2 text-lg font-semibold text-amber-300">
              {result.skipped}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              Existing accession numbers
            </div>
          </div>

         <div className="metric-card">
            <div className="muted-label">Chunks</div>
            <div className="mt-2 text-lg font-semibold text-white">
                {result.created_chunk_count}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              Generated automatically
            </div>
         </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-10 text-center">
          <div className="text-sm font-medium text-zinc-300">
            No SEC ingestion run yet
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            Enter a ticker, choose a filing type, and store recent SEC filings as
            Vantage documents.
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-[#26303d] bg-[#090d13]">
          <div className="border-b border-[#26303d] px-4 py-3">
            <div className="text-xs font-semibold text-zinc-300">
              Ingestion details
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div>
              <div className="muted-label">Created document IDs</div>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {result.created_document_ids.length > 0
                  ? result.created_document_ids.join(", ")
                  : "None"}
              </p>
            </div>

            <div>
              <div className="muted-label">Skipped accession numbers</div>

              <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                {result.skipped_accession_numbers.length > 0
                  ? result.skipped_accession_numbers.join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[#26303d] bg-white/[0.02] px-4 py-4">
        <div className="text-xs font-semibold text-zinc-300">
          Next steps after ingestion
        </div>

        <div className="mt-3 grid gap-3 text-xs leading-5 text-zinc-600 md:grid-cols-3">
          <div>
            <span className="text-zinc-400">1.</span> Open Document Store and
            confirm the filings were saved.
          </div>

          <div>
            <span className="text-zinc-400">2.</span> Chunk the new SEC
            documents for retrieval.
          </div>

          <div>
            <span className="text-zinc-400">3.</span> Generate a comparison or
            intelligence report from the stored filing text.
          </div>
        </div>
      </div>
    </div>
  );
}