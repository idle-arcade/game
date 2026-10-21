import "dotenv/config";
import { register } from "node:module";
import { IncomingMessage } from "node:http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { envDetector } from "@opentelemetry/resources";
import { privacyExporter } from "./observability/exporter.js";
import { rybbitCorrelationId } from "./observability/correlation.js";

let sdk: NodeSDK | undefined;

// Export is opt-in and needs an explicit destination; never fall back to localhost.
if (process.env.OTEL_ENABLED === "true" && process.env.OTEL_SDK_DISABLED !== "true") {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint || !/^https?:\/\//.test(endpoint)) {
    throw new Error("OTEL_ENABLED requires an HTTP OTEL_EXPORTER_OTLP_ENDPOINT");
  }
  // Register before loading application dependencies (including ESM dependencies).
  register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);
  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || "idle-arcade-backend",
    resourceDetectors: [envDetector],
    // Node traces use OTLP HTTP/protobuf; the metrics exporter uses OTEL_* settings.
    traceExporter: privacyExporter(new OTLPTraceExporter()),
    // Logs go to stdout for collection by the host agent, independently of OTLP.
    logRecordProcessors: [],
    instrumentations: [
      new HttpInstrumentation({
        disableOutgoingRequestInstrumentation: true,
        ignoreIncomingRequestHook: (request) => {
          const path = request.url?.split("?")[0] ?? "";
          return !path.startsWith("/trpc/") || path === "/trpc/health.check";
        },
        requestHook: (span, request) => {
          if (!(request instanceof IncomingMessage)) return;
          span.updateName("HTTP /trpc");
          span.setAttribute("http.route", "/trpc");
          const id = rybbitCorrelationId(request.headers["x-rybbit-correlation-id"]);
          if (id) span.setAttribute("rybbit.correlation_id", id);
        },
      }),
      new RuntimeNodeInstrumentation({ monitoringPrecision: 5000 }),
    ],
  });
  sdk.start();
}

export async function shutdownTelemetry() {
  await sdk?.shutdown();
}
