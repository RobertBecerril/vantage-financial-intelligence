"use client";

import { useState } from "react";

type ChunkItem = {
  id: number;
  document_id: number;
  ticker: string;
  chunk_index: number;
  text: string;
  token_estimate: number;
};

type ChunkViewerProps = {
  documentId: number;
};

export default function ChunkViewer({ documentId }: ChunkViewerProps) {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function fetchChunks() {
    setStatus("Loading chunks...");

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/chunks`
      );

      if (!response.ok) {
        throw new Error("Could not load chunks");
      }

      const data = await response.json();
      setChunks(data);
      setIsOpen(true);
      setStatus("");
    } catch {
      setStatus("Could not load chunks.");
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={fetchChunks}
        className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        View Chunks
      </button>

      {status && <p className="mt-3 text-sm text-zinc-500">{status}</p>}

      {isOpen && (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-zinc-200">
              Chunks for Document {documentId}
            </h4>

            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-zinc-500 hover:text-white"
            >
              Close
            </button>
          </div>

          {chunks.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No chunks found yet. Click “Chunk Document” first.
            </p>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Chunk #{chunk.chunk_index}</span>
                  <span>{chunk.token_estimate} words</span>
                </div>

                <p className="text-sm leading-6 text-zinc-300">
                  {chunk.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}