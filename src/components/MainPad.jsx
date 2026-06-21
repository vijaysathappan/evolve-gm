import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Menu, Plus, Mic, Send, Image as ImageIcon, FileText, Link as LinkIcon, Sparkles, ChevronDown, AlignLeft, X, User, Settings, LogOut, Loader2, Globe, BookOpen, Paperclip, RotateCw, Award, CheckCircle, GraduationCap, Volume2, HelpCircle, FlaskConical, LayoutList, Info, Database, Flame } from 'lucide-react';
import './MainPad.css';
import GMLogo from './GMLogo';
import QuizMode   from './modes/QuizMode';
import ExamMode   from './modes/ExamMode';
import TopicsMode from './modes/TopicsMode';
import SolveMode  from './modes/SolveMode';
import { NODE_API_URL, LLM_API_URL, API_BASE_URL } from '../config/api';
import './modes/Modes.css';

const Typewriter = ({ text, speed = 8, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <div className="ai-response-text formatted-text relative">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {displayedText}
      </ReactMarkdown>
      {index < text.length && <span className="typing-cursor"></span>}
    </div>
  );
};

export default function MainPad({ user, selectedSessionId, onSelectChat, onLogout, userTrack }) {
  const [text, setText] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [thinkingMode, setThinkingMode] = useState('Fast');
  const [messages, setMessages] = useState([]);
  const [examReportData, setExamReportData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [preRecordingText, setPreRecordingText] = useState('');
  const [expandedMessages, setExpandedMessages] = useState({});
  const [selectedModel, setSelectedModel] = useState('Evolve 1 Low');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // null | 'quiz' | 'exam' | 'topics' | 'solve'
  const recognitionRef = useRef(null);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) {
      return {
        text: 'Happy Morning',
        emojiUrl: 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@latest/assets/1f305.webp',
        alt: '🌅'
      };
    }
    if (hr >= 12 && hr < 17) {
      return {
        text: 'Happy Noon',
        emojiUrl: 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@latest/assets/2600-fe0f.webp',
        alt: '☀️'
      };
    }
    if (hr >= 17 && hr < 22) {
      return {
        text: 'Happy Evening',
        emojiUrl: 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@latest/assets/1f307.webp',
        alt: '🌇'
      };
    }
    return {
      text: 'Happy Night',
      emojiUrl: 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@latest/assets/1f319.webp',
      alt: '🌙'
    };
  };

  const handleSuggestionClick = (type) => {
    let promptText = '';
    if (type === 'explain') {
      promptText = 'Explain the concept of [insert topic] in simple terms with examples.';
    } else if (type === 'solve') {
      promptText = 'Solve this problem step-by-step: [insert equation or problem].';
    } else if (type === 'quiz') {
      promptText = 'Create a 5-question multiple choice quiz on [insert subject or topic].';
    } else if (type === 'notes') {
      promptText = 'Summarize these notes and highlight the key equations/definitions: ';
    } else if (type === 'track') {
      promptText = `Provide a detailed study plan for the next chapter in my ${userTrack} syllabus.`;
    }
    setText(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const userName = user?.username || "Guest";
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const historyRef = useRef(null);

  const quotes = [
    { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
    { text: "Success is when your signature changes to an autograph.", author: "A.P.J. Abdul Kalam" },
    { text: "Dreams transform into thoughts and thoughts result in action.", author: "A.P.J. Abdul Kalam" },
    { text: "If I have the belief that I can do it, I shall surely acquire the capacity to do it.", author: "Mahatma Gandhi" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "Everything is easy when you are busy. But nothing is easy when you are lazy.", author: "Swami Vivekananda" },
    { text: "A dream is not that which you see while sleeping, it is something that does not let you sleep.", author: "A.P.J. Abdul Kalam" },
    { text: "Faith is the bird that feels the light when the dawn is still dark.", author: "Rabindranath Tagore" },
    { text: "Learning gives creativity, thinking provides knowledge, knowledge makes you great.", author: "A.P.J. Abdul Kalam" },
    { text: "Comfort is no test of truth. Truth is often far from being comfortable.", author: "Swami Vivekananda" }
  ];

  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    // Randomize quote on mount or when session changes
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  }, [selectedSessionId]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          sessionTranscript += (i > 0 ? ' ' : '') + transcript;

          if (!event.results[i].isFinal && i === event.results.length - 1) {
            sessionTranscript += '...';
          }
        }

        const fullText = preRecordingText
          ? preRecordingText.trim() + ' ' + sessionTranscript.trim()
          : sessionTranscript.trim();

        setText(fullText);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setText(prev => typeof prev === 'string' ? prev.split('...')[0].trim() : '');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, [preRecordingText]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setPreRecordingText(text);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const [usage, setUsage] = useState(0);
  const [animatedUsage, setAnimatedUsage] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);

  // Animation removed in favor of instant update
  useEffect(() => {
    setAnimatedUsage(usage);
  }, [usage]);

  const fetchTokenUsage = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/usage/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        const total = data.total_token || 0;
        setTokenCount(total);
        const pct = Math.min(100, Math.round((total / 40000) * 100));
        setUsage(pct);
      }
    } catch (err) {
      console.error('Failed to fetch token usage:', err);
    }
  }, [user?.id]);

  const getUsageColor = (val) => {
    if (val < 50) return '#10b981';
    if (val < 80) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    fetchTokenUsage();
  }, [selectedSessionId, fetchTokenUsage]);


  // Load chat history when session changes
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingHistory(true);
      try {
        const resp = await fetch(`${NODE_API_URL}/api/chat/history/${selectedSessionId}`);
        const data = await resp.json();
        console.log('[MainPad] Fetched history:', data);
        
        if (data.chat_type === 'exam' && data.history) {
          console.log('[MainPad] Setting Exam Report Data!');
          setExamReportData(data.history);
          setMessages([]);
        } else if (data.history && Array.isArray(data.history)) {
          // Map the JSONB array from the session row to UI messages
          const uiMessages = data.history.flatMap((m, index) => [
            { id: `${selectedSessionId}_q_${index}`, role: 'user', text: m.query },
            { id: `${selectedSessionId}_a_${index}`, role: 'ai', text: m.response }
          ]);
          setMessages(uiMessages);
          setExamReportData(null);
        } else {
          setMessages([]);
          setExamReportData(null);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
        setMessages([]);
        setExamReportData(null);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchMessages();
  }, [selectedSessionId]);

  const isChatting = messages.length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = window.innerHeight * 0.6;
      const newHeight = Math.max(48, Math.min(scrollHeight, maxHeight));
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [text]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTo({
        top: historyRef.current.scrollHeight,
        behavior: (messages.length > 0 && !isLoadingHistory) ? 'smooth' : 'auto'
      });
    }
  }, [messages, isLoadingHistory]);

  const handleSend = async (overrideText = null, overrideAttachments = null) => {
    const currentText = overrideText !== null ? overrideText : text;
    const currentAttachments = overrideAttachments !== null ? overrideAttachments : attachments;

    if (currentText.trim() === '' && currentAttachments.length === 0) return;

    let activeSessionId = selectedSessionId;
    if (!activeSessionId) {
      try {
        const resp = await fetch(`${NODE_API_URL}/api/chat/new`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        const data = await resp.json();
        if (data.chat) {
          activeSessionId = data.chat.id || data.chat.chat_id;
          if (onSelectChat) {
            onSelectChat(activeSessionId);
          }
        } else {
          alert("Failed to auto-create a new chat session.");
          return;
        }
      } catch (err) {
        console.error('Failed to auto-start new chat', err);
        alert("Connection to server failed. Could not auto-create chat session.");
        return;
      }
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: currentText,
      attachments: [...currentAttachments]
    };

    const tempAiMsgId = Date.now() + 1;
    const thinkingMsg = {
      id: tempAiMsgId,
      role: 'ai',
      text: '',
      isThinking: true
    };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setText('');
    setAttachments([]);

    try {
      const response = await fetch(`${LLM_API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentText,
          chat_data_id: activeSessionId,
          user_id: user.id,
          image_base64: currentAttachments.length > 0 ? currentAttachments[0].url : null
        }),
      });

      const data = await response.json();
      const aiAnswer = data.text || "I could not process that request.";

      setMessages(prev => prev.map(msg =>
        msg.id === tempAiMsgId
          ? { ...msg, text: aiAnswer, isThinking: false, isNew: true }
          : msg
      ));

      // Trigger sidebar to update (in case titles changed or first message saved)
      window.dispatchEvent(new CustomEvent('refreshChatList'));
      fetchTokenUsage();

    } catch (error) {
      console.error("Query failed", error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempAiMsgId ? { ...msg, text: "Connection to server failed. Please try again.", isThinking: false } : msg
      ));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newAttachments = files.map(file => {
      const isImage = file.type.startsWith('image/');
      return {
        name: file.name,
        type: isImage ? 'IMAGE' : 'FILE',
        url: isImage ? URL.createObjectURL(file) : null,
        file: file
      };
    });

    const combined = [...attachments, ...newAttachments];
    if (combined.length > 5) {
      alert('You can only upload up to 5 files.');
      setAttachments(combined.slice(0, 5));
    } else {
      setAttachments(combined);
    }

    setShowUploadMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <main className="gemini-main-pad flex-col items-center">
      <header className="main-header flex-row items-center justify-between w-full relative">
        <div className="header-left flex-row items-center gap-4">
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Centered Premium Upgrade Pill */}
        <div className="upgrade-badge-container">
          <div className="upgrade-badge">
            <span>{userTrack === 'JEE' ? 'JEE Mode' : 'NEET Mode'}</span>
            <span className="upgrade-bullet">•</span>
            <span className="upgrade-link-text" onClick={() => alert('Upgrade to Evolve Pro to get 5M monthly tokens and academic database access!')}>Upgrade</span>
          </div>
        </div>

        <div className="header-right flex-row items-center gap-8">
          <div
            className="intelligent-usage-pill flex-row items-center cursor-pointer"
            onClick={fetchTokenUsage}
            title={`Real-time token usage: ${tokenCount.toLocaleString()} / 40,000 tokens (Click to refresh)`}
          >
            <div className="pct-section flex-row items-center gap-2">
              <Flame size={14} style={{ color: animatedUsage <= 50 ? '#10b981' : animatedUsage <= 75 ? '#f59e0b' : '#ef4444' }} />
              <span className="usage-pct-small" style={{ color: animatedUsage <= 50 ? '#10b981' : animatedUsage <= 75 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                {Math.round(animatedUsage)}%
              </span>
              <div className="token-reload-btn flex-row items-center hide-mobile">
                <RotateCw size={12} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`center-content flex-col w-full flex-1 ${isChatting || examReportData ? 'chat-active' : 'justify-center'}`}>
        {!isChatting && !isLoadingHistory && !examReportData ? (
          <div className="greeting-area flex-col items-center">
            <div className="greeting-title-row flex-row items-center justify-center">
              <h1 className="greeting-text flex-row items-center gap-2">
                <span>{getGreeting().text}</span>
                <img 
                  src={getGreeting().emojiUrl} 
                  alt={getGreeting().alt} 
                  style={{ width: '42px', height: '42px', objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
                />
              </h1>
            </div>
            <p className="greeting-quote">"{currentQuote.text}" — {currentQuote.author}</p>
          </div>
        ) : (
          <div className="chat-history-container custom-scrollbar flex-col w-full" ref={historyRef}>
            {isLoadingHistory ? (
              <div className="history-skeleton-container flex-col w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-group flex-col gap-4 mb-8">
                    <div className="skeleton-bubble user shimmer"></div>
                    <div className="skeleton-bubble ai shimmer"></div>
                    <div className="skeleton-line shimmer" style={{ width: '60%' }}></div>
                  </div>
                ))}
                <div className="skeleton-status-text flex-col items-center justify-center">
                  <div className="gm-core-loader mb-4">
                    <GMLogo size={32} />
                    <div className="orbital-ring"></div>
                    <div className="orbital-dots">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="orbital-dot" style={{ '--i': i }}></div>
                      ))}
                    </div>
                  </div>
                  <span className="sequencing-text">Synchronizing GM Core...</span>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                msg.role === 'user' ? (
                  <div key={msg.id} className="chat-message user-message flex-row justify-end mb-6">
                    <div className="user-bubble flex-col gap-2">
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="user-attachments flex-row gap-2 flex-wrap">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="mini-attachment-card flex-row items-center gap-2">
                              <FileText size={14} /> <span className="truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="chat-message ai-message flex-row gap-4 mb-4">
                    <div className="message-content flex-col w-full">
                      {msg.isThinking ? (
                        <div className="thinking-animation-container flex-col items-center gap-2">
                          <div className="dna-loader">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="dna-strand" style={{ '--i': i }}>
                                <div className="dna-dot dot-1"></div>
                                <div className="dna-line"></div>
                                <div className="dna-dot dot-2"></div>
                              </div>
                            ))}
                          </div>
                          <span className="thinking-text">Sequencing Response...</span>
                        </div>
                      ) : (
                        <div className="ai-response-text-wrapper relative">
                          {msg.isNew ? (
                            <Typewriter
                              text={msg.text}
                              speed={10}
                              onComplete={() => {
                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
                              }}
                            />
                          ) : (
                            <>
                              <div className={`ai-response-text formatted-text ${(!expandedMessages[msg.id] && msg.text.length > 450) ? 'collapsed-text' : 'expanded-text'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                  {msg.text}
                                </ReactMarkdown>
                              </div>

                              {msg.text.length > 450 && (
                                <button
                                  className="expand-toggle-btn flex-row items-center gap-2"
                                  onClick={() => setExpandedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                                >
                                  <div className="dot-divider"></div>
                                  <span>{expandedMessages[msg.id] ? 'Show less' : 'Read full response'}</span>
                                  <ChevronDown size={14} className={expandedMessages[msg.id] ? 'rotated' : ''} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))
            )}
            {examReportData && !isLoadingHistory && (
              <div className="exam-report-container animate-fadeIn">
                <div className="exam-report-header flex-col items-center gap-2">
                  <Award size={48} className="report-trophy" />
                  <h2 className="report-title">Exam Report</h2>
                  <div className="report-score-box">
                    Score: <span>{examReportData.marks}</span> / {examReportData.total_questions}
                  </div>
                  <div className={`report-badge badge-${(examReportData.performance || 'Average').toLowerCase().replace(' ', '-')}`}>
                    {examReportData.performance || 'Average'}
                  </div>
                  {examReportData.prompt && (
                    <div className="report-prompt-box">
                      <strong>Instructions:</strong> {examReportData.prompt}
                    </div>
                  )}
                </div>

                <div className="report-questions-list flex-col gap-6 mt-8">
                  {Array.isArray(examReportData.questions) && examReportData.questions.map((q, i) => {
                    const userAns = examReportData.user_answers?.[i];
                    const isCorrect = userAns === q.ans;
                    const isUnanswered = userAns === undefined || userAns === null;

                    return (
                      <div key={i} className="report-q-card flex-col gap-3">
                        <div className="report-q-header flex-row items-center justify-between">
                          <span className="q-number">Question {i + 1}</span>
                          {isUnanswered ? (
                            <span className="q-status status-unanswered">Not Answered</span>
                          ) : isCorrect ? (
                            <span className="q-status status-correct"><CheckCircle size={14} /> Correct</span>
                          ) : (
                            <span className="q-status status-incorrect"><X size={14} /> Incorrect</span>
                          )}
                        </div>
                        <p className="report-q-text">{q.q}</p>
                        
                        <div className="report-options-grid flex-col gap-2 mt-2">
                          {Array.isArray(q.opts) && q.opts.map((opt, oIdx) => {
                            let optClass = "report-opt";
                            if (oIdx === q.ans) optClass += " correct-opt";
                            else if (oIdx === userAns && !isCorrect) optClass += " incorrect-opt";

                            return (
                              <div key={oIdx} className={optClass}>
                                <span className="opt-letter">{String.fromCharCode(65 + oIdx)}.</span>
                                <span>{opt}</span>
                                {oIdx === q.ans && <CheckCircle size={14} className="opt-icon-right" />}
                                {oIdx === userAns && !isCorrect && <X size={14} className="opt-icon-right" />}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="report-explanation-box flex-col mt-2">
                          <span className="exp-label flex-row items-center gap-1"><Info size={14} /> Explanation</span>
                          <p>{q.exp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input area is hidden when viewing an exam report */}
        {!examReportData && (
          <div className="chat-box-container flex-col gap-4">
            {attachments.length > 0 && (
            <div className="attachments-row flex-row w-full gap-3 pb-3">
              {attachments.map((att, i) => (
                att.type === 'FILE' || att.name.endsWith('.pdf') ? (
                  <div key={i} className="attachment-card flex-row items-center relative">
                    <div className="flex-col flex-1 truncate">
                      <span className="att-name truncate">{att.name}</span>
                      <div className="att-meta flex-row items-center gap-2 mt-1">
                        <div className="pdf-icon-box">FILE</div> <span className="att-type">Document</span>
                      </div>
                    </div>
                    <button className="remove-att-btn" onClick={() => removeAttachment(i)} title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div key={i} className="attachment-image shadow-sm relative" style={{ backgroundImage: `url(${att.url})` }}>
                    <button className="remove-att-btn img-ver" onClick={() => removeAttachment(i)} title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}
          
          <div className={`chat-input-wrapper flex-col ${(text.length > 0 || attachments.length > 0) ? 'active' : ''}`}>
            <textarea
              ref={textareaRef}
              className="chat-textarea custom-scrollbar w-full"
              placeholder={`Try: explain ${userTrack === 'JEE' ? 'quantum mechanics' : 'cell division'} · quiz me on ${userTrack === 'JEE' ? 'vectors' : 'genetics'} · solve organic chemistry`}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="input-footer flex-row items-center justify-between w-full mt-2">
              <div className="input-left-tools flex-row items-center gap-2">
                <button className="icon-btn-sm tool-btn" onClick={triggerFileInput} title="Upload docs/images">
                  <Plus size={18} />
                </button>
                <button className="icon-btn-sm tool-btn" title="Academic sources" onClick={() => alert('Searching academic publications database...')}>
                  <BookOpen size={16} />
                </button>
                
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              <div className="input-right-tools flex-row items-center gap-2">
                {/* Model Selector dropdown inside the input box */}
                <div className="model-dropdown-container">
                  <button 
                    className="model-select-pill flex-row items-center gap-1"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                  >
                    <span className={`model-pill-dot model-pill-dot--${selectedModel.split(' ').pop().toLowerCase()}`} />
                    <span>{selectedModel}</span>
                    <ChevronDown size={12} />
                  </button>
                  {showModelDropdown && (
                    <div className="model-options-menu animate-slideUp">
                      {[
                        { name: 'Evolve 1 Low',    tier: 'low',    desc: 'Fast · Efficient' },
                        { name: 'Evolve 1 Medium', tier: 'medium', desc: 'Balanced · Smart' },
                        { name: 'Evolve 1 High',   tier: 'high',   desc: 'Deep · Powerful' },
                      ].map(({ name, tier, desc }) => (
                        <button
                          key={name}
                          className={`model-option-btn ${selectedModel === name ? 'active' : ''}`}
                          data-tier={tier}
                          onClick={() => { setSelectedModel(name); setShowModelDropdown(false); }}
                        >
                          <span className="model-opt-name">{name}</span>
                          <span className="model-opt-desc">{desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`icon-btn-sm tool-btn voice-toggle-btn ${isRecording ? 'recording-active' : ''}`}
                  onClick={toggleRecording}
                  title="Voice Input"
                >
                  <Mic size={16} />
                </button>
                
                {isRecording && (
                  <div className="recording-wave-visualizer flex-row items-center gap-1" style={{ marginRight: '8px' }}>
                    <span></span><span></span><span></span>
                  </div>
                )}

                <button
                  className={`send-circle-btn ${(text.length > 0 || attachments.length > 0) ? 'active' : ''}`}
                  onClick={handleSend}
                  title="Send Message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Mode chips — 5 learning modes */}
          {!isChatting && !isLoadingHistory && (
            <div className="quick-suggestions-row flex-row justify-center items-center gap-3 animate-fadeIn">
              <button className="suggestion-pill flex-row items-center gap-1.5" onClick={() => handleSuggestionClick('explain')}>
                <GraduationCap size={14} className="sugg-icon" />
                <span>Explain</span>
              </button>
              <button className="suggestion-pill flex-row items-center gap-1.5" onClick={() => setActiveMode('quiz')}>
                <CheckCircle size={14} className="sugg-icon" />
                <span>Quiz Me</span>
              </button>
              <button className="suggestion-pill flex-row items-center gap-1.5" onClick={() => setActiveMode('exam')}>
                <Award size={14} className="sugg-icon" />
                <span>Exams</span>
              </button>
              <button className="suggestion-pill flex-row items-center gap-1.5" onClick={() => setActiveMode('topics')}>
                <BookOpen size={14} className="sugg-icon" />
                <span>Topics</span>
              </button>
              <button className="suggestion-pill flex-row items-center gap-1.5" onClick={() => setActiveMode('solve')}>
                <Sparkles size={14} className="sugg-icon" />
                <span>Solve</span>
              </button>
            </div>
          )}

          <p className="disclaimer-text mt-4">
            Evolve GM is an AI and may make mistakes. Using Evolve GM means you agree to the <span className="underline cursor-pointer">Terms of Use</span>. See our <span className="underline cursor-pointer">Privacy Statement</span>.
          </p>
        </div>
        )}
      </div>

      {activeModal && (
        <div className="center-modal-overlay">
          <div className="center-modal-content flex-col">
            <div className="modal-header flex-row items-center justify-between mb-4">
              <h2>
                {activeModal === 'profile' ? 'Profile Information' : 'Sign Out'}
              </h2>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={24} /></button>
            </div>
            <div className="modal-body flex-col gap-4">
              {activeModal === 'profile' && (
                <div className="profile-info-grid">
                  <div className="profile-info-row">
                    <span className="info-label"><User size={16} /> Name</span>
                    <span className="info-value">{user?.username}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="info-label"><Sparkles size={16} /> User ID</span>
                    <span className="info-value">{user?.userId}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="info-label"><Menu size={16} /> Email</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="info-label"><Settings size={16} /> Track</span>
                    <span className="info-value">{userTrack === 'JEE' ? 'JEE Mains/Adv.' : 'NEET (UG)'}</span>
                  </div>
                </div>
              )}
              {activeModal === 'signout' && (
                <div className="flex-col items-center justify-center gap-4 py-4 text-center">
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Are you sure you want to sign out of Evolve GM?</p>
                  <div className="flex-row gap-4 mt-4">
                    <button className="cancel-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                    <button className="danger-btn" onClick={() => { setActiveModal(null); onLogout(); }}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Learning Mode Overlays ── */}
      {activeMode && (
        <div className="mode-overlay-backdrop" onClick={() => setActiveMode(null)}>
          <div className="mode-overlay-panel" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="mode-panel-header">
              <div className="mode-panel-title-group">
                <div className={`mode-panel-icon ${activeMode}`}>
                  {activeMode === 'quiz'   && '⚡'}
                  {activeMode === 'exam'   && '🏆'}
                  {activeMode === 'topics' && '📚'}
                  {activeMode === 'solve'  && '🔬'}
                </div>
                <span className="mode-panel-name">
                  {activeMode === 'quiz'   && 'Quiz Me'}
                  {activeMode === 'exam'   && `${userTrack} Exam Mode`}
                  {activeMode === 'topics' && `${userTrack} Syllabus Topics`}
                  {activeMode === 'solve'  && 'Solve It'}
                </span>
              </div>
              <button className="mode-close-btn" onClick={() => setActiveMode(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Mode content */}
            {activeMode === 'quiz' && (
              <QuizMode userTrack={userTrack} />
            )}
            {activeMode === 'exam' && (
              <ExamMode userTrack={userTrack} user={user} />
            )}
            {activeMode === 'topics' && (
              <TopicsMode
                userTrack={userTrack}
                onTopicSelect={(prompt) => {
                  setText(prompt);
                  setActiveMode(null);
                  setTimeout(() => textareaRef.current?.focus(), 100);
                }}
              />
            )}
            {activeMode === 'solve' && (
              <SolveMode
                user={user}
                selectedSessionId={selectedSessionId}
                onSolve={(prompt, imageBase64) => {
                  const newAttachments = imageBase64 ? [{ url: imageBase64, type: 'image' }] : [];
                  setActiveMode(null);
                  handleSend(prompt, newAttachments);
                }}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
