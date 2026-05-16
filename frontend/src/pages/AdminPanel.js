// src/pages/AdminPanel.js
// Admin-only page to post project updates / announcements.
// Accessible only to users with role === 'admin'.

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminPanel() {
  const { user, authFetch } = useAuth();
  const toast = useToast();

  const [updates, setUpdates]     = useState([]);
  const [form, setForm]           = useState({ title: '', description: '', type: 'update' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing updates
  useEffect(() => {
    fetch(`${API}/api/updates`)
      .then(r => r.json())
      .then(d => setUpdates(d.updates || []))
      .catch(() => {});
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div style={s.denied}>
        <p style={{ fontSize: '48px' }}>🔒</p>
        <h2>Admin Access Only</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.show('Title and description are required.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res  = await authFetch(`${API}/api/updates`, {
        method: 'POST',
        body:   JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUpdates(prev => [data.update, ...prev]);
      setForm({ title: '', description: '', type: 'update' });
      toast.show('✅ Update posted! Notifications and emails sent.', 'success');
    } catch (err) {
      toast.show(`Failed: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    await authFetch(`${API}/api/updates/${id}`, { method: 'DELETE' });
    setUpdates(prev => prev.filter(u => u._id !== id));
    toast.show('Update deleted.', 'info');
  };

  const TYPE_COLORS = { feature: '#10b981', update: '#6366f1', announcement: '#f59e0b' };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.heading}>🛠 Admin Panel</h1>
        <p style={s.sub}>Post updates — all users receive in-app notifications and emails automatically.</p>

        {/* Compose form */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Post New Update</h2>

          <div style={s.field}>
            <label style={s.label}>Type</label>
            <select style={s.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="update">📢 Project Update</option>
              <option value="feature">🚀 New Feature</option>
              <option value="announcement">📣 Announcement</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input
              style={s.input}
              placeholder="e.g. v2.0 Dashboard Released"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Description</label>
            <textarea
              style={{ ...s.input, height:'100px', resize:'vertical' }}
              placeholder="Describe what changed or what's new..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <button style={{ ...s.btn, ...(submitting ? s.btnDisabled : {}) }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : '🚀 Post & Notify All Users'}
          </button>
        </div>

        {/* Existing updates */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Posted Updates ({updates.length})</h2>
          {updates.length === 0 && <p style={s.empty}>No updates yet.</p>}
          {updates.map(u => (
            <div key={u._id} style={s.updateItem}>
              <div style={s.updateLeft}>
                <span style={{ ...s.typeBadge, background: TYPE_COLORS[u.type] + '22', color: TYPE_COLORS[u.type] }}>
                  {u.type}
                </span>
                <strong style={s.updateTitle}>{u.title}</strong>
                <p style={s.updateDesc}>{u.description}</p>
                <p style={s.updateTime}>{new Date(u.createdAt).toLocaleString()}</p>
              </div>
              <button style={s.deleteBtn} onClick={() => handleDelete(u._id)}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { padding:'32px 20px', minHeight:'calc(100vh - 56px)', background:'var(--bg)', overflowY:'auto' },
  container:   { maxWidth:'720px', margin:'0 auto' },
  heading:     { margin:'0 0 6px', fontSize:'24px', fontWeight:'800', color:'var(--text)' },
  sub:         { margin:'0 0 28px', fontSize:'14px', color:'var(--text-3)' },
  card:        { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px', marginBottom:'20px' },
  cardTitle:   { margin:'0 0 20px', fontSize:'16px', fontWeight:'700', color:'var(--text)' },
  field:       { marginBottom:'16px' },
  label:       { display:'block', fontSize:'13px', fontWeight:'600', color:'var(--text-3)', marginBottom:'6px' },
  input:       { width:'100%', padding:'10px 14px', border:'1px solid var(--border)', borderRadius:'8px', background:'var(--bg-3)', color:'var(--text)', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'var(--font-body)' },
  select:      { width:'100%', padding:'10px 14px', border:'1px solid var(--border)', borderRadius:'8px', background:'var(--bg-3)', color:'var(--text)', fontSize:'14px', cursor:'pointer' },
  btn:         { padding:'12px 24px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
  btnDisabled: { opacity:0.6, cursor:'not-allowed' },
  denied:      { textAlign:'center', padding:'80px 20px', color:'var(--text)' },
  empty:       { color:'var(--text-3)', fontSize:'14px' },
  updateItem:  { display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 0', borderBottom:'1px solid var(--border)' },
  updateLeft:  { flex:1 },
  typeBadge:   { display:'inline-block', padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', marginBottom:'6px' },
  updateTitle: { display:'block', fontSize:'14px', color:'var(--text)', marginBottom:'4px' },
  updateDesc:  { margin:'0 0 4px', fontSize:'13px', color:'var(--text-3)', lineHeight:1.5 },
  updateTime:  { margin:0, fontSize:'11px', color:'var(--text-3)' },
  deleteBtn:   { background:'none', border:'1px solid var(--border)', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', fontSize:'14px', color:'var(--text-3)', flexShrink:0 },
};
