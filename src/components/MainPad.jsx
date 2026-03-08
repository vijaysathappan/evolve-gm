import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Mic, Send, Image as ImageIcon, FileText, Link as LinkIcon, Sparkles, ChevronDown, AlignLeft } from 'lucide-react';
import './MainPad.css';

export default function MainPad() {
  const [text, setText] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [thinkingMode, setThinkingMode] = useState('Fast');
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const isChatting = messages.length > 0;

  // Auto-resize textarea to max 40vh
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const newHeight = Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.4);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [text]);

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
        <div className="flex-row items-center gap-4">
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
        <div className="header-profile relative">
          <div className="avatar cursor-pointer" onClick={() => setShowProfileModal(!showProfileModal)}>JD</div>
          
          {showProfileModal && (
            <div className="profile-dropdown shadow-lg flex-col">
               <div className="profile-header">
                 <strong>JD Student</strong>
                 <span className="text-muted" style={{display: 'block', fontSize: '0.8rem'}}>student@evolvegm.com</span>
               </div>
               <hr className="profile-divider" />
               <button className="profile-item">Manage Account</button>
               <button className="profile-item">Sign Out</button>
            </div>
          )}
        </div>
      </header>

      <div className={`center-content flex-col w-full flex-1 ${isChatting ? 'justify-end pb-8' : 'justify-center'}`}>
        
        {!isChatting ? (
          <div className="greeting-area">
            <h1 className="greeting-name flex-row items-center gap-2">
              <Sparkles className="sparkle-icon" size={32} />
              <span className="name-gradient">Hi Vijay</span>
            </h1>
            <h2 className="greeting-question">Where should we start?</h2>
          </div>
        ) : (
          <div className="chat-history-container custom-scrollbar flex-col w-full mb-8">
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
                  <Sparkles className="sparkle-icon shrink-0 mt-1" size={24} />
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
                  <Plus size={22} className={showUploadMenu ? 'rotate-45 transition-transform' : 'transition-transform'}/>
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
                    <button className="upload-item" onClick={triggerFileInput}><FileText size={18}/> Upload docs</button>
                    <button className="upload-item" onClick={() => setShowUploadMenu(false)}><LinkIcon size={18}/> Paste links</button>
                  </div>
                )}
              </div>

              <div className="input-toolbar-right flex-row items-center gap-2">
                <div className="thinking-selector flex-row items-center cursor-pointer" onClick={() => setThinkingMode(thinkingMode === 'Fast' ? 'Deep' : 'Fast')}>
                   <span className="think-label">{thinkingMode}</span>
                   <ChevronDown size={14} />
                </div>

                <button className="icon-btn action-btn mic-btn" title="Voice Input">
                   <Mic size={20} />
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
    </main>
  );
}
