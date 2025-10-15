import { query } from './db.js';

export async function updateBackupInfo(id, { sizeBytes=null, checksum=null }){
  const sets = []; const vals = []; let i=1;
  if (sizeBytes != null){ sets.push(`size_bytes=$${i++}`); vals.push(sizeBytes); }
  if (checksum != null){ sets.push(`checksum=$${i++}`); vals.push(checksum); }
  if (!sets.length) return false;
  vals.push(id);
  await query(`UPDATE backups SET ${sets.join(', ')} WHERE id=$${i}`, vals);
  return true;
}
