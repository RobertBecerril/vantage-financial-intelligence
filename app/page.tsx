"use client";

import ApiStatus from "./ApiStatus";
import ComparisonFeed from "./ComparisonFeed";
import DocumentFeed from "./DocumentFeed";
import EventFeed from "./EventFeed";
import FilingFeed from "./FilingFeed";
import ReportFeed from "./ReportFeed";
import SecIngestionPanel from "./SecIngestionPanel";

const navigation = [
  { label: "Overview", href: "#overview" },
  { label: "Signals", href: "#signals" },
  { label: "Filings", href: "#filings" },
  { label: "SEC Ingestion", href: "#sec-ingestion" },
  { label: "Comparisons", href: "#comparisons" },
  { label: "Reports", href: "#reports" },
  { label: "Documents", href: "#documents" },
  { label: "System", href: "#system" },
];

const workflow = [
  {
    name: "Ingest",
    description: "Store source documents and metadata.",
  },
  {
    name: "Chunk",
    description: "Split long documents into smaller evidence units.",
  },
  {
    name: "Compare",
    description: "Detect added, removed, and modified filing language.",
  },
  {
    name: "Analyze",
    description: "Generate grounded intelligence from retrieved context.",
  },
];

export default function Home() {


  return (
    <main className="app-shell">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#232a33] bg-[#090c11] lg:flex lg:flex-col">
          <div className="border-b border-[#232a33] px-5 py-5">
            <div>
              <div className="vantage-wordmark text-[26px] leading-none text-white">
                Vantage
              </div>

              <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Financial Intelligence
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <div className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-700">
              Workspace
            </div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="border-t border-[#232a33] p-4">
            <div className="rounded-md border border-[#232a33] bg-[#0d1117] p-3">
              <div className="flex items-center gap-2">
                <span className="status-dot" />

                <span className="text-xs font-medium text-zinc-300">
                  Local development
                </span>
              </div>

              <div className="mt-2 text-[11px] leading-5 text-zinc-600">
                FastAPI backend running on port 8000.
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-[#232a33] bg-[#07090d]/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-6 px-5 md:px-8">
              <div>
                <div className="text-sm font-semibold text-white">
                  Financial Intelligence Workspace
                </div>

                <div className="mt-0.5 text-xs text-zinc-600">
                  Document analysis, filing comparison, and report generation
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-2 rounded-md border border-[#232a33] bg-[#0b0f14] px-3 py-2">
                  <span className="status-dot" />

                  <span className="text-xs text-zinc-400">API connected</span>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-5 py-7 md:px-8 md:py-9">
            <section id="overview">
              <div className="mb-5">
                <div className="muted-label">Overview</div>

                <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                      Market intelligence dashboard
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                      Review company signals, filings, filing changes,
                      financial documents, and generated intelligence reports
                      from one workspace.
                    </p>
                  </div>

                  <div className="w-full lg:w-72">
                    <ApiStatus />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {workflow.map((step, index) => (
                  <div key={step.name} className="metric-card">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-medium text-zinc-200">
                        {step.name}
                      </div>

                      <div className="text-xs text-zinc-700">
                        0{index + 1}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-zinc-600">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="signals" className="panel">
              <div className="panel-header">
                <div className="section-title">Recent signals</div>

                <div className="section-description">
                  Stored market events retrieved from the FastAPI backend.
                </div>
              </div>

              <div className="panel-body">
                <EventFeed refreshKey={0} />
              </div>
            </section>

      

            <section id="filings" className="panel">
              <div className="panel-header">
                <div className="section-title">Filing watchlist</div>

                <div className="section-description">
                  Financial filing records currently available for processing.
                </div>
              </div>

              <div className="panel-body">
                <FilingFeed />
              </div>
            </section>

            <section id="sec-ingestion" className="panel">
              <div className="panel-header">
                <div className="section-title">SEC ingestion</div>

                <div className="section-description">
                Fetch recent SEC 10-Q or 10-K filings and store them as Vantage
                documents.
                </div>
              </div>

              <div className="panel-body">
                <SecIngestionPanel />
              </div>
            </section>

            <section id="comparisons" className="panel">
              <div className="panel-header">
                <div className="section-title">Filing comparisons</div>

                <div className="section-description">
                  Compare the two newest filings for a company and review added,
                  removed, and modified language.
                </div>
              </div>

              <div className="panel-body">
                <ComparisonFeed />
              </div>
            </section>

            <section id="reports" className="panel">
              <div className="panel-header">
                <div className="section-title">Intelligence reports</div>

                <div className="section-description">
                  Generate and review reports grounded in stored document
                  evidence.
                </div>
              </div>

              <div className="panel-body">
                <ReportFeed />
              </div>
            </section>

            <section id="documents" className="panel">
              <div className="panel-header">
                <div className="section-title">Document store</div>

                <div className="section-description">
                  Manage raw financial documents and inspect generated chunks.
                </div>
              </div>

              <div className="panel-body">
                <DocumentFeed />
              </div>
            </section>

            <section id="system" className="panel">
              <div className="panel-header">
                <div className="section-title">System architecture</div>

                <div className="section-description">
                  Current V1.5 processing flow.
                </div>
              </div>

              <div className="panel-body">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="muted-label">Frontend</div>

                    <div className="mt-2 text-sm text-zinc-300">Next.js</div>

                    <div className="mt-1 text-xs leading-5 text-zinc-600">
                      Dashboard, forms, reports, filing comparisons, and
                      document controls.
                    </div>
                  </div>

                  <div>
                    <div className="muted-label">Backend</div>

                    <div className="mt-2 text-sm text-zinc-300">FastAPI</div>

                    <div className="mt-1 text-xs leading-5 text-zinc-600">
                      REST routes, validation, comparison services, and AI
                      requests.
                    </div>
                  </div>

                  <div>
                    <div className="muted-label">Persistence</div>

                    <div className="mt-2 text-sm text-zinc-300">
                      SQLite + SQLAlchemy
                    </div>

                    <div className="mt-1 text-xs leading-5 text-zinc-600">
                      Documents, chunks, filings, events, reports, and detected
                      filing changes.
                    </div>
                  </div>

                  <div>
                    <div className="muted-label">Analysis</div>

                    <div className="mt-2 text-sm text-zinc-300">
                      Python difflib + OpenAI
                    </div>

                    <div className="mt-1 text-xs leading-5 text-zinc-600">
                      Deterministic filing comparison and evidence-grounded
                      report generation.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="border-t border-[#232a33] py-5 text-xs text-zinc-700">
              Vantage V1.5 · Local financial intelligence workspace
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}