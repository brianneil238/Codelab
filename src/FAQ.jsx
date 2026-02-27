import React, { useState } from 'react';
import './FAQ.css';

const FAQ_ITEMS = [
  {
    id: 'get-started',
    question: 'How do I get started?',
    answer: 'Sign up with your email and password (or log in if you already have an account). From the dashboard, choose a course (HTML, C++, or Python), try the Code Editor, or take a Challenge. Your progress is saved automatically.',
  },
  {
    id: 'courses-work',
    question: 'How do courses work?',
    answer: 'Each course has 6 lectures. Watch the short tutorial video for each lecture, read the notes, and try the exercises. After each lecture, take the quiz to check your understanding. You need at least 70% to pass a quiz. Complete all lectures and quizzes to finish a course.',
  },
  {
    id: 'achievements',
    question: 'How do achievements work?',
    answer: 'You earn achievements by getting 100% on a quiz on your first try, completing coding challenges, finishing a full course (all 6 quizzes), and building study streaks (3 or 7 days in a row). Open the Achievements page from the dashboard to see how to earn each one and track what you\'ve unlocked.',
  },
  {
    id: 'challenges',
    question: 'What are coding challenges?',
    answer: 'Challenges are short programming tasks (e.g. "Print Hello, CodeLab!" or "Sum two numbers"). Pick a challenge, write code in Python or C++, and submit. If your output matches the expected result, you pass and earn an achievement. Use them to practice without following a full lecture.',
  },
  {
    id: 'progress-saved',
    question: 'Is my progress saved?',
    answer: 'Yes. Your progress (lectures completed, quiz scores, achievements, and streaks) is saved on our servers when you\'re logged in. You can switch devices and pick up where you left off.',
  },
  {
    id: 'forgot-password',
    question: 'How do I change or reset my password?',
    answer: 'On the login screen, click "Forgot password?" and enter your email. You\'ll get a link to set a new password. Passwords are case sensitive.',
  },
  {
    id: 'mobile',
    question: 'Can I use CodeLab on my phone or tablet?',
    answer: 'Yes. The site is responsive—you can browse courses, read content, and take quizzes on smaller screens. For coding challenges and the editor, a larger screen and keyboard are easier, but basic use works on mobile.',
  },
  {
    id: 'help',
    question: 'Who can I contact for help?',
    answer: 'For technical issues or questions about your account, contact your instructor or the school\'s IT support. CodeLab is designed for classroom use; your teacher can help with course content and access.',
  },
];

function FAQ({ onBack, darkMode = false, variant = 'page' }) {
  const [openId, setOpenId] = useState(null);
  const isModal = variant === 'modal';

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`faq-page ${isModal ? 'faq-page-modal' : ''} ${darkMode ? 'faq-page-dark' : ''}`}>
      <div className="faq-container">
        <button type="button" className="faq-back-btn" onClick={onBack}>
          {isModal ? '← Close' : '← Back to Dashboard'}
        </button>
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-intro">
          Quick answers about CodeLab—getting started, courses, achievements, and more.
        </p>

        <div className="faq-list">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-question-${item.id}`}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span className="faq-icon" aria-hidden>{isOpen ? '−' : '+'}</span>
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  className="faq-answer"
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  hidden={!isOpen}
                >
                  <p className="faq-answer-text">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
