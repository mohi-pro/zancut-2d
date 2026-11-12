// Configuration for the single-owner local app and the existing render/listening tools.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE_DIR = process.env.ZANCUT_ENGINE || path.join(APP_DIR, 'engine');
export const SKILLS_DIR = process.env.ZANCUT_SKILLS || path.join(APP_DIR, 'skills');
export const ASSETS_DIR = path.join(APP_DIR, 'assets');
export const DATA_DIR = process.env.ZANCUT_DATA ? path.resolve(process.env.ZANCUT_DATA) : path.join(APP_DIR, 'data');
export const PORT = Number(process.env.PORT || 4500);
export const HOST = process.env.HOST || '127.0.0.1';

export const venvPython = (name) => path.join(process.env.HOME || process.env.USERPROFILE || '', '.cache', 'zancut', name, ...(process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python']));
function findPython() {
  if (process.env.ZANCUT_PYTHON) return process.env.ZANCUT_PYTHON;
  const venv = venvPython('py');
  return fs.existsSync(venv) ? venv : process.platform === 'win32' ? 'python' : 'python3';
}
export const PYTHON = findPython();

