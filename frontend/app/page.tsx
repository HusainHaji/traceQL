"use client";

import { useEffect, useState } from "react";

type EventRow = {
  id: string;
  ts: number;
  service: string;
  level: string;
  message: string;
  traceId?: string | null;
  spanId?: string | null;
  parentSpanId?: string | null;
  durationMs?: number | null;
  tags?: Record<string, string>;
};

const API = "http://127.0.0.1:5050";

export default function Home() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [service, setService] = useState("");
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<EventRow | null>(null);

  async function refresh() {
    const params = new URLSearchParams();
    if (service.trim()) params.set("service", service.trim());
    if (level.trim()) params.set("level", level.trim());
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "200");

    const res = await fetch(`${API}/events?${params.toString()}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:5050/stream");
    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed?.type === "event") {
        setItems((prev) => [parsed.data, ...prev].slice(0, 300));
      }
    };
    ws.onerror = () => {
      // If WS fails, the page still works via manual refresh.
    };
    return () => ws.close();
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">TraceQL</h1>
            <p className="text-sm text-gray-600">
              Live tail + indexed search + trace reconstruction
            </p>
          </div>
          <button
            className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="service (api/worker/db)"
            value={service}
            onChange={(e) => setService(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="level (ERROR/WARN/INFO)"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm flex-1 min-w-[220px]"
            placeholder='q (full-text on message, e.g. "checkout" or "provider")'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
            onClick={refresh}
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border rounded">
            <div className="p-2 text-sm text-gray-600 border-b">
              Live events (latest first)
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelected(it)}
                  className="w-full text-left px-3 py-2 border-b hover:bg-gray-50"
                >
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="text-xs text-gray-500 w-[120px]">
                      {new Date(it.ts).toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 border rounded">
                      {it.service}
                    </span>
                    <span className="text-xs px-2 py-0.5 border rounded">
                      {it.level}
                    </span>
                    {it.durationMs != null && (
                      <span className="text-xs text-gray-600">
                        {it.durationMs}ms
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1">{it.message}</div>
                  {it.traceId && (
                    <div className="text-xs text-gray-500 mt-1">
                      traceId: {it.traceId}
                    </div>
                  )}
                </button>
              ))}

              {items.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No events yet. (Make sure generator is running.)
                </div>
              )}
            </div>
          </div>

          <div className="border rounded">
            <div className="p-2 text-sm text-gray-600 border-b">Event detail</div>

            {!selected ? (
              <div className="p-3 text-sm text-gray-500">Click an event.</div>
            ) : (
              <div className="p-3 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Time:</span>{" "}
                  {new Date(selected.ts).toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Service:</span>{" "}
                  {selected.service}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Level:</span> {selected.level}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Message:</span>{" "}
                  {selected.message}
                </div>

                {selected.traceId && (
                  <a
                    className="text-sm underline"
                    href={`/trace/${selected.traceId}`}
                  >
                    Open trace →
                  </a>
                )}

                <pre className="text-xs bg-black text-white border border-gray-700 rounded p-2 overflow-auto">
{JSON.stringify(selected, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
