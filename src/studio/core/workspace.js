import { STORAGE_KEY } from './constants.js';
import { createWorkspace } from './model.js';
export function loadWorkspace() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createWorkspace(); } catch { return createWorkspace(); } }
export function saveWorkspace(ws) { ws.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(ws)); }
export function exportWorkspace(ws) { return JSON.stringify(ws, null, 2); }
export function importWorkspace(text) { const ws = JSON.parse(text); if (ws.schemaVersion !== '2.0.0' || !ws.workspaceId) throw new Error('Espace de travail Studio v2 invalide.'); return ws; }
