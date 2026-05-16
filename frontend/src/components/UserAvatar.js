// src/components/UserAvatar.js
// Shows user profile pic + name with logout menu

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!user) return null;

  return (
    <div style={s.wrapper} ref={ref}>
      <button style={s.btn} onClick={() => setOpen(o => !o)} title={user.name}>
        {user.profilePic
          ? <img src={user.profilePic} alt={user.name} style={s.avatar} referrerPolicy="no-referrer" />
          : <span style={s.initials}>{user.name?.[0]?.toUpperCase()}</span>
        }
      </button>

      {open && (
        <div style={s.menu}>
          <div style={s.menuHeader}>
            <p style={s.name}>{user.name}</p>
            <p style={s.email}>{user.email}</p>
            {user.role === 'admin' && <span style={s.adminBadge}>Admin</span>}
          </div>
          <hr style={s.divider} />
          <button style={s.menuItem} onClick={logout}>🚪 Sign Out</button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper:    { position:'relative' },
  btn:        { background:'none', border:'none', cursor:'pointer', padding:'2px', borderRadius:'50%' },
  avatar:     { width:'34px', height:'34px', borderRadius:'50%', objectFit:'cover', border:'2px solid #6366f1' },
  initials:   { display:'flex', alignItems:'center', justifyContent:'center', width:'34px', height:'34px', borderRadius:'50%', background:'#6366f1', color:'#fff', fontSize:'14px', fontWeight:'700' },
  menu:       { position:'absolute', top:'calc(100% + 8px)', right:0, width:'220px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'10px', boxShadow:'0 8px 30px rgba(0,0,0,.15)', zIndex:1000, overflow:'hidden' },
  menuHeader: { padding:'14px 16px 10px' },
  name:       { margin:'0 0 2px', fontSize:'14px', fontWeight:'600', color:'var(--text)' },
  email:      { margin:0, fontSize:'12px', color:'var(--text-3)' },
  adminBadge: { display:'inline-block', marginTop:'6px', padding:'2px 8px', background:'#ede9fe', color:'#7c3aed', borderRadius:'12px', fontSize:'11px', fontWeight:'600' },
  divider:    { margin:'0', border:'none', borderTop:'1px solid var(--border)' },
  menuItem:   { display:'block', width:'100%', textAlign:'left', padding:'12px 16px', background:'none', border:'none', color:'var(--text)', fontSize:'13px', cursor:'pointer', fontWeight:'500' },
};
