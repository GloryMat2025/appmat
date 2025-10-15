import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Issuer, generators } from 'openid-client';

const r = Router();

// In-memory demo user store
const USERS = new Map([
  ['admin@example.com', { id:'u1', email:'admin@example.com', role:'admin', pass:'admin123!' }],
  ['staff@example.com', { id:'u2', email:'staff@example.com', role:'staff', pass:'staff123!' }],
]);

function sign(user){
  return jwt.sign({ sub:user.id, email:user.email, role:user.role }, process.env.SESSION_SECRET || 'devsecret', { expiresIn: '8h' });
}

r.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

r.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = USERS.get(String(email || '').toLowerCase());
  if (!u || u.pass !== password) return res.status(401).json({ error: 'invalid_credentials' });
  const token = sign(u);
  req.session.token = token;
  res.json({ token });
});

r.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// ---- Google OIDC (skeleton) ----
let googleClient;
async function getGoogleClient(){
  if (googleClient) return googleClient;
  const issuer = await Issuer.discover('https://accounts.google.com');
  googleClient = new issuer.Client({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.OAUTH_REDIRECT_BASE + '/api/auth/google/callback'],
    response_types: ['code'],
  });
  return googleClient;
}

r.get('/google/start', async (req, res) => {
  const client = await getGoogleClient();
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  req.session.oauth = { state, nonce, code_verifier };
  const url = client.authorizationUrl({
    scope: 'openid email profile',
    state, nonce, code_challenge, code_challenge_method: 'S256',
  });
  res.redirect(url);
});

r.get('/google/callback', async (req, res) => {
  const client = await getGoogleClient();
  const { state, code } = req.query;
  const s = req.session.oauth;
  if (!s || state !== s.state) return res.status(400).send('Bad state');
  const tokenSet = await client.callback(process.env.OAUTH_REDIRECT_BASE + '/api/auth/google/callback',
    { code, state }, { nonce: s.nonce, code_verifier: s.code_verifier });
  const claims = tokenSet.claims(); // { email, sub, name }
  const email = (claims.email || '').toLowerCase();
  // JIT demo: default staff, promote admin for domain example.com
  const role = email.endsWith('@example.com') ? 'admin' : 'staff';
  const user = USERS.get(email) || { id:'jit-'+Date.now(), email, role, pass:'' };
  USERS.set(email, user);
  req.session.token = sign(user);
  res.redirect('/'); // back to app
});

export default r;
