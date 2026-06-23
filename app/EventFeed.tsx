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

export default function EventFeed({ refreshKey = 0 }: EventFeedProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("http://localhost:8000/api/events");

        if (!response.ok) {
          throw new Error("Could not load events");
        }

        const data = await response.json();
        setEvents(data);
      } catch {
        setError("Could not connect to event API");
      }
    }

    fetchEvents();
  }, [refreshKey]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-300">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-zinc-400">
        Loading event signals...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-white/10 bg-black/30 p-5 transition hover:border-cyan-400/30"
        >
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">{event.ticker}</div>

            <span
              className={`rounded-full px-3 py-1 text-xs ${
                event.impact === "High"
                  ? "bg-red-400/10 text-red-300"
                  : event.impact === "Medium"
                  ? "bg-yellow-400/10 text-yellow-300"
                  : "bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {event.impact} Impact
            </span>
          </div>

          <p className="mt-3 text-sm text-zinc-500">{event.type}</p>
          <p className="mt-1 text-lg text-white">{event.signal}</p>

          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <span>{event.source}</span>
            <span>Confidence {event.confidence}</span>
          </div>
        </div>
      ))}
    </div>
  );
}