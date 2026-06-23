"use client";

import { useState } from "react";

type AddEventFormProps = {
  onEventCreated: () => void;
};

type EventFormData = {
  ticker: string;
  type: string;
  signal: string;
  impact: string;
  confidence: string;
  source: string;
};

const initialFormData: EventFormData = {
  ticker: "",
  type: "",
  signal: "",
  impact: "Medium",
  confidence: "",
  source: "",
};

export default function AddEventForm({
  onEventCreated,
}: AddEventFormProps) {
  const [formData, setFormData] =
    useState<EventFormData>(initialFormData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ticker: formData.ticker.trim().toUpperCase(),
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "Unable to save the event."
        );
      }

      setFormData(initialFormData);
      setMessage("Signal saved successfully.");
      onEventCreated();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="muted-label">Ticker</span>

          <input
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
            placeholder="MSFT"
            maxLength={10}
            required
            disabled={isSaving}
            className="field uppercase"
          />
        </label>

        <label className="space-y-2">
          <span className="muted-label">Event type</span>

          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Earnings Call"
            required
            disabled={isSaving}
            className="field"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="muted-label">Signal</span>

          <input
            name="signal"
            value={formData.signal}
            onChange={handleChange}
            placeholder="Cloud revenue growth accelerated"
            required
            disabled={isSaving}
            className="field"
          />
        </label>

        <label className="space-y-2">
          <span className="muted-label">Impact</span>

          <select
            name="impact"
            value={formData.impact}
            onChange={handleChange}
            disabled={isSaving}
            className="field appearance-none"
          >
            <option value="Low">Low impact</option>
            <option value="Medium">Medium impact</option>
            <option value="High">High impact</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="muted-label">Confidence</span>

          <input
            name="confidence"
            value={formData.confidence}
            onChange={handleChange}
            placeholder="82%"
            required
            disabled={isSaving}
            className="field"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="muted-label">Source</span>

          <input
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="Q3 Earnings Transcript"
            required
            disabled={isSaving}
            className="field"
          />
        </label>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-[#26303d] pt-5 sm:flex-row sm:items-center">
        <div className="min-h-5 text-sm">
          {message && <span className="text-emerald-300">{message}</span>}

          {error && <span className="text-red-300">{error}</span>}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="primary-button"
        >
          {isSaving ? "Saving signal..." : "Save signal"}
        </button>
      </div>
    </form>
  );
}