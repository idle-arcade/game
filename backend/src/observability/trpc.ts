import { context, metrics, SpanStatusCode, trace } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import type { IncomingHttpHeaders } from "node:http";
import { rybbitCorrelationId } from "./correlation.js";

const tracer = trace.getTracer("idle-arcade.trpc");
const meter = metrics.getMeter("idle-arcade.trpc");
const calls = meter.createCounter("trpc.server.calls", { description: "Completed tRPC calls" });
const duration = meter.createHistogram("trpc.server.duration", {
  description: "tRPC procedure duration",
  unit: "s",
  advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] },
});

type ProcedureResult = { ok: boolean; error?: TRPCError };

export async function observeProcedure<T extends ProcedureResult>(
  path: string,
  type: string,
  headers: IncomingHttpHeaders,
  next: () => Promise<T>,
): Promise<T> {
  if (path === "health.check") return next();
  const attributes = { "rpc.system": "trpc", "rpc.method": path, "rpc.operation.type": type };
  return tracer.startActiveSpan(`trpc ${path}`, { attributes }, context.active(), async (span) => {
    const id = rybbitCorrelationId(headers["x-rybbit-correlation-id"]);
    if (id) span.setAttribute("rybbit.correlation_id", id);
    const started = performance.now();
    let code = "OK";
    try {
      const result = await next();
      if (!result.ok) code = result.error?.code ?? "INTERNAL_SERVER_ERROR";
      return result;
    } catch (error) {
      code = error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR";
      throw error;
    } finally {
      if (code !== "OK") span.setAttribute("rpc.error.code", code);
      // Expected validation/authentication rejections are outcomes, not service failures.
      if (
        ["INTERNAL_SERVER_ERROR", "BAD_GATEWAY", "SERVICE_UNAVAILABLE", "GATEWAY_TIMEOUT"].includes(
          code,
        )
      ) {
        span.setAttribute("error.type", code);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      const labels = { ...attributes, "rpc.error.code": code };
      // These measurements count all calls, independently of trace sampling.
      calls.add(1, labels);
      duration.record((performance.now() - started) / 1000, labels);
      span.end();
    }
  });
}
