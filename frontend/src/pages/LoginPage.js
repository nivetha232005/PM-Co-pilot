// src/pages/LoginPage.js
// Renders Google Sign-In button using @react-oauth/google

import { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLogin }) {
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      const user = await loginWithGoogle(credentialResponse);
      onLogin?.(user);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoMark}>◈</span>
          <span style={s.logoText}>PM Copilot</span>
        </div>

        <h1 style={s.heading}>Welcome back</h1>
        <p style={s.sub}>Sign in to access your AI project management workspace.</p>

        <div style={s.googleBtn}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => alert('Google sign-in failed. Check your Client ID configuration.')}
            useOneTap
            theme="outline"
            shape="rectangular"
            size="large"
            text="signin_with"
            width="280"
          />
        </div>

        <p style={s.hint}>
          First time here? Your account will be created automatically.
        </p>
      </div>
    </div>
  );
}

const s = {
  page:     { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)', padding:'20px' },
  card:     { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'48px 40px', maxWidth:'380px', width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,.12)' },
  logo:     { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'32px' },
  logoMark: { fontSize:'32px', color:'#6366f1' },
  logoText: { fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:'var(--text)' },
  heading:  { margin:'0 0 8px', fontSize:'24px', fontWeight:'700', color:'var(--text)' },
  sub:      { margin:'0 0 32px', fontSize:'14px', color:'var(--text-3)', lineHeight:1.6 },
  googleBtn:{ display:'flex', justifyContent:'center', marginBottom:'16px' },
  hint:     { margin:0, fontSize:'12px', color:'var(--text-3)' },
};
