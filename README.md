# AI PDF Chatbot Using RAG (React + Node.js)

A starter full-stack project that lets you upload a PDF, ask questions grounded in its contents, and generate summaries, study notes, and MCQs.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- PDF text extraction: `pdf-parse`
- RAG: LangChain.js text splitting + Google Gemini embeddings + in-memory cosine similarity retrieval
- LLM: Gemini API

> This starter uses an in-memory vector store to keep setup simple. Uploaded documents are processed in memory and are not persisted across server restarts. For production, use a persistent vector database, authentication, rate limiting, file scanning, and stronger upload controls.

## Requirements
- Node.js 20.19+ or 22.12+ recommended (current Vite versions require a recent Node version)
- npm
- A Gemini API key from https://aistudio.google.com/apikey

## Setup

### 1. Configure the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and add your API key:
- Windows PowerShell:
  ```powershell
  Copy-Item .env.example .env
  ```
- macOS/Linux:
  ```bash
  cp .env.example .env
  ```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_key_here
PORT=5000
```

### 2. Start the backend
Run from the `backend` folder:
```bash
npm run dev
```
Backend: http://localhost:5000

### 3. Configure and start the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## Windows quick start
Open two terminals in the project folder.

Terminal 1:
```powershell
cd backend
Copy-Item .env.example .env
# Add your Gemini key to backend/.env, then:
npm install
npm run dev
```

Terminal 2:
```powershell
cd frontend
npm install
npm run dev
```

## How it works
1. Upload PDF to the Express backend.
2. Backend extracts text and splits it into chunks.
3. Gemini embedding model creates vectors for chunks.
4. On each question, the backend embeds the question and retrieves the most similar chunks by cosine similarity.
5. Retrieved context is sent to Gemini to generate a grounded answer.
6. Summary, notes, and MCQs use the extracted document text.

## API endpoints
- `GET /api/health`
- `POST /api/documents/upload` — multipart field `file`
- `POST /api/chat` — JSON `{ "documentId": "...", "question": "..." }`
- `POST /api/study-tools` — JSON `{ "documentId": "...", "action": "summary|notes|mcqs" }`

## Notes and troubleshooting
- Never commit `.env` or expose your Gemini key in React.
- Free-tier models, quotas, and availability can change. If a model name is unavailable to your account, update `GEMINI_CHAT_MODEL` or `GEMINI_EMBEDDING_MODEL` in `backend/.env` to a currently supported model from Google AI Studio documentation.
- This demo stores document chunks in server memory. If the backend restarts, upload the PDF again.
- If `pdf-parse` has a compatibility issue with your Node version, use a current supported Node LTS release and check the package documentation.
