// ── Hybrid AI Engine (runs locally, instant analysis) ──────────────

const RISK_KEYWORDS = [
  'delay','delayed','overdue','budget','cost overrun','unclear','ambiguous',
  'missing','dependency','blocker','risk','issue','problem','critical',
  'deadline','milestone','scope creep','resource','constraint','unknown','failure'
];

const TASK_KEYWORDS = [
  'requirement','feature','module','component','api','database','ui','test',
  'deploy','integrate','design','implement','build','create','develop','review','configure'
];

const TECH_LIST = [
  'react','angular','vue','node','python','java','mongodb','mysql','postgresql',
  'aws','docker','kubernetes','redis','typescript','express','flask','spring',
  'graphql','rest','microservices','firebase','azure','gcp'
];

export function extractRisks(text) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const risks = [];
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    const found = RISK_KEYWORDS.filter(k => lower.includes(k));
    if (found.length > 0) {
      risks.push({
        text: s.trim().substring(0, 220),
        keywords: found,
        severity: found.length >= 3 ? 'High' : found.length === 2 ? 'Medium' : 'Low'
      });
    }
  });
  // Deduplicate
  const seen = new Set();
  return risks.filter(r => {
    const key = r.text.substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

export function extractTasks(text) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 15);
  const tasks = [];
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    if (TASK_KEYWORDS.some(k => lower.includes(k))) {
      const verb = lower.includes('implement') ? 'Implement' :
                   lower.includes('design')    ? 'Design'    :
                   lower.includes('test')      ? 'Test'      :
                   lower.includes('deploy')    ? 'Deploy'    :
                   lower.includes('review')    ? 'Review'    :
                   lower.includes('integrate') ? 'Integrate' :
                   lower.includes('configure') ? 'Configure' : 'Build';
      tasks.push({
        task: `${verb}: ${s.trim().substring(0, 90)}`,
        status: 'Pending',
        priority: lower.includes('critical') || lower.includes('high') ? 'High' :
                  lower.includes('low') ? 'Low' : 'Medium'
      });
    }
  });
  const unique = [...new Map(tasks.map(t => [t.task, t])).values()];
  return unique.slice(0, 12);
}

export function estimateTimeline(text, tasks) {
  const lower = text.toLowerCase();
  const complex = ['microservices','machine learning','ai','distributed','real-time','blockchain'].some(k => lower.includes(k));
  const base = Math.max(4, tasks.length * 2);
  const weeks = complex ? base + 6 : base;
  const capped = Math.min(weeks, 52);
  return {
    weeks: capped,
    phases: [
      { name: 'Requirements & Design', duration: Math.ceil(capped * 0.20), color: '#6366f1' },
      { name: 'Core Development',      duration: Math.ceil(capped * 0.40), color: '#8b5cf6' },
      { name: 'Integration & Testing', duration: Math.ceil(capped * 0.25), color: '#a78bfa' },
      { name: 'Deployment & Review',   duration: Math.ceil(capped * 0.15), color: '#c4b5fd' }
    ]
  };
}

export function summarizeProject(text) {
  const words = text.split(/\s+/).length;
  const lower = text.toLowerCase();
  const techStack = TECH_LIST
    .filter(t => lower.includes(t))
    .map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const summary = sentences.slice(0, 2).join('. ').trim();
  return { wordCount: words, techStack, summary: summary || 'Project document loaded.', sentences: sentences.length };
}

export function buildSystemPrompt(role, docText) {
  const roleBlock = role === 'PM'
    ? `You are an expert AI Project Management Copilot assisting a PROJECT MANAGER.
Focus on: timelines, milestones, resources, risks, stakeholder communication, budget, scope management.
Always recommend concrete next steps. Frame answers in terms of project phases and team coordination.`
    : `You are an expert AI Project Management Copilot assisting a DEVELOPER.
Focus on: technical architecture, implementation details, API design, code structure, testing, CI/CD.
Always recommend technical tasks, implementation approaches, and code-level action items.`;

  return `${roleBlock}

PROJECT CONTEXT FROM UPLOADED DOCUMENTS:
${docText ? docText.substring(0, 4000) : 'No documents uploaded yet. Ask the user to upload project PDFs.'}

BEHAVIOUR RULES:
- NEVER act as a simple Q&A bot. Always provide recommendations, decisions, and next actions.
- Rate task effort as: Low (1-3 days), Medium (1-2 weeks), High (2+ weeks).
- Rate risk severity as: High / Medium / Low with a brief mitigation suggestion.
- Format responses with clear sections and bullet points when helpful.
- Be concise but intelligent — every response should add project value.`;
}
