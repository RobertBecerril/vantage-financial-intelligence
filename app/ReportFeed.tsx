"use client";

import { useEffect, useMemo, useState } from "react";

type ReportItem = {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  confidence_score: string;
  evidence: string;
};

type ParsedReport = {
  detectedSignal: string;
  whyItMatters: string;
  keyEvidence: string;
  riskDirection: string;
  confidence: string;
  uncertainty: string;
  executiveSummary: string;
  fallback: string;
};

function extractSection(
  text: string,
  sectionName: string,
  nextSectionNames: string[]
) {
  const startMarker = `${sectionName}:`;
  const startIndex = text.indexOf(startMarker);

  if (startIndex === -1) {
    return "";
  }

  const contentStart = startIndex + startMarker.length;
  let contentEnd = text.length;

  for (const nextSection of nextSectionNames) {
    const nextIndex = text.indexOf(`${nextSection}:`, contentStart);

    if (nextIndex !== -1 && nextIndex < contentEnd) {
      contentEnd = nextIndex;
    }
  }

  return text.slice(contentStart, contentEnd).trim();
}

function parseReport(summary: string): ParsedReport {
  const sectionNames = [
    "Detected Signal",
    "Why It Matters",
    "Key Evidence",
    "Risk Direction",
    "Confidence",
    "Uncertainty",
    "Executive Summary",
  ];

  const containsStructuredSections = sectionNames.some((section) =>
    summary.includes(`${section}:`)
  );

  if (!containsStructuredSections) {
    return {
      detectedSignal: "",
      whyItMatters: "",
      keyEvidence: "",
      riskDirection: "",
      confidence: "",
      uncertainty: "",
      executiveSummary: "",
      fallback: summary,
    };
  }

  return {
    detectedSignal: extractSection(summary, "Detected Signal", [
      "Why It Matters",
      "Key Evidence",
      "Risk Direction",
      "Confidence",
      "Uncertainty",
      "Executive Summary",
    ]),
    whyItMatters: extractSection(summary, "Why It Matters", [
      "Key Evidence",
      "Risk Direction",
      "Confidence",
      "Uncertainty",
      "Executive Summary",
    ]),
    keyEvidence: extractSection(summary, "Key Evidence", [
      "Risk Direction",
      "Confidence",
      "Uncertainty",
      "Executive Summary",
    ]),
    riskDirection: extractSection(summary, "Risk Direction", [
      "Confidence",
      "Uncertainty",
      "Executive Summary",
    ]),
    confidence: extractSection(summary, "Confidence", [
      "Uncertainty",
      "Executive Summary",
    ]),
    uncertainty: extractSection(summary, "Uncertainty", [
      "Executive Summary",
    ]),
    executiveSummary: extractSection(summary, "Executive Summary", []),
    fallback: "",
  };
}

