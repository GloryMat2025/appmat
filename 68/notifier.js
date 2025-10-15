// Notifications library: webhooks (HMAC), Slack webhook, and email (nodemailer).
import crypto from 'crypto';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

export const SUBS = { webhooks: [], slack: [], email: [] };

let transporter = null;
export function configEmail({ host, port=587, secure=false, user, pass } = {}){
  transporter = nodemailer.createTransport({ host, port, secure, auth: user?{ user, pass }:undefined });
  return true;
}

function hmac(secret, body){ return crypto.createHmac('sha256', String(secret || 'devsecret')).update(body).digest('hex'); }
function backoff(i){ return Math.min(60_000, 500 * Math.pow(2, i)); }

export async function sendWebhook({ url, secret }, event, payload){
  const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() });
  const sig  = hmac(secret, body);
  const headers = { 'content-type':'application/json', 'x-signature':'sha256='+sig, 'user-agent':'appmat/notify' };
  let lastErr;
  for (let i=0;i<5;i++){
    try{
      const res = await fetch(url, { method:'POST', headers, body });
      if (res.ok) return true;
      lastErr = new Error('HTTP '+res.status);
    } catch (e){ lastErr = e; }
    await new Promise(r => setTimeout(r, backoff(i)));
  }
  throw lastErr || new Error('webhook_failed');
}

export async function sendSlack({ url }, event, payload){
  const text = `*${event}*\n\n\`\`\`${JSON.stringify(payload,null,2)}\`\`\``;
  const r = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text }) });
  if (!r.ok) throw new Error('slack_failed:'+r.status);
  return true;
}

export async function sendEmail({ to }, event, payload){
  if (!transporter) throw new Error('email_not_configured');
  const info = await transporter.sendMail({ from: 'no-reply@appmat.local', to, subject: `[AppMat] ${event}`, text: JSON.stringify(payload, null, 2) });
  return info?.messageId ? true : false;
}

export async function publish(event, payload){
  const targets = {
    webhooks: SUBS.webhooks.filter(s => s.events.includes(event) || s.events.includes('*')),
    slack:    SUBS.slack.filter(s => s.events.includes(event) || s.events.includes('*')),
    email:    SUBS.email.filter(s => s.events.includes(event) || s.events.includes('*')),
  };
  const tasks = [];
  for (const s of targets.webhooks) tasks.push(sendWebhook(s, event, payload).catch(e => ({ error: e.message })));
  for (const s of targets.slack)    tasks.push(sendSlack(s, event, payload).catch(e => ({ error: e.message })));
  for (const s of targets.email)    tasks.push(sendEmail(s, event, payload).catch(e => ({ error: e.message })));
  return Promise.all(tasks);
}

function id(){ return Math.random().toString(36).slice(2,10); }
export function listSubs(){ return SUBS; }
export function addWebhook({ url, secret='', events=['*'] }){ const rec={ id: id(), url, secret, events }; SUBS.webhooks.push(rec); return rec; }
export function addSlack({ url, events=['*'] }){ const rec={ id: id(), url, events }; SUBS.slack.push(rec); return rec; }
export function addEmail({ to, events=['*'] }){ const rec={ id: id(), to, events }; SUBS.email.push(rec); return rec; }
export function del(kind, rid){ const arr = SUBS[kind]; if (!arr) return false; const n = arr.length; for (let i=arr.length-1;i>=0;i--){ if (arr[i].id===rid) arr.splice(i,1);} return arr.length !== n; }
