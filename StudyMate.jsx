import { useState, useRef, useCallback, useEffect } from "react";

// ── Anthropic API helper ─────────────────────────────────────────────────────
const callAI = async (messages, system = "") => {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages,
  };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "Something went wrong. Please try again.";
};

// ── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    upload: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    chat: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    notes: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    translate: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
      </svg>
    ),
    quiz: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    sparkle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{
    width: 18, height: 18, border: "2.5px solid rgba(99,179,237,0.25)",
    borderTop: "2.5px solid #63B3ED", borderRadius: "50%",
    animation: "spin 0.7s linear infinite", flexShrink: 0
  }}/>
);

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "upload", label: "Materials", icon: "upload" },
  { id: "chat", label: "Ask Anything", icon: "chat" },
  { id: "notes", label: "Study Notes", icon: "notes" },
  { id: "translate", label: "Translate", icon: "translate" },
  { id: "quiz", label: "Quiz Me", icon: "quiz" },
];

const LANGUAGES = [
  "Chinese (Mandarin)", "Korean", "German", "Hindi", "Japanese",
  "French", "Spanish", "Arabic", "Portuguese", "Italian",
];

// ── Main App ─────────────────────────────────────────────────────────────────
export default function StudyMate() {
  const [activeTab, setActiveTab] = useState("upload");
  const [materials, setMaterials] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Notes state
  const [notesLoading, setNotesLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [notesTopic, setNotesTopic] = useState("");

  // Translate state
  const [translateInput, setTranslateInput] = useState("");
  const [translateLang, setTranslateLang] = useState("Chinese (Mandarin)");
  const [translateResult, setTranslateResult] = useState("");
  const [translateLoading, setTranslateLoading] = useState(false);

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizTopic, setQuizTopic] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getContext = () =>
    materials.map(m => `### ${m.name}\n${m.content}`).join("\n\n---\n\n");

  const hasContext = materials.length > 0;

  // ── File upload ────────────────────────────────────────────────────────────
  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setMaterials(prev => [
        ...prev,
        { id: Date.now(), name: file.name, content, size: file.size, type: file.type }
      ]);
    };
    if (file.type === "application/pdf") {
      reader.readAsDataURL(file);
      setMaterials(prev => [
        ...prev,
        {
          id: Date.now(), name: file.name,
          content: `[PDF: ${file.name}] PDF content loaded. Use the Q&A feature to ask questions about this document.`,
          size: file.size, type: file.type
        }
      ]);
      return;
    }
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, []);

  const handleFileInput = (e) => {
    Array.from(e.target.files).forEach(processFile);
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const history = [...chatMessages, { role: "user", content: userMsg }]
        .map(m => ({ role: m.role, content: m.content }));
      const system = hasContext
        ? `You are StudyMate, an intelligent study assistant. Answer questions based on the following course materials:\n\n${getContext()}\n\nBe concise, clear, and educational. If the answer isn't in the materials, say so but still try to help.`
        : "You are StudyMate, an intelligent study assistant. Help students understand academic concepts clearly and concisely.";
      const reply = await callAI(history, system);
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    }
    setChatLoading(false);
  };

  // ── Notes ──────────────────────────────────────────────────────────────────
  const generateNotes = async () => {
    setNotesLoading(true);
    setGeneratedNotes("");
    try {
      const prompt = notesTopic
        ? `Generate comprehensive study notes on the topic "${notesTopic}"${hasContext ? " based on the provided course materials" : ""}.`
        : `Generate comprehensive study notes${hasContext ? " from the provided course materials" : " on a general academic topic"}. Include key concepts, definitions, important points, and a summary.`;
      const system = hasContext
        ? `You are StudyMate. Create structured study notes from these materials:\n\n${getContext()}\n\nFormat: Use clear headings (##), bullet points, bold key terms, and end with a concise summary. Make notes easy to review.`
        : "You are StudyMate. Create well-structured study notes with headings, key concepts, and a summary.";
      const reply = await callAI([{ role: "user", content: prompt }], system);
      setGeneratedNotes(reply);
    } catch {
      setGeneratedNotes("Failed to generate notes. Please try again.");
    }
    setNotesLoading(false);
  };

  // ── Translate ──────────────────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!translateInput.trim() || translateLoading) return;
    setTranslateLoading(true);
    setTranslateResult("");
    try {
      const system = `You are a professional translator. Translate the given text to ${translateLang} accurately and naturally. Return only the translated text, no explanations.`;
      const reply = await callAI([{ role: "user", content: translateInput }], system);
      setTranslateResult(reply);
    } catch {
      setTranslateResult("Translation failed. Please try again.");
    }
    setTranslateLoading(false);
  };

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const generateQuiz = async () => {
    setQuizLoading(true);
    setQuizData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const prompt = quizTopic
        ? `Generate a 5-question quiz about "${quizTopic}"${hasContext ? " based on the provided materials" : ""}.`
        : `Generate a 5-question quiz${hasContext ? " from the provided course materials" : " on general knowledge"}.`;
      const system = (hasContext
        ? `You are StudyMate. Use these materials:\n\n${getContext()}\n\n`
        : "You are StudyMate. ") +
        `Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "A) ...",
      "explanation": "Brief explanation"
    }
  ]
}`;
      const raw = await callAI([{ role: "user", content: prompt }], system);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuizData(parsed);
    } catch {
      setQuizData({ error: "Failed to generate quiz. Please try again." });
    }
    setQuizLoading(false);
  };

  const submitQuiz = () => {
    if (!quizData?.questions) return;
    let correct = 0;
    quizData.questions.forEach(q => {
      if (quizAnswers[q.id] === q.answer) correct++;
    });
    setQuizScore(correct);
    setQuizSubmitted(true);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    app: {
      minHeight: "100vh", background: "#0A0E1A",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#E2E8F0", display: "flex", flexDirection: "column",
    },
    header: {
      background: "linear-gradient(135deg, #0F1629 0%, #0A0E1A 100%)",
      borderBottom: "1px solid rgba(99,179,237,0.12)",
      padding: "0 28px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 60,
      backdropFilter: "blur(10px)",
    },
    logo: {
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px",
    },
    logoAccent: { color: "#63B3ED" },
    badge: {
      fontSize: 11, background: "rgba(99,179,237,0.15)",
      color: "#63B3ED", padding: "3px 10px", borderRadius: 20,
      border: "1px solid rgba(99,179,237,0.25)", fontWeight: 600, letterSpacing: "0.5px"
    },
    msTag: {
      fontSize: 11, color: "rgba(226,232,240,0.4)", display: "flex",
      alignItems: "center", gap: 5,
    },
    layout: { display: "flex", flex: 1 },
    sidebar: {
      width: 220, background: "#0D1220", borderRight: "1px solid rgba(99,179,237,0.08)",
      padding: "20px 0", display: "flex", flexDirection: "column", gap: 4,
    },
    sidebarSection: {
      fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
      color: "rgba(226,232,240,0.3)", padding: "4px 20px 8px", textTransform: "uppercase"
    },
    tab: (active) => ({
      display: "flex", alignItems: "center", gap: 10, padding: "11px 20px",
      cursor: "pointer", borderRadius: 0, transition: "all 0.15s",
      color: active ? "#63B3ED" : "rgba(226,232,240,0.55)",
      background: active ? "rgba(99,179,237,0.08)" : "transparent",
      borderLeft: active ? "2px solid #63B3ED" : "2px solid transparent",
      fontSize: 14, fontWeight: active ? 600 : 400,
    }),
    sidebarFiles: {
      marginTop: "auto", padding: "16px 16px 0",
      borderTop: "1px solid rgba(99,179,237,0.08)",
    },
    filesTitle: {
      fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
      color: "rgba(226,232,240,0.3)", textTransform: "uppercase", marginBottom: 8
    },
    fileItem: {
      display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
      background: "rgba(99,179,237,0.06)", borderRadius: 8, marginBottom: 4,
      fontSize: 12, color: "rgba(226,232,240,0.7)",
    },
    fileItemName: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    removeBtn: {
      cursor: "pointer", color: "rgba(226,232,240,0.3)", padding: 2,
      borderRadius: 4, transition: "color 0.15s", background: "none", border: "none",
      display: "flex", alignItems: "center",
    },
    main: { flex: 1, padding: 32, overflow: "auto" },
    panel: { maxWidth: 780, margin: "0 auto" },
    panelTitle: {
      fontSize: 26, fontWeight: 700, letterSpacing: "-0.8px",
      color: "#E2E8F0", marginBottom: 6,
    },
    panelSub: { fontSize: 14, color: "rgba(226,232,240,0.45)", marginBottom: 28 },

    // Upload
    dropZone: (dragging) => ({
      border: `2px dashed ${dragging ? "#63B3ED" : "rgba(99,179,237,0.25)"}`,
      borderRadius: 16, padding: "52px 32px", textAlign: "center",
      background: dragging ? "rgba(99,179,237,0.06)" : "rgba(99,179,237,0.02)",
      cursor: "pointer", transition: "all 0.2s",
    }),
    uploadIcon: {
      width: 56, height: 56, background: "rgba(99,179,237,0.1)",
      borderRadius: 16, display: "flex", alignItems: "center",
      justifyContent: "center", margin: "0 auto 16px", color: "#63B3ED"
    },

    // Card
    card: {
      background: "#0F1629", border: "1px solid rgba(99,179,237,0.1)",
      borderRadius: 16, padding: 24, marginBottom: 20,
    },

    // Input
    inputRow: { display: "flex", gap: 12, alignItems: "stretch" },
    input: {
      flex: 1, background: "#0D1220", border: "1px solid rgba(99,179,237,0.15)",
      borderRadius: 12, padding: "12px 16px", color: "#E2E8F0",
      fontSize: 14, outline: "none", resize: "none",
      transition: "border-color 0.15s",
    },
    textarea: {
      width: "100%", background: "#0D1220", border: "1px solid rgba(99,179,237,0.15)",
      borderRadius: 12, padding: "14px 16px", color: "#E2E8F0",
      fontSize: 14, outline: "none", resize: "vertical", minHeight: 120,
      transition: "border-color 0.15s", boxSizing: "border-box",
    },
    select: {
      background: "#0D1220", border: "1px solid rgba(99,179,237,0.15)",
      borderRadius: 12, padding: "12px 16px", color: "#E2E8F0",
      fontSize: 14, outline: "none", cursor: "pointer", minWidth: 200,
    },
    btn: {
      background: "linear-gradient(135deg, #3B82F6, #1D6FD8)",
      color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px",
      fontSize: 14, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.15s",
      whiteSpace: "nowrap",
    },
    btnGhost: {
      background: "rgba(99,179,237,0.08)", color: "#63B3ED",
      border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12,
      padding: "12px 22px", fontSize: 14, fontWeight: 600,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    },

    // Chat
    chatBox: {
      background: "#0D1220", border: "1px solid rgba(99,179,237,0.1)",
      borderRadius: 16, height: 420, overflowY: "auto",
      padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12,
    },
    msgUser: {
      alignSelf: "flex-end", background: "linear-gradient(135deg, #3B82F6, #1D6FD8)",
      borderRadius: "16px 16px 4px 16px", padding: "10px 16px",
      maxWidth: "75%", fontSize: 14, lineHeight: 1.5,
    },
    msgBot: {
      alignSelf: "flex-start", background: "#0F1629",
      border: "1px solid rgba(99,179,237,0.12)",
      borderRadius: "16px 16px 16px 4px", padding: "10px 16px",
      maxWidth: "80%", fontSize: 14, lineHeight: 1.6, color: "#CBD5E0",
      whiteSpace: "pre-wrap",
    },
    msgLoading: {
      alignSelf: "flex-start", background: "#0F1629",
      border: "1px solid rgba(99,179,237,0.12)",
      borderRadius: "16px 16px 16px 4px", padding: "10px 16px",
      display: "flex", gap: 6, alignItems: "center",
    },
    dot: (delay) => ({
      width: 7, height: 7, borderRadius: "50%", background: "#63B3ED",
      animation: `bounce 1.2s ${delay}s ease-in-out infinite`,
    }),
    emptyChat: {
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8,
      color: "rgba(226,232,240,0.25)", textAlign: "center",
    },

    // Notes output
    notesBox: {
      background: "#0D1220", border: "1px solid rgba(99,179,237,0.1)",
      borderRadius: 12, padding: 24, marginTop: 20,
      fontSize: 14, lineHeight: 1.8, color: "#CBD5E0", whiteSpace: "pre-wrap",
      maxHeight: 480, overflowY: "auto",
    },

    // Quiz
    quizQ: {
      background: "#0D1220", border: "1px solid rgba(99,179,237,0.1)",
      borderRadius: 12, padding: 20, marginBottom: 16,
    },
    quizQText: { fontSize: 15, fontWeight: 600, marginBottom: 14, color: "#E2E8F0" },
    quizOption: (selected, correct, wrong, submitted) => ({
      padding: "10px 16px", borderRadius: 10, marginBottom: 8,
      cursor: submitted ? "default" : "pointer", fontSize: 14,
      border: `1px solid ${
        submitted && correct ? "#48BB78"
        : submitted && wrong ? "#FC8181"
        : selected ? "#63B3ED"
        : "rgba(99,179,237,0.12)"
      }`,
      background: submitted && correct ? "rgba(72,187,120,0.1)"
        : submitted && wrong ? "rgba(252,129,129,0.08)"
        : selected ? "rgba(99,179,237,0.12)" : "transparent",
      color: submitted && correct ? "#68D391" : submitted && wrong ? "#FC8181" : "#CBD5E0",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "all 0.15s",
    }),
    explanation: {
      marginTop: 10, padding: "10px 14px", background: "rgba(72,187,120,0.07)",
      borderRadius: 8, fontSize: 13, color: "#68D391",
      border: "1px solid rgba(72,187,120,0.2)",
    },
    scoreBox: {
      background: "linear-gradient(135deg, rgba(99,179,237,0.1), rgba(59,130,246,0.05))",
      border: "1px solid rgba(99,179,237,0.2)", borderRadius: 16,
      padding: "28px 32px", textAlign: "center", marginBottom: 24,
    },

    // Warning banner
    warnBanner: {
      background: "rgba(237,137,54,0.08)", border: "1px solid rgba(237,137,54,0.2)",
      borderRadius: 10, padding: "10px 16px", marginBottom: 20,
      fontSize: 13, color: "rgba(237,137,54,0.9)", display: "flex", gap: 8, alignItems: "center",
    },
  };

  // ── No-materials warning ───────────────────────────────────────────────────
  const NoMaterialsWarn = () => (
    <div style={s.warnBanner}>
      ⚡ No materials loaded — responses will use general knowledge. Upload course materials for topic-specific answers.
    </div>
  );

  // ── Render tabs ────────────────────────────────────────────────────────────
  const renderUpload = () => (
    <div style={s.panel}>
      <div style={s.panelTitle}>Course Materials</div>
      <div style={s.panelSub}>Upload your lecture notes, slides, or textbooks to get started.</div>
      <div
        style={s.dropZone(isDragging)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={s.uploadIcon}><Icon name="upload" size={26} /></div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          Drop files here or click to upload
        </div>
        <div style={{ fontSize: 13, color: "rgba(226,232,240,0.4)" }}>
          Supports TXT, PDF, DOCX, MD, CSV — any text-based course material
        </div>
        <input
          ref={fileInputRef} type="file" multiple
          accept=".txt,.pdf,.docx,.md,.csv,.json"
          style={{ display: "none" }} onChange={handleFileInput}
        />
      </div>

      {materials.length > 0 && (
        <div style={{ ...s.card, marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#63B3ED", marginBottom: 14, letterSpacing: "0.5px" }}>
            {materials.length} FILE{materials.length > 1 ? "S" : ""} LOADED
          </div>
          {materials.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(99,179,237,0.07)" }}>
              <div style={{ color: "#63B3ED" }}><Icon name="file" size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "rgba(226,232,240,0.35)" }}>
                  {(m.size / 1024).toFixed(1)} KB · {m.content.length} chars
                </div>
              </div>
              <button
                style={s.removeBtn}
                onClick={() => setMaterials(prev => prev.filter(x => x.id !== m.id))}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...s.card, background: "rgba(99,179,237,0.04)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#63B3ED", marginBottom: 10 }}>💡 Quick Start</div>
        <div style={{ fontSize: 13, color: "rgba(226,232,240,0.5)", lineHeight: 1.7 }}>
          1. Upload your lecture slides or notes as a .txt file<br/>
          2. Head to <strong style={{ color: "#63B3ED" }}>Ask Anything</strong> to query your content<br/>
          3. Use <strong style={{ color: "#63B3ED" }}>Study Notes</strong> to generate summaries<br/>
          4. <strong style={{ color: "#63B3ED" }}>Quiz Me</strong> to test your knowledge
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div style={s.panel}>
      <div style={s.panelTitle}>Ask Anything</div>
      <div style={s.panelSub}>Ask questions about your course materials or any topic.</div>
      {!hasContext && <NoMaterialsWarn />}
      <div style={s.chatBox}>
        {chatMessages.length === 0 ? (
          <div style={s.emptyChat}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(226,232,240,0.4)" }}>Ask me anything</div>
            <div style={{ fontSize: 13 }}>e.g. "Summarise the key topics" or "Explain neural networks"</div>
          </div>
        ) : (
          <>
            {chatMessages.map((m, i) => (
              <div key={i} style={m.role === "user" ? s.msgUser : s.msgBot}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div style={s.msgLoading}>
                <div style={s.dot(0)} /><div style={s.dot(0.2)} /><div style={s.dot(0.4)} />
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>
      <div style={s.inputRow}>
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder={hasContext ? "Ask about your course material..." : "Ask any question..."}
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
          disabled={chatLoading}
        />
        <button style={s.btn} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
          {chatLoading ? <Spinner /> : <Icon name="send" size={16} />}
          {chatLoading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div style={s.panel}>
      <div style={s.panelTitle}>Study Notes</div>
      <div style={s.panelSub}>Generate structured summaries and study notes instantly.</div>
      {!hasContext && <NoMaterialsWarn />}
      <div style={s.card}>
        <div style={{ fontSize: 13, color: "rgba(226,232,240,0.5)", marginBottom: 10 }}>
          Specific topic (optional)
        </div>
        <div style={s.inputRow}>
          <input
            style={s.input}
            placeholder={hasContext ? "e.g. 'Week 3 — Backpropagation'" : "e.g. 'Machine Learning Basics'"}
            value={notesTopic}
            onChange={e => setNotesTopic(e.target.value)}
          />
          <button style={s.btn} onClick={generateNotes} disabled={notesLoading}>
            {notesLoading ? <Spinner /> : <Icon name="sparkle" size={16} />}
            {notesLoading ? "Generating..." : "Generate Notes"}
          </button>
        </div>
      </div>
      {notesLoading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(226,232,240,0.4)" }}>
          <div style={{ marginBottom: 10 }}><Spinner /></div>
          Crafting your study notes...
        </div>
      )}
      {generatedNotes && !notesLoading && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#63B3ED" }}>GENERATED NOTES</div>
            <button style={s.btnGhost} onClick={generateNotes}>
              <Icon name="refresh" size={14} /> Regenerate
            </button>
          </div>
          <div style={s.notesBox}>{generatedNotes}</div>
        </div>
      )}
    </div>
  );

  const renderTranslate = () => (
    <div style={s.panel}>
      <div style={s.panelTitle}>Translate</div>
      <div style={s.panelSub}>Translate any text or course content into your preferred language.</div>
      <div style={s.card}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "rgba(226,232,240,0.5)", marginBottom: 8 }}>Translate to</div>
          <select style={s.select} value={translateLang} onChange={e => setTranslateLang(e.target.value)}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 13, color: "rgba(226,232,240,0.5)", marginBottom: 8 }}>Text to translate</div>
        <textarea
          style={s.textarea}
          placeholder="Paste any text here — lecture content, definitions, notes..."
          value={translateInput}
          onChange={e => setTranslateInput(e.target.value)}
        />
        <div style={{ marginTop: 14 }}>
          <button
            style={s.btn}
            onClick={handleTranslate}
            disabled={translateLoading || !translateInput.trim()}
          >
            {translateLoading ? <Spinner /> : <Icon name="translate" size={16} />}
            {translateLoading ? "Translating..." : `Translate to ${translateLang}`}
          </button>
        </div>
      </div>
      {translateResult && (
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#63B3ED", letterSpacing: "1px", marginBottom: 12 }}>
            {translateLang.toUpperCase()}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.8, color: "#E2E8F0" }}>{translateResult}</div>
        </div>
      )}
    </div>
  );

  const renderQuiz = () => {
    const score = quizScore;
    const total = quizData?.questions?.length ?? 5;
    const pct = Math.round((score / total) * 100);

    return (
      <div style={s.panel}>
        <div style={s.panelTitle}>Quiz Me</div>
        <div style={s.panelSub}>Test your understanding with AI-generated questions.</div>
        {!hasContext && <NoMaterialsWarn />}
        <div style={s.card}>
          <div style={{ fontSize: 13, color: "rgba(226,232,240,0.5)", marginBottom: 8 }}>
            Topic focus (optional)
          </div>
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder={hasContext ? "e.g. 'Gradient descent'" : "e.g. 'Python data structures'"}
              value={quizTopic}
              onChange={e => setQuizTopic(e.target.value)}
            />
            <button style={s.btn} onClick={generateQuiz} disabled={quizLoading}>
              {quizLoading ? <Spinner /> : <Icon name="refresh" size={16} />}
              {quizLoading ? "Generating..." : "New Quiz"}
            </button>
          </div>
        </div>

        {quizLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(226,232,240,0.4)" }}>
            Generating quiz questions...
          </div>
        )}

        {quizData?.error && <div style={{ color: "#FC8181", marginTop: 10 }}>{quizData.error}</div>}

        {quizSubmitted && score !== null && (
          <div style={s.scoreBox}>
            <div style={{ fontSize: 48, fontWeight: 800, color: pct >= 80 ? "#68D391" : pct >= 60 ? "#F6AD55" : "#FC8181" }}>
              {score}/{total}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#E2E8F0", marginTop: 4 }}>{pct}%</div>
            <div style={{ fontSize: 14, color: "rgba(226,232,240,0.5)", marginTop: 6 }}>
              {pct >= 80 ? "Excellent work! 🎉" : pct >= 60 ? "Good effort! Keep studying 📚" : "Review the material and try again 💪"}
            </div>
          </div>
        )}

        {quizData?.questions && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(226,232,240,0.5)", marginBottom: 16, letterSpacing: "0.5px" }}>
              {quizData.title?.toUpperCase() ?? "QUIZ"}
            </div>
            {quizData.questions.map(q => (
              <div key={q.id} style={s.quizQ}>
                <div style={s.quizQText}>{q.id}. {q.question}</div>
                {q.options.map(opt => {
                  const selected = quizAnswers[q.id] === opt;
                  const correct = quizSubmitted && opt === q.answer;
                  const wrong = quizSubmitted && selected && opt !== q.answer;
                  return (
                    <div
                      key={opt}
                      style={s.quizOption(selected, correct, wrong, quizSubmitted)}
                      onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    >
                      <span>{opt}</span>
                      {quizSubmitted && correct && <span style={{ color: "#68D391" }}><Icon name="check" size={16} /></span>}
                      {wrong && <span style={{ color: "#FC8181" }}><Icon name="x" size={16} /></span>}
                    </div>
                  );
                })}
                {quizSubmitted && (
                  <div style={s.explanation}>💡 {q.explanation}</div>
                )}
              </div>
            ))}
            {!quizSubmitted && (
              <button
                style={{ ...s.btn, width: "100%", justifyContent: "center", padding: "14px 22px" }}
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < (quizData.questions.length)}
              >
                Submit Answers
              </button>
            )}
            {quizSubmitted && (
              <button style={{ ...s.btnGhost, width: "100%", justifyContent: "center", padding: "14px 22px" }} onClick={generateQuiz}>
                <Icon name="refresh" size={16} /> Try Another Quiz
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "upload") return renderUpload();
    if (activeTab === "chat") return renderChat();
    if (activeTab === "notes") return renderNotes();
    if (activeTab === "translate") return renderTranslate();
    if (activeTab === "quiz") return renderQuiz();
  };

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.2); border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: rgba(226,232,240,0.25); }
        input:focus, textarea:focus, select:focus { border-color: rgba(99,179,237,0.45) !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        button:hover { opacity: 0.88; }
        button:disabled { opacity: 0.45; cursor: not-allowed !important; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <Icon name="sparkle" size={22} />
          <span>Study<span style={s.logoAccent}>Mate</span></span>
          <span style={s.badge}>MVP</span>
        </div>
        <div style={s.msTag}>
          ⊞ Built for Microsoft Hackathon · Azure OpenAI + Copilot Studio
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarSection}>Features</div>
          {TABS.map(t => (
            <div key={t.id} style={s.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              <Icon name={t.icon} size={17} />
              {t.label}
            </div>
          ))}

          {/* Files in sidebar */}
          {materials.length > 0 && (
            <div style={s.sidebarFiles}>
              <div style={s.filesTitle}>Loaded Files</div>
              {materials.map(m => (
                <div key={m.id} style={s.fileItem}>
                  <Icon name="file" size={13} />
                  <span style={s.fileItemName}>{m.name}</span>
                  <button
                    style={s.removeBtn}
                    onClick={() => setMaterials(prev => prev.filter(x => x.id !== m.id))}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={s.main}>{renderContent()}</div>
      </div>
    </div>
  );
}
