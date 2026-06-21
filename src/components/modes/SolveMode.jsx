import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, ArrowLeft, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LLM_API_URL } from '../../config/api';

const METHODS = [
  { value: 'step-by-step', label: 'Step-by-Step Breakdown' },
  { value: 'visual',       label: 'Visual / Diagram Method' },
  { value: 'shortcut',     label: 'Exam Shortcut Method' },
  { value: 'conceptual',   label: 'Conceptual Deep-Dive' },
];

const TIPS = [
  { icon: '🎯', label: 'Clear Problem', desc: 'Describe the problem in full, including what is given and what is asked.' },
  { icon: '📸', label: 'Photo Upload', desc: 'Upload a photo of a handwritten or textbook problem for direct analysis.' },
  { icon: '⚡', label: 'Pick Method', desc: 'Choose how you want the solution explained — shortcut or conceptual.' },
];

export default function SolveMode({ user, selectedSessionId, onSolve }) {
  const [problem,  setProblem]  = useState('');
  const [method,   setMethod]   = useState('step-by-step');
  const [imgSrc,   setImgSrc]   = useState(null);
  const [imgFile,  setImgFile]  = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [followUpText, setFollowUpText] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const fileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgSrc(URL.createObjectURL(file));
  };

  const handleSolve = async () => {
    const methodLabel = METHODS.find(m => m.value === method)?.label || 'Step-by-Step';
    let prompt = '';
    if (imgSrc && problem.trim()) {
      prompt = `Solve this problem using the "${methodLabel}" approach:\n\n${problem.trim()}\n\n[Note: I have also uploaded an image of the problem/solution for reference.]`;
    } else if (imgSrc) {
      prompt = `I've uploaded an image of a problem. Please solve it using the "${methodLabel}" approach with full working steps. Identify all given values, write the relevant formulas, and show the complete solution clearly.`;
    } else {
      prompt = `Solve this problem using the "${methodLabel}" approach:\n\n${problem.trim()}`;
    }

    setIsSolving(true);
    setMessages([]);
    setTokensUsed(0);

    let base64Data = null;
    if (imgFile) {
      base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(imgFile);
      });
    }

    try {
      const response = await fetch(`${LLM_API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          chat_data_id: selectedSessionId,
          user_id: user?.id || user?.userId,
          image_base64: base64Data,
          chat_type: 'solve'
        })
      });
      const data = await response.json();
      
      setMessages([
        { role: 'user', text: problem.trim() || 'Uploaded an image' },
        { role: 'ai', text: data.text || "Could not generate solution." }
      ]);

      if (data.usage) {
        setTokensUsed(data.usage.total_token);
      }
      
      // Update global token usage if needed
      window.dispatchEvent(new CustomEvent('refreshChatList'));
    } catch (err) {
      console.error(err);
      setMessages([{ role: 'ai', text: "Error generating solution." }]);
    } finally {
      setIsSolving(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpText.trim()) return;
    const currentText = followUpText.trim();
    setFollowUpText('');
    
    setMessages(prev => [...prev, { role: 'user', text: currentText }]);
    setIsSolving(true);

    try {
      const response = await fetch(`${LLM_API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentText,
          chat_data_id: selectedSessionId,
          user_id: user?.id || user?.userId,
          chat_type: 'solve'
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text || "No response." }]);
      if (data.usage) {
        setTokensUsed(prev => prev + data.usage.total_token);
      }
      window.dispatchEvent(new CustomEvent('refreshChatList'));
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Error generating response." }]);
    } finally {
      setIsSolving(false);
    }
  };

  const canSolve = problem.trim().length > 0 || imgSrc;

  return (
    <div className="mode-body">
      <div className="solve-layout">
        {/* Hero */}
        <div className="solve-hero">
          <h2>Solve It</h2>
          <p>Paste a problem, upload a photo, and get an advanced step-by-step solution from Evolve AI</p>
        </div>

        {/* Solution View or Input View */}
        {(isSolving || messages.length > 0) ? (
          <div className="solve-result-area custom-scrollbar" style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
            <div className="flex-row items-center justify-between mb-4 sticky top-0" style={{ background: 'var(--bg-card)', paddingBottom: '10px', zIndex: 10 }}>
              <h3 style={{ margin: 0 }}>Solution Thread</h3>
              <button className="icon-btn-sm" onClick={() => { setMessages([]); setIsSolving(false); }} title="Back to edit">
                <ArrowLeft size={16} />
              </button>
            </div>
            
            <div className="flex-col gap-4 mb-4">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'flex-row justify-end' : 'flex-row justify-start'}>
                  <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '12px', background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-card-hover)' }}>
                    <div className="ai-response-text formatted-text" style={{ color: m.role === 'user' ? '#fff' : 'inherit' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSolving && (
              <div className="flex-col items-center justify-center gap-4 py-4">
                <Loader2 size={24} className="spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Thinking...</span>
              </div>
            )}
            
            {!isSolving && messages.length > 0 && (
              <div className="flex-col mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex-row items-center gap-2">
                  <input 
                    type="text" 
                    value={followUpText}
                    onChange={e => setFollowUpText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
                    placeholder="Ask a follow-up question..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  />
                  <button 
                    onClick={handleFollowUp}
                    disabled={!followUpText.trim()}
                    style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: followUpText.trim() ? 'pointer' : 'not-allowed', opacity: followUpText.trim() ? 1 : 0.5 }}
                  >
                    Send
                  </button>
                </div>
                {tokensUsed > 0 && (
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    Total session tokens: {tokensUsed}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Input area */}
            <div className="solve-input-area">
              <textarea
                className="solve-textarea custom-scrollbar"
                placeholder="Type or paste your problem here...&#10;&#10;e.g. A particle of mass 2 kg moves in a circle of radius 3 m at 4 m/s. Find the centripetal force."
                value={problem}
                onChange={e => setProblem(e.target.value)}
              />

              {/* Image preview */}
              {imgSrc && (
                <div style={{ padding: '0 16px 12px' }}>
                  <div className="solve-image-preview">
                    <img src={imgSrc} alt="Problem" className="solve-preview-img" />
                    <button
                      className="solve-remove-img"
                      onClick={() => { setImgSrc(null); setImgFile(null); }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              <div className="solve-input-toolbar">
                <button
                  className="solve-upload-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon size={14} />
                  {imgSrc ? 'Change Photo' : 'Upload Photo'}
                </button>
                <span className="solve-char-count">{problem.length} chars</span>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            {/* Tips */}
            <div className="solve-tips">
              {TIPS.map((tip, i) => (
                <div key={i} className="solve-tip-card">
                  <div className="solve-tip-icon">{tip.icon}</div>
                  <div className="solve-tip-label">{tip.label}</div>
                  <div className="solve-tip-desc">{tip.desc}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="solve-cta-row">
              <select
                className="solve-method-select"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                {METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <button
                className="solve-main-btn"
                onClick={handleSolve}
                disabled={!canSolve}
              >
                Solve with Evolve →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
