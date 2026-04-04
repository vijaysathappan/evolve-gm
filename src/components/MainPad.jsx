import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Menu, Plus, Mic, Send, Image as ImageIcon, FileText, Link as LinkIcon, Sparkles, ChevronDown, AlignLeft, X, User, Settings, LogOut, Loader2 } from 'lucide-react';
import BookLogo from './BookLogo';
import './MainPad.css';

const NODE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const LLM_API_URL = import.meta.env.VITE_LLM_API_URL || 'http://127.0.0.1:8000';

export default function MainPad({ user, selectedSessionId, onLogout, userTrack }) {
  const [text, setText] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [thinkingMode, setThinkingMode] = useState('Fast');
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [preRecordingText, setPreRecordingText] = useState('');
  const recognitionRef = useRef(null);

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
            if (data.history) {
                // Map the JSONB array from the session row to UI messages
                const uiMessages = data.history.flatMap((m, index) => [
                    { id: `${selectedSessionId}_q_${index}`, role: 'user', text: m.query },
                    { id: `${selectedSessionId}_a_${index}`, role: 'ai', text: m.response }
                ]);
                setMessages(uiMessages);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to load chat history', err);
            setMessages([]);
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

  const handleSend = async () => {
    if (text.trim() === '' && attachments.length === 0) return;
    if (!selectedSessionId) {
        alert("No active chat session. Please start a new chat via the sidebar.");
        return;
    }

    const currentText = text;
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: currentText,
      attachments: [...attachments]
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
            chat_data_id: selectedSessionId,
            user_id: user.id
        }),
      });
      
      const data = await response.json();
      const aiAnswer = data.text || "I could not process that request.";

      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMsgId 
          ? { ...msg, text: aiAnswer, isThinking: false }
          : msg
      ));

      // Trigger sidebar to update (in case titles changed or first message saved)
      window.dispatchEvent(new CustomEvent('refreshChatList'));

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
          <button className="icon-btn mobile-menu-btn" onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}>
            <Menu size={24} />
          </button>
          <h2 className="header-title">Evolve GM</h2>
          <div className="learning-badge">
            <Sparkles size={12} />
            Learning Focus
          </div>
        </div>


        <div className="header-profile relative ml-auto">
          <div className="avatar cursor-pointer" onClick={() => setShowProfileModal(!showProfileModal)}>
            {user?.username?.substring(0, 2).toUpperCase() || 'JD'}
          </div>

          {showProfileModal && (
            <div className="profile-dropdown shadow-lg flex-col">
              <div className="profile-header">
                <strong>{user?.username}</strong>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>{user?.email}</span>
              </div>
              <hr className="profile-divider" />
              <button className="profile-item" onClick={() => { setActiveModal('profile'); setShowProfileModal(false); }}><User size={16} className="mr-2" /> Profile</button>
              <button className="profile-item" onClick={() => { setActiveModal('signout'); setShowProfileModal(false); }}><LogOut size={16} className="mr-2" /> Sign Out</button>
            </div>
          )}
        </div>
      </header>

      <div className={`center-content flex-col w-full flex-1 ${isChatting ? 'chat-active' : 'justify-center'}`}>
        {!isChatting && !isLoadingHistory ? (
          <div className="greeting-area">
            <h1 className="greeting-question">{currentQuote.text}</h1>
            <p className="quote-author">— {currentQuote.author}</p>
          </div>
        ) : (
          <div className="chat-history-container custom-scrollbar flex-col w-full" ref={historyRef}>
            {isLoadingHistory ? (
                <div className="flex-col items-center justify-center flex-1 h-full opacity-50">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <span>Loading your conversation...</span>
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
                      {msg.isThinking ? null : <BookLogo className="sparkle-icon shrink-0 mt-1" size="32px" />}
                      <div className="message-content flex-col">
                        {msg.isThinking ? (
                          <div className="thinking-animation-logo flex-row items-center gap-3">
                            <BookLogo size="32px" />
                            <span className="thinking-text">Thinking...</span>
                          </div>
                         ) : (
                          <div className="ai-response-text formatted-text">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {msg.text}
                              </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))
            )}
          </div>
        )}

        <div className="chat-box-container">
          {attachments.length > 0 && (
            <div className="attachments-row flex-row w-full gap-3 pb-3">
              {attachments.map((att, i) => (
                att.type === 'FILE' || att.name.endsWith('.pdf') ? (
                  <div key={i} className="attachment-card flex-col justify-center">
                    <span className="att-name truncate">{att.name}</span>
                    <div className="att-meta flex-row items-center gap-2 mt-1">
                      <div className="pdf-icon-box">FILE</div> <span className="att-type">Document</span>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="attachment-image shadow-sm" style={{ backgroundImage: `url(${att.url})` }}></div>
                )
              ))}
            </div>
          )}
          <div className={`chat-input-wrapper flex-row items-center gap-2 ${(text.length > 0 || attachments.length > 0) ? 'active' : ''}`}>
             <button
                className="icon-btn plus-btn"
                onClick={() => setShowUploadMenu(!showUploadMenu)}
              >
                <Plus size={20} className={showUploadMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
              </button>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              {showUploadMenu && (
                <div className="upload-popup flex-col shadow-lg">
                  <button className="upload-item" onClick={triggerFileInput}><FileText size={18} /> Upload docs</button>
                  <button className="upload-item" onClick={() => setShowUploadMenu(false)}><LinkIcon size={18} /> Paste links</button>
                </div>
              )}

            <textarea
              ref={textareaRef}
              className="chat-textarea custom-scrollbar flex-1"
              placeholder="Ask anything"
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

            <div className="input-right-actions flex-row items-center gap-2">
              <button
                className={`icon-btn mic-btn ${isRecording ? 'recording-active' : ''}`}
                onClick={toggleRecording}
              >
                <Mic size={18} />
              </button>

              <button
                className={`send-pill-btn ${(text.length > 0 || attachments.length > 0) ? 'active' : ''}`}
                onClick={handleSend}
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <p className="disclaimer-text mt-4">
            Evolve GM is an AI and may make mistakes. Using Evolve GM means you agree to the <span className="underline cursor-pointer">Terms of Use</span>. See our <span className="underline cursor-pointer">Privacy Statement</span>.
          </p>
        </div>
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
    </main>
  );
}
