const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// POST /api/upload — Upload and extract PDF
router.post('/', upload.array('pdfs', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      try {
        // Extract text from PDF
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text;

        // Run hybrid analysis
        const risks = extractRisks(extractedText);
        const tasks = extractTasks(extractedText);
        const summary = summarizeText(extractedText);
        const techStack = detectTechStack(extractedText);

        results.push({
          filename: file.originalname,
          storedAs: file.filename,
          size: (file.size / 1024).toFixed(1) + ' KB',
          pages: pdfData.numpages,
          wordCount: extractedText.split(/\s+/).length,
          extractedText: extractedText.substring(0, 5000), // limit for response
          fullTextLength: extractedText.length,
          risks,
          tasks,
          summary,
          techStack
        });
      } catch (parseErr) {
        results.push({
          filename: file.originalname,
          error: 'Could not parse PDF: ' + parseErr.message,
          extractedText: `Document: ${file.originalname}. PDF parsing encountered an issue.`,
          risks: [], tasks: [], summary: '', techStack: []
        });
      }
    }

    res.json({ success: true, files: results });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Hybrid Analysis Functions ────────────────────────────────────────────────
const RISK_KEYWORDS = [
  'delay','delayed','overdue','budget','cost overrun','unclear','ambiguous',
  'missing','dependency','blocker','risk','issue','problem','critical',
  'deadline','milestone','scope creep','resource','constraint','unknown'
];

const TASK_KEYWORDS = [
  'requirement','feature','module','component','api','database','ui','test',
  'deploy','integrate','design','implement','build','create','develop','review'
];

function extractRisks(text) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const risks = [];
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    const found = RISK_KEYWORDS.filter(k => lower.includes(k));
    if (found.length > 0) {
      risks.push({
        text: s.trim().substring(0, 200),
        keywords: found,
        severity: found.length >= 3 ? 'High' : found.length === 2 ? 'Medium' : 'Low'
      });
    }
  });
  return risks.slice(0, 10);
}

function extractTasks(text) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 15);
  const tasks = [];
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    if (TASK_KEYWORDS.some(k => lower.includes(k))) {
      const verb = lower.includes('implement') ? 'Implement' :
                   lower.includes('design') ? 'Design' :
                   lower.includes('test') ? 'Test' :
                   lower.includes('deploy') ? 'Deploy' :
                   lower.includes('review') ? 'Review' :
                   lower.includes('integrate') ? 'Integrate' : 'Build';
      tasks.push({
        task: `${verb}: ${s.trim().substring(0, 80)}`,
        status: 'Pending',
        priority: Math.random() > 0.5 ? 'High' : 'Medium'
      });
    }
  });
  const unique = [...new Map(tasks.map(t => [t.task, t])).values()];
  return unique.slice(0, 12);
}

function summarizeText(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
  return sentences.slice(0, 3).join('. ').trim();
}

function detectTechStack(text) {
  const techs = ['react','angular','vue','node','python','java','mongodb','mysql',
    'postgresql','aws','docker','kubernetes','redis','typescript','express','flask','spring'];
  const lower = text.toLowerCase();
  return techs.filter(t => lower.includes(t)).map(t => t.charAt(0).toUpperCase() + t.slice(1));
}

module.exports = router;
