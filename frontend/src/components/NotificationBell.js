// src/components/NotificationBell.js
// Bell icon with unread badge, dropdown list, and mark-as-read actions.
// Drop this into Header.js.

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICONS = { feature: '🚀', update: '📢', announcement: '📣', order: '🛒', system: '⚙️' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={s.wrapper} ref={ref}>
      {/* Bell button */}
      <button style={s.bell} onClick={() => setOpen(o => !o)} title="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={s.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {/* Header */}
          <div style={s.dropHead}>
            <span style={s.dropTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button style={s.markAll} onClick={() => { markAllAsRead(); }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={s.list}>
            {notifications.length === 0 && (
              <p style={s.empty}>You're all caught up 🎉</p>
            )}
            {notifications.map(n => (
              <div
                key={n._id}
                style={{ ...s.item, ...(n.isRead ? {} : s.itemUnread) }}
                onClick={() => !n.isRead && markAsRead(n._id)}
              >
                <span style={s.icon}>{TYPE_ICONS[n.type] || '🔔'}</span>
                <div style={s.itemBody}>
                  <p style={s.msg}>{n.message}</p>
                  <p style={s.time}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span style={s.dot} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper:    { position:'relative' },
  bell:       { position:'relative', padding:'6px 10px', border:'1px solid var(--border)', background:'var(--bg-3)', borderRadius:'8px', cursor:'pointer', fontSize:'16px' },
  badge:      { position:'absolute', top:'-6px', right:'-6px', background:'#ef4444', color:'#fff', fontSize:'10px', fontWeight:'700', borderRadius:'10px', padding:'1px 5px', minWidth:'16px', textAlign:'center' },
  dropdown:   { position:'absolute', top:'calc(100% + 8px)', right:0, width:'340px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'12px', boxShadow:'0 12px 40px rgba(0,0,0,.18)', zIndex:1000, overflow:'hidden' },
  dropHead:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)' },
  dropTitle:  { fontWeight:'700', fontSize:'14px', color:'var(--text)' },
  markAll:    { background:'none', border:'none', color:'#6366f1', fontSize:'12px', cursor:'pointer', fontWeight:'500' },
  list:       { maxHeight:'360px', overflowY:'auto' },
  empty:      { textAlign:'center', padding:'32px 16px', color:'var(--text-3)', fontSize:'13px' },
  item:       { display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px 16px', cursor:'pointer', transition:'background .15s', borderBottom:'1px solid var(--border)' },
  itemUnread: { background:'rgba(99,102,241,.06)' },
  icon:       { fontSize:'20px', flexShrink:0, marginTop:'2px' },
  itemBody:   { flex:1, minWidth:0 },
  msg:        { margin:0, fontSize:'13px', color:'var(--text)', lineHeight:1.4, wordBreak:'break-word' },
  time:       { margin:'4px 0 0', fontSize:'11px', color:'var(--text-3)' },
  dot:        { width:'8px', height:'8px', borderRadius:'50%', background:'#6366f1', flexShrink:0, marginTop:'6px' },
};
