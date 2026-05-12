/**
 * FL MOVE — Move Checklist API
 * Stored separately from app state so existing task data is never affected.
 *
 * GET    /api/checklist  → returns checklist JSON (or null on first load)
 * POST   /api/checklist  → saves checklist JSON
 * DELETE /api/checklist  → resets (triggers re-seed on next GET)
 */

const KV_KEY = "checklist_v1";

export async function onRequestGet({ env }) {
  if (!env.FL_MOVE_DATA) return err("KV not configured");
  const val = await env.FL_MOVE_DATA.get(KV_KEY);
  return json(val ? JSON.parse(val) : null);
}

export async function onRequestPost({ request, env }) {
  if (!env.FL_MOVE_DATA) return err("KV not configured");
  let body;
  try { body = await request.text(); JSON.parse(body); }
  catch { return json({ error: "Invalid JSON" }, 400); }
  await env.FL_MOVE_DATA.put(KV_KEY, body);
  return json({ ok: true });
}

export async function onRequestDelete({ env }) {
  if (!env.FL_MOVE_DATA) return err("KV not configured");
  await env.FL_MOVE_DATA.delete(KV_KEY);
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
function err(msg) { return json({ error: msg }, 500); }
