import React from 'react';
import { Plus, Globe, Settings, LayoutGrid, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LearnDashboard.css';

export default function LearnDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="dash-header">
        <div className="dash-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Globe className="text-muted" size={24} />
          <span>Evolve GM <span className="text-muted" style={{ fontWeight: 400 }}>Learn Mode</span></span>
        </div>
        <div className="dash-actions flex-row items-center gap-4">
          <button className="pill-btn outline">
             <Settings size={16} />
             <span>Settings</span>
          </button>
          <div className="user-avatar" title="NEET Aspirant Profile">JD</div>
        </div>
      </header>

      <main className="dash-main">
        {/* Notebooks navigation */}
        <div className="dash-tabs flex-row items-center justify-between">
          <div className="flex-row items-center gap-4">
             <button className="tab-pill active">All</button>
             <button className="tab-pill">My modules</button>
             <button className="tab-pill">Featured study guides</button>
          </div>
          
          <div className="flex-row items-center gap-3">
             <div className="flex-row items-center sort-toggle">
               <button className="sort-btn active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M5 7h14M5 17h14"/></svg></button>
               <button className="sort-btn"><LayoutGrid size={16}/></button>
             </div>
             
             <button className="create-nb-btn primary flex-row items-center" onClick={() => navigate('/learn/new')}>
               <Plus size={16} />
               <span>Create new</span>
             </button>
          </div>
        </div>

        {/* Featured Section */}
        <section className="nb-section">
          <h2 className="section-title">Featured NEET/JEE Guides</h2>
          <div className="nb-grid featured-grid">
            
            <div className="nb-card featured image-bg bg-1">
               <div className="overlay"></div>
               <div className="nb-card-content">
                  <div className="nb-category"><Globe size={14}/> Physics</div>
                  <h3>Rotational Mechanics completely explained</h3>
                  <div className="nb-meta">10 Mar 2026 • 15 sources</div>
               </div>
            </div>

            <div className="nb-card featured image-bg bg-2">
               <div className="overlay"></div>
               <div className="nb-card-content">
                  <div className="nb-category"><Globe size={14}/> Chemistry</div>
                  <h3>Organic Mechanisms & Isomerism</h3>
                  <div className="nb-meta">08 Mar 2026 • 24 sources</div>
               </div>
            </div>

            <div className="nb-card featured image-bg bg-3">
               <div className="overlay"></div>
               <div className="nb-card-content">
                  <div className="nb-category"><Globe size={14}/> Biology</div>
                  <h3>Human Anatomy Flashcards & Quizzes</h3>
                  <div className="nb-meta">01 Mar 2026 • 42 sources</div>
               </div>
            </div>

          </div>
        </section>

        {/* Recent Section */}
        <section className="nb-section">
          <h2 className="section-title">Recent Modules</h2>
          <div className="nb-grid recent-grid">
            
            <div className="nb-card create-card flex-col items-center justify-center cursor-pointer" onClick={() => navigate('/learn/new')}>
                <div className="create-icon-circle"><Plus size={24} color="var(--accent-blue)" /></div>
                <span style={{color: 'var(--text-secondary)'}}>Create new module</span>
            </div>

            <div className="nb-card regular cursor-pointer" onClick={() => navigate('/learn/xyz-123')}>
               <div className="nb-header-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
               <h3>Electrostatics Notes</h3>
               <div className="nb-meta mt-auto">8 Mar 2026 • 3 sources</div>
            </div>

            <div className="nb-card regular cursor-pointer" onClick={() => navigate('/learn/xyz-124')}>
               <div className="nb-header-icon"><FileText color="var(--accent-purple)" /></div>
               <h3>Kinematics Formulas</h3>
               <div className="nb-meta mt-auto">7 Mar 2026 • 1 source</div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
