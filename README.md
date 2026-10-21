## 🤖 AI-Powered PDF Chatbot using RAG

An AI-powered PDF chatbot that allows users to upload PDF documents, ask questions about their content, generate summaries, create study notes, and prepare multiple-choice questions (MCQs). The application uses Retrieval-Augmented Generation (RAG) and Google Gemini AI to provide answers based on the uploaded document.

## ✨ Features
PDF Upload:Upload PDF documents directly through the web interface.
AI-Powered Question Answering: Ask questions and receive answers based on the uploaded PDF.
PDF Summarization: Generate clear summaries of lengthy documents.
Automatic Study Notes: Create organized revision notes from study materials.
MCQ Generation: Generate 10 multiple-choice questions with options, correct answers, and explanations.
RAG-Based Retrieval: Retrieve relevant document sections to provide context-aware answers.
Interactive Chat Interface: Chat with your uploaded document through a user-friendly interface.
Document Processing: Extract PDF text, split it into smaller chunks, and generate embeddings.
Error Handling: Display helpful messages for invalid uploads and API errors.

## 🛠️ Technologies Used
  ## Frontend:
    React.js
    Vite
    JavaScript
    CSS
    Axios
    Lucide React
  ## Backend:
    Node.js
    Express.js
    REST APIs
    Multer
    PDF-Parse
  ## AI and Machine Learning
    Google Gemini API
    LangChain.js
    Text Embeddings
    Cosine Similarity
    Retrieval-Augmented Generation (RAG)
## 🏗️ Project Architecture
   The application follows a full-stack architecture in which the React frontend communicates with the Node.js and Express backend through REST APIs.
   The user uploads a PDF document.
   The backend extracts text from the PDF using PDF-Parse.
   LangChain splits the extracted text into smaller chunks.
   Google Gemini generates embeddings for the document chunks.
   When the user asks a question, the system generates an embedding for the question.
   Cosine similarity is used to retrieve the most relevant document chunks.
   The retrieved context is sent to Gemini to generate an answer.
   The answer is displayed in the React chat interface.    
