import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, Flame, CheckCircle, ChevronRight, Play, RefreshCw, BarChart2 } from 'lucide-react';
import './PracticeDashboard.css';

export default function PracticeDashboard({ user, userTrack }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // JEE Questions
  const jeeQuestions = [
    {
      id: 1,
      subject: 'Physics',
      question: 'A particle moves in a circle of radius R with a constant speed v. What is the magnitude of its acceleration?',
      options: ['v²/R', 'v/R', 'v²R', 'Zero'],
      correct: 0,
      explanation: 'For uniform circular motion, the acceleration is centripetal and its magnitude is given by a = v²/R pointing towards the center.'
    },
    {
      id: 2,
      subject: 'Mathematics',
      question: 'Evaluate the limit: lim (x -> 0) [sin(x) / x]',
      options: ['0', '1', 'Undefined', 'Infinity'],
      correct: 1,
      explanation: 'By standard limit theorems or L\'Hospital\'s rule, lim (x -> 0) [sin(x)/x] = lim (x -> 0) [cos(x)/1] = 1.'
    },
    {
      id: 3,
      subject: 'Chemistry',
      question: 'Which of the following organic compounds will exhibit geometrical isomerism?',
      options: ['But-1-ene', 'But-2-ene', 'Propene', '2-Methylpropene'],
      correct: 1,
      explanation: 'But-2-ene (CH3-CH=CH-CH3) has different groups attached to each double-bonded carbon, allowing for cis and trans isomers.'
    }
  ];

  // NEET Questions
  const neetQuestions = [
    {
      id: 1,
      subject: 'Biology',
      question: 'Which organelle is known as the powerhouse of the cell, responsible for aerobic respiration?',
      options: ['Mitochondrion', 'Chloroplast', 'Lysosome', 'Ribosome'],
      correct: 0,
      explanation: 'Mitochondria are the sites of cellular aerobic respiration where ATP is generated, hence the name powerhouse of the cell.'
    },
    {
      id: 2,
      subject: 'Physics',
      question: 'A body of mass 2 kg is moving with velocity 5 m/s. What is its kinetic energy?',
      options: ['10 J', '25 J', '50 J', '5 J'],
      correct: 1,
      explanation: 'Kinetic Energy (KE) = 1/2 * m * v² = 1/2 * 2 * (5)² = 25 Joules.'
    },
    {
      id: 3,
      subject: 'Chemistry',
      question: 'Which of the following elements has the highest electronegativity according to Pauling\'s scale?',
      options: ['Oxygen', 'Nitrogen', 'Fluorine', 'Chlorine'],
      correct: 2,
      explanation: 'Fluorine (F) is the most electronegative element in the periodic table, with a value of 4.0 on Pauling\'s scale.'
    }
  ];

  const currentQuestions = userTrack === 'JEE' ? jeeQuestions : neetQuestions;

  // Timer logic for quizzes
  useEffect(() => {
    let timer;
    if (activeQuiz && !quizSubmitted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, quizSubmitted, timeRemaining]);

  const startQuiz = (quizName) => {
    setActiveQuiz(quizName);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setTimeRemaining(180); // 3 minutes
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    currentQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) {
        correctCount++;
      }
    });
    setQuizScore(correctCount);
    setQuizSubmitted(true);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (activeQuiz) {
    return (
      <div className="practice-dashboard-container animate-fadeIn">
        <header className="practice-quiz-header">
          <div className="flex-col">
            <span className="quiz-track-badge">{userTrack} Track Practice</span>
            <h2>{activeQuiz}</h2>
          </div>
          <div className="quiz-timer flex-row items-center gap-2">
            <Clock size={16} />
            <span>Time Left: <strong className={timeRemaining < 30 ? 'timer-warning' : ''}>{formatTime(timeRemaining)}</strong></span>
          </div>
        </header>

        <main className="quiz-main-content">
          <div className="questions-list flex-col gap-6">
            {currentQuestions.map((q, idx) => (
              <div key={q.id} className="question-card flex-col gap-4">
                <div className="question-text">
                  <span className="question-number">Question {idx + 1}</span>
                  <p>{q.question}</p>
                </div>
                <div className="options-grid flex-col gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = quizAnswers[q.id] === oIdx;
                    const isCorrect = q.correct === oIdx;
                    let optionClass = 'option-btn';
                    if (isSelected) optionClass += ' selected';
                    if (quizSubmitted) {
                      if (isCorrect) optionClass += ' correct';
                      else if (isSelected) optionClass += ' incorrect';
                    }

                    return (
                      <button
                        key={oIdx}
                        className={optionClass}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        disabled={quizSubmitted}
                      >
                        <span className="option-letter">{['A', 'B', 'C', 'D'][oIdx]}</span>
                        <span className="option-value">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className="explanation-box animate-slideUp">
                    <h4 className="flex-row items-center gap-2">
                      <CheckCircle size={16} color={quizAnswers[q.id] === q.correct ? '#10b981' : '#ef4444'} />
                      {quizAnswers[q.id] === q.correct ? 'Correct' : 'Incorrect'}
                    </h4>
                    <p className="mt-2 text-secondary">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="quiz-action-bar flex-row justify-between items-center mt-8">
            {!quizSubmitted ? (
              <button className="submit-quiz-btn primary" onClick={handleQuizSubmit}>
                Submit Answers
              </button>
            ) : (
              <div className="quiz-results-summary flex-row items-center gap-6">
                <div className="result-score-pill">
                  Score: <strong>{quizScore} / {currentQuestions.length}</strong>
                </div>
                <button className="retry-quiz-btn outline flex-row items-center gap-2" onClick={() => startQuiz(activeQuiz)}>
                  <RefreshCw size={16} />
                  Retry
                </button>
                <button className="finish-quiz-btn primary" onClick={() => setActiveQuiz(null)}>
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="practice-dashboard-container animate-fadeIn">
      <header className="practice-hero flex-row justify-between items-center">
        <div className="flex-col gap-2">
          <span className="hero-badge">{userTrack} Preparation Hub</span>
          <h1 className="hero-title">Practice & Mock Exams</h1>
          <p className="hero-desc">Evaluate your preparation with curated test questions and formula trainers.</p>
        </div>
        <div className="overall-stats-card flex-row gap-6">
          <div className="stat-item flex-col items-center">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value text-accent-green">78%</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item flex-col items-center">
            <span className="stat-label">Completed</span>
            <span className="stat-value text-accent-blue">14</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item flex-col items-center">
            <span className="stat-label">Daily Streak</span>
            <span className="stat-value text-accent-orange flex-row items-center gap-1">
              5 <Flame size={16} fill="currentColor" />
            </span>
          </div>
        </div>
      </header>

      <main className="practice-main-grid flex-col gap-8">
        {/* Practice Modes */}
        <section className="practice-section">
          <h3 className="section-header-title">Curated Mock Quizzes</h3>
          <div className="practice-cards-grid">
            <div className="practice-card premium-card">
              <div className="card-icon-wrapper math-bg">
                <Award size={20} />
              </div>
              <div className="card-info">
                <h4>{userTrack === 'JEE' ? 'JEE Advanced Quiz 1' : 'NEET Anatomy Trainer'}</h4>
                <p>3 questions covering standard curriculum. Time limit: 3 minutes.</p>
                <div className="card-meta">
                  <span>3 Questions</span>
                  <span>•</span>
                  <span>3 Mins</span>
                </div>
              </div>
              <button className="card-action-btn" onClick={() => startQuiz(userTrack === 'JEE' ? 'JEE Advanced Quiz 1' : 'NEET Anatomy Trainer')}>
                <Play size={16} />
              </button>
            </div>

            <div className="practice-card premium-card">
              <div className="card-icon-wrapper physics-bg">
                <BookOpen size={20} />
              </div>
              <div className="card-info">
                <h4>Formula Sprint Challenge</h4>
                <p>Speed round on critical formulas for Physics and Chemistry.</p>
                <div className="card-meta">
                  <span>5 Questions</span>
                  <span>•</span>
                  <span>5 Mins</span>
                </div>
              </div>
              <button className="card-action-btn" onClick={() => startQuiz('Formula Sprint Challenge')}>
                <Play size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* performance analytics mockup */}
        <section className="practice-section">
          <h3 className="section-header-title flex-row items-center gap-2">
            <BarChart2 size={18} />
            Performance by Topic
          </h3>
          <div className="performance-chart-card">
            <div className="topic-bar-row flex-row items-center justify-between">
              <span className="topic-name">Physics (Mechanics & Electrostatics)</span>
              <div className="bar-wrapper">
                <div className="bar-fill physics" style={{ width: '82%' }}></div>
              </div>
              <span className="bar-percentage">82%</span>
            </div>
            <div className="topic-bar-row flex-row items-center justify-between mt-4">
              <span className="topic-name">Chemistry (Organic & Physical)</span>
              <div className="bar-wrapper">
                <div className="bar-fill chemistry" style={{ width: '68%' }}></div>
              </div>
              <span className="bar-percentage">68%</span>
            </div>
            <div className="topic-bar-row flex-row items-center justify-between mt-4">
              <span className="topic-name">{userTrack === 'JEE' ? 'Mathematics (Calculus)' : 'Biology (Botany & Zoology)'}</span>
              <div className="bar-wrapper">
                <div className="bar-fill math" style={{ width: '74%' }}></div>
              </div>
              <span className="bar-percentage">74%</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
