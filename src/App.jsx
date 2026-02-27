import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';
import CourseLecture from './CourseLecture';
import EditorWorkspace from './EditorWorkspace';
import Achievements, { getAchievementTitle } from './Achievements';
import Challenges from './Challenges';
import FAQ from './FAQ';
import { ProgressProvider } from './ProgressContext';
// BSU logo removed from login page header per request
// import logo from './assets/batangas_state_u_logo.png';
import bikeRentalLogo from './assets/university_bike_rental_logo.png'; // Assuming you'll add this logo

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    contact: '',
    birthday: '',
    age: '',
    sex: '',
    grade: '',
    strand: '',
    section: '',
    address: '',
    email: '',
    password: '',
    role: 'student',
    employeeNumber: '',
  });
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: '', newPassword: '' });
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [userType, setUserType] = useState('student'); // 'student' | 'teacher'
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('codelab-dark') === 'true'; } catch { return false; }
  });
  const [showFaqModal, setShowFaqModal] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('codelab-dark', darkMode ? 'true' : 'false'); } catch {}
  }, [darkMode]);

  // In dev, use /api so Vite proxies to localhost:5000 (no CORS, no .env needed).
  // Otherwise use VITE_API_URL or the deployed Render URL.
  const baseUrl = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com');
  
  console.log('App - baseUrl:', baseUrl);

  // Restore auth and last page on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('codelab-auth');
      if (savedAuth) {
        const { user: savedUser, token } = JSON.parse(savedAuth);
        if (savedUser && token) {
          setUser(savedUser);
          setIsLoggedIn(true);
        }
      }
      const savedPage = localStorage.getItem('codelab-current');
      if (savedPage) {
        setCurrentCourse(savedPage);
      }
    } catch {}
  }, []);

  // Persist current page
  useEffect(() => {
    if (currentCourse) {
      localStorage.setItem('codelab-current', currentCourse);
    } else {
      localStorage.removeItem('codelab-current');
    }
  }, [currentCourse]);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg, type: 'success' });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const showAchievementToast = (achievementKey) => {
    const title = getAchievementTitle(achievementKey);
    setToast({ visible: true, message: `Achievement unlocked: ${title}`, type: 'achievement' });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Use the same baseUrl logic as ProgressContext
    const endpoint = `${baseUrl}${isLogin ? '/login' : '/signup'}`;
    const method = 'POST';

    try {
      console.log('Auth request to:', endpoint);
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isLogin
            ? { email: formData.email, password: formData.password }
            : (() => {
                const role = userType === 'teacher' ? 'teacher' : 'student';
                const payload = { ...formData, role };
                if (role === 'student' && formData.grade && ['7', '8', '9', '10'].includes(formData.grade)) payload.strand = 'N/A';
                if (role === 'teacher') {
                  if (formData.employeeNumber) {
                    const digits = String(formData.employeeNumber).replace(/\D/g, '').slice(0, 7);
                    payload.employeeNumber = digits;
                  }
                }
                return payload;
              })()
        ),
      });

      let data;
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (text.trim() === '') {
        throw new Error("Server returned an empty response. Is the backend running on port 5000?");
      }
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned invalid JSON. Is the backend running?");
        }
      } else {
        throw new Error(`Server returned non-JSON (${contentType || 'unknown'}). Is the backend running on port 5000?`);
      }

      if (response.ok) {
        if (isLogin) {
          setMessage(data.message);
          const displayName = data?.user?.fullName || data?.user?.username || 'User';
          showToast(`Login successful. Welcome, ${displayName}!`);
          setTimeout(() => {
            setUser(data.user);
            setIsLoggedIn(true);
            try {
              localStorage.setItem('codelab-auth', JSON.stringify({ user: data.user, token: data.token }));
            } catch {}
          }, 1500);
        } else {
          showToast('Account created. Please log in.');
          setMessage('');
          setIsLogin(true);
        }
      } else {
        // Check if it's a "user already exists" error during signup
        if (!isLogin && data.message && data.message.toLowerCase().includes('already exists')) {
          // Use backend message so we don't incorrectly blame just the email
          setNotificationMessage(data.message);
          setShowNotification(true);
          setMessage(''); // Clear the regular message
        } else {
          setMessage(data.message || data.error || 'An error occurred');
        }
      }
    } catch (error) {
      console.error('Network error calling', endpoint, error);
      
      // Check if it's a network error (backend down)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage('Server is temporarily unavailable. Please try again in a few moments.');
      } else {
        setMessage(`Network error: ${error?.message || 'request failed'}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'grade' && ['7', '8', '9', '10'].includes(value)) next.strand = '';
      if (name === 'employeeNumber') {
        next.employeeNumber = value.replace(/\D/g, '').slice(0, 7);
      }
      return next;
    });
  };

  const showStrand = formData.grade === '11' || formData.grade === '12';
  const GRADE_OPTIONS = ['7', '8', '9', '10', '11', '12'];
  const STRAND_OPTIONS = ['STEM', 'ABM', 'HUMSS', 'TVL'];

  const handleForgotInputChange = (e) => {
    const { name, value } = e.target;
    setForgotForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleForgotPasswordSubmit = async () => {
    setForgotStatus('');
    if (!forgotForm.email || !forgotForm.newPassword) {
      setForgotStatus('Please enter your email and a new password.');
      return;
    }
    setForgotLoading(true);
    try {
      const endpoint = `${baseUrl}/forgot-password`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotForm.email,
          newPassword: forgotForm.newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setForgotStatus(data.message || 'Password updated successfully.');
        setForgotForm({ email: '', newPassword: '' });
      } else {
        const errMsg = data.message || data.error || `Unable to update password (${response.status}).`;
        setForgotStatus(errMsg);
      }
    } catch (error) {
      console.error('Forgot password request error:', error);
      setForgotStatus('Network error: could not update password. Is the server running on port 5000?');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentCourse(null);
    try {
      localStorage.removeItem('codelab-auth');
      localStorage.removeItem('codelab-current');
    } catch {}
    setFormData({
      fullName: '',
      username: '',
      contact: '',
      birthday: '',
      age: '',
      sex: '',
      grade: '',
      strand: '',
      section: '',
      address: '',
      email: '',
      password: '',
      role: 'student',
      employeeNumber: '',
    });
    setMessage('');
  };

  const handleCourseSelect = (course) => {
    setCurrentCourse(course);
  };

  const handleBackToDashboard = () => {
    setCurrentCourse(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    try {
      const saved = localStorage.getItem('codelab-auth');
      if (saved) {
        const data = JSON.parse(saved);
        localStorage.setItem('codelab-auth', JSON.stringify({ ...data, user: updatedUser }));
      }
    } catch {}
  };

  const closeNotification = () => {
    setShowNotification(false);
    setNotificationMessage('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    closeNotification();
  };

  // If user is logged in and viewing a course/editor
  if (isLoggedIn && user && currentCourse) {
    if (currentCourse === 'EDITOR') {
      return (
        <>
          {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
          <ProgressProvider user={user} onAchievementUnlocked={showAchievementToast}>
            <EditorWorkspace onBack={handleBackToDashboard} darkMode={darkMode} />
          </ProgressProvider>
          <button type="button" className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`} onClick={() => setShowFaqModal(true)} aria-label="Open FAQ" title="FAQ">?</button>
          {showFaqModal && (<div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}><div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}><FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} /></div></div>)}
        </>
      );
    }
    if (currentCourse === 'CHALLENGES') {
      return (
        <>
          {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
          <ProgressProvider user={user} onAchievementUnlocked={showAchievementToast}>
            <Challenges onBack={handleBackToDashboard} darkMode={darkMode} user={user} onAchievementUnlocked={showAchievementToast} />
          </ProgressProvider>
          <button type="button" className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`} onClick={() => setShowFaqModal(true)} aria-label="Open FAQ" title="FAQ">?</button>
          {showFaqModal && (<div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}><div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}><FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} /></div></div>)}
        </>
      );
    }
    if (currentCourse === 'ACHIEVEMENTS') {
      return (
        <>
          {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
          <ProgressProvider user={user} onAchievementUnlocked={showAchievementToast}>
            <div className={`achievements-page${darkMode ? ' achievements-page-dark' : ''}`} style={{ padding: '1rem', minHeight: '100vh' }}>
              <button className="logout-btn" onClick={handleBackToDashboard}>← Back</button>
              <h2 style={{ marginTop: '1rem' }}>Achievements</h2>
              <Achievements baseUrl={baseUrl} user={user} darkMode={darkMode} />
            </div>
          </ProgressProvider>
          <button type="button" className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`} onClick={() => setShowFaqModal(true)} aria-label="Open FAQ" title="FAQ">?</button>
          {showFaqModal && (<div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}><div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}><FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} /></div></div>)}
        </>
      );
    }
    if (currentCourse === 'FAQ') {
      return (
        <>
          {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
          <FAQ onBack={handleBackToDashboard} darkMode={darkMode} />
          <button type="button" className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`} onClick={() => setShowFaqModal(true)} aria-label="Open FAQ" title="FAQ">?</button>
          {showFaqModal && (<div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}><div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}><FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} /></div></div>)}
        </>
      );
    }
    return (
      <>
        {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
        <ProgressProvider user={user} onAchievementUnlocked={showAchievementToast}>
          <CourseLecture course={currentCourse} onBack={handleBackToDashboard} darkMode={darkMode} />
        </ProgressProvider>
        <button type="button" className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`} onClick={() => setShowFaqModal(true)} aria-label="Open FAQ" title="FAQ">?</button>
        {showFaqModal && (<div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}><div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}><FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} /></div></div>)}
      </>
    );
  }

  // If user is logged in, show dashboard (teacher vs student)
  if (isLoggedIn && user) {
    if (user.role === 'teacher') {
      return (
        <>
          {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
          <TeacherDashboard
            user={user}
            onLogout={handleLogout}
            baseUrl={baseUrl}
            darkMode={darkMode}
            onDarkModeChange={() => setDarkMode((d) => !d)}
            onProfileUpdate={handleProfileUpdate}
          />
        </>
      );
    }
    return (
      <>
        {toast.visible && <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>}
        <ProgressProvider user={user} onAchievementUnlocked={showAchievementToast}>
          <Dashboard user={user} onLogout={handleLogout} onCourseSelect={handleCourseSelect} baseUrl={baseUrl} onProfileUpdate={handleProfileUpdate} darkMode={darkMode} onDarkModeChange={() => setDarkMode((d) => !d)} />
        </ProgressProvider>
        <button
          type="button"
          className={`faq-fab ${darkMode ? 'faq-fab-dark' : ''}`}
          onClick={() => setShowFaqModal(true)}
          aria-label="Open FAQ"
          title="FAQ"
        >
          ?
        </button>
        {showFaqModal && (
          <div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}>
            <div className={`faq-modal-box ${darkMode ? 'faq-modal-box-dark' : ''}`} onClick={(e) => e.stopPropagation()}>
              <FAQ variant="modal" onBack={() => setShowFaqModal(false)} darkMode={darkMode} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <ProgressProvider>
      <div className="login-page">
        {toast.visible && (
          <div className={`toast ${toast.type === 'achievement' ? 'toast-achievement' : 'toast-success'}`}>{toast.message}</div>
        )}
          <div className="login-container">
          <div className="login-form-section">
            {/* Logo section removed */}
            <div className="form-content">
              <div className="university-bike-rental-header">
                <img src={bikeRentalLogo} alt="CodeLab Logo" className="bike-rental-logo" />
                <div className="university-bike-rental-text">
                  <h2>CodeLab</h2>
                  <p>Think. Code. Create</p>
                </div>
              </div>
              <div className="role-tabs">
                <button
                  type="button"
                  className={`role-tab ${userType === 'student' ? 'role-tab-active' : ''}`}
                  onClick={() => { setUserType('student'); setMessage(''); setShowForgotPassword(false); }}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`role-tab ${userType === 'teacher' ? 'role-tab-active' : ''}`}
                  onClick={() => { setUserType('teacher'); setMessage(''); setShowForgotPassword(false); }}
                >
                  Teacher
                </button>
              </div>
              <h3>
                {userType === 'teacher'
                  ? (isLogin ? 'Teacher Log In' : 'Teacher Sign Up')
                  : `Please ${isLogin ? 'Log In' : 'Sign Up'}`}
              </h3>
          <form className={`login-form ${userType === 'teacher' && !isLogin ? 'login-form-teacher' : ''}`} onSubmit={handleSubmit}>
            {!isLogin && userType === 'teacher' && (
              <div className="teacher-signup-ui">
                <p className="form-section-title teacher-section-title">Create teacher account</p>
                <div className="form-row">
                  <div className="input-group teacher-input">
                    <i className="fas fa-user"></i>
                    <input type="text" placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group teacher-input">
                    <i className="fas fa-at"></i>
                    <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group teacher-input">
                    <i className="fas fa-id-badge"></i>
                    <input
                      type="text"
                      placeholder="Employee number (7 digits)"
                      name="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={handleInputChange}
                      inputMode="numeric"
                      maxLength={7}
                      required
                    />
                  </div>
                </div>
                <p className="form-section-title teacher-section-title teacher-optional">Teaching context (optional)</p>
                <div className="teacher-signup-card">
                  <div className="form-row">
                    <div className="input-group teacher-input">
                      <i className="fas fa-graduation-cap"></i>
                      <select name="grade" value={formData.grade} onChange={handleInputChange}>
                        <option value="">Grade level</option>
                        {GRADE_OPTIONS.map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    {showStrand ? (
                      <div className="input-group teacher-input">
                        <i className="fas fa-book"></i>
                        <select name="strand" value={formData.strand} onChange={handleInputChange}>
                          <option value="">Strand</option>
                          {STRAND_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="input-group teacher-input input-group-disabled">
                        <i className="fas fa-book"></i>
                        <input type="text" placeholder="Strand (Grade 11–12)" value="—" readOnly disabled />
                      </div>
                    )}
                  </div>
                  <div className="form-single">
                    <div className="input-group teacher-input">
                      <i className="fas fa-users"></i>
                      <input type="text" placeholder="Section or class" name="section" value={formData.section} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <p className="form-section-title teacher-section-title">Account</p>
              </div>
            )}
            {!isLogin && userType === 'student' && (
              <>
                <p className="form-section-title">Personal</p>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-user"></i>
                    <input type="text" placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-at"></i>
                    <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-phone"></i>
                    <input
                      type="tel"
                      placeholder="Contact number"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-calendar"></i>
                    <input type="date" placeholder="Birthday" name="birthday" value={formData.birthday} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-birthday-cake"></i>
                    <input type="number" placeholder="Age" name="age" value={formData.age} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-venus-mars"></i>
                    <select name="sex" value={formData.sex} onChange={handleInputChange} required>
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <i className="fas fa-map-marker-alt"></i>
                    <input type="text" placeholder="Address" name="address" value={formData.address} onChange={handleInputChange} required />
                  </div>
                </div>
                <p className="form-section-title">School</p>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-graduation-cap"></i>
                    <select name="grade" value={formData.grade} onChange={handleInputChange} required>
                      <option value="">Select Grade</option>
                      {GRADE_OPTIONS.map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  {showStrand ? (
                    <div className="input-group">
                      <i className="fas fa-book"></i>
                      <select name="strand" value={formData.strand} onChange={handleInputChange} required>
                        <option value="">Select Strand</option>
                        {STRAND_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="input-group input-group-disabled">
                      <i className="fas fa-book"></i>
                      <input type="text" placeholder="Strand (Grade 11–12 only)" value="—" readOnly disabled />
                    </div>
                  )}
                </div>
                <div className="form-single">
                  <div className="input-group">
                    <i className="fas fa-users"></i>
                    <input type="text" placeholder="Section" name="section" value={formData.section} onChange={handleInputChange} required />
                  </div>
                </div>
                <p className="form-section-title">Account</p>
              </>
            )}
            {isLogin && <p className="form-section-title">Account</p>}
            <div className="form-row auth-row">
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group password-group">
                <i className="fas fa-lock"></i>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye with slash (password visible)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="password-icon"
                    >
                      <path
                        d="M2 12s2.5-6 10-6c1.4 0 2.6.2 3.7.6M20.9 9.4C21.6 10.3 22 11.2 22 12c0 0-2.5 6-10 6-2 0-3.5-.4-4.8-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <line
                        x1="4"
                        y1="4"
                        x2="20"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    // Simple eye icon (password hidden)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="password-icon"
                    >
                      <path
                        d="M2 12s2.5-6 10-6 10 6 10 6-2.5 6-10 6S2 12 2 12z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="password-case-sensitive">* Password is case sensitive</p>
            {message && <p className="form-message">{message}</p>}
            <button type="submit" className="sign-in-button">{isLogin ? 'Sign In' : 'Sign Up'}</button>
            {isLogin ? (
              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  setShowForgotPassword(prev => !prev);
                  setForgotStatus('');
                }}
              >
                Forgot password?
              </button>
            ) : null}
            <p className="signup-text">
              {isLogin
                ? (userType === 'teacher' ? "Don't have a teacher account?" : "Don't have an account?")
                : (userType === 'teacher' ? "Already have a teacher account?" : "Already have an account?")}
              <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setMessage(''); }}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </a>
            </p>
            {showForgotPassword && (
              <div className="forgot-password-panel">
                <h4>Reset your password</h4>
                <div className="input-group">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={forgotForm.email}
                    onChange={handleForgotInputChange}
                  />
                </div>
                <div className="input-group password-group">
                  <i className="fas fa-lock"></i>
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    placeholder="New password"
                    name="newPassword"
                    value={forgotForm.newPassword}
                    onChange={handleForgotInputChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowForgotNewPassword(prev => !prev)}
                    aria-label={showForgotNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showForgotNewPassword ? (
                      // Eye with slash (password visible)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="password-icon"
                      >
                        <path
                          d="M2 12s2.5-6 10-6c1.4 0 2.6.2 3.7.6M20.9 9.4C21.6 10.3 22 11.2 22 12c0 0-2.5 6-10 6-2 0-3.5-.4-4.8-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <line
                          x1="4"
                          y1="4"
                          x2="20"
                          y2="20"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      // Simple eye icon (password hidden)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="password-icon"
                      >
                        <path
                          d="M2 12s2.5-6 10-6 10 6 10 6-2.5 6-10 6S2 12 2 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {forgotStatus && (
                  <p className="form-message" style={{ marginTop: '0.5rem' }}>{forgotStatus}</p>
                )}
                <button
                  type="button"
                  className="sign-in-button"
                  style={{ marginTop: '0.5rem' }}
                  onClick={handleForgotPasswordSubmit}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            )}
          </form>
            </div>
          </div>
        </div>
        
        {/* Notification Popup */}
        {showNotification && (
          <div className="notification-overlay">
            <div className="notification-popup">
              <div className="notification-header">
                <i className="fas fa-info-circle"></i>
                <h3>Account Already Exists</h3>
              </div>
              <div className="notification-content">
                <p>{notificationMessage}</p>
              </div>
              <div className="notification-actions">
                <button className="btn-secondary" onClick={closeNotification}>
                  Close
                </button>
                <button className="btn-primary" onClick={switchToLogin}>
                  Switch to Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProgressProvider>
  );
}

export default App;
