import React, { useState, useEffect } from 'react';
import './CodeEditor.css';

function CodeEditor({ language, initialCode, onCodeChange }) {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [debugHints, setDebugHints] = useState([]);

  useEffect(() => {
    setCode(initialCode || '');
  }, [initialCode]);

  // HTML validation: provide hints when common closing tags are missing
  useEffect(() => {
    if ((language || '').toLowerCase() === 'html') {
      setDebugHints(validateHtml(code));
    }
  }, [language, code]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    setDebugHints([]);

    try {
      if (language.toLowerCase() === 'html') {
        setIsRunning(false);
        return;
      }

      const response = await fetch('/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      const data = await response.json();
      if (!response.ok) {
        const text = data?.error || 'Failed to run code';
        setOutput(text);
        setDebugHints(generateHints(language, code, text));
      } else {
        const text = data.output || '';
        setOutput(text);
        // If stderr carries hints
        setDebugHints(generateHints(language, code, text));
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const generateHints = (lang, source, out) => {
    const hints = [];
    const lower = String(lang || '').toLowerCase();
    const text = (out || '').toLowerCase();
    if (lower === 'c++') {
      const hasIostream = /#include\s*<\s*iostream\s*>/i.test(source);
      const missingIncludeMsg = /did you forget to .*include.*<iostream>|is defined in header '\s*<ostream>/i.test(out);
      if (!hasIostream && (missingIncludeMsg || /\bcout\b was not declared|\bendl\b was not declared/i.test(out))) {
        hints.push('Add #include <iostream> at the top of your file.');
      }
      if (/cout\' was not declared|\bcout\b was not declared/i.test(out) || /endl\' was not declared|\bendl\b was not declared/i.test(out)) {
        hints.push('Use std::cout and std::endl or add using namespace std;');
      }
      if (/expected identifier before ';' token/i.test(out) || /using namespace\s*;/i.test(source)) {
        hints.push('Write using namespace std; (missing std after namespace).');
      }
      if (!/int\s+main\s*\(/.test(source)) {
        hints.push('Add an entry point: int main() { /* ... */ }');
      }
      if (/expected.*';'|expected.*\}/i.test(out)) {
        hints.push('Check for missing semicolons or braces. Each statement ends with ;');
      }
      if (/include expects \"FILENAME\"/i.test(out)) {
        hints.push('Fix the include line, e.g., #include <iostream>');
      }
      if (hints.length === 0 && /error:/i.test(out)) {
        hints.push('Read the error line numbers on the right, then fix the referenced lines.');
      }
    } else if (lower === 'python') {
      if (/indentationerror/i.test(text)) hints.push('Fix indentation: use consistent spaces (typically 4).');
      if (/nameerror: name 'print' is not defined/i.test(text)) hints.push('Use print("text") in Python 3.');
      if (hints.length === 0 && /traceback/i.test(text)) hints.push('Follow the traceback: fix the line mentioned at the bottom first.');
    }
    return hints;
  };

  const validateHtml = (source) => {
    const hints = [];
    const hasHtmlOpen = /<html[^>]*>/i.test(source);
    const hasHtmlClose = /<\/html>/i.test(source);
    const hasBodyOpen = /<body[^>]*>/i.test(source);
    const hasBodyClose = /<\/body>/i.test(source);
    if (hasBodyOpen && !hasBodyClose) hints.push('Missing closing </body> tag. Add </body> before </html>.');
    if (hasHtmlOpen && !hasHtmlClose) hints.push('Missing closing </html> tag at the end of the document.');
    if (!hasHtmlOpen) hints.push('Add <!DOCTYPE html> and <html> ... </html> document wrapper.');
    return hints;
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
    if (onCodeChange) {
      onCodeChange('');
    }
  };

  const resetCode = () => {
    setCode(initialCode || '');
    setOutput('');
    if (onCodeChange) {
      onCodeChange(initialCode || '');
    }
  };

  const getLanguagePlaceholder = () => {
    switch (language.toLowerCase()) {
      case 'html':
        return `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Try editing this HTML code!</p>
</body>
</html>`;
      case 'c++':
        return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;
      case 'python':
        return `print("Hello, World!")
print("Welcome to Python!")
print("Try editing this code!")`;
      default:
        return '// Start coding here...';
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h3>Try it yourself - {language}</h3>
        <div className="editor-actions">
          <button 
            className="run-btn" 
            onClick={runCode}
            disabled={isRunning || language.toLowerCase() === 'html'}
          >
            {language.toLowerCase() === 'html' ? 'Live Preview' : 
             isRunning ? 'Running...' : '▶ Run Code'}
          </button>
          <button className="clear-btn" onClick={clearCode}>
            Clear
          </button>
          <button className="reset-btn" onClick={resetCode}>
            Reset
          </button>
        </div>
      </div>
      
      <div className="editor-container">
        <div className="code-section">
          <div className="code-header">
            <span className="language-tag">{language}</span>
            <span className="line-count">{code.split('\n').length} lines</span>
          </div>
          <textarea
            className="code-textarea"
            value={code}
            onChange={handleCodeChange}
            placeholder={getLanguagePlaceholder()}
            spellCheck={false}
          />
        </div>
        
        <div className="output-section">
          <div className="output-header">
            <span className="output-label">
              {language.toLowerCase() === 'html' ? 'Live Preview' : 'Output'}
            </span>
          </div>
          <div className="output-content">
            {language.toLowerCase() === 'html' ? (
              <div className="html-preview">
                <iframe
                  srcDoc={code}
                  title="HTML Preview"
                  className="preview-iframe"
                  sandbox="allow-scripts"
                />
              </div>
            ) : output ? (
              <pre className="output-text">{output}</pre>
            ) : (
              <div className="output-placeholder">
                Click "Run Code" to see the output here
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="editor-tips">
        <h4>💡 Tips:</h4>
        <ul>
          {language.toLowerCase() === 'html' ? (
            <>
              <li>Edit the HTML code above and see the live preview on the right</li>
              <li>The preview updates automatically as you type</li>
              <li>Use "Clear" to start fresh or "Reset" to restore the original code</li>
            </>
          ) : (
            <>
              <li>Edit the code above and click "Run Code" to see the result</li>
              <li>Use "Clear" to start fresh or "Reset" to restore the original code</li>
              <li>Try modifying the code to experiment with different concepts</li>
            </>
          )}
        </ul>
      </div>
      {debugHints.length > 0 && (
        <div className="debug-hints">
          <h4>🔎 Debug hints</h4>
          <ul>
            {debugHints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
