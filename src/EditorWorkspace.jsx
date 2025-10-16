import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import './EditorWorkspace.css';

function EditorWorkspace({ onBack }) {
  const [language, setLanguage] = useState('HTML');
  const [codeByLang, setCodeByLang] = useState({
    HTML: `<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <p>Edit this HTML and preview on the right.</p>\n</body>\n</html>`,
    'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}`,
    Python: `print("Hello from Python!")\nprint("Edit and run your code.")`
  });

  const upper = (val) => {
    if (!val) return '';
    const v = String(val);
    if (v.toLowerCase() === 'cpp' || v.toLowerCase() === 'c++') return 'C++';
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  const handleChangeLanguage = (e) => {
    setLanguage(upper(e.target.value));
  };

  const handleCodeChange = (updated) => {
    setCodeByLang(prev => ({ ...prev, [language]: updated }));
  };

  return (
    <div className="editor-workspace">
      <div className="editor-toolbar">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="toolbar-right">
          <label>Language</label>
          <div className="language-toggle" role="tablist" aria-label="Choose language">
            <button
              type="button"
              role="tab"
              aria-selected={language === 'HTML'}
              className={`toggle-btn ${language === 'HTML' ? 'active' : ''}`}
              onClick={() => setLanguage('HTML')}
            >
              🌐 HTML
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={language === 'C++'}
              className={`toggle-btn ${language === 'C++' ? 'active' : ''}`}
              onClick={() => setLanguage('C++')}
            >
              ⚙️ C++
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={language === 'Python'}
              className={`toggle-btn ${language === 'Python' ? 'active' : ''}`}
              onClick={() => setLanguage('Python')}
            >
              🐍 Python
            </button>
          </div>
        </div>
      </div>

      <CodeEditor language={language} initialCode={codeByLang[language]} onCodeChange={handleCodeChange} />
    </div>
  );
}

export default EditorWorkspace;


