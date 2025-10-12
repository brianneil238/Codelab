import React, { useState } from 'react';
import './Quiz.css';

function Quiz({ course, lecture, onBack, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const quizzes = {
    HTML: {
      1: [
        {
          id: 1,
          question: "What does HTML stand for?",
          options: [
            "HyperText Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlink and Text Markup Language"
          ],
          correct: 0
        },
        {
          id: 2,
          question: "Which tag is used to create a heading?",
          options: ["<head>", "<h1>", "<header>", "<title>"],
          correct: 1
        },
        {
          id: 3,
          question: "What is the correct HTML structure?",
          options: [
            "<html><head><body></body></head></html>",
            "<html><body><head></head></body></html>",
            "<html><head></head><body></body></html>",
            "<head><html><body></body></html></head>"
          ],
          correct: 2
        }
      ],
      2: [
        {
          id: 1,
          question: "Which tag contains metadata about the document?",
          options: ["<body>", "<head>", "<html>", "<meta>"],
          correct: 1
        },
        {
          id: 2,
          question: "What does DOCTYPE declaration do?",
          options: [
            "Defines the document type",
            "Creates a new document",
            "Links to external files",
            "Sets the page title"
          ],
          correct: 0
        }
      ],
      3: [
        {
          id: 1,
          question: "Which tag creates a paragraph?",
          options: ["<p>", "<para>", "<paragraph>", "<text>"],
          correct: 0
        },
        {
          id: 2,
          question: "What is the purpose of HTML elements?",
          options: [
            "To style the page",
            "To structure the content",
            "To add interactivity",
            "To create animations"
          ],
          correct: 1
        }
      ]
    },
    "C++": {
      1: [
        {
          id: 1,
          question: "What is the main function in C++?",
          options: [
            "The function that runs first",
            "A function that prints text",
            "A function that takes input",
            "A function that returns void"
          ],
          correct: 0
        },
        {
          id: 2,
          question: "Which header is needed for input/output?",
          options: ["<iostream>", "<stdio.h>", "<input.h>", "<output.h>"],
          correct: 0
        },
        {
          id: 3,
          question: "What does 'cout' do?",
          options: [
            "Takes input from user",
            "Outputs text to console",
            "Creates a new variable",
            "Ends the program"
          ],
          correct: 1
        }
      ]
    },
    Python: {
      1: [
        {
          id: 1,
          question: "What does the print() function do?",
          options: [
            "Takes input from user",
            "Outputs text to console",
            "Creates a variable",
            "Imports a module"
          ],
          correct: 1
        },
        {
          id: 2,
          question: "Which is correct Python syntax?",
          options: [
            "print 'Hello'",
            "print('Hello')",
            "print(Hello)",
            "print{Hello}"
          ],
          correct: 1
        },
        {
          id: 3,
          question: "What is Python known for?",
          options: [
            "Speed of execution",
            "Simplicity and readability",
            "Memory efficiency",
            "Low-level programming"
          ],
          correct: 1
        }
      ]
    }
  };

  const currentQuiz = quizzes[course]?.[lecture.id] || [];
  const currentQ = currentQuiz[currentQuestion];

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < currentQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    currentQuiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++;
      }
    });
    setScore(correct);
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete(score, currentQuiz.length);
    }
    onBack();
  };

  if (currentQuiz.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Back to Lecture</button>
          <h1>Quiz - {lecture.title}</h1>
        </div>
        <div className="quiz-content">
          <div className="no-quiz">
            <h2>No Quiz Available</h2>
            <p>This lecture doesn't have a quiz yet.</p>
            <button className="quiz-btn primary" onClick={onBack}>
              Back to Lecture
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / currentQuiz.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>Quiz Results</h1>
        </div>
        <div className="quiz-content">
          <div className="quiz-results">
            <div className={`score-circle ${passed ? 'passed' : 'failed'}`}>
              <span className="score-number">{score}</span>
              <span className="score-total">/{currentQuiz.length}</span>
            </div>
            <h2>{passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
            <p className="score-percentage">{percentage}%</p>
            <p className="score-message">
              {passed 
                ? 'You passed the quiz! Great job!' 
                : 'You need 70% to pass. Review the lecture and try again.'
              }
            </p>
            
            <div className="quiz-actions">
              <button className="quiz-btn secondary" onClick={handleRetake}>
                Retake Quiz
              </button>
              <button className="quiz-btn primary" onClick={handleFinish}>
                {passed ? 'Continue' : 'Back to Lecture'}
              </button>
            </div>
          </div>

          <div className="answers-review">
            <h3>Answer Review</h3>
            <div className="answers-grid">
              {currentQuiz.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correct;
                
                return (
                  <div key={question.id} className={`answer-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="card-header">
                      <div className="question-info">
                        <span className="question-number">Q{index + 1}</span>
                        <span className={`status-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <p className="question-text">{question.question}</p>
                      
                      <div className="answer-display">
                        <div className="correct-answer">
                          <div className="answer-label">Correct</div>
                          <div className="answer-value">
                            <span className="answer-letter">{String.fromCharCode(65 + question.correct)}</span>
                            <span className="answer-text">{question.options[question.correct]}</span>
                          </div>
                        </div>
                        
                        {!isCorrect && (
                          <div className="user-answer">
                            <div className="answer-label">Your Answer</div>
                            <div className="answer-value">
                              <span className="answer-letter wrong">{String.fromCharCode(65 + userAnswer)}</span>
                              <span className="answer-text">{question.options[userAnswer]}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Back to Lecture</button>
        <h1>Quiz - {lecture.title}</h1>
      </div>
      
      <div className="quiz-content">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / currentQuiz.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} of {currentQuiz.length}
          </span>
        </div>

        <div className="question-container">
          <h2 className="question-text">{currentQ.question}</h2>
          
          <div className="options-container">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${
                  selectedAnswers[currentQuestion] === index ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            className="quiz-btn secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          <button 
            className="quiz-btn primary"
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === undefined}
          >
            {currentQuestion === currentQuiz.length - 1 ? 'Finish Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
