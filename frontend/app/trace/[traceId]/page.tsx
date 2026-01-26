"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Span = {
  id: string;
  ts: number;
  service: string;
  message: string;
  spanId?: string | null;
  parentSpanId?: string | null;
  durationMs?: number | null;
  children?: Span[];
};

const API = "http://127.0.0.1:5050";

function SpanNode({ span, depth = 0 }: { span: Span; depth?: number }) {
  return (
    <div style={{ marginLeft: depth * 16 }} className="border-l pl-3 py-2">
      <div className="text-sm flex gap-2 flex-wrap items-center">
        <span className="font-medium">{span.service}</span>
        <span className="text-gray-400 text-xs">{span.durationMs ?? 0}ms</span>
        {span.spanId && (
          <span className="text-gray-500 text-xs">spanId: {span.spanId}</span>
        )}
      </div>
      <div className="text-sm">{span.message}</div>
      {span.children?.map((c) => (
        <SpanNode key={c.id} span={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function TracePage() {
  const params = useParams<{ traceId: string }>();
  const traceId = params?.traceId ?? "";

  const [roots, setRoots] = useState<Span[]>([]);
  const [rawCount, setRawCount] = useState<number>(0);

  useEffect(() => {
    if (!traceId) return;

    fetch(`${API}/trace/${traceId}`)
      .then((r) => r.json())
      .then((d) => {
        setRoots(d.roots ?? []);
        setRawCount((d.raw ?? []).length);
      })
      .catch(() => {
        setRoots([]);
        setRawCount(0);
      });
  }, [traceId]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <a className="underline text-sm" href="/">
          ← Back
        </a>

        <div>
          <h1 className="text-xl font-semibold">Trace</h1>
          <p className="text-sm text-gray-400">
            traceId: {traceId} • events: {rawCount}
          </p>
        </div>

        <div className="border rounded p-3">
          {roots.length === 0 ? (
            <div className="text-sm text-gray-400">No spans found.</div>
          ) : (
            roots.map((r) => <SpanNode key={r.id} span={r} />)
          )}
        </div>
      </div>
    </main>
  );
}


/*"use client";

import { useEffect, useState } from "react";

type Span = {
  id: string;
  ts: number;
  service: string;
  message: string;
  spanId?: string | null;
  parentSpanId?: string | null;
  durationMs?: number | null;
  children?: Span[];
};

const API = "http://127.0.0.1:5050";

function SpanNode({ span, depth = 0 }: { span: Span; depth?: number }) {
  return (
    <div style={{ marginLeft: depth * 16 }} className="border-l pl-3 py-2">
      <div className="text-sm flex gap-2 flex-wrap items-center">
        <span className="font-medium">{span.service}</span>
        <span className="text-gray-500 text-xs">{span.durationMs ?? 0}ms</span>
        {span.spanId && (
          <span className="text-gray-400 text-xs">spanId: {span.spanId}</span>
        )}
      </div>
      <div className="text-sm">{span.message}</div>
      {span.children?.map((c) => (
        <SpanNode key={c.id} span={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function TracePage({ params }: { params: { traceId: string } }) {
  const [roots, setRoots] = useState<Span[]>([]);
  const [rawCount, setRawCount] = useState<number>(0);

  useEffect(() => {
    fetch(`${API}/trace/${params.traceId}`)
      .then((r) => r.json())
      .then((d) => {
        setRoots(d.roots ?? []);
        setRawCount((d.raw ?? []).length);
      });
  }, [params.traceId]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <a className="underline text-sm" href="/">
          ← Back
        </a>

        <div>
          <h1 className="text-xl font-semibold">Trace</h1>
          <p className="text-sm text-gray-600">
            traceId: {params.traceId} • events: {rawCount}
          </p>
        </div>

        <div className="border rounded p-3">
          {roots.length === 0 ? (
            <div className="text-sm text-gray-500">No spans found.</div>
          ) : (
            roots.map((r) => <SpanNode key={r.id} span={r} />)
          )}
        </div>
      </div>
    </main>
  );
}*/
