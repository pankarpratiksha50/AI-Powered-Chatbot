import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export async function uploadPdf(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/documents/upload', form);
  return data;
}

export async function askQuestion(documentId, question) {
  const { data } = await api.post('/chat', { documentId, question });
  return data;
}

export async function runStudyTool(documentId, action) {
  const { data } = await api.post('/study-tools', { documentId, action });
  return data;
}
