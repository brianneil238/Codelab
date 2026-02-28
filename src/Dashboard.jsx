import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useProgress } from './ProgressContext';

const MAX_PHOTO_SIZE = 500 * 1024; // 500KB
const GRADES = ['7', '8', '9', '10', '11', '12'];
const STRANDS = ['STEM', 'ABM', 'HUMSS', 'TVL'];

function Dashboard({ user, onLogout, onCourseSelect, baseUrl, onProfileUpdate, darkMode = false, onDarkModeChange }) {
  const { getCourseProgress, getOverallProgress, getStreak, stats, isLoading, refreshProgress } = useProgress();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    lastName: '', firstName: '', middleName: '', username: '', birthday: '', age: '', sex: '', address: '', grade: '', strand: '', section: '', email: '', contact: '',
  });
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementBannerDismissed, setAnnouncementBannerDismissed] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const loadAnnouncements = React.useCallback(() => {
    if (!baseUrl) return;
    const params = new URLSearchParams();
    const grade = user?.grade && user.grade !== 'N/A' ? String(user.grade) : '';
    const strand = user?.strand && user.strand !== 'N/A' ? String(user.strand) : '';
    const section = user?.section && user.section !== 'N/A' ? String(user.section) : '';
    if (grade) params.set('grade', grade);
    if (strand) params.set('strand', strand);
    if (section) params.set('section', section);
    const qs = params.toString();
    fetch(`${baseUrl}/announcements${qs ? `?${qs}` : ''}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const list = data?.announcements || [];
        setAnnouncementsList(list);
        setAnnouncement(list[0] || null);
      })
      .catch(() => {
        setAnnouncementsList([]);
        setAnnouncement(null);
      });
  }, [baseUrl]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const overallProgress = getOverallProgress();
  const streak = getStreak();

  const openProfileModal = () => {
    setShowProfileDropdown(false);
    setShowProfileModal(true);
    setProfilePreview(null);
    setProfileFile(null);
    setProfileError('');
    let lastName = user?.lastName ?? '';
    let firstName = user?.firstName ?? '';
    let middleName = user?.middleName ?? '';
    if (!lastName && !firstName && user?.fullName) {
      const parts = String(user.fullName).trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
        middleName = parts.slice(1, -1).join(' ');
      } else if (parts.length === 1) {
        firstName = parts[0];
      }
    }
    setProfileForm({
      lastName,
      firstName,
      middleName,
      username: user?.username ?? '',
      birthday: user?.birthday ?? '',
      age: user?.age !== undefined && user?.age !== null ? String(user.age) : '',
      sex: user?.sex ?? '',
      address: user?.address ?? '',
      grade: user?.grade ?? '',
      strand: user?.strand ?? '',
      section: user?.section ?? '',
      email: user?.email ?? '',
      contact: user?.contact ?? '',
    });
  };

  const toggleDarkMode = () => {
    setShowProfileDropdown(false);
    if (onDarkModeChange) onDarkModeChange();
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfilePreview(null);
    setProfileFile(null);
    setProfileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('Please choose an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setProfileError('Image must be under 500 KB.');
      return;
    }
    setProfileError('');
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'grade' && !['11', '12'].includes(value)) next.strand = 'N/A';
      return next;
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !baseUrl || !onProfileUpdate) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const payload = {
        lastName: String(profileForm.lastName ?? '').trim(),
        firstName: String(profileForm.firstName ?? '').trim(),
        middleName: String(profileForm.middleName ?? '').trim(),
        username: (profileForm.username || '').trim(),
        birthday: profileForm.birthday || null,
        age: profileForm.age === '' ? null : Number(profileForm.age),
        sex: profileForm.sex,
        address: profileForm.address,
        grade: profileForm.grade,
        strand: profileForm.grade && ['11', '12'].includes(profileForm.grade) ? profileForm.strand : 'N/A',
        section: profileForm.section,
        email: profileForm.email.trim(),
        contact: profileForm.contact ? profileForm.contact.trim() : '',
      };
      if (profileFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(profileFile);
        });
        payload.profilePhoto = base64;
      }
      const res = await fetch(`${baseUrl}/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onProfileUpdate(data.user);
        closeProfileModal();
      } else {
        setProfileError(data.message || data.error || 'Failed to update profile.');
      }
    } catch {
      setProfileError('Network error. Try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const initial = (user.fullName || user.firstName || user.username || 'U').toString().charAt(0);

  return (
    <div className={`dashboard${darkMode ? ' dashboard-dark' : ''}`}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">💻</div>
            <h1 className="logo-text">CodeLab</h1>
          </div>
          <div className="user-section" ref={dropdownRef}>
            <div className="user-profile">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setShowProfileDropdown((v) => !v)}
                aria-expanded={showProfileDropdown}
                aria-haspopup="true"
                aria-label="Profile menu"
              >
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="user-avatar-img" />
                ) : (
                  <div className="user-avatar user-avatar-placeholder" aria-hidden>{initial.toUpperCase()}</div>
                )}
                <span className="user-name">{user.username || user.fullName}</span>
                <span className="profile-dropdown-chevron" aria-hidden>▼</span>
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <button type="button" className="profile-dropdown-item" onClick={openProfileModal}>
                    <span className="profile-dropdown-icon">⚙️</span>
                    Profile settings
                  </button>
                  <button type="button" className="profile-dropdown-item" onClick={() => { setShowProfileDropdown(false); setShowAnnouncementsModal(true); loadAnnouncements(); }}>
                    <span className="profile-dropdown-icon">📢</span>
                    Announcements
                  </button>
                  <button type="button" className="profile-dropdown-item" onClick={toggleDarkMode}>
                    <span className="profile-dropdown-icon">{darkMode ? '☀️' : '🌙'}</span>
                    {darkMode ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button type="button" className="profile-dropdown-item profile-dropdown-item-logout" onClick={() => { setShowProfileDropdown(false); onLogout(); }}>
                    <span className="profile-dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAnnouncementsModal && (
        <div className="profile-modal-overlay" onClick={() => setShowAnnouncementsModal(false)}>
          <div className={`student-announcements-modal ${darkMode ? 'student-announcements-modal-dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="student-announcements-modal-header">
              <h3>Announcements</h3>
              <button type="button" className="profile-modal-close" onClick={() => setShowAnnouncementsModal(false)} aria-label="Close">×</button>
            </div>
            <div className="student-announcements-modal-body">
              {announcementsList.length === 0 ? (
                <p className="student-announcements-empty">No announcements yet. Check back later.</p>
              ) : (
                <ul className="student-announcements-list">
                  {announcementsList.map((a) => (
                    <li key={a.id} className="student-announcements-item">
                      <p className="student-announcements-item-text">{a.text}</p>
                      <span className="student-announcements-item-date">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={closeProfileModal}>
          <div className={`profile-modal profile-modal-form ${darkMode ? 'profile-modal-dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Profile</h3>
              <button type="button" className="profile-modal-close" onClick={closeProfileModal} aria-label="Close">×</button>
            </div>

            <div className="profile-modal-body">
              <aside className="profile-modal-sidebar">
                <div className="profile-modal-avatar">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" />
                  ) : user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" />
                  ) : (
                    <div className="user-avatar user-avatar-placeholder">{initial.toUpperCase()}</div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileFileChange}
                  className="profile-modal-file-input"
                  id="profile-photo-input"
                />
                <label htmlFor="profile-photo-input" className="profile-modal-photo-btn">Change photo</label>
                <span className="profile-modal-photo-hint">Max 500 KB</span>
              </aside>

              <div className="profile-modal-main">
                <section className="profile-form-section">
                  <h4 className="profile-form-section-title">Personal</h4>
                  <div className="profile-form-grid">
                  <div className="profile-form-field">
                    <label className="profile-form-label">Last Name</label>
                    <input type="text" name="lastName" value={profileForm.lastName} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">First Name</label>
                    <input type="text" name="firstName" value={profileForm.firstName} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Middle Name</label>
                    <input type="text" name="middleName" value={profileForm.middleName} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Username</label>
                    <input type="text" name="username" value={profileForm.username} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Email</label>
                    <input type="email" name="email" value={profileForm.email} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Birthday</label>
                    <input type="date" name="birthday" value={profileForm.birthday} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Age</label>
                    <input type="number" name="age" min="10" max="99" value={profileForm.age} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Sex</label>
                    <select name="sex" value={profileForm.sex} onChange={handleProfileFormChange} className="profile-form-input">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="profile-form-field profile-form-field-full">
                    <label className="profile-form-label">Contact number</label>
                    <input
                      type="tel"
                      name="contact"
                      value={profileForm.contact}
                      onChange={handleProfileFormChange}
                      className="profile-form-input"
                      placeholder="e.g. 09XX‑XXX‑XXXX"
                    />
                  </div>
                  <div className="profile-form-field profile-form-field-full">
                    <label className="profile-form-label">Address</label>
                    <input type="text" name="address" value={profileForm.address} onChange={handleProfileFormChange} className="profile-form-input" />
                  </div>
                </div>
              </section>
              <section className="profile-form-section">
                <h4 className="profile-form-section-title">School</h4>
                <div className="profile-form-grid">
                  <div className="profile-form-field">
                    <label className="profile-form-label">Grade</label>
                    <select name="grade" value={profileForm.grade} onChange={handleProfileFormChange} className="profile-form-input">
                      <option value="">Select</option>
                      {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Strand</label>
                    <select name="strand" value={profileForm.strand} onChange={handleProfileFormChange} className="profile-form-input" disabled={!['11', '12'].includes(profileForm.grade)}>
                      <option value="N/A">N/A (Grade 11–12 only)</option>
                      {STRANDS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="profile-form-field">
                    <label className="profile-form-label">Section</label>
                    <input type="text" name="section" value={profileForm.section} onChange={handleProfileFormChange} className="profile-form-input" placeholder="e.g. A" />
                  </div>
                </div>
              </section>
              </div>
            </div>

            {profileError && <p className="profile-modal-error">{profileError}</p>}
            <div className="profile-modal-actions">
              <button type="button" className="profile-modal-cancel" onClick={closeProfileModal}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-modal-save"
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <div className="dashboard-container">
          {announcement && !announcementBannerDismissed && (
            <div className={`student-announcement-banner ${darkMode ? 'student-announcement-banner-dark' : ''}`}>
              <span className="student-announcement-label">Announcement</span>
              <p className="student-announcement-text">{announcement.text}</p>
              <button
                type="button"
                className="student-announcement-dismiss"
                onClick={() => setAnnouncementBannerDismissed(true)}
                aria-label="Dismiss announcement"
              >
                ×
              </button>
            </div>
          )}

          <div className="welcome-section">
            <h2>Welcome to CodeLab!</h2>
            <p>Your coding journey starts here. Choose what you'd like to work on today.</p>
          </div>

          <div className="progress-overview">
            <div className="progress-header">
              <h3>Your Learning Progress</h3>
              <button 
                className="refresh-btn" 
                onClick={refreshProgress}
                disabled={isLoading}
                title="Refresh progress from server"
              >
                {isLoading ? '⟳' : '↻'}
              </button>
            </div>
            {isLoading ? (
              <div className="loading-message">Loading your progress...</div>
            ) : (
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
            )}
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
                <span className="progress-breakdown">{getCourseProgress('HTML').lecturesMarkedComplete ?? 0}/{getCourseProgress('HTML').totalLectures ?? 6} lectures completed · {getCourseProgress('HTML').quizzesTaken ?? 0}/{getCourseProgress('HTML').totalLectures ?? 6} quizzes taken</span>
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
                <span className="progress-breakdown">{getCourseProgress('C++').lecturesMarkedComplete ?? 0}/{getCourseProgress('C++').totalLectures ?? 6} lectures completed · {getCourseProgress('C++').quizzesTaken ?? 0}/{getCourseProgress('C++').totalLectures ?? 6} quizzes taken</span>
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
                <span className="progress-breakdown">{getCourseProgress('Python').lecturesMarkedComplete ?? 0}/{getCourseProgress('Python').totalLectures ?? 6} lectures completed · {getCourseProgress('Python').quizzesTaken ?? 0}/{getCourseProgress('Python').totalLectures ?? 6} quizzes taken</span>
              </div>
              <button className="feature-btn" onClick={() => onCourseSelect('Python')}>Start Python Course</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Code Editor</h3>
              <p>Write and test your code in our integrated editor</p>
              <button className="feature-btn" onClick={() => onCourseSelect('EDITOR')}>Start Coding</button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Challenges</h3>
              <p>Test your skills with programming challenges</p>
              <button className="feature-btn" onClick={() => onCourseSelect('CHALLENGES')}>
                Take Challenge
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏅</div>
              <h3>Achievements</h3>
              <p>View your badges, milestones, and learning streaks</p>
              <button className="feature-btn" onClick={() => onCourseSelect('ACHIEVEMENTS')}>
                View Achievements
              </button>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <h4>Code Lines Written</h4>
              <span className="stat-number">{stats?.code_lines_written ?? 0}</span>
            </div>
            <div className="stat-card">
              <h4>Challenges Completed</h4>
              <span className="stat-number">{stats?.challenges_completed ?? 0}</span>
            </div>
            <div className="stat-card">
              <h4>Days Streak</h4>
              <span className="stat-number">{streak.current_streak || 0}</span>
            </div>
          </div>

          {/* Debug panel removed */}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
