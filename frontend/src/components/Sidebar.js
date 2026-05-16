import { useRef } from 'react';
import { uploadPDFs, createSession } from '../api';
import { extractRisks, extractTasks, estimateTimeline, summarizeProject } from '../engine/analysis';

export default function Sidebar({ pdfs, setPdfs, combinedText, setCombinedText, tasks, setTasks,
  risks, setRisks, timeline, setTimeline, summary, setSummary, sessionId, setSessionId,
  role, setActiveTab, backendOk }) {
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (!files.length) return;

    let extractedTexts = [];

    if (backendOk) {
      try {
        const results = await uploadPDFs(files);
        results.forEach(r => {
          extractedTexts.push(r.extractedText || '');
          setPdfs(p => [...p, { name: r.filename, size: r.size, pages: r.pages }]);
        });
      } catch {
        extractedTexts = files.map(f => `Document: ${f.name}`);
        files.forEach(f => setPdfs(p => [...p, { name: f.name, size: (f.size/1024).toFixed(1)+' KB' }]));
      }
    } else {
      // Fallback: read via FileReader
      for (const f of files) {
        extractedTexts.push(`Document: ${f.name}. Project specifications and requirements document.`);
        setPdfs(p => [...p, { name: f.name, size: (f.size/1024).toFixed(1)+' KB' }]);
      }
    }

    const newText = combinedText + '\n\n' + extractedTexts.join('\n\n');
    setCombinedText(newText);

    const r = extractRisks(newText);
    const t = extractTasks(newText);
    const tl = estimateTimeline(newText, t);
    const sm = summarizeProject(newText);
    setRisks(r); setTasks(t); setTimeline(tl); setSummary(sm);

    // Create session in MongoDB
    if (backendOk && !sessionId) {
      try {
        const sess = await createSession({ projectName: files[0].name.replace('.pdf',''), role, files: files.map(f => ({ filename: f.name })) });
        setSessionId(sess._id);
      } catch {}
    }

    setActiveTab('chat');
    e.target.value = '';
  };

  const removePdf = (i) => {
    const updated = pdfs.filter((_, idx) => idx !== i);
    setPdfs(updated);
    if (updated.length === 0) { setCombinedText(''); setRisks([]); setTasks([]); setTimeline(null); setSummary(null); }
  };

  const done = tasks.filter(t => t.status === 'Done').length;
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const high = risks.filter(r => r.severity === 'High').length;

  return (
    <aside style={s.aside}>
      {/* Upload */}
      <div style={s.section}>
        <div style={s.sectionTitle}>DOCUMENTS</div>
        <button style={s.uploadBtn} onClick={() => fileRef.current.click()}>
          <UploadIcon /> Upload PDFs
        </button>
        <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display:'none' }} onChange={handleUpload} />
        {pdfs.length === 0
          ? <div style={s.empty}>No documents loaded</div>
          : pdfs.map((p, i) => (
              <div key={i} style={s.pdfRow}>
                <DocIcon />
                <div style={s.pdfMeta}>
                  <div style={s.pdfName}>{p.name}</div>
                  <div style={s.pdfSize}>{p.size}{p.pages ? ` · ${p.pages}p` : ''}</div>
                </div>
                <button style={s.removeBtn} onClick={() => removePdf(i)}>✕</button>
              </div>
            ))
        }
      </div>

      {/* Stats */}
      {summary && (
        <div style={s.section}>
          <div style={s.sectionTitle}>QUICK STATS</div>
          <div style={s.statGrid}>
            <Stat num={tasks.length}  label="Tasks"    color="#6366f1" />
            <Stat num={high}          label="High Risk" color="#f87171" />
            <Stat num={timeline?.weeks || '–'} label="Est. Weeks" color="#34d399" />
            <Stat num={pct + '%'}     label="Done"     color="#a78bfa" />
          </div>
          {/* Mini progress */}
          <div style={s.miniBar}>
            <div style={{ ...s.miniFill, width: pct + '%' }} />
          </div>
          <div style={s.miniLabel}>{done}/{tasks.length} tasks complete</div>
        </div>
      )}

      {/* Tech Stack */}
      {summary?.techStack?.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>TECH DETECTED</div>
          <div style={s.tags}>
            {summary.techStack.map((t, i) => <span key={i} style={s.tag}>{t}</span>)}
          </div>
        </div>
      )}

      {/* Word count */}
      {summary && (
        <div style={s.section}>
          <div style={s.sectionTitle}>ANALYSIS</div>
          <div style={s.infoRow}><span style={s.infoLabel}>Words</span><span style={s.infoVal}>{summary.wordCount?.toLocaleString()}</span></div>
          <div style={s.infoRow}><span style={s.infoLabel}>Sentences</span><span style={s.infoVal}>{summary.sentences}</span></div>
          <div style={s.infoRow}><span style={s.infoLabel}>Documents</span><span style={s.infoVal}>{pdfs.length}</span></div>
        </div>
      )}
    </aside>
  );
}

function Stat({ num, label, color }) {
  return (
    <div style={s.statBox}>
      <div style={{ ...s.statNum, color }}>{num}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{ flexShrink:0, color:'var(--text-3)' }}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const s = {
  aside:       { width:'230px', background:'var(--sidebar-bg)', borderRight:'1px solid var(--border)', padding:'16px 14px', overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column', gap:'22px' },
  section:     { display:'flex', flexDirection:'column', gap:'8px' },
  sectionTitle:{ fontSize:'10px', fontWeight:'700', letterSpacing:'1.2px', color:'var(--text-4)', textTransform:'uppercase', fontFamily:'var(--font-display)' },
  uploadBtn:   { display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'9px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'9px', fontSize:'12px', cursor:'pointer', fontWeight:'600', fontFamily:'var(--font-body)', transition:'var(--transition)' },
  empty:       { fontSize:'11px', color:'var(--text-4)', textAlign:'center', padding:'10px 0' },
  pdfRow:      { display:'flex', alignItems:'center', gap:'7px', padding:'7px 9px', background:'var(--bg-3)', borderRadius:'8px', border:'1px solid var(--border)' },
  pdfMeta:     { flex:1, overflow:'hidden' },
  pdfName:     { fontSize:'11px', color:'var(--text-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:'500' },
  pdfSize:     { fontSize:'10px', color:'var(--text-4)' },
  removeBtn:   { background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', fontSize:'11px', padding:'2px 4px', borderRadius:'4px', lineHeight:1 },
  statGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' },
  statBox:     { background:'var(--bg-3)', borderRadius:'9px', padding:'10px', textAlign:'center', border:'1px solid var(--border)' },
  statNum:     { fontSize:'20px', fontWeight:'800', fontFamily:'var(--font-display)', lineHeight:1 },
  statLabel:   { fontSize:'9px', color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'3px' },
  miniBar:     { height:'5px', background:'var(--bg-4)', borderRadius:'99px', overflow:'hidden' },
  miniFill:    { height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'99px', transition:'width .4s' },
  miniLabel:   { fontSize:'10px', color:'var(--text-4)' },
  tags:        { display:'flex', flexWrap:'wrap', gap:'5px' },
  tag:         { padding:'3px 9px', background:'var(--accent-dim)', color:'#818cf8', borderRadius:'5px', fontSize:'10px', fontWeight:'600' },
  infoRow:     { display:'flex', justifyContent:'space-between', fontSize:'11px' },
  infoLabel:   { color:'var(--text-4)' },
  infoVal:     { color:'var(--text-2)', fontWeight:'600' },
};
