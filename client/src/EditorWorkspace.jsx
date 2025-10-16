import React, { useState } from 'react';
import CodeEditor from './CodeEditor';

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
    <div className="editor-workspace" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="logout-btn" onClick={onBack}>← Back</button>
        <label htmlFor="language" style={{ fontWeight: 600 }}>Language:</label>
        <select id="language" value={language} onChange={handleChangeLanguage}>
          <option value="HTML">HTML</option>
          <option value="C++">C++</option>
          <option value="Python">Python</option>
        </select>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <CodeEditor language={language} initialCode={codeByLang[language]} onCodeChange={handleCodeChange} />
      </div>
    </div>
  );
}

export default EditorWorkspace;


