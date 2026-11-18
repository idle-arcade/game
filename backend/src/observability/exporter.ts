import type { Attributes } from "@opentelemetry/api";
import type { ReadableSpan, SpanExporter, TimedEvent } from "@opentelemetry/sdk-trace";

// Opt in to safe fields. HTTP instrumentation otherwise includes URLs, IPs and user agents.
const SPAN_ATTRIBUTES = new Set([
  "http.request.method",
  "http.response.status_code",
  "http.method",
  "http.status_code",
  "http.route",
  "network.protocol.version",
  "rpc.system",
  "rpc.method",
  "rpc.operation.type",
  "rpc.error.code",
  "error.type",
  "rybbit.correlation_id",
  // Internal account ID; the request acts for this account.
  "user.id",
  // Prisma: SQL with placeholders only; parameter values are not part of the text.
  "db.system.name",
  "db.query.text",
]);
// Game attributes and events written by our own code (src/darts/telemetry.ts).
const OWN_PREFIX = "darts.";

const isSafe = (key: string) => SPAN_ATTRIBUTES.has(key) || key.startsWith(OWN_PREFIX);

function safeAttributes(attributes: Attributes | undefined, keep: (key: string) => boolean) {
  const safe: Attributes = {};
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (keep(key)) safe[key] = value;
  }
  return safe;
}

// Raw automatic events (e.g. exception messages) may contain request inputs or database
// parameters, so only our own events are kept.
const safeEvents = (events: TimedEvent[]) =>
  events
    .filter((event) => event.name.startsWith(OWN_PREFIX))
    .map((event) => ({
      ...event,
      attributes: safeAttributes(event.attributes, (key) => key.startsWith(OWN_PREFIX)),
    }));

function safeSpan(span: ReadableSpan): ReadableSpan {
  const attributes = safeAttributes(span.attributes, isSafe);
  return {
    name: span.name,
    kind: span.kind,
    spanContext: () => span.spanContext(),
    parentSpanContext: span.parentSpanContext,
    startTime: span.startTime,
    endTime: span.endTime,
    duration: span.duration,
    status: { code: span.status.code },
    attributes,
    events: safeEvents(span.events),
    links: [],
    ended: span.ended,
    resource: span.resource,
    instrumentationScope: span.instrumentationScope,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount,
  };
}

export function privacyExporter(exporter: SpanExporter): SpanExporter {
  return {
    export: (spans, callback) => exporter.export(spans.map(safeSpan), callback),
    shutdown: () => exporter.shutdown(),
    forceFlush: () => exporter.forceFlush?.() ?? Promise.resolve(),
  };
}
