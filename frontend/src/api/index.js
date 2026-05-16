import axios from 'axios';

const BASE = 'http://localhost:5000/api';

// ── Chat ────────────────────────────────────────────────────────────
export const sendChat = async (messages, systemPrompt, sessionId, role) => {
  const res = await axios.post(`${BASE}/chat`, { messages, systemPrompt, sessionId, role });
  return res.data.reply;
};

// ── Upload PDFs ─────────────────────────────────────────────────────
export const uploadPDFs = async (files) => {
  const form = new FormData();
  files.forEach(f => form.append('pdfs', f));
  const res = await axios.post(`${BASE}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.files;
};

// ── Sessions ────────────────────────────────────────────────────────
export const getSessions = async () => {
  const res = await axios.get(`${BASE}/sessions`);
  return res.data;
};

export const createSession = async (data) => {
  const res = await axios.post(`${BASE}/sessions`, data);
  return res.data;
};

export const updateSession = async (id, data) => {
  const res = await axios.put(`${BASE}/sessions/${id}`, data);
  return res.data;
};

export const deleteSession = async (id) => {
  await axios.delete(`${BASE}/sessions/${id}`);
};

// ── Projects ────────────────────────────────────────────────────────
export const getProjects = async () => {
  const res = await axios.get(`${BASE}/projects`);
  return res.data;
};

export const createProject = async (data) => {
  const res = await axios.post(`${BASE}/projects`, data);
  return res.data;
};

export const updateProject = async (id, data) => {
  const res = await axios.put(`${BASE}/projects/${id}`, data);
  return res.data;
};

// ── Health ──────────────────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const res = await axios.get(`${BASE}/health`);
    return res.data.status === 'OK';
  } catch { return false; }
};
