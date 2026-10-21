import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY;

const CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash';


const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';


app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    cb(isPdf ? null : new Error('Please upload a PDF file.'), isPdf);
  }
});

const documents = new Map();
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 900, chunkOverlap: 150 });

function getAI() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env and restart the server.');
  return new GoogleGenerativeAI(API_KEY);
}

async function embedText(text) {
  const model = getAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

async function generate(prompt) {
  const model = getAI().getGenerativeModel({ model: CHAT_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'AI PDF Chatbot backend is running.' }));

app.post('/api/documents/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a PDF file first.' });
    const parsed = await pdfParse(req.file.buffer);
    const text = (parsed.text || '').trim();
    if (!text) return res.status(422).json({ error: 'No selectable text was found. Scanned PDFs need OCR, which this starter does not include.' });

    const chunks = await splitter.splitText(text);
    const embeddedChunks = [];
    for (const content of chunks) {
      const vector = await embedText(content);
      embeddedChunks.push({ content, vector });
    }

    const id = randomUUID();
    documents.set(id, {
      id,
      name: req.file.originalname,
      pageCount: parsed.numpages || null,
      fullText: text,
      chunks: embeddedChunks
    });

    res.json({
      documentId: id,
      fileName: req.file.originalname,
      pageCount: parsed.numpages || null,
      chunkCount: embeddedChunks.length,
      message: 'PDF processed successfully.'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { documentId, question } = req.body || {};
    if (!documentId || !question?.trim()) return res.status(400).json({ error: 'documentId and question are required.' });
    const doc = documents.get(documentId);
    if (!doc) return res.status(404).json({ error: 'Document not found. Upload the PDF again if the server restarted.' });

    const questionVector = await embedText(question.trim());
    const context = doc.chunks
      .map(chunk => ({ ...chunk, score: cosineSimilarity(questionVector, chunk.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((chunk, i) => `[Context ${i + 1}]\n${chunk.content}`)
      .join('\n\n');

    const answer = await generate(
      `You are a careful study assistant. Answer using only the supplied PDF context. If the context does not contain the answer, say that the uploaded PDF does not provide enough information. Do not invent page numbers.\n\nPDF CONTEXT:\n${context}\n\nUSER QUESTION:\n${question.trim()}\n\nGive a clear, student-friendly answer.`
    );
    res.json({ answer, sourceChunks: Math.min(4, doc.chunks.length), fileName: doc.name });
  } catch (error) {
    next(error);
  }
});

app.post('/api/study-tools', async (req, res, next) => {
  try {
    const { documentId, action } = req.body || {};
    const doc = documents.get(documentId);
    if (!doc) return res.status(404).json({ error: 'Document not found. Upload the PDF again if the server restarted.' });
    const prompts = {
      summary: 'Summarize the following document clearly. Use headings and bullet points. Do not add facts that are not in the document.',
      notes: 'Create concise, well-organized study notes from the following document. Include key terms, definitions, and important points. Do not add facts that are not in the document.',
      mcqs: 'Create 10 multiple-choice questions from the following document. Give four options (A-D), identify the correct answer, and briefly explain it. Do not add facts that are not in the document.'
    };
    if (!prompts[action]) return res.status(400).json({ error: 'action must be summary, notes, or mcqs.' });

    // Limit prompt size for this demo; for large PDFs, summarize in chunks then combine.
    const text = doc.fullText.slice(0, 24000);
    const result = await generate(`${prompts[action]}\n\nDOCUMENT TEXT:\n${text}`);
    res.json({ result, action, fileName: doc.name, note: doc.fullText.length > 24000 ? 'Only the first portion of this long PDF was used for this study tool.' : undefined });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: err.message || 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
