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
        { id: 1, question: "What does HTML stand for?", options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"], correct: 0 },
        { id: 2, question: "Which tag is used to create a heading?", options: ["<head>", "<h1>", "<header>", "<title>"], correct: 1 },
        { id: 3, question: "What is the correct HTML structure?", options: ["<html><head><body></body></head></html>", "<html><body><head></head></body></html>", "<html><head></head><body></body></html>", "<head><html><body></body></html></head>"], correct: 2 },
        { id: 4, question: "Which tag defines the main content of the page?", options: ["<main>", "<content>", "<body>", "<section>"], correct: 2 },
        { id: 5, question: "What is the purpose of the <title> tag?", options: ["To style the page", "To set the browser tab title", "To link CSS", "To add images"], correct: 1 }
      ],
      2: [
        { id: 1, question: "Which tag contains metadata about the document?", options: ["<body>", "<head>", "<html>", "<meta>"], correct: 1 },
        { id: 2, question: "What does DOCTYPE declaration do?", options: ["Defines the document type", "Creates a new document", "Links to external files", "Sets the page title"], correct: 0 },
        { id: 3, question: "Where does the <meta> tag typically go?", options: ["Inside <body>", "Inside <head>", "After </html>", "Inside <footer>"], correct: 1 },
        { id: 4, question: "What does <link> in the head usually do?", options: ["Link to another page", "Load CSS or favicon", "Create a button", "Insert an image"], correct: 1 },
        { id: 5, question: "Which is required in a valid HTML5 document?", options: ["<head> and <body>", "Only <html>", "DOCTYPE and <html>", "<meta charset> only"], correct: 2 }
      ],
      3: [
        { id: 1, question: "Which tag creates a paragraph?", options: ["<p>", "<para>", "<paragraph>", "<text>"], correct: 0 },
        { id: 2, question: "What is the purpose of HTML elements?", options: ["To style the page", "To structure the content", "To add interactivity", "To create animations"], correct: 1 },
        { id: 3, question: "Which tag creates a line break?", options: ["<br>", "<lb>", "<break>", "<newline>"], correct: 0 },
        { id: 4, question: "What does the <strong> tag do?", options: ["Underline text", "Make text bold/important", "Italicize text", "Change font size"], correct: 1 },
        { id: 5, question: "Which tag is used for an unordered list?", options: ["<ol>", "<ul>", "<list>", "<li>"], correct: 1 }
      ],
      4: [
        { id: 1, question: "What do HTML attributes provide?", options: ["Extra styling only", "Additional information about an element", "Scripts", "Links only"], correct: 1 },
        { id: 2, question: "Which attribute specifies an image source?", options: ["src", "href", "link", "source"], correct: 0 },
        { id: 3, question: "What does the 'alt' attribute do on an image?", options: ["Set image size", "Provide alternative text", "Link to another page", "Add a border"], correct: 1 },
        { id: 4, question: "Which attribute makes an input required?", options: ["must", "required", "mandatory", "necessary"], correct: 1 },
        { id: 5, question: "What does the 'class' attribute do?", options: ["Names the element", "Groups elements for styling/scripting", "Links to CSS file", "Creates a new element"], correct: 1 }
      ],
      5: [
        { id: 1, question: "Which tag is used for an unordered (bulleted) list?", options: ["<ol>", "<ul>", "<list>", "<li>"], correct: 1 },
        { id: 2, question: "Which tag is used for an ordered (numbered) list?", options: ["<ul>", "<ol>", "<list>", "<num>"], correct: 1 },
        { id: 3, question: "Which tag wraps each item in a list?", options: ["<item>", "<li>", "<list>", "<ul>"], correct: 1 },
        { id: 4, question: "Where do <li> elements go?", options: ["Inside <ul> or <ol>", "Inside <table>", "Inside <form>", "Standalone only"], correct: 0 },
        { id: 5, question: "What is the difference between <ul> and <ol>?", options: ["<ul> is longer", "<ol> shows numbers, <ul> shows bullets", "Only <ol> uses <li>", "They are the same"], correct: 1 }
      ],
      6: [
        { id: 1, question: "Which tag creates a form?", options: ["<input>", "<form>", "<fieldset>", "<submit>"], correct: 1 },
        { id: 2, question: "What does the 'action' attribute on a form specify?", options: ["Button label", "Where to send form data", "Form title", "Validation rules"], correct: 1 },
        { id: 3, question: "Which input type is used for passwords?", options: ["text", "password", "secret", "hidden"], correct: 1 },
        { id: 4, question: "Which tag creates a dropdown select?", options: ["<dropdown>", "<select>", "<option>", "<list>"], correct: 1 },
        { id: 5, question: "What does method='get' do?", options: ["Hides the URL", "Sends data in the URL", "Encrypts data", "Sends only on button click"], correct: 1 }
      ]
    },
    "C++": {
      1: [
        { id: 1, question: "What is the main function in C++?", options: ["The function that runs first", "A function that prints text", "A function that takes input", "A function that returns void"], correct: 0 },
        { id: 2, question: "Which header is needed for input/output?", options: ["<iostream>", "<stdio.h>", "<input.h>", "<output.h>"], correct: 0 },
        { id: 3, question: "What does 'cout' do?", options: ["Takes input from user", "Outputs text to console", "Creates a new variable", "Ends the program"], correct: 1 },
        { id: 4, question: "What does 'cin' do?", options: ["Prints to screen", "Takes input from user", "Creates a file", "Compiles the code"], correct: 1 },
        { id: 5, question: "Which symbol is used for the stream insertion operator?", options: [">>", "<<", "::", "->"], correct: 1 }
      ],
      2: [
        { id: 1, question: "How do you declare an integer variable in C++?", options: ["int x;", "integer x;", "var x;", "x int;"], correct: 0 },
        { id: 2, question: "Which type holds decimal numbers?", options: ["int", "float or double", "char", "bool"], correct: 1 },
        { id: 3, question: "What is the size of a 'char' typically?", options: ["4 bytes", "2 bytes", "1 byte", "8 bytes"], correct: 2 },
        { id: 4, question: "Which keyword declares a constant?", options: ["fixed", "constant", "const", "final"], correct: 2 },
        { id: 5, question: "What does 'bool' store?", options: ["Numbers only", "true/false values", "Text", "Decimals"], correct: 1 }
      ],
      3: [
        { id: 1, question: "Which operator gets input in C++?", options: ["<<", ">>", "::", "->"], correct: 1 },
        { id: 2, question: "What is 'std::cin'?", options: ["Output stream", "Standard input stream", "A variable", "A function"], correct: 1 },
        { id: 3, question: "How do you read a single word with cin?", options: ["cin.get()", "cin >> variable;", "cin.read()", "getline(cin)"], correct: 1 },
        { id: 4, question: "What does getline(cin, str) do?", options: ["Reads one character", "Reads a full line into str", "Prints a line", "Skips a line"], correct: 1 },
        { id: 5, question: "Which header is needed for getline with strings?", options: ["<iostream> only", "<string>", "<input>", "<stream>"], correct: 1 }
      ],
      4: [
        { id: 1, question: "Which structure repeats code while a condition is true?", options: ["if", "while", "for", "switch"], correct: 1 },
        { id: 2, question: "What does 'if (x == 5)' check?", options: ["If x is assigned 5", "If x equals 5", "If x is greater than 5", "If x exists"], correct: 1 },
        { id: 3, question: "What does 'break' do in a switch?", options: ["Stops the program", "Exits the switch block", "Skips one case", "Restarts the loop"], correct: 1 },
        { id: 4, question: "Which loop runs at least once?", options: ["while", "for", "do-while", "if"], correct: 2 },
        { id: 5, question: "What is the correct syntax for a for loop?", options: ["for (i = 0; i < 10)", "for (int i = 0; i < 10; i++)", "for i in 10", "loop (i < 10)"], correct: 1 }
      ],
      5: [
        { id: 1, question: "How do you define a function in C++?", options: ["function name() {}", "def name() {}", "returnType name(params) {}", "func name() {}"], correct: 2 },
        { id: 2, question: "What does 'void' as return type mean?", options: ["Returns 0", "Returns nothing", "Returns null", "Infinite return"], correct: 1 },
        { id: 3, question: "How do you pass by reference?", options: ["ref int x", "int &x", "reference x", "pass x"], correct: 1 },
        { id: 4, question: "What is a function prototype?", options: ["The function body", "A declaration before definition", "A copy of the function", "The return value"], correct: 1 },
        { id: 5, question: "Which keyword is used to return a value?", options: ["send", "return", "give", "output"], correct: 1 }
      ],
      6: [
        { id: 1, question: "How do you declare an array of 10 integers?", options: ["int arr[10];", "array[10] int;", "int[] arr(10);", "arr = int[10]"], correct: 0 },
        { id: 2, question: "What is the first index of a C++ array?", options: ["1", "0", "-1", "depends"], correct: 1 },
        { id: 3, question: "Which header is needed for std::string?", options: ["<iostream>", "<string>", "<str>", "<text>"], correct: 1 },
        { id: 4, question: "How do you get the length of a string 's'?", options: ["s.length", "s.length()", "len(s)", "size(s)"], correct: 1 },
        { id: 5, question: "What does string concatenation use in C++?", options: [".", "+", "&", "concat"], correct: 1 }
      ]
    },
    Python: {
      1: [
        { id: 1, question: "What does the print() function do?", options: ["Takes input from user", "Outputs text to console", "Creates a variable", "Imports a module"], correct: 1 },
        { id: 2, question: "Which is correct Python syntax?", options: ["print 'Hello'", "print('Hello')", "print(Hello)", "print{Hello}"], correct: 1 },
        { id: 3, question: "What is Python known for?", options: ["Speed of execution", "Simplicity and readability", "Memory efficiency", "Low-level programming"], correct: 1 },
        { id: 4, question: "How do you run a Python script from the command line?", options: ["run script.py", "python script.py", "execute script.py", "py run script.py"], correct: 1 },
        { id: 5, question: "What is the Python interpreter?", options: ["A text editor", "A program that runs Python code", "A type of variable", "A library"], correct: 1 }
      ],
      2: [
        { id: 1, question: "How do you assign a value to a variable in Python?", options: ["var x = 5", "x := 5", "x = 5", "let x = 5"], correct: 2 },
        { id: 2, question: "Which is a valid variable name?", options: ["2nd_value", "my-value", "my_value", "my value"], correct: 2 },
        { id: 3, question: "What type is x after x = 10?", options: ["float", "int", "string", "double"], correct: 1 },
        { id: 4, question: "Can you change a variable's type in Python?", options: ["No, never", "Yes, when you reassign", "Only with cast()", "Only for numbers"], correct: 1 },
        { id: 5, question: "What does 'None' represent?", options: ["Zero", "Empty string", "Absence of value", "False only"], correct: 2 }
      ],
      3: [
        { id: 1, question: "Which is a string in Python?", options: ["'hello' or \"hello\"", "{hello}", "[hello]", "(hello)"], correct: 0 },
        { id: 2, question: "What type is [1, 2, 3]?", options: ["tuple", "list", "array", "set"], correct: 1 },
        { id: 3, question: "What does type(x) do?", options: ["Converts x", "Returns the type of x", "Deletes x", "Checks if x exists"], correct: 1 },
        { id: 4, question: "Which is a float?", options: ["5", "5.0", "\"5\"", "five"], correct: 1 },
        { id: 5, question: "What is the result of 10 // 3?", options: ["3.33", "3", "1", "4"], correct: 1 }
      ],
      4: [
        { id: 1, question: "Which keyword starts an if statement?", options: ["if", "when", "check", "cond"], correct: 0 },
        { id: 2, question: "What keyword is used for 'else if' in Python?", options: ["elseif", "elif", "else if", "otherwise"], correct: 1 },
        { id: 3, question: "Which loop iterates over a sequence?", options: ["while", "for", "repeat", "loop"], correct: 1 },
        { id: 4, question: "What does 'range(5)' produce?", options: ["0,1,2,3,4", "1,2,3,4,5", "5 numbers", "0 to 5 inclusive"], correct: 0 },
        { id: 5, question: "What does 'break' do in a loop?", options: ["Skip one iteration", "Exit the loop", "Restart the loop", "Continue to next"], correct: 1 }
      ],
      5: [
        { id: 1, question: "How do you define a function in Python?", options: ["function name():", "def name():", "func name():", "define name():"], correct: 1 },
        { id: 2, question: "What keyword returns a value?", options: ["send", "return", "give", "output"], correct: 1 },
        { id: 3, question: "What are function parameters?", options: ["Return values", "Inputs to the function", "Global variables", "Comments"], correct: 1 },
        { id: 4, question: "What is a default argument?", options: ["A required parameter", "A value used if none is passed", "The first parameter", "A constant"], correct: 1 },
        { id: 5, question: "Can a function return multiple values?", options: ["No", "Yes, as a tuple", "Only two values", "Only with lists"], correct: 1 }
      ],
      6: [
        { id: 1, question: "How do you create a list?", options: ["list()", "[] or list()", "{}", "()"], correct: 1 },
        { id: 2, question: "How do you add an item to a list?", options: ["list.add(item)", "list.append(item)", "list.push(item)", "list.insert(item)"], correct: 1 },
        { id: 3, question: "What is a dictionary?", options: ["A list of keys", "Key-value pairs", "A set", "An array"], correct: 1 },
        { id: 4, question: "How do you access a value in dict d by key 'k'?", options: ["d(k)", "d.k", "d['k'] or d.get('k')", "d->k"], correct: 2 },
        { id: 5, question: "What does .pop() do on a list?", options: ["Adds an element", "Removes and returns the last element", "Removes the first", "Clears the list"], correct: 1 }
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
