"use client";

import { useEffect, useState } from "react";
import ChunkViewer from "./ChunkViewer";

type DocumentItem = {
  id: number;
  ticker: string;
  document_type: string;
  title: string;
  source_url: string;
  raw_text: string;
  status: string;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DocumentFeed() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function fetchDocuments() {
    try {
      const response = await fetch("http://localhost:8000/api/documents", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }

      const data: DocumentItem[] = await response.json();

      setDocuments(data);
      setError("");
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to connect to the documents API.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function chunkDocument(documentId: number) {
    setActiveDocumentId(documentId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/chunk`,
        {
          method: "POST",
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail || "Unable to chunk the document."
        );
      }

      setMessage(`Document #${documentId} is ready for retrieval.`);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to chunk the document.");
      }
    } finally {
      setActiveDocumentId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#26303d] bg-[#090d13] px-5 py-8 text-sm text-zinc-500">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0 && !error) {
    return (
      <div className="rounded-lg border border-dashed border-[#26303d] px-5 py-10 text-center">
        <div className="text-sm font-medium text-zinc-300">
          No documents available
        </div>

        <p className="mt-2 text-xs text-zinc-600">
          Stored financial documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="table-shell">
        <div className="hidden grid-cols-[90px_190px_minmax(0,1fr)_120px_170px] gap-4 border-b border-[#26303d] bg-white/[0.015] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 lg:grid">
          <div>Ticker</div>
          <div>Document type</div>
          <div>Document</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {documents.map((document) => (
          <div
            key={document.id}
            className="border-b border-[#26303d] last:border-b-0"
          >
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-[90px_190px_minmax(0,1fr)_120px_170px] lg:items-center">
              <div className="flex items-center justify-between lg:block">
                <div className="text-sm font-semibold text-white">
                  {document.ticker}
                </div>

                <div className="text-xs text-zinc-600 lg:hidden">
                  #{document.id}
                </div>
              </div>

              <div className="text-xs leading-5 text-cyan-300">
                {document.document_type}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-200">
                  {document.title}
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                  {document.raw_text}
                </p>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-xs text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {formatStatus(document.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                <button
                  type="button"
                  onClick={() => chunkDocument(document.id)}
                  disabled={activeDocumentId === document.id}
                  className="text-xs font-medium text-zinc-300 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeDocumentId === document.id
                    ? "Processing..."
                    : "Chunk document"}
                </button>

                <a
                  href={document.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-zinc-500 transition hover:text-cyan-300"
                >
                  Source
                </a>
              </div>
            </div>

            <div className="border-t border-[#1d2630] bg-black/10 px-4 py-3 lg:pl-[304px]">
              <ChunkViewer documentId={document.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}