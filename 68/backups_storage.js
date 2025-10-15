import { Router } from 'express';
import multer from 'multer';
import { requirePerm } from '../middleware/perm.js';
import { putObject, signedUrl, headObject, removeObject, sha256 } from '../lib/storage.js';
import { addBackup } from '../lib/backups_pg.js';
import { updateBackupInfo } from '../lib/backups_update.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 * 1024 } }); // 10GB

// Upload a new backup blob and register in DB
r.post('/upload', requirePerm('backups:write'), upload.single('file'), async (req,res)=>{
  if (!req.file) return res.status(400).json({ error:'file_required' });
  const { buffer, mimetype } = req.file;
  const sum = sha256(buffer);

  // create DB row to get an id
  const rec = await addBackup({ type: 'upload' });
  const id = rec.id;

  // store in object storage with key = backups/<id>
  await putObject(id, buffer, mimetype || 'application/octet-stream');
  await updateBackupInfo(id, { sizeBytes: buffer.length, checksum: sum });

  res.json({ id, size: buffer.length, checksum: sum });
});

// Produce a signed URL for download
r.get('/:id/url', requirePerm('backups:read'), async (req,res)=>{
  const url = await signedUrl(req.params.id, Number(req.query.expires||3600));
  res.json({ url, expires: Number(req.query.expires||3600) });
});

// Check existence / metadata
r.get('/:id/head', requirePerm('backups:read'), async (req,res)=>{
  res.json(await headObject(req.params.id));
});

// Remove blob from storage (does not delete DB record)
r.delete('/:id/blob', requirePerm('backups:write'), async (req,res)=>{
  await removeObject(req.params.id);
  res.json({ ok:true });
});

export default r;
