#!/usr/bin/env bash
set -euo pipefail

# Stream Fly logs, filter for oidc-provider registration lifecycle events,
# and print a readable summary. Pass any extra flags straight through to
# `fly logs` (e.g. `--since 1h`).

fly logs --json "$@" | jq -r '
  .message as $msg
  | ($msg | fromjson? ) as $pino
  | select($pino != null and ($pino.event? | startswith("registration_")))
  | ($pino.time / 1000 | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ")) as $ts
  | ($pino.redirectUris // []) as $uris
  | ($pino.grantTypes // []) as $grants
  | ($uris | if length>0 then join(",") else "-" end) as $uriString
  | ($grants | if length>0 then join(",") else "-" end) as $grantString
  | ($pino.outcome // "n/a") as $outcome
  | ($pino.clientId // "n/a") as $client
  | ($pino.tokenEndpointAuthMethod // "n/a") as $auth
  | ($pino.ip // "n/a") as $ip
  | ($pino.path // "") as $path
  | ($pino.userAgent // "") as $ua
  | ($pino.metadata // null) as $metadata
  | ($pino.request // null) as $request
  | ($pino.error // null) as $error
  | ($pino.error_description // null) as $errDesc
  | [
      $ts,
      $pino.event,
      "outcome=" + $outcome,
      "client=" + $client,
      "auth=" + $auth,
      "grants=" + $grantString,
      "redirects=" + $uriString,
      "ip=" + $ip
    ] | join(" | ")
  | .
    + (if $path != "" then "\n    path=" + $path else "" end)
    + (if $ua != "" then "\n    ua=" + $ua else "" end)
    + (if $metadata != null then "\n    metadata=" + ($metadata | tojson) else "" end)
    + (if $request != null then "\n    request=" + ($request | tojson) else "" end)
    + (if $error != null then "\n    error=" + $error + (if $errDesc != null then " (" + $errDesc + ")" else "" end) else "" end)
'
