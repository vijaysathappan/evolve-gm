import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Mic, Send, Image as ImageIcon, FileText, Link as LinkIcon, Sparkles, ChevronDown, AlignLeft, X, User, Settings, LogOut } from 'lucide-react';
import BookLogo from './BookLogo';
import './MainPad.css';

export default function MainPad({ user, onLogout }) {
  const [text, setText] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [thinkingMode, setThinkingMode] = useState('Fast');
  const [messages, setMessages] = useState([]);
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

          // Add ellipsis only for the very last interim result
          if (!event.results[i].isFinal && i === event.results.length - 1) {
            sessionTranscript += '...';
          }
        }

        // Sync with pre-existing text to avoid duplication
        const fullText = preRecordingText
          ? preRecordingText.trim() + ' ' + sessionTranscript.trim()
          : sessionTranscript.trim();

        setText(fullText);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // Clean up any trailing "..." when recording ends
        setText(prev => typeof prev === 'string' ? prev.split('...')[0].trim() : '');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setPreRecordingText(text); // Save current text before starting
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const isChatting = messages.length > 0;

  // Auto-resize textarea to max 40vh
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = window.innerHeight * 0.6; // Increased to 60% of viewport
      const newHeight = Math.max(48, Math.min(scrollHeight, maxHeight));
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [text]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTo({
        top: historyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (text.trim() === '' && attachments.length === 0) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: text,
      attachments: [...attachments]
    };

    const aiMsg = {
      id: Date.now() + 1,
      role: 'ai',
      text: "I am Evolve GM. I'm ready to assist you with your learning goals. Let me know what specific topic you'd like to explore next!"
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setText('');
    setAttachments([]); // Clear attachments after sending
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
        file: file // Store actual file if needed later
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
      {/* Top Header */}
      <header className="main-header flex-row items-center justify-between w-full relative">
        <div className="header-left flex-row items-center gap-4">
          <button className="icon-btn mobile-menu-btn" onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}>
            <Menu size={24} />
          </button>
          <h2 className="header-title">Evolve GM</h2>
        </div>

        {isChatting && (
          <h3 className="header-subtitle" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>
            Current Learning Session
          </h3>
        )}

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

        {!isChatting ? (
          <div className="greeting-area">
            <h1 className="greeting-name flex-row items-center gap-2">
              <BookLogo className="sparkle-icon mr-2" size="4rem" />
              <span className="name-gradient">Hi, {userName}</span>
            </h1>
            <h2 className="greeting-question">Where should we start?</h2>
          </div>
        ) : (
          <div className="chat-history-container custom-scrollbar flex-col w-full" ref={historyRef}>
            {messages.map((msg) => (
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
                  <BookLogo className="sparkle-icon shrink-0 mt-1" size="32px" />
                  <div className="message-content flex-col">
                    <p className="mb-4">{msg.text}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        <div className="chat-box-container">
          <div className={`chat-input-wrapper flex-col ${text.length > 0 || attachments.length > 0 ? 'active' : ''}`}>

            {/* Attachments rendering area inside the input box */}
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

            <textarea
              ref={textareaRef}
              className="chat-textarea custom-scrollbar w-full"
              placeholder="Ask Evolve GM"
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

            <div className="input-bottom-toolbar flex-row items-center justify-between w-full pt-2">
              <div className="input-toolbar-left relative flex-row items-center gap-3">
                <button
                  className="icon-btn plus-btn"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  title="Add attachment"
                >
                  <Plus size={22} className={showUploadMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>

                {/* Tools button removed per request */}

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
              </div>

              <div className="input-toolbar-right flex-row items-center gap-2">
                <div className="thinking-selector flex-row items-center cursor-pointer" onClick={() => setThinkingMode(thinkingMode === 'Fast' ? 'Deep' : 'Fast')}>
                  <span className="think-label">{thinkingMode}</span>
                  <ChevronDown size={14} />
                </div>

                <button
                  className={`icon-btn action-btn mic-btn ${isRecording ? 'recording-active' : ''}`}
                  title={isRecording ? 'Stop Recording' : 'Voice Input'}
                  onClick={toggleRecording}
                >
                  <Mic size={20} className={isRecording ? 'pulse-animation' : ''} />
                </button>

                <button
                  className={`icon-btn action-btn send-btn ${text.length > 0 || attachments.length > 0 ? 'active' : ''}`}
                  title="Send Request"
                  onClick={handleSend}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

          </div>

          <p className="disclaimer-text mt-4">
            Evolve GM is an AI and may make mistakes. Using Evolve GM means you agree to the <span className="underline cursor-pointer">Terms of Use</span>. See our <span className="underline cursor-pointer">Privacy Statement</span>.
          </p>
        </div>
      </div>

      {/* Full-screen Center Modals */}
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
                <div className="flex-col gap-3">
                  <p><strong>Name:</strong> {user?.username}</p>
                  <p><strong>User ID:</strong> {user?.userId}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> Student</p>
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
