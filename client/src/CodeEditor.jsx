import React, { useState, useEffect } from 'react';
import './CodeEditor.css';

function CodeEditor({ language, initialCode, onCodeChange }) {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setCode(initialCode || '');
  }, [initialCode]);

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

    try {
      // For HTML, no need to run - it's live preview
      if (language.toLowerCase() === 'html') {
        setIsRunning(false);
        return;
      }

      // Simulate code execution for other languages
      setTimeout(() => {
        let result = '';
        
        switch (language.toLowerCase()) {
          case 'c++':
            if (code.includes('cout')) {
              // Extract cout statements and simulate output
              const coutMatches = code.match(/cout\s*<<\s*["']([^"']*)["']/g);
              if (coutMatches) {
                result = coutMatches.map(match => {
                  const content = match.match(/["']([^"']*)["']/);
                  return content ? content[1] : '';
                }).join('\n');
                result += '\nProgram executed successfully!';
              } else {
                result = 'C++ program compiled and executed successfully!';
              }
            } else if (code.includes('int main')) {
              result = 'C++ program compiled and executed successfully!';
            } else {
              result = 'Please write a valid C++ program with main() function.';
            }
            break;
          case 'python':
            if (code.includes('print')) {
              // Extract print statements and simulate output
              const printMatches = code.match(/print\s*\(\s*["']([^"']*)["']\s*\)/g);
              if (printMatches) {
                result = printMatches.map(match => {
                  const content = match.match(/["']([^"']*)["']/);
                  return content ? content[1] : '';
                }).join('\n');
              } else {
                result = 'Python code executed successfully!';
              }
            } else {
              result = 'Please use print() to see output.';
            }
            break;
          default:
            result = 'Code executed successfully!';
        }
        
        setOutput(result);
        setIsRunning(false);
      }, 1000);
    } catch (error) {
      setOutput('Error: ' + error.message);
      setIsRunning(false);
    }
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
    </div>
  );
}

export default CodeEditor;
