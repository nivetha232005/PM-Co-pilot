import { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../api';

export default function SessionsPanel({ backendOk }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (backendOk) {
      setLoading(true);
      getSessions().then(data => { setSessions(data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [backendOk]);

  const handleDelete = async (id) => {
    try { await deleteSession(id); setSessions(s => s.filter(x => x._id !== id)); } catch {}
  };

  return (
    <div style={s.wrap}>
      {/* Sessions */}
      <Card title="📁 Session History">
        {!backendOk && <Notice>Backend offline — session history requires MongoDB connection.</Notice>}
        {loading && <div style={s.loading}>Loading sessions...</div>}
        {!loading && sessions.length === 0 && <Empty>No sessions yet. Upload documents to start.</Empty>}
        {sessions.map((sess, i) => (
          <div key={i} style={s.sessItem}>
            <div style={s.sessLeft}>
              <div style={s.sessName}>{sess.projectName || 'Untitled Project'}</div>
              <div style={s.sessMeta}>
                {new Date(sess.createdAt).toLocaleString()} · {sess.role === 'PM' ? '👔 PM' : '💻 Dev'}
              </div>
              <div style={s.sessMeta}>
                {sess.files?.length || 0} file(s) · {sess.messages?.length || 0} messages · {sess.risks?.length || 0} risks
              </div>
            </div>
            <button style={s.delBtn} onClick={() => handleDelete(sess._id)}>Delete</button>
          </div>
        ))}
      </Card>

      {/* Architecture */}
      <Card title="🏗️ System Architecture">
        <div style={s.archGrid}>
          {ARCH.map((a, i) => (
            <div key={i} style={s.archBox}>
              <div style={s.archLayer}>{a.layer}</div>
              <div style={s.archTech}>{a.tech}</div>
              <div style={s.archDesc}>{a.desc}</div>
            </div>
          ))}
        </div>
        <div style={s.flowDiagram}>
          {['PDF Upload', '→', 'Text Extraction', '→', 'Hybrid Analysis', '→', 'LLM Context', '→', 'Dashboard'].map((item, i) => (
            <span key={i} style={item === '→' ? s.arrow : s.flowNode}>{item}</span>
          ))}
        </div>
      </Card>

      {/* Viva Prep */}
      <Card title="🎓 Viva Q&A Preparation">
        {VIVA.map((item, i) => (
          <VivaItem key={i} q={item.q} a={item.a} />
        ))}
      </Card>

      {/* Key Concepts */}
      <Card title="🧠 Key AI Concepts Used">
        <div style={s.conceptGrid}>
          {CONCEPTS.map((c, i) => (
            <div key={i} style={s.concept}>
              <div style={s.conceptTitle}>{c.name}</div>
              <div style={s.conceptDesc}>{c.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <div style={s.empty}>{children}</div>;
}

function Notice({ children }) {
  return <div style={s.notice}>{children}</div>;
}

function VivaItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.vivaItem}>
      <div style={s.vivaQ} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span style={s.chevron}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={s.vivaA}>{a}</div>}
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const ARCH = [
  { layer: 'Frontend',     tech: 'React.js',         desc: 'Chat UI + Dashboard + PDF Upload + Light/Dark Theme' },
  { layer: 'AI Engine',    tech: 'Claude API',        desc: 'Context-aware LLM with role-based system prompting' },
  { layer: 'Hybrid Logic', tech: 'Rule Engine',       desc: 'NLP keyword extraction for risks, tasks, tech stack' },
  { layer: 'PDF Parser',   tech: 'pdf-parse',         desc: 'Server-side multi-PDF text extraction' },
  { layer: 'Backend',      tech: 'Node.js / Express', desc: 'REST API, file handling, session management' },
  { layer: 'Database',     tech: 'MongoDB',           desc: 'Chat history, sessions, project metadata storage' },
];

const VIVA = [
  { q: 'How does the hybrid AI system work?',
    a: 'It combines two layers: (1) A rule-based NLP engine that uses keyword matching to instantly extract tasks, risks, and tech stack from PDF text — this runs locally with no API needed. (2) Claude LLM API for deep contextual reasoning, generating intelligent recommendations, and adapting to the user\'s role. The rule engine provides speed and determinism while the LLM adds intelligence.' },
  { q: 'How is context memory maintained?',
    a: 'The last 10 messages from the conversation are passed as history to the Claude API on every request. The extracted document text (up to 4000 characters) is injected into the system prompt on every call, giving the model persistent awareness of the project even though LLMs are stateless by nature.' },
  { q: 'How does role-based adaptation work?',
    a: 'When the user selects PM or Developer role, the system prompt sent to the LLM changes completely. PM prompts focus on timelines, resources, stakeholder communication, and budget. Developer prompts focus on technical architecture, API design, implementation strategy, and testing. The same question gets a different, role-appropriate answer.' },
  { q: 'How are risks identified and scored?',
    a: 'A keyword-matching engine scans extracted PDF text against a vocabulary of 20+ risk terms (delay, budget, unclear, blocker, etc.). Severity is scored by keyword density: 1 keyword = Low, 2 = Medium, 3+ = High. The LLM then provides deeper contextual risk analysis when the user asks follow-up questions.' },
  { q: 'How does PDF text extraction work?',
    a: 'PDFs are uploaded to the Express backend via multer, then processed by pdf-parse library which extracts raw text. This text is stored in MongoDB and sent to the frontend where the hybrid engine analyzes it. The extracted text is also embedded in the AI system prompt for contextual question answering.' },
  { q: 'What makes this different from a basic chatbot?',
    a: 'Three key differences: (1) Document intelligence — it reads and understands project PDFs, not just user messages. (2) Proactive insights — it automatically generates tasks, risks, and timelines without being asked. (3) Role awareness — it adapts its entire reasoning and output style based on who is asking. It acts as a project manager, not just a Q&A system.' },
];

const CONCEPTS = [
  { name: 'RAG',                  desc: 'Retrieval-Augmented Generation — document text retrieved and injected into LLM context' },
  { name: 'Prompt Engineering',   desc: 'Role-specific system prompts that control model behaviour and output style' },
  { name: 'Hybrid AI',            desc: 'Rule-based NLP + generative AI working in tandem for speed and accuracy' },
  { name: 'Context Management',   desc: 'Rolling conversation history passed with every API call to simulate memory' },
  { name: 'NLP Keyword Extraction', desc: 'Token-level pattern matching for automated risk and task identification' },
  { name: 'REST API',             desc: 'Express.js backend exposing endpoints for chat, upload, and session management' },
];

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  wrap:        { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'16px' },
  card:        { background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px', boxShadow:'var(--shadow)' },
  cardTitle:   { fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:'700', color:'var(--text-2)', marginBottom:'14px', textTransform:'uppercase', letterSpacing:'.5px' },
  loading:     { fontSize:'12px', color:'var(--text-4)', padding:'10px 0' },
  empty:       { fontSize:'12px', color:'var(--text-4)', textAlign:'center', padding:'14px 0' },
  notice:      { fontSize:'12px', color:'#fbbf24', background:'#422006', padding:'8px 12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #92400e' },
  sessItem:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg-3)', borderRadius:'9px', marginBottom:'8px', border:'1px solid var(--border)' },
  sessLeft:    { display:'flex', flexDirection:'column', gap:'3px' },
  sessName:    { fontSize:'13px', fontWeight:'600', color:'var(--text)', fontFamily:'var(--font-display)' },
  sessMeta:    { fontSize:'11px', color:'var(--text-4)' },
  delBtn:      { fontSize:'11px', color:'#f87171', background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-body)' },
  archGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'9px', marginBottom:'14px' },
  archBox:     { padding:'11px', background:'var(--bg-3)', borderRadius:'9px', border:'1px solid var(--border)' },
  archLayer:   { fontSize:'10px', color:'#6366f1', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.6px' },
  archTech:    { fontSize:'13px', fontWeight:'700', color:'var(--text)', margin:'3px 0 2px', fontFamily:'var(--font-display)' },
  archDesc:    { fontSize:'11px', color:'var(--text-4)', lineHeight:'1.5' },
  flowDiagram: { display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', padding:'12px', background:'var(--bg-3)', borderRadius:'9px', border:'1px solid var(--border)' },
  flowNode:    { padding:'4px 12px', background:'var(--accent-dim)', color:'#818cf8', borderRadius:'6px', fontSize:'12px', fontWeight:'600' },
  arrow:       { color:'var(--text-4)', fontSize:'14px' },
  vivaItem:    { borderBottom:'1px solid var(--border)', paddingBottom:'10px', marginBottom:'10px' },
  vivaQ:       { fontSize:'13px', fontWeight:'600', color:'var(--text)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', lineHeight:'1.5', userSelect:'none' },
  chevron:     { fontSize:'10px', color:'var(--text-4)', flexShrink:0, marginTop:'3px' },
  vivaA:       { fontSize:'12.5px', color:'var(--text-3)', lineHeight:'1.7', marginTop:'8px', paddingLeft:'10px', borderLeft:'2px solid var(--accent-dim)' },
  conceptGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px' },
  concept:     { padding:'11px', background:'var(--bg-3)', borderRadius:'9px', border:'1px solid var(--border)' },
  conceptTitle:{ fontSize:'12px', fontWeight:'700', color:'#818cf8', marginBottom:'4px' },
  conceptDesc: { fontSize:'11px', color:'var(--text-4)', lineHeight:'1.5' },
};
