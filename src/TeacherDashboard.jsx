import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import { buildAddressStructure, formatAddressString, parseAddressString } from './data/philippineAddresses';

const MAX_PHOTO_SIZE = 500 * 1024; // 500KB
const MAX_ANNOUNCEMENT_LENGTH = 300;
const GRADES = ['11', '12'];
const STRANDS = ['STEM', 'ABM', 'HUMSS', 'TVL'];
const SECTION_BY_GRADE_STRAND = {
  '11': { ABM: ['Taylor', 'Mayo'], HUMSS: ['Pavlov', 'Skinner', 'Kohlberg', 'Brunner', 'Gardner'], STEM: ['Pasteur', 'Newton'], TVL: ['Carver', 'Manzke', 'Comorford'] },
  '12': { ABM: ['Drucker', 'Gilbreth'], HUMSS: ['Raleigh', 'Aliegheri', 'Henley', 'Cervantes'], STEM: ['Galileo', 'Einstein'], TVL: ['Apicius', 'Jones', 'Ramsay'] },
};

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
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
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
  const announcementInputRef = useRef(null);
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
  const [addressStructure, setAddressStructure] = useState(null);
  const [activityByWeek, setActivityByWeek] = useState([]);
  const [activityByDay, setActivityByDay] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [lectureAnalytics, setLectureAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('4w');

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
    fetch('/philippine_provinces_cities_municipalities_and_barangays_2019v2.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAddressStructure(data ? buildAddressStructure(data) : null))
      .catch(() => setAddressStructure(null));
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
    if (showAnnouncementComposer) {
      announcementInputRef.current?.focus();
    }
  }, [showAnnouncementComposer]);

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
    const parsed = parseAddressString(user?.address ?? '');
    setProfileForm({
      fullName: user?.fullName ?? '',
      username: user?.username ?? '',
      birthday: user?.birthday ?? '',
      age: user?.age !== undefined && user?.age !== null ? String(user.age) : '',
      sex: user?.sex ?? '',
      address: user?.address ?? '',
      addressProvince: parsed.province,
      addressCity: parsed.city,
      addressBarangay: parsed.barangay,
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
      if (name === 'grade' && !['11', '12'].includes(value)) {
        next.strand = 'N/A';
        next.section = '';
      }
      if (name === 'strand') next.section = '';
      if (name === 'addressProvince') {
        next.addressCity = '';
        next.addressBarangay = '';
      }
      if (name === 'addressCity') next.addressBarangay = '';
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
        address: formatAddressString(profileForm.addressCity, profileForm.addressProvince, profileForm.addressBarangay) || profileForm.address,
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

  useEffect(() => {
    if (activeTab !== 'analytics' || !baseUrl) return;
    setAnalyticsLoading(true);
    const days = analyticsRange === '8w' ? 56 : analyticsRange === '12w' ? 84 : analyticsRange === 'all' ? 90 : 28;
    Promise.all([
      fetch(`${baseUrl}/teacher/activity-by-week`).then((r) => (r.ok ? r.json() : { weeks: [] })),
      fetch(`${baseUrl}/teacher/activity-by-day?days=${days}`).then((r) => (r.ok ? r.json() : { days: [] })),
      fetch(`${baseUrl}/teacher/analytics-summary`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${baseUrl}/teacher/lecture-analytics`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${baseUrl}/teacher/class-detail`).then((r) => (r.ok ? r.json() : { students: [] })),
    ])
      .then(([weekData, dayData, summaryData, lectureData, classDetailData]) => {
        setActivityByWeek(weekData.weeks || []);
        setActivityByDay(dayData.days || []);
        setAnalyticsSummary(summaryData);
        setLectureAnalytics(lectureData);
        setClassDetail(classDetailData.students || []);
      })
      .catch(() => {
        setActivityByWeek([]);
        setActivityByDay([]);
        setAnalyticsSummary(null);
        setLectureAnalytics(null);
      })
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab, baseUrl, analyticsRange]);

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
    // Sort by display name (Last Name, First Name) so A–Z / Z–A matches what the user sees
    const sortKey = (s) => {
      const ln = (s.last_name || '').toString().trim();
      const fn = (s.first_name || '').toString().trim();
      const mn = (s.middle_name || '').toString().trim();
      if (ln || fn) {
        const mi = mn ? (mn[0] || '').toUpperCase() + '.' : '';
        return `${ln}, ${fn} ${mi}`.trim().toLowerCase();
      }
      return (s.full_name || s.username || '').toLowerCase();
    };
    const order = sortBy === 'name-desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      const na = sortKey(a);
      const nb = sortKey(b);
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

  const analyticsSummaryFallback = React.useMemo(() => {
    const totalStudents = classSummary?.totalStudents ?? students.length ?? 0;
    const activeLast7Days = (classDetail || []).filter((s) => {
      if (!s.lastActivity) return false;
      const days = (Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000);
      return days < 7;
    }).length;
    // Approximate completed activities from existing course progress:
    // each fully completed lesson slot represents one lecture + one quiz.
    const totalActivitiesCompleted = (classDetail || []).reduce((sum, s) => {
      const htmlUnits = Math.round(((s.htmlProgress || 0) / 100) * 6);
      const cppUnits = Math.round(((s.cppProgress || 0) / 100) * 6);
      const pythonUnits = Math.round(((s.pythonProgress || 0) / 100) * 6);
      return sum + (htmlUnits + cppUnits + pythonUnits) * 2;
    }, 0);
    const averageProgress = classSummary?.averageProgress ?? 0;
    return { totalStudents, activeLast7Days, totalActivitiesCompleted, averageProgress };
  }, [classSummary, students.length, classDetail]);

  const activityByWeekFallback = React.useMemo(() => {
    const list = classDetail || [];
    if (list.length === 0) return [];

    const isoWeekKey = (dateValue) => {
      const d = new Date(dateValue);
      if (Number.isNaN(d.getTime())) return null;
      const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = utc.getUTCDay() || 7;
      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
      return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };

    const byWeek = {};
    list.forEach((student) => {
      if (!student.lastActivity) return;
      const week = isoWeekKey(student.lastActivity);
      if (!week) return;
      byWeek[week] = (byWeek[week] || 0) + 1;
    });

    return Object.entries(byWeek)
      .map(([week, activeCount]) => ({ week, activeCount }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [classDetail]);

  const activityByWeekDisplay = activityByWeek.length > 0 ? activityByWeek : activityByWeekFallback;

  const activityByDayFallback = React.useMemo(() => {
    const list = classDetail || [];
    const daysCount = analyticsRange === '8w' ? 56 : analyticsRange === '12w' ? 84 : analyticsRange === 'all' ? 90 : 28;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - daysCount);
    start.setUTCHours(0, 0, 0, 0);
    const byDate = {};
    list.forEach((s) => {
      if (!s.lastActivity) return;
      const d = new Date(s.lastActivity);
      if (Number.isNaN(d.getTime())) return;
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr >= start.toISOString().slice(0, 10)) byDate[dateStr] = (byDate[dateStr] || 0) + 1;
    });
    const result = [];
    for (let i = 0; i < daysCount; i += 1) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, dayLabel: dayLabels[d.getUTCDay()], activeCount: byDate[dateStr] || 0 });
    }
    return result;
  }, [classDetail, analyticsRange]);

  const activityByDayDisplay = activityByDay.length > 0 ? activityByDay : activityByDayFallback;

  const activityRangeWeeks = React.useMemo(() => {
    const list = activityByWeekDisplay || [];
    const byWeek = new Map(list.map((item) => [item.week, item.activeCount]));
    const weeksToShow = analyticsRange === '8w' ? 8 : analyticsRange === '12w' ? 12 : analyticsRange === 'all' ? Math.max(list.length, 12) : 4;

    const isoWeekToDate = (weekKey) => {
      const m = String(weekKey || '').match(/^(\d{4})-W(\d{2})$/);
      if (!m) return null;
      const year = Number(m[1]);
      const week = Number(m[2]);
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const mondayWeek1 = new Date(jan4);
      mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
      const monday = new Date(mondayWeek1);
      monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
      return monday;
    };

    const dateToIsoWeek = (d) => {
      const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const dayNum = utc.getUTCDay() || 7;
      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
      return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };

    const latestWeekKey = list.length > 0 ? list[list.length - 1].week : dateToIsoWeek(new Date());
    const latestDate = isoWeekToDate(latestWeekKey) || new Date();
    const weeks = [];
    for (let i = weeksToShow - 1; i >= 0; i -= 1) {
      const d = new Date(latestDate);
      d.setUTCDate(latestDate.getUTCDate() - (i * 7));
      const weekKey = dateToIsoWeek(d);
      weeks.push({ week: weekKey, activeCount: byWeek.get(weekKey) || 0 });
    }
    return weeks;
  }, [activityByWeekDisplay, analyticsRange]);
  const activityMonthLabel = React.useMemo(() => {
    if (activityRangeWeeks.length === 0) return '';
    const parseWeek = (weekKey) => {
      const m = String(weekKey || '').match(/^(\d{4})-W(\d{2})$/);
      if (!m) return null;
      const year = Number(m[1]);
      const week = Number(m[2]);
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const mondayWeek1 = new Date(jan4);
      mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
      const monday = new Date(mondayWeek1);
      monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
      return monday;
    };
    const firstDate = parseWeek(activityRangeWeeks[0].week);
    const lastDate = parseWeek(activityRangeWeeks[activityRangeWeeks.length - 1].week);
    if (!firstDate || !lastDate) return '';
    const firstLabel = firstDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    const lastLabel = lastDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
  }, [activityRangeWeeks]);

  const analyticsRangeDays = analyticsRange === '8w' ? 56 : analyticsRange === '12w' ? 84 : analyticsRange === 'all' ? 3650 : 28;
  const studentsNeedingAttentionList = React.useMemo(() => {
    const list = classDetail || [];
    const rows = list.filter((s) => {
      const low = (s.overallProgress ?? 0) < LOW_PROGRESS_PCT;
      const inactive = !s.lastActivity || ((Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000)) >= INACTIVE_DAYS;
      return low || inactive;
    }).map((s) => {
      const inactiveDays = s.lastActivity ? Math.floor((Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000)) : null;
      return {
        ...s,
        attentionReason: (s.overallProgress ?? 0) < LOW_PROGRESS_PCT ? `${s.overallProgress ?? 0}% progress` : `Inactive ${inactiveDays != null ? `${inactiveDays}d` : '—'}`,
      };
    });
    rows.sort((a, b) => (a.overallProgress ?? 0) - (b.overallProgress ?? 0));
    return rows.slice(0, 4);
  }, [classDetail, LOW_PROGRESS_PCT, INACTIVE_DAYS]);

  const hardestExercises = React.useMemo(() => {
    const totalStudents = classSummary?.totalStudents ?? students.length ?? 0;
    if (!lectureAnalytics || !totalStudents) return [];
    const rows = [];
    ['HTML', 'C++', 'Python'].forEach((course) => {
      const courseRows = lectureAnalytics[course] || {};
      Object.entries(courseRows).forEach(([lectureId, completedCount]) => {
        const pct = Math.round((Number(completedCount || 0) / totalStudents) * 100);
        rows.push({
          key: `${course}-${lectureId}`,
          label: `${course} Lecture ${lectureId}`,
          completedCount: Number(completedCount || 0),
          pct,
        });
      });
    });
    return rows.sort((a, b) => a.pct - b.pct || a.label.localeCompare(b.label)).slice(0, 5);
  }, [lectureAnalytics, classSummary, students.length]);

  const engagementMetrics = React.useMemo(() => {
    const list = classDetail || [];
    const totalStudents = list.length;
    if (totalStudents === 0) {
      return { activeRate: 0, inactiveCount: 0, avgStartedCourses: 0, avgCompletedLessons: 0, activeLabel: 'Active (7d)' };
    }
    const ACTIVE_DAYS = 7;
    const activeCount = list.filter((s) => {
      if (!s.lastActivity) return false;
      const daysSince = (Date.now() - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000);
      return daysSince <= ACTIVE_DAYS;
    }).length;
    const inactiveCount = totalStudents - activeCount;
    const avgStartedCourses = list.reduce((sum, s) => {
      const started = [s.htmlProgress, s.cppProgress, s.pythonProgress].filter((v) => (v ?? 0) > 0).length;
      return sum + started;
    }, 0) / totalStudents;
    const LECTURES_PER_COURSE = 6;
    const avgCompletedLessons = list.reduce((sum, s) => {
      const htmlUnits = Math.round(((s.htmlProgress || 0) / 100) * LECTURES_PER_COURSE);
      const cppUnits = Math.round(((s.cppProgress || 0) / 100) * LECTURES_PER_COURSE);
      const pythonUnits = Math.round(((s.pythonProgress || 0) / 100) * LECTURES_PER_COURSE);
      return sum + htmlUnits + cppUnits + pythonUnits;
    }, 0) / totalStudents;
    return {
      activeRate: totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0,
      inactiveCount,
      avgStartedCourses: Number(avgStartedCourses.toFixed(1)),
      avgCompletedLessons: Number(avgCompletedLessons.toFixed(1)),
      activeLabel: 'Active (7d)',
    };
  }, [classDetail]);

  /** Groups for Students modal: by grade → strand (if 11/12) → section. Order within each group comes from filteredStudents (respects Name A–Z / Z–A). */
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
          const list = bySection[sec] || [];
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
        setShowAnnouncementComposer(false);
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
                    <div className="profile-form-field">
                      <label className="profile-form-label">Province</label>
                      <select name="addressProvince" value={profileForm.addressProvince} onChange={handleProfileFormChange} className="profile-form-input">
                        <option value="">Select</option>
                        {addressStructure?.provinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="profile-form-field">
                      <label className="profile-form-label">City / Municipality</label>
                      <select name="addressCity" value={profileForm.addressCity} onChange={handleProfileFormChange} className="profile-form-input" disabled={!profileForm.addressProvince}>
                        <option value="">Select</option>
                        {addressStructure && profileForm.addressProvince && addressStructure.getCities(profileForm.addressProvince).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="profile-form-field profile-form-field-full">
                      <label className="profile-form-label">Barangay</label>
                      <select name="addressBarangay" value={profileForm.addressBarangay} onChange={handleProfileFormChange} className="profile-form-input" disabled={!profileForm.addressCity}>
                        <option value="">Select</option>
                        {addressStructure && profileForm.addressProvince && profileForm.addressCity && addressStructure.getBarangays(profileForm.addressProvince, profileForm.addressCity).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
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
                      {['11', '12'].includes(profileForm.grade) && profileForm.strand && profileForm.strand !== 'N/A' ? (
                        <select name="section" value={profileForm.section} onChange={handleProfileFormChange} className="profile-form-input">
                          <option value="">Select</option>
                          {(SECTION_BY_GRADE_STRAND[profileForm.grade]?.[profileForm.strand] || []).map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" name="section" value={profileForm.section} onChange={handleProfileFormChange} className="profile-form-input" placeholder="Grade 11–12 + Strand to pick section" />
                      )}
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
                  <button
                    type="button"
                    className={`teacher-tab ${activeTab === 'analytics' ? 'teacher-tab-active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    Analytics
                  </button>
                </nav>
              </aside>
            )}
            <div className="teacher-main-content">
          {activeTab === 'overview' && (
            <div className="welcome-section">
              <h2>Welcome back</h2>
              <p>View your class progress and see how everyone is doing with HTML, C++, and Python.</p>
            </div>
          )}

          {error && (
            <div className="teacher-error">
              {error}
            </div>
          )}

          {!loading && activeTab === 'overview' && (
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
              <div className="teacher-overview-card" onClick={() => setActiveTab('analytics')}>
                <span className="teacher-overview-card-icon">📈</span>
                <h4 className="teacher-overview-card-title">Analytics</h4>
                <p className="teacher-overview-card-desc">
                  View weekly activity, course progress, skill mastery, and top students
                </p>
                <span className="teacher-overview-card-action">View →</span>
              </div>
            </div>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="teacher-analytics teacher-analytics-insight">
              {analyticsLoading ? (
                <p className="teacher-analytics-loading">Loading analytics…</p>
              ) : (
                <>
                  <div className="teacher-insight-cards-row">
                    <div className="teacher-insight-card">
                      <span className="teacher-insight-card-icon teacher-insight-icon-students">👥</span>
                      <div className="teacher-insight-card-content">
                        <span className="teacher-insight-card-label">Students</span>
                        <span className="teacher-insight-card-value">{analyticsSummary?.totalStudents ?? analyticsSummaryFallback.totalStudents}</span>
                        <span className="teacher-insight-card-sub">Total enrolled</span>
                      </div>
                    </div>
                    <div className="teacher-insight-card">
                      <span className="teacher-insight-card-icon teacher-insight-icon-active">⚡</span>
                      <div className="teacher-insight-card-content">
                        <span className="teacher-insight-card-label">Active students</span>
                        <span className="teacher-insight-card-value">{engagementMetrics.activeRate}%</span>
                        <span className="teacher-insight-card-sub">{analyticsRange === '8w' ? 'last 8 weeks' : analyticsRange === '12w' ? 'last 12 weeks' : analyticsRange === 'all' ? 'all time' : 'last 4 weeks'}</span>
                      </div>
                    </div>
                    <div className="teacher-insight-card">
                      <span className="teacher-insight-card-icon teacher-insight-icon-exercises">✓</span>
                      <div className="teacher-insight-card-content">
                        <span className="teacher-insight-card-label">Exercises completed</span>
                        <span className="teacher-insight-card-value">{analyticsSummary?.totalActivitiesCompleted ?? analyticsSummaryFallback.totalActivitiesCompleted}</span>
                        <span className="teacher-insight-card-sub">lectures + quizzes</span>
                      </div>
                    </div>
                    <div className="teacher-insight-card">
                      <span className="teacher-insight-card-icon teacher-insight-icon-score">◎</span>
                      <div className="teacher-insight-card-content">
                        <span className="teacher-insight-card-label">Avg progress</span>
                        <span className="teacher-insight-card-value">{analyticsSummary?.averageProgress != null ? `${analyticsSummary.averageProgress}%` : `${analyticsSummaryFallback.averageProgress}%`}</span>
                        <span className="teacher-insight-card-sub">overall</span>
                      </div>
                    </div>
                  </div>

                  <div className="teacher-analytics-filters">
                    {[
                      { value: '4w', label: 'Last 4 Weeks' },
                      { value: '8w', label: 'Last 8 Weeks' },
                      { value: '12w', label: 'Last 12 Weeks' },
                      { value: 'all', label: 'All Time' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`teacher-analytics-filter-btn ${analyticsRange === opt.value ? 'teacher-analytics-filter-btn-active' : ''}`}
                        onClick={() => setAnalyticsRange(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="teacher-insight-middle-row">
                    <div className="teacher-insight-panel teacher-insight-weekly-activity">
                      <h4 className="teacher-insight-panel-title">Weekly student activity</h4>
                      {activityMonthLabel && (
                        <p className="teacher-insight-panel-period">{activityMonthLabel}</p>
                      )}
                      {activityRangeWeeks.length === 0 ? (
                        <p className="teacher-insight-empty">No activity data yet.</p>
                      ) : (
                        <>
                          <div className="teacher-insight-weekly-scroller" style={{ '--weekly-count': activityRangeWeeks.length }}>
                            <div className="teacher-insight-weekly-chart-inner">
                              <div className="teacher-insight-line-chart">
                                {(() => {
                                  const maxActive = Math.max(...activityRangeWeeks.map((w) => w.activeCount), 1);
                                  return activityRangeWeeks.map(({ week, activeCount }) => (
                                    <div key={week} className="teacher-insight-line-point" style={{ height: `${(activeCount / maxActive) * 100}%` }} title={`${week}: ${activeCount} active`} />
                                  ));
                                })()}
                              </div>
                              <div className="teacher-insight-line-labels">
                                {activityRangeWeeks.map(({ week }) => (
                                  <span key={week} className="teacher-insight-line-label" title={week}>{week}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="teacher-insight-panel-meta">
                            Weekly active: {activityRangeWeeks.length > 0 ? activityRangeWeeks[activityRangeWeeks.length - 1].activeCount : 0} students
                          </p>
                        </>
                      )}
                    </div>
                    <div className="teacher-insight-panel teacher-insight-course-progress">
                      <h4 className="teacher-insight-panel-title">Course progress</h4>
                      {(() => {
                        const list = classDetail || [];
                        const total = list.length || 1;
                        const completed = list.filter((s) => (s.htmlProgress >= 100) || (s.cppProgress >= 100) || (s.pythonProgress >= 100)).length;
                        const notStarted = list.filter((s) => ((s.htmlProgress || 0) === 0) && ((s.cppProgress || 0) === 0) && ((s.pythonProgress || 0) === 0)).length;
                        const inProgress = total - completed - notStarted;
                        const attempts = total - notStarted;
                        const bars = [
                          { label: 'Completed', value: completed, total, color: 'done' },
                          { label: 'Not started', value: notStarted, total, color: 'not' },
                          { label: 'In progress', value: inProgress, total, color: 'progress' },
                          { label: 'Attempts', value: attempts, total, color: 'attempts' },
                        ];
                        return (
                          <div className="teacher-insight-hbars">
                            {bars.map((b) => (
                              <div key={b.label} className="teacher-insight-hbar-row">
                                <span className="teacher-insight-hbar-label">{b.label}</span>
                                <div className="teacher-insight-hbar-wrap">
                                  <div className={`teacher-insight-hbar teacher-insight-hbar-${b.color}`} style={{ width: `${(b.value / b.total) * 100}%` }} />
                                </div>
                                <span className="teacher-insight-hbar-value">{b.value}/{b.total}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="teacher-insight-panel teacher-insight-mastery">
                      <h4 className="teacher-insight-panel-title">Skill mastery (by course)</h4>
                      {['HTML', 'C++', 'Python'].map((course) => {
                        const buckets = perCourseBucketsAll[course] || { completed: [], inProgress: [], notStarted: [] };
                        const total = classDetail?.length || 0;
                        const pct = total > 0 ? Math.round((buckets.completed.length / total) * 100) : 0;
                        return (
                          <div key={course} className="teacher-insight-mastery-row">
                            <span className="teacher-insight-mastery-label">{course}</span>
                            <div className="teacher-insight-mastery-bar-wrap">
                              <div className="teacher-insight-mastery-bar" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="teacher-insight-mastery-pct">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="teacher-activity-line-section">
                    <h4 className="teacher-activity-line-title">Active students per day</h4>
                    <p className="teacher-activity-line-subtitle">One point per calendar day — see how many students were active each day and spot engagement trends or drops</p>
                    {activityByDayDisplay.length === 0 ? (
                      <p className="teacher-insight-empty">No daily activity data yet.</p>
                    ) : (
                      <div className="teacher-activity-line-chart-scroller">
                        <div className="teacher-activity-line-chart-wrap">
                        {(() => {
                          const data = activityByDayDisplay;
                          const maxActive = Math.max(...data.map((d) => d.activeCount), 1);
                          const padding = { top: 12, right: 16, bottom: 32, left: 36 };
                          const n = data.length;
                          const minPxPerDay = 26;
                          const w = Math.max(600, n * minPxPerDay);
                          const h = 220;
                          const chartW = w - padding.left - padding.right;
                          const chartH = h - padding.top - padding.bottom;
                          const points = data.map((d, i) => {
                            const x = padding.left + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
                            const y = padding.top + chartH - (d.activeCount / maxActive) * chartH;
                            return { x, y, ...d };
                          });
                          const pathD = points.length > 0
                            ? `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`
                            : '';
                          return (
                            <svg className="teacher-activity-line-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width={w} height={h} aria-label="Active students per day">
                              <defs>
                                <linearGradient id="teacher-activity-line-fill" x1="0" y1="1" x2="0" y2="0">
                                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.08)" />
                                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0.35)" />
                                </linearGradient>
                              </defs>
                              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} className="teacher-activity-axis" strokeWidth="1" />
                              <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} className="teacher-activity-axis" strokeWidth="1" />
                              {pathD && (
                                <>
                                  <path d={`${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`} fill="url(#teacher-activity-line-fill)" />
                                  <path d={pathD} fill="none" className="teacher-activity-line-path" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                              )}
                              {points.map((p, i) => (
                                <circle key={p.date} cx={p.x} cy={p.y} r={p.activeCount > 0 ? 3 : 0} className="teacher-activity-line-dot" />
                              ))}
                              {points.map((p) => {
                                const [, m, d] = p.date.split('-');
                                const shortDate = `${Number(m)}/${Number(d)}`;
                                return (
                                  <text key={`label-${p.date}`} x={p.x} y={h - 6} textAnchor="middle" className="teacher-activity-line-xlabel">{shortDate}</text>
                                );
                              })}
                              <text x={padding.left - 8} y={padding.top + chartH / 2} textAnchor="middle" className="teacher-activity-line-ylabel" transform={`rotate(-90, ${padding.left - 8}, ${padding.top + chartH / 2})`}>Active students (that day)</text>
                            </svg>
                          );
                        })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="teacher-insight-bottom-row">
                    <div className="teacher-insight-panel teacher-insight-hardest">
                      <h4 className="teacher-insight-panel-title">Hardest exercises</h4>
                      <div className="teacher-insight-table-wrap">
                        <table className="teacher-insight-table">
                          <thead>
                            <tr><th>Exercise</th><th>Completion %</th><th>Done</th></tr>
                          </thead>
                          <tbody>
                            {hardestExercises.map((item) => (
                              <tr key={item.key}>
                                <td>{item.label}</td>
                                <td className={item.pct < 50 ? 'teacher-insight-low' : ''}>{item.pct}%</td>
                                <td>{item.completedCount}/{classSummary?.totalStudents ?? students.length ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="teacher-insight-panel teacher-insight-attention">
                      <h4 className="teacher-insight-panel-title">Students needing attention</h4>
                      <div className="teacher-insight-top-list">
                        {studentsNeedingAttentionList.length === 0 ? (
                          <p className="teacher-insight-empty">No students need attention right now.</p>
                        ) : (
                          studentsNeedingAttentionList.map((s) => (
                            <div key={s.id} className="teacher-insight-top-item">
                              <div className="teacher-insight-top-avatar">
                                {s.profile_photo ? (
                                  <img src={s.profile_photo} alt="" />
                                ) : (
                                  <span>{(s.full_name || s.username || '?').toString().charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="teacher-insight-attention-copy">
                                <span className="teacher-insight-top-name">{s.full_name || s.username || 'Student'}</span>
                                <span className="teacher-insight-attention-reason">{s.attentionReason}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="teacher-insight-panel teacher-insight-engagement">
                      <h4 className="teacher-insight-panel-title">Engagement metrics</h4>
                      <div className="teacher-engagement-grid">
                        <div className="teacher-engagement-metric">
                          <span className="teacher-engagement-metric-label">Active rate (7d)</span>
                          <span className="teacher-engagement-metric-value">{engagementMetrics.activeRate}%</span>
                        </div>
                        <div className="teacher-engagement-metric">
                          <span className="teacher-engagement-metric-label">Inactive (7d)</span>
                          <span className="teacher-engagement-metric-value">{engagementMetrics.inactiveCount}</span>
                        </div>
                        <div className="teacher-engagement-metric">
                          <span className="teacher-engagement-metric-label">Avg started courses</span>
                          <span className="teacher-engagement-metric-value">{engagementMetrics.avgStartedCourses}</span>
                        </div>
                        <div className="teacher-engagement-metric">
                          <span className="teacher-engagement-metric-label">Avg completed lessons</span>
                          <span className="teacher-engagement-metric-value">{engagementMetrics.avgCompletedLessons}</span>
                        </div>
                      </div>
                    </div>
                    <div className="teacher-insight-panel teacher-insight-top">
                      <h4 className="teacher-insight-panel-title">Top students</h4>
                      <div className="teacher-insight-top-list">
                        {(classDetail || [])
                          .slice()
                          .sort((a, b) => (b.overallProgress ?? 0) - (a.overallProgress ?? 0))
                          .slice(0, 4)
                          .map((s) => (
                            <div key={s.id} className="teacher-insight-top-item">
                              <div className="teacher-insight-top-avatar">
                                {s.profile_photo ? (
                                  <img src={s.profile_photo} alt="" />
                                ) : (
                                  <span>{(s.full_name || s.username || '?').toString().charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="teacher-insight-top-name">{s.full_name || s.username || 'Student'}</span>
                              <span className="teacher-insight-top-pct">{s.overallProgress ?? 0}%</span>
                            </div>
                          ))}
                      </div>
                      {classDetail?.length > 4 && (
                        <p className="teacher-insight-view-all">{classDetail.length} students total</p>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                className={`teacher-attention-modal teacher-completion-modal ${darkMode ? 'teacher-attention-modal-dark' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Completion list for ${completionModalCourse}`}
              >
                <div className="teacher-completion-modal-header">
                  <span className="teacher-completion-modal-badge">{completionModalCourse}</span>
                  <h3>Course completion</h3>
                  <button type="button" className="teacher-attention-modal-close" onClick={closeCompletionModal} aria-label="Close">×</button>
                </div>
                <div className="teacher-attention-modal-body">
                  <div className="teacher-completion-tabs" role="tablist" aria-label="Completion status">
                      <button
                        type="button"
                      className={`teacher-completion-tab teacher-completion-tab-completed ${completionModalStatus === 'completed' ? 'teacher-completion-tab-active' : ''}`}
                      onClick={() => setCompletionModalStatus('completed')}
                      role="tab"
                      aria-selected={completionModalStatus === 'completed'}
                    >
                      <span className="teacher-completion-tab-icon" aria-hidden>✓</span>
                      <span>Completed</span>
                      <span className="teacher-completion-tab-count">{(completionBuckets[completionModalCourse]?.completed || []).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`teacher-completion-tab teacher-completion-tab-progress ${completionModalStatus === 'inProgress' ? 'teacher-completion-tab-active' : ''}`}
                      onClick={() => setCompletionModalStatus('inProgress')}
                      role="tab"
                      aria-selected={completionModalStatus === 'inProgress'}
                    >
                      <span className="teacher-completion-tab-icon" aria-hidden>◐</span>
                      <span>In progress</span>
                      <span className="teacher-completion-tab-count">{(completionBuckets[completionModalCourse]?.inProgress || []).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`teacher-completion-tab teacher-completion-tab-notstarted ${completionModalStatus === 'notStarted' ? 'teacher-completion-tab-active' : ''}`}
                      onClick={() => setCompletionModalStatus('notStarted')}
                      role="tab"
                      aria-selected={completionModalStatus === 'notStarted'}
                    >
                      <span className="teacher-completion-tab-icon" aria-hidden>○</span>
                      <span>Not started</span>
                      <span className="teacher-completion-tab-count">{(completionBuckets[completionModalCourse]?.notStarted || []).length}</span>
                    </button>
                        </div>

                  {completionModalRows.length === 0 ? (
                    <div className="teacher-completion-empty">
                      <span className="teacher-completion-empty-icon" aria-hidden>📋</span>
                      <p>No students in this list.</p>
                    </div>
                  ) : (
                    <div className="teacher-completion-table-wrap">
                      <table className="teacher-attention-table teacher-attention-table-completion">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Strand</th>
                            <th>Section</th>
                            <th>{completionModalCourse}</th>
                            <th>Overall</th>
                            <th>Last active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completionModalRows.map((s) => (
                            <tr key={s.id}>
                              <td className="teacher-attention-name">{s.full_name || s.username}</td>
                              <td><span className="teacher-completion-cell-badge">{s.grade || '—'}</span></td>
                              <td>{s.strand || '—'}</td>
                              <td>{s.section || '—'}</td>
                              <td>
                                <div className="teacher-completion-progress-cell">
                                  <div className="teacher-completion-progress-bar" role="presentation">
                                    <div className="teacher-completion-progress-fill" style={{ width: `${s.coursePct ?? 0}%` }} />
                                  </div>
                                  <span className="teacher-completion-progress-pct">{(s.coursePct ?? 0)}%</span>
                                </div>
                              </td>
                              <td>
                                <div className="teacher-completion-progress-cell">
                                  <div className="teacher-completion-progress-bar" role="presentation">
                                    <div className="teacher-completion-progress-fill" style={{ width: `${s.overallProgress ?? 0}%` }} />
                                  </div>
                                  <span className="teacher-completion-progress-pct">{(s.overallProgress ?? 0)}%</span>
                                </div>
                              </td>
                              <td className="teacher-completion-last-active">{getLastActiveText(s.lastActivity)}</td>
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
                          <div className="teacher-attention-table-wrap teacher-students-modal-table-wrap">
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
            <div className="teacher-announcement-topbar">
              <h3>Announcements</h3>
              <button
                type="button"
                className="teacher-announcement-new-btn"
                onClick={() => {
                  setAnnouncementEditingId(null);
                  setShowAnnouncementComposer((prev) => !prev);
                }}
              >
                {showAnnouncementComposer ? 'Hide Composer' : '+ New Announcement'}
              </button>
            </div>
            <p className="teacher-panel-hint">Post a message that students will see on their dashboard.</p>
            {showAnnouncementComposer && (
              <div className="teacher-announcement-form">
                <div className="teacher-announcement-composer">
                  <span className="teacher-announcement-composer-icon" aria-hidden>📣</span>
                  <span className="teacher-announcement-char-count">
                    {announcementText.length}/{MAX_ANNOUNCEMENT_LENGTH}
                  </span>
                </div>
                <textarea
                  placeholder="e.g. Quiz 1 due Friday. Remember to complete the HTML lectures."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="teacher-announcement-input"
                  rows={3}
                  maxLength={MAX_ANNOUNCEMENT_LENGTH}
                  disabled={announcementSending}
                  ref={announcementInputRef}
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
            )}
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
                            maxLength={MAX_ANNOUNCEMENT_LENGTH}
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
                          <h4 className="teacher-announcement-title">
                            {a.text?.trim()
                              ? (a.text.trim().split(/\s+/).slice(0, 5).join(' ') + (a.text.trim().split(/\s+/).length > 5 ? '...' : ''))
                              : 'Announcement'}
                          </h4>
                          <span className="teacher-announcement-text">{a.text}</span>
                          <div className="teacher-announcement-badges">
                            {a.pinned ? <span className="teacher-announcement-badge teacher-announcement-badge-pin">Pinned</span> : null}
                            {a.target?.grade ? (
                              <span className="teacher-announcement-badge teacher-announcement-badge-grade">
                                G{a.target.grade}{a.target?.strand ? ` ${a.target.strand}` : ''}
                              </span>
                            ) : null}
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
                        {a.created_at ? `Published: ${new Date(a.created_at).toLocaleString()}` : ''}
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
                          <button type="button" className="teacher-announcement-action" onClick={() => startEditAnnouncement(a)} aria-label="Edit announcement">
                            ✎
                          </button>
                          <button
                            type="button"
                            className="teacher-announcement-action teacher-announcement-action-danger"
                            onClick={() => deleteAnnouncement(a.id)}
                            disabled={announcementDeletingId === a.id}
                            aria-label="Delete announcement"
                          >
                            {announcementDeletingId === a.id ? '…' : '🗑'}
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
