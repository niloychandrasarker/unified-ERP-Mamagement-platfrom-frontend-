'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import toast from 'react-hot-toast';
import {
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
  User,
  BookOpen,
  Calendar,
  Lock,
  Unlock,
  MessageSquare,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// Safe image helper
const getPhotoSrc = (val) => {
  if (!val) return '';
  if (typeof val === 'object') return val.url || val.thumbnailUrl || '';
  if (typeof val === 'string') {
    if (val.startsWith('{') && val.includes('"url"')) {
      try {
        return JSON.parse(val).url || val;
      } catch (e) {
        return val;
      }
    }
    return val;
  }
  return '';
};

// Calculate live grade
const getLiveGrade = (obtained, full = 100, isAbsent = false) => {
  if (isAbsent || full <= 0) return { grade: 'F', point: '0.00', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  const pct = (obtained / full) * 100.0;
  if (pct >= 80.0) return { grade: 'A+', point: '5.00', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (pct >= 70.0) return { grade: 'A', point: '4.00', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  if (pct >= 60.0) return { grade: 'A-', point: '3.50', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  if (pct >= 50.0) return { grade: 'B', point: '3.00', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (pct >= 40.0) return { grade: 'C', point: '2.00', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (pct >= 33.0) return { grade: 'D', point: '1.00', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { grade: 'F', point: '0.00', color: 'text-rose-700 bg-rose-50 border-rose-200' };
};

function MarksEntryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  // Selection Filters
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('exam_id') || '');
  const [selectedScheduleId, setSelectedScheduleId] = useState(searchParams.get('schedule_id') || '');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Loaded Marks Roster
  const [scheduleData, setScheduleData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [saving, setSaving] = useState(false);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [requestingCorrection, setRequestingCorrection] = useState(false);

  // Load initial exams and teacher's schedules
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setLoadingInitial(true);
        const [examRes, schedRes] = await Promise.all([
          api.get('/exams'),
          api.get(isTeacher ? '/exams/schedules/list?my_subjects=true' : '/exams/schedules/list')
        ]);
        const examList = examRes.data.data || [];
        const schedList = schedRes.data.data || [];
        setExams(examList);
        setSchedules(schedList);

        if (!selectedExamId && examList.length > 0) {
          setSelectedExamId(examList[0].id);
        }

        if (selectedScheduleId) {
          // Verify it exists in schedules
          const found = schedList.find(s => s.id === selectedScheduleId);
          if (found) {
            setSelectedExamId(found.exam_id);
          }
        } else if (schedList.length > 0) {
          setSelectedScheduleId(schedList[0].id);
        }
      } catch (err) {
        toast.error('Failed to initialize marks entry');
      } finally {
        setLoadingInitial(false);
      }
    };
    loadFilters();
  }, [isTeacher]);

  // Load Marks Roster whenever selectedScheduleId or selectedSectionId changes
  useEffect(() => {
    if (!selectedScheduleId) return;
    fetchRoster();
  }, [selectedScheduleId, selectedSectionId]);

  const fetchRoster = async () => {
    try {
      setLoadingMarks(true);
      let url = `/exams/schedules/${selectedScheduleId}/marks`;
      if (selectedSectionId) url += `?section_id=${selectedSectionId}`;

      const res = await api.get(url);
      const data = res.data.data;
      setScheduleData(data.schedule);

      // Initialize form entries for each student
      const mappedStudents = (data.students || []).map(s => ({
        ...s,
        theory_marks: s.theory_marks || '',
        mcq_marks: s.mcq_marks || '',
        practical_marks: s.practical_marks || '',
        is_absent: Boolean(s.is_absent)
      }));
      setRoster(mappedStudents);

      // Load sections for this class
      if (data.schedule?.class_id) {
        api.get(`/academics/sections?class_id=${data.schedule.class_id}`)
          .then(secRes => setSections(secRes.data.data || []))
          .catch(() => setSections([]));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data?.message || 'Access Denied: Subject not assigned to you.');
        setRoster([]);
        setScheduleData(null);
      } else {
        toast.error('Failed to load marks roster');
      }
    } finally {
      setLoadingMarks(false);
    }
  };

  // Filtered schedules according to selectedExamId and teacher assignment
  const availableSchedules = useMemo(() => {
    let list = schedules;
    if (isTeacher && user?.id) {
      list = list.filter(s => s.teacher_id === user.id);
    }
    if (selectedExamId) {
      list = list.filter(s => s.exam_id === selectedExamId);
    }
    return list;
  }, [schedules, selectedExamId, isTeacher, user]);

  // Input change handler
  const handleMarkChange = (studentId, field, val) => {
    setRoster(prev => prev.map(item => {
      if (item.student_id !== studentId) return item;
      return { ...item, [field]: val };
    }));
  };

  // Toggle absent
  const handleToggleAbsent = (studentId) => {
    setRoster(prev => prev.map(item => {
      if (item.student_id !== studentId) return item;
      const willBeAbsent = !item.is_absent;
      return {
        ...item,
        is_absent: willBeAbsent,
        theory_marks: willBeAbsent ? '0' : item.theory_marks,
        mcq_marks: willBeAbsent ? '0' : item.mcq_marks,
        practical_marks: willBeAbsent ? '0' : item.practical_marks
      };
    }));
  };

  // Save / Submit marks
  const handleSaveMarks = async (isSubmitting = false) => {
    if (!selectedScheduleId) return;

    if (isSubmitting && !window.confirm(isBn ? 'আপনি কি নিশ্চিত নম্বর জমা দিতে চান? জমা দেওয়ার পর তা লক হয়ে যাবে।' : 'Are you sure you want to submit marks for review? Once submitted, marks will be locked.')) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        submit: isSubmitting,
        marks: roster.map(r => ({
          student_id: r.student_id,
          theory_marks: r.is_absent ? 0 : parseFloat(r.theory_marks) || 0,
          mcq_marks: r.is_absent ? 0 : parseFloat(r.mcq_marks) || 0,
          practical_marks: r.is_absent ? 0 : parseFloat(r.practical_marks) || 0,
          is_absent: r.is_absent
        }))
      };

      const res = await api.post(`/exams/schedules/${selectedScheduleId}/marks`, payload);
      toast.success(res.data.message || (isSubmitting ? 'Marks submitted successfully!' : 'Draft saved!'));
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Admin: Approve Marks
  const handleApproveMarks = async () => {
    try {
      setSaving(true);
      await api.post(`/exams/schedules/${selectedScheduleId}/marks/approve`);
      toast.success(isBn ? 'নম্বর সফলভাবে অনুমোদিত হয়েছে!' : 'Marks approved successfully!');
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setSaving(false);
    }
  };

  // Admin: Request Correction
  const handleSendCorrectionRequest = async (e) => {
    e.preventDefault();
    try {
      setRequestingCorrection(true);
      await api.post(`/exams/schedules/${selectedScheduleId}/marks/correction`, { notes: correctionNotes });
      toast.success(isBn ? 'শিক্ষকের নিকট সংশোধনের অনুরোধ পাঠানো হয়েছে!' : 'Correction request sent to teacher!');
      setShowCorrectionModal(false);
      setCorrectionNotes('');
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send correction request');
    } finally {
      setRequestingCorrection(false);
    }
  };

  // Publish / Unpublish Weekly/Monthly Assessment Marks
  const handlePublishAssessmentMarks = async (shouldPublish = true) => {
    try {
      setSaving(true);
      const res = await api.post(`/exams/schedules/${selectedScheduleId}/marks/publish`, {
        publish: shouldPublish
      });
      toast.success(res.data.message || (shouldPublish ? (isBn ? 'নম্বর সফলভাবে প্রকাশিত হয়েছে!' : 'Marks published to students!') : (isBn ? 'ফলাফল অপ্রকাশিত করা হয়েছে' : 'Unpublished')));
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Weekly, Monthly, Class Test exams can be published directly by teacher
  const isAssessmentPublishableByTeacher = useMemo(() => {
    if (!scheduleData) return false;
    const type = scheduleData.exam_type;
    return type === 'WEEKLY' || type === 'MONTHLY' || type === 'CLASS_TEST' || type === 'CUSTOM';
  }, [scheduleData]);

  const isSchedulePublished = useMemo(() => {
    if (!roster.length) return false;
    return roster.every(r => r.status === 'PUBLISHED');
  }, [roster]);

  const isScheduleSubmitted = useMemo(() => {
    if (!roster.length) return false;
    return roster.every(r => r.status === 'SUBMITTED' || r.status === 'APPROVED');
  }, [roster]);

  // Determine if marks are currently locked for teacher editing
  const isLockedForTeacher = useMemo(() => {
    if (!scheduleData || !roster.length) return false;
    if (isAdmin) return false; // Admin can always edit
    const currentStatus = roster[0]?.status;
    return currentStatus === 'SUBMITTED' || currentStatus === 'APPROVED' || currentStatus === 'PUBLISHED';
  }, [scheduleData, roster, isAdmin]);

  const hasCorrectionRequested = useMemo(() => {
    return roster.some(r => r.status === 'CORRECTION_REQUESTED');
  }, [roster]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Edit3 size={16} />
            <span>{isBn ? 'মূল্যায়ন ও পরীক্ষা নম্বর এন্ট্রি' : 'Assessment Marks Recording'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'শ্রেণি ও বিষয়ভিত্তিক নম্বর প্রদান' : 'Course & Student-wise Marks Entry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isTeacher
              ? (isBn ? '🔒 শিক্ষক গোপনীয়তা: আপনি শুধুমাত্র আপনার নির্ধারিত বিষয়ের নম্বর দেখতে ও দিতে পারবেন।' : '🔒 Teacher Privacy: You can only view and grade subjects assigned to you.')
              : (isBn ? 'সকল বিষয়ের নম্বর পর্যালোচনা, সংশোধন অনুরোধ ও অনুমোদন করুন।' : 'Review, grade, and approve subject marks across all classes.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/exams"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>{isBn ? 'রুটিনে ফিরুন' : 'Back to Routine'}</span>
          </Link>
          <Link
            href="/dashboard/exams/results"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck size={14} />
            <span>{isBn ? 'ফলাফল ও মার্কশিট' : 'Results Hub'}</span>
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        {/* Exam Select */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {isBn ? '১. পরীক্ষা' : '1. Select Exam'}
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedScheduleId('');
            }}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white text-slate-800"
          >
            <option value="">{isBn ? '-- পরীক্ষা নির্বাচন করুন --' : '-- Select Exam --'}</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.term})</option>
            ))}
          </select>
        </div>

        {/* Schedule / Subject Select (Filtered by Teacher) */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {isBn ? '২. শ্রেণি ও বিষয় (রুটিন)' : '2. Class & Subject Routine'}
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            disabled={!selectedExamId || availableSchedules.length === 0}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white text-slate-800"
          >
            <option value="">
              {availableSchedules.length === 0
                ? (isBn ? '-- এই পরীক্ষায় কোনো বিষয় নেই --' : '-- No subjects scheduled --')
                : (isBn ? '-- বিষয় নির্বাচন করুন --' : '-- Select Subject & Class --')}
            </option>
            {availableSchedules.map(s => (
              <option key={s.id} value={s.id}>
                [{s.class_name}] {s.subject_name} {s.subject_code ? `(${s.subject_code})` : ''} • {s.teacher_name ? `Teacher: ${s.teacher_name}` : 'Unassigned'}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Section Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {isBn ? '৩. শাখা / সেকশন (ঐচ্ছিক)' : '3. Filter Section'}
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white text-slate-800"
          >
            <option value="">{isBn ? '-- সকল সেকশন --' : '-- All Sections --'}</option>
            {sections.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STATUS & CORRECTION NOTICE BANNER */}
      {hasCorrectionRequested && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-amber-950">
              {isBn ? '⚠️ অধ্যক্ষ / অ্যাডমিন থেকে সংশোধনের অনুরোধ এসেছে' : '⚠️ Correction Requested by Principal / Admin'}
            </p>
            <p className="mt-1 text-amber-800">
              <strong>{isBn ? 'মন্তব্য/নির্দেশনা: ' : 'Admin Feedback: '}</strong>
              {roster.find(r => r.correction_notes)?.correction_notes || 'Please verify marks entry.'}
            </p>
            <p className="text-[11px] text-amber-700 mt-1 font-semibold">
              {isBn
                ? 'নম্বরসমূহ পুনরায় যাচাই করে পরিবর্তন করুন এবং আবার "Submit for Review" বাটনে ক্লিক করুন।'
                : 'Modify the corrected marks and click "Submit for Review" once done.'}
            </p>
          </div>
        </div>
      )}

      {isLockedForTeacher && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-blue-900">
          <div className="flex items-center gap-2.5 text-xs">
            <Lock size={18} className="text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-blue-950">
                {isBn ? '🔒 নম্বর তালিকা সফলভাবে জমা দেওয়া হয়েছে (লক)' : '🔒 Marks Locked & Under Review'}
              </p>
              <p className="text-blue-700 text-[11px]">
                {isBn
                  ? 'এই বিষয়ের নম্বর অধ্যক্ষ/অ্যাডমিন পর্যালোচনার জন্য জমা রয়েছে। কোনো পরিবর্তন করতে অধ্যক্ষের সাথে যোগাযোগ করুন।'
                  : 'Submitted marks are currently under administrative review. Contact Principal if changes are needed.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-2xs">
            Submitted
          </span>
        </div>
      )}

      {/* MARKS ENTRY TABLE */}
      {loadingMarks ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
          <Edit3 className="w-8 h-8 animate-bounce text-blue-500 mx-auto mb-2" />
          <p className="text-xs font-semibold">{isBn ? 'নম্বর তালিকা লোড হচ্ছে...' : 'Loading student marks roster...'}</p>
        </div>
      ) : !selectedScheduleId ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <BookOpen size={32} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            {isBn ? 'অনুগ্রহ করে উপরের ফিল্টার থেকে পরীক্ষা ও বিষয় নির্বাচন করুন' : 'Select an Exam and Subject to Begin Marks Entry'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isTeacher
              ? (isBn ? 'শুধুমাত্র আপনার নির্ধারিত কোর্সসমূহই তালিকায় প্রদর্শিত হবে।' : 'Only your assigned courses will appear in the dropdown.')
              : (isBn ? 'অ্যাডমিন হিসেবে আপনি যেকোনো বিষয়ের নম্বর এন্ট্রি ও পর্যালোচনা করতে পারেন।' : 'As administrator, you can view and enter marks for any subject.')}
          </p>
        </div>
      ) : roster.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <User size={32} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            {isBn ? 'এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Found in this Class'}
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Schedule Info Header */}
          {scheduleData && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    {scheduleData.subject_name}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded text-[10px]">
                    {scheduleData.class_name}
                  </span>
                  {scheduleData.subject_code && (
                    <span className="font-mono text-slate-400">Code: {scheduleData.subject_code}</span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">
                  {scheduleData.exam_name} • Full Marks: <strong className="text-slate-800">{scheduleData.full_marks}</strong> • Pass: <strong className="text-slate-800">{scheduleData.pass_marks}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isBn ? 'রোল বা নাম...' : 'Search roll/name...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Roll</th>
                  <th className="py-3 px-4">{isBn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="py-3 px-3">{isBn ? 'অনুপস্থিত?' : 'Absent?'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'তত্ত্বীয় (Theory)' : 'Theory'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'এমসিকিউ (MCQ)' : 'MCQ'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'ব্যবহারিক (Prac)' : 'Practical'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'মোট নম্বর' : 'Total'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'গ্রেড ও পয়েন্ট' : 'Grade (GPA)'}</th>
                  <th className="py-3 px-3 text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {roster
                  .filter(s => !studentSearch || s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) || s.roll_number?.toString().includes(studentSearch))
                  .map((stu) => {
                    const fullMarks = parseFloat(scheduleData?.full_marks) || 100.0;
                    const theory = stu.is_absent ? 0 : parseFloat(stu.theory_marks) || 0;
                    const mcq = stu.is_absent ? 0 : parseFloat(stu.mcq_marks) || 0;
                    const practical = stu.is_absent ? 0 : parseFloat(stu.practical_marks) || 0;
                    const totalObtained = stu.is_absent ? 0 : Math.min(fullMarks, theory + mcq + practical);
                    const liveGrade = getLiveGrade(totalObtained, fullMarks, stu.is_absent);

                    return (
                      <tr key={stu.student_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 text-xs">
                          {stu.roll_number || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {stu.photo_url ? (
                              <img
                                src={getPhotoSrc(stu.photo_url)}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {stu.student_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{stu.student_name}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                ID: {stu.student_code} {stu.section_name ? `• ${stu.section_name}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Absent toggle */}
                        <td className="py-3 px-3">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={stu.is_absent}
                              disabled={isLockedForTeacher}
                              onChange={() => handleToggleAbsent(stu.student_id)}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                            />
                            <span className={stu.is_absent ? 'font-bold text-rose-600 text-[11px]' : 'text-slate-400 text-[11px]'}>
                              {stu.is_absent ? (isBn ? 'অনুপস্থিত' : 'Absent') : (isBn ? 'উপস্থিত' : 'Present')}
                            </span>
                          </label>
                        </td>

                        {/* Theory Marks */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={fullMarks}
                            disabled={stu.is_absent || isLockedForTeacher}
                            value={stu.theory_marks}
                            onChange={(e) => handleMarkChange(stu.student_id, 'theory_marks', e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs focus:outline-hidden focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>

                        {/* MCQ Marks */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={fullMarks}
                            disabled={stu.is_absent || isLockedForTeacher}
                            value={stu.mcq_marks}
                            onChange={(e) => handleMarkChange(stu.student_id, 'mcq_marks', e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs focus:outline-hidden focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>

                        {/* Practical Marks */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={fullMarks}
                            disabled={stu.is_absent || isLockedForTeacher}
                            value={stu.practical_marks}
                            onChange={(e) => handleMarkChange(stu.student_id, 'practical_marks', e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs focus:outline-hidden focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>

                        {/* Total Obtained */}
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-800">
                          {totalObtained.toFixed(1)}
                        </td>

                        {/* Live Grade Preview */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 font-bold font-mono text-[11px] rounded-lg border ${liveGrade.color}`}>
                            {liveGrade.grade} ({liveGrade.point})
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            stu.status === 'SUBMITTED' || stu.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : stu.status === 'CORRECTION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {stu.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-semibold">
              Total: {roster.length} students • Full Marks: {scheduleData?.full_marks}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Published Badge & Unpublish Button */}
              {isSchedulePublished && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCheck size={14} />
                    <span>{isBn ? 'ফলাফল প্রকাশিত (শিক্ষার্থীরা দেখতে পারছে)' : 'Published to Students'}</span>
                  </span>
                  {(isTeacher || isAdmin) && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handlePublishAssessmentMarks(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
                    >
                      {isBn ? 'অপ্রকাশিত করুন (Edit)' : 'Unpublish'}
                    </button>
                  )}
                </div>
              )}

              {/* Submitted Status Badge for Semester Finals */}
              {!isAssessmentPublishableByTeacher && isScheduleSubmitted && !isSchedulePublished && (
                <span className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{isBn ? 'জমা দেওয়া হয়েছে (প্রিন্সিপাল মহোদয়ের অনুমোদনের অপেক্ষায়)' : 'Submitted • Awaiting Principal Approval'}</span>
                </span>
              )}

              {/* Editable Actions */}
              {!isLockedForTeacher && !isSchedulePublished && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveMarks(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{isBn ? 'খসড়া সংরক্ষণ (Save Draft)' : 'Save Draft'}</span>
                  </button>

                  {isAssessmentPublishableByTeacher ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handlePublishAssessmentMarks(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={15} />
                      <span>{isBn ? '🚀 ফলাফল পাবলিশ করুন' : '🚀 Publish Assessment Result'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveMarks(true)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={15} />
                      <span>{isBn ? '📤 প্রিন্সিপালের কাছে জমা দিন' : '📤 Submit to Principal'}</span>
                    </button>
                  )}
                </>
              )}

              {/* Admin Approval Actions */}
              {isAdmin && !isSchedulePublished && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(true)}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>{isBn ? 'সংশোধনের অনুরোধ' : 'Request Correction'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveMarks}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>{isBn ? 'অনুমোদন করুন (Approve)' : 'Approve Marks'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION REQUEST MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isBn ? 'শিক্ষকের নিকট সংশোধনের অনুরোধ' : 'Request Marks Correction'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isBn ? 'নম্বর তালিকা আনলক হবে এবং শিক্ষক সংশোধনের বার্তা পাবেন।' : 'This will unlock marks for the subject teacher to edit.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendCorrectionRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'সংশোধনের কারণ ও নির্দেশনা' : 'Correction Instructions / Notes'} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={isBn ? 'যেমন: রোল ৫ ও ৭ এর তত্ত্বীয় নম্বর পুনরায় চেক করুন...' : 'e.g. Please recheck Roll 5 and 7 theory marks...'}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={requestingCorrection}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {requestingCorrection ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'অনুরোধ পাঠান' : 'Send Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarksEntryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading marks entry module...</div>}>
      <MarksEntryContent />
    </Suspense>
  );
}

