import React, { useState, useRef } from 'react';
import { Paperclip, Image as ImageIcon, Link2, Mic, Send, FileText } from 'lucide-react';
import './InputPanel.css';

export default function InputPanel({ onSend }) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSend({ text: inputText, type: 'text' });
    setInputText('');
  };

  const handleActionClick = (action) => {
    if (action === 'image' || action === 'doc') {
      fileInputRef.current.click();
    } else if (action === 'voice') {
      setIsRecording(!isRecording);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSend({ text: `Uploaded: ${file.name}`, type: 'file', file });
    }
  };

  return (
    <div className="input-panel-wrapper glass-panel">
      <form onSubmit={handleSubmit} className="input-form flex-col">
        <div className="textarea-container flex-row">
          <textarea
            className="styled-textarea"
            placeholder="Type your NEET/JEE doubt, paste a link, or ask explaining concepts... (Shift+Enter for newline)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={2}
          ></textarea>
        </div>

        {/* Media & Actions Toolbar */}
        <div className="toolbar flex-row justify-between items-center">
          <div className="media-actions flex-row">
            <button type="button" className="action-btn" title="Upload Document" onClick={() => handleActionClick('doc')}>
              <FileText size={20} />
            </button>
            <button type="button" className="action-btn" title="Paste Image" onClick={() => handleActionClick('image')}>
              <ImageIcon size={20} />
            </button>
            <button type="button" className="action-btn" title="Add Link">
              <Link2 size={20} />
            </button>
            <div className="divider"></div>
            <button 
              type="button" 
              className={`action-btn voice-btn ${isRecording ? 'recording' : ''}`} 
              title="Voice Input"
              onClick={() => handleActionClick('voice')}
            >
              <Mic size={20} className={isRecording ? 'pulse-icon' : ''} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>

          <button 
            type="submit" 
            className={`send-button ${inputText.trim() ? 'active' : ''}`}
            disabled={!inputText.trim() && !isRecording}
          >
            <span className="send-text">Send</span>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
