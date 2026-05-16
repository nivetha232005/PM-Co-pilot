import { useState, useEffect } from 'react';
import { GoogleOAuthProvider }  from '@react-oauth/google';
import { ThemeProvider }        from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider }        from './components/Toast';

import Header        from './components/Header';
import Sidebar       from './components/Sidebar';
import ChatPanel     from './components/ChatPanel';
import Dashboard     from './components/Dashboard';
import SessionsPanel from './components/SessionsPanel';
import LoginPage     from './pages/LoginPage';
import AdminPanel    from './pages/AdminPanel';
import { checkHealth } from './api';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function AppInner() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab]       = useState('chat');
  const [role, setRole]                 = useState('PM');
  const [pdfs, setPdfs]                 = useState([]);
  const [combinedText, setCombinedText] = useState('');
  const [tasks, setTasks]               = useState([]);
  const [risks, setRisks]               = useState([]);
  const [timeline, setTimeline]         = useState(null);
  const [summary, setSummary]           = useState(null);
  const [sessionId, setSessionId]       = useState(null);
  const [backendOk, setBackendOk]       = useState(null);

  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok));
  }, []);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-3)', fontSize:'14px' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const sharedProps = {
    role, setRole,
    pdfs, setPdfs,
    combinedText, setCombinedText,
    tasks, setTasks,
    risks, setRisks,
    timeline, setTimeline,
    summary, setSummary,
    sessionId, setSessionId,
    backendOk,
  };

  return (
    <div style={styles.app}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        backendOk={backendOk}
      />
      <div style={styles.body}>
        {activeTab !== 'admin' && <Sidebar {...sharedProps} setActiveTab={setActiveTab} />}
        <main style={styles.main}>
          {activeTab === 'chat'      && <ChatPanel     {...sharedProps} />}
          {activeTab === 'dashboard' && <Dashboard     {...sharedProps} />}
          {activeTab === 'sessions'  && <SessionsPanel {...sharedProps} />}
          {activeTab === 'admin'     && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}

const styles = {
  app:  { display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg)', color:'var(--text)', fontFamily:'var(--font-body)' },
  body: { display:'flex', flex:1, overflow:'hidden' },
  main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <AppInner />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;