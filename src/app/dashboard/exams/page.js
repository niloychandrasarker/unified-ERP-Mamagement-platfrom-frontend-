'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import toast from 'react-hot-toast';
import {
  Award,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  FileText,
  Printer,
  ChevronRight,
  BookOpen,
  School,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Layers,
  MapPin,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function ExamsManagementPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  // Active Main Tab: 'exams' (Roster) or 'schedules' (Routine/Timetable)
  const [activeTab, setActiveTab] = useState('exams');

  // Loading States
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Data
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    name: '',
    exam_type: 'MONTHLY',
    academic_year: '2026',
    term: 'Term 1',
    start_date: '',
    end_date: '',
    description: ''
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    exam_id: '',
    class_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '10:00 AM',
    end_time: '01:00 PM',
    duration_minutes: 180,
    room_number: '',
    full_marks: 100,
    pass_marks: 33
  });

  // Load Classes & Initial Exams
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingExams(true);
      const [examRes, classRes] = await Promise.all([
        api.get('/exams'),
        api.get('/academics/classes')
      ]);
      const examList = examRes.data.data || [];
      setExams(examList);
      setClasses(classRes.data.data || []);

      if (examList.length > 0) {
        setSelectedExamId(examList[0].id);
      }
    } catch (err) {
      toast.error('Failed to load exams data');
    } finally {
      setLoadingExams(false);
    }
  };

  // Load Schedules when exam or class changes
  useEffect(() => {
    if (activeTab === 'schedules' && selectedExamId) {
      loadSchedules();
    }
  }, [activeTab, selectedExamId, selectedClassId]);

  // Load Subjects when class selected in schedule form
  useEffect(() => {
    if (scheduleForm.class_id) {
      api.get(`/academics/subjects?class_id=${scheduleForm.class_id}`)
        .then(res => setSubjects(res.data.data || []))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [scheduleForm.class_id]);

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      let url = `/exams/schedules/list?exam_id=${selectedExamId}`;
      if (selectedClassId) url += `&class_id=${selectedClassId}`;
      const res = await api.get(url);
      setSchedules(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load exam routine');
    } finally {
      setLoadingSchedules(false);
    }
  };

  // ==========================================
  // EXAM CRUD HANDLERS
  // ==========================================
  const handleOpenExamModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setExamForm({
        name: exam.name || '',
        exam_type: exam.exam_type || 'MONTHLY',
        academic_year: exam.academic_year?.toString() || '2026',
        term: exam.term || 'Term 1',
        start_date: exam.start_date ? exam.start_date.slice(0, 10) : '',
        end_date: exam.end_date ? exam.end_date.slice(0, 10) : '',
        description: exam.description || ''
      });
    } else {
      setEditingExam(null);
      setExamForm({
        name: '',
        exam_type: 'MONTHLY',
        academic_year: '2026',
        term: 'Term 1',
        start_date: '',
        end_date: '',
        description: ''
      });
    }
    setShowExamModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      setSavingExam(true);
      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, examForm);
        toast.success(isBn ? 'পরীক্ষা সফলভাবে আপডেট হয়েছে!' : 'Exam updated successfully!');
      } else {
        const res = await api.post('/exams', examForm);
        toast.success(isBn ? 'নতুন পরীক্ষা তৈরি সম্পন্ন!' : 'New exam created successfully!');
        if (res.data?.data?.id) {
          setSelectedExamId(res.data.data.id);
        }
      }
      setShowExamModal(false);
      loadInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save exam');
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিত এই পরীক্ষা ও এর রুটিন মুছে ফেলতে চান?' : 'Are you sure you want to delete this exam and its schedule?')) {
      return;
    }
    try {
      await api.delete(`/exams/${examId}`);
      toast.success(isBn ? 'পরীক্ষা মুছে ফেলা হয়েছে' : 'Exam deleted');
      loadInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ==========================================
  // SCHEDULE (ROUTINE) CRUD HANDLERS
  // ==========================================
  const handleOpenScheduleModal = (sched = null, presetExamId = null) => {
    if (sched) {
      setEditingSchedule(sched);
      setScheduleForm({
        exam_id: sched.exam_id,
        class_id: sched.class_id,
        subject_id: sched.subject_id,
        exam_date: sched.exam_date ? sched.exam_date.slice(0, 10) : '',
        start_time: sched.start_time || '10:00 AM',
        end_time: sched.end_time || '01:00 PM',
        duration_minutes: sched.duration_minutes || 180,
        room_number: sched.room_number || '',
        full_marks: sched.full_marks || 100,
        pass_marks: sched.pass_marks || 33
      });
      if (sched.class_id) {
        api.get(`/academics/subjects?classId=${sched.class_id}&class_id=${sched.class_id}`)
          .then(res => setSubjects(res.data.data || []))
          .catch(() => setSubjects([]));
      }
    } else {
      const targetExamId = presetExamId || selectedExamId || (exams[0]?.id || '');
      const initialClassId = selectedClassId || (classes[0]?.id || '');
      setEditingSchedule(null);
      setScheduleForm({
        exam_id: targetExamId,
        class_id: initialClassId,
        subject_id: '',
        exam_date: '',
        start_time: '10:00 AM',
        end_time: '01:00 PM',
        duration_minutes: 180,
        room_number: '',
        full_marks: 100,
        pass_marks: 33
      });
      if (initialClassId) {
        api.get(`/academics/subjects?classId=${initialClassId}&class_id=${initialClassId}`)
          .then(res => setSubjects(res.data.data || []))
          .catch(() => setSubjects([]));
      }
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.exam_id || !scheduleForm.class_id || !scheduleForm.subject_id || !scheduleForm.exam_date) {
      toast.error(isBn ? 'পরীক্ষা, শ্রেণি, বিষয় ও পরীক্ষার তারিখ আবশ্যক' : 'Exam, class, subject, and date are required');
      return;
    }

    try {
      setSavingSchedule(true);
      if (editingSchedule) {
        await api.put(`/exams/schedules/${editingSchedule.id}`, scheduleForm);
        toast.success(isBn ? 'রুটিন আপডেট সম্পন্ন!' : 'Schedule updated successfully!');
      } else {
        await api.post('/exams/schedules', scheduleForm);
        toast.success(isBn ? 'রুটিনে নতুন বিষয় যুক্ত হয়েছে!' : 'Exam schedule created!');
      }
      setShowScheduleModal(false);
      setSelectedExamId(scheduleForm.exam_id);
      if (scheduleForm.class_id) setSelectedClassId(scheduleForm.class_id);
      setActiveTab('schedules');
      loadSchedules();
      loadInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm(isBn ? 'এই বিষয়ের পরীক্ষার সময়সূচী মুছে ফেলবেন?' : 'Delete this schedule entry?')) return;
    try {
      await api.delete(`/exams/schedules/${scheduleId}`);
      toast.success(isBn ? 'সময়সূচী মুছে ফেলা হয়েছে' : 'Schedule deleted');
      loadSchedules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const getExamTypeBadge = (type) => {
    const map = {
      WEEKLY: 'bg-teal-50 text-teal-700 border-teal-200',
      MONTHLY: 'bg-blue-50 text-blue-700 border-blue-200',
      CLASS_TEST: 'bg-purple-50 text-purple-700 border-purple-200',
      MIDTERM: 'bg-amber-50 text-amber-700 border-amber-200',
      FINAL: 'bg-rose-50 text-rose-700 border-rose-200',
      CUSTOM: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return map[type] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Award size={16} />
            <span>{isBn ? 'পরীক্ষা ও মূল্যায়ন সিস্টেম' : 'Exams & Assessment Module'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'পরীক্ষা ব্যবস্থাপনা ও রুটিন' : 'Exam Registry & Routine Timetable'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'সাপ্তাহিক, মাসিক, ক্লাস টেস্ট, মিডটার্ম ও সেমিস্টার ফাইনাল পরীক্ষা তৈরি ও সময়সূচী পরিচালনা করুন।'
              : 'Create flexible exams (Weekly, Monthly, Class Test, Midterm, Final) & schedule class routines.'}
          </p>
        </div>

        {/* Quick Module Navigation Links */}
        <div className="flex items-center flex-wrap gap-2">
          {isAdmin && (
            <Link
              href="/dashboard/exams/publish"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>{isBn ? 'ফলাফল প্রকাশ (Publish)' : 'Publish Results'}</span>
            </Link>
          )}
          <Link
            href="/dashboard/exams/marks"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Edit size={14} className="text-blue-600" />
            <span>{isBn ? 'নম্বর এন্ট্রি (Marks)' : 'Enter Marks'}</span>
          </Link>
          <Link
            href="/dashboard/exams/grading-rules"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Sliders size={14} className="text-purple-600" />
            <span>{isBn ? 'ফাইনাল ওয়েট কনফিগ' : 'Weight Config'}</span>
          </Link>
          <Link
            href="/dashboard/exams/results"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>{isBn ? 'ফলাফল ও মার্কশিট' : 'Results & Tabulation'}</span>
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award size={16} />
          <span>{isBn ? 'পরীক্ষা তালিকা (Exam Roster)' : 'Exam Registry'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold ml-1">
            {exams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar size={16} />
          <span>{isBn ? 'পরীক্ষার রুটিন / সময়সূচী' : 'Exam Routine (Timetable)'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXAMS ROSTER                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={isBn ? 'পরীক্ষার নাম দিয়ে খুঁজুন...' : 'Search exams...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600 bg-white"
              />
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenExamModal()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                <span>{isBn ? '+ নতুন পরীক্ষা তৈরি করুন' : '+ Create New Exam'}</span>
              </button>
            )}
          </div>

          {loadingExams ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
              <Award className="w-8 h-8 animate-bounce text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">{isBn ? 'পরীক্ষার তালিকা লোড হচ্ছে...' : 'Loading exams list...'}</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Award size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'কোনো পরীক্ষা তৈরি করা হয়নি' : 'No Exams Created Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isBn
                  ? 'আপনার প্রতিষ্ঠানে প্রথম সাময়িক, মাসিক বা ফাইনাল পরীক্ষা তৈরি করে সময়সূচী প্রণয়ন করুন।'
                  : 'Get started by creating Monthly, Weekly, Midterm, or Final exams for your campus.'}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenExamModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isBn ? 'প্রথম পরীক্ষা তৈরি করুন' : 'Create First Exam'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams
                .filter(e => !searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.term.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${getExamTypeBadge(exam.exam_type)}`}>
                          {exam.exam_type?.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                          {exam.academic_year} • {exam.term}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{exam.name}</h3>
                        {exam.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{exam.description}</p>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'সময়কাল' : 'Date Range'}</p>
                          <p className="font-semibold text-slate-700 mt-0.5">
                            {exam.start_date ? exam.start_date.slice(0, 10) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'রুটিনের বিষয়' : 'Subjects'}</p>
                          <p className="font-semibold text-blue-600 mt-0.5">
                            {exam.total_schedules || 0} {isBn ? 'টি বিষয়' : 'Schedules'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExamId(exam.id);
                            setActiveTab('schedules');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <span>{isBn ? 'রুটিন দেখুন' : 'View Routine'}</span>
                          <ChevronRight size={14} />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(null, exam.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} />
                            <span>{isBn ? 'রুটিন তৈরি' : '+ Routine'}</span>
                          </button>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenExamModal(exam)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Exam"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Exam"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXAM ROUTINE (TIMETABLE)                                           */}
      {/* ========================================================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {/* Schedule Filters Header */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-full sm:w-60">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {isBn ? 'পরীক্ষা নির্বাচন করুন' : 'Select Exam'}
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.term})</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {isBn ? 'শ্রেণি নির্বাচন' : 'Filter Class'}
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="">{isBn ? '-- সকল শ্রেণি --' : '-- All Classes --'}</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>{isBn ? 'রুটিন প্রিন্ট' : 'Print Routine'}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenScheduleModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>{isBn ? '+ সময়সূচী যোগ করুন' : '+ Add Schedule'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Schedules Table */}
          {loadingSchedules ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
              <Calendar className="w-8 h-8 animate-bounce text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">{isBn ? 'রুটিন লোড হচ্ছে...' : 'Loading exam routine...'}</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <Calendar size={32} className="text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {isBn ? 'এই পরীক্ষার কোনো রুটিন তৈরি করা হয়নি' : 'No Schedules Added for this Exam'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isBn
                  ? 'শ্রেণি ও বিষয় নির্বাচন করে পরীক্ষার তারিখ, সময় এবং পূর্ণমান নির্ধারণ করুন।'
                  : 'Add subjects, dates, timings, and rooms to build the routine timetable.'}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenScheduleModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isBn ? 'প্রথম সময়সূচী যোগ করুন' : 'Add First Schedule'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                      <th className="py-3 px-4">{isBn ? 'শ্রেণি' : 'Class'}</th>
                      <th className="py-3 px-4">{isBn ? 'বিষয় ও কোড' : 'Subject & Code'}</th>
                      <th className="py-3 px-4">{isBn ? 'দায়িত্বপ্রাপ্ত শিক্ষক' : 'Assigned Teacher'}</th>
                      <th className="py-3 px-4">{isBn ? 'রুম' : 'Room'}</th>
                      <th className="py-3 px-4">{isBn ? 'পূর্ণমান / পাস' : 'Marks (Full/Pass)'}</th>
                      <th className="py-3 px-4">{isBn ? 'নম্বর এন্ট্রি অবস্থা' : 'Marks Status'}</th>
                      <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedules.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">
                            {item.exam_date ? item.exam_date.slice(0, 10) : '—'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-blue-500" />
                            <span>{item.start_time} - {item.end_time}</span>
                            <span>({item.duration_minutes}m)</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                            {item.class_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-blue-900">{item.subject_name}</p>
                          {item.subject_code && (
                            <span className="text-[10px] font-mono text-slate-400">{item.subject_code}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.teacher_name ? (
                            <div>
                              <p className="font-bold text-slate-800">{item.teacher_name}</p>
                              <p className="text-[10px] text-slate-400">{item.teacher_email}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                              {isBn ? 'শিক্ষক নির্ধারিত নয়' : 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.room_number ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-semibold rounded">
                              Room {item.room_number}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-800">{item.full_marks}</span>
                          <span className="text-slate-400 text-[10px]"> / Pass: {item.pass_marks}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.is_marks_submitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                              <CheckCircle2 size={10} /> Submitted
                            </span>
                          ) : item.marks_entry_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                              Draft ({item.marks_entry_count} entered)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-semibold">Not Entered</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/exams/marks?schedule_id=${item.id}&exam_id=${item.exam_id}&class_id=${item.class_id}`}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              {isBn ? 'নম্বর দিন' : 'Enter Marks'}
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenScheduleModal(item)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT EXAM                                               */}
      {/* ========================================================================= */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingExam
                      ? (isBn ? 'পরীক্ষা সম্পাদনা করুন' : 'Edit Exam Details')
                      : (isBn ? 'নতুন পরীক্ষা তৈরি করুন' : 'Create New Exam')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'নাম, টাইপ, শিক্ষাবর্ষ ও টার্ম নির্ধারণ করুন।' : 'Set name, exam type, session, and term.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'পরীক্ষার নাম' : 'Exam Title'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: ১ম সাময়িক পরীক্ষা ২০২৬' : 'e.g. 1st Midterm Exam 2026'}
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isBn ? 'পরীক্ষার ধরন' : 'Exam Type'} *
                  </label>
                  <select
                    value={examForm.exam_type}
                    onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="WEEKLY">Weekly Exam</option>
                    <option value="MONTHLY">Monthly Exam</option>
                    <option value="CLASS_TEST">Class Test</option>
                    <option value="MIDTERM">Midterm Exam</option>
                    <option value="FINAL">Semester Final</option>
                    <option value="CUSTOM">Custom Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isBn ? 'টার্ম / সেমিস্টার' : 'Term / Semester'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Term 1 / Semester 1"
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isBn ? 'শুরুর তারিখ' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={examForm.start_date}
                    onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isBn ? 'শেষের তারিখ' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={examForm.end_date}
                    onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'বর্ণনা বা নির্দেশনা (ঐচ্ছিক)' : 'Description or Instructions'}
                </label>
                <textarea
                  rows={2}
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  placeholder={isBn ? 'পরীক্ষা সংক্রান্ত বিশেষ নির্দেশনা...' : 'Optional notes...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {savingExam ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সংরক্ষণ করুন' : 'Save Exam')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT EXAM SCHEDULE                                      */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingSchedule
                      ? (isBn ? 'সময়সূচী পরিবর্তন' : 'Edit Exam Routine Schedule')
                      : (isBn ? 'রুটিনে নতুন বিষয় যোগ' : 'Add Subject to Exam Routine')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'তারিখ, সময়, রুম ও পূর্ণমান নির্ধারণ করুন।' : 'Configure timing, room, and marks.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'পরীক্ষা' : 'Exam'} *</label>
                  <select
                    required
                    disabled={!!editingSchedule}
                    value={scheduleForm.exam_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, exam_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'শ্রেণি' : 'Class'} *</label>
                  <select
                    required
                    disabled={!!editingSchedule}
                    value={scheduleForm.class_id}
                    onChange={(e) => {
                      const newCId = e.target.value;
                      setScheduleForm({ ...scheduleForm, class_id: newCId, subject_id: '' });
                      if (newCId) {
                        api.get(`/academics/subjects?classId=${newCId}&class_id=${newCId}`)
                          .then(res => setSubjects(res.data.data || []))
                          .catch(() => setSubjects([]));
                      } else {
                        setSubjects([]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select Class --'}</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'বিষয় / কোর্স' : 'Subject'} *</label>
                <select
                  required
                  disabled={!!editingSchedule}
                  value={scheduleForm.subject_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="">{isBn ? '-- বিষয় নির্বাচন করুন --' : '-- Select Subject --'}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'পরীক্ষার তারিখ' : 'Date'} *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.exam_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'রুম নং' : 'Room No'}</label>
                  <input
                    type="text"
                    placeholder="e.g. 402"
                    value={scheduleForm.room_number}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">{isBn ? 'সময়সূচী নির্ধারণ ও প্রিসেট' : 'Timing Presets'}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScheduleForm(prev => ({ ...prev, start_time: '10:00 AM', end_time: '01:00 PM', duration_minutes: 180 }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[10px] font-bold rounded-md transition-colors"
                    >
                      10 AM - 1 PM (3h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm(prev => ({ ...prev, start_time: '02:00 PM', end_time: '05:00 PM', duration_minutes: 180 }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[10px] font-bold rounded-md transition-colors"
                    >
                      2 PM - 5 PM (3h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm(prev => ({ ...prev, start_time: '10:00 AM', end_time: '12:00 PM', duration_minutes: 120 }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[10px] font-bold rounded-md transition-colors"
                    >
                      10 AM - 12 PM (2h)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'শুরুর সময়' : 'Start'}</label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'শেষের সময়' : 'End'}</label>
                    <input
                      type="text"
                      placeholder="01:00 PM"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'সময়কাল (মিনিট)' : 'Duration (min)'}</label>
                    <input
                      type="number"
                      value={scheduleForm.duration_minutes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'পূর্ণমান (Full Marks)' : 'Full Marks'} *</label>
                  <input
                    type="number"
                    required
                    value={scheduleForm.full_marks}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, full_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'পাস মার্ক (Pass Marks)' : 'Pass Marks'} *</label>
                  <input
                    type="number"
                    required
                    value={scheduleForm.pass_marks}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, pass_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {savingSchedule ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'রুটিন সেভ করুন' : 'Save Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

