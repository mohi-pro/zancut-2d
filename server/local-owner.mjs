// A stable local identity for project ownership. Existing Studio-era owner ids are retained.
import fs from 'node:fs';
import path from 'node:path';
import { customAlphabet } from 'nanoid';
import { DATA_DIR } from './config.mjs';

export function localOwner() {
  const file = path.join(DATA_DIR, 'users.json');
  let db = { users: [] };
  if (fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const owner = (db.users || []).find(u => u.alias === 'local2d' || u.email === 'local@zancut2d.app');
  if (owner) return owner;
  const created = { id: customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 12)(), email: 'local@zancut2d.app', name: 'Zancut 2D', role: 'admin', createdAt: Date.now() };
  db.users ||= []; db.users.push(created);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(db, null, 2)); fs.renameSync(file + '.tmp', file);
  return created;
}
