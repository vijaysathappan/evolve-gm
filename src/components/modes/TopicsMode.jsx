import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';

/* ─── JEE Syllabus Tree ─── */
const JEE_TREE = [
  {
    name: 'Physics', icon: '⚛️', color: 'rgba(96,165,250,0.15)', textColor: '#60a5fa',
    chapters: [
      { name: 'Mechanics', topics: ['Newton\'s Laws of Motion', 'Work, Energy & Power', 'Rotational Motion', 'Gravitation', 'Simple Harmonic Motion', 'Waves & Sound'] },
      { name: 'Electromagnetism', topics: ['Electric Field & Potential', 'Capacitors & Dielectrics', 'Current Electricity', 'Magnetic Field & Force', 'Electromagnetic Induction', 'Alternating Current'] },
      { name: 'Optics', topics: ['Reflection & Mirrors', 'Refraction & Lenses', 'Total Internal Reflection', 'Wave Optics', 'Young\'s Double Slit', 'Optical Instruments'] },
      { name: 'Modern Physics', topics: ['Photoelectric Effect', 'Atomic Structure & Bohr Model', 'Nuclear Physics & Radioactivity', 'Semiconductors', 'Dual Nature of Radiation'] },
      { name: 'Thermodynamics', topics: ['Laws of Thermodynamics', 'Heat Engines & Efficiency', 'Kinetic Theory of Gases', 'Thermal Expansion'] },
    ],
  },
  {
    name: 'Chemistry', icon: '🧪', color: 'rgba(52,211,153,0.15)', textColor: '#34d399',
    chapters: [
      { name: 'Physical Chemistry', topics: ['Mole Concept & Stoichiometry', 'Thermodynamics', 'Chemical Equilibrium', 'Ionic Equilibrium', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'] },
      { name: 'Organic Chemistry', topics: ['IUPAC Nomenclature', 'Hydrocarbons', 'Alcohols, Phenols & Ethers', 'Carbonyl Compounds', 'Amines', 'Organic Reaction Mechanisms', 'Biomolecules & Polymers'] },
      { name: 'Inorganic Chemistry', topics: ['Periodic Table & Properties', 'Chemical Bonding', 's-Block Elements', 'p-Block Elements', 'd & f Block Elements', 'Coordination Compounds', 'Qualitative Analysis'] },
    ],
  },
  {
    name: 'Mathematics', icon: '📐', color: 'rgba(251,146,60,0.15)', textColor: '#fb923c',
    chapters: [
      { name: 'Algebra', topics: ['Quadratic Equations', 'Sequences & Series', 'Binomial Theorem', 'Matrices & Determinants', 'Permutation & Combination', 'Complex Numbers', 'Mathematical Induction'] },
      { name: 'Calculus', topics: ['Limits & Continuity', 'Differentiation', 'Applications of Derivatives', 'Integration Techniques', 'Definite Integrals & Area', 'Differential Equations'] },
      { name: 'Coordinate Geometry', topics: ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola', 'Three-Dimensional Geometry'] },
      { name: 'Trigonometry', topics: ['Trigonometric Ratios & Identities', 'Trigonometric Equations', 'Inverse Trigonometric Functions', 'Properties of Triangles'] },
      { name: 'Vectors & Statistics', topics: ['Vectors & Scalar Products', 'Vector Triple Products', 'Probability', 'Statistics & Data Interpretation'] },
    ],
  },
];

const NEET_TREE = [
  {
    name: 'Physics', icon: '⚛️', color: 'rgba(96,165,250,0.15)', textColor: '#60a5fa',
    chapters: [
      { name: 'Mechanics', topics: ['Laws of Motion', 'Work & Energy', 'Gravitation', 'Properties of Matter'] },
      { name: 'Electricity & Magnetism', topics: ['Electrostatics', 'Current Electricity', 'Magnetic Effects', 'Electromagnetic Induction'] },
      { name: 'Optics & Modern Physics', topics: ['Ray Optics', 'Wave Optics', 'Dual Nature of Matter', 'Atoms & Nuclei', 'Semiconductors'] },
      { name: 'Heat & Thermodynamics', topics: ['Thermal Properties', 'Thermodynamics Laws', 'Kinetic Theory', 'Oscillations & Waves'] },
    ],
  },
  {
    name: 'Chemistry', icon: '🧪', color: 'rgba(52,211,153,0.15)', textColor: '#34d399',
    chapters: [
      { name: 'Physical Chemistry', topics: ['States of Matter', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Chemical Kinetics'] },
      { name: 'Organic Chemistry', topics: ['Basic Principles', 'Hydrocarbons', 'Functional Groups', 'Biomolecules'] },
      { name: 'Inorganic Chemistry', topics: ['Periodic Properties', 'Chemical Bonding', 'Block Elements', 'Coordination Chemistry'] },
    ],
  },
  {
    name: 'Biology', icon: '🧬', color: 'rgba(167,139,250,0.15)', textColor: '#a78bfa',
    chapters: [
      { name: 'Cell Biology', topics: ['Cell Structure & Function', 'Biomolecules', 'Cell Division (Mitosis & Meiosis)', 'Cell Cycle & Cancer'] },
      { name: 'Plant Biology (Botany)', topics: ['Morphology of Flowering Plants', 'Anatomy of Plants', 'Transport in Plants', 'Photosynthesis', 'Plant Growth & Hormones', 'Reproduction in Plants'] },
      { name: 'Animal Biology (Zoology)', topics: ['Animal Kingdom Classification', 'Structural Organisation in Animals', 'Human Physiology', 'Animal Reproduction', 'Human Reproduction', 'Reproductive Health'] },
      { name: 'Genetics & Evolution', topics: ['Principles of Inheritance', 'Molecular Basis of Inheritance', 'Evolution & Natural Selection', 'Human Health & Disease'] },
      { name: 'Ecology & Environment', topics: ['Organisms & Populations', 'Ecosystems', 'Biodiversity & Conservation', 'Environmental Issues'] },
    ],
  },
];

export default function TopicsMode({ userTrack, onTopicSelect }) {
  const tree = userTrack === 'NEET' ? NEET_TREE : JEE_TREE;
  const [openSubject, setOpenSubject]   = useState(null);
  const [openChapter, setOpenChapter]   = useState(null);
  const [search, setSearch]             = useState('');

  const searchLower = search.toLowerCase();

  const filteredTree = search
    ? tree.map(subject => ({
        ...subject,
        chapters: subject.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.filter(t => t.toLowerCase().includes(searchLower)),
        })).filter(ch => ch.topics.length > 0 || ch.name.toLowerCase().includes(searchLower)),
      })).filter(s => s.chapters.length > 0 || s.name.toLowerCase().includes(searchLower))
    : tree;

  return (
    <div className="mode-body">
      {/* Search */}
      <div className="topics-search-bar">
        <Search size={15} className="topics-search-icon" />
        <input
          placeholder="Search topics, chapters..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tree */}
      <div className="topics-subject-list">
        {filteredTree.map((subject, si) => {
          const isSubjectOpen = openSubject === si || !!search;
          return (
            <div key={si} className="topics-subject-card">
              <div
                className="topics-subject-header"
                onClick={() => {
                  setOpenSubject(prev => prev === si ? null : si);
                  setOpenChapter(null);
                }}
              >
                <div
                  className="topics-subject-icon"
                  style={{ background: subject.color, color: subject.textColor }}
                >
                  {subject.icon}
                </div>
                <span className="topics-subject-name">{subject.name}</span>
                <span className="topics-subject-chevron">
                  {isSubjectOpen
                    ? <ChevronDown size={16} style={{ color: subject.textColor }} />
                    : <ChevronRight size={16} />
                  }
                </span>
              </div>

              <div className={`topics-chapters ${isSubjectOpen ? 'open' : ''}`}>
                {subject.chapters.map((ch, ci) => {
                  const chKey  = `${si}-${ci}`;
                  const isOpen = openChapter === chKey || !!search;
                  return (
                    <div key={ci} className="topics-chapter-item">
                      <div
                        className="topics-chapter-header"
                        onClick={() => setOpenChapter(prev => prev === chKey ? null : chKey)}
                      >
                        {ch.name}
                        <ChevronRight
                          size={13}
                          className={`topics-chapter-chevron ${isOpen ? 'open' : ''}`}
                        />
                      </div>
                      <div className={`topics-subtopics ${isOpen ? 'open' : ''}`}>
                        {ch.topics.map((topic, ti) => (
                          <button
                            key={ti}
                            className="topics-subtopic-btn"
                            onClick={() => onTopicSelect(`Explain "${topic}" for ${userTrack} in detail with examples and important formulas.`)}
                          >
                            <span className="topics-subtopic-dot" />
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
