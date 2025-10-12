import React, { useState } from 'react';
import './LecturePlayer.css';
import CodeEditor from './CodeEditor';
import Quiz from './Quiz';
import { useProgress } from './ProgressContext';

function LecturePlayer({ lecture, course, onBack }) {
  const [showEditor, setShowEditor] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { markLectureComplete, markQuizComplete, getLectureProgress } = useProgress();
  
  // Check if lecture is already completed
  const lectureProgress = getLectureProgress(course, lecture.id);
  const isLectureCompleted = lectureProgress.completed;
  const lectureContent = {
    HTML: {
      1: {
        title: "Introduction to HTML",
        content: `
          <h2>What is HTML?</h2>
          <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
          
          <h3>Key Points:</h3>
          <ul>
            <li>HTML describes the structure of web pages</li>
            <li>HTML elements are the building blocks of HTML pages</li>
            <li>HTML elements are represented by tags</li>
            <li>Browsers do not display HTML tags, but use them to render content</li>
          </ul>
          
          <h3>Example:</h3>
          <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;My First Web Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Hello World!&lt;/h1&gt;
    &lt;p&gt;This is my first HTML page.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
        `
      },
      2: {
        title: "HTML Document Structure",
        content: `
          <h2>HTML Document Structure</h2>
          <p>Every HTML document has a basic structure that includes several key elements.</p>
          
          <h3>Document Structure:</h3>
          <ul>
            <li><strong>&lt;!DOCTYPE html&gt;</strong> - Declares the document type</li>
            <li><strong>&lt;html&gt;</strong> - Root element of the page</li>
            <li><strong>&lt;head&gt;</strong> - Contains meta information</li>
            <li><strong>&lt;body&gt;</strong> - Contains the visible content</li>
          </ul>
          
          <h3>Head Section:</h3>
          <p>The &lt;head&gt; section contains metadata about the document:</p>
          <ul>
            <li>&lt;title&gt; - Sets the page title</li>
            <li>&lt;meta&gt; - Provides metadata</li>
            <li>&lt;link&gt; - Links to external resources</li>
            <li>&lt;style&gt; - Contains CSS styles</li>
          </ul>
        `
      },
      3: {
        title: "HTML Elements and Tags",
        content: `
          <h2>HTML Elements and Tags</h2>
          <p>HTML elements are defined by tags, which are keywords surrounded by angle brackets.</p>
          
          <h3>Tag Structure:</h3>
          <ul>
            <li><strong>Opening tag:</strong> &lt;tagname&gt;</li>
            <li><strong>Content:</strong> The actual content</li>
            <li><strong>Closing tag:</strong> &lt;/tagname&gt;</li>
          </ul>
          
          <h3>Common HTML Elements:</h3>
          <ul>
            <li><strong>&lt;h1&gt; to &lt;h6&gt;</strong> - Headings</li>
            <li><strong>&lt;p&gt;</strong> - Paragraphs</li>
            <li><strong>&lt;a&gt;</strong> - Links</li>
            <li><strong>&lt;img&gt;</strong> - Images</li>
            <li><strong>&lt;div&gt;</strong> - Division/Container</li>
            <li><strong>&lt;span&gt;</strong> - Inline container</li>
          </ul>
          
          <h3>Example:</h3>
          <pre><code>&lt;h1&gt;Main Heading&lt;/h1&gt;
&lt;p&gt;This is a paragraph with a &lt;a href="https://example.com"&gt;link&lt;/a&gt;.&lt;/p&gt;
&lt;img src="image.jpg" alt="Description"&gt;</code></pre>
        `
      }
    },
    "C++": {
      1: {
        title: "Introduction to C++",
        content: `
          <h2>What is C++?</h2>
          <p>C++ is a general-purpose programming language created by Bjarne Stroustrup.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Object-oriented programming</li>
            <li>High performance</li>
            <li>Memory management</li>
            <li>Cross-platform compatibility</li>
          </ul>
          
          <h3>Your First C++ Program:</h3>
          <pre><code>#include &lt;iostream&gt;
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}</code></pre>
          
          <h3>Explanation:</h3>
          <ul>
            <li><strong>#include &lt;iostream&gt;</strong> - Includes input/output library</li>
            <li><strong>using namespace std;</strong> - Uses standard namespace</li>
            <li><strong>int main()</strong> - Main function where program starts</li>
            <li><strong>cout</strong> - Output stream</li>
            <li><strong>return 0;</strong> - Indicates successful execution</li>
          </ul>
        `
      }
    },
    Python: {
      1: {
        title: "Introduction to Python",
        content: `
          <h2>What is Python?</h2>
          <p>Python is a high-level, interpreted programming language known for its simplicity and readability.</p>
          
          <h3>Why Python?</h3>
          <ul>
            <li>Easy to learn and read</li>
            <li>Versatile - web development, data science, AI</li>
            <li>Large community and libraries</li>
            <li>Cross-platform</li>
          </ul>
          
          <h3>Your First Python Program:</h3>
          <pre><code>print("Hello, World!")</code></pre>
          
          <h3>Variables in Python:</h3>
          <pre><code>name = "Alice"
age = 25
height = 5.6
is_student = True

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Height: {height}")
print(f"Is Student: {is_student}")</code></pre>
          
          <h3>Key Points:</h3>
          <ul>
            <li>No need to declare variable types</li>
            <li>Python automatically determines the type</li>
            <li>Use f-strings for formatted output</li>
            <li>Indentation is important for code blocks</li>
          </ul>
        `
      }
    }
  };

  const content = lectureContent[course]?.[lecture.id] || {
    title: "Lecture Content",
    content: "<p>Lecture content will be available soon!</p>"
  };

  const getInitialCode = (courseName) => {
    switch (courseName) {
      case 'HTML':
        return `<!DOCTYPE html>
<html>
<head>
    <title>My First Web Page</title>
</head>
<body>
    <h1>Hello, CodeLab!</h1>
    <p>This is my first HTML page.</p>
    <p>Try editing this code!</p>
</body>
</html>`;
      case 'C++':
        return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeLab!" << endl;
    cout << "Welcome to C++ programming!" << endl;
    return 0;
}`;
      case 'Python':
        return `print("Hello, CodeLab!")
print("Welcome to Python programming!")
print("Try editing this code!")`;
      default:
        return '// Start coding here...';
    }
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    markLectureComplete(course, lecture.id);
    alert('Lecture marked as complete! 🎉');
  };

  const handleTakeQuiz = () => {
    setShowQuiz(true);
  };

  const handleDownloadNotes = () => {
    const notes = `
# ${content.title}
## ${course} Course - Lecture ${lecture.id}

${content.content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}

---
Generated from CodeLab Learning Platform
Date: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course}-Lecture-${lecture.id}-Notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Notes downloaded successfully! 📄');
  };

  const handleQuizComplete = (score, total) => {
    setShowQuiz(false);
    markQuizComplete(course, lecture.id, score, total);
    if (score >= total * 0.7) {
      alert(`Great job! You scored ${score}/${total} (${Math.round((score/total)*100)}%) 🎉`);
    } else {
      alert(`You scored ${score}/${total} (${Math.round((score/total)*100)}%). Keep studying! 📚`);
    }
  };

  const handleBackFromQuiz = () => {
    setShowQuiz(false);
  };

  // If quiz is showing, render quiz component
  if (showQuiz) {
    return (
      <Quiz 
        course={course}
        lecture={lecture}
        onBack={handleBackFromQuiz}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="lecture-player">
      <header className="lecture-header">
        <div className="lecture-header-content">
          <button className="back-btn" onClick={onBack}>
            ← Back to Course
          </button>
          <div className="lecture-info">
            <h1>{content.title}</h1>
            <p>{course} Course • Lecture {lecture.id} • {lecture.duration}</p>
          </div>
        </div>
      </header>

      <main className="lecture-main">
        <div className="lecture-container">
          <div className="lecture-content">
            <div 
              className="lecture-text"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
            
            {showEditor && (
              <CodeEditor 
                language={course}
                initialCode={getInitialCode(course)}
                onCodeChange={(code) => console.log('Code changed:', code)}
              />
            )}
          </div>
          
          <div className="lecture-actions">
            <button 
              className="lecture-btn primary"
              onClick={() => setShowEditor(!showEditor)}
            >
              {showEditor ? 'Hide Editor' : 'Try it yourself'}
            </button>
            <button 
              className={`lecture-btn ${isCompleted || isLectureCompleted ? 'completed' : 'secondary'}`}
              onClick={handleMarkComplete}
            >
              {isCompleted || isLectureCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>
            <button 
              className="lecture-btn secondary"
              onClick={handleTakeQuiz}
            >
              Take Quiz
            </button>
            <button 
              className="lecture-btn secondary"
              onClick={handleDownloadNotes}
            >
              Download Notes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LecturePlayer;
