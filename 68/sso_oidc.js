import { Router } from 'express';
import { Issuer, generators } from 'openid-client';
import { setUserSession, getUser, clearUser } from '../lib/session.js';

const r = Router();

const OIDC_ISSUER_URL   = process.env.OIDC_ISSUER_URL;
const OIDC_CLIENT_ID    = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET= process.env.OIDC_CLIENT_SECRET;
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || (process.env.OAUTH_REDIRECT_BASE ? process.env.OAUTH_REDIRECT_BASE + '/api/sso/callback' : undefined);
const OIDC_SCOPES       = process.env.OIDC_SCOPES || 'openid profile email offline_access';
const OIDC_ROLE_CLAIM   = process.env.OIDC_ROLE_CLAIM || 'roles';
const OIDC_NAME_CLAIM   = process.env.OIDC_NAME_CLAIM || 'name';
const OIDC_EMAIL_CLAIM  = process.env.OIDC_EMAIL_CLAIM || 'email';

let _clientPromise = null;
async function getClient(){
  if (_clientPromise) return _clientPromise;
  _clientPromise = (async ()=>{
    if (!OIDC_ISSUER_URL) throw new Error('Missing OIDC_ISSUER_URL');
    const issuer = await Issuer.discover(OIDC_ISSUER_URL);
    return new issuer.Client({
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      redirect_uris: [OIDC_REDIRECT_URI],
      response_types: ['code']
    });
  })();
  return _clientPromise;
}

r.get('/login', async (req,res)=>{
  try{
    const client = await getClient();
    const state = generators.state();
    const nonce = generators.nonce();
    req.session.oidc = { state, nonce, returnTo: req.query.returnTo || '/' };
    const url = client.authorizationUrl({ scope: OIDC_SCOPES, state, nonce, prompt: req.query.prompt || undefined });
    res.redirect(url);
  } catch (e){ res.status(500).send('OIDC error: '+e.message); }
});

r.get('/callback', async (req,res)=>{
  try{
    const client = await getClient();
    const params = client.callbackParams(req);
    const { state, nonce, returnTo } = req.session.oidc || {};
    const tokenSet = await client.callback(OIDC_REDIRECT_URI, params, { state, nonce });
    const userinfo = await client.userinfo(tokenSet.access_token).catch(()=> ({}));

    const idToken = tokenSet.claims();
    const email = (idToken[OIDC_EMAIL_CLAIM] || userinfo.email || '').toLowerCase();
    const name = idToken[OIDC_NAME_CLAIM] || userinfo.name || email || 'user';
    let roles = idToken[OIDC_ROLE_CLAIM] || [];
    if (typeof roles === 'string'){ roles = roles.split(/[ ,]+/).filter(Boolean); }
    const user = {
      id: idToken.sub, email, name, roles,
      idToken, userinfo,
      tokens: { accessToken: tokenSet.access_token, refreshToken: tokenSet.refresh_token, expiresAt: tokenSet.expires_at },
      provider: 'oidc', at: new Date().toISOString()
    };
    setUserSession(req, user);
    res.redirect(returnTo || '/');
  } catch (e){ res.status(500).send('OIDC callback error: '+e.message); }
});

r.post('/refresh', async (req,res)=>{
  try{
    const client = await getClient();
    const user = getUser(req);
    if (!user?.tokens?.refreshToken) return res.status(400).json({ error:'no_refresh_token' });
    const ts = await client.refresh(user.tokens.refreshToken);
    user.tokens.accessToken = ts.access_token;
    user.tokens.refreshToken = ts.refresh_token || user.tokens.refreshToken;
    user.tokens.expiresAt = ts.expires_at;
    setUserSession(req, user);
    res.json({ ok:true, expires_at: ts.expires_at });
  } catch (e){ res.status(500).json({ error: e.message }); }
});

r.post('/logout', async (req,res)=>{ clearUser(req); res.json({ ok:true }); });
r.get('/me', (req,res)=>{ const u = getUser(req); if (!u) return res.status(401).json({ error:'not_authenticated' }); res.json({ id: u.id, email: u.email, name: u.name, roles: u.roles||[], at: u.at, provider: u.provider }); });

export default r;
