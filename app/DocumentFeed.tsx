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

export default function DocumentFeed() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function fetchDocuments() {
    try {
      const response = await fetch("http://localhost:8000/api/documents");

      if (!response.ok) {
        throw new Error("Could not load documents");
      }

      const data = await response.json();
      setDocuments(data);
    } catch {
      setError("Could not connect to documents API");
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function chunkDocument(documentId: number) {
    setStatus(`Chunking document ${documentId}...`);

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/chunk`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Could not chunk document");
      }

      setStatus(`Document ${documentId} chunked successfully.`);
    } catch {
      setStatus(`Could not chunk document ${documentId}.`);
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-300">
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-zinc-400">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {status && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-300">
          {status}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:border-cyan-400/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{document.ticker}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Document ID: {document.id}
                </div>
              </div>

              <span className="rounded-full bg-purple-400/10 px-3 py-1 text-xs text-purple-300">
                {document.document_type}
              </span>
            </div>

            <h3 className="mt-5 text-lg font-medium leading-7 text-white">
              {document.title}
            </h3>

            <p className="mt-3 line-clamp-5 text-sm leading-6 text-zinc-400">
              {document.raw_text}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status</span>
                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">
                  {document.status}
                </span>
              </div>

              <div className="truncate text-xs text-zinc-600">
                {document.source_url}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={() => chunkDocument(document.id)}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Chunk Document
              </button>

              <ChunkViewer documentId={document.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}