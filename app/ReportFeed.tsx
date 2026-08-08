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
    uncertainty: extractSection(summary, "Uncertainty", ["Executive Summary"]),
    executiveSummary: extractSection(summary, "Executive Summary", []),
    fallback: "",
  };
}

function getRiskTone(riskDirection: string) {
  const normalizedRisk = riskDirection.toLowerCase();

  const hasIncreased = normalizedRisk.includes("increased");
  const hasDecreased = normalizedRisk.includes("decreased");
  const hasNeutral = normalizedRisk.includes("neutral");
  const hasMixed =
    normalizedRisk.includes("mixed") ||
    normalizedRisk.includes("unclear") ||
    normalizedRisk.includes("uncertain");

  if (
    hasMixed ||
    (hasIncreased && hasDecreased) ||
    (hasIncreased && hasNeutral) ||
    (hasDecreased && hasNeutral)
  ) {
    return "mixed";
  }

  if (hasIncreased) {
    return "increased";
  }

  if (hasDecreased) {
    return "decreased";
  }

  if (hasNeutral) {
    return "neutral";
  }

  return "neutral";
}

function riskDirectionStyles(riskDirection: string) {
  const tone = getRiskTone(riskDirection);

  if (tone === "increased") {
    return "border-red-400/25 bg-red-400/[0.08] text-red-200";
  }

  if (tone === "decreased") {
    return "border-[#8ee68b]/25 bg-[#8ee68b]/10 text-[#a8f5a5]";
  }

  if (tone === "mixed") {
    return "border-amber-300/25 bg-amber-300/[0.08] text-amber-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function riskLabel(riskDirection: string) {
  const tone = getRiskTone(riskDirection);

  if (tone === "mixed") {
    return "Mixed";
  }

  if (tone === "increased") {
    return "Increased";
  }

  if (tone === "decreased") {
    return "Decreased";
  }

  return "Neutral";
}

function confidenceStyles(confidence: string) {
  const normalizedConfidence = confidence.toLowerCase();

  if (normalizedConfidence.includes("high")) {
    return "border-[#8ee68b]/25 bg-[#8ee68b]/10 text-[#c8ffc5]";
  }

  if (normalizedConfidence.includes("medium")) {
    return "border-amber-300/25 bg-amber-300/[0.08] text-amber-200";
  }

  if (normalizedConfidence.includes("low")) {
    return "border-red-400/25 bg-red-400/[0.08] text-red-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function splitEvidence(evidence: string) {
  return evidence
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ReportFeed() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [error, setError] = useState("");
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

  const evidenceLines = useMemo(() => {
    if (!parsedReport?.keyEvidence) {
      return [];
    }

    return splitEvidence(parsedReport.keyEvidence);
  }, [parsedReport]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-12 text-sm text-zinc-500">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-5 py-14 text-center">
          <div className="text-sm font-medium text-zinc-300">
            No reports available
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            Run the one-click analysis workflow to generate the first report.
          </p>
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#050604] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-black/25 lg:border-b-0 lg:border-r lg:border-white/10">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                Report history
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                {reports.length} saved report{reports.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="max-h-[780px] overflow-y-auto">
              {reports.map((report) => {
                const isSelected = report.id === selectedReport?.id;
                const parsed = parseReport(report.summary);
                const riskText = parsed.riskDirection || report.confidence_score;

                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReportId(report.id)}
                    className={`block w-full border-b border-white/10 px-5 py-5 text-left transition last:border-b-0 ${
                      isSelected
                        ? "bg-[#8ee68b]/[0.07]"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-lg font-semibold text-white">
                        {report.ticker}
                      </span>

                      <span className="text-[11px] text-zinc-600">
                        #{report.id}
                      </span>
                    </div>

                    <div className="mt-2 truncate text-xs text-zinc-500">
                      {report.title}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="truncate text-[11px] text-zinc-600">
                        {parsed.riskDirection
                          ? `Risk: ${riskLabel(parsed.riskDirection)}`
                          : riskText}
                      </span>

                      {isSelected && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8ee68b]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedReport && parsedReport && (
            <article className="min-w-0 bg-[#050604]">
              <header className="border-b border-white/10 px-6 py-6 md:px-8">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-3xl font-semibold tracking-tight text-white">
                        {selectedReport.ticker}
                      </h3>

                      {parsedReport.riskDirection && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskDirectionStyles(
                            parsedReport.riskDirection
                          )}`}
                        >
                          {riskLabel(parsedReport.riskDirection)}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      {selectedReport.title}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left xl:text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      Backed by
                    </div>

                    <div className="mt-1 text-sm font-medium text-zinc-300">
                      Comparison + RAG evidence
                    </div>
                  </div>
                </div>
              </header>

              <div className="space-y-8 px-6 py-7 md:px-8">
                {parsedReport.fallback ? (
                  <section className="max-w-5xl">
                    <p className="text-base leading-8 text-zinc-300">
                      {parsedReport.fallback}
                    </p>
                  </section>
                ) : (
                  <>
                    {parsedReport.detectedSignal && (
                      <section className="max-w-5xl">
                        <div className="muted-label">Detected signal</div>

                        <p className="mt-3 text-lg leading-8 text-zinc-100">
                          {parsedReport.detectedSignal}
                        </p>
                      </section>
                    )}

                    <div className="grid gap-4 xl:grid-cols-3">
                      {parsedReport.riskDirection && (
                        <div className="min-h-[230px] rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                          <div className="muted-label">Risk direction</div>

                          <div
                            className={`mt-5 inline-flex rounded-xl border px-3 py-2 text-sm font-semibold leading-6 ${riskDirectionStyles(
                              parsedReport.riskDirection
                            )}`}
                          >
                            {parsedReport.riskDirection}
                          </div>
                        </div>
                      )}

                      {parsedReport.confidence && (
                        <div className="min-h-[230px] rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                          <div className="muted-label">Confidence</div>

                          <div
                            className={`mt-5 rounded-xl border px-3 py-2 text-sm leading-6 ${confidenceStyles(
                              parsedReport.confidence
                            )}`}
                          >
                            {parsedReport.confidence}
                          </div>
                        </div>
                      )}

                      {parsedReport.uncertainty && (
                        <div className="min-h-[230px] rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                          <div className="muted-label">Uncertainty</div>

                          <p className="mt-5 text-sm leading-7 text-zinc-300">
                            {parsedReport.uncertainty}
                          </p>
                        </div>
                      )}
                    </div>

                    {parsedReport.executiveSummary && (
                      <section className="max-w-5xl">
                        <div className="muted-label">Executive summary</div>

                        <p className="mt-3 text-base leading-8 text-zinc-300">
                          {parsedReport.executiveSummary}
                        </p>
                      </section>
                    )}

                    {parsedReport.whyItMatters && (
                      <section className="max-w-5xl">
                        <div className="muted-label">Why it matters</div>

                        <p className="mt-3 text-base leading-8 text-zinc-400">
                          {parsedReport.whyItMatters}
                        </p>
                      </section>
                    )}

                    {parsedReport.keyEvidence && (
                      <section className="max-w-5xl">
                        <div className="muted-label">Key evidence</div>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-5">
                          {evidenceLines.length > 1 ? (
                            <div className="space-y-3">
                              {evidenceLines.map((line, index) => (
                                <div
                                  key={`${line}-${index}`}
                                  className="flex gap-3 text-sm leading-7 text-zinc-400"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8ee68b]" />
                                  <span>{line.replace(/^[-•]\s*/, "")}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="whitespace-pre-line text-sm leading-7 text-zinc-400">
                              {parsedReport.keyEvidence}
                            </p>
                          )}
                        </div>
                      </section>
                    )}
                  </>
                )}

                <details className="border-t border-white/10 pt-5">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-500 transition hover:text-[#a8f5a5]">
                    View raw report evidence
                  </summary>

                  <pre className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-6 text-zinc-500">
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