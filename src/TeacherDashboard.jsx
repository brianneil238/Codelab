import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';

const MAX_PHOTO_SIZE = 500 * 1024; // 500KB
const GRADES = ['7', '8', '9', '10', '11', '12'];
const STRANDS = ['STEM', 'ABM', 'HUMSS', 'TVL'];

function TeacherDashboard({ user, onLogout, baseUrl: baseUrlProp, darkMode = false, onDarkModeChange, onProfileUpdate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStrand, setFilterStrand] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [classSummary, setClassSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [classDetail, setClassDetail] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [announcementPublishAt, setAnnouncementPublishAt] = useState(''); // datetime-local string
  const [announcementTargetGrade, setAnnouncementTargetGrade] = useState('');
  const [announcementTargetStrand, setAnnouncementTargetStrand] = useState('');
  const [announcementTargetSection, setAnnouncementTargetSection] = useState('');
  const [announcementSending, setAnnouncementSending] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementEditingId, setAnnouncementEditingId] = useState(null);
  const [announcementEditingText, setAnnouncementEditingText] = useState('');
  const [announcementEditingPinned, setAnnouncementEditingPinned] = useState(false);
  const [announcementEditingPublishAt, setAnnouncementEditingPublishAt] = useState(''); // datetime-local string
  const [announcementEditingTargetGrade, setAnnouncementEditingTargetGrade] = useState('');
  const [announcementEditingTargetStrand, setAnnouncementEditingTargetStrand] = useState('');
  const [announcementEditingTargetSection, setAnnouncementEditingTargetSection] = useState('');
  const [announcementEditingSaving, setAnnouncementEditingSaving] = useState(false);
  const [announcementDeletingId, setAnnouncementDeletingId] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    fullName: '', username: '', birthday: '', age: '', sex: '', address: '', grade: '', strand: '', section: '', email: '',
  });
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const studentsPanelRef = useRef(null);
  const [expandedHierarchy, setExpandedHierarchy] = useState({});
  const [showStudentsList, setShowStudentsList] = useState(true);
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [showCompletionByCourse, setShowCompletionByCourse] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewGrade, setOverviewGrade] = useState('');
  const [overviewStrand, setOverviewStrand] = useState('');
  const [overviewSection, setOverviewSection] = useState('');
  const [attentionModalOpen, setAttentionModalOpen] = useState(false);
  const [attentionModalType, setAttentionModalType] = useState('low'); // 'low' | 'inactive'
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionModalCourse, setCompletionModalCourse] = useState('HTML'); // 'HTML' | 'C++' | 'Python'
  const [completionModalStatus, setCompletionModalStatus] = useState('inProgress'); // 'completed' | 'inProgress' | 'notStarted'
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [studentsModalRefreshing, setStudentsModalRefreshing] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null); // { student, displayName } when confirmation dialog is open
  const [studentPhotoZoom, setStudentPhotoZoom] = useState(null); // { url, name } or null

  const baseUrl = baseUrlProp ?? (import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com'));

  const toDatetimeLocal = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const tz = dt.getTimezoneOffset() * 60000;
    return new Date(dt.getTime() - tz).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setStudentPhotoZoom(null);
    };
    if (studentPhotoZoom) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [studentPhotoZoom]);

  useEffect(() => {
    const handleEscapeConfirm = (e) => {
      if (e.key === 'Escape') setDeleteConfirmStudent(null);
    };
    if (deleteConfirmStudent) {
      document.addEventListener('keydown', handleEscapeConfirm);
      return () => document.removeEventListener('keydown', handleEscapeConfirm);
    }
  }, [deleteConfirmStudent]);

  useEffect(() => {
    if (announcementTargetGrade && !['11', '12'].includes(String(announcementTargetGrade))) {
      setAnnouncementTargetStrand('');
    }
  }, [announcementTargetGrade]);

  useEffect(() => {
    if (announcementEditingTargetGrade && !['11', '12'].includes(String(announcementEditingTargetGrade))) {
      setAnnouncementEditingTargetStrand('');
    }
  }, [announcementEditingTargetGrade]);

  const openProfileModal = () => {
    setShowProfileDropdown(false);
    setShowProfileModal(true);
    setProfilePreview(null);
    setProfileFile(null);
    setProfileError('');
    setProfileForm({
      fullName: user?.fullName ?? '',
      username: user?.username ?? '',
      birthday: user?.birthday ?? '',
      age: user?.age !== undefined && user?.age !== null ? String(user.age) : '',
      sex: user?.sex ?? '',
      address: user?.address ?? '',
      grade: user?.grade ?? '',
      strand: user?.strand ?? '',
      section: user?.section ?? '',
      email: user?.email ?? '',
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
        fullName: profileForm.fullName.trim(),
        username: profileForm.username.trim(),
        birthday: profileForm.birthday || null,
        age: profileForm.age === '' ? null : Number(profileForm.age),
        sex: profileForm.sex,
        address: profileForm.address,
        grade: profileForm.grade,
        strand: profileForm.grade && ['11', '12'].includes(profileForm.grade) ? profileForm.strand : 'N/A',
        section: profileForm.section,
        email: profileForm.email.trim(),
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

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await fetch(`${baseUrl}/students`);
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load students');
        }
        const data = await resp.json();
        setStudents(data.students || []);
      } catch (e) {
        setError(e.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    const loadClassSummary = async () => {
      setSummaryLoading(true);
      try {
        const resp = await fetch(`${baseUrl}/teacher/class-summary`);
        if (resp.ok) {
          const data = await resp.json();
          setClassSummary(data);
        }
      } catch {
        setClassSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };
    const loadClassDetail = async () => {
      try {
        const resp = await fetch(`${baseUrl}/teacher/class-detail`);
        if (resp.ok) {
          const data = await resp.json();
          setClassDetail(data.students || []);
        }
      } catch {
        setClassDetail([]);
      }
    };
    const loadAnnouncements = async () => {
      try {
        const resp = await fetch(`${baseUrl}/teacher/announcements`);
        if (resp.ok) {
          const data = await resp.json();
          setAnnouncements(data.announcements || []);
        } else {
          const data = await resp.json().catch(() => ({}));
          setAnnouncements([]);
          if (resp.status === 404) {
            setAnnouncementError('Announcements endpoint not found (404). Restart the backend server (port 5000) to load the latest announcement features.');
          } else {
            setAnnouncementError(data.message || data.error || `Failed to load announcements (${resp.status}).`);
          }
        }
      } catch {
        setAnnouncements([]);
      }
    };
    loadStudents();
    loadClassSummary();
    loadClassDetail();
    loadAnnouncements();
  }, [baseUrl, refreshKey]);

  // Refetch students and class detail when opening the Students modal so list shows up-to-date names/photos
  useEffect(() => {
    if (!studentsModalOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const [studentsRes, detailRes] = await Promise.all([
          fetch(`${baseUrl}/students`),
          fetch(`${baseUrl}/teacher/class-detail`),
        ]);
        if (cancelled) return;
        if (studentsRes.ok) {
          const d = await studentsRes.json();
          setStudents(d.students || []);
        }
        if (detailRes.ok) {
          const d = await detailRes.json();
          setClassDetail(d.students || []);
        }
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [baseUrl, studentsModalOpen]);

  const refreshStudentsModal = async () => {
    setStudentsModalRefreshing(true);
    try {
      const [studentsRes, detailRes] = await Promise.all([
        fetch(`${baseUrl}/students`),
        fetch(`${baseUrl}/teacher/class-detail`),
      ]);
      if (studentsRes.ok) {
        const d = await studentsRes.json();
        setStudents(d.students || []);
      }
      if (detailRes.ok) {
        const d = await detailRes.json();
        setClassDetail(d.students || []);
      }
    } catch (_) {}
    finally {
      setStudentsModalRefreshing(false);
    }
  };

  const performDeleteStudent = async (student) => {
    setDeletingStudentId(student.id);
    setDeleteConfirmStudent(null);
    try {
      const res = await fetch(`${baseUrl}/users/${student.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to delete student');
        return;
      }
      if (selectedStudent?.id === student.id) setSelectedStudent(null);
      setStudentProgress(null);
      await refreshStudentsModal();
    } catch {
      alert('Network error. Could not delete student.');
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentProgress(null);
    setProgressLoading(true);
    try {
      const resp = await fetch(`${baseUrl}/progress/${student.id}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load progress');
      }
      const data = await resp.json();
      const summary = summarizeProgress(data.progress || []);
      setStudentProgress(summary);
    } catch (e) {
      setStudentProgress({ error: e.message || 'Failed to load progress' });
    } finally {
      setProgressLoading(false);
    }
  };

  // Match student-side progress logic (ProgressContext): 6 lectures per course, progress = % of
  // lecture slots where BOTH lecture and quiz are completed; overall = average of course progress.
  const summarizeProgress = (items) => {
    const courses = ['HTML', 'C++', 'Python'];
    const lectureIds = [1, 2, 3, 4, 5, 6];
    const totalPerCourse = 6;

    const byCourse = {};
    courses.forEach((course) => {
      let completedLectures = 0;
      let completedQuizzes = 0;
      let fullyComplete = 0;

      lectureIds.forEach((id) => {
        const lectureDone = items.some(
          (p) =>
            p.course === course &&
            String(p.lecture_id) === String(id) &&
            p.type === 'lecture' &&
            p.completed,
        );
        const quizDone = items.some(
          (p) =>
            p.course === course &&
            String(p.lecture_id) === String(id) &&
            p.type === 'quiz' &&
            p.completed,
        );
        if (lectureDone) completedLectures++;
        if (quizDone) completedQuizzes++;
        if (lectureDone && quizDone) fullyComplete++;
      });

      const percentage =
        totalPerCourse > 0 ? Math.round((fullyComplete / totalPerCourse) * 100) : 0;

      byCourse[course] = {
        totalLectures: totalPerCourse,
        completedLectures,
        totalQuizzes: totalPerCourse,
        completedQuizzes,
        progress: percentage,
      };
    });

    const overall =
      courses.length > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + (byCourse[c]?.progress || 0), 0) / courses.length,
          )
        : 0;

    return { courses: byCourse, overall };
  };

  // Filter and sort students for the list
  const filteredStudents = React.useMemo(() => {
    let list = students.filter((s) => {
      const name = (s.full_name || s.username || '').toLowerCase();
      const username = (s.username || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      if (q && !name.includes(q) && !username.includes(q) && !email.includes(q)) return false;
      if (filterGrade && (s.grade || '') !== filterGrade) return false;
      if (filterStrand && (s.strand || '') !== filterStrand) return false;
      if (filterSection && (s.section || '') !== filterSection) return false;
      return true;
    });
    const order = sortBy === 'name-desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      const na = (a.full_name || a.username || '').toLowerCase();
      const nb = (b.full_name || b.username || '').toLowerCase();
      return order * (na < nb ? -1 : na > nb ? 1 : 0);
    });
    return list;
  }, [students, searchQuery, sortBy, filterGrade, filterStrand, filterSection]);

  // Group students by grade → strand (if 11/12) → section
  const studentsByGradeStrandSection = React.useMemo(() => {
    const byGrade = {};
    for (const s of filteredStudents) {
      const g = String(s.grade || '').trim() || '—';
      const is1112 = g === '11' || g === '12';
      const str = is1112 ? (String(s.strand || '').trim() || '—') : '';
      const sec = String(s.section || '').trim() || '—';
      if (!byGrade[g]) byGrade[g] = {};
      if (!byGrade[g][str]) byGrade[g][str] = {};
      if (!byGrade[g][str][sec]) byGrade[g][str][sec] = [];
      byGrade[g][str][sec].push(s);
    }
    return byGrade;
  }, [filteredStudents]);

  const toggleExpanded = (key) => {
    setExpandedHierarchy((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const isExpanded = (key) => expandedHierarchy[key] !== false;

  const getLastActiveText = (lastActivity) => {
    if (!lastActivity) return 'Never';
    const d = new Date(lastActivity);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    return d.toLocaleDateString();
  };

  /** Format as "Last Name, First Name Middle Initial" from full_name string (fallback when no parts). */
  const formatLastFirstMI = (fullName) => {
    if (!fullName || !String(fullName).trim()) return '';
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    const first = parts[0];
    const middleParts = parts.slice(1, -1);
    const middleInitial = middleParts.length ? (middleParts[0][0] || '').toUpperCase() + '.' : '';
    return middleInitial ? `${last}, ${first} ${middleInitial}` : `${last}, ${first}`;
  };

  /** Prefer "Last Name, First Name Middle Initial" from last_name/first_name/middle_name when present. */
  const formatStudentDisplayName = (s) => {
    if (!s) return '';
    const ln = (s.last_name || '').toString().trim();
    const fn = (s.first_name || '').toString().trim();
    const mn = (s.middle_name || '').toString().trim();
    if (ln || fn) {
      const mi = mn ? (mn[0] || '').toUpperCase() + '.' : '';
      const firstPart = fn + (mi ? ` ${mi}` : '');
      return ln ? `${ln}, ${firstPart}`.trim() : firstPart.trim();
    }
    return formatLastFirstMI(s.full_name) || '';
  };

  const detailByStudentId = React.useMemo(() => {
    const map = {};
    (classDetail || []).forEach((s) => { map[s.id] = s; });
    return map;
  }, [classDetail]);

  const INACTIVE_DAYS = 7;
  const LOW_PROGRESS_PCT = 20;

  // Filter classDetail by overview search + grade/strand/section (shared by Needs attention & Completion by course)
  const overviewFiltered = React.useMemo(() => {
    const list = classDetail || [];
    const q = (overviewSearch || '').trim().toLowerCase();
    return list.filter((s) => {
      if (q) {
        const name = (s.full_name || s.username || '').toLowerCase();
        const username = (s.username || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        if (!name.includes(q) && !username.includes(q) && !email.includes(q)) return false;
      }
      if (overviewGrade && (s.grade || '') !== overviewGrade) return false;
      if (overviewStrand && (s.strand || '') !== overviewStrand) return false;
      if (overviewSection && (s.section || '') !== overviewSection) return false;
      return true;
    });
  }, [classDetail, overviewSearch, overviewGrade, overviewStrand, overviewSection]);

  // Alerts for the whole class (used for tab badge + overview summary)
  const alertsAll = React.useMemo(() => {
    const list = classDetail || [];
    const lowProgress = list.filter((s) => (s.overallProgress ?? 0) < LOW_PROGRESS_PCT);
    const inactive = list.filter((s) => {
      if (!s.lastActivity) return true;
      const days = (Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000);
      return days >= INACTIVE_DAYS;
    });
    return { lowProgress, inactive };
  }, [classDetail]);

  const needsAttentionUniqueCountAll = React.useMemo(() => {
    const ids = new Set();
    alertsAll.lowProgress.forEach((s) => ids.add(s.id));
    alertsAll.inactive.forEach((s) => ids.add(s.id));
    return ids.size;
  }, [alertsAll]);

  const alerts = React.useMemo(() => {
    const list = overviewFiltered;
    const lowProgress = list.filter((s) => (s.overallProgress ?? 0) < LOW_PROGRESS_PCT);
    const inactive = list.filter((s) => {
      if (!s.lastActivity) return true;
      const days = (Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000);
      return days >= INACTIVE_DAYS;
    });
    return { lowProgress, inactive };
  }, [overviewFiltered]);

  const needsAttentionUniqueCount = React.useMemo(() => {
    const ids = new Set();
    alerts.lowProgress.forEach((s) => ids.add(s.id));
    alerts.inactive.forEach((s) => ids.add(s.id));
    return ids.size;
  }, [alerts]);

  const attentionRows = React.useMemo(() => {
    const list = attentionModalType === 'inactive' ? alerts.inactive : alerts.lowProgress;
    const rows = [...list];
    if (attentionModalType === 'inactive') {
      rows.sort((a, b) => {
        const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : -1;
        const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : -1;
        if (ta !== tb) return ta - tb; // oldest first; never(-1) first
        const na = (a.full_name || a.username || '').toLowerCase();
        const nb = (b.full_name || b.username || '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
    } else {
      rows.sort((a, b) => {
        const pa = a.overallProgress ?? 0;
        const pb = b.overallProgress ?? 0;
        if (pa !== pb) return pa - pb;
        const na = (a.full_name || a.username || '').toLowerCase();
        const nb = (b.full_name || b.username || '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
    }
    return rows;
  }, [alerts, attentionModalType]);

  const closeAttentionModal = () => setAttentionModalOpen(false);

  // Completion buckets (detailed) from filtered list for modal drill-down
  const completionBuckets = React.useMemo(() => {
    const courses = ['HTML', 'C++', 'Python'];
    const out = { HTML: { completed: [], inProgress: [], notStarted: [] }, 'C++': { completed: [], inProgress: [], notStarted: [] }, Python: { completed: [], inProgress: [], notStarted: [] } };
    (overviewFiltered || []).forEach((s) => {
      courses.forEach((course) => {
        const pct = course === 'HTML' ? s.htmlProgress : course === 'C++' ? s.cppProgress : s.pythonProgress;
        const coursePct = pct ?? 0;
        const row = { ...s, coursePct };
        if (coursePct >= 100) out[course].completed.push(row);
        else if (coursePct > 0) out[course].inProgress.push(row);
        else out[course].notStarted.push(row);
      });
    });
    return out;
  }, [overviewFiltered]);

  const openCompletionModal = (course) => {
    const c = completionBuckets[course] || { completed: [], inProgress: [], notStarted: [] };
    const defaultStatus = c.inProgress.length > 0 ? 'inProgress' : c.completed.length > 0 ? 'completed' : 'notStarted';
    setCompletionModalCourse(course);
    setCompletionModalStatus(defaultStatus);
    setCompletionModalOpen(true);
  };
  const closeCompletionModal = () => setCompletionModalOpen(false);

  const completionModalRows = React.useMemo(() => {
    const list = (completionBuckets[completionModalCourse] || { completed: [], inProgress: [], notStarted: [] })[completionModalStatus] || [];
    const rows = [...list];
    if (completionModalStatus === 'inProgress') {
      rows.sort((a, b) => {
        const pa = a.coursePct ?? 0;
        const pb = b.coursePct ?? 0;
        if (pa !== pb) return pb - pa; // highest first
        const na = (a.full_name || a.username || '').toLowerCase();
        const nb = (b.full_name || b.username || '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
    } else if (completionModalStatus === 'notStarted') {
      rows.sort((a, b) => {
        const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : -1;
        const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : -1;
        if (ta !== tb) return ta - tb; // oldest/never first
        const na = (a.full_name || a.username || '').toLowerCase();
        const nb = (b.full_name || b.username || '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
    } else {
      rows.sort((a, b) => {
        const na = (a.full_name || a.username || '').toLowerCase();
        const nb = (b.full_name || b.username || '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
    }
    return rows;
  }, [completionBuckets, completionModalCourse, completionModalStatus]);

  /** Groups for Students modal: by grade → strand (if 11/12) → section, each group sorted A–Z by name */
  const studentsModalGroups = React.useMemo(() => {
    const groups = [];
    const gss = studentsByGradeStrandSection;
    for (const g of GRADES) {
      if (!gss[g]) continue;
      const byStrand = gss[g];
      const strandKeys = (g === '11' || g === '12')
        ? [...STRANDS, ''].filter((s) => byStrand[s] != null)
        : Object.keys(byStrand);
      for (const str of strandKeys) {
        if (!byStrand[str]) continue;
        const bySection = byStrand[str];
        const sections = Object.keys(bySection).sort();
        for (const sec of sections) {
          const list = [...(bySection[sec] || [])].sort((a, b) => {
            const na = (a.full_name || a.username || '').toLowerCase();
            const nb = (b.full_name || b.username || '').toLowerCase();
            return na < nb ? -1 : na > nb ? 1 : 0;
          });
          if (list.length === 0) continue;
          const strandLabel = (g === '11' || g === '12') && str ? ` ${str}` : '';
          const sectionLabel = sec && sec !== '—' ? ` ${sec}` : (sec === '—' ? '' : ` ${sec}`);
          const label = `Grade ${g}${strandLabel}${sectionLabel}`.trim() || `Grade ${g}`;
          groups.push({ label, students: list });
        }
      }
    }
    return groups;
  }, [studentsByGradeStrandSection]);

  // Per-course completion buckets from filtered list
  const perCourseBuckets = React.useMemo(() => {
    const list = overviewFiltered;
    const out = { HTML: { completed: [], inProgress: [], notStarted: [] }, 'C++': { completed: [], inProgress: [], notStarted: [] }, Python: { completed: [], inProgress: [], notStarted: [] } };
    const courses = ['HTML', 'C++', 'Python'];
    list.forEach((s) => {
      const name = s.full_name || s.username || '—';
      courses.forEach((course) => {
        const pct = course === 'HTML' ? s.htmlProgress : course === 'C++' ? s.cppProgress : s.pythonProgress;
        const v = pct ?? 0;
        if (v >= 100) out[course].completed.push(name);
        else if (v > 0) out[course].inProgress.push(name);
        else out[course].notStarted.push(name);
      });
    });
    return out;
  }, [overviewFiltered]);

  // Per-course completion buckets for the whole class (used in Overview tab summary)
  const perCourseBucketsAll = React.useMemo(() => {
    const list = classDetail || [];
    const out = { HTML: { completed: [], inProgress: [], notStarted: [] }, 'C++': { completed: [], inProgress: [], notStarted: [] }, Python: { completed: [], inProgress: [], notStarted: [] } };
    const courses = ['HTML', 'C++', 'Python'];
    list.forEach((s) => {
      const name = s.full_name || s.username || '—';
      courses.forEach((course) => {
        const pct = course === 'HTML' ? s.htmlProgress : course === 'C++' ? s.cppProgress : s.pythonProgress;
        const v = pct ?? 0;
        if (v >= 100) out[course].completed.push(name);
        else if (v > 0) out[course].inProgress.push(name);
        else out[course].notStarted.push(name);
      });
    });
    return out;
  }, [classDetail]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await fetch(`${baseUrl}/teacher/export-progress`);
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codelab-progress.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const handlePostAnnouncement = async () => {
    const text = announcementText.trim();
    if (!text || announcementSending) return;
    setAnnouncementSending(true);
    setAnnouncementError('');
    try {
      const target = {
        ...(announcementTargetGrade ? { grade: String(announcementTargetGrade) } : {}),
        ...(announcementTargetStrand ? { strand: String(announcementTargetStrand) } : {}),
        ...(announcementTargetSection ? { section: String(announcementTargetSection) } : {}),
      };
      const publish_at = announcementPublishAt ? new Date(announcementPublishAt).toISOString() : null;
      const resp = await fetch(`${baseUrl}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          pinned: !!announcementPinned,
          publish_at,
          target: Object.keys(target).length ? target : null,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setAnnouncementText('');
        setAnnouncementPinned(false);
        setAnnouncementPublishAt('');
        setAnnouncementTargetGrade('');
        setAnnouncementTargetStrand('');
        setAnnouncementTargetSection('');
        setAnnouncements((prev) => [{
          id: data.id,
          text: data.text,
          created_at: data.created_at,
          pinned: !!data.pinned,
          publish_at: data.publish_at || null,
          target: data.target || null,
        }, ...prev]);
      } else {
        setAnnouncementError(data.message || data.error || `Failed to post (${resp.status}). Restart the server if you just added announcements.`);
      }
    } catch (err) {
      setAnnouncementError(err.message || 'Network error. Is the server running?');
    } finally {
      setAnnouncementSending(false);
    }
  };

  const startEditAnnouncement = (a) => {
    setAnnouncementEditingId(a.id);
    setAnnouncementEditingText(a.text || '');
    setAnnouncementEditingPinned(!!a.pinned);
    setAnnouncementEditingPublishAt(toDatetimeLocal(a.publish_at));
    setAnnouncementEditingTargetGrade(a?.target?.grade ? String(a.target.grade) : '');
    setAnnouncementEditingTargetStrand(a?.target?.strand ? String(a.target.strand) : '');
    setAnnouncementEditingTargetSection(a?.target?.section ? String(a.target.section) : '');
    setAnnouncementError('');
  };
  const cancelEditAnnouncement = () => {
    setAnnouncementEditingId(null);
    setAnnouncementEditingText('');
    setAnnouncementEditingPinned(false);
    setAnnouncementEditingPublishAt('');
    setAnnouncementEditingTargetGrade('');
    setAnnouncementEditingTargetStrand('');
    setAnnouncementEditingTargetSection('');
  };
  const saveEditAnnouncement = async () => {
    const text = announcementEditingText.trim();
    if (!announcementEditingId || !text || announcementEditingSaving) return;
    setAnnouncementEditingSaving(true);
    setAnnouncementError('');
    try {
      const target = {
        ...(announcementEditingTargetGrade ? { grade: String(announcementEditingTargetGrade) } : {}),
        ...(announcementEditingTargetStrand ? { strand: String(announcementEditingTargetStrand) } : {}),
        ...(announcementEditingTargetSection ? { section: String(announcementEditingTargetSection) } : {}),
      };
      const publish_at = announcementEditingPublishAt ? new Date(announcementEditingPublishAt).toISOString() : null;
      const resp = await fetch(`${baseUrl}/announcements/${announcementEditingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          pinned: !!announcementEditingPinned,
          publish_at,
          target: Object.keys(target).length ? target : null,
        }),
      });
      const contentType = resp.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await resp.json().catch(() => ({}))
        : {};
      if (!resp.ok) {
        if (resp.status === 404 && (!data || (!data.message && !data.error))) {
          throw new Error('Edit failed (404). Restart the backend server (port 5000) so the new edit/delete routes are available.');
        }
        throw new Error(data.message || data.error || `Failed to edit (${resp.status}).`);
      }
      setAnnouncements((prev) => prev.map((x) => (
        x.id === announcementEditingId
          ? { ...x, text: data.text, pinned: !!data.pinned, publish_at: data.publish_at || null, target: data.target || null }
          : x
      )));
      cancelEditAnnouncement();
    } catch (e) {
      setAnnouncementError(e.message || 'Failed to edit announcement.');
    } finally {
      setAnnouncementEditingSaving(false);
    }
  };
  const deleteAnnouncement = async (id) => {
    if (!id || announcementDeletingId) return;
    if (!window.confirm('Delete this announcement?')) return;
    setAnnouncementDeletingId(id);
    setAnnouncementError('');
    try {
      const resp = await fetch(`${baseUrl}/announcements/${id}`, { method: 'DELETE' });
      const contentType = resp.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await resp.json().catch(() => ({}))
        : {};
      if (!resp.ok) {
        if (resp.status === 404 && (!data || (!data.message && !data.error))) {
          throw new Error('Delete failed (404). Restart the backend server (port 5000) so the new edit/delete routes are available.');
        }
        throw new Error(data.message || data.error || `Failed to delete (${resp.status}).`);
      }
      setAnnouncements((prev) => prev.filter((x) => x.id !== id));
      if (announcementEditingId === id) cancelEditAnnouncement();
    } catch (e) {
      setAnnouncementError(e.message || 'Failed to delete announcement.');
    } finally {
      setAnnouncementDeletingId(null);
    }
  };

  const initial = user?.fullName ? user.fullName.charAt(0) : (user?.username || 'T').charAt(0);

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
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="user-avatar-img" />
                ) : (
                  <div className="user-avatar">{initial}</div>
                )}
                <span className="user-name">{user?.username || user?.fullName}</span>
                <span className="profile-dropdown-chevron" aria-hidden>▼</span>
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <button type="button" className="profile-dropdown-item" onClick={openProfileModal}>
                    <span className="profile-dropdown-icon">⚙️</span>
                    Profile settings
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
                  ) : user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" />
                  ) : (
                    <div className="user-avatar">{initial}</div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileFileChange}
                  className="profile-modal-file-input"
                  id="teacher-profile-photo-input"
                />
                <label htmlFor="teacher-profile-photo-input" className="profile-modal-photo-btn">Change photo</label>
                <span className="profile-modal-photo-hint">Max 500 KB</span>
              </aside>
              <div className="profile-modal-main">
                <section className="profile-form-section">
                  <h4 className="profile-form-section-title">Personal</h4>
                  <div className="profile-form-grid">
                    <div className="profile-form-field">
                      <label className="profile-form-label">Full name</label>
                      <input type="text" name="fullName" value={profileForm.fullName} onChange={handleProfileFormChange} className="profile-form-input" />
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
              <button type="button" className="profile-modal-cancel" onClick={closeProfileModal}>Cancel</button>
              <button type="button" className="profile-modal-save" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="teacher-dashboard-layout">
            {!loading && (
              <aside className="teacher-sidebar" aria-label="Dashboard sections">
                <nav className="teacher-tabs">
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'overview' ? 'teacher-tab-active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'needs-attention' ? 'teacher-tab-active' : ''}`}
                    onClick={() => { setActiveTab('needs-attention'); setShowNeedsAttention(true); }}
                  >
                    Needs attention
                    {classDetail?.length > 0 && needsAttentionUniqueCountAll > 0 && (
                      <span className="teacher-tab-badge">{needsAttentionUniqueCountAll}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'completion' ? 'teacher-tab-active' : ''}`}
                    onClick={() => { setActiveTab('completion'); setShowCompletionByCourse(true); }}
                  >
                    Completion
                  </button>
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'students' ? 'teacher-tab-active' : ''}`}
                    onClick={() => setActiveTab('students')}
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'announcements' ? 'teacher-tab-active' : ''}`}
                    onClick={() => setActiveTab('announcements')}
                  >
                    Announcements
                  </button>
                </nav>
              </aside>
            )}
            <div className="teacher-main-content">
          <div className="welcome-section">
            <h2>Welcome back</h2>
            <p>View your class progress and see how everyone is doing with HTML, C++, and Python.</p>
          </div>

          {error && (
            <div className="teacher-error">
              {error}
            </div>
          )}

          {!loading && (
            <div className="teacher-class-summary">
              <div className="teacher-summary-stat">
                <span className="teacher-summary-value">
                  {summaryLoading ? '…' : (classSummary?.totalStudents ?? students.length)}
                </span>
                <span className="teacher-summary-label">Total students</span>
              </div>
              <div className="teacher-summary-stat">
                <span className="teacher-summary-value">
                  {summaryLoading ? '…' : (classSummary?.averageProgress != null ? `${classSummary.averageProgress}%` : '—')}
                </span>
                <span className="teacher-summary-label">Average progress</span>
              </div>
              <div className="teacher-summary-stat">
                <span className="teacher-summary-value">
                  {summaryLoading ? '…' : (classSummary?.studentsWithProgress != null ? classSummary.studentsWithProgress : '—')}
                </span>
                <span className="teacher-summary-label">Started at least one</span>
              </div>
              <div className="teacher-summary-export">
                <button type="button" className="teacher-refresh-btn" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading} title="Refresh class data">
                  Refresh
                </button>
                <button type="button" className="teacher-export-btn" onClick={handleExport} disabled={exporting || loading}>
                  {exporting ? 'Exporting…' : 'Export progress (CSV)'}
                </button>
              </div>
            </div>
          )}

              {!loading && activeTab === 'overview' && (
            <div className="teacher-overview-cards">
              <div className="teacher-overview-card" onClick={() => { setActiveTab('needs-attention'); setShowNeedsAttention(true); }}>
                <span className="teacher-overview-card-icon">⚠️</span>
                <h4 className="teacher-overview-card-title">Needs attention</h4>
                <p className="teacher-overview-card-desc">
                  {classDetail?.length > 0 && needsAttentionUniqueCountAll > 0
                    ? `${needsAttentionUniqueCountAll} student(s) with low progress or no recent activity`
                    : 'No one needs attention right now'}
                </p>
                <span className="teacher-overview-card-action">View →</span>
              </div>
              <div className="teacher-overview-card" onClick={() => { setActiveTab('completion'); setShowCompletionByCourse(true); }}>
                <span className="teacher-overview-card-icon">📋</span>
                <h4 className="teacher-overview-card-title">Completion by course</h4>
                <p className="teacher-overview-card-desc">
                  {classDetail?.length > 0
                    ? ['HTML', 'C++', 'Python'].map((c) => `${c}: ${perCourseBucketsAll[c].completed.length} done, ${perCourseBucketsAll[c].inProgress.length} in progress`).join(' · ')
                    : 'View who completed each course'}
                </p>
                <span className="teacher-overview-card-action">View →</span>
              </div>
              <div className="teacher-overview-card" onClick={() => setActiveTab('students')}>
                <span className="teacher-overview-card-icon">👥</span>
                <h4 className="teacher-overview-card-title">Your students</h4>
                <p className="teacher-overview-card-desc">
                  {students.length} student{students.length !== 1 ? 's' : ''} · Browse by grade, strand, and section
                </p>
                <span className="teacher-overview-card-action">View →</span>
              </div>
              <div className="teacher-overview-card" onClick={() => setActiveTab('announcements')}>
                <span className="teacher-overview-card-icon">📢</span>
                <h4 className="teacher-overview-card-title">Announcements</h4>
                <p className="teacher-overview-card-desc">
                  Post and manage messages students see on their dashboard
                </p>
                <span className="teacher-overview-card-action">View →</span>
              </div>
            </div>
          )}

          {!loading && activeTab === 'needs-attention' && (classDetail?.length > 0) && (
            <div className="teacher-alerts">
              <h3 className="teacher-alerts-title">Needs attention</h3>
              <div className="teacher-list-controls">
                <input
                  type="search"
                  placeholder="Search by name, username, or email..."
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
                  className="teacher-search-input"
                  aria-label="Search for needs attention"
                />
                <div className="teacher-sort-filter">
                  <select
                    value={overviewGrade}
                    onChange={(e) => setOverviewGrade(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by grade"
                  >
                    <option value="">All grades</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <select
                    value={overviewStrand}
                    onChange={(e) => setOverviewStrand(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by strand"
                  >
                    <option value="">All strands</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={overviewSection}
                    onChange={(e) => setOverviewSection(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by section"
                  >
                    <option value="">All sections</option>
                    {[...new Set((classDetail || []).map((x) => x.section).filter(Boolean))].sort().map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="teacher-hide-students-btn"
                    onClick={() => setShowNeedsAttention((v) => !v)}
                    aria-expanded={showNeedsAttention}
                  >
                    {showNeedsAttention ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <p className="teacher-panel-hint">
                {overviewFiltered.length} of {classDetail?.length || 0} student{(classDetail?.length || 0) !== 1 ? 's' : ''} shown
                {needsAttentionUniqueCount > 0 && (
                  <> · {needsAttentionUniqueCount} need attention</>
                )}
              </p>
              {showNeedsAttention && (
                <>
                  <div className="teacher-attention-summary">
                    <div className="teacher-attention-row">
                      <div className="teacher-attention-row-left">
                        <span className="teacher-attention-row-title">Low progress</span>
                        <span className="teacher-attention-row-sub">&lt;{LOW_PROGRESS_PCT}% overall</span>
                      </div>
                      <div className="teacher-attention-row-right">
                        <span className="teacher-attention-row-count">{alerts.lowProgress.length}</span>
                        <button
                          type="button"
                          className="teacher-attention-view-btn"
                          onClick={() => { setAttentionModalType('low'); setAttentionModalOpen(true); }}
                          disabled={alerts.lowProgress.length === 0}
                        >
                          View list
                        </button>
                      </div>
                    </div>
                    <div className="teacher-attention-row">
                      <div className="teacher-attention-row-left">
                        <span className="teacher-attention-row-title">Inactive</span>
                        <span className="teacher-attention-row-sub">No activity in {INACTIVE_DAYS}+ days</span>
                      </div>
                      <div className="teacher-attention-row-right">
                        <span className="teacher-attention-row-count">{alerts.inactive.length}</span>
                        <button
                          type="button"
                          className="teacher-attention-view-btn"
                          onClick={() => { setAttentionModalType('inactive'); setAttentionModalOpen(true); }}
                          disabled={alerts.inactive.length === 0}
                        >
                          View list
                        </button>
                      </div>
                    </div>
                  </div>

                  {alerts.lowProgress.length === 0 && alerts.inactive.length === 0 && (
                    <p className="teacher-empty">No one in this filter needs attention.</p>
                  )}
                </>
              )}
            </div>
          )}

          {attentionModalOpen && (
            <div className="teacher-attention-modal-overlay" onClick={closeAttentionModal}>
              <div
                className={`teacher-attention-modal ${darkMode ? 'teacher-attention-modal-dark' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={attentionModalType === 'inactive' ? 'Inactive students' : 'Low progress students'}
              >
                <div className="teacher-attention-modal-header">
                  <h3>
                    {attentionModalType === 'inactive'
                      ? `Inactive (no activity in ${INACTIVE_DAYS}+ days)`
                      : `Low progress (<${LOW_PROGRESS_PCT}%)`}
                  </h3>
                  <button type="button" className="teacher-attention-modal-close" onClick={closeAttentionModal} aria-label="Close">×</button>
                </div>
                <div className="teacher-attention-modal-body">
                  {attentionRows.length === 0 ? (
                    <p className="teacher-empty">No students found for this list.</p>
                  ) : (
                    <div className="teacher-attention-table-wrap">
                      <table className="teacher-attention-table teacher-attention-table-attention">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Strand</th>
                            <th>Section</th>
                            <th>Overall</th>
                            <th>Last active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attentionRows.map((s) => (
                            <tr key={s.id}>
                              <td className="teacher-attention-name">{s.full_name || s.username}</td>
                              <td>{s.grade || '—'}</td>
                              <td>{s.strand || '—'}</td>
                              <td>{s.section || '—'}</td>
                              <td>{(s.overallProgress ?? 0)}%</td>
                              <td>{getLastActiveText(s.lastActivity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {completionModalOpen && (
            <div className="teacher-attention-modal-overlay" onClick={closeCompletionModal}>
              <div
                className={`teacher-attention-modal ${darkMode ? 'teacher-attention-modal-dark' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Completion list for ${completionModalCourse}`}
              >
                <div className="teacher-attention-modal-header">
                  <h3>Completion — {completionModalCourse}</h3>
                  <button type="button" className="teacher-attention-modal-close" onClick={closeCompletionModal} aria-label="Close">×</button>
                </div>
                <div className="teacher-attention-modal-body">
                  <div className="teacher-modal-pills" role="tablist" aria-label="Completion status">
                    <button
                      type="button"
                      className={`teacher-modal-pill ${completionModalStatus === 'completed' ? 'teacher-modal-pill-active' : ''}`}
                      onClick={() => setCompletionModalStatus('completed')}
                      role="tab"
                      aria-selected={completionModalStatus === 'completed'}
                    >
                      Completed ({(completionBuckets[completionModalCourse]?.completed || []).length})
                    </button>
                    <button
                      type="button"
                      className={`teacher-modal-pill ${completionModalStatus === 'inProgress' ? 'teacher-modal-pill-active' : ''}`}
                      onClick={() => setCompletionModalStatus('inProgress')}
                      role="tab"
                      aria-selected={completionModalStatus === 'inProgress'}
                    >
                      In progress ({(completionBuckets[completionModalCourse]?.inProgress || []).length})
                    </button>
                    <button
                      type="button"
                      className={`teacher-modal-pill ${completionModalStatus === 'notStarted' ? 'teacher-modal-pill-active' : ''}`}
                      onClick={() => setCompletionModalStatus('notStarted')}
                      role="tab"
                      aria-selected={completionModalStatus === 'notStarted'}
                    >
                      Not started ({(completionBuckets[completionModalCourse]?.notStarted || []).length})
                    </button>
                  </div>

                  {completionModalRows.length === 0 ? (
                    <p className="teacher-empty">No students found for this list.</p>
                  ) : (
                    <div className="teacher-attention-table-wrap">
                      <table className="teacher-attention-table teacher-attention-table-completion">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Strand</th>
                            <th>Section</th>
                            <th>{completionModalCourse} %</th>
                            <th>Overall</th>
                            <th>Last active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completionModalRows.map((s) => (
                            <tr key={s.id}>
                              <td className="teacher-attention-name">{s.full_name || s.username}</td>
                              <td>{s.grade || '—'}</td>
                              <td>{s.strand || '—'}</td>
                              <td>{s.section || '—'}</td>
                              <td>{(s.coursePct ?? 0)}%</td>
                              <td>{(s.overallProgress ?? 0)}%</td>
                              <td>{getLastActiveText(s.lastActivity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {studentsModalOpen && (
            <div className="teacher-attention-modal-overlay" onClick={() => setStudentsModalOpen(false)}>
              <div
                className={`teacher-attention-modal ${darkMode ? 'teacher-attention-modal-dark' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Students list"
              >
                <div className="teacher-attention-modal-header">
                  <h3>Students</h3>
                  <button type="button" className="teacher-attention-modal-close" onClick={() => setStudentsModalOpen(false)} aria-label="Close">×</button>
                </div>
                <div className="teacher-attention-modal-body">
                  <input
                    type="search"
                    placeholder="Search by name, username, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="teacher-search-input"
                    aria-label="Search students (modal)"
                    style={{ marginBottom: '0.85rem' }}
                  />
                  <div className="teacher-modal-controls" aria-label="Student filters">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="teacher-select"
                      aria-label="Sort students (modal)"
                    >
                      <option value="name-asc">Name A–Z</option>
                      <option value="name-desc">Name Z–A</option>
                    </select>
                    <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="teacher-select" aria-label="Filter grade (modal)">
                      <option value="">All grades</option>
                      {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                    <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="teacher-select" aria-label="Filter section (modal)">
                      <option value="">All sections</option>
                      {[...new Set(students.map((x) => x.section).filter(Boolean))].sort().map((sec) => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                    <select
                      value={filterStrand}
                      onChange={(e) => setFilterStrand(e.target.value)}
                      className="teacher-select"
                      aria-label="Filter strand (modal)"
                      disabled={filterGrade !== '' && !['11', '12'].includes(filterGrade)}
                      title={filterGrade !== '' && !['11', '12'].includes(filterGrade) ? 'Strand applies to Grades 11–12' : ''}
                    >
                      <option value="">All strands</option>
                      {STRANDS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      type="button"
                      className="teacher-clear-selection"
                      onClick={() => { setFilterGrade(''); setFilterStrand(''); setFilterSection(''); }}
                      title="Clear filters"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="teacher-refresh-btn"
                      onClick={refreshStudentsModal}
                      disabled={studentsModalRefreshing}
                      title="Refresh student list"
                    >
                      {studentsModalRefreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                  {studentsModalGroups.length === 0 ? (
                    <p className="teacher-empty">No students match your search/filters.</p>
                  ) : (
                    <div className="teacher-students-by-group">
                      {studentsModalGroups.map((grp) => (
                        <section key={grp.label} className="teacher-student-group-block">
                          <h4 className="teacher-student-group-title">{grp.label}</h4>
                          <div className="teacher-attention-table-wrap">
                            <table className="teacher-attention-table teacher-attention-table-students teacher-attention-table-has-action">
                              <thead>
                                <tr>
                                  <th>Last Name, First Name Middle Initial</th>
                                  <th>Overall</th>
                                  <th>Last active</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {grp.students.map((s) => {
                                  const photo = s.profile_photo || detailByStudentId[s.id]?.profile_photo;
                                  const displayName = formatStudentDisplayName(s) || s.username || '—';
                                  const initial = displayName.charAt(0).toUpperCase();
                                  return (
                                  <tr key={s.id}>
                                    <td className="teacher-attention-name">
                                      <span className="teacher-student-row-avatar-wrap">
                                        {photo ? (
                                          <button
                                            type="button"
                                            className="teacher-student-row-avatar-btn"
                                            onClick={() => setStudentPhotoZoom({ url: photo, name: displayName })}
                                            aria-label={`View ${displayName}'s profile photo`}
                                          >
                                            <img src={photo} alt="" className="teacher-student-row-avatar" />
                                          </button>
                                        ) : (
                                          <span className="teacher-student-row-avatar teacher-student-row-avatar-placeholder" aria-hidden>{initial}</span>
                                        )}
                                        <span className="teacher-student-row-name">{displayName}</span>
                                      </span>
                                    </td>
                                    <td>{detailByStudentId[s.id]?.overallProgress != null ? `${detailByStudentId[s.id].overallProgress}%` : '—'}</td>
                                    <td>{getLastActiveText(detailByStudentId[s.id]?.lastActivity)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="teacher-row-action"
                                        onClick={() => { setStudentsModalOpen(false); handleSelectStudent(s); }}
                                      >
                                        View progress
                                      </button>
                                      <button
                                        type="button"
                                        className="teacher-delete-switch"
                                        onClick={() => setDeleteConfirmStudent({ student: s, displayName })}
                                        disabled={deletingStudentId === s.id}
                                        title={`Delete ${displayName}`}
                                        aria-label={`Delete ${displayName}`}
                                      >
                                        <span className="teacher-delete-switch-track">
                                          <span className="teacher-delete-switch-thumb" />
                                          <span className="teacher-delete-switch-label">Delete</span>
                                        </span>
                                      </button>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {studentPhotoZoom && (
            <div
              className={`teacher-photo-zoom-overlay ${darkMode ? 'teacher-photo-zoom-overlay-dark' : ''}`}
              onClick={() => setStudentPhotoZoom(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setStudentPhotoZoom(null)}
              aria-label="Close zoomed photo"
            >
              <div className="teacher-photo-zoom-content" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="teacher-photo-zoom-close"
                  onClick={() => setStudentPhotoZoom(null)}
                  aria-label="Close"
                >
                  ×
                </button>
                <img src={studentPhotoZoom.url} alt={studentPhotoZoom.name} className="teacher-photo-zoom-img" />
                <p className="teacher-photo-zoom-name">{studentPhotoZoom.name}</p>
              </div>
            </div>
          )}

          {deleteConfirmStudent && (
            <div
              className={`teacher-confirm-overlay ${darkMode ? 'teacher-confirm-overlay-dark' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-delete-confirm-title"
              onClick={() => setDeleteConfirmStudent(null)}
            >
              <div className="teacher-confirm-box" onClick={(e) => e.stopPropagation()}>
                <div className="teacher-confirm-warning-icon" aria-hidden>
                  <span className="teacher-confirm-warning-exclamation">!</span>
                </div>
                <h3 id="teacher-delete-confirm-title" className="teacher-confirm-title">Confirm Deletion</h3>
                <p className="teacher-confirm-message">
                  Are you sure you want to delete this student <strong>{deleteConfirmStudent.displayName}</strong> and all associated progress?
                </p>
                <div className="teacher-confirm-actions">
                  <button
                    type="button"
                    className="teacher-confirm-yes"
                    onClick={() => performDeleteStudent(deleteConfirmStudent.student)}
                  >
                    Yes, delete it!
                  </button>
                  <button
                    type="button"
                    className="teacher-confirm-cancel"
                    onClick={() => setDeleteConfirmStudent(null)}
                  >
                    No, cancel!
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'completion' && classDetail && classDetail.length > 0 && (
            <div className="teacher-per-course-section">
              <h3 className="teacher-per-course-title">Completion by course</h3>
              <div className="teacher-list-controls">
                <input
                  type="search"
                  placeholder="Search by name, username, or email..."
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
                  className="teacher-search-input"
                  aria-label="Search for completion"
                />
                <div className="teacher-sort-filter">
                  <select
                    value={overviewGrade}
                    onChange={(e) => setOverviewGrade(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by grade"
                  >
                    <option value="">All grades</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <select
                    value={overviewStrand}
                    onChange={(e) => setOverviewStrand(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by strand"
                  >
                    <option value="">All strands</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={overviewSection}
                    onChange={(e) => setOverviewSection(e.target.value)}
                    className="teacher-select"
                    aria-label="Filter by section"
                  >
                    <option value="">All sections</option>
                    {[...new Set((classDetail || []).map((x) => x.section).filter(Boolean))].sort().map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="teacher-hide-students-btn"
                    onClick={() => setShowCompletionByCourse((v) => !v)}
                    aria-expanded={showCompletionByCourse}
                  >
                    {showCompletionByCourse ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <p className="teacher-panel-hint">
                {overviewFiltered.length} of {classDetail.length} student{classDetail.length !== 1 ? 's' : ''} shown
              </p>
              {showCompletionByCourse && (
                <div className="teacher-attention-summary">
                  {['HTML', 'C++', 'Python'].map((course) => (
                    <div key={course} className="teacher-attention-row">
                      <div className="teacher-attention-row-left">
                        <span className="teacher-attention-row-title">{course}</span>
                        <span className="teacher-attention-row-sub">
                          Completed: {completionBuckets[course].completed.length} · In progress: {completionBuckets[course].inProgress.length} · Not started: {completionBuckets[course].notStarted.length}
                        </span>
                      </div>
                      <div className="teacher-attention-row-right">
                        <button
                          type="button"
                          className="teacher-attention-view-btn"
                          onClick={() => openCompletionModal(course)}
                          disabled={(completionBuckets[course].completed.length + completionBuckets[course].inProgress.length + completionBuckets[course].notStarted.length) === 0}
                        >
                          View list
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-message">Loading students...</div>
          ) : activeTab === 'students' ? (
            <div className="teacher-panels">
              <section ref={studentsPanelRef} className="progress-overview teacher-panel">
                <h3>Students</h3>
                <div className="teacher-list-controls">
                  <div className="teacher-sort-filter">
                    <button
                      type="button"
                      className="teacher-attention-view-btn"
                      onClick={() => setStudentsModalOpen(true)}
                      disabled={students.length === 0}
                    >
                      View students list
                    </button>
                  </div>
                </div>
                <p className="teacher-panel-hint">
                  Open the list to search, sort, and filter by grade/strand/section.
                </p>
                {selectedStudent ? (
                  <div className="teacher-selected-student-card">
                    <span className="teacher-selected-student-title">Selected</span>
                    <span className="teacher-selected-student-name">{formatStudentDisplayName(selectedStudent) || selectedStudent.username}</span>
                    <span className="teacher-selected-student-meta">
                      {selectedStudent.email} · Grade {selectedStudent.grade || '—'} {selectedStudent.strand ? `· ${selectedStudent.strand}` : ''} · Section {selectedStudent.section || '—'}
                    </span>
                    <button type="button" className="teacher-clear-selection" onClick={() => setSelectedStudent(null)}>Clear selection</button>
                  </div>
                ) : (
                  <p className="teacher-panel-hint" style={{ marginTop: 0 }}>
                    Click <strong>View students list</strong> to pick a student and see their progress.
                  </p>
                )}
              </section>

              <section className="progress-overview teacher-panel">
                <h3>Progress</h3>
                {!selectedStudent && (
                  <div className="teacher-progress-empty">
                    <p className="teacher-panel-hint">Select a student from the list to view their progress.</p>
                    <p className="teacher-progress-empty-detail">You’ll see their overall completion and per-course breakdown (HTML, C++, Python).</p>
                  </div>
                )}
                {selectedStudent && progressLoading && (
                  <div className="loading-message">Loading progress...</div>
                )}
                {selectedStudent && studentProgress?.error && (
                  <div className="teacher-error">{studentProgress.error}</div>
                )}
                {selectedStudent && studentProgress && !studentProgress.error && (
                  <div className="teacher-progress-content">
                    <div className="overall-progress" style={{ marginBottom: '1rem' }}>
                      <div className="progress-info">
                        <span className="progress-label">Overall</span>
                        <span className="progress-percentage">{studentProgress.overall}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${studentProgress.overall}%` }}
                        />
                      </div>
                    </div>
                    {['HTML', 'C++', 'Python'].map((course) => {
                      const c = studentProgress.courses[course];
                      if (!c) return null;
                      return (
                        <div key={course} className="teacher-course-row">
                          <h4 className="teacher-course-name">{course}</h4>
                          <div className="progress-bar" style={{ marginBottom: '0.35rem' }}>
                            <div
                              className="progress-fill"
                              style={{ width: `${c.progress}%` }}
                            />
                          </div>
                          <span className="teacher-course-meta">
                            Lectures {c.completedLectures}/{c.totalLectures} · Quizzes {c.completedQuizzes}/{c.totalQuizzes}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedStudent && (
                  <p className="teacher-view-as-student">
                    <a href={window.location.origin + window.location.pathname} target="_blank" rel="noopener noreferrer" className="teacher-view-link">
                      Open student dashboard in new tab
                    </a>
                    {' '}to see the same view students see (log in as a student there to compare).
                  </p>
                )}
              </section>
            </div>
          ) : null}

          {!loading && activeTab === 'announcements' && (
          <div className="progress-overview teacher-announcements-section">
            <h3>Announcements</h3>
            <p className="teacher-panel-hint">Post a message that students will see on their dashboard.</p>
            <div className="teacher-announcement-form">
              <textarea
                placeholder="e.g. Quiz 1 due Friday. Remember to complete the HTML lectures."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="teacher-announcement-input"
                rows={3}
                disabled={announcementSending}
              />
              <div className="teacher-announcement-controls">
                <label className="teacher-announcement-check">
                  <input
                    type="checkbox"
                    checked={announcementPinned}
                    onChange={(e) => setAnnouncementPinned(e.target.checked)}
                    disabled={announcementSending}
                  />
                  <span>Pin</span>
                </label>

                <label className="teacher-announcement-field">
                  <span className="teacher-announcement-field-label">Schedule</span>
                  <input
                    type="datetime-local"
                    value={announcementPublishAt}
                    onChange={(e) => setAnnouncementPublishAt(e.target.value)}
                    className="teacher-announcement-input-control"
                    disabled={announcementSending}
                  />
                </label>

                <div className="teacher-announcement-targets">
                  <span className="teacher-announcement-field-label">Target</span>
                  <select
                    value={announcementTargetGrade}
                    onChange={(e) => setAnnouncementTargetGrade(e.target.value)}
                    className="teacher-announcement-select"
                    disabled={announcementSending}
                    aria-label="Target grade"
                  >
                    <option value="">All grades</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <select
                    value={announcementTargetStrand}
                    onChange={(e) => setAnnouncementTargetStrand(e.target.value)}
                    className="teacher-announcement-select"
                    disabled={announcementSending || (announcementTargetGrade && !['11', '12'].includes(String(announcementTargetGrade)))}
                    aria-label="Target strand"
                  >
                    <option value="">All strands</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    value={announcementTargetSection}
                    onChange={(e) => setAnnouncementTargetSection(e.target.value)}
                    className="teacher-announcement-input-control teacher-announcement-section"
                    placeholder="Section (optional)"
                    disabled={announcementSending}
                    aria-label="Target section"
                  />
                </div>
              </div>
              <button type="button" className="teacher-announcement-btn" onClick={handlePostAnnouncement} disabled={!announcementText.trim() || announcementSending}>
                {announcementSending ? 'Posting…' : 'Post announcement'}
              </button>
              {announcementError && (
                <p className="teacher-announcement-error">{announcementError}</p>
              )}
            </div>
            {announcements.length > 0 && (
              <ul className="teacher-announcement-list">
                {announcements.slice(0, 5).map((a) => (
                  <li key={a.id} className="teacher-announcement-item">
                    <div className="teacher-announcement-main">
                      {announcementEditingId === a.id ? (
                        <div className="teacher-announcement-edit-block">
                          <textarea
                            value={announcementEditingText}
                            onChange={(e) => setAnnouncementEditingText(e.target.value)}
                            className="teacher-announcement-edit-input"
                            rows={3}
                            disabled={announcementEditingSaving}
                          />
                          <div className="teacher-announcement-controls teacher-announcement-controls-compact">
                            <label className="teacher-announcement-check">
                              <input
                                type="checkbox"
                                checked={announcementEditingPinned}
                                onChange={(e) => setAnnouncementEditingPinned(e.target.checked)}
                                disabled={announcementEditingSaving}
                              />
                              <span>Pin</span>
                            </label>
                            <label className="teacher-announcement-field">
                              <span className="teacher-announcement-field-label">Schedule</span>
                              <input
                                type="datetime-local"
                                value={announcementEditingPublishAt}
                                onChange={(e) => setAnnouncementEditingPublishAt(e.target.value)}
                                className="teacher-announcement-input-control"
                                disabled={announcementEditingSaving}
                              />
                            </label>
                            <div className="teacher-announcement-targets">
                              <span className="teacher-announcement-field-label">Target</span>
                              <select
                                value={announcementEditingTargetGrade}
                                onChange={(e) => setAnnouncementEditingTargetGrade(e.target.value)}
                                className="teacher-announcement-select"
                                disabled={announcementEditingSaving}
                                aria-label="Edit target grade"
                              >
                                <option value="">All grades</option>
                                {GRADES.map((g) => (
                                  <option key={g} value={g}>Grade {g}</option>
                                ))}
                              </select>
                              <select
                                value={announcementEditingTargetStrand}
                                onChange={(e) => setAnnouncementEditingTargetStrand(e.target.value)}
                                className="teacher-announcement-select"
                                disabled={announcementEditingSaving || (announcementEditingTargetGrade && !['11', '12'].includes(String(announcementEditingTargetGrade)))}
                                aria-label="Edit target strand"
                              >
                                <option value="">All strands</option>
                                {STRANDS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <input
                                value={announcementEditingTargetSection}
                                onChange={(e) => setAnnouncementEditingTargetSection(e.target.value)}
                                className="teacher-announcement-input-control teacher-announcement-section"
                                placeholder="Section (optional)"
                                disabled={announcementEditingSaving}
                                aria-label="Edit target section"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="teacher-announcement-text">{a.text}</span>
                          <div className="teacher-announcement-badges">
                            {a.pinned ? <span className="teacher-announcement-badge teacher-announcement-badge-pin">Pinned</span> : null}
                            {a.publish_at ? (
                              <span className="teacher-announcement-badge teacher-announcement-badge-time">
                                {new Date(a.publish_at).getTime() > Date.now() ? 'Scheduled' : 'Published'}: {new Date(a.publish_at).toLocaleString()}
                              </span>
                            ) : null}
                            {a.target ? (
                              <span className="teacher-announcement-badge teacher-announcement-badge-target">
                                Target: {a.target.grade ? `G${a.target.grade}` : 'All'}{a.target.strand ? ` · ${a.target.strand}` : ''}{a.target.section ? ` · ${a.target.section}` : ''}
                              </span>
                            ) : null}
                          </div>
                        </>
                      )}
                      <span className="teacher-announcement-date">
                        {a.created_at ? `Created: ${new Date(a.created_at).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                    <div className="teacher-announcement-actions">
                      {announcementEditingId === a.id ? (
                        <>
                          <button
                            type="button"
                            className="teacher-announcement-action teacher-announcement-action-primary"
                            onClick={saveEditAnnouncement}
                            disabled={announcementEditingSaving || !announcementEditingText.trim()}
                          >
                            {announcementEditingSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" className="teacher-announcement-action" onClick={cancelEditAnnouncement} disabled={announcementEditingSaving}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="teacher-announcement-action" onClick={() => startEditAnnouncement(a)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="teacher-announcement-action teacher-announcement-action-danger"
                            onClick={() => deleteAnnouncement(a.id)}
                            disabled={announcementDeletingId === a.id}
                          >
                            {announcementDeletingId === a.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}

          {!loading && activeTab === 'overview' && (
          <div className="progress-overview teacher-course-content">
            <h3>Course content</h3>
            <p className="teacher-panel-hint">What students see in CodeLab:</p>
            <ul className="teacher-content-list">
              <li><strong>HTML</strong> — 6 lectures, 3 quizzes</li>
              <li><strong>C++</strong> — 6 lectures, 1 quiz</li>
              <li><strong>Python</strong> — 6 lectures, 1 quiz</li>
            </ul>
            <p className="teacher-content-note">
              Students access these from their dashboard. Content is managed in the app (lectures, quizzes, editor, challenges).
            </p>
          </div>
          )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;
