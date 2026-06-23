"use client";

import { useState } from "react";
import ApiStatus from "./ApiStatus";
import EventFeed from "./EventFeed";
import AddEventForm from "./add-event-form";
import FilingFeed from "./FilingFeed";
import ReportFeed from "./ReportFeed";
import DocumentFeed from "./DocumentFeed";

const metrics = [
  {
    label: "Documents Indexed",
    value: "1,248",
  },
  {
    label: "RAG Faithfulness",
    value: "91%",
  },
  {
    label: "Avg Retrieval Latency",
    value: "420ms",
  },
  {
    label: "Prompt Tests",
    value: "36",
  },
];

const pipeline = [
  "Ingest",
  "Chunk",
  "Embed",
  "Retrieve",
  "Rerank",
  "Analyze",
  "Verify",
  "Report",
];

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  function refreshEvents() {
    setRefreshKey((previous) => previous + 1);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_35%)]" />

      <section className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              V
            </div>

            <div>
              <div className="text-xl font-semibold tracking-tight">
                Vantage
              </div>
              <div className="text-xs text-zinc-500">
                Financial Intelligence OS
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <span>Events</span>
            <span>Filings</span>
            <span>Reports</span>
            <span>Documents</span>
            <span>Evaluation</span>
          </div>

          <button className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white transition hover:bg-white/10">
            Launch Demo
          </button>
        </nav>

        <div className="grid items-center gap-12 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              RAG + LangGraph + LLM Evaluation
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
              Detect market-moving signals before they become obvious.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Vantage ingests SEC filings, earnings calls, macro releases, and
              financial news to generate citation-backed intelligence reports
              using retrieval-augmented generation, embeddings, workflow
              orchestration, and automated LLM evaluation.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200">
                View Intelligence Feed
              </button>

              <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                Open RAG Debugger
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 max-w-2xl">
              <ApiStatus />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium text-zinc-200">Live Event Signals</h2>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                Monitoring
              </span>
            </div>

            <EventFeed refreshKey={refreshKey} />
          </div>
        </div>

        <AddEventForm onEventCreated={refreshEvents} />

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">SEC Filing Watchlist</h2>
            <p className="mt-2 text-zinc-500">
              Filing records pulled from the FastAPI backend and stored in
              SQLite.
            </p>
          </div>

          <FilingFeed />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Intelligence Reports</h2>
            <p className="mt-2 text-zinc-500">
              Mock AI reports generated by the FastAPI backend and stored in
              SQLite.
            </p>
          </div>

          <ReportFeed />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Document Store</h2>
            <p className="mt-2 text-zinc-500">
              Raw financial documents stored in SQLite and ready for chunking.
            </p>
          </div>

          <DocumentFeed />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">AI Intelligence Pipeline</h2>
            <p className="mt-2 text-zinc-500">
              Built like a production AI system, not a basic chatbot.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-8">
            {pipeline.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="mb-3 text-xs text-cyan-300">
                  Step {index + 1}
                </div>
                <div className="font-medium">{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Detected Signal</h3>
            <p className="mt-4 leading-7 text-zinc-400">
              Management raised data center revenue outlook and emphasized
              stronger-than-expected enterprise AI infrastructure demand.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Retrieved Evidence</h3>
            <p className="mt-4 leading-7 text-zinc-400">
              3 transcript chunks, 2 prior-quarter comparisons, and 1 analyst
              context note were retrieved, reranked, and packed into context.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Evaluation</h3>
            <p className="mt-4 leading-7 text-zinc-400">
              Faithfulness: 91%. Context precision: 84%. Answer relevance: 89%.
              No unsupported claims detected.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                Explainable Intelligence Report
              </h2>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Every report stores source document IDs, retrieved chunks,
                prompt version, model version, retrieval scores, and evaluation
                results.
              </p>
            </div>

            <span className="w-fit rounded-full bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              RAG Verified
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}