"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ComparisonChange = {
  id: number;
  comparison_id: number;
  change_type: string;
  section_name: string | null;
  old_text: string | null;
  new_text: string | null;
  importance: string;
  explanation: string | null;
};

type Comparison = {
  id: number;
  ticker: string;
  older_document_id: number;
  newer_document_id: number;
  summary: string | null;
  overall_risk_direction: string | null;
  status: string;
  created_at: string;
  changes: ComparisonChange[];
};

type ChangeFilter = "all" | "added" | "removed" | "modified";

function formatLabel(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function changeTypeStyles(changeType: string) {
  const normalizedType = changeType.toLowerCase();

  if (normalizedType === "added") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalizedType === "removed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (normalizedType === "modified") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-[#26303d] bg-white/[0.03] text-zinc-400";
}

function importanceStyles(importance: string) {
  const normalizedImportance = importance.toLowerCase();

  if (normalizedImportance === "high") {
    return "text-red-300";
  }

  if (normalizedImportance === "medium") {
    return "text-amber-300";
  }

  if (normalizedImportance === "low") {
    return "text-emerald-300";
  }

  return "text-zinc-400";
}

export default function ComparisonFeed() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [selectedComparisonId, setSelectedComparisonId] = useState<
    number | null
  >(null);

  const [ticker, setTicker] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ChangeFilter>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchComparisons(selectNewest = false) {
    try {
      const response = await fetch(
        "http://localhost:8000/api/comparisons",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load filing comparisons.");
      }

      const data: Comparison[] = await response.json();
      const sortedComparisons = [...data].sort((a, b) => b.id - a.id);

      setComparisons(sortedComparisons);
      setError("");

      if (sortedComparisons.length > 0) {
        setSelectedComparisonId((currentId) => {
          if (selectNewest || currentId === null) {
            return sortedComparisons[0].id;
          }

          const selectedStillExists = sortedComparisons.some(
            (comparison) => comparison.id === currentId
          );

          return selectedStillExists
            ? currentId
            : sortedComparisons[0].id;
        });
      }
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to connect to the comparisons API.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchComparisons();
  }, []);

  async function generateComparison(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTicker = ticker.trim().toUpperCase();

    if (!cleanedTicker) {
      setError("Enter a ticker symbol.");
      return;
    }

    setIsGenerating(true);
    setMessage(`Comparing the two newest ${cleanedTicker} filings...`);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/comparisons/${cleanedTicker}`,
        {
          method: "POST",
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "Unable to generate the comparison."
        );
      }

      setTicker("");
      setMessage(`${cleanedTicker} filing comparison is ready.`);
      setActiveFilter("all");

      await fetchComparisons(true);
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

  const selectedComparison = useMemo(() => {
    return (
      comparisons.find(
        (comparison) => comparison.id === selectedComparisonId
      ) ??
      comparisons[0] ??
      null
    );
  }, [comparisons, selectedComparisonId]);

  const filteredChanges = useMemo(() => {
    if (!selectedComparison) {
      return [];
    }

    if (activeFilter === "all") {
      return selectedComparison.changes;
    }

    return selectedComparison.changes.filter(
      (change) => change.change_type.toLowerCase() === activeFilter
    );
  }, [selectedComparison, activeFilter]);

  const changeCounts = useMemo(() => {
    if (!selectedComparison) {
      return {
        all: 0,
        added: 0,
        removed: 0,
        modified: 0,
      };
    }

    return selectedComparison.changes.reduce(
      (counts, change) => {
        const changeType = change.change_type.toLowerCase();

        counts.all += 1;

        if (
          changeType === "added" ||
          changeType === "removed" ||
          changeType === "modified"
        ) {
          counts[changeType] += 1;
        }

        return counts;
      },
      {
        all: 0,
        added: 0,
        removed: 0,
        modified: 0,
      }
    );
  }, [selectedComparison]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={generateComparison}
        className="flex flex-col gap-4 border-b border-[#26303d] pb-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 className="text-base font-semibold text-white">
            Compare company filings
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
            Compare the two newest stored filings of the same type and detect
            added, removed, and modified language.
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
            {isGenerating ? "Comparing..." : "Generate comparison"}
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
          Loading comparisons...
        </div>
      ) : comparisons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-12 text-center">
          <div className="text-sm font-medium text-zinc-300">
            No filing comparisons available
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            Generate a comparison for a ticker with at least two stored filings
            of the same type.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-[#26303d] bg-[#090d13] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-[#26303d] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#26303d] px-4 py-4">
              <div className="text-xs font-semibold text-zinc-300">
                Comparison history
              </div>

              <div className="mt-1 text-[11px] text-zinc-600">
                {comparisons.length} saved comparison
                {comparisons.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto">
              {comparisons.map((comparison) => {
                const isSelected =
                  comparison.id === selectedComparison?.id;

                return (
                  <button
                    key={comparison.id}
                    type="button"
                    onClick={() =>
                      setSelectedComparisonId(comparison.id)
                    }
                    className={`block w-full border-b border-[#26303d] px-4 py-4 text-left transition last:border-b-0 ${
                      isSelected
                        ? "bg-cyan-400/[0.07]"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-white">
                        {comparison.ticker}
                      </span>

                      <span className="text-[11px] text-zinc-600">
                        #{comparison.id}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-zinc-400">
                      Documents {comparison.older_document_id} →{" "}
                      {comparison.newer_document_id}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-zinc-600">
                        {comparison.changes.length} detected change
                        {comparison.changes.length === 1 ? "" : "s"}
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

          {selectedComparison && (
            <article className="min-w-0">
              <header className="border-b border-[#26303d] px-6 py-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">
                        {selectedComparison.ticker}
                      </h3>

                      <span className="rounded-md border border-cyan-400/20 bg-cyan-400/[0.07] px-2.5 py-1 text-xs font-medium text-cyan-300">
                        {formatLabel(
                          selectedComparison.overall_risk_direction
                        )}{" "}
                        risk
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      Filing comparison #{selectedComparison.id}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] uppercase tracking-[0.1em] text-zinc-600">
                      Compared documents
                    </div>

                    <div className="mt-1 text-sm font-medium text-zinc-300">
                      #{selectedComparison.older_document_id} → #
                      {selectedComparison.newer_document_id}
                    </div>
                  </div>
                </div>

                {selectedComparison.summary && (
                  <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-400">
                    {selectedComparison.summary}
                  </p>
                )}
              </header>

              <div className="border-b border-[#26303d] px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["added", "Added"],
                      ["removed", "Removed"],
                      ["modified", "Modified"],
                    ] as [ChangeFilter, string][]
                  ).map(([filterValue, label]) => {
                    const isActive = activeFilter === filterValue;

                    return (
                      <button
                        key={filterValue}
                        type="button"
                        onClick={() => setActiveFilter(filterValue)}
                        className={`rounded-md border px-3 py-1.5 text-xs transition ${
                          isActive
                            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                            : "border-[#26303d] bg-white/[0.02] text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {label} {changeCounts[filterValue]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-h-[465px] overflow-y-auto">
                {filteredChanges.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-zinc-600">
                    No changes match this filter.
                  </div>
                ) : (
                  <div className="divide-y divide-[#26303d]">
                    {filteredChanges.map((change) => (
                      <details
                        key={change.id}
                        className="group px-6 py-5"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${changeTypeStyles(
                                  change.change_type
                                )}`}
                              >
                                {formatLabel(change.change_type)}
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-zinc-200">
                                  {change.section_name || "Document text"}
                                </div>

                                <div className="mt-1 text-xs text-zinc-600">
                                  Change #{change.id}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span
                                className={`text-xs font-medium ${importanceStyles(
                                  change.importance
                                )}`}
                              >
                                {formatLabel(change.importance)} importance
                              </span>

                              <span className="text-xs text-zinc-600 transition group-open:rotate-180">
                                ▾
                              </span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-5 space-y-4">
                          {change.explanation && (
                            <div className="rounded-lg border border-[#26303d] bg-white/[0.02] px-4 py-3">
                              <div className="muted-label">
                                Explanation
                              </div>

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {change.explanation}
                              </p>
                            </div>
                          )}

                          <div className="grid gap-4 xl:grid-cols-2">
                            <div className="rounded-lg border border-red-400/10 bg-red-400/[0.025] p-4">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300/70">
                                Older filing
                              </div>

                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-400">
                                {change.old_text ||
                                  "No corresponding text in the older filing."}
                              </p>
                            </div>

                            <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">
                                Newer filing
                              </div>

                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-400">
                                {change.new_text ||
                                  "No corresponding text in the newer filing."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}