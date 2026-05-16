import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendChat } from '../api';
import { buildSystemPrompt } from '../engine/analysis';

const CHIPS = [
  'What are the main risks?',
  'Suggest next tasks',
  'Estimate the timeline',
  'Summarize the project',
  'What should I do first?',
  'Identify unclear requirements',
];

const WELCOME = `## 👋 Welcome to AI PM Copilot

I'm your intelligent project management assistant. Here's what I can do:

- 📄 **Analyze** your uploaded PDFs (SRS, reports, specs)
- ⚠️ **Identify risks** with severity ratings
- ✅ **Suggest tasks** prioritized by importance
- 📅 **Estimate timelines** for your project phases
- 🔀 **Adapt responses** based on your role (PM or Developer)

**Upload your project documents from the sidebar to get started.**`;

export default function ChatPanel({ role, combinedText, sessionId, backendOk, summary }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Notify when docs are uploaded
  useEffect(() => {
    if (summary) {
      const note = `✅ **Documents analyzed!** I found **${summary.sentences} sentences** across **${summary.wordCount?.toLocaleString()} words**.

${summary.techStack?.length ? `🛠️ **Tech Stack detected:** ${summary.techStack.join(', ')}` : ''}

Ask me anything about your project, or use the quick suggestions below.`;
      setMessages(m => {
        const last = m[m.length - 1];
        if (last?.content?.includes('Documents analyzed')) return m;
        return [...m, { role: 'assistant', content: note }];
      });
    }
  }, [summary]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(role, combinedText);
      const history = updated.map(m => ({ role: m.role, content: m.content }));

      let reply;
      if (backendOk) {
        reply = await sendChat(history, systemPrompt, sessionId, role);
      } else {
// Google Gemini fallback
const geminiMessages = history.slice(-10).map(m => ({
  role: m.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: m.content }]
}));

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GOOGLE_KEY_HERE`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1500 }
    })
  }
);
const data = await res.json();
reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      }

      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `❌ Error: ${err.message}. Check your backend connection.` }]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([{ role: 'assistant', content: WELCOME }]);

  return (
    <div style={s.panel}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <span style={s.toolbarLabel}>
          {role === 'PM' ? '👔 Project Manager Mode' : '💻 Developer Mode'}
          {combinedText ? ' · Documents loaded ✓' : ' · No documents'}
        </span>
        <button style={s.clearBtn} onClick={clearChat}>Clear chat</button>
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.map((m, i) => (
          <div key={i} className="fade-up" style={{ ...s.row, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && <Avatar type="bot" />}
            <div style={{ ...s.bubble, ...(m.role === 'user' ? s.userBubble : s.botBubble) }}>
              {m.role === 'assistant'
                ? <div className="md-content"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                : <span>{m.content}</span>
              }
            </div>
            {m.role === 'user' && <Avatar type="user" />}
          </div>
        ))}

        {loading && (
          <div style={{ ...s.row, justifyContent: 'flex-start' }}>
            <Avatar type="bot" />
            <div style={{ ...s.bubble, ...s.botBubble, ...s.typing }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={s.inputWrap}>
        <div style={s.chips}>
          {CHIPS.map((c, i) => (
            <button key={i} style={s.chip} onClick={() => send(c)}>{c}</button>
          ))}
        </div>
        <div style={s.inputRow}>
          <textarea
            style={s.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask as ${role === 'PM' ? 'Project Manager' : 'Developer'}... (Enter to send)`}
            rows={2}
          />
          <button style={{ ...s.sendBtn, opacity: loading ? 0.5 : 1 }} onClick={() => send()} disabled={loading}>
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ type }) {
  return (
    <div style={{ ...s.avatar, background: type === 'bot' ? 'var(--accent-dim)' : 'var(--bg-4)' }}>
      {type === 'bot' ? '◈' : '👤'}
    </div>
  );
}

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const s = {
  panel:      { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' },
  toolbar:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg-2)', flexShrink:0 },
  toolbarLabel:{ fontSize:'12px', color:'var(--text-3)', fontWeight:'500' },
  clearBtn:   { fontSize:'11px', color:'var(--text-4)', background:'none', border:'1px solid var(--border)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-body)', transition:'var(--transition)' },
  messages:   { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' },
  row:        { display:'flex', gap:'10px', alignItems:'flex-end' },
  avatar:     { width:'32px', height:'32px', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0, color:'#6366f1', border:'1px solid var(--border)' },
  bubble:     { maxWidth:'72%', padding:'12px 16px', borderRadius:'14px', fontSize:'13.5px', lineHeight:'1.65', boxShadow:'var(--shadow)' },
  botBubble:  { background:'var(--card-bg)', color:'var(--text)', borderBottomLeftRadius:'4px', border:'1px solid var(--border)' },
  userBubble: { background:'#4f46e5', color:'#fff', borderBottomRightRadius:'4px' },
  typing:     { display:'flex', gap:'5px', alignItems:'center', padding:'14px 18px' },
  inputWrap:  { padding:'12px 16px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-2)', flexShrink:0 },
  chips:      { display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' },
  chip:       { padding:'5px 12px', background:'var(--chip-bg)', color:'#6366f1', border:'1px solid var(--border)', borderRadius:'99px', fontSize:'11px', cursor:'pointer', fontWeight:'500', fontFamily:'var(--font-body)', transition:'var(--transition)', whiteSpace:'nowrap' },
  inputRow:   { display:'flex', gap:'8px', alignItems:'flex-end' },
  input:      { flex:1, padding:'11px 14px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text)', fontSize:'13px', outline:'none', resize:'none', fontFamily:'var(--font-body)', lineHeight:'1.5', transition:'var(--transition)' },
  sendBtn:    { padding:'11px 16px', background:'#6366f1', border:'none', borderRadius:'10px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'var(--transition)', flexShrink:0 },
};
