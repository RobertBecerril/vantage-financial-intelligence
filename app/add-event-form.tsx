"use client";

import { useState } from "react";

type AddEventFormProps = {
  onEventCreated: () => void;
};

export default function AddEventForm({ onEventCreated }: AddEventFormProps) {
  const [formData, setFormData] = useState({
    ticker: "",
    type: "",
    signal: "",
    impact: "Medium",
    confidence: "",
    source: "",
  });

  const [status, setStatus] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Saving event...");

    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      setFormData({
        ticker: "",
        type: "",
        signal: "",
        impact: "Medium",
        confidence: "",
        source: "",
      });

      setStatus("Event saved.");
      onEventCreated();
    } catch {
      setStatus("Could not save event.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
    >
      <div className="mb-5">
        <h2 className="text-2xl font-semibold">Add Event Signal</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Create a new market intelligence event and save it to SQLite.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="ticker"
          value={formData.ticker}
          onChange={handleChange}
          placeholder="Ticker, e.g. MSFT"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          required
        />

        <input
          name="type"
          value={formData.type}
          onChange={handleChange}
          placeholder="Type, e.g. Earnings Call"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          required
        />

        <input
          name="signal"
          value={formData.signal}
          onChange={handleChange}
          placeholder="Signal, e.g. Cloud revenue accelerated"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 md:col-span-2"
          required
        />

        <select
          name="impact"
          value={formData.impact}
          onChange={handleChange}
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="Low">Low Impact</option>
          <option value="Medium">Medium Impact</option>
          <option value="High">High Impact</option>
        </select>

        <input
          name="confidence"
          value={formData.confidence}
          onChange={handleChange}
          placeholder="Confidence, e.g. 82%"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          required
        />

        <input
          name="source"
          value={formData.source}
          onChange={handleChange}
          placeholder="Source, e.g. Q3 Earnings Transcript"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 md:col-span-2"
          required
        />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Save Event
        </button>

        {status && <span className="text-sm text-zinc-500">{status}</span>}
      </div>
    </form>
  );
}