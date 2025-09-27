from mitmproxy import http, ctx
import json, re, urllib.parse

# Match only our relevant domains and endpoints
TARGETS = [
    r"mittwald-oauth-bridge\.fly\.dev/\.well-known/oauth-authorization-server",
    r"mittwald-oauth-bridge\.fly\.dev/register",
    r"mittwald-oauth-bridge\.fly\.dev/authorize",
    r"mittwald-oauth-bridge\.fly\.dev/token",
    r"mittwald-mcp-fly2\.fly\.dev/mcp",
]

REDACT_KEYS = {
    "client_secret",
    "code_verifier",
    "registration_access_token",
    "password",
    "refresh_token",
    "access_token",
}


def _is_target(url: str) -> bool:
    return any(re.search(p, url) for p in TARGETS)


def _redact_dict(d: dict) -> dict:
    redacted = {}
    for k, v in d.items():
        if isinstance(v, dict):
            redacted[k] = _redact_dict(v)
        elif isinstance(v, list):
            redacted[k] = [(_redact_dict(i) if isinstance(i, dict) else ("[REDACTED]" if k in REDACT_KEYS else i)) for i in v]
        elif k in REDACT_KEYS:
            redacted[k] = "[REDACTED]"
        else:
            redacted[k] = v
    return redacted


def _parse_body(flow: http.HTTPFlow):
    ct = (flow.request.headers.get("content-type") or "").lower()
    raw = flow.request.get_text() or ""
    if "application/json" in ct:
        try:
            data = json.loads(raw)
            return "json", _redact_dict(data)
        except Exception:
            return "text", raw
    if "application/x-www-form-urlencoded" in ct:
        try:
            pairs = urllib.parse.parse_qsl(raw, keep_blank_values=True)
            data = {k: ("[REDACTED]" if k in REDACT_KEYS else v) for k, v in pairs}
            return "form", data
        except Exception:
            return "text", raw
    return "text", raw


def request(flow: http.HTTPFlow):
    url = flow.request.pretty_url
    if not _is_target(url):
        return
    ctx.log.info(f"[{flow.request.method}] {url}")
    ctx.log.info(f"  UA: {flow.request.headers.get('User-Agent','')}")
    if flow.request.method == "OPTIONS":
        ctx.log.info("  Preflight (CORS)")
        return
    kind, body = _parse_body(flow)
    if kind in ("json", "form"):
        try:
            ctx.log.info(f"  Body ({kind}): {json.dumps(body)[:4000]}")
        except Exception:
            ctx.log.info(f"  Body ({kind}): {str(body)[:4000]}")
    elif body:
        ctx.log.info(f"  Body (text): {body[:4000]}")


def response(flow: http.HTTPFlow):
    url = flow.request.pretty_url
    if not _is_target(url):
        return
    ctx.log.info(f"[resp {flow.response.status_code}] {url}")
    ct = (flow.response.headers.get("content-type") or "").lower()
    text = flow.response.get_text() or ""
    if "application/json" in ct:
        try:
            data = json.loads(text)
            # Summarize common fields
            slim = {k: data.get(k) for k in ("client_id", "error", "error_description")}
            ctx.log.info(f"  JSON: {json.dumps(slim)}")
        except Exception:
            ctx.log.info(f"  JSON raw: {text[:4000]}")
    else:
        if text:
            ctx.log.info(f"  Body: {text[:4000]}")
