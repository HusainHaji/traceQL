const fastify = require("fastify")({ logger: true });
const cors = require("@fastify/cors");
const websocket = require("@fastify/websocket");
const { z } = require("zod");
const { nanoid } = require("nanoid");
const { db } = require("./db");

fastify.register(cors, { origin: true });
fastify.register(websocket);

// --------------------
// Validation
// --------------------
const ingestSchema = z.object({
  service: z.string().min(1),
  level: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
  message: z.string().min(1),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  parentSpanId: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  tags: z.record(z.string(), z.string()).optional()
});

// --------------------
// WebSocket clients
// --------------------
const clients = new Set();

function broadcast(event) {
  const msg = JSON.stringify({ type: "event", data: event });
  for (const conn of clients) {
    if (conn.socket.readyState === 1) {
      try {
        conn.socket.send(msg);
      } catch {}
    }
  }
}

// --------------------
// Routes
// --------------------
fastify.get("/health", async () => ({ ok: true }));

fastify.post("/ingest", async (req, reply) => {
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send(parsed.error.flatten());
  }

  const body = parsed.data;

  const event = {
    id: nanoid(),
    ts: Date.now(),
    service: body.service,
    level: body.level,
    message: body.message,
    traceId: body.traceId ?? null,
    spanId: body.spanId ?? null,
    parentSpanId: body.parentSpanId ?? null,
    durationMs: body.durationMs ?? null,
    tagsJson: JSON.stringify(body.tags ?? {})
  };

  db.prepare(`
    INSERT INTO events
    (id, ts, service, level, message, traceId, spanId, parentSpanId, durationMs, tagsJson)
    VALUES
    (@id, @ts, @service, @level, @message, @traceId, @spanId, @parentSpanId, @durationMs, @tagsJson)
  `).run(event);

  broadcast(event);

  return { ok: true, id: event.id };
});

fastify.get("/stream", { websocket: true }, (conn) => {
  clients.add(conn);
  conn.socket.on("close", () => clients.delete(conn));
});

fastify.get("/events", async (req) => {
  const { service, level, q, limit = "100" } = req.query || {};
  const lim = Math.min(parseInt(limit, 10) || 100, 500);

  let where = [];
  let params = {};

  if (service) {
    where.push("service = @service");
    params.service = service;
  }

  if (level) {
    where.push("level = @level");
    params.level = level;
  }

  let ids = null;
  /*if (q && String(q).trim()) {
    const rows = db
      .prepare(`SELECT id FROM events_fts WHERE events_fts MATCH @q LIMIT 2000`)
      .all({ q: String(q) });

    ids = rows.map(r => r.id);
    if (ids.length === 0) return { items: [] };

    where.push(`id IN (${ids.map((_, i) => `@id${i}`).join(",")})`);
    ids.forEach((id, i) => (params[`id${i}`] = id));
  }*/
    if (q && String(q).trim()) {
        const query = String(q).trim();
        where.push("message LIKE @likeq");
        params.likeq = `%${query}%`;
    }
 

  const sql = `
    SELECT * FROM events
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ts DESC
    LIMIT @lim
  `;
  params.lim = lim;

  const items = db.prepare(sql).all(params).map(r => ({
    ...r,
    tags: JSON.parse(r.tagsJson)
  }));

  return { items };
});

fastify.get("/trace/:traceId", async (req) => {
  const { traceId } = req.params;

  const rows = db.prepare(`
    SELECT * FROM events
    WHERE traceId = ?
    ORDER BY ts ASC
  `).all(traceId).map(r => ({ ...r, tags: JSON.parse(r.tagsJson) }));

  const spans = new Map();
  for (const r of rows) {
    if (r.spanId) spans.set(r.spanId, { ...r, children: [] });
  }

  const roots = [];
  for (const span of spans.values()) {
    if (span.parentSpanId && spans.has(span.parentSpanId)) {
      spans.get(span.parentSpanId).children.push(span);
    } else {
      roots.push(span);
    }
  }

  return { traceId, roots, raw: rows };
});

// --------------------
// Start server
// --------------------
fastify.listen({ port: 5050, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
