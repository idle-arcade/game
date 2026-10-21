#!/bin/sh
set -eu

mkdir -p /etc/nginx/otel
: > /etc/nginx/otel/http.conf
cat > /etc/nginx/otel/trpc.conf <<'NGINX'
proxy_set_header traceparent "";
proxy_set_header tracestate "";
NGINX

if [ "${OTEL_ENABLED:-false}" != "true" ]; then
  exit 0
fi

# nginx uses OTLP/gRPC, unlike the Node SDK's HTTP/protobuf endpoint.
endpoint="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
service="${OTEL_SERVICE_NAME:-idle-arcade-frontend}"
# Only literal endpoints/names may be interpolated into nginx configuration.
case "$endpoint$service" in
  *[!A-Za-z0-9:/._-]*)
    echo 'Invalid characters in nginx telemetry endpoint or service name' >&2
    exit 1
    ;;
esac
printf '%s' "$endpoint" | grep -Eq '^(https?://)?[A-Za-z0-9][A-Za-z0-9._-]*:[0-9]{1,5}$' || {
  echo 'OTEL_ENABLED requires an OTLP/gRPC host:port endpoint for nginx' >&2
  exit 1
}
printf '%s' "$service" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' || exit 1

cat > /etc/nginx/otel/http.conf <<NGINX
otel_exporter { endpoint $endpoint; }
otel_service_name $service;
map \$uri \$otel_trpc_enabled {
  default on;
  /trpc/health.check off;
}
NGINX

cat > /etc/nginx/otel/trpc.conf <<'NGINX'
otel_trace $otel_trpc_enabled;
otel_trace_context inject;
otel_span_name "nginx /trpc";
# The Collector privacy processor removes default URL/IP/user-agent attributes.
NGINX
