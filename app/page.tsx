"use client";

import { useState } from "react";

import ApiStatus from "./ApiStatus";
import PipelinePanel from "./PipelinePanel";
import ReportFeed from "./ReportFeed";

const navigation = [
  { label: "Overview", href: "#overview" },
  { label: "Analysis", href: "#analysis" },
  { label: "Reports", href: "#reports" },
  { label: "System", href: "#system" },
];

const systemStats = [
  {
    label: "Retrieval",
    value: "pgvector",
    description: "Semantic search across filing chunks.",
  },
  {
    label: "Embeddings",
    value: "1,536D",
    description: "OpenAI embeddings stored in PostgreSQL.",
  },
  {
    label: "Workflow",
    value: "1-click",
    description: "Ticker to report through one pipeline.",
  },
];

const pipelineSteps = [
  "Ingest recent SEC filings",
  "Chunk filing text",
  "Generate embeddings",
  "Compare reporting periods",
  "Create intelligence report",
];

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  function refreshWorkspace() {
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <main className="app-shell min-h-screen bg-[#050604] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1760px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-black/45 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-8 py-8">
            <a href="#overview" className="flex items-center gap-4">
              <img
                src="/vantage-logo-icon.png"
                alt="Vantage"
                className="h-20 w-20 shrink-0 object-contain"
              />

              <div>
                <div
                  className="text-5xl font-bold leading-none tracking-[-0.07em] text-[#8ee68b]"
                  style={{ fontFamily: "var(--font-vantage)" }}
                >
                  vantage
                </div>

                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Financial Intelligence
                </div>
              </div>
            </a>

            <p className="mt-7 max-w-[260px] text-sm leading-6 text-zinc-500">
              See what changed. Know what matters.
            </p>
          </div>

          <nav className="flex-1 px-5 py-7">
            <div className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
              Workspace
            </div>

            <div className="space-y-1.5">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-100"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 transition group-hover:bg-[#8ee68b]" />
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span className="status-dot" />

                <span className="text-xs font-medium text-zinc-300">
                  System online
                </span>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-zinc-600">
                FastAPI · PostgreSQL · pgvector
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050604]/92 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-6 px-5 md:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <img
                  src="/vantage-logo-icon.png"
                  alt="Vantage"
                  className="h-10 w-10 object-contain"
                />

                <div>
                  <div
                    className="text-xl font-bold leading-none text-[#8ee68b]"
                    style={{ fontFamily: "var(--font-vantage)" }}
                  >
                    vantage
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    Financial Intelligence
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="text-sm font-semibold text-white">
                  Workspace
                </div>

                <div className="mt-0.5 text-xs text-zinc-600">
                  Filing analysis and evidence-backed reporting
                </div>
              </div>

              <div className="rounded-full border border-[#8ee68b]/20 bg-[#8ee68b]/10 px-3 py-1.5 text-xs font-medium text-[#a8f5a5]">
                API connected
              </div>
            </div>
          </header>

          <div className="space-y-8 px-5 py-7 md:px-8 md:py-9">
            <section
              id="overview"
              className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/30"
            >
              <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[minmax(0,1.1fr)_420px]">
                <div className="flex min-h-[340px] flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#8ee68b]/20 bg-[#8ee68b]/10 px-3 py-1.5 text-xs font-medium text-[#a8f5a5]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8ee68b]" />
                      SEC Filing Intelligence
                    </div>

                    <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl xl:text-6xl">
                      See what changed.{" "}
                      <span className="text-[#8ee68b]">Know what matters.</span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
                      Vantage compares SEC filings across reporting periods,
                      retrieves supporting evidence, and generates structured
                      financial intelligence reports.
                    </p>
                  </div>

                  <div className="mt-10 grid gap-3 md:grid-cols-3">
                    {systemStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/10 bg-black/25 p-4"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                          {stat.label}
                        </div>

                        <div className="mt-2 text-2xl font-semibold text-white">
                          {stat.value}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          {stat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-xl shadow-black/25">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Analysis flow
                      </div>

                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        Raw filings move through retrieval, comparison, and
                        report generation.
                      </p>
                    </div>

                    <img
                      src="/vantage-logo-icon.png"
                      alt=""
                      className="h-12 w-12 object-contain opacity-90"
                    />
                  </div>

                  <div className="space-y-3">
                    {pipelineSteps.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8ee68b]/25 bg-[#8ee68b]/10 text-xs font-semibold text-[#a8f5a5]">
                          {index + 1}
                        </div>

                        <div className="text-sm font-medium text-zinc-300">
                          {step}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      API health
                    </div>

                    <ApiStatus />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="analysis"
              className="rounded-[28px] border border-[#8ee68b]/20 bg-[#8ee68b]/[0.03] shadow-xl shadow-black/20"
            >
              <div className="border-b border-[#8ee68b]/15 px-5 py-5 md:px-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8f5a5]">
                      Primary workflow
                    </div>

                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                      Run company analysis
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Enter a ticker and run the full workflow from SEC
                      ingestion to report generation.
                    </p>
                  </div>

                  <div className="rounded-full border border-[#8ee68b]/20 bg-black/25 px-3 py-1.5 text-xs text-[#a8f5a5]">
                    One-click pipeline
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <PipelinePanel onPipelineComplete={refreshWorkspace} />
              </div>
            </section>

            <section id="reports" className="panel">
              <div className="panel-header">
                <div className="section-title">Intelligence reports</div>

                <div className="section-description">
                  Review generated reports with detected signals, confidence,
                  uncertainty, and supporting evidence.
                </div>
              </div>

              <div className="panel-body">
                <ReportFeed key={refreshKey} />
              </div>
            </section>

            <section id="system" className="panel">
              <div className="panel-header">
                <div className="section-title">System architecture</div>

                <div className="section-description">
                  Current Vantage processing flow.
                </div>
              </div>

              <div className="panel-body">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="muted-label">Frontend</div>

                    <div className="mt-2 text-sm font-medium text-zinc-200">
                      Next.js
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      Dashboard, one-click pipeline controls, and report views.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="muted-label">Backend</div>

                    <div className="mt-2 text-sm font-medium text-zinc-200">
                      FastAPI
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      REST routes, SEC ingestion, comparison services, and AI
                      orchestration.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="muted-label">Persistence</div>

                    <div className="mt-2 text-sm font-medium text-zinc-200">
                      PostgreSQL + pgvector
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      Stores filings, chunks, embeddings, reports, and detected
                      filing changes.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="muted-label">Analysis</div>

                    <div className="mt-2 text-sm font-medium text-zinc-200">
                      RAG + Materiality
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      Retrieval, filing comparison, risk direction, confidence,
                      and uncertainty scoring.
                    </p>
                  </div>
                </div>
              </div>
            </section>

           <footer className="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-zinc-700 md:flex-row">
              <div>Vantage V2 · Financial intelligence workspace</div>

              <div className="flex flex-wrap gap-4">
                <span>See what changed. Know what matters.</span>

                <a
                  href="/terms"
                  className="text-zinc-600 transition hover:text-[#a8f5a5]"
                >
                  Terms of Service
                </a>
              </div>
            
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}