/**
 * FL MOVE — Cross-device data sync API
 *
 * GET  /api/data  → returns stored app state JSON from Cloudflare KV
 * POST /api/data  → saves app state JSON to Cloudflare KV
 * DELETE /api/data → resets to empty (triggers demo data reload on next GET)
 *
 * The KV binding FL_MOVE_DATA is set at the Pages project level.
 * Auth is already enforced by _middleware.js before this runs.
 */

const KV_KEY = "app_state_v1";

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.FL_MOVE_DATA) {
    return new Response(JSON.stringify({ error: "KV not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const value = await env.FL_MOVE_DATA.get(KV_KEY);

  // Nothing stored yet — return null so the app seeds demo data
  if (value === null) {
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(value, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.FL_MOVE_DATA) {
    return new Response(JSON.stringify({ error: "KV not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.text();
    // Validate it's actually JSON before storing
    JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Store with no expiration — data lives until explicitly replaced or deleted
  await env.FL_MOVE_DATA.put(KV_KEY, body);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestDelete(context) {
  const { env } = context;

  if (!env.FL_MOVE_DATA) {
    return new Response(JSON.stringify({ error: "KV not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.FL_MOVE_DATA.delete(KV_KEY);

  return new Response(JSON.stringify({ ok: true, message: "Data reset" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
