#!/usr/bin/env bash
set -euo pipefail

# Stream Fly logs, filter for oidc-provider registration lifecycle events,
# and print a readable summary. Pass any extra flags straight through to
# `fly logs` (e.g. `--since 1h`).

# Ensure we have an app name if none supplied via CLI
needs_app=true
for arg in "$@"; do
  case "$arg" in
    -a|--app)
      needs_app=false
      break
      ;;
  esac
done

if $needs_app; then
  if [[ -n "${FLY_APP:-}" ]]; then
    set -- --app "$FLY_APP" "$@"
  else
    candidate_files=("fly.toml" "packages/oauth-server/fly.toml" "packages/mcp-server/fly.toml")
    default_app=""
    for candidate in "${candidate_files[@]}"; do
      if [[ -f "$candidate" ]]; then
        default_app=$(grep -E '^app *= *' "$candidate" | head -n1 | sed -E 's/app *= *"?([^"[:space:]]+)"?.*/\1/')
        if [[ -n "$default_app" ]]; then
          break
        fi
      fi
    done
    if [[ -n "$default_app" ]]; then
      set -- --app "$default_app" "$@"
    else
      echo "Error: specify Fly app with --app or set FLY_APP environment variable" >&2
      exit 1
    fi
  fi
fi

stream=false
remaining=()
for arg in "$@"; do
  if [[ "$arg" == "--stream" ]]; then
    stream=true
    continue
  fi
  remaining+=("$arg")
done

cmd=(fly logs --json)
if ! $stream; then
  cmd+=(--no-tail)
fi
cmd+=("${remaining[@]}")

"${cmd[@]}" | jq -r '
  .message as $msg
  | ($msg | fromjson? ) as $pino
  | select($pino != null)
  | ($pino.event // "") as $event
  | select(($event | type) == "string" and ($event | startswith("registration_")))
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
