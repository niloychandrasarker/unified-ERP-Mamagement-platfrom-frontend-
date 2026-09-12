'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import { useAuth } from '@/lib/auth';
import {
  ClipboardCheck, Users, Calendar, CheckCircle2,
  XCircle, Clock, AlertCircle, BarChart3, Phone,
  Search, Filter, Save, Sparkles, TrendingUp,
  ChevronRight, Award, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function AttendancePage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTION_ADMIN';

  const [activeTab, setActiveTab] = useState('TAKE'); // 'TAKE' or 'ANALYTICS'

  // Common Academic Meta
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Tab 1: Take Attendance States
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [attendanceMode, setAttendanceMode] = useState('DAILY'); // 'DAILY' or 'PERIOD'
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  // Tab 2: Analytics States
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [dailySummary, setDailySummary] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load Classes & Sections
  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/sections')
        ]);
        const cls = cRes.data.data || [];
        const secs = sRes.data.data || [];
        setClasses(cls);
        setSections(secs);

        if (cls.length > 0) {
          setSelectedClassId(cls[0].id);
          const firstSec = secs.find(s => s.class_id === cls[0].id);
          if (firstSec) setSelectedSectionId(firstSec.id);
        }
      } catch (err) {
        toast.error('Failed to load academic setup');
      }
    };
    loadAcademicData();
  }, []);

  const filteredSections = sections.filter(s => s.class_id === selectedClassId);

  // Fetch Roster for Taking Attendance
  const fetchRoster = async () => {
    if (!selectedClassId) return;
    try {
      setLoadingRoster(true);
      const params = {
        class_id: selectedClassId,
        section_id: selectedSectionId || undefined,
        date: selectedDate,
        period_number: attendanceMode === 'PERIOD' ? selectedPeriod : undefined
      };
      const res = await api.get('/attendance/roster', { params });
      const data = res.data.data;
      setIsFinalized(data.isFinalized);

      // Pre-set status to PRESENT if not marked yet
      const mapped = (data.roster || []).map(r => ({
        ...r,
        currentStatus: r.status === 'NOT_MARKED' ? 'PRESENT' : r.status,
        remarks: r.remarks || ''
      }));
      setRoster(mapped);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'TAKE') {
      fetchRoster();
    }
  }, [selectedClassId, selectedSectionId, selectedDate, attendanceMode, selectedPeriod, activeTab]);

  // Fetch Analytics & Daily Summary
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const [sumRes, anaRes] = await Promise.all([
        api.get('/attendance/daily-summary', { params: { date: selectedDate } }),
        api.get('/attendance/analytics', { params: { days: analyticsDays } })
      ]);
      setDailySummary(sumRes.data.data);
      setAnalyticsData(anaRes.data.data);
    } catch (err) {
      toast.error('Failed to load attendance analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS') {
      fetchAnalytics();
    }
  }, [selectedDate, analyticsDays, activeTab]);

  // Bulk Actions
  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(s => ({ ...s, currentStatus: status })));
    toast.success(isBn ? `সকল শিক্ষার্থীকে "${status}" নির্ধারণ করা হয়েছে` : `Marked all as ${status}`);
  };

  // Toggle Single Student Status
  const handleToggleStatus = (studentId, nextStatus) => {
    setRoster(prev => prev.map(s => (s.student_id === studentId ? { ...s, currentStatus: nextStatus } : s)));
  };

  // Remarks change
  const handleRemarksChange = (studentId, text) => {
    setRoster(prev => prev.map(s => (s.student_id === studentId ? { ...s, remarks: text } : s)));
  };

  // Save Attendance Batch
  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    try {
      setSavingBatch(true);
      const payload = {
        class_id: selectedClassId,
        section_id: selectedSectionId || null,
        date: selectedDate,
        period_number: attendanceMode === 'PERIOD' ? selectedPeriod : null,
        records: roster.map(r => ({
          student_id: r.student_id,
          status: r.currentStatus,
          remarks: r.remarks
        }))
      };

      await api.post('/attendance/batch', payload);
      toast.success(isBn ? 'হাজিরা সফলভাবে সংরক্ষণ করা হয়েছে!' : 'Attendance saved successfully!');
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSavingBatch(false);
    }
  };

  // Status counts in roster
  const presentCount = roster.filter(r => r.currentStatus === 'PRESENT').length;
  const absentCount = roster.filter(r => r.currentStatus === 'ABSENT').length;
  const lateCount = roster.filter(r => r.currentStatus === 'LATE').length;
  const excusedCount = roster.filter(r => r.currentStatus === 'EXCUSED').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ClipboardCheck className="text-blue-600 w-7 h-7" />
            {isBn ? 'দৈনিক ও পিরিয়ডভিত্তিক উপস্থিতি' : 'Daily & Period Attendance'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn
              ? 'শ্রেণি ও পিরিয়ডভিত্তিক শিক্ষার্থী হাজিরা গ্রহণ এবং উপস্থিতি অ্যানালিটিক্স'
              : 'Period-wise attendance marking, instant batch upsert, and executive analytics'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('TAKE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'TAKE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck size={14} />
            {isBn ? 'হাজিরা গ্রহণ' : 'Take Attendance'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'ANALYTICS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} />
            {isBn ? 'হাজিরা রিপোর্ট ও অ্যানালিটিক্স' : 'Attendance Analytics'}
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: TAKE ATTENDANCE */}
      {/* ========================================== */}
      {activeTab === 'TAKE' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Date Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">{isBn ? 'তারিখ:' : 'Date:'}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Class Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">{isBn ? 'শ্রেণি:' : 'Class:'}</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const sec = sections.find(s => s.class_id === e.target.value);
                    setSelectedSectionId(sec ? sec.id : '');
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-blue-600"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">{isBn ? 'সেকশন:' : 'Section:'}</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">{isBn ? 'সকল সেকশন' : 'All Sections'}</option>
                  {filteredSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle (Daily vs Period-wise) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAttendanceMode('DAILY')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    attendanceMode === 'DAILY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isBn ? 'দৈনিক' : 'Daily'}
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('PERIOD')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    attendanceMode === 'PERIOD' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isBn ? 'পিরিয়ডভিত্তিক' : 'Period-wise'}
                </button>
              </div>

              {/* Period Selector if Period-wise */}
              {attendanceMode === 'PERIOD' && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-xs font-semibold text-slate-500">{isBn ? 'পিরিয়ড:' : 'Period:'}</span>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>{isBn ? `${num}ম পিরিয়ড` : `Period ${num}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={fetchRoster}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Quick Metrics & Bulk Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">{isBn ? 'মোট শিক্ষার্থী' : 'Total Cohort'}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{roster.length}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-600">{isBn ? 'উপস্থিত (Present)' : 'Present'}</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={16} />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-red-500">{isBn ? 'অনুপস্থিত (Absent)' : 'Absent'}</p>
                <p className="text-xl font-bold text-red-600 mt-0.5">{absentCount}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <XCircle size={16} />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-600">{isBn ? 'দেরি (Late)' : 'Late'}</p>
                <p className="text-xl font-bold text-amber-700 mt-0.5">{lateCount}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={16} />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600">{isBn ? 'উপস্থিতির হার' : 'Rate'}</p>
                <p className="text-xl font-bold text-blue-700 mt-0.5">
                  {roster.length > 0 ? `${Math.round((presentCount / roster.length) * 100)}%` : '0%'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingUp size={16} />
              </div>
            </div>
          </div>

          {/* Roster Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {classes.find(c => c.id === selectedClassId)?.name || ''}
                  {selectedSectionId ? ` • ${sections.find(s => s.id === selectedSectionId)?.name}` : ''}
                </h3>
                <span className="text-xs text-slate-400 font-medium">({selectedDate})</span>
              </div>

              {/* Bulk Select Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
                >
                  ✓ {isBn ? 'সবাই উপস্থিত' : 'All Present'}
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors"
                >
                  ✕ {isBn ? 'সবাই অনুপস্থিত' : 'All Absent'}
                </button>
              </div>
            </div>

            {loadingRoster ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                {isBn ? 'হাজিরা খাতা লোড হচ্ছে...' : 'Loading attendance roster...'}
              </div>
            ) : roster.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users size={36} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">
                  {isBn ? 'এই শ্রেণিতে কোনো শিক্ষার্থী নেই' : 'No enrolled students found'}
                </p>
                <p className="text-xs text-slate-400">
                  {isBn ? 'প্রথমে শিক্ষার্থীদের এই ক্লাসে ভর্তি করুন।' : 'Please admit students to this class first.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-16">{isBn ? 'রোল' : 'Roll'}</th>
                      <th className="py-3 px-4">{isBn ? 'শিক্ষার্থীর নাম ও আইডি' : 'Student & ID'}</th>
                      <th className="py-3 px-4 text-center">{isBn ? 'উপস্থিতি স্ট্যাটাস' : 'Attendance Status'}</th>
                      <th className="py-3 px-4">{isBn ? 'মন্তব্য (ঐচ্ছিক)' : 'Remarks'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster.map((stu) => (
                      <tr key={stu.student_id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Roll */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-sm">
                          {stu.roll_number || '—'}
                        </td>

                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{stu.student_name}</p>
                          <span className="font-mono text-[11px] text-blue-600 font-semibold">{stu.student_code}</span>
                        </td>

                        {/* Status Toggle Buttons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* PRESENT */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(stu.student_id, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                stu.currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              {isBn ? 'উপস্থিত' : 'P'}
                            </button>

                            {/* ABSENT */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(stu.student_id, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                stu.currentStatus === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              {isBn ? 'অনুপস্থিত' : 'A'}
                            </button>

                            {/* LATE */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(stu.student_id, 'LATE')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                stu.currentStatus === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              {isBn ? 'দেরি' : 'L'}
                            </button>

                            {/* EXCUSED */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(stu.student_id, 'EXCUSED')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                stu.currentStatus === 'EXCUSED'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              {isBn ? 'ছুটি' : 'E'}
                            </button>
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder={isBn ? 'মন্তব্য...' : 'Remarks...'}
                            value={stu.remarks}
                            onChange={(e) => handleRemarksChange(stu.student_id, e.target.value)}
                            className="w-full max-w-xs px-3 py-1 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Bar */}
            {roster.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  {isFinalized ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      {isBn ? 'আজকের এই শিডিউলের উপস্থিতি চূড়ান্ত করা হয়েছে।' : 'Attendance for this session is finalized.'}
                    </span>
                  ) : (
                    <span>{isBn ? 'হাজিরা সম্পন্ন হলে সেভ করুন।' : 'Review and click Save to record attendance.'}</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={savingBatch}
                  onClick={handleSaveAttendance}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Save size={15} />
                  {savingBatch
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (isBn ? '💾 হাজিরা সংরক্ষণ করুন' : 'Save Attendance')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: ATTENDANCE ANALYTICS & TRENDS */}
      {/* ========================================== */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Top Analytics Date Range */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isBn ? 'তারিখের রেঞ্জ:' : 'Trend Range:'}
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAnalyticsDays(d)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      analyticsDays === d ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {isBn ? `বিগত ${d} দিন` : `Last ${d} Days`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Daily Executive KPI Cards */}
          {dailySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isBn ? 'আজকের উপস্থিতির হার' : 'Today Attendance Rate'}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">{dailySummary.attendanceRate}%</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {dailySummary.present} / {dailySummary.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${dailySummary.attendanceRate}%` }}></div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  {isBn ? 'মোট উপস্থিত' : 'Present Students'}
                </p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">{dailySummary.present}</p>
                <p className="text-xs text-slate-400 mt-1">{isBn ? 'শ্রেণিকক্ষে উপস্থিত' : 'In classroom'}</p>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                  {isBn ? 'মোট অনুপস্থিত' : 'Absent Students'}
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">{dailySummary.absent}</p>
                <p className="text-xs text-slate-400 mt-1">{isBn ? 'কোন ছুটি ব্যতিরেকে' : 'Unexcused'}</p>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  {isBn ? 'বিলম্ব ও ছুটি' : 'Late & Leave'}
                </p>
                <p className="text-3xl font-bold text-amber-700 mt-2">{dailySummary.late + dailySummary.excused}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {dailySummary.late} {isBn ? 'দেরি' : 'Late'} • {dailySummary.excused} {isBn ? 'ছুটি' : 'Leave'}
                </p>
              </div>
            </div>
          )}

          {/* Class-wise Breakdown Table / Progress */}
          {dailySummary?.classBreakdown && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? 'শ্রেণিভিত্তিক উপস্থিতির হার (Classes 1 - 10)' : 'Class-wise Attendance Comparison'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'প্রতিটি শ্রেণির মোট শিক্ষার্থী ও উপস্থিতির অনুপাত' : 'Roster vs Present breakdown across all 10 grades'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailySummary.classBreakdown.map((c) => (
                  <div key={c.class_id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{c.class_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {c.present_count} / {c.total_students} {isBn ? 'উপস্থিত' : 'present'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-white border border-slate-200 text-blue-700">
                          {c.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          c.rate >= 90 ? 'bg-emerald-500' : c.rate >= 75 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${c.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Attendance Defaulters List (< 75%) */}
          {analyticsData?.defaulters && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {isBn ? 'কম উপস্থিতির সতর্কবার্তা তালিকা (Defaulters < 75%)' : 'Low Attendance Alert Roster (< 75%)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isBn ? 'বিগত ৩০ দিনে যাদের উপস্থিতি ৭৫% এর কম এবং সরাসরি অভিভাবকের সাথে যোগাযোগযোগ্য' : 'Students with critically low attendance requiring guardian intervention'}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  {analyticsData.defaulters.length} {isBn ? 'জন শিক্ষার্থী' : 'Students'}
                </span>
              </div>

              {analyticsData.defaulters.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700">
                    {isBn ? 'চমৎকার! কোনো শিক্ষার্থীর উপস্থিতি ৭৫% এর নিচে নেই।' : 'No defaulters found! Excellent attendance rates.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">{isBn ? 'শিক্ষার্থীর নাম ও আইডি' : 'Student & ID'}</th>
                        <th className="py-3 px-4">{isBn ? 'শ্রেণি ও সেকশন' : 'Class & Section'}</th>
                        <th className="py-3 px-4">{isBn ? 'রোল' : 'Roll'}</th>
                        <th className="py-3 px-4">{isBn ? 'উপস্থিতির হার' : 'Attendance Rate'}</th>
                        <th className="py-3 px-4">{isBn ? 'অভিভাবক ও ফোন' : 'Guardian Contact'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analyticsData.defaulters.map((d, i) => (
                        <tr key={d.student_id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{d.name}</p>
                            <span className="font-mono text-[11px] text-blue-600 font-semibold">{d.student_code}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {d.class_name} ({d.section_name || 'N/A'})
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.roll_number || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-red-50 text-red-700 border border-red-200">
                              {d.attendance_percentage}% ({d.attended_days}/{d.total_marked_days})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-800">{d.guardian_name || '—'}</p>
                            {d.guardian_phone && (
                              <a
                                href={`tel:${d.guardian_phone}`}
                                className="font-mono text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Phone size={11} />
                                {d.guardian_phone}
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

