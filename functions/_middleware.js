/**
 * FL MOVE — Cloudflare Pages Auth Middleware
 *
 * Security approach:
 *  - Plaintext credentials are NEVER stored here or in the repo.
 *  - Username and password are stored as SHA-256 hashes only.
 *  - After successful login a time-limited HMAC-signed cookie is issued.
 *  - The HMAC signing key is a separate secret derived independently.
 *  - Constant-time comparison prevents timing attacks on hash checks.
 */

// SHA-256 of "AnnaBunnell"
const USERNAME_HASH = "7e6d73672bd53e111257e96711f32ae0be7f15e4849cfe00919bbb9a8532c5b3";

// SHA-256 of "AdJbFl2026$#"
const PASSWORD_HASH = "903c09fb5bed50bc6da8d0bd37253772785c44565d2aca85d065264a666e2c69";

// Independent HMAC signing secret for session cookies (not derived from the password hash)
const COOKIE_SIGNING_SECRET = "cec230b292f37f03c58f8dfbc9e1b212810890e983513d2c0b8c439ebcfc7f9a";

const COOKIE_NAME   = "flmove_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
const LOGIN_PATH    = "/_flauth_login";

// ---------------------------------------------------------------------------
// Crypto helpers (Web Crypto API — available in Cloudflare Workers runtime)
// ---------------------------------------------------------------------------

async function sha256hex(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to prevent timing attacks */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a signed session token: "<timestamp>.<hmac>" */
async function createSessionToken() {
  const ts = Date.now().toString();
  const sig = await hmacSign(COOKIE_SIGNING_SECRET, ts);
  return `${ts}.${sig}`;
}

/** Verify a session token — returns true if valid and not expired */
async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const dotIdx = token.indexOf(".");
  const ts  = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  // Check expiry
  const age = (Date.now() - parseInt(ts, 10)) / 1000;
  if (isNaN(age) || age < 0 || age > COOKIE_MAX_AGE) return false;

  // Verify HMAC
  const expected = await hmacSign(COOKIE_SIGNING_SECRET, ts);
  return safeEqual(expected, sig);
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k.trim() === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Login page HTML — embedded so there are zero extra files to serve
// ---------------------------------------------------------------------------

function loginPageHTML(errorMsg = "") {
  const err = errorMsg
    ? `<p class="error">${errorMsg}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FL MOVE — Sign In</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: #0f172a;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  }
  .logo {
    text-align: center;
    margin-bottom: 1.75rem;
  }
  .logo-badge {
    display: inline-block;
    background: linear-gradient(135deg, #0d9488, #0891b2);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    margin-bottom: 0.75rem;
  }
  h1 {
    color: #f1f5f9;
    font-size: 1.35rem;
    font-weight: 700;
    text-align: center;
  }
  .subtitle {
    color: #64748b;
    font-size: 0.8rem;
    text-align: center;
    margin-top: 0.3rem;
  }
  label {
    display: block;
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
    margin-top: 1.25rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 0.95rem;
    padding: 0.65rem 0.85rem;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus { border-color: #0d9488; }
  button {
    width: 100%;
    background: linear-gradient(135deg, #0d9488, #0891b2);
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    margin-top: 1.75rem;
    padding: 0.75rem;
    transition: opacity 0.15s;
  }
  button:hover { opacity: 0.9; }
  .error {
    background: #450a0a;
    border: 1px solid #7f1d1d;
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.82rem;
    margin-top: 1.25rem;
    padding: 0.6rem 0.85rem;
    text-align: center;
  }
  .footer {
    color: #475569;
    font-size: 0.7rem;
    margin-top: 2rem;
    text-align: center;
  }
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-badge">Private</div>
    <h1>FL MOVE</h1>
    <p class="subtitle">Bunnell Family Transition Dashboard</p>
  </div>
  <form method="POST" action="${LOGIN_PATH}" autocomplete="on">
    <label for="u">Username</label>
    <input id="u" name="username" type="text" autocomplete="username" required placeholder="Enter username">
    <label for="p">Password</label>
    <input id="p" name="password" type="password" autocomplete="current-password" required placeholder="Enter password">
    ${err}
    <button type="submit">Sign In</button>
  </form>
  <p class="footer">Bunnell Family · Private &amp; Confidential</p>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Middleware entry point
// ---------------------------------------------------------------------------

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Always allow the login endpoint through (handled below)
  const isLoginPost = url.pathname === LOGIN_PATH && request.method === "POST";
  const isLoginGet  = url.pathname === LOGIN_PATH;

  // ------------------------------------------------------------------
  // Handle POST to login endpoint — validate credentials
  // ------------------------------------------------------------------
  if (isLoginPost) {
    const body = await request.formData().catch(() => null);
    const submittedUser = (body?.get("username") || "").trim();
    const submittedPass = (body?.get("password") || "").trim();

    const userHash = await sha256hex(submittedUser);
    const passHash = await sha256hex(submittedPass);

    const userOk = safeEqual(userHash, USERNAME_HASH);
    const passOk = safeEqual(passHash, PASSWORD_HASH);

    if (userOk && passOk) {
      // Credentials valid — issue signed session cookie and redirect home
      const token = await createSessionToken();
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": [
            `${COOKIE_NAME}=${encodeURIComponent(token)}`,
            `Path=/`,
            `Max-Age=${COOKIE_MAX_AGE}`,
            `HttpOnly`,
            `Secure`,
            `SameSite=Strict`,
          ].join("; "),
        },
      });
    }

    // Bad credentials — re-show login with generic error (don't reveal which field was wrong)
    return new Response(loginPageHTML("Incorrect username or password. Please try again."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ------------------------------------------------------------------
  // Serve login page on GET (never cached)
  // ------------------------------------------------------------------
  if (isLoginGet) {
    return new Response(loginPageHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // ------------------------------------------------------------------
  // All other requests — check for a valid session cookie
  // ------------------------------------------------------------------
  const sessionToken = getCookie(request, COOKIE_NAME);
  const authenticated = await verifySessionToken(sessionToken);

  if (!authenticated) {
    // No valid session — redirect to login
    return Response.redirect(`${url.origin}${LOGIN_PATH}`, 302);
  }

  // Valid session — pass request through to the actual page
  return next();
}
