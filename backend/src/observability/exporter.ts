import type { Attributes } from "@opentelemetry/api";
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace";

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
]);

function safeSpan(span: ReadableSpan): ReadableSpan {
  const attributes: Attributes = {};
  for (const [key, value] of Object.entries(span.attributes)) {
    if (SPAN_ATTRIBUTES.has(key)) attributes[key] = value;
  }
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
    // Raw automatic exception messages may contain request inputs or database parameters.
    events: [],
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
