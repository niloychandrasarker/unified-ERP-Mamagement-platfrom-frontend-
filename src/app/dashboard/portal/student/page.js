'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  GraduationCap, Calendar, ClipboardCheck, CreditCard, Award,
  BookOpen, Clock, Bell, MapPin, Phone, User, CheckCircle2,
  XCircle, AlertCircle, Printer, Download, Eye, FileText,
  DollarSign, Sparkles, X, ChevronRight, Wallet
} from 'lucide-react';

export default function StudentPortalDashboard() {
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

  useEffect(() => {
    fetchDashboard();
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

  const student = portalData?.student || {};
  const attStats = portalData?.attendance?.stats || { percentage: 100, total_days: 0, present_days: 0, absent_days: 0, late_days: 0, leave_days: 0 };
  const recentAttendance = portalData?.attendance?.recent || [];
  const results = portalData?.results?.published_terms || portalData?.results?.term_results || [];
  const subjectMarks = portalData?.results?.recent_marks || portalData?.results?.subject_marks || [];
  const fees = portalData?.fees || { total_invoiced: 0, total_paid: 0, total_due: 0, invoices: [], recent_payments: [] };
  const routines = portalData?.routine || [];
  const notices = portalData?.notices || [];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Student Identity Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Student Photo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white/60 shrink-0 overflow-hidden flex items-center justify-center">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {isBn ? 'শিক্ষার্থী প্রোফাইল' : 'Student Self-Service'}
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

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: isBn ? 'সারসংক্ষেপ' : 'Overview', icon: BookOpen },
          { id: 'attendance', label: isBn ? 'উপস্থিতি খাতা' : 'Attendance', icon: ClipboardCheck },
          { id: 'results', label: isBn ? 'ফলাফল ও নম্বরপত্র' : 'Results & Marksheet', icon: Award },
          { id: 'fees', label: isBn ? 'ফি ও ইনভয়েস' : 'Fees & Invoices', icon: CreditCard },
          { id: 'routine', label: isBn ? 'পরীক্ষার রুটিন' : 'Exam Routine', icon: Calendar },
          { id: 'notices', label: isBn ? 'নোটিশ বোর্ড' : 'Notices', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
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

          {/* 2 Column: Notices & Upcoming Routine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notices Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell size={16} className="text-blue-600" />
                  <span>{isBn ? 'প্রতিষ্ঠানের নোটিশ বোর্ড' : 'Institutional Notices'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('notices')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {isBn ? 'সব নোটিশ' : 'View All'} →
                </button>
              </div>

              <div className="space-y-3">
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">{isBn ? 'কোনো নোটিশ নেই' : 'No notices currently'}</p>
                ) : (
                  notices.slice(0, 3).map(notice => (
                    <div key={notice.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {notice.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(notice.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">{notice.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notice.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Routine Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  <span>{isBn ? 'আসন্ন পরীক্ষার সময়সূচী' : 'Upcoming Exam Routine'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('routine')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  {isBn ? 'পূর্ণ রুটিন' : 'Full Timetable'} →
                </button>
              </div>

              <div className="space-y-3">
                {routines.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">{isBn ? 'কোনো পরীক্ষার রুটিন নেই' : 'No upcoming exam scheduled'}</p>
                ) : (
                  routines.slice(0, 3).map(rt => (
                    <div key={rt.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {rt.exam_name}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">{rt.subject_name} ({rt.subject_code || '—'})</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>📅 {new Date(rt.exam_date).toLocaleDateString()}</span>
                          <span>⏰ {rt.start_time} - {rt.end_time}</span>
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

      {/* ROUTINE TAB */}
      {activeTab === 'routine' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'পরীক্ষার রুটিন ও সময়সূচী' : 'Exam Routine & Timetable'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.class_name} • Session: {student.academic_year || '2026'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">{isBn ? 'তারিখ ও দিন' : 'Date'}</th>
                  <th className="px-4 py-3">{isBn ? 'পরীক্ষা' : 'Exam'}</th>
                  <th className="px-4 py-3">{isBn ? 'বিষয় ও কোড' : 'Subject'}</th>
                  <th className="px-4 py-3">{isBn ? 'সময়' : 'Time'}</th>
                  <th className="px-4 py-3">{isBn ? 'কক্ষ নম্বর' : 'Room'}</th>
                  <th className="px-4 py-3">{isBn ? 'পূর্ণ নম্বর' : 'Full Marks'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routines.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      {isBn ? 'বর্তমান ক্লাসের কোনো পরীক্ষার রুটিন নেই' : 'No exam schedules found for this class'}
                    </td>
                  </tr>
                ) : (
                  routines.map((rt) => (
                    <tr key={rt.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {new Date(rt.exam_date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {rt.exam_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {rt.subject_name} {rt.subject_code && <span className="font-mono text-slate-400 text-[10px]">({rt.subject_code})</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {rt.start_time} - {rt.end_time}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {rt.room_number || 'TBA'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {rt.full_marks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}