function riskDirectionStyles(riskDirection: string) {
  const normalizedRisk = riskDirection.toLowerCase();

  if (normalizedRisk.includes("increased")) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (normalizedRisk.includes("decreased")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalizedRisk.includes("stable")) {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  return "border-[#26303d] bg-white/[0.03] text-zinc-400";
}

function confidenceStyles(confidence: string) {
  const normalizedConfidence = confidence.toLowerCase();

  if (normalizedConfidence.includes("high")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalizedConfidence.includes("medium")) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (normalizedConfidence.includes("low")) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-[#26303d] bg-white/[0.03] text-zinc-400";
}

export default function ReportFeed() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [ticker, setTicker] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchReports(selectNewest = false) {
    try {
      const response = await fetch("http://localhost:8000/api/reports", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load reports.");
      }

      const data: ReportItem[] = await response.json();
      const sortedData = [...data].sort((a, b) => b.id - a.id);

      setReports(sortedData);
      setError("");

      if (sortedData.length > 0) {
        setSelectedReportId((currentId) => {
          if (selectNewest || currentId === null) {
            return sortedData[0].id;
          }

          const stillExists = sortedData.some(
            (report) => report.id === currentId
          );

          return stillExists ? currentId : sortedData[0].id;
        });
      }
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to connect to the reports API.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function generateReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTicker = ticker.trim().toUpperCase();

    if (!cleanedTicker) {
      setError("Enter a ticker symbol.");
      return;
    }

    setIsGenerating(true);
    setMessage(`Analyzing ${cleanedTicker}...`);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/ai/reports/${cleanedTicker}`,
        {
          method: "POST",
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "Unable to generate the report."
        );
      }

      setTicker("");
      setMessage(`${cleanedTicker} report is ready.`);

      await fetchReports(true);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("An unexpected error occurred.");
      }

      setMessage("");
    } finally {
      setIsGenerating(false);
    }
  }

  const selectedReport = useMemo(() => {
    return (
      reports.find((report) => report.id === selectedReportId) ??
      reports[0] ??
      null
    );
  }, [reports, selectedReportId]);

  const parsedReport = useMemo(() => {
    if (!selectedReport) {
      return null;
    }

    return parseReport(selectedReport.summary);
  }, [selectedReport]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={generateReport}
        className="flex flex-col gap-4 border-b border-[#26303d] pb-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 className="text-base font-semibold text-white">
            Generate intelligence
          </h3>

          <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
            Generate a report using AI-filtered filing comparison evidence.
            Recent reports may be returned from the cache.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="AAPL"
            maxLength={10}
            disabled={isGenerating}
            aria-label="Ticker symbol"
            className="field h-10 uppercase sm:w-40"
          />

          <button
            type="submit"
            disabled={isGenerating}
            className="primary-button h-10 whitespace-nowrap"
          >
            {isGenerating ? "Generating..." : "Generate report"}
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

      {isLoading ? (
        <div className="rounded-lg border border-[#26303d] bg-[#090d13] px-5 py-10 text-sm text-zinc-500">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-12 text-center">
          <div className="text-sm font-medium text-zinc-300">
            No reports available
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            Generate a report after ingesting filings and creating a comparison.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-[#26303d] bg-[#090d13] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-[#26303d] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#26303d] px-4 py-4">
              <div className="text-xs font-semibold text-zinc-300">
                Report history
              </div>

              <div className="mt-1 text-[11px] text-zinc-600">
                {reports.length} saved report{reports.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {reports.map((report) => {
                const isSelected = report.id === selectedReport?.id;
                const parsed = parseReport(report.summary);

                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReportId(report.id)}
                    className={`block w-full border-b border-[#26303d] px-4 py-4 text-left transition last:border-b-0 ${
                      isSelected
                        ? "bg-cyan-400/[0.07]"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-white">
                        {report.ticker}
                      </span>

                      <span className="text-[11px] text-zinc-600">
                        #{report.id}
                      </span>
                    </div>

                    <div className="mt-2 truncate text-xs text-zinc-400">
                      {report.title}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="truncate text-[11px] text-zinc-600">
                        {parsed.riskDirection
                          ? `Risk: ${parsed.riskDirection}`
                          : report.confidence_score}
                      </span>

                      {isSelected && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedReport && parsedReport && (
            <article className="min-w-0">
              <header className="border-b border-[#26303d] px-6 py-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">
                        {selectedReport.ticker}
                      </h3>

                      {parsedReport.riskDirection && (
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${riskDirectionStyles(
                            parsedReport.riskDirection
                          )}`}
                        >
                          {parsedReport.riskDirection}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      {selectedReport.title}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] uppercase tracking-[0.1em] text-zinc-600">
                      Report source
                    </div>

                    <div className="mt-1 text-sm font-medium text-zinc-300">
                      Comparison evidence
                    </div>
                  </div>
                </div>
              </header>

              <div className="space-y-7 px-6 py-6">
                {parsedReport.fallback ? (
                  <section>
                    <p className="text-sm leading-7 text-zinc-300">
                      {parsedReport.fallback}
                    </p>
                  </section>
                ) : (
                  <>
                    {parsedReport.detectedSignal && (
                      <section>
                        <div className="muted-label">Detected signal</div>

                        <p className="mt-3 text-base leading-7 text-zinc-200">
                          {parsedReport.detectedSignal}
                        </p>
                      </section>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      {parsedReport.riskDirection && (
                        <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-4">
                          <div className="muted-label">Risk direction</div>

                          <div
                            className={`mt-3 inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${riskDirectionStyles(
                              parsedReport.riskDirection
                            )}`}
                          >
                            {parsedReport.riskDirection}
                          </div>
                        </div>
                      )}

                      {parsedReport.confidence && (
                        <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-4">
                          <div className="muted-label">Confidence</div>

                          <p className="mt-3 text-sm leading-6 text-zinc-300">
                            {parsedReport.confidence}
                          </p>
                        </div>
                      )}

                      {parsedReport.uncertainty && (
                        <div className="rounded-lg border border-[#26303d] bg-white/[0.02] p-4">
                          <div className="muted-label">Uncertainty</div>

                          <p className="mt-3 text-sm leading-6 text-zinc-300">
                            {parsedReport.uncertainty}
                          </p>
                        </div>
                      )}
                    </div>

                    {parsedReport.executiveSummary && (
                      <section>
                        <div className="muted-label">Executive summary</div>

                        <p className="mt-3 text-sm leading-7 text-zinc-300">
                          {parsedReport.executiveSummary}
                        </p>
                      </section>
                    )}

                    {parsedReport.whyItMatters && (
                      <section>
                        <div className="muted-label">Why it matters</div>

                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          {parsedReport.whyItMatters}
                        </p>
                      </section>
                    )}

                    {parsedReport.keyEvidence && (
                      <section>
                        <div className="muted-label">Key evidence</div>

                        <div className="mt-3 rounded-lg border border-[#26303d] bg-white/[0.02] px-4 py-4">
                          <p className="whitespace-pre-line text-sm leading-7 text-zinc-400">
                            {parsedReport.keyEvidence}
                          </p>
                        </div>
                      </section>
                    )}
                  </>
                )}

                <details className="border-t border-[#26303d] pt-5">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-500 transition hover:text-cyan-300">
                    View report evidence
                  </summary>

                  <pre className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#26303d] bg-black/20 p-4 font-mono text-xs leading-6 text-zinc-500">
                    {selectedReport.evidence}
                  </pre>
                </details>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}