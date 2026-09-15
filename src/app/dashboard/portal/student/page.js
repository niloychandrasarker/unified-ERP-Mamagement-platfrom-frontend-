'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  GraduationCap, Calendar, ClipboardCheck, CreditCard, Award,
  BookOpen, Clock, Bell, MapPin, Phone, User, CheckCircle2,
  XCircle, AlertCircle, Printer, Download, Eye, FileText,
  DollarSign, Sparkles, X, ChevronRight, Wallet, Coffee
} from 'lucide-react';
import { printExamRoutine, printClassRoutine } from '@/lib/printRoutine';
import CampusLogo from '@/components/common/CampusLogo';

const DAYS_OF_WEEK = [
  { key: 'SUNDAY', en: 'Sunday', bn: 'রবিবার' },
  { key: 'MONDAY', en: 'Monday', bn: 'সোমবার' },
  { key: 'TUESDAY', en: 'Tuesday', bn: 'মঙ্গলবার' },
  { key: 'WEDNESDAY', en: 'Wednesday', bn: 'বুধবার' },
  { key: 'THURSDAY', en: 'Thursday', bn: 'বৃহস্পতিবার' },
  { key: 'SATURDAY', en: 'Saturday', bn: 'শনিবার' }
];

const DEFAULT_PERIODS = [
  { num: 1, start: '08:30', end: '09:15', labelEn: 'Period 1', labelBn: '১ম পিরিয়ড', isBreak: false },
  { num: 2, start: '09:15', end: '10:00', labelEn: 'Period 2', labelBn: '২য় পিরিয়ড', isBreak: false },
  { num: 3, start: '10:00', end: '10:45', labelEn: 'Period 3', labelBn: '৩য় পিরিয়ড', isBreak: false },
  { num: 0, start: '10:45', end: '11:15', labelEn: 'Tiffin Break', labelBn: 'টিফিন বিরতি', isBreak: true },
  { num: 4, start: '11:15', end: '12:00', labelEn: 'Period 4', labelBn: '৪র্থ পিরিয়ড', isBreak: false },
  { num: 5, start: '12:00', end: '12:45', labelEn: 'Period 5', labelBn: '৫ম পিরিয়ড', isBreak: false },
  { num: 6, start: '12:45', end: '01:30', labelEn: 'Period 6', labelBn: '৬ষ্ঠ পিরিয়ড', isBreak: false },
  { num: 7, start: '01:30', end: '02:15', labelEn: 'Period 7', labelBn: '৭ম পিরিয়ড', isBreak: false }
];

function StudentPortalContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, attendance, results, fees, routine, notices

  // Modals
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [routinePrintModalOpen, setRoutinePrintModalOpen] = useState(false);
  const [examToPrint, setExamToPrint] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/portal-dashboard');
      setPortalData(res.data.data);
    } catch (err) {
      console.error('Failed to load student portal data', err);
      toast.error(isBn ? 'স্টুডেন্ট পোর্টাল তথ্য লোড করা যায়নি' : 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams ? searchParams.get('tab') : null;

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'exam_routine') {
      setSelectedExamId(null);
    }
    router.push(`/dashboard/portal/student?tab=${newTab}`);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tabFromUrl) {
      if (tabFromUrl === 'routine' || tabFromUrl === 'exam_routine') {
        setActiveTab('exam_routine');
        setSelectedExamId(null);
      } else if (['overview', 'attendance', 'results', 'fees', 'class_routine', 'notices'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    } else {
      setActiveTab('overview');
    }
  }, [tabFromUrl]);
  const student = portalData?.student || {};
  const attStats = portalData?.attendance?.stats || { percentage: 100, total_days: 0, present_days: 0, absent_days: 0, late_days: 0, leave_days: 0 };
  const recentAttendance = portalData?.attendance?.recent || [];
  const results = portalData?.results?.published_terms || portalData?.results?.term_results || [];
  const subjectMarks = portalData?.results?.recent_marks || portalData?.results?.subject_marks || [];
  const fees = portalData?.fees || { total_invoiced: 0, total_paid: 0, total_due: 0, invoices: [], recent_payments: [] };
  const examRoutines = portalData?.exam_routines || portalData?.routine || [];
  const classRoutines = portalData?.class_routines || [];
  const routines = examRoutines; // backwards compatible
  const notices = portalData?.notices || [];

  const [periods, setPeriods] = useState(DEFAULT_PERIODS);

  useEffect(() => {
    const instId = user?.institution?.id || student?.institution_id || 'default';
    const storageKey = `uemp_routine_periods_${instId}`;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPeriods(parsed);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse saved periods', e);
    }
    setPeriods(DEFAULT_PERIODS);
  }, [user, student]);

  const getClassSlot = (dayKey, periodNum) => {
    return (classRoutines || []).find(r => r.day_of_week === dayKey && Number(r.period_number) === Number(periodNum));
  };

  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDay = daysOfWeek[new Date().getDay()];

  const getDayLabel = (dayKey) => {
    const map = {
      SUNDAY: isBn ? 'রবিবার' : 'Sunday',
      MONDAY: isBn ? 'সোমবার' : 'Monday',
      TUESDAY: isBn ? 'মঙ্গলবার' : 'Tuesday',
      WEDNESDAY: isBn ? 'বুধবার' : 'Wednesday',
      THURSDAY: isBn ? 'বৃহস্পতিবার' : 'Thursday',
      FRIDAY: isBn ? 'শুক্রবার' : 'Friday',
      SATURDAY: isBn ? 'শনিবার' : 'Saturday',
    };
    return map[dayKey] || dayKey;
  };

  const getPeriodLabel = (num) => {
    if (isBn) {
      const bnNums = ['০', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
      return `${bnNums[num] || num} পিরিয়ড`;
    }
    return `Period ${num}`;
  };

  const todayClasses = classRoutines.filter(r => r.day_of_week === todayDay);

  // Group published exam schedules into distinct exams (plain compute, zero hook overhead)
  const groupedExams = (() => {
    const map = new Map();
    (examRoutines || []).forEach(item => {
      const examKey = item.exam_id || item.exam_name;
      if (!map.has(examKey)) {
        map.set(examKey, {
          id: item.exam_id,
          name: item.exam_name,
          exam_type: item.exam_type,
          term: item.exam_term || item.term,
          academic_year: item.exam_academic_year || item.academic_year || student.academic_year || '2026',
          start_date: item.exam_start_date || item.start_date,
          end_date: item.exam_end_date || item.end_date,
          description: item.exam_description || item.description,
          schedules: []
        });
      }
      map.get(examKey).schedules.push(item);
    });
    return Array.from(map.values());
  })();

  const handlePrintExamRoutine = (exam) => {
    if (!exam) return;
    printExamRoutine({
      institutionName: user?.institution?.name || student?.institution_name || 'Unified Education Management Platform',
      institutionAddress: user?.institution?.address || student?.institution_address || '',
      examName: exam.name,
      academicYear: exam.academic_year || '2026',
      schedules: exam.schedules || [],
      studentInfo: {
        name: student.name,
        studentId: student.student_id,
        className: student.class_name,
        sectionName: student.section_name,
        rollNumber: student.roll_number
      },
      isBn
    });
  };

  const handlePrintClassRoutine = () => {
    printClassRoutine({
      institutionName: user?.institution?.name || student?.institution_name || 'Unified Education Management Platform',
      institutionAddress: user?.institution?.address || student?.institution_address || '',
      className: student.class_name,
      sectionName: student.section_name,
      academicYear: student.academic_year || '2026',
      routines: classRoutines,
      isBn
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
        </div>
        <div className="h-96 bg-white rounded-2xl border border-slate-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Institutional Hero Campus Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        {/* If banner_url exists, render as cover background with sleek gradient overlay */}
        {user?.institution?.banner_url && (
          <div className="absolute inset-0 z-0">
            <img 
              src={user.institution.banner_url} 
              alt={user.institution?.name || 'Campus Banner'} 
              className="w-full h-full object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-blue-950/90" />
          </div>
        )}

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          {/* Top Institution Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/15 gap-4">
            <div className="flex items-center gap-3.5">
              <CampusLogo logo={user?.institution?.logo} name={user?.institution?.name} size="lg" className="border-2 border-white/50 shadow-md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                    {user?.institution?.name || 'Unified Education Management Platform'}
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 size={10} />
                    Verified Campus
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-blue-200/80 mt-0.5">
                  {user?.institution?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-blue-400 shrink-0" />
                      {user.institution.address}
                    </span>
                  )}
                  {user?.institution?.eiin_number && (
                    <>
                      <span>•</span>
                      <span>EIIN: {user.institution.eiin_number}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">Session: 2026-2027</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
                <GraduationCap size={14} />
                {isBn ? 'শিক্ষার্থী পোর্টাল' : 'Student Portal'}
              </span>
            </div>
          </div>

          {/* Student Profile Identity Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Student Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-xl border-2 border-white/60 shrink-0 overflow-hidden flex items-center justify-center">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl">
                    {student.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>

              {/* Student Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/10 text-blue-200 border border-white/20">
                    {isBn ? 'স্বাগতম' : 'Welcome back'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {student.academic_year || '2026'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {student.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200">
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">
                    ID: {student.student_id}
                  </span>
                  <span>•</span>
                  <span className="font-semibold">
                    {student.class_name} {student.section_name ? `(${student.section_name})` : ''}
                  </span>
                  <span>•</span>
                  <span>{isBn ? 'রোল' : 'Roll'}: {student.roll_number || '—'}</span>
                  {student.blood_group && (
                    <>
                      <span>•</span>
                      <span className="text-red-300 font-bold">{student.blood_group}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shrink-0">
              <div className="text-center px-3 border-r border-white/10">
                <p className="text-[10px] uppercase font-bold text-blue-200">{isBn ? 'উপস্থিতি' : 'Attendance'}</p>
                <p className="text-xl font-black text-emerald-400">{attStats.percentage}%</p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] uppercase font-bold text-blue-200">{isBn ? 'বকেয়া ফি' : 'Dues'}</p>
                <p className={`text-xl font-black ${Number(fees.total_due) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ৳{Number(fees.total_due).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: isBn ? 'সারসংক্ষেপ' : 'Overview', icon: BookOpen },
          { 
            id: 'exam_routine', 
            label: isBn ? 'পরীক্ষার রুটিন' : 'Exam Routine', 
            icon: Calendar,
            count: groupedExams.length > 0 ? groupedExams.length : null,
            countColor: 'bg-purple-100 text-purple-700'
          },
          { id: 'class_routine', label: isBn ? 'ক্লাস রুটিন' : 'Class Routine', icon: Clock },
          { id: 'attendance', label: isBn ? 'উপস্থিতি খাতা' : 'Attendance', icon: ClipboardCheck },
          { id: 'results', label: isBn ? 'ফলাফল ও নম্বরপত্র' : 'Results & Marksheet', icon: Award },
          { id: 'fees', label: isBn ? 'ফি ও ইনভয়েস' : 'Fees & Invoices', icon: CreditCard },
          { id: 'notices', label: isBn ? 'নোটিশ বোর্ড' : 'Notices', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'exam_routine' && activeTab === 'routine');
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : tab.countColor || 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Attendance Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'উপস্থিতির হার' : 'Attendance Rate'}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{attStats.percentage}%</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {attStats.present_days} {isBn ? 'দিন উপস্থিত' : 'days present'} • {attStats.absent_days} {isBn ? 'অনুপস্থিত' : 'absent'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ClipboardCheck size={24} />
              </div>
            </div>

            {/* Academic Results Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'প্রকাশিত ফলাফল' : 'Latest Term Result'}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {results.length > 0 ? `GPA ${results[0].gpa}` : (isBn ? 'প্রক্রিয়াধীন' : 'Pending')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {results.length > 0 ? `${results[0].grade} Grade • Rank ${results[0].class_rank || '—'}` : (isBn ? 'কোনো ফলাফল প্রকাশিত হয়নি' : 'No term published yet')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Award size={24} />
              </div>
            </div>

            {/* Fees Due Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'বকেয়া ফি' : 'Outstanding Dues'}</p>
                <p className={`text-2xl font-black mt-1 ${Number(fees.total_due) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ৳{Number(fees.total_due).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {Number(fees.total_due) > 0 ? (isBn ? 'পরিশোধের জন্য অফিসে যোগাযোগ করুন' : 'Due payment pending') : (isBn ? 'সব পরিশোধ সম্পন্ন' : 'All clear')}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${Number(fees.total_due) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <CreditCard size={24} />
              </div>
            </div>
          </div>

          {/* 3 Column: Today's Classes, Upcoming Exam Routine, Notices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Today's Classes Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isBn ? 'আজকের ক্লাসসমূহ' : "Today's Classes"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {getDayLabel(todayDay)}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {todayClasses.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Clock size={24} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-semibold">
                        {isBn ? 'আজকে কোনো নির্ধারিত ক্লাস নেই' : 'No classes scheduled today'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isBn ? 'সাপ্তাহিক রুটিন দেখতে নিচের বাটনে চাপুন' : 'Check full timetable below'}
                      </p>
                    </div>
                  ) : (
                    todayClasses.slice(0, 4).map(cls => (
                      <div key={cls.id} className="p-2.5 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 flex items-center justify-between transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                              {getPeriodLabel(cls.period_number)}
                            </span>
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">{cls.subject_name}</span>
                          </div>
                          {cls.teacher_name && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">👨‍🏫 {cls.teacher_name}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-bold text-slate-700 block">
                            {cls.start_time}
                          </span>
                          {cls.room_number && (
                            <span className="text-[10px] text-slate-400">R-{cls.room_number}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('class_routine')}
                className="w-full py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{isBn ? 'পূর্ণ ক্লাস রুটিন দেখুন' : 'View Full Class Timetable'}</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* 2. Upcoming Routine Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isBn ? 'আসন্ন পরীক্ষার রুটিন' : 'Upcoming Exams'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {examRoutines.length} {isBn ? 'টি বিষয়' : 'Exams'}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {examRoutines.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Calendar size={24} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-semibold">
                        {isBn ? 'কোনো পরীক্ষার রুটিন নেই' : 'No upcoming exams'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isBn ? 'পরীক্ষা প্রকাশিত হলে এখানে দেখতে পাবেন' : 'Published exams will show here'}
                      </p>
                    </div>
                  ) : (
                    examRoutines.slice(0, 4).map(rt => (
                      <div 
                        key={rt.id} 
                        onClick={() => {
                          setSelectedExamId(rt.exam_id || rt.exam_name);
                          handleTabChange('exam_routine');
                        }}
                        className="p-2.5 bg-slate-50/80 hover:bg-purple-50/60 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition-all hover:border-purple-200 group"
                        title={isBn ? 'বিস্তারিত রুটিন দেখতে ক্লিক করুন' : 'Click to view routine'}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block">
                            {rt.exam_name}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-1 group-hover:text-purple-700 transition-colors">{rt.subject_name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            📅 {new Date(rt.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • ⏰ {rt.start_time}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                            {rt.room_number ? `Room ${rt.room_number}` : 'TBA'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedExamId(null);
                  handleTabChange('exam_routine');
                }}
                className="w-full py-2 text-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{isBn ? 'পরীক্ষার সম্পূর্ণ রুটিন' : 'View Full Exam Timetable'}</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* 3. Notices Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isBn ? 'প্রাতিষ্ঠানিক নোটিশ' : 'Notice Board'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {notices.length} {isBn ? 'টি নোটিশ' : 'Notices'}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {notices.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Bell size={24} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-semibold">{isBn ? 'কোনো নোটিশ নেই' : 'No notices'}</p>
                    </div>
                  ) : (
                    notices.slice(0, 3).map(notice => (
                      <div key={notice.id} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                            {notice.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notice.published_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{notice.title}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{notice.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('notices')}
                className="w-full py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{isBn ? 'সকল নোটিশ পড়ুন' : 'View All Notices'}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'উপস্থিতির বিস্তারিত হিসাব' : 'Attendance Record Ledger'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn ? 'বর্তমান শিক্ষাবর্ষের সকল ক্লাসের উপস্থিতি রেকর্ড।' : 'Live academic attendance records.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                  {attStats.percentage}% {isBn ? 'উপস্থিতি' : 'Present'}
                </span>
              </div>
            </div>

            {/* Breakdown Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'মোট কর্মদিবস' : 'Total Days'}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{attStats.total_days}</p>
              </div>
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">{isBn ? 'উপস্থিত' : 'Present'}</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{attStats.present_days}</p>
              </div>
              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100 text-center">
                <p className="text-[10px] font-bold text-rose-600 uppercase">{isBn ? 'অনুপস্থিত' : 'Absent'}</p>
                <p className="text-xl font-bold text-rose-700 mt-1">{attStats.absent_days}</p>
              </div>
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-[10px] font-bold text-amber-600 uppercase">{isBn ? 'দেরি / ছুটি' : 'Late / Leave'}</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{attStats.late_days + attStats.leave_days}</p>
              </div>
            </div>

            {/* Recent Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="px-4 py-3">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="px-4 py-3">{isBn ? 'মন্তব্য' : 'Remarks'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400">
                        {isBn ? 'কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি' : 'No attendance logs recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    recentAttendance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          {new Date(row.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            row.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {row.status === 'PRESENT' ? '● ' + (isBn ? 'উপস্থিত' : 'Present') : row.status === 'ABSENT' ? '● ' + (isBn ? 'অনুপস্থিত' : 'Absent') : '● ' + row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Published Term Results */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {isBn ? 'প্রকাশিত সেমিস্টার ও টার্ম ফলাফল' : 'Published Term Results & Marksheets'}
              </h3>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Award size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">{isBn ? 'কোনো টার্ম রেজাল্ট এখনও প্রকাশিত হয়নি' : 'No term results published yet'}</p>
                <p className="text-xs text-slate-400 mt-1">{isBn ? 'প্রতিষ্ঠান প্রশাসন রেজাল্ট অনুমোদন ও প্রকাশ করলে এখানে দৃশ্যমান হবে।' : 'Results will appear once approved and published by administration.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(res => (
                  <div key={res.id} className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {res.term_name || 'Academic Term'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{res.rule_title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-blue-600">GPA {res.gpa}</span>
                        <p className="text-xs font-bold text-slate-600">{isBn ? 'গ্রেড' : 'Grade'}: {res.grade}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60">
                      <span>{isBn ? 'প্রাপ্ত নম্বর' : 'Marks'}: <strong>{res.total_marks} / {res.total_full_marks}</strong></span>
                      <span>{isBn ? 'শতকরা' : 'Percent'}: <strong>{res.percentage}%</strong></span>
                      <span>{isBn ? 'ক্লাস মেধা' : 'Rank'}: <strong>#{res.class_rank || '—'}</strong></span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedResult(res);
                        setResultModalOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      <Printer size={14} />
                      <span>{isBn ? 'নম্বরপত্র / গ্রেডশিট প্রিন্ট করুন' : 'View & Print Grade Sheet'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject-wise Marks Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {isBn ? 'বিষয়ভিত্তিক নম্বর ও গ্রেড (পরীক্ষা সমূহের)' : 'Subject-wise Assessment Breakdown'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">{isBn ? 'বিষয়' : 'Subject'}</th>
                    <th className="px-4 py-3">{isBn ? 'পরীক্ষার নাম ও ধরণ' : 'Exam & Type'}</th>
                    <th className="px-4 py-3">{isBn ? 'থিওরি' : 'Theory'}</th>
                    <th className="px-4 py-3">{isBn ? 'এমসিকিউ' : 'MCQ'}</th>
                    <th className="px-4 py-3">{isBn ? 'ব্যবহারিক' : 'Practical'}</th>
                    <th className="px-4 py-3">{isBn ? 'মোট নম্বর' : 'Total'}</th>
                    <th className="px-4 py-3">{isBn ? 'গ্রেড' : 'Grade'}</th>
                    <th className="px-4 py-3">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectMarks.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                        {isBn ? 'কোনো নম্বর এন্ট্রি পাওয়া যায়নি' : 'No assessment records available'}
                      </td>
                    </tr>
                  ) : (
                    subjectMarks.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {m.subject_name} <span className="text-[10px] font-mono text-slate-400 font-normal">({m.subject_code})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700 block">{m.exam_name}</span>
                          {m.exam_type && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                              {m.exam_type === 'WEEKLY' ? (isBn ? 'সাপ্তাহিক' : 'Weekly')
                                : m.exam_type === 'MONTHLY' ? (isBn ? 'মাসিক' : 'Monthly')
                                : m.exam_type === 'CLASS_TEST' ? (isBn ? 'ক্লাস টেস্ট' : 'Class Test')
                                : m.exam_type === 'FINAL' ? (isBn ? 'ফাইনাল' : 'Final')
                                : m.exam_type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{m.theory_marks}</td>
                        <td className="px-4 py-3 font-mono">{m.mcq_marks}</td>
                        <td className="px-4 py-3 font-mono">{m.practical_marks}</td>
                        <td className="px-4 py-3 font-bold font-mono text-blue-600">{m.total_marks} / {m.full_marks}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{m.grade || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            {isBn ? 'প্রকাশিত' : 'Published'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FEES TAB */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'মোট ইনভয়েস' : 'Total Invoiced'}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">৳{Number(fees.total_invoiced).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">{isBn ? 'পরিশোধিত অর্থ' : 'Total Paid'}</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">৳{Number(fees.total_paid).toLocaleString()}</p>
            </div>
            <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-100 shadow-xs">
              <p className="text-[10px] font-bold text-rose-600 uppercase">{isBn ? 'বর্তমান বকেয়া' : 'Outstanding Dues'}</p>
              <p className="text-2xl font-black text-rose-700 mt-1">৳{Number(fees.total_due).toLocaleString()}</p>
            </div>
          </div>

          {/* Fee Payment Instructions Banner (Cash Counter & Digital) */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Wallet size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isBn ? 'ফি পরিশোধের মাধ্যম ও নিয়মাবলী' : 'Tuition Fee Payment Options'}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    {isBn ? 'সহজ পরিশোধ' : 'Easy Pay'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {isBn
                    ? 'শিক্ষার্থী বা অভিভাবক প্রতিষ্ঠানের ক্যাশ কাউন্টারে সরাসরি নগদ (Cash) টাকা জমা দিয়ে তাৎক্ষণিক মানি রিসিট ভাউচার গ্রহণ করতে পারবেন। অথবা অনুমোদিত bKash / Nagad / Rocket / ব্যাংক ট্রান্সফারের মাধ্যমে পরিশোধ করতে পারবেন।'
                    : 'Students or guardians can pay directly in physical Cash at the school accounts counter to receive an authorized printed receipt voucher, or settle via bKash, Nagad, Rocket, or Bank.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="px-3 py-1.5 bg-white border border-emerald-400 text-emerald-900 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 ring-2 ring-emerald-500/20">
                <span>💵</span>
                <span>{isBn ? 'নগদ ক্যাশ (কাউন্টার)' : 'Cash Counter'}</span>
              </div>
              <div className="px-3 py-1.5 bg-white border border-pink-200 text-pink-700 font-bold text-xs rounded-xl shadow-2xs">
                bKash
              </div>
              <div className="px-3 py-1.5 bg-white border border-orange-200 text-orange-700 font-bold text-xs rounded-xl shadow-2xs">
                Nagad
              </div>
              <div className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 font-bold text-xs rounded-xl shadow-2xs">
                Bank
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {isBn ? 'মাসিক ফি বিল ও ইনভয়েস সমূহ' : 'Fee Invoices Ledger'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">{isBn ? 'ইনভয়েস নম্বর' : 'Invoice No'}</th>
                    <th className="px-4 py-3">{isBn ? 'মাস / শিরোনাম' : 'Month'}</th>
                    <th className="px-4 py-3">{isBn ? 'মোট ফি' : 'Amount'}</th>
                    <th className="px-4 py-3">{isBn ? 'পরিশোধিত' : 'Paid'}</th>
                    <th className="px-4 py-3">{isBn ? 'বকেয়া' : 'Due'}</th>
                    <th className="px-4 py-3">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="px-4 py-3">{isBn ? 'শেষ তারিখ' : 'Due Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                        {isBn ? 'কোনো ইনভয়েস পাওয়া যায়নি' : 'No invoices generated yet'}
                      </td>
                    </tr>
                  ) : (
                    fees.invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{inv.month_label || inv.month}</td>
                        <td className="px-4 py-3 font-mono font-bold">৳{Number(inv.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600">৳{Number(inv.paid_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-rose-600 font-bold">৳{Number(inv.due_amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXAM ROUTINE TAB (EXAM-WISE VIEW) */}
      {(activeTab === 'exam_routine' || activeTab === 'routine') && (
        <div className="space-y-6">
          {/* LEVEL 1: ALL PUBLISHED EXAMS LIST (EXAM CARDS) */}
          {!selectedExamId && (
            <div className="space-y-5">
              {/* Section Header */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {isBn ? 'পরীক্ষার রুটিন ও সময়সূচী' : 'Exam Routines & Timetables'}
                      </h3>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {groupedExams.length} {isBn ? 'টি প্রকাশিত পরীক্ষা' : 'Published Exams'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isBn
                        ? 'আপনার শ্রেণির যেসকল পরীক্ষা প্রকাশিত হয়েছে তার তালিকা। বিস্তারিত রুটিন দেখতে যেকোনো পরীক্ষায় ক্লিক করুন।'
                        : 'Official exam routines published for your class. Select an exam to view detailed schedule.'}
                    </p>
                  </div>
                </div>

                {groupedExams.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExamToPrint(groupedExams[0]);
                      setRoutinePrintModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer size={15} />
                    <span>{isBn ? 'রুটিন প্রিন্ট করুন' : 'Print Timetable'}</span>
                  </button>
                )}
              </div>

              {/* Published Exams Cards Grid */}
              {groupedExams.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto">
                    <Calendar size={28} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    {isBn ? 'কোনো পরীক্ষার রুটিন প্রকাশিত হয়নি' : 'No Exam Routines Published Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {isBn
                      ? 'আপনার শ্রেণির জন্য প্রতিষ্ঠান কর্তৃক কোনো মিডটার্ম, সাময়িক বা ফাইনাল পরীক্ষার রুটিন প্রকাশিত হলে তা স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।'
                      : 'When school authorities publish an examination schedule for your class, it will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedExams.map((exam) => {
                    const firstSched = exam.schedules[0];
                    const lastSched = exam.schedules[exam.schedules.length - 1];
                    return (
                      <div
                        key={exam.id || exam.name}
                        onClick={() => setSelectedExamId(exam.id || exam.name)}
                        className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border bg-purple-50 text-purple-700 border-purple-200">
                              {exam.exam_type?.replace('_', ' ') || 'EXAM'}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 size={11} /> {isBn ? 'প্রকাশিত' : 'Published'}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                              {exam.name}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                              {exam.academic_year} • {exam.term || 'Term Final'}
                            </p>
                          </div>

                          {exam.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {exam.description}
                            </p>
                          )}

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="font-semibold">{isBn ? 'মোট বিষয়:' : 'Total Subjects:'}</span>
                              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                {exam.schedules.length} {isBn ? 'টি বিষয় অন্তর্ভুক্ত' : 'Subjects'}
                              </span>
                            </div>
                            {firstSched && (
                              <div className="flex items-center justify-between text-slate-600">
                                <span className="font-semibold">{isBn ? 'পরীক্ষার তারিখ:' : 'Exam Date:'}</span>
                                <span className="font-bold text-slate-800 font-mono">
                                  {new Date(firstSched.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                  {lastSched && lastSched !== firstSched ? ` - ${new Date(lastSched.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExamId(exam.id || exam.name);
                            }}
                            className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>{isBn ? 'বিস্তারিত রুটিন দেখুন' : 'View Detailed Routine'}</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToPrint(exam);
                              setRoutinePrintModalOpen(true);
                            }}
                            className="p-2.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl border border-slate-200 transition-colors"
                            title={isBn ? 'প্রিন্ট রুটিন' : 'Print Timetable'}
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: INSIDE SPECIFIC EXAM (DETAILED TIMETABLE) */}
          {selectedExamId && (() => {
            const currentExam = groupedExams.find(e => e.id === selectedExamId || e.name === selectedExamId) || groupedExams[0];
            if (!currentExam) {
              return (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                  <p className="text-xs text-slate-500">{isBn ? 'পরীক্ষা পাওয়া যায়নি' : 'Exam not found'}</p>
                  <button
                    onClick={() => setSelectedExamId(null)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                  >
                    ← {isBn ? 'সকল পরীক্ষায় ফিরে যান' : 'Back to Exams'}
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-5">
                {/* Navigation & Header Banner */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedExamId(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors mb-2.5"
                    >
                      <span>← {isBn ? 'সকল পরীক্ষার তালিকা' : 'Back to All Exams'}</span>
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                        {currentExam.name}
                      </h3>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {isBn ? '✓ অনুমোদিত ও প্রকাশিত' : '✓ Published'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {student.class_name} {student.section_name ? `(${student.section_name})` : ''} • {isBn ? 'শিক্ষাবর্ষ' : 'Session'}: {currentExam.academic_year} • {currentExam.term} • {currentExam.schedules.length} {isBn ? 'টি বিষয়' : 'Subjects'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Switcher if multiple exams */}
                    {groupedExams.length > 1 && (
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl focus:outline-hidden"
                      >
                        {groupedExams.map(e => (
                          <option key={e.id || e.name} value={e.id || e.name}>
                            {e.name} ({e.term})
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setExamToPrint(currentExam);
                        setRoutinePrintModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <Printer size={15} />
                      <span>{isBn ? 'রুটিন প্রিন্ট / ডাউনলোড' : 'Print Timetable'}</span>
                    </button>
                  </div>
                </div>

                {/* Detailed Timetable Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">{isBn ? 'তারিখ ও দিন' : 'Date & Day'}</th>
                          <th className="py-3 px-4">{isBn ? 'বিষয় ও কোড' : 'Subject & Code'}</th>
                          <th className="py-3 px-4">{isBn ? 'সময় ও ব্যপ্তিকাল' : 'Time & Duration'}</th>
                          <th className="py-3 px-4">{isBn ? 'পরীক্ষার কক্ষ' : 'Room'}</th>
                          <th className="py-3 px-4">{isBn ? 'পূর্ণমান / পাস নম্বর' : 'Marks (Full/Pass)'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentExam.schedules.map((rt, idx) => (
                          <tr key={rt.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">
                                {new Date(rt.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] font-semibold text-purple-600 mt-0.5">
                                {new Date(rt.exam_date).toLocaleDateString('en-GB', { weekday: 'long' })}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{rt.subject_name}</p>
                              {rt.subject_code && (
                                <span className="font-mono text-slate-400 text-[10px]">Code: {rt.subject_code}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-800 flex items-center gap-1">
                                <Clock size={12} className="text-blue-500" />
                                <span>{rt.start_time} - {rt.end_time}</span>
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {rt.duration_minutes ? `(${rt.duration_minutes} mins)` : ''}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg font-mono text-[11px]">
                                {rt.room_number ? `Room ${rt.room_number}` : 'TBA'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-blue-600 text-sm">{rt.full_marks}</span>
                              <span className="text-slate-400 text-[10px]"> / Pass: {rt.pass_marks || 33}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* CLASS ROUTINE TAB */}
      {activeTab === 'class_routine' && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Clock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {isBn ? 'সাপ্তাহিক ক্লাস রুটিন' : 'Weekly Class Timetable'}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {student.class_name} {student.section_name ? `(${student.section_name})` : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn ? 'প্রতিদিনের ক্লাসের সময়সূচী ও পিরিয়ড তালিকা।' : 'Daily academic period and classroom schedule.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrintClassRoutine}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                <span>{isBn ? 'ক্লাস রুটিন প্রিন্ট' : 'Print Timetable'}</span>
              </button>
            </div>
          </div>

          {/* Timetable View */}
          {classRoutines.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Clock size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {isBn ? 'কোনো ক্লাস রুটিন যুক্ত করা হয়নি' : 'No Class Timetable Found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isBn
                  ? 'আপনার ক্লাসের সাপ্তাহিক রুটিন এখনো আপলোড করা হয়নি। ক্লাস রুটিন প্রণীত হলে এখানে দেখতে পাবেন।'
                  : 'The weekly period routine for your class has not been set yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-32 border-r border-slate-200/70">{isBn ? 'দিন (Day)' : 'Day'}</th>
                    {periods.map((p, idx) => (
                      <th
                        key={idx}
                        className={`py-3 px-3 text-center border-r border-slate-200/70 last:border-r-0 ${
                          p.isBreak ? 'bg-amber-50/60 w-24' : 'min-w-[135px]'
                        }`}
                      >
                        <span className="block text-slate-800 font-bold">{isBn ? (p.labelBn || p.labelEn) : p.labelEn}</span>
                        <span className="block font-mono text-[10px] text-slate-500 font-medium mt-0.5">
                          {p.start} - {p.end}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {DAYS_OF_WEEK.map((day) => {
                    const isToday = todayDay === day.key;
                    return (
                      <tr key={day.key} className={`transition-colors ${isToday ? 'bg-emerald-50/15' : 'hover:bg-slate-50/30'}`}>
                        {/* Day Header Column */}
                        <td className={`py-4 px-4 font-bold border-r border-slate-200/70 ${isToday ? 'bg-emerald-50/40 text-emerald-950' : 'bg-slate-50/40 text-slate-900'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isToday ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-blue-600'}`}></span>
                            <span>{isBn ? day.bn : day.en}</span>
                          </div>
                          {isToday && (
                            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-emerald-600 text-white rounded-md shadow-2xs">
                              {isBn ? 'আজকের দিন' : 'Today'}
                            </span>
                          )}
                        </td>

                        {/* Periods Columns */}
                        {periods.map((p, pIdx) => {
                          if (p.isBreak) {
                            return (
                              <td
                                key={pIdx}
                                className="py-3 px-2 bg-amber-50/40 text-center border-r border-slate-200/70 text-amber-800 font-semibold text-[11px]"
                              >
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[10px] font-bold">
                                  <Coffee size={11} />
                                  {isBn ? (p.labelBn || 'বিরতি') : (p.labelEn || 'Break')}
                                </span>
                              </td>
                            );
                          }

                          const slot = getClassSlot(day.key, p.num);

                          return (
                            <td key={pIdx} className="py-2.5 px-2.5 border-r border-slate-200/70 last:border-r-0 align-top">
                              {slot ? (
                                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/70 space-y-1.5 hover:shadow-md transition-all">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-bold text-slate-900 text-xs leading-tight">
                                      {slot.subject_name}
                                    </span>
                                    {slot.room_number && (
                                      <span className="px-1.5 py-0.5 bg-white text-blue-700 text-[10px] font-bold rounded-md border border-blue-100 shadow-2xs shrink-0">
                                        R-{slot.room_number}
                                      </span>
                                    )}
                                  </div>

                                  {slot.subject_code && (
                                    <span className="text-[10px] font-mono text-slate-400 block">
                                      Code: {slot.subject_code}
                                    </span>
                                  )}

                                  <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1 border-t border-blue-100/60">
                                    <User size={11} className="text-slate-400 shrink-0" />
                                    <span className="truncate font-medium">{slot.teacher_name || 'N/A'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-16 flex items-center justify-center text-slate-300 text-xs">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NOTICES TAB */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Bell size={16} className="text-blue-600" />
            <span>{isBn ? 'প্রাতিষ্ঠানিক নোটিশ বোর্ড' : 'All Institutional Notices'}</span>
          </h3>

          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">{isBn ? 'কোনো নোটিশ পাওয়া যায়নি' : 'No notices currently published'}</p>
            ) : (
              notices.map(notice => (
                <div key={notice.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {notice.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(notice.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{notice.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{notice.content}</p>
                  {notice.author_name && (
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      {isBn ? 'প্রকাশক:' : 'Published by:'} {notice.author_name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE RESULT MODAL */}
      {resultModalOpen && selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Award size={18} className="text-blue-600" />
                <span>{isBn ? 'একাডেমিক গ্রেডশিট / মার্কশিট' : 'Academic Grade Sheet'}</span>
              </div>
              <button
                onClick={() => setResultModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div id="printable-grade-sheet" className="p-6 border-2 border-slate-200 rounded-2xl bg-white space-y-6">
              {/* Institution Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                <h2 className="text-xl font-black text-slate-900 uppercase">
                  {user?.institution?.name || 'Institution Name'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {user?.institution?.address || 'Campus Location'}
                </p>
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wider pt-1">
                  OFFICIAL ACADEMIC TRANSCRIPT • {selectedResult.term_name || 'TERM FINAL'}
                </p>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">{isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</span>{' '}
                  <strong className="text-slate-900">{student.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">{isBn ? 'স্টুডেন্ট আইডি:' : 'Student ID:'}</span>{' '}
                  <strong className="font-mono text-slate-900">{student.student_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500">{isBn ? 'শ্রেণী ও শাখা:' : 'Class & Section:'}</span>{' '}
                  <strong className="text-slate-900">{student.class_name} ({student.section_name || 'A'})</strong>
                </div>
                <div>
                  <span className="text-slate-500">{isBn ? 'রোল নম্বর:' : 'Roll Number:'}</span>{' '}
                  <strong className="text-slate-900">{student.roll_number || '—'}</strong>
                </div>
              </div>

              {/* Result Summary Box */}
              <div className="flex items-center justify-around p-4 bg-blue-50/50 rounded-xl border border-blue-200 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{isBn ? 'জিপিএ' : 'GPA'}</p>
                  <p className="text-2xl font-black text-blue-600">{selectedResult.gpa}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{isBn ? 'লেটার গ্রেড' : 'Grade'}</p>
                  <p className="text-2xl font-black text-slate-900">{selectedResult.grade}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{isBn ? 'প্রাপ্ত নম্বর' : 'Total Marks'}</p>
                  <p className="text-2xl font-black text-slate-900">{selectedResult.total_marks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{isBn ? 'মেধা স্থান' : 'Rank'}</p>
                  <p className="text-2xl font-black text-emerald-600">#{selectedResult.class_rank || '1'}</p>
                </div>
              </div>

              {/* Subject Breakdown if available */}
              {Array.isArray(selectedResult.subject_results) && selectedResult.subject_results.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Subject</th>
                        <th className="p-2 text-right">Marks</th>
                        <th className="p-2 text-right">Grade Point</th>
                        <th className="p-2 text-right">Letter Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedResult.subject_results.map((sub, sIdx) => (
                        <tr key={sIdx}>
                          <td className="p-2 font-medium">{sub.subject_name || sub.name}</td>
                          <td className="p-2 text-right font-mono">{sub.marks || sub.total_marks}</td>
                          <td className="p-2 text-right font-mono font-bold">{sub.gpa || sub.grade_point}</td>
                          <td className="p-2 text-right font-bold">{sub.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-12 flex justify-between text-xs text-slate-600 border-t border-slate-200">
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <span>{isBn ? 'শ্রেণী শিক্ষক' : 'Class Teacher'}</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <span>{isBn ? 'পরীক্ষা নিয়ন্ত্রক' : 'Controller of Exams'}</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <span>{isBn ? 'অধ্যক্ষ / প্রধান শিক্ষক' : 'Principal / Headmaster'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => setResultModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition-colors"
              >
                <Printer size={15} />
                <span>{isBn ? 'গ্রেডশিট প্রিন্ট করুন' : 'Print Grade Sheet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED OFFICIAL EXAM ROUTINE PRINT MODAL */}
      {routinePrintModalOpen && examToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Actions Header (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer size={18} className="text-purple-600" />
                <span>{isBn ? 'অফিসিয়াল পরীক্ষার রুটিন প্রিন্ট কপি' : 'Official Timetable Print Preview'}</span>
              </div>
              <button
                type="button"
                onClick={() => setRoutinePrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Document Area */}
            <div id="printable-exam-routine" className="p-6 sm:p-8 border-2 border-slate-900 rounded-2xl bg-white space-y-5 text-slate-900">
              {/* Institution Header (Large & Bold as requested) */}
              <div className="text-center pb-4 border-b-2 border-slate-950 space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-950 tracking-wider">
                  {user?.institution?.name || student?.institution_name || 'Unified Education Management Platform'}
                </h1>
                {(user?.institution?.address || student?.institution_address) && (
                  <p className="text-xs text-slate-700 font-semibold tracking-wide">
                    {user?.institution?.address || student?.institution_address}
                  </p>
                )}
                <div className="pt-2">
                  <span className="inline-block px-5 py-1 bg-slate-950 text-white font-black text-sm uppercase tracking-widest rounded-md">
                    {examToPrint.name} — {examToPrint.academic_year || '2026'}
                  </span>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1.5">
                    {isBn ? 'অফিসিয়াল পরীক্ষার রুটিন ও সময়সূচী' : 'OFFICIAL EXAMINATION TIMETABLE'}
                  </p>
                </div>
              </div>

              {/* Student Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-900">
                <div>
                  <span className="text-slate-600 font-bold block text-[10px] uppercase">{isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</span>
                  <strong className="text-slate-950 font-black text-sm">{student.name}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-bold block text-[10px] uppercase">{isBn ? 'আইডি নম্বর:' : 'Student ID:'}</span>
                  <strong className="font-mono text-slate-950 font-black text-sm">{student.student_id}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-bold block text-[10px] uppercase">{isBn ? 'শ্রেণি ও শাখা:' : 'Class & Section:'}</span>
                  <strong className="text-slate-950 font-black text-sm">{student.class_name} {student.section_name ? `(${student.section_name})` : ''}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-bold block text-[10px] uppercase">{isBn ? 'রোল নম্বর:' : 'Roll Number:'}</span>
                  <strong className="font-mono text-slate-950 font-black text-sm">{student.roll_number || '—'}</strong>
                </div>
              </div>

              {/* Official Timetable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border-2 border-slate-950">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[11px] border-b-2 border-slate-950">
                      <th className="p-2.5 border-r-2 border-slate-950 text-center w-10">#</th>
                      <th className="p-2.5 border-r-2 border-slate-950">{isBn ? 'তারিখ ও দিন' : 'Date & Day'}</th>
                      <th className="p-2.5 border-r-2 border-slate-950">{isBn ? 'বিষয় ও কোড' : 'Subject & Code'}</th>
                      <th className="p-2.5 border-r-2 border-slate-950">{isBn ? 'পরীক্ষার সময়' : 'Exam Time'}</th>
                      <th className="p-2.5 border-r-2 border-slate-950 text-center">{isBn ? 'কক্ষ নম্বর' : 'Room No'}</th>
                      <th className="p-2.5 text-center">{isBn ? 'পূর্ণমান' : 'Marks'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-950">
                    {examToPrint.schedules.map((rt, idx) => (
                      <tr key={rt.id} className="border-b-2 border-slate-950 hover:bg-slate-50">
                        <td className="p-2.5 border-r-2 border-slate-950 text-center font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5 border-r-2 border-slate-950">
                          <span className="font-black text-slate-950 block">
                            {new Date(rt.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-700 font-semibold">
                            {new Date(rt.exam_date).toLocaleDateString('en-GB', { weekday: 'long' })}
                          </span>
                        </td>
                        <td className="p-2.5 border-r-2 border-slate-950">
                          <span className="font-black text-slate-950 text-sm">{rt.subject_name}</span>
                          {rt.subject_code && (
                            <span className="text-slate-600 font-mono text-[10px] block">Code: {rt.subject_code}</span>
                          )}
                        </td>
                        <td className="p-2.5 border-r-2 border-slate-950 font-mono font-bold text-slate-950">
                          <div>{rt.start_time} - {rt.end_time}</div>
                          {rt.duration_minutes && (
                            <div className="text-[10px] text-slate-600">({rt.duration_minutes} mins)</div>
                          )}
                        </td>
                        <td className="p-2.5 border-r-2 border-slate-950 text-center font-bold">
                          {rt.room_number ? `Room ${rt.room_number}` : 'TBA'}
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-slate-950 text-sm">
                          {rt.full_marks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Authority Signatures */}
              <div className="pt-12 pb-2 flex justify-between text-xs text-slate-950">
                <div className="text-center">
                  <div className="w-36 border-b-2 border-slate-950 mb-1 mx-auto"></div>
                  <span className="font-bold">{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-950 mb-1 mx-auto"></div>
                  <span className="font-bold">{isBn ? 'অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক' : 'Principal / Exam Controller'}</span>
                </div>
              </div>
            </div>

            {/* Actions (Hidden on Print) */}
            <div className="flex items-center justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => setRoutinePrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => handlePrintExamRoutine(examToPrint)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md transition-colors"
              >
                <Printer size={15} />
                <span>{isBn ? 'রুটিন সরাসরি প্রিন্ট করুন' : 'Print Timetable'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentPortalDashboard() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
          <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
        </div>
      </div>
    }>
      <StudentPortalContent />
    </Suspense>
  );
}

