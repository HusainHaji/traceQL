const API_BASE = process.env.API_BASE || "http://127.0.0.1:5050";

/*async function post(evt) {
  await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(evt)
  });
}*/

async function post(evt) {
  for (;;) {
    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(evt),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

function traceId() { return Math.random().toString(16).slice(2); }
function spanId() { return Math.random().toString(16).slice(2, 10); }
function rand(a) { return a[Math.floor(Math.random() * a.length)]; }

const levels = ["INFO", "INFO", "INFO", "WARN", "ERROR"];

(async () => {
  while (true) {
    const t = traceId();
    const root = spanId();
    const child = spanId();

    await post({
      service: "api",
      level: rand(levels),
      message: "HTTP /checkout",
      traceId: t,
      spanId: root,
      durationMs: 50 + Math.floor(Math.random() * 150),
      tags: { route: "/checkout", userId: String(1 + Math.floor(Math.random() * 100)) }
    });

    await post({
      service: "worker",
      level: rand(levels),
      message: "payment provider call",
      traceId: t,
      spanId: child,
      parentSpanId: root,
      durationMs: 80 + Math.floor(Math.random() * 400),
      tags: { provider: "stripe-like", retry: String(Math.floor(Math.random() * 3)) }
    });

    await post({
      service: "db",
      level: "INFO",
      message: "INSERT order",
      traceId: t,
      spanId: spanId(),
      parentSpanId: root,
      durationMs: 5 + Math.floor(Math.random() * 30),
      tags: { table: "orders" }
    });

    await new Promise(r => setTimeout(r, 250));
  }
})();
