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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggleChunks() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/chunks`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load document chunks.");
      }

      const data: ChunkItem[] = await response.json();

      setChunks(data);
      setIsOpen(true);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to load document chunks.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleChunks}
        disabled={isLoading}
        className="text-xs font-medium text-zinc-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Loading..." : isOpen ? "Hide chunks" : "View chunks"}
      </button>

      {error && (
        <div className="mt-3 rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {isOpen && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#26303d] bg-[#080c12]">
          <div className="flex items-center justify-between border-b border-[#26303d] px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-zinc-300">
                Document chunks
              </div>

              <div className="mt-1 text-[11px] text-zinc-600">
                {chunks.length} chunk{chunks.length === 1 ? "" : "s"} stored
              </div>
            </div>

            <span className="text-[11px] text-zinc-600">
              Document #{documentId}
            </span>
          </div>

          {chunks.length === 0 ? (
            <div className="px-4 py-6 text-sm text-zinc-500">
              No chunks are available for this document.
            </div>
          ) : (
            <div className="divide-y divide-[#26303d]">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-cyan-300">
                      Chunk {chunk.chunk_index + 1}
                    </div>

                    <div className="text-[11px] text-zinc-600">
                      {chunk.token_estimate} estimated tokens
                    </div>
                  </div>

                  <p className="text-xs leading-6 text-zinc-400">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}