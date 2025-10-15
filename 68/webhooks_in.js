import { Router } from 'express';
import { query } from '../lib/db.js';
import { verifyStripe, verifyGitHub, verifySlack, verifyHmac256 } from '../lib/verify.js';

const r = Router();

// Helper: store inbound
async function storeInbound({ source, req, sig_ok, sig_detail }){
  const raw = req.body; // Buffer from express.raw
  const headers = req.headers || {};
  let json = null;
  try { json = JSON.parse(raw.toString('utf-8')); } catch {}
  const ip = req.ip || req.connection?.remoteAddress || null;
  const res = await query(`INSERT INTO webhooks_in(source, ip, headers, raw_body, json_body, sig_ok, sig_detail)
                           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [source, ip, headers, raw, json, sig_ok, sig_detail||null]);
  return res.rows[0].id;
}

// Stripe
r.post('/in/stripe', (req, res, next)=> next(), async (req,res)=>{
  const secret = process.env.STRIPE_SIGNING_SECRET;
  const sigHeader = req.get('stripe-signature');
  const check = verifyStripe({ secret, header: sigHeader, body: req.body.toString('utf-8') });
  const id = await storeInbound({ source:'stripe', req, sig_ok: check.ok, sig_detail: check.reason });
  res.status(check.ok ? 200 : 400).json({ ok: check.ok, id });
});

// GitHub
r.post('/in/github', (req,res,next)=> next(), async (req,res)=>{
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const sigHeader = req.get('x-hub-signature-256');
  const check = verifyGitHub({ secret, header: sigHeader, body: req.body });
  const id = await storeInbound({ source:'github', req, sig_ok: check.ok, sig_detail: check.reason });
  res.status(check.ok ? 200 : 400).json({ ok: check.ok, id });
});

// Slack
r.post('/in/slack', (req,res,next)=> next(), async (req,res)=>{
  const secret = process.env.SLACK_SIGNING_SECRET;
  const ts = req.get('x-slack-request-timestamp');
  const sig = req.get('x-slack-signature');
  const check = verifySlack({ secret, tsHeader: ts, sigHeader: sig, body: req.body.toString('utf-8') });
  const id = await storeInbound({ source:'slack', req, sig_ok: check.ok, sig_detail: check.reason });
  // Slack URL verification
  try {
    const j = JSON.parse(req.body.toString('utf-8'));
    if (j.type === 'url_verification' && j.challenge) return res.json({ challenge: j.challenge });
  } catch {}
  res.status(check.ok ? 200 : 400).json({ ok: check.ok, id });
});

// Generic HMAC-256: header X-Signature: hex(hmacSha256(body, WEBHOOK_GENERIC_SECRET))
r.post('/in/generic', (req,res,next)=> next(), async (req,res)=>{
  const secret = process.env.WEBHOOK_GENERIC_SECRET || '';
  const sig = req.get('x-signature') || '';
  const ok = verifyHmac256({ secret, headerSig: sig, body: req.body });
  const id = await storeInbound({ source:'generic', req, sig_ok: ok, sig_detail: ok?'': 'bad_sig' });
  res.status(ok ? 200 : 400).json({ ok, id });
});

export default r;
