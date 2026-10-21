
import React from "react";
import { useRef, useState } from 'react';
import { Bot, BookOpen, FileText, GraduationCap, MessageCircle, Send, Sparkles, UploadCloud, FileUp, LoaderCircle, RotateCcw } from 'lucide-react';
import { askQuestion, runStudyTool, uploadPdf } from './api.js';

const starters = [
  { icon: FileText, title: 'Summarize this PDF', text: 'Create a clear summary of this PDF.' },
  { icon: BookOpen, title: 'Make study notes', text: 'Create concise study notes from this PDF.' },
  { icon: GraduationCap, title: 'Prepare MCQs', text: 'Generate multiple-choice questions from this PDF.' }
];

export default function App() {
  const fileInput = useRef(null);
  const [document, setDocument] = useState(null);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I’m StudyMate AI. Upload a PDF, then ask me questions or create study material from it.' }
  ]);
  const [error, setError] = useState('');
  const [activeTool, setActiveTool] = useState('');

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    setBusy(true); setError(''); setDocument(null);
    try {
      const result = await uploadPdf(file);
      setDocument(result);
      setMessages([{ role: 'assistant', content: `I've processed **${result.fileName}**${result.pageCount ? ` (${result.pageCount} pages)` : ''}. Ask a question, or use one of the study tools below.` }]);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed. Check that the backend is running and your Gemini API key is configured.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  async function sendQuestion(value = question) {
    const q = value.trim();
    if (!q || !document || busy) return;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuestion(''); setBusy(true); setError(''); setActiveTool('');
    try {
      const result = await askQuestion(document.documentId, q);
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not get an answer. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function useTool(action) {
    if (!document || busy) return;
    const labels = { summary: 'Summarize this PDF', notes: 'Create study notes', mcqs: 'Generate 10 MCQs' };
    setBusy(true); setError(''); setActiveTool(action);
    setMessages(prev => [...prev, { role: 'user', content: labels[action] }]);
    try {
      const result = await runStudyTool(document.documentId, action);
      setMessages(prev => [...prev, { role: 'assistant', content: result.result }]);
      if (result.note) setError(result.note);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not generate study material.');
    } finally {
      setBusy(false); setActiveTool('');
    }
  }

  function resetChat() {
    setMessages([{ role: 'assistant', content: document ? `Chat reset. Ask me anything about ${document.fileName}.` : 'Chat reset. Upload a PDF to get started.' }]);
    setError('');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={21} /></div><div><strong>StudyMate<span> AI</span></strong><small>YOUR PDF STUDY PARTNER</small></div></div>
        <button className="new-chat" onClick={resetChat}><RotateCcw size={17} /> Reset conversation</button>
        <div className="side-label">WORKSPACE</div>
        <div className="side-item active"><MessageCircle size={18} /> PDF Chat</div>
        <div className="side-item"><BookOpen size={18} /> Study tools</div>
        <div className="sidebar-bottom"><div className="tip-icon"><GraduationCap size={19} /></div><strong>Study smarter</strong><p>Ask questions, revise key concepts, and turn your documents into study material.</p><span className="privacy-note">Your API key stays on the backend.</span></div>
      </aside>

      <main className="main-panel">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>PDF Chat</strong></div><div className="status"><span className="status-dot" /> AI assistant</div></header>
        <section className="content">
          <div className="welcome"><div className="eyebrow"><Sparkles size={14} /> YOUR AI STUDY ASSISTANT</div><h1>Understand your PDFs.<br /><span>Learn with confidence.</span></h1><p>Upload your study material and let AI help you find answers, summaries, and key concepts.</p></div>

          <div className={`upload-card ${document ? 'uploaded' : ''}`}>
            <div className="upload-icon">{document ? <FileText size={25} /> : <UploadCloud size={27} />}</div>
            <div className="upload-copy"><strong>{document ? document.fileName : 'Start with your study material'}</strong><p>{document ? `${document.pageCount || 'PDF'} pages processed · ${document.chunkCount} searchable sections` : 'Upload a PDF document to begin your AI-powered study session.'}</p></div>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={handleUpload} />
            <button className="upload-button" onClick={() => fileInput.current?.click()} disabled={busy}>{busy && !document ? <LoaderCircle className="spin" size={17} /> : <FileUp size={17} />}{document ? 'Change PDF' : 'Upload PDF'}</button>
          </div>

          {!document && <div className="getting-started"><div className="mini-sparkle"><Sparkles size={17} /></div><div><strong>What can StudyMate do?</strong><p>Upload a PDF first, then ask questions or generate revision material grounded in your document.</p></div></div>}

          <div className="section-heading"><div><h2>{document ? 'What would you like to do?' : 'Explore study tools'}</h2><p>Quick actions for your learning workflow</p></div></div>
          <div className="tool-grid">
            {starters.map((item, index) => {
              const Icon = item.icon;
              const action = ['summary', 'notes', 'mcqs'][index];
              return <button className="tool-card" key={item.title} onClick={() => document && useTool(action)} disabled={!document || busy}><div className={`tool-icon tool-${index}`}><Icon size={19} /></div><strong>{item.title}</strong><p>{['Get the main ideas and key takeaways.','Turn content into organized revision notes.','Practice with questions based on your PDF.'][index]}</p><span>{activeTool === action ? 'Generating…' : 'Generate'} <span aria-hidden="true">↗</span></span></button>;
            })}
          </div>

          <div className="chat-card">
            <div className="chat-header"><div className="chat-title-icon"><Bot size={20} /></div><div><strong>Chat with your PDF</strong><p>{document ? 'Answers based on your uploaded document' : 'Upload a PDF to unlock document chat'}</p></div><span className="rag-pill"><span /> RAG ENABLED</span></div>
            <div className="messages">
              {messages.map((message, i) => <div className={`message-row ${message.role}`} key={`${i}-${message.role}`}><div className="avatar">{message.role === 'assistant' ? <Sparkles size={16} /> : 'You'}</div><div className="message-bubble">{message.content.split('\n').map((line, j) => <p key={j}>{line || '\u00a0'}</p>)}</div></div>)}
              {busy && <div className="message-row assistant"><div className="avatar"><Sparkles size={16} /></div><div className="message-bubble thinking"><LoaderCircle size={16} className="spin" /> Thinking through your document…</div></div>}
            </div>
            {error && <div className="error-banner">{error}</div>}
            <form className="composer" onSubmit={e => { e.preventDefault(); sendQuestion(); }}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder={document ? 'Ask anything about your PDF…' : 'Upload a PDF to start asking questions'} disabled={!document || busy} /><button aria-label="Send question" type="submit" disabled={!document || busy || !question.trim()}><Send size={18} /></button></form>
            <div className="composer-foot"><span><span className="tiny-lock">◆</span> Answers use retrieved PDF context; verify important details.</span><span>Powered by Gemini</span></div>
          </div>
          <footer>Made for focused learning <span>·</span> StudyMate AI</footer>
        </section>
      </main>
    </div>
  );
}
