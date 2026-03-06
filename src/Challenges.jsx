import React, { useState, useEffect } from 'react';
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
  const [completedChallengeIds, setCompletedChallengeIds] = useState(new Set());
  const [openGroups, setOpenGroups] = useState(new Set());

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
    'py-input-name': {
      id: 'py-input-name',
      title: 'Python: Greet by Name',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Read a name from input (one line) and print exactly: Hello, {name}! (use the input value in place of {name}).',
      starterCode: '',
      expectedOutputForInput: {
        input: 'CodeLab\n',
        output: 'Hello, CodeLab!\n',
      },
    },
    'py-area': {
      id: 'py-area',
      title: 'Python: Area of Rectangle',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Read two integers (width and height) from input on one line separated by a space. Print the area (width * height).',
      starterCode: '',
      expectedOutputForInput: {
        input: '4 5\n',
        output: '20\n',
      },
    },
    'py-division': {
      id: 'py-division',
      title: 'Python: Quotient and Remainder',
      language: 'Python',
      difficulty: 'Beginner',
      description:
        'Read two integers a and b from input (one line, space-separated). Print the quotient (a // b) and remainder (a % b) on one line, space-separated.',
      starterCode: '',
      expectedOutputForInput: {
        input: '17 5\n',
        output: '3 2\n',
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
    'py-list-sum': {
      id: 'py-list-sum',
      title: 'Python: Sum of N Numbers',
      language: 'Python',
      difficulty: 'Intermediate',
      description:
        'Read an integer N, then N integers (one per line). Print their sum.',
      starterCode: '',
      expectedOutputForInput: {
        input: '3\n10\n20\n30\n',
        output: '60\n',
      },
    },
    'py-fizzbuzz': {
      id: 'py-fizzbuzz',
      title: 'Python: FizzBuzz',
      language: 'Python',
      difficulty: 'Intermediate',
      description:
        'Read one integer N. Print the numbers 1 to N, one per line. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".',
      starterCode: '',
      expectedOutputForInput: {
        input: '5\n',
        output: '1\n2\nFizz\n4\nBuzz\n',
      },
    },
    'py-reverse': {
      id: 'py-reverse',
      title: 'Python: Reverse a String',
      language: 'Python',
      difficulty: 'Intermediate',
      description:
        'Read one line of text and print the string reversed.',
      starterCode: '',
      expectedOutputForInput: {
        input: 'hello\n',
        output: 'olleh\n',
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
    'cpp-hello': {
      id: 'cpp-hello',
      title: 'C++: Hello World',
      language: 'C++',
      difficulty: 'Beginner',
      description:
        'Print exactly: Hello, World! (including punctuation).',
      starterCode: '',
      expectedOutput: 'Hello, World!\n',
    },
    'cpp-double': {
      id: 'cpp-double',
      title: 'C++: Double the Number',
      language: 'C++',
      difficulty: 'Beginner',
      description:
        'Read one integer from input and print its double.',
      starterCode: '',
      expectedOutputForInput: {
        input: '21\n',
        output: '42\n',
      },
    },
    'cpp-min': {
      id: 'cpp-min',
      title: 'C++: Minimum of Two',
      language: 'C++',
      difficulty: 'Beginner',
      description:
        'Read two integers and print the smaller one. If equal, print either.',
      starterCode: '',
      expectedOutputForInput: {
        input: '7 2\n',
        output: '2\n',
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
    'cpp-factorial': {
      id: 'cpp-factorial',
      title: 'C++: Factorial',
      language: 'C++',
      difficulty: 'Intermediate',
      description:
        'Read a non-negative integer N and print N! (factorial). Assume N ≤ 12.',
      starterCode: '',
      expectedOutputForInput: {
        input: '5\n',
        output: '120\n',
      },
    },
    'cpp-prime': {
      id: 'cpp-prime',
      title: 'C++: Prime or Not',
      language: 'C++',
      difficulty: 'Intermediate',
      description:
        'Read one integer N (≥ 2). If N is prime, print "Prime". Otherwise print "Not Prime".',
      starterCode: '',
      expectedOutputForInput: {
        input: '7\n',
        output: 'Prime\n',
      },
    },
    'cpp-array-sum': {
      id: 'cpp-array-sum',
      title: 'C++: Sum of N Numbers',
      language: 'C++',
      difficulty: 'Intermediate',
      description:
        'Read an integer N, then N integers (one per line). Print their sum.',
      starterCode: '',
      expectedOutputForInput: {
        input: '3\n10\n20\n30\n',
        output: '60\n',
      },
    },
    'py-palindrome': {
      id: 'py-palindrome',
      title: 'Python: Palindrome Check',
      language: 'Python',
      difficulty: 'Hard',
      description:
        'Read one line of text (letters only, case-insensitive). Print "Yes" if it is a palindrome, otherwise "No".',
      starterCode: '',
      expectedOutputForInput: {
        input: 'racecar\n',
        output: 'Yes\n',
      },
    },
    'py-vowels': {
      id: 'py-vowels',
      title: 'Python: Count Vowels',
      language: 'Python',
      difficulty: 'Hard',
      description:
        'Read one line of text. Print the number of vowels (a, e, i, o, u), counting both uppercase and lowercase.',
      starterCode: '',
      expectedOutputForInput: {
        input: 'Hello World\n',
        output: '3\n',
      },
    },
    'py-second-max': {
      id: 'py-second-max',
      title: 'Python: Second Largest',
      language: 'Python',
      difficulty: 'Hard',
      description:
        'Read an integer N (≥ 2), then N distinct integers (one per line). Print the second largest value.',
      starterCode: '',
      expectedOutputForInput: {
        input: '4\n10\n30\n20\n5\n',
        output: '20\n',
      },
    },
    'cpp-gcd': {
      id: 'cpp-gcd',
      title: 'C++: Greatest Common Divisor',
      language: 'C++',
      difficulty: 'Hard',
      description:
        'Read two positive integers a and b (one line, space-separated). Print their GCD.',
      starterCode: '',
      expectedOutputForInput: {
        input: '48 18\n',
        output: '6\n',
      },
    },
    'cpp-fibonacci': {
      id: 'cpp-fibonacci',
      title: 'C++: Nth Fibonacci',
      language: 'C++',
      difficulty: 'Hard',
      description:
        'Read a positive integer N (1 ≤ N ≤ 20). Print the Nth Fibonacci number (F1=1, F2=1, F3=2, ...).',
      starterCode: '',
      expectedOutputForInput: {
        input: '7\n',
        output: '13\n',
      },
    },
    'cpp-palindrome-num': {
      id: 'cpp-palindrome-num',
      title: 'C++: Palindrome Number',
      language: 'C++',
      difficulty: 'Hard',
      description:
        'Read one positive integer. Print "Yes" if it is a palindrome (reads same forwards and backwards), otherwise "No".',
      starterCode: '',
      expectedOutputForInput: {
        input: '121\n',
        output: 'Yes\n',
      },
    },
  };

  const current = challenges[selectedChallengeId];

  // Group challenges by language + difficulty (e.g. Python-Beginner, C++-Intermediate)
  const groupOrder = ['Python-Beginner', 'Python-Intermediate', 'Python-Hard', 'C++-Beginner', 'C++-Intermediate', 'C++-Hard'];
  const challengesByGroup = React.useMemo(() => {
    const map = {};
    Object.values(challenges).forEach((ch) => {
      const key = `${ch.language}-${ch.difficulty}`;
      if (!map[key]) map[key] = [];
      map[key].push(ch);
    });
    return map;
  }, []);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getShortTitle = (ch) => {
    return (ch.title || '')
      .replace(/^Python:\s*/i, '')
      .replace(/^C\+\+:\s*/i, '');
  };

  // Load which challenges are completed (from achievements)
  useEffect(() => {
    if (!user?.id || !baseUrl) return;
    const loadCompleted = async () => {
      try {
        const res = await fetch(`${baseUrl}/achievements/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = data.achievements || [];
        const ids = new Set(
          list
            .filter((a) => (a.key || '').startsWith('challenge:'))
            .map((a) => (a.key || '').replace(/^challenge:/, ''))
        );
        setCompletedChallengeIds(ids);
      } catch (e) {
        // ignore
      }
    };
    loadCompleted();
  }, [user?.id, baseUrl]);

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
        const wasAlreadyCompleted = completedChallengeIds.has(current.id);
        setCompletedChallengeIds((prev) => new Set([...prev, current.id]));
        if (wasAlreadyCompleted) return; // Don't award again for the same challenge (no farming)
        try {
          const achRes = await fetch(`${baseUrl}/achievements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, key: `challenge:${current.id}` }),
          });
          if (!achRes.ok) return;
          const data = await achRes.json().catch(() => ({}));
          if (data.inserted) {
            if (onAchievementUnlocked) onAchievementUnlocked(`challenge:${current.id}`);
            refreshProgress();
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
          <div className="challenge-groups">
            {groupOrder.map((groupKey) => {
              const list = challengesByGroup[groupKey] || [];
              if (list.length === 0) return null;
              const [lang, difficulty] = groupKey.split('-');
              const label = `${lang} ${difficulty} Challenge`;
              const isOpen = openGroups.has(groupKey);
              return (
                <div key={groupKey} className="challenge-group">
                  <button
                    type="button"
                    className={`challenge-group-header ${isOpen ? 'open' : ''}`}
                    onClick={() => toggleGroup(groupKey)}
                    aria-expanded={isOpen}
                  >
                    <span>{label}</span>
                    <span className="challenge-group-chevron" aria-hidden>{isOpen ? '▼' : '▶'}</span>
                  </button>
                  {isOpen && (
                    <ul className="challenge-list">
                      {list.map((ch) => {
                        const isCompleted = completedChallengeIds.has(ch.id);
                        return (
                          <li
                            key={ch.id}
                            className={`challenge-item ${ch.id === selectedChallengeId ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleSelect(ch.id)}
                          >
                            <span className="challenge-title">{getShortTitle(ch)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
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

