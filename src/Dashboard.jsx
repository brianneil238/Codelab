import React from 'react';
import './Dashboard.css';
import { useProgress } from './ProgressContext';

function Dashboard({ user, onLogout, onCourseSelect }) {
  const { getCourseProgress, getOverallProgress } = useProgress();
  
  const overallProgress = getOverallProgress();
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">💻</div>
            <h1 className="logo-text">CodeLab</h1>
          </div>
          <div className="user-section">
            <div className="user-profile">
              <div className="user-avatar">{user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}</div>
              <span className="user-name">{user.fullName || user.username}</span>
              <button className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="welcome-section">
            <h2>Welcome to CodeLab!</h2>
            <p>Your coding journey starts here. Choose what you'd like to work on today.</p>
          </div>

          <div className="progress-overview">
            <h3>Your Learning Progress</h3>
            <div className="overall-progress">
              <div className="progress-info">
                <span className="progress-label">Overall Progress</span>
                <span className="progress-percentage">{overallProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>HTML</h3>
              <p>Learn web development fundamentals with HTML</p>
              <div className="course-progress">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">{getCourseProgress('HTML').progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getCourseProgress('HTML').progress}%` }}
                  ></div>
                </div>
              </div>
              <button className="feature-btn" onClick={() => onCourseSelect('HTML')}>Start HTML Course</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>C++</h3>
              <p>Master system programming and algorithms with C++</p>
              <div className="course-progress">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">{getCourseProgress('C++').progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getCourseProgress('C++').progress}%` }}
                  ></div>
                </div>
              </div>
              <button className="feature-btn" onClick={() => onCourseSelect('C++')}>Start C++ Course</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🐍</div>
              <h3>Python</h3>
              <p>Build applications and data science with Python</p>
              <div className="course-progress">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">{getCourseProgress('Python').progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getCourseProgress('Python').progress}%` }}
                  ></div>
                </div>
              </div>
              <button className="feature-btn" onClick={() => onCourseSelect('Python')}>Start Python Course</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Code Editor</h3>
              <p>Write and test your code in our integrated editor</p>
              <button className="feature-btn">Start Coding</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Challenges</h3>
              <p>Test your skills with programming challenges</p>
              <button className="feature-btn">Take Challenge</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress</h3>
              <p>Track your learning progress across all languages</p>
              <button className="feature-btn">View Progress</button>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <h4>Code Lines Written</h4>
              <span className="stat-number">0</span>
            </div>
            <div className="stat-card">
              <h4>Challenges Completed</h4>
              <span className="stat-number">0</span>
            </div>
            <div className="stat-card">
              <h4>Days Streak</h4>
              <span className="stat-number">1</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
