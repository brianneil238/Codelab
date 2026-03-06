import React, { useState, useEffect } from 'react';
import './CodeEditor.css';

function CodeEditor({ language, initialCode, onCodeChange, onCodeRun, guide, darkMode = false }) {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [debugHints, setDebugHints] = useState([]);
  const [htmlPreviewKey, setHtmlPreviewKey] = useState(0);
  const [htmlPreviewContent, setHtmlPreviewContent] = useState(null);

  const baseUrl = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com');

  useEffect(() => {
    setCode(initialCode || '');
    setHtmlPreviewContent(null);
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
      const doc = buildHtmlDocument(code || '', darkMode);
      setHtmlPreviewContent(doc);
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
    const hasError = /error|traceback|syntaxerror|nameerror|indentationerror|exited with error/i.test(text);

    if (lower === 'python') {
      if (/unexpected eof while parsing|eof while parsing/i.test(text)) {
        hints.push('What’s missing: A closing character at the end. Include: a closing parenthesis ), or bracket ], or quote " so every ( [ " has a match.');
      }
      if (/syntaxerror: invalid syntax/i.test(text)) {
        hints.push('What’s missing: Valid syntax on the line shown. Include: a colon : after if/for/while/def/else/elif, or fix an unclosed ( ) [ ] " \' .');
      }
      if (/indentationerror/i.test(text)) {
        hints.push('What’s missing: Consistent indentation. Include: the same number of spaces (usually 4) for each block; do not mix tabs and spaces.');
      }
      if (/nameerror/i.test(text)) {
        hints.push('What’s missing: A definition for the name used. Include: a line that defines that variable or function before you use it, or fix the spelling.');
      }
      if (/typeerror/i.test(text)) {
        hints.push('What’s missing: The right type (e.g. number vs text). Include: a conversion (e.g. int() or str()) or use the correct type on that line.');
      }
      if (/zerodivisionerror/i.test(text)) {
        hints.push('What’s missing: A non-zero divisor. Include: a check so you never divide by 0, or use a different number in the denominator.');
      }
      if (hints.length === 0 && hasError) {
        hints.push('What to include: Fix the line the error points to (missing : , ) , ] , or " are common). Re-run after each change.');
      }
    } else if (lower === 'c++') {
      const hasIostream = /#include\s*<\s*iostream\s*>/i.test(source);
      if (!hasIostream && (/\bcout\b was not declared|\bendl\b was not declared|is defined in header/i.test(out))) {
        hints.push('What’s missing: The iostream header. Include: #include <iostream> at the very top of your file.');
      }
      if (/\bcout\b was not declared|\bendl\b was not declared/i.test(out)) {
        hints.push('What’s missing: std namespace for cout/endl. Include: using namespace std; after your #include, or write std::cout and std::endl.');
      }
      if (/expected.*';'|expected ';'/i.test(out)) {
        hints.push('What’s missing: A semicolon. Include: ; at the end of the statement on the line the error points to (every C++ statement ends with ;).');
      }
      if (/expected.*\}|expected '\}'/i.test(out)) {
        hints.push('What’s missing: A closing brace. Include: } so every { has a matching }; check the block the error points to.');
      }
      if (!/int\s+main\s*\(/.test(source) && /main/i.test(out)) {
        hints.push('What’s missing: The main function. Include: int main() { ... } and put all your code inside the braces.');
      }
      if (/undefined reference to main/i.test(out)) {
        hints.push('What’s missing: A main function. Include: int main() { ... } with your code inside so the program can run.');
      }
      if (hints.length === 0 && /error:/i.test(out)) {
        hints.push('What to include: A semicolon ; at the end of statements, a matching } for every {, and the right #include headers. Check the line number in the error.');
      }
    }

    return hints;
  };

  const validateHtml = (source) => {
    const hints = [];
    const hasHtmlOpen = /<html[^>]*>/i.test(source);
    const hasHtmlClose = /<\/html>/i.test(source);
    const hasBodyOpen = /<body[^>]*>/i.test(source);
    const hasBodyClose = /<\/body>/i.test(source);
    if (hasBodyOpen && !hasBodyClose) hints.push('What’s missing: Closing </body>. Include: </body> right before </html>.');
    if (hasHtmlOpen && !hasHtmlClose) hints.push('What’s missing: Closing </html>. Include: </html> at the very end of the document.');
    if (!hasHtmlOpen && (source || '').trim().length > 0) {
      hints.push('What’s missing: Document wrapper. Include: <!DOCTYPE html> at the top and wrap the page in <html> ... </html>.');
    }
    if (/<p\b[^>]*>/i.test(source) && !/<\/p>/i.test(source)) hints.push('What’s missing: Closing </p>. Include: </p> after the paragraph content.');
    if (/<h[1-6]\b[^>]*>/i.test(source) && !/<\/h[1-6]>/i.test(source)) hints.push('What’s missing: Closing heading tag. Include: the matching </h1>, </h2>, … </h6> after the heading text.');
    if (/<div\b[^>]*>/i.test(source) && !/<\/div>/i.test(source)) hints.push('What’s missing: Closing </div>. Include: </div> after the content inside the div.');
    return hints;
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
    setHtmlPreviewContent(null);
    if (onCodeChange) {
      onCodeChange('');
    }
  };

  const resetCode = () => {
    setCode(initialCode || '');
    setOutput('');
    setHtmlPreviewContent(null);
    if (onCodeChange) {
      onCodeChange(initialCode || '');
    }
  };

  const openHtmlInNewTab = () => {
    if (language.toLowerCase() !== 'html') return;
    const doc = htmlPreviewContent || buildHtmlDocument(code || '', darkMode) || '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body><p>No content yet. Click Run Code first.</p></body></html>';
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(doc);
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (w) {
      const writeDoc = () => {
        try {
          w.document.open('text/html', 'replace');
          w.document.write(doc);
          w.document.close();
        } catch (err) {
          w.location.href = dataUrl;
        }
      };
      setTimeout(writeDoc, 50);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  const looksLikeHtml = (str) => {
    const s = (str || '').trim();
    return s.length > 0 && /<[a-zA-Z!?/]/.test(s);
  };

  const notHtmlMessage = (isDark) => {
    const style = isDark
      ? '<style>body{background:#1e231e;color:#e5e7eb;} code{background:#2d332d;padding:0.2em 0.4em;border-radius:4px;}</style>'
      : '';
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title>' + style + '</head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:480px;margin:0 auto;">' +
      '<p style="color:inherit;">This doesn\'t look like HTML yet. Use <strong>HTML tags</strong> so the browser can render a page.</p>' +
      '<p style="color:inherit;">Examples:</p>' +
      '<ul style="color:inherit;">' +
      '<li><code>&lt;h1&gt;Title&lt;/h1&gt;</code> — heading</li>' +
      '<li><code>&lt;p&gt;A paragraph.&lt;/p&gt;</code> — paragraph</li>' +
      '<li><code>&lt;a href="..."&gt;Link&lt;/a&gt;</code> — link</li>' +
      '</ul>' +
      '<p style="color:inherit;">Write HTML in the editor and click <strong>Run Code</strong> to see the result here.</p>' +
      '</body></html>';
  };

  const buildHtmlDocument = (raw, isDark) => {
    const content = (raw || '').trim();
    if (!content || !looksLikeHtml(content)) {
      return notHtmlMessage(isDark);
    }
    if (!isDark) {
      if (/<html/i.test(content) || /<!DOCTYPE/i.test(content)) return content;
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body>' + content + '</body></html>';
    }
    const darkStyle = '<style>body{background:#1e231e !important;color:#e5e7eb !important;} a{color:#81c784;} h1,h2,h3,h4,h5,h6,p,span,div,li{color:inherit;}</style>';
    if (content.match(/<head[^>]*>/i)) {
      return content.replace(/(<head[^>]*>)/i, '$1' + darkStyle);
    }
    if (content.match(/<html/i)) {
      return content.replace(/(<html[^>]*>)/i, '$1<head>' + darkStyle + '</head>');
    }
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' + darkStyle + '</head><body>' + content + '</body></html>';
  };

  const htmlPlaceholderDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title><style>body{font-family:system-ui,sans-serif;padding:2rem;color:#666;display:flex;align-items:center;justify-content:center;min-height:200px;margin:0;}</style></head><body><p>Click <strong>Run Code</strong> to render your HTML and see the result here.</p></body></html>';

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
                  srcDoc={htmlPreviewContent != null ? htmlPreviewContent : htmlPlaceholderDoc}
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
          <h4>💡 What might be wrong?</h4>
          <p className="debug-hints-intro">What’s missing or what to include to run correctly:</p>
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
