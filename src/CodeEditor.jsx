import React, { useState, useEffect } from 'react';
import './CodeEditor.css';

function CodeEditor({ language, initialCode, onCodeChange, onCodeRun, guide, darkMode = false }) {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [debugHints, setDebugHints] = useState([]);
  const [htmlPreviewKey, setHtmlPreviewKey] = useState(0);

  const baseUrl = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com');

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
    if (onCodeRun && code.trim()) {
      const lines = code.split('\n').length;
      if (lines > 0) onCodeRun(code, lines);
    }
    if (language.toLowerCase() === 'html') {
      setHtmlPreviewKey((k) => k + 1);
      return;
    }

    setIsRunning(true);
    setOutput('Running...');
    setDebugHints([]);

    try {
      const endpoint = `${baseUrl}/run`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textBody = await response.text();
        data = { error: textBody || `Server returned status ${response.status}` };
      }
      if (!response.ok) {
        const rawError = data?.error || data?.message || (data?.run?.stderr || data?.run?.stdout) || 'Failed to run code. Check your connection or try again.';
        let text = rawError;
        if (/whitelist|Piston API|consider hosting your own Piston/i.test(rawError)) {
          text = 'Code execution is not available for this app right now.\n\n' +
            'You can:\n' +
            '• Run your code in an IDE on your computer (e.g. Visual Studio, Code::Blocks, VS Code for C++; IDLE or VS Code for Python).\n' +
            '• Ask your teacher if your school can set up a code runner for CodeLab.';
        }
        setOutput(text);
        setDebugHints(generateHints(language, code, text));
      } else {
        const text = data.output || '';
        setOutput(text);
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

  const openHtmlInNewTab = () => {
    if (language.toLowerCase() !== 'html') return;
    const doc = code || '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body><p>No content yet.</p></body></html>';
    const blob = new Blob([doc], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) {
      // Revoke blob URL after the new tab has had time to load (revoking too soon can leave the tab blank).
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      // Popup blocked: fallback to link click so the blob still opens in a new tab.
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
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

  const isHtml = language.toLowerCase() === 'html';

  const getPreviewHtml = () => {
    const raw = code || '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body><p>Write HTML and click Run Code to see your website here.</p></body></html>';
    if (!darkMode) return raw;
    const darkStyle = '<style>body{background:#1e231e !important;color:#e5e7eb !important;} a{color:#81c784;} h1,h2,h3,h4,h5,h6,p,span,div,li{color:inherit;}</style>';
    if (raw.match(/<head[^>]*>/i)) {
      return raw.replace(/(<head[^>]*>)/i, '$1' + darkStyle);
    }
    if (raw.match(/<html/i)) {
      return raw.replace(/(<html[^>]*>)/i, '$1<head>' + darkStyle + '</head>');
    }
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' + darkStyle + '</head><body>' + raw + '</body></html>';
  };

  return (
    <div className={`code-editor ${isHtml ? 'code-editor-html' : ''}${darkMode ? ' code-editor-dark' : ''}`}>
      {guide && guide.steps && guide.steps.length > 0 && (
        <div className="editor-guide">
          <h4 className="editor-guide-title">{guide.taskTitle || 'What to do in this lecture'}</h4>
          <p className="editor-guide-intro">Type your code below (start from scratch). Follow these steps:</p>
          <ol className="editor-guide-steps">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="editor-header">
        <h3>Try it yourself - {language}</h3>
        <div className="editor-actions">
          <button 
            className="run-btn" 
            onClick={runCode}
            disabled={isRunning}
          >
            {isHtml ? '▶ Run Code' : 
             isRunning ? 'Running...' : '▶ Run Code'}
          </button>
          {isHtml && (
            <button type="button" className="open-website-btn" onClick={openHtmlInNewTab}>
              Open as website
            </button>
          )}
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
          {!isHtml && (
            <div className="output-header">
              <span className="output-label">Output</span>
            </div>
          )}
          <div className="output-content">
            {isHtml ? (
              <div className="html-preview">
                <div className="html-preview-bar">
                  <span className="html-preview-label">Website preview</span>
                  <button type="button" className="html-preview-open-btn" onClick={openHtmlInNewTab}>
                    Open in new tab
                  </button>
                </div>
                <iframe
                  key={htmlPreviewKey}
                  srcDoc={getPreviewHtml()}
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
          {isHtml ? (
            <>
              <li>Edit the HTML code and click "Run Code" to see your website in the preview</li>
              <li>Use "Open as website" or "Open in new tab" to view the page in a full browser tab</li>
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
