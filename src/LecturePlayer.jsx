import React, { useState, useRef, useEffect } from 'react';
import './LecturePlayer.css';
import CodeEditor from './CodeEditor';
import Quiz from './Quiz';
import { useProgress } from './ProgressContext';

// Load YouTube IFrame API and create player that auto-pauses at end time (lecture clip).
function useLectureVideoPlayer(videoId, startSec, endSec) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;
      const el = document.getElementById('lecture-yt-player');
      if (!el) return;

      const player = new window.YT.Player('lecture-yt-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          start: Math.round(startSec),
          end: Math.round(endSec),
          autoplay: 0,
          rel: 0,
        },
        events: {
          onReady(event) {
            playerRef.current = event.target;
          },
          onStateChange(event) {
            if (event.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p || !p.getCurrentTime) return;
                const now = p.getCurrentTime();
                if (now >= endSec - 0.5) {
                  p.pauseVideo();
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                }
              }, 500);
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (window.YT && window.YT.Player) initPlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, startSec, endSec]);

  return containerRef;
}

function LecturePlayer({ lecture, course, onBack, darkMode = false }) {
  const [showEditor, setShowEditor] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { markLectureComplete, markQuizComplete, getLectureProgress, addCodeLinesWritten } = useProgress();
  
  // Check if lecture is already completed
  const lectureProgress = getLectureProgress(course, lecture.id);
  const isLectureCompleted = lectureProgress.completed;
  // Each lecture = one short video. Add video ID, then adjust title and content to match the video.
  // lectureVideos: paste YouTube video ID (from ?v=VIDEO_ID) for each lecture.
  // lectureContent: add { title: '...', content: '<p>...</p>' } per lecture to match what the video teaches.
  const lectureContent = {
    HTML: {
      1: { title: 'Intro to HTML', content: '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard for building web pages. Every page has a basic structure: <code>&lt;!DOCTYPE html&gt;</code>, <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code>, and <code>&lt;body&gt;</code>.</p><h3>Headings</h3><p>Use <code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code> for titles. Use one <code>&lt;h1&gt;</code> per page for the main title.</p><p><em>Adjust these notes to match what your short tutorial video teaches.</em></p>' },
      2: { title: 'Text formatting', content: '<h2>Formatting text</h2><p>Use tags to style text: <code>&lt;p&gt;</code> for paragraphs, <code>&lt;strong&gt;</code> or <code>&lt;b&gt;</code> for bold, <code>&lt;em&gt;</code> or <code>&lt;i&gt;</code> for italic. Use <code>&lt;br&gt;</code> for a line break and <code>&lt;hr&gt;</code> for a horizontal line.</p><p><em>Adjust these notes to match your video.</em></p>' },
      3: { title: 'Links and images', content: '<h2>Links and images</h2><p><strong>Links:</strong> <code>&lt;a href="url"&gt;text&lt;/a&gt;</code>. Use <code>target="_blank"</code> to open in a new tab.</p><p><strong>Images:</strong> <code>&lt;img src="file.jpg" alt="description"&gt;</code>. Always include <code>alt</code> for accessibility.</p><p><em>Adjust these notes to match your video.</em></p>' },
      4: { title: 'Attributes and structure', content: '<h2>Attributes</h2><p>Attributes give extra info to tags: <code>id</code> and <code>class</code> for styling/scripting, <code>href</code> on links, <code>src</code> and <code>alt</code> on images. Keep a clear document structure: DOCTYPE, html, head, body.</p><p><em>Adjust these notes to match your video.</em></p>' },
      5: { title: 'Lists', content: '<h2>Lists</h2><p>Use <code>&lt;ul&gt;</code> for unordered (bulleted) lists and <code>&lt;ol&gt;</code> for ordered (numbered) lists. Each item goes inside <code>&lt;li&gt;</code>.</p><p><strong>Example:</strong> <code>&lt;ul&gt;&lt;li&gt;Item 1&lt;/li&gt;&lt;li&gt;Item 2&lt;/li&gt;&lt;/ul&gt;</code></p><p><em>Adjust these notes to match your video.</em></p>' },
      6: { title: 'Forms', content: '<h2>Forms</h2><p><code>&lt;form action="..." method="get|post"&gt;</code> wraps inputs. Use <code>&lt;input type="text"&gt;</code>, <code>type="password"</code>, <code>type="submit"</code>, and <code>&lt;select&gt;</code> with <code>&lt;option&gt;</code> for dropdowns. Give inputs a <code>name</code> so values are submitted.</p><p><em>Adjust these notes to match your video.</em></p>' },
    },
    'C++': {
      1: { title: 'Your first C++ program', content: '<h2>Hello, World!</h2><p>Include <code>#include &lt;iostream&gt;</code> and <code>using namespace std;</code>. The program starts at <code>int main() { ... return 0; }</code>. Use <code>cout &lt;&lt;</code> to print and <code>endl</code> for a new line.</p><p><em>Adjust these notes to match your video.</em></p>' },
      2: { title: 'Variables and types', content: '<h2>Variables</h2><p>Declare variables with a type: <code>int</code>, <code>double</code>, <code>char</code>, <code>bool</code>. Example: <code>int x = 5;</code> and <code>double y = 3.14;</code>.</p><p><em>Adjust these notes to match your video.</em></p>' },
      3: { title: 'Input and output', content: '<h2>I/O</h2><p>Use <code>cin &gt;&gt; variable;</code> to read from the user. Use <code>cout &lt;&lt;</code> to print. You can chain: <code>cout &lt;&lt; "Result: " &lt;&lt; x &lt;&lt; endl;</code></p><p><em>Adjust these notes to match your video.</em></p>' },
      4: { title: 'If and loops', content: '<h2>Control flow</h2><p><code>if (condition) { }</code>, <code>for (int i=0; i&lt;n; i++) { }</code>, <code>while (condition) { }</code>. Use comparison operators: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>.</p><p><em>Adjust these notes to match your video.</em></p>' },
      5: { title: 'Functions', content: '<h2>Functions</h2><p>Define with return type and parameters: <code>returnType name(params) { ... return value; }</code>. Call with <code>name(args);</code>. <code>void</code> means no return value.</p><p><em>Adjust these notes to match your video.</em></p>' },
      6: { title: 'Arrays and strings', content: '<h2>Arrays and strings</h2><p>Arrays: <code>int arr[10];</code>. Strings: <code>#include &lt;string&gt;</code>, then <code>string s = "hello";</code>. Use a loop to go through an array.</p><p><em>Adjust these notes to match your video.</em></p>' },
    },
    Python: {
      1: { title: 'Intro and print', content: '<h2>Python basics</h2><p>Use <code>print("text")</code> to output. No semicolons; indentation matters for blocks. Run your script with Python to see output.</p><p><em>Adjust these notes to match your video.</em></p>' },
      2: { title: 'Variables and input', content: '<h2>Variables and input</h2><p>Variables don\'t need a type: <code>name = "Ali"</code>, <code>age = 20</code>. Use <code>input("prompt: ")</code> to read from the user. f-strings: <code>f"Hi {name}"</code>.</p><p><em>Adjust these notes to match your video.</em></p>' },
      3: { title: 'Conditionals and strings', content: '<h2>Conditionals and strings</h2><p><code>if condition:</code>, <code>elif</code>, <code>else:</code> — use a colon and indent the block. Strings have methods like <code>.upper()</code>, <code>.strip()</code>, and support indexing.</p><p><em>Adjust these notes to match your video.</em></p>' },
      4: { title: 'Loops', content: '<h2>Loops</h2><p><code>for i in range(n):</code> or <code>for x in list:</code>. <code>while condition:</code> for repeating until a condition is false. Use <code>break</code> and <code>continue</code> when needed.</p><p><em>Adjust these notes to match your video.</em></p>' },
      5: { title: 'Functions', content: '<h2>Functions</h2><p>Define with <code>def name(params):</code> and indent the body. Use <code>return value</code>. You can use default arguments: <code>def f(a, b=0):</code></p><p><em>Adjust these notes to match your video.</em></p>' },
      6: { title: 'Lists and dictionaries', content: '<h2>Lists and dicts</h2><p>Lists: <code>fruits = ["apple", "banana"]</code>, <code>.append()</code>, indexing. Dictionaries: <code>person = {"name": "Ali", "age": 20}</code>, access with <code>person["name"]</code>.</p><p><em>Adjust these notes to match your video.</em></p>' },
    },
  };
  // Short clip per lecture: { id, start (seconds), end (seconds) }. Easy to rewind; adjust start/end in lectureVideos to match the video.
  // HTML: freeCodeCamp "HTML Tutorial - Website Crash Course" (45 min). Clips ~6 min.
  // C++: Derek Banas "C++ Programming" (1 hr). Clips ~8 min.
  // Python: Dave Gray "Python Tutorial for Beginners" on freeCodeCamp (8 hr). Clips ~8 min.
  const CLIP_LEN_HTML = 360;  // 6 min
  const CLIP_LEN_CPP = 480;   // 8 min
  const CLIP_LEN_PY = 480;    // 8 min
  const lectureVideos = {
    HTML: {
      1: { id: '916GWv2Qs08', start: 0, end: 0 + CLIP_LEN_HTML },        // Intro, code editor (freeCodeCamp)
      2: { id: '916GWv2Qs08', start: 267, end: 267 + CLIP_LEN_HTML },    // Basic file, elements, headers, paragraphs (4:27)
      3: { id: '916GWv2Qs08', start: 790, end: 790 + CLIP_LEN_HTML },    // Images, links (13:10)
      4: { id: '916GWv2Qs08', start: 645, end: 645 + CLIP_LEN_HTML },    // Content area tags, structure (10:45)
      5: { id: '916GWv2Qs08', start: 1194, end: 1194 + CLIP_LEN_HTML },  // Lists (19:54)
      6: { id: '916GWv2Qs08', start: 1464, end: 1464 + CLIP_LEN_HTML }, // Forms and input (24:24)
    },
    'C++': {
      1: { id: 'Rub-JsjMhWY', start: 0, end: 0 + CLIP_LEN_CPP },        // Intro, first program (Derek Banas)
      2: { id: 'Rub-JsjMhWY', start: 160, end: 160 + CLIP_LEN_CPP },    // Data types (2:40)
      3: { id: 'Rub-JsjMhWY', start: 1227, end: 1227 + CLIP_LEN_CPP },   // User input (20:27)
      4: { id: 'Rub-JsjMhWY', start: 559, end: 559 + CLIP_LEN_CPP },   // If, switch, ternary, arrays (9:19)
      5: { id: 'Rub-JsjMhWY', start: 1816, end: 1816 + CLIP_LEN_CPP },   // Functions (30:16)
      6: { id: 'Rub-JsjMhWY', start: 829, end: 829 + CLIP_LEN_CPP },     // Arrays, loops, strings (13:49)
    },
    Python: {
      1: { id: 'qwAFL1597eM', start: 83, end: 83 + CLIP_LEN_PY },        // Getting started (Dave Gray / freeCodeCamp)
      2: { id: 'qwAFL1597eM', start: 890, end: 890 + CLIP_LEN_PY },     // Python basics (14:50)
      3: { id: 'qwAFL1597eM', start: 2778, end: 2778 + CLIP_LEN_PY },    // Data types (46:18)
      4: { id: 'qwAFL1597eM', start: 9983, end: 9983 + CLIP_LEN_PY },    // Loops (2:46:23)
      5: { id: 'qwAFL1597eM', start: 11343, end: 11343 + CLIP_LEN_PY },  // Functions (3:09:03)
      6: { id: 'qwAFL1597eM', start: 6331, end: 6331 + CLIP_LEN_PY },    // Lists & tuples (1:45:31)
    },
  };
  const raw = lectureVideos[course]?.[lecture.id];
  const videoId = typeof raw === 'string' ? raw : (raw && raw.id) ? raw.id : '';
  const startSec = (raw && typeof raw === 'object' && typeof raw.start === 'number') ? raw.start : 0;
  const endSec = (raw && typeof raw === 'object' && typeof raw.end === 'number') ? raw.end : 0;
  const videoContainerRef = useLectureVideoPlayer(videoId, startSec, endSec);

  const content = lectureContent[course]?.[lecture.id] || {
    title: "Lecture " + lecture.id,
    content: "<p>Add notes here to match the video. Edit <strong>lectureContent</strong> in LecturePlayer.jsx.</p>"
  };

  // Task for each lecture aligned with lecture content and video. taskTitle matches lecture title.
  const lectureGuides = {
    HTML: {
      1: { initialCode: '', taskTitle: 'Your task: Intro to HTML', steps: ['Start with <!DOCTYPE html> and <html>.', 'Add <head> with a <title> (e.g. "My First Page").', 'Add <body> with one <h1> heading and one <p> paragraph.', 'Run your code and open as website to see the result.'] },
      2: { initialCode: '', taskTitle: 'Your task: Text formatting', steps: ['Create a full HTML page with <head> and <body>.', 'Add at least two <p> paragraphs.', 'Use <strong> or <b> for bold and <em> or <i> for italic in one sentence.', 'Add a line break <br> or horizontal rule <hr>. Run and view the page.'] },
      3: { initialCode: '', taskTitle: 'Your task: Links and images', steps: ['Build a short page with a heading and a paragraph.', 'Add a link with <a href="url">text</a> (e.g. to a website).', 'Add an image with <img src="..." alt="description">.', 'Run code and check the website preview.'] },
      4: { initialCode: '', taskTitle: 'Your task: Attributes and structure', steps: ['Create an HTML page with proper structure (DOCTYPE, html, head, body).', 'Add an image with both src and alt attributes.', 'Add a link with href (and optionally target="_blank").', 'Use the class attribute on at least two elements.'] },
      5: { initialCode: '', taskTitle: 'Your task: Lists', steps: ['Add an unordered list with <ul> and 3–4 <li> items.', 'Add an ordered list with <ol> and 3 <li> items.', 'Place both lists in your page (e.g. in <body>).', 'Run code and open as website to view the lists.'] },
      6: { initialCode: '', taskTitle: 'Your task: Forms', steps: ['Create a <form> with action="#" and method="get".', 'Add a text input and a password input with name attributes.', 'Add a dropdown <select> with at least 3 <option>s.', 'Add a submit button and run to see your form.'] },
    },
    'C++': {
      1: { initialCode: '', taskTitle: 'Your task: Your first C++ program', steps: ['Include <iostream> and use namespace std.', 'Write int main() { ... } and return 0;', 'Use cout and << to print "Hello, CodeLab!" and a second line.', 'Run your code and check the output.'] },
      2: { initialCode: '', taskTitle: 'Your task: Variables and types', steps: ['Declare an int variable and assign a value.', 'Declare a double and a char variable.', 'Print all three using cout.', 'Run your code to see the output.'] },
      3: { initialCode: '', taskTitle: 'Your task: Input and output', steps: ['Use cin and >> to read an integer from the user.', 'Read a second value (e.g. another int or double).', 'Print the sum or both values using cout.', 'Run and type input when prompted.'] },
      4: { initialCode: '', taskTitle: 'Your task: If and loops', steps: ['Use an if statement to check a condition and print a message.', 'Write a for loop that prints numbers 1 to 5.', 'Use a while loop to print "Hello" three times.', 'Run your code and check the output.'] },
      5: { initialCode: '', taskTitle: 'Your task: Functions', steps: ['Define a function that takes two ints and returns their sum.', 'Call that function from main() and print the result.', 'Write a void function that prints a greeting and call it.', 'Run your code.'] },
      6: { initialCode: '', taskTitle: 'Your task: Arrays and strings', steps: ['Declare an array of 5 integers and assign values.', 'Print each element using a for loop.', 'Use a string variable (#include <string>) and print it with cout.', 'Run your code.'] },
    },
    Python: {
      1: { initialCode: '', taskTitle: 'Your task: Intro and print', steps: ['Use print() to output "Hello, CodeLab!"', 'Add two more print() statements with different messages.', 'Run your code and check the output.'] },
      2: { initialCode: '', taskTitle: 'Your task: Variables and input', steps: ['Create a variable with your name and one with your age.', 'Use input("prompt: ") to read a value from the user.', 'Print them using print() or an f-string f"Hi {name}".', 'Run your code.'] },
      3: { initialCode: '', taskTitle: 'Your task: Conditionals and strings', steps: ['Create a string variable and use if/elif/else to print different messages.', 'Use a condition (e.g. compare with > or ==).', 'Try a string method like .upper() or .strip() and print the result.', 'Run your code.'] },
      4: { initialCode: '', taskTitle: 'Your task: Loops', steps: ['Write a for loop over range(5) and print each number.', 'Use a while loop that runs 3 times and prints a message.', 'Run your code.'] },
      5: { initialCode: '', taskTitle: 'Your task: Functions', steps: ['Define a function that takes two numbers and returns their sum.', 'Call it from the main code and print the result.', 'Define a function with a default argument and call it.', 'Run your code.'] },
      6: { initialCode: '', taskTitle: 'Your task: Lists and dictionaries', steps: ['Create a list, append an item, and print the list.', 'Create a dictionary with 2–3 key-value pairs.', 'Access one value by key and print it.', 'Run your code.'] },
    },
  };

  const HTML_STORAGE_KEY = 'codelab-html-code';

  const getInitialCode = (courseName, lectureId) => {
    if (courseName === 'HTML') {
      return localStorage.getItem(HTML_STORAGE_KEY) || '';
    }
    const guide = lectureGuides[courseName]?.[lectureId];
    if (guide && guide.initialCode !== undefined) return guide.initialCode;
    switch (courseName) {
      case 'C++': return '';
      case 'Python': return '';
      default: return '';
    }
  };

  const handleHtmlCodeChange = (code) => {
    localStorage.setItem(HTML_STORAGE_KEY, code);
  };

  const getLectureGuide = (courseName, lectureId) => {
    return lectureGuides[courseName]?.[lectureId] || null;
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
    <div className={`lecture-player${darkMode ? ' lecture-player-dark' : ''}`}>
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
          {videoId && (
            <div className="lecture-video-wrap">
              <h3 className="lecture-video-heading">📺 Short tutorial – Lecture {lecture.id}</h3>
              <div className="lecture-video-aspect">
                <div
                  ref={videoContainerRef}
                  id="lecture-yt-player"
                  className="lecture-video-iframe"
                  title={`Lecture ${lecture.id}: ${content.title}`}
                />
              </div>
              <p className="lecture-video-caption">Video pauses at the end of this lecture&apos;s clip. Rewind to watch again.</p>
            </div>
          )}
          <div className="lecture-content">
            <div 
              className="lecture-text"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
            
            {showEditor && (
              <CodeEditor 
                language={course}
                initialCode={getInitialCode(course, lecture.id)}
                onCodeChange={course === 'HTML' ? handleHtmlCodeChange : undefined}
                onCodeRun={addCodeLinesWritten ? (_code, lines) => addCodeLinesWritten(lines) : undefined}
                guide={getLectureGuide(course, lecture.id)}
                darkMode={darkMode}
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
