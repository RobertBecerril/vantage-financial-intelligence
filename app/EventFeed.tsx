"use client";

import { useEffect, useState } from "react";

type EventItem = {
  id: number;
  ticker: string;
  type: string;
  signal: string;
  impact: string;
  confidence: string;
  source: string;
};

type EventFeedProps = {
  refreshKey?: number;
};

function impactStyles(impact: string) {
  if (impact === "High") {
    return {
      text: "text-red-300",
      background: "bg-red-400/10",
      border: "border-red-400/15",
      dot: "bg-red-400",
    };
  }

  if (impact === "Medium") {
    return {
      text: "text-amber-300",
      background: "bg-amber-400/10",
      border: "border-amber-400/15",
      dot: "bg-amber-400",
    };
  }

  return {
    text: "text-emerald-300",
    background: "bg-emerald-400/10",
    border: "border-emerald-400/15",
    dot: "bg-emerald-400",
  };
}

export default function EventFeed({ refreshKey = 0 }: EventFeedProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);

      try {
        const response = await fetch("http://localhost:8000/api/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load signals");
        }

        const data: EventItem[] = await response.json();

        setEvents(data);
        setError("");
      } catch {
        setError("Unable to connect to the signals API.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#26303d] bg-[#090d13] px-5 py-8 text-sm text-zinc-500">
        Loading signals...
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

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-10 text-center">
        <div className="text-sm font-medium text-zinc-300">
          No signals available
        </div>

        <p className="mt-2 text-xs text-zinc-600">
          Add a market event to populate this feed.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#26303d] bg-[#090d13]">
      <div className="hidden grid-cols-[90px_150px_minmax(0,1fr)_120px_110px] gap-4 border-b border-[#26303d] bg-white/[0.015] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 lg:grid">
        <div>Ticker</div>
        <div>Source type</div>
        <div>Signal</div>
        <div>Impact</div>
        <div className="text-right">Confidence</div>
      </div>

      <div>
        {events.map((event) => {
          const styles = impactStyles(event.impact);

          return (
            <div
              key={event.id}
              className="group border-b border-[#26303d] px-4 py-4 transition last:border-b-0 hover:bg-cyan-400/[0.025] lg:grid lg:grid-cols-[90px_150px_minmax(0,1fr)_120px_110px] lg:items-center lg:gap-4"
            >
              <div className="flex items-center justify-between lg:block">
                <div className="text-base font-semibold text-white">
                  {event.ticker}
                </div>

                <div className="text-xs text-zinc-600 lg:hidden">
                  {event.confidence}
                </div>
              </div>

              <div className="mt-2 text-xs text-zinc-500 lg:mt-0">
                {event.type}
              </div>

              <div className="mt-2 min-w-0 lg:mt-0">
                <div className="text-sm font-medium leading-6 text-zinc-200">
                  {event.signal}
                </div>

                <div className="mt-1 truncate text-xs text-zinc-600">
                  {event.source}
                </div>
              </div>

              <div className="mt-3 lg:mt-0">
                <span
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium ${styles.text} ${styles.background} ${styles.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                  {event.impact}
                </span>
              </div>

              <div className="hidden text-right text-xs text-zinc-500 lg:block">
                {event.confidence}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}