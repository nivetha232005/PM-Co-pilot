// src/components/Toast.js
// Lightweight toast system — import useToast() anywhere to show toasts.
// Wrap your app with <ToastProvider> once.

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: { background: '#10b981', icon: '✅' },
  error:   { background: '#ef4444', icon: '❌' },
  info:    { background: '#6366f1', icon: '📢' },
  warning: { background: '#f59e0b', icon: '⚠️' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {/* Toast container */}
      <div style={s.container}>
        {toasts.map(toast => {
          const ts = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
          return (
            <div key={toast.id} style={{ ...s.toast, background: ts.background }}>
              <span style={s.icon}>{ts.icon}</span>
              <span style={s.msg}>{toast.message}</span>
              <button style={s.close} onClick={() => dismiss(toast.id)}>×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const s = {
  container: { position:'fixed', bottom:'24px', right:'24px', display:'flex', flexDirection:'column', gap:'10px', zIndex:9999, maxWidth:'360px' },
  toast:     { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', color:'#fff', fontSize:'14px', fontWeight:'500', boxShadow:'0 4px 20px rgba(0,0,0,.2)', animation:'slideIn .2s ease' },
  icon:      { fontSize:'16px', flexShrink:0 },
  msg:       { flex:1, lineHeight:1.4 },
  close:     { background:'none', border:'none', color:'rgba(255,255,255,.8)', fontSize:'18px', cursor:'pointer', lineHeight:1, padding:'0 0 0 4px', flexShrink:0 },
};
