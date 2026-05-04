/**
 * FL MOVE — Notes / Log API
 *
 * GET    /api/notes         → returns all notes (array, newest first)
 * POST   /api/notes         → adds a new note entry
 * DELETE /api/notes?id=...  → deletes a single note by id
 *
 * Each note: { id, author, body, pinned, createdAt, updatedAt }
 *
 * Auth enforced upstream by _middleware.js.
 */

const KV_KEY = "notes_v1";

async function getNotes(env) {
  const raw = await env.FL_MOVE_DATA.get(KV_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveNotes(env, notes) {
  await env.FL_MOVE_DATA.put(KV_KEY, JSON.stringify(notes));
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.FL_MOVE_DATA) return kvError();
  const notes = await getNotes(env);
  return json(notes);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.FL_MOVE_DATA) return kvError();

  let entry;
  try {
    entry = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (!entry.body || !entry.body.trim()) {
    return new Response(JSON.stringify({ error: "Note body required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const notes = await getNotes(env);
  const now = new Date().toISOString();
  const newNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    author: entry.author || "Unknown",
    body: entry.body.trim(),
    pinned: entry.pinned || false,
    createdAt: now,
    updatedAt: now,
  };

  // Newest first
  notes.unshift(newNote);
  await saveNotes(env, notes);
  return json(newNote, 201);
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!env.FL_MOVE_DATA) return kvError();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const notes = await getNotes(env);
  const filtered = notes.filter(n => n.id !== id);
  await saveNotes(env, filtered);
  return json({ ok: true });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.FL_MOVE_DATA) return kvError();

  let patch;
  try { patch = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const notes = await getNotes(env);
  const idx = notes.findIndex(n => n.id === patch.id);
  if (idx === -1) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });

  notes[idx] = { ...notes[idx], ...patch, updatedAt: new Date().toISOString() };
  await saveNotes(env, notes);
  return json(notes[idx]);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function kvError() {
  return new Response(JSON.stringify({ error: "KV not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
}
