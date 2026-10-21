import { trace, isSpanContextValid } from "@opentelemetry/api";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: process.env.OTEL_SERVICE_NAME || "idle-arcade-backend" },
  mixin() {
    const span = trace.getActiveSpan()?.spanContext();
    return span && isSpanContextValid(span) ? { trace_id: span.traceId, span_id: span.spanId } : {};
  },
});

// Retain source locations, excluding error messages, causes, SQL and request values.
export function errorDetails(error: unknown) {
  return error instanceof Error
    ? {
        type: error.name,
        stack: error.stack
          ?.split("\n")
          .filter((line) => /^\s+at /.test(line))
          .join("\n"),
      }
    : { type: "UnknownError" };
}
