'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Briefcase, BookOpen, Users, ClipboardCheck, Edit3, Calendar,
  Bell, Building2, MapPin, Mail, Phone, Clock, ArrowRight,
  ShieldCheck, CheckCircle2, AlertCircle, Sparkles, ChevronRight,
  Award, CheckCircle, BarChart3, TrendingUp, GraduationCap
} from 'lucide-react';
import CampusLogo from '@/components/common/CampusLogo';

export default function TeacherPortalDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [portalData, setPortalData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/academics/teachers/portal-dashboard').catch(() => ({ data: { data: null } })),
        api.get('/analytics/teacher').catch(() => ({ data: { data: null } }))
      ]);
      setPortalData(dashRes.data?.data);
      setAnalytics(analyticsRes.data?.data);
    } catch (err) {
      console.error('Failed to load teacher portal dashboard', err);
      toast.error(isBn ? 'শিক্ষক পোর্টাল তথ্য লোড করা যায়নি' : 'Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherDashboard();
  }, []);

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

  const teacher = portalData?.teacher || user || {};
  const institution = portalData?.institution || user?.institution || {};
  const assignedSubjects = portalData?.assigned_subjects || [];
  const routines = portalData?.routine || [];
  const notices = portalData?.notices || [];

  const totalStudents = assignedSubjects.reduce((acc, curr) => acc + (Number(curr.student_count) || 0), 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Institutional Hero Campus Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-purple-900/40">
        {/* If banner_url exists, render as full-bleed backdrop with dark overlay */}
        {institution?.banner_url && (
          <div className="absolute inset-0 z-0">
            <img 
              src={institution.banner_url} 
              alt={institution?.name || 'Campus Banner'} 
              className="w-full h-full object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-purple-950/85 to-indigo-950/90" />
          </div>
        )}

        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          {/* Top Institution Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/15 gap-4">
            <div className="flex items-center gap-3.5">
              <CampusLogo logo={institution?.logo} name={institution?.name} size="lg" className="border-2 border-white/50 shadow-md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                    {institution?.name || 'Unified Education Management Platform'}
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 size={10} />
                    Verified Campus
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-purple-200/80 mt-0.5">
                  {institution?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-purple-400 shrink-0" />
                      {institution.address}
                    </span>
                  )}
                  {institution?.eiin_number && (
                    <>
                      <span>•</span>
                      <span>EIIN: {institution.eiin_number}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">Session: 2026-2027</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5 shadow-xs">
                <Briefcase size={14} />
                {isBn ? 'শিক্ষক ও অনুষদ পোর্টাল' : 'Faculty & Staff Portal'}
              </span>
            </div>
          </div>

          {/* Teacher Profile & Quick Metrics */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Teacher Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-2 border-white/40 flex items-center justify-center font-black text-3xl text-purple-300 shadow-xl backdrop-blur-md shrink-0 overflow-hidden">
                {teacher.avatar_url ? (
                  <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{teacher.name?.charAt(0) || 'T'}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    {teacher.designation || (isBn ? 'সহকারী শিক্ষক' : 'Assistant Teacher')}
                  </span>
                  {teacher.additional_designation && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center gap-1">
                      <Sparkles size={11} />
                      {teacher.additional_designation}
                    </span>
                  )}
                  {teacher.department && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/20">
                      {teacher.department}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {teacher.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail size={13} className="text-purple-400" />
                    {teacher.email}
                  </span>
                  {teacher.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={13} className="text-emerald-400" />
                        {teacher.phone}
                      </span>
                    </>
                  )}
                  {teacher.employee_id && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11px]">
                        ID: {teacher.employee_id}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Teacher Quick Stats */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shrink-0">
              <div className="text-center px-4 border-r border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">{isBn ? 'বরাদ্দকৃত বিষয়' : 'Courses'}</p>
                <p className="text-2xl font-black text-white">{assignedSubjects.length}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] uppercase font-bold text-purple-200">{isBn ? 'মোট শিক্ষার্থী' : 'Students'}</p>
                <p className="text-2xl font-black text-emerald-400">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isBn ? 'শ্রেণী ও পাঠ্য বিষয়' : 'Assigned Courses'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{assignedSubjects.length} {isBn ? 'টি' : 'Subjects'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn ? 'হাজিরা ও নম্বর এন্ট্রি অনুমোদিত' : 'Authorized for marks & attendance'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isBn ? 'মোট শিক্ষার্থী সংখ্যা' : 'Enrolled Students'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalStudents} {isBn ? 'জন' : 'Students'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn ? 'আপনার কোর্সে তালিকাভুক্ত' : 'Across your assigned sections'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isBn ? 'সাপ্তাহিক ক্লাস পিরিয়ড' : 'Weekly Routine'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {analytics?.teacher_summary?.weekly_periods !== undefined ? analytics.teacher_summary.weekly_periods : routines.length} {isBn ? 'টি' : 'Periods'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn ? 'রুটিন অনুযায়ী নির্ধারিত' : 'Weekly class commitment'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isBn ? 'নম্বর এন্ট্রি অগ্রগতি' : 'Marks Entry Rate'}
            </p>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {analytics?.teacher_summary?.completion_rate !== undefined ? `${analytics.teacher_summary.completion_rate}%` : '100%'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn ? 'পরীক্ষার নম্বর আপলোড' : 'Submissions completed'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Marks Submission & Assessment Analytics Banner */}
      {analytics && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-600" />
                <span>{isBn ? 'নম্বর প্রদান ও ফলাফল মূল্যায়ন বিশ্লেষণ' : 'Marks Submission & Assessment Analytics'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'আপনার নির্ধারিত বিষয়সমূহের পরীক্ষার নম্বর এন্ট্রি, প্রধান শিক্ষকের নিকট সাবমিশন এবং ফলাফল প্রকাশের লাইভ স্থিতি।'
                  : 'Live progress tracking of your exam schedules, marks submission to principal, and published grade distributions.'}
              </p>
            </div>
            <Link
              href="/dashboard/exams/marks"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Edit3 size={13} />
              <span>{isBn ? 'নম্বর এন্ট্রি প্যানেল' : 'Open Marks Entry'}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 1. Completion Rate Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">
                  {isBn ? 'সার্বিক মূল্যায়ন সম্পন্ন' : 'Marks Entry Completion'}
                </span>
                <span className="font-bold text-purple-700">
                  {analytics.teacher_summary?.completion_rate}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, analytics.teacher_summary?.completion_rate || 0))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {analytics.teacher_summary?.total_schedules || 0} {isBn ? 'টি পরীক্ষার সূচীর মধ্যে' : 'total assessment schedules assigned'}
              </p>
            </div>

            {/* 2. Schedule Breakdown Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                <p className="text-lg font-black text-emerald-700">
                  {analytics.teacher_summary?.published_schedules || 0}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
                  {isBn ? 'প্রকাশিত' : 'Published'}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
                <p className="text-lg font-black text-blue-700">
                  {analytics.teacher_summary?.submitted_schedules || 0}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">
                  {isBn ? 'পর্যালোচনায়' : 'Submitted'}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl">
                <p className="text-lg font-black text-amber-700">
                  {analytics.teacher_summary?.pending_schedules || 0}
                </p>
                <p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">
                  {isBn ? 'বাকি' : 'Pending'}
                </p>
              </div>
            </div>

            {/* 3. Grade Distribution Summary */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">
                {isBn ? 'গ্রেড বণ্টন বিশ্লেষণ' : 'Student Grade Distribution'}
              </span>
              {analytics.grade_distribution && analytics.grade_distribution.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {analytics.grade_distribution.map((g, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200"
                    >
                      <strong className="text-purple-700">{g.grade}:</strong> {g.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic py-1">
                  {isBn ? 'এখনও কোনো গ্রেড রেকর্ড নেই' : 'No marks graded yet for this session'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Assigned Classes & Subjects with Direct Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-600" />
              <span>{isBn ? 'আপনার অধীনে পরিচালিত কোর্স ও শ্রেণী সমূহ' : 'Your Teaching Courses & Classes'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? 'সরাসরি এই কার্ডগুলো থেকে আপনার বিষয়ের দৈনিক হাজিরা ও নম্বর এন্ট্রি সম্পন্ন করুন।'
                : 'Directly launch attendance and scoped marks entry for your designated classes.'}
            </p>
          </div>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">
              {isBn ? 'আপনাকে কোনো বিষয় বা ক্লাস এখনও বরাদ্দ দেওয়া হয়নি' : 'No courses assigned to your account yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'প্রতিষ্ঠান প্রধানের সাথে যোগাযোগ করে কোর্স অ্যাসাইন করে নিন।' : 'Contact the Institution Administrator to assign your subjects and classes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedSubjects.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/20 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {item.type === 'MANDATORY' ? (isBn ? 'আবশ্যিক বিষয়' : 'Mandatory') : (isBn ? 'ঐচ্ছিক' : 'Elective')}
                    </span>
                    {item.code && (
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mt-2 leading-tight">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-purple-700">{item.class_name}</span>
                    {item.section_name && (
                      <>
                        <span>•</span>
                        <span>{isBn ? 'শাখা' : 'Section'}: <strong>{item.section_name}</strong></span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-white p-2 rounded-lg border border-purple-100/70">
                    <Users size={14} className="text-purple-600" />
                    <span>{isBn ? 'শিক্ষার্থী:' : 'Enrolled:'} <strong>{item.student_count || 0} {isBn ? 'জন' : 'Students'}</strong></span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-3 border-t border-purple-100 grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard/academics/attendance?classId=${item.class_id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
                  >
                    <ClipboardCheck size={14} />
                    <span>{isBn ? 'হাজিরা নিন' : 'Attendance'}</span>
                  </Link>
                  <Link
                    href={`/dashboard/exams/marks?classId=${item.class_id}&subjectId=${item.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>{isBn ? 'নম্বর এন্ট্রি' : 'Enter Marks'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Routine & Notices 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Routine for Teacher's Subjects */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-purple-600" />
              <span>{isBn ? 'আপনার বিষয়ের পরীক্ষার রুটিন' : 'Exam Routine (Your Subjects)'}</span>
            </h3>
            <Link
              href="/dashboard/exams"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700"
            >
              {isBn ? 'পূর্ণ রুটিন' : 'Full Timetable'} →
            </Link>
          </div>

          <div className="space-y-3">
            {routines.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{isBn ? 'কোনো পরীক্ষার রুটিন নির্ধারিত নেই' : 'No upcoming exam schedules'}</p>
            ) : (
              routines.map(rt => (
                <div key={rt.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {rt.exam_name}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">{rt.subject_name} ({rt.class_name})</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      📅 {new Date(rt.exam_date).toLocaleDateString()} • ⏰ {rt.start_time} - {rt.end_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                      Room {rt.room_number || 'TBA'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices Board */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              <span>{isBn ? 'শিক্ষক ও স্টাফ সার্কুলার' : 'Faculty Notices & Circulars'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{isBn ? 'কোনো নোটিশ নেই' : 'No current notices'}</p>
            ) : (
              notices.map(notice => (
                <div key={notice.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(notice.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{notice.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{notice.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

