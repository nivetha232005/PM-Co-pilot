// src/components/Header.js — Enhanced with NotificationBell + UserAvatar
// Drop-in replacement for the original Header.js

import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import UserAvatar       from './UserAvatar';

const ROLES = { PM: '👔 Project Manager', DEV: '💻 Developer' };
const TABS  = ['chat', 'dashboard', 'sessions'];

export default function Header({ activeTab, setActiveTab, role, setRole, backendOk }) {
  const { theme, toggle } = useTheme();
  const { user }          = useAuth();

  return (
    <header style={s.header}>
      {/* Logo */}
      <div style={s.logo}>
        <span style={s.logoMark}>◈</span>
        <span style={s.logoText}>PM Copilot</span>
        <span
          style={{ ...s.dot, background: backendOk === null ? '#fbbf24' : backendOk ? '#34d399' : '#f87171' }}
          title={backendOk ? 'Backend connected' : 'Backend offline'}
        />
      </div>

      {/* Role switcher */}
      <div style={s.rolePill}>
        {Object.entries(ROLES).map(([key, label]) => (
          <button
            key={key}
            style={{ ...s.roleBtn, ...(role === key ? s.roleBtnOn : {}) }}
            onClick={() => setRole(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <nav style={s.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            style={{ ...s.tab, ...(activeTab === tab ? s.tabOn : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        {/* Admin panel tab (only visible to admins) */}
        {user?.role === 'admin' && (
          <button
            style={{ ...s.tab, ...(activeTab === 'admin' ? s.tabOn : {}), color: activeTab === 'admin' ? '#6366f1' : '#f59e0b' }}
            onClick={() => setActiveTab('admin')}
          >
            🛠 Admin
          </button>
        )}
      </nav>

      {/* Right side controls */}
      <div style={s.right}>
        {/* Notification bell (only when logged in) */}
        {user && <NotificationBell />}

        {/* Theme toggle */}
        <button style={s.themeBtn} onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User avatar + logout menu */}
        <UserAvatar />
      </div>
    </header>
  );
}

const s = {
  header:    { display:'flex', alignItems:'center', gap:'12px', padding:'0 20px', height:'56px', background:'var(--header-bg)', borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap' },
  logo:      { display:'flex', alignItems:'center', gap:'8px' },
  logoMark:  { fontSize:'22px', color:'#6366f1' },
  logoText:  { fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'16px', letterSpacing:'-0.5px', color:'var(--text)' },
  dot:       { width:'8px', height:'8px', borderRadius:'50%', boxShadow:'0 0 6px currentColor', transition:'background .3s' },
  rolePill:  { display:'flex', gap:'3px', background:'var(--bg-3)', borderRadius:'10px', padding:'3px' },
  roleBtn:   { padding:'5px 14px', borderRadius:'8px', border:'none', background:'transparent', color:'var(--text-3)', fontSize:'12px', cursor:'pointer', fontWeight:'500', fontFamily:'var(--font-body)', transition:'var(--transition)', whiteSpace:'nowrap' },
  roleBtnOn: { background:'#6366f1', color:'#fff', boxShadow:'0 2px 8px rgba(99,102,241,0.4)' },
  tabs:      { display:'flex', gap:'2px', flex:1 },
  tab:       { padding:'6px 18px', border:'none', background:'transparent', color:'var(--text-3)', fontSize:'13px', cursor:'pointer', borderBottom:'2px solid transparent', fontWeight:'500', fontFamily:'var(--font-body)', transition:'var(--transition)' },
  tabOn:     { color:'#6366f1', borderBottomColor:'#6366f1' },
  right:     { display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto' },
  themeBtn:  { padding:'6px 10px', border:'1px solid var(--border)', background:'var(--bg-3)', borderRadius:'8px', cursor:'pointer', fontSize:'16px', transition:'var(--transition)' },
};
