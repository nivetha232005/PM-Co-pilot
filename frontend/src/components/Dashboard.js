import { useState } from 'react';

export default function Dashboard({ tasks, setTasks, risks, timeline, summary, pdfs, role }) {
  const done    = tasks.filter(t => t.status === 'Done').length;
  const pct     = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const highRisk = risks.filter(r => r.severity === 'High').length;

  if (!summary) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}>◈</div>
        <div style={s.emptyTitle}>No Project Loaded</div>
        <div style={s.emptyText}>Upload PDF documents from the sidebar to generate your intelligent dashboard</div>
      </div>
    );
  }

  return (
    <div style={s.dash}>
      {/* KPI Row */}
      <div style={s.kpiRow}>
        <KPI label="Total Tasks"  value={tasks.length}  color="#6366f1" icon="✅" />
        <KPI label="High Risks"   value={highRisk}      color="#f87171" icon="⚠️" />
        <KPI label="Est. Weeks"   value={timeline?.weeks || '–'} color="#34d399" icon="📅" />
        <KPI label="Completed"    value={pct + '%'}     color="#a78bfa" icon="📊" />
        <KPI label="Documents"    value={pdfs.length}   color="#fbbf24" icon="📄" />
      </div>

      <div style={s.grid}>
        {/* Left column */}
        <div style={s.col}>
          {/* Project Summary */}
          <Card title="📋 Project Summary">
            <p style={s.summaryText}>{summary.summary}</p>
            <div style={s.metaRow}>
              <Tag>{pdfs.length} doc(s)</Tag>
              <Tag>{summary.wordCount?.toLocaleString()} words</Tag>
              <Tag>{summary.sentences} sentences</Tag>
              <Tag color="#6366f1">{role === 'PM' ? 'PM View' : 'Dev View'}</Tag>
            </div>
            {summary.techStack?.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={s.subLabel}>Tech Stack Detected</div>
                <div style={s.tagRow}>
                  {summary.techStack.map((t, i) => <Tag key={i} color="#6366f1">{t}</Tag>)}
                </div>
              </div>
            )}
          </Card>

          {/* Progress */}
          <Card title="📊 Task Progress">
            <div style={s.bigProgress}>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: pct + '%' }} />
              </div>
              <div style={s.progressStats}>
                <span style={s.pctBig}>{pct}%</span>
                <span style={s.pctSub}>{done} of {tasks.length} tasks done</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          {timeline && (
            <Card title={`📅 Timeline Estimate — ${timeline.weeks} weeks`}>
              <div style={s.phases}>
                {timeline.phases.map((p, i) => (
                  <div key={i} style={s.phaseRow}>
                    <div style={s.phaseLabel}>{p.name}</div>
                    <div style={s.phaseTrack}>
                      <div style={{ ...s.phaseFill, width: `${(p.duration / timeline.weeks) * 100}%`, background: p.color }} />
                    </div>
                    <div style={s.phaseWeeks}>{p.duration}w</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div style={s.col}>
          {/* Tasks */}
          <Card title={`✅ Suggested Tasks (${tasks.length})`}>
            {tasks.length === 0
              ? <Empty>No tasks extracted yet</Empty>
              : <div style={s.taskList}>
                  {tasks.map((t, i) => (
                    <TaskItem key={i} task={t} onToggle={() =>
                      setTasks(prev => prev.map((tk, idx) =>
                        idx === i ? { ...tk, status: tk.status === 'Done' ? 'Pending' : 'Done' } : tk
                      ))
                    } />
                  ))}
                </div>
            }
          </Card>

          {/* Risks */}
          <Card title={`⚠️ Risk Alerts (${risks.length})`}>
            {risks.length === 0
              ? <Empty>No risks detected</Empty>
              : risks.map((r, i) => <RiskItem key={i} risk={r} />)
            }
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KPI({ label, value, color, icon }) {
  return (
    <div style={s.kpi}>
      <div style={s.kpiIcon}>{icon}</div>
      <div style={{ ...s.kpiVal, color }}>{value}</div>
      <div style={s.kpiLabel}>{label}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{ ...s.tag, ...(color ? { background: color + '18', color } : {}) }}>{children}</span>
  );
}

function Empty({ children }) {
  return <div style={s.emptyInner}>{children}</div>;
}

function TaskItem({ task, onToggle }) {
  const done = task.status === 'Done';
  return (
    <div style={{ ...s.taskItem, opacity: done ? 0.55 : 1 }}>
      <input type="checkbox" checked={done} onChange={onToggle} style={s.check} />
      <span style={{ ...s.taskText, textDecoration: done ? 'line-through' : 'none' }}>{task.task}</span>
      <PriorityBadge p={task.priority} />
    </div>
  );
}

function PriorityBadge({ p }) {
  const colors = { High: ['#450a0a','#f87171'], Medium: ['#422006','#fbbf24'], Low: ['#052e16','#34d399'] };
  const [bg, fg] = colors[p] || colors.Medium;
  return <span style={{ ...s.badge, background: bg, color: fg }}>{p}</span>;
}

function RiskItem({ risk }) {
  const borderColor = risk.severity === 'High' ? '#f87171' : risk.severity === 'Medium' ? '#fbbf24' : '#34d399';
  return (
    <div style={{ ...s.riskCard, borderLeft: `3px solid ${borderColor}` }}>
      <div style={s.riskTop}>
        <PriorityBadge p={risk.severity} />
        <div style={s.kwRow}>{risk.keywords.slice(0, 4).map((k, i) => <span key={i} style={s.kw}>{k}</span>)}</div>
      </div>
      <div style={s.riskText}>{risk.text.substring(0, 160)}{risk.text.length > 160 ? '…' : ''}</div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  dash:        { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'16px' },
  empty:       { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', opacity:.4, padding:'40px' },
  emptyIcon:   { fontSize:'52px', color:'var(--text-4)' },
  emptyTitle:  { fontFamily:'var(--font-display)', fontSize:'20px', fontWeight:'700', color:'var(--text-3)' },
  emptyText:   { fontSize:'13px', color:'var(--text-4)', textAlign:'center', maxWidth:'300px' },
  kpiRow:      { display:'flex', gap:'12px', flexWrap:'wrap' },
  kpi:         { flex:'1 1 100px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', textAlign:'center', minWidth:'100px' },
  kpiIcon:     { fontSize:'20px', marginBottom:'6px' },
  kpiVal:      { fontFamily:'var(--font-display)', fontSize:'26px', fontWeight:'800', lineHeight:1 },
  kpiLabel:    { fontSize:'10px', color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.6px', marginTop:'5px' },
  grid:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  col:         { display:'flex', flexDirection:'column', gap:'16px' },
  card:        { background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', boxShadow:'var(--shadow)' },
  cardTitle:   { fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:'700', color:'var(--text-2)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'.5px' },
  summaryText: { fontSize:'13px', color:'var(--text-2)', lineHeight:'1.7', marginBottom:'10px' },
  metaRow:     { display:'flex', gap:'6px', flexWrap:'wrap' },
  tagRow:      { display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'6px' },
  tag:         { padding:'3px 9px', background:'var(--bg-3)', color:'var(--text-3)', borderRadius:'5px', fontSize:'11px', fontWeight:'500', border:'1px solid var(--border)' },
  subLabel:    { fontSize:'10px', color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'2px' },
  bigProgress: { display:'flex', flexDirection:'column', gap:'8px' },
  progressTrack:{ height:'10px', background:'var(--bg-3)', borderRadius:'99px', overflow:'hidden', border:'1px solid var(--border)' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'99px', transition:'width .5s ease' },
  progressStats:{ display:'flex', alignItems:'baseline', gap:'8px' },
  pctBig:      { fontFamily:'var(--font-display)', fontSize:'28px', fontWeight:'800', color:'#6366f1' },
  pctSub:      { fontSize:'12px', color:'var(--text-4)' },
  phases:      { display:'flex', flexDirection:'column', gap:'10px' },
  phaseRow:    { display:'flex', alignItems:'center', gap:'10px' },
  phaseLabel:  { fontSize:'12px', color:'var(--text-2)', width:'185px', flexShrink:0 },
  phaseTrack:  { flex:1, height:'8px', background:'var(--bg-3)', borderRadius:'99px', overflow:'hidden' },
  phaseFill:   { height:'100%', borderRadius:'99px' },
  phaseWeeks:  { fontSize:'11px', color:'var(--text-4)', width:'22px', textAlign:'right' },
  taskList:    { display:'flex', flexDirection:'column', gap:'6px', maxHeight:'320px', overflowY:'auto' },
  taskItem:    { display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', background:'var(--bg-3)', borderRadius:'8px', border:'1px solid var(--border)', transition:'var(--transition)' },
  check:       { accentColor:'#6366f1', width:'14px', height:'14px', cursor:'pointer', flexShrink:0 },
  taskText:    { flex:1, fontSize:'12px', color:'var(--text-2)', lineHeight:'1.4' },
  badge:       { padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'700', flexShrink:0 },
  riskCard:    { padding:'10px 12px', background:'var(--bg-3)', borderRadius:'8px', marginBottom:'7px', border:'1px solid var(--border)' },
  riskTop:     { display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' },
  kwRow:       { display:'flex', gap:'4px', flexWrap:'wrap' },
  kw:          { padding:'1px 7px', background:'var(--accent-dim)', color:'#818cf8', borderRadius:'4px', fontSize:'10px', fontWeight:'500' },
  riskText:    { fontSize:'12px', color:'var(--text-3)', lineHeight:'1.55' },
  emptyInner:  { fontSize:'12px', color:'var(--text-4)', textAlign:'center', padding:'14px 0' },
};
