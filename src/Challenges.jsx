import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { useProgress } from './ProgressContext';
import './EditorWorkspace.css';

function Challenges({ onBack, darkMode = false, user, onAchievementUnlocked }) {
  const { addCodeLinesWritten, refreshProgress } = useProgress();
  const [selectedChallengeId, setSelectedChallengeId] = useState('py-hello');
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com');

  const challenges = {
    'py-hello': {
      id: 'py-hello',
      title: 'Python: Print a Greeting',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Write a program that prints exactly: Hello, CodeLab! (including capitalization and punctuation).',
      starterCode: '',
      expectedOutput: 'Hello, CodeLab!\n',
    },
    'py-multi-line': {
      id: 'py-multi-line',
      title: 'Python: Multi-line Output',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Print exactly three separate lines: Line 1, Line 2, Line 3 (each on its own line).',
      starterCode: '',
      expectedOutput: 'Line 1\nLine 2\nLine 3\n',
    },
    'py-sum': {
      id: 'py-sum',
      title: 'Python: Sum Two Numbers',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Read two integers from input and print their sum. The numbers are on one line separated by a space.',
      starterCode: '',
      expectedOutputForInput: {
        input: '3 5\n',
        output: '8\n',
      },
    },
    'py-conditions': {
      id: 'py-conditions',
      title: 'Python: Even or Odd',
      language: 'Python',
      difficulty: 'Intermediate',
      description:
        'Read one integer. If it is even, print "Even". If it is odd, print "Odd".',
      starterCode: '',
      expectedOutputForInput: {
        input: '4\n',
        output: 'Even\n',
      },
    },
    'cpp-sum': {
      id: 'cpp-sum',
      title: 'C++: Sum Two Numbers',
      language: 'C++',
      difficulty: 'Beginner',
      description:
        'Read two integers from standard input and print their sum. Inputs are on one line, separated by space.',
      starterCode: '',
      expectedOutputForInput: {
        input: '3 5\n',
        output: '8\n',
      },
    },
    'cpp-max': {
      id: 'cpp-max',
      title: 'C++: Maximum of Two',
      language: 'C++',
      difficulty: 'Beginner',
      description:
        'Read two integers and print the larger one. If they are equal, print either value.',
      starterCode: '',
      expectedOutputForInput: {
        input: '7 2\n',
        output: '7\n',
      },
    },
    'cpp-loop': {
      id: 'cpp-loop',
      title: 'C++: Print 1 to N',
      language: 'C++',
      difficulty: 'Intermediate',
      description:
        'Read an integer N and print the numbers from 1 to N, each on its own line.',
      starterCode: '',
      expectedOutputForInput: {
        input: '3\n',
        output: '1\n2\n3\n',
      },
    },
  };

  const current = challenges[selectedChallengeId];

  const handleSelect = (id) => {
    const ch = challenges[id];
    setSelectedChallengeId(id);
    setLanguage(ch.language);
    setCode(ch.starterCode);
    setResult(null);
  };

  const handleCodeChange = (updated) => {
    setCode(updated);
  };

  const normalize = (text) =>
    (text || '').replace(/\r\n/g, '\n').trimEnd();

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    setResult({ status: 'running', message: 'Running your code...' });

    try {
      const body = { language: current.language, code };
      // For challenges that need input, append it in a simple way
      if (current.expectedOutputForInput) {
        body.testInput = current.expectedOutputForInput.input;
      }

      const resp = await fetch(`${baseUrl}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setResult({
          status: 'error',
          message: data?.error || 'Failed to run code.',
          rawOutput: data?.output || '',
        });
        return;
      }

      const output = data.output || '';

      const lineCount = (code || '').split('\n').length;
      if (lineCount > 0) addCodeLinesWritten(lineCount);

      let passed = false;
      if (current.expectedOutput) {
        const ok = normalize(output) === normalize(current.expectedOutput);
        passed = ok;
        setResult({
          status: ok ? 'passed' : 'failed',
          message: ok
            ? '✅ Correct! Your output matches the expected result.'
            : '❌ Not yet. Your output does not match the expected result.',
          rawOutput: output,
          expected: current.expectedOutput,
        });
      } else if (current.expectedOutputForInput) {
        const ok =
          normalize(output) === normalize(current.expectedOutputForInput.output);
        passed = ok;
        setResult({
          status: ok ? 'passed' : 'failed',
          message: ok
            ? '✅ Correct! Your program produced the right answer.'
            : '❌ Not yet. Your program output is different from the expected answer.',
          rawOutput: output,
          expected: current.expectedOutputForInput.output,
          testInput: current.expectedOutputForInput.input,
        });
      } else {
        setResult({
          status: 'info',
          message: 'Program ran. Manually check if it meets the requirements.',
          rawOutput: output,
        });
      }

      if (passed && user?.id && baseUrl) {
        try {
          const achRes = await fetch(`${baseUrl}/achievements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, key: `challenge:${current.id}` }),
          });
          if (achRes.ok) {
            if (onAchievementUnlocked) onAchievementUnlocked(`challenge:${current.id}`);
            refreshProgress(); // update "Challenges Completed" and other stats on dashboard
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      setResult({
        status: 'error',
        message: 'Error while running code: ' + e.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Initialize first challenge on first render
  React.useEffect(() => {
    if (code === '' && current) {
      setLanguage(current.language);
      setCode(current.starterCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`editor-workspace${darkMode ? ' editor-workspace-dark' : ''}`}>
      <div className="editor-toolbar">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="toolbar-right">
          <div>
            <h3 style={{ margin: 0 }}>Coding Challenges</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              Pick a challenge, write code, and submit to check your answer.
            </p>
          </div>
        </div>
      </div>

      <div className="editor-layout">
        <aside className="editor-sidebar">
          <h4>Challenges</h4>
          <ul className="challenge-list">
            {Object.values(challenges).map((ch) => (
              <li
                key={ch.id}
                className={
                  ch.id === selectedChallengeId
                    ? 'challenge-item active'
                    : 'challenge-item'
                }
                onClick={() => handleSelect(ch.id)}
              >
                <div className="challenge-title">{ch.title}</div>
                <div className="challenge-meta">
                  <span>{ch.language}</span>
                  <span>{ch.difficulty}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="editor-main">
          <section className="challenge-details">
            <h2>{current.title}</h2>
            <p>{current.description}</p>
          </section>

          <CodeEditor
            language={language}
            initialCode={code}
            onCodeChange={handleCodeChange}
            darkMode={darkMode}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button
              className="run-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Checking...' : 'Submit Solution'}
            </button>
          </div>

          {result && (
            <div
              className={`challenge-result ${result.status}${darkMode ? ' challenge-result-dark' : ''}`}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border:
                  result.status === 'passed'
                    ? '1px solid #16a34a'
                    : result.status === 'failed'
                    ? '1px solid #dc2626'
                    : '1px solid #4b5563',
                background:
                  result.status === 'passed'
                    ? '#ecfdf3'
                    : result.status === 'failed'
                    ? '#fef2f2'
                    : '#f3f4f6',
              }}
            >
              <p style={{ marginBottom: '0.5rem' }}>{result.message}</p>
              {result.testInput && (
                <p style={{ fontSize: '0.85rem' }}>
                  <strong>Test input:</strong> <code>{result.testInput}</code>
                </p>
              )}
              {result.expected && (
                <p style={{ fontSize: '0.85rem' }}>
                  <strong>Expected output:</strong>
                  <pre style={{ margin: '0.25rem 0' }}>{result.expected}</pre>
                </p>
              )}
              {result.rawOutput !== undefined && (
                <p style={{ fontSize: '0.85rem' }}>
                  <strong>Your program output:</strong>
                  <pre style={{ margin: '0.25rem 0' }}>{result.rawOutput}</pre>
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Challenges;

