'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Sliders,
  Search,
  Filter,
  Eye,
  Send,
  Lock,
  Globe,
  Share2,
  School,
  User,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  X,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function ResultPublicationPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const isPrincipal = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  // Selection States
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [rules, setRules] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState('');

  // Readiness & Tabulation Data
  const [readiness, setReadiness] = useState(null);
  const [tabulation, setTabulation] = useState(null);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Modals
  const [confirmPublishModal, setConfirmPublishModal] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedScheduleForCorrection, setSelectedScheduleForCorrection] = useState(null);
  const [correctionNotes, setCorrectionNotes] = useState('');

  // 1. Initial Load: Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingInitial(true);
        const res = await api.get('/academics/classes');
        const list = res.data.data || [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClassId(list[0].id);
        }
      } catch (err) {
        toast.error(isBn ? 'শ্রেণি লোড করা যায়নি' : 'Failed to load classes');
      } finally {
        setLoadingInitial(false);
      }
    };
    if (isPrincipal) {
      loadClasses();
    }
  }, [isPrincipal, isBn]);

  // 2. Load Grading Rules for Selected Class
  useEffect(() => {
    const loadRules = async () => {
      if (!selectedClassId) {
        setRules([]);
        setSelectedRuleId('');
        return;
      }
      try {
        const res = await api.get(`/exams/grading-rules/list?class_id=${selectedClassId}&academic_year=2026`);
        const list = res.data.data || [];
        setRules(list);
        if (list.length > 0) {
          setSelectedRuleId(list[0].id);
        } else {
          setSelectedRuleId('');
          setReadiness(null);
          setTabulation(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadRules();
  }, [selectedClassId]);

  // 3. Load Readiness & Existing Tabulation when Rule Selected
  const loadReadinessAndResults = async () => {
    if (!selectedRuleId) return;
    try {
      setLoadingReadiness(true);
      const [readinessRes, resultsRes] = await Promise.all([
        api.get(`/exams/grading-rules/${selectedRuleId}/readiness`),
        api.get(`/exams/grading-rules/${selectedRuleId}/results`)
      ]);
      setReadiness(readinessRes.data.data);
      setTabulation(resultsRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error(isBn ? 'রেডিনেস তথ্য লোড করা যায়নি' : 'Failed to load readiness');
    } finally {
      setLoadingReadiness(false);
    }
  };

  useEffect(() => {
    loadReadinessAndResults();
  }, [selectedRuleId]);

  // 4. Trigger Automatic Calculation
  const handleCalculate = async () => {
    if (!selectedRuleId) return;
    try {
      setCalculating(true);
      const res = await api.post(`/exams/grading-rules/${selectedRuleId}/calculate`);
      toast.success(res.data.message || (isBn ? 'ফলাফল গণনা সম্পন্ন হয়েছে!' : 'Tabulation calculated!'));
      loadReadinessAndResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  // 5. Official Publish Action
  const handlePublishOfficial = async (shouldPublish = true) => {
    if (!selectedRuleId) return;
    try {
      setPublishing(true);
      const res = await api.post(`/exams/grading-rules/${selectedRuleId}/status`, {
        published: shouldPublish,
        status: shouldPublish ? 'PUBLISHED' : 'APPROVED'
      });
      if (shouldPublish) {
        toast.success(isBn ? '🎉 চূড়ান্ত ফলাফল সফলভাবে প্রকাশিত হয়েছে!' : 'Official results published successfully!');
      } else {
        toast.success(isBn ? 'ফলাফল অপ্রকাশিত করা হয়েছে (ড্রাফট স্ট্যাটাস)' : 'Results reverted to draft');
      }
      setConfirmPublishModal(false);
      loadReadinessAndResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setPublishing(false);
    }
  };

  // 6. Request Correction from Teacher
  const handleSendCorrection = async (e) => {
    e.preventDefault();
    if (!selectedScheduleForCorrection || !correctionNotes.trim()) return;
    try {
      await api.post(`/exams/schedules/${selectedScheduleForCorrection.schedule_id}/marks/correction`, {
        notes: correctionNotes
      });
      toast.success(isBn ? 'সংশোধনের অনুরোধ শিক্ষকের কাছে পাঠানো হয়েছে!' : 'Correction request sent to teacher');
      setCorrectionModalOpen(false);
      setCorrectionNotes('');
      setSelectedScheduleForCorrection(null);
      loadReadinessAndResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send correction');
    }
  };

  // If not principal, show access denied
  if (!isPrincipal) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 my-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {isBn ? 'শুধুমাত্র অধ্যক্ষ / প্রধান শিক্ষকের প্রবেশাধিকার' : 'Principal Access Required'}
        </h2>
        <p className="text-xs text-slate-500">
          {isBn
            ? 'চূড়ান্ত সেমিস্টার ও টার্ম ফলাফল প্রকাশনার জন্য শুধুমাত্র প্রাতিষ্ঠানিক প্রধান (Principal / Institution Admin) অনুমোদিত।'
            : 'Only the Institution Administrator / Principal can review and publish consolidated term results.'}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
        >
          <span>{isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}</span>
        </Link>
      </div>
    );
  }

  const isPublished = readiness?.isTermPublished || false;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>{isBn ? 'অধ্যক্ষ মহোদয়ের ফলাফল অনুমোদন ও প্রকাশনা পোর্টাল' : 'Principal Result Publication Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{isBn ? 'ফলাফল প্রকাশনা হাব' : 'Official Result Publication Hub'}</span>
            {isPublished && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCheck size={12} /> {isBn ? 'প্রকাশিত' : 'Published'}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'সকল বিষয়ের শিক্ষকের নম্বর জমাদানের অবস্থা যাচাই করুন, টেবুলেশন শীট পর্যবেক্ষণ করুন এবং চূড়ান্ত ফলাফল প্রকাশ করুন।'
              : 'Verify all faculty marks submissions, review consolidated tabulation, and officially publish results.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/dashboard/exams"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Award size={14} className="text-blue-600" />
            <span>{isBn ? 'পরীক্ষা ও রুটিন' : 'Exams'}</span>
          </Link>
          <Link
            href="/dashboard/exams/grading-rules"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Sliders size={14} className="text-purple-600" />
            <span>{isBn ? 'ফাইনাল ওয়েট কনফিগ' : 'Weight Config'}</span>
          </Link>
          <Link
            href="/dashboard/exams/marks"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} className="text-blue-600" />
            <span>{isBn ? 'নম্বর এন্ট্রি খাতা' : 'Marks Entry'}</span>
          </Link>
        </div>
      </div>

      {/* FILTER & RULE SELECTION BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Class Select */}
          <div className="w-full sm:w-56">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {isBn ? 'শ্রেণি নির্বাচন' : 'Select Class'}
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white"
            >
              <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select Class --'}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Grading Rule / Term Select */}
          <div className="w-full sm:w-80">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {isBn ? 'গ্রেডিং রুল / সেমিস্টার টার্ম' : 'Grading Rule / Term'}
            </label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white"
            >
              {rules.length === 0 ? (
                <option value="">{isBn ? '-- কোনো কনফিগারেশন তৈরি করা নেই --' : '-- No Rules Created --'}</option>
              ) : (
                rules.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.term} - {r.academic_year})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadReadinessAndResults}
            disabled={loadingReadiness}
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            title="Refresh Status"
          >
            <RotateCcw size={16} className={loadingReadiness ? 'animate-spin text-blue-600' : ''} />
          </button>

          {selectedRuleId && (
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calculating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={14} className={calculating ? 'animate-spin' : ''} />
              <span>{calculating ? (isBn ? 'গণনা হচ্ছে...' : 'Calculating...') : (isBn ? 'টেবুলেশন ক্যালকুলেট করুন' : 'Calculate Tabulation')}</span>
            </button>
          )}
        </div>
      </div>

      {/* NO RULES WARNING */}
      {rules.length === 0 && !loadingInitial && (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Sliders size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {isBn ? 'এই শ্রেণির জন্য কোনো গ্রেডিং রুল তৈরি করা হয়নি' : 'No Grading Rule Configured for this Class'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isBn
              ? 'চূড়ান্ত ফলাফল প্রকাশের জন্য প্রথমে পরীক্ষাগুলোর ওয়েট নির্ধারণ (যেমন: মিডটার্ম ৩০% + ফাইনাল ৭০%) করুন।'
              : 'Before publishing, set up assessment weights (e.g. Midterm 30% + Final 70%) in Weight Config.'}
          </p>
          <Link
            href="/dashboard/exams/grading-rules"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Sliders size={14} />
            <span>{isBn ? 'গ্রেডিং রুল কনফিগার করুন' : 'Configure Grading Rule'}</span>
          </Link>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {selectedRuleId && readiness && (
        <div className="space-y-6">
          {/* 1. READINESS STATUS BANNER */}
          <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
            isPublished
              ? 'bg-emerald-50/80 border-emerald-200'
              : readiness.isReadyToPublish
              ? 'bg-blue-50/80 border-blue-200'
              : 'bg-amber-50/80 border-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-700'
                    : readiness.isReadyToPublish
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isPublished ? <CheckCheck size={24} /> : readiness.isReadyToPublish ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isPublished
                      ? (isBn ? 'এই সেমিস্টারের চূড়ান্ত ফলাফল প্রকাশিত হয়েছে' : 'Official Results Published')
                      : readiness.isReadyToPublish
                      ? (isBn ? 'সকল শিক্ষকের নম্বর জমাদান সম্পন্ন — ফলাফল প্রকাশের জন্য প্রস্তুত!' : 'All Teacher Marks Submitted — Ready to Publish!')
                      : (isBn ? 'কিছু বিষয়ের নম্বর এখনো জমা সম্পন্ন হয়নি' : 'Awaiting Teacher Marks Submission')}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isPublished
                      ? (isBn ? `প্রকাশের সময়: ${new Date(readiness.publishedAt).toLocaleString('bn-BD')} • শিক্ষার্থীরা তাদের পোর্টাল থেকে মার্কশিট দেখতে পারছে।` : `Published at ${new Date(readiness.publishedAt).toLocaleString()} • Students can view their transcripts.`)
                      : readiness.isReadyToPublish
                      ? (isBn ? 'সকল বিষয়ের নম্বর প্রাপ্ত ও যাচাইকৃত হয়েছে। নিচের ক্যালকুলেশন রিভিউ করে ফলাফল প্রকাশ করুন।' : 'All subject marks are submitted and approved. Verify tabulation below to publish.')
                      : (isBn ? `মোট ${readiness.totalAssessmentItems} টি বিষয়ের মধ্যে ${readiness.readyAssessmentItems} টি প্রস্তুত (${readiness.completionPercentage}%)।` : `${readiness.readyAssessmentItems} of ${readiness.totalAssessmentItems} subjects submitted (${readiness.completionPercentage}%).`)}
                  </p>
                </div>
              </div>

              {/* Publish / Unpublish CTA Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {isPublished ? (
                  <button
                    type="button"
                    onClick={() => handlePublishOfficial(false)}
                    disabled={publishing}
                    className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    {publishing ? (isBn ? 'প্রক্রিয়াধীন...' : 'Processing...') : (isBn ? 'অপ্রকাশিত করুন (Revert)' : 'Unpublish Results')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmPublishModal(true)}
                    disabled={publishing || !readiness.isCalculated}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <Send size={15} />
                    <span>{isBn ? '🚀 অফিশিয়াল ফলাফল প্রকাশ করুন' : '🚀 Publish Official Results'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-3">
              <div className="flex-1 bg-white/80 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full transition-all duration-500 ${
                    readiness.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${readiness.completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 shrink-0">
                {readiness.readyAssessmentItems} / {readiness.totalAssessmentItems} ({readiness.completionPercentage}%)
              </span>
            </div>
          </div>

          {/* 2. SUBJECT-WISE TEACHER SUBMISSION CHECKLIST */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isBn ? 'শিক্ষকদের নম্বর জমাদানের বিস্তারিত চেকলিস্ট' : 'Faculty Marks Submission Checklist'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? 'প্রতিটি বিষয়ের দায়িত্বপ্রাপ্ত শিক্ষক, মোট নম্বর প্রদান ও বর্তমান অবস্থা'
                    : 'Track each subject teacher, student mark count, and submission state'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{isBn ? 'পরীক্ষা ও ওয়েট' : 'Exam & Weight'}</th>
                    <th className="py-3 px-4">{isBn ? 'বিষয় ও কোড' : 'Subject'}</th>
                    <th className="py-3 px-4">{isBn ? 'দায়িত্বপ্রাপ্ত শিক্ষক' : 'Assigned Faculty'}</th>
                    <th className="py-3 px-4">{isBn ? 'নম্বর এন্ট্রি অগ্রগতি' : 'Progress'}</th>
                    <th className="py-3 px-4">{isBn ? 'অবস্থা (Status)' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readiness.roster.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{item.exam_name}</p>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 mt-0.5 inline-block">
                          {item.weight_percentage}% Weight
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-blue-900">{item.subject_name}</p>
                        {item.subject_code && (
                          <span className="text-[10px] font-mono text-slate-400">{item.subject_code}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{item.teacher_name}</p>
                        <p className="text-[10px] text-slate-400">{item.teacher_email || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-slate-700">{item.entered_count} / {item.total_students}</span>
                            <span className="text-slate-400">
                              {item.total_students > 0 ? Math.round((item.entered_count / item.total_students) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${item.total_students > 0 ? (item.entered_count / item.total_students) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'APPROVED'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : item.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : item.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.status === 'CORRECTION_REQUESTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.schedule_id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/exams/marks?schedule_id=${item.schedule_id}&exam_id=${item.exam_id}&class_id=${selectedClassId}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              {isBn ? 'নম্বর দেখুন' : 'View Marks'}
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedScheduleForCorrection(item);
                                setCorrectionNotes('');
                                setCorrectionModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors"
                              title="Request Correction"
                            >
                              {isBn ? 'সংশোধন' : 'Correction'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">No Schedule</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. TABULATION PREVIEW & STUDENT RANKS */}
          {tabulation && tabulation.results && tabulation.results.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isBn ? 'টেবুলেশন শীট ও ফলাফল মেধা তালিকা' : 'Consolidated Tabulation & Merit List'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? `মোট ${tabulation.analytics.totalStudents} জন শিক্ষার্থীর ফলাফল প্রস্তুত` : `${tabulation.analytics.totalStudents} students evaluated`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Printer size={14} />
                    <span>{isBn ? 'প্রিন্ট টেবুলেশন' : 'Print Tabulation'}</span>
                  </button>
                </div>
              </div>

              {/* Analytics Mini Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'মোট শিক্ষার্থী' : 'Total Students'}</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{tabulation.analytics.totalStudents}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{isBn ? 'উত্তীর্ণ (Passed)' : 'Passed'}</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">
                    {tabulation.analytics.passedStudents} <span className="text-xs font-normal">({tabulation.analytics.passPercentage}%)</span>
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">{isBn ? 'অনুত্তীর্ণ (Failed)' : 'Failed'}</p>
                  <p className="text-lg font-black text-rose-700 mt-0.5">{tabulation.analytics.failedStudents}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">{isBn ? 'গড় জিপিএ (Avg GPA)' : 'Avg GPA'}</p>
                  <p className="text-lg font-black text-blue-700 mt-0.5">{tabulation.analytics.averageGpa}</p>
                </div>
              </div>

              {/* Tabulation Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <th className="py-2.5 px-3">{isBn ? 'মেধাক্রম' : 'Rank'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'রোল' : 'Roll'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'মোট নম্বর' : 'Total Marks'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'শতকরা (%)' : 'Percentage'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'জিপিএ (GPA)' : 'GPA'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'গ্রেড' : 'Grade'}</th>
                      <th className="py-2.5 px-3 text-right">{isBn ? 'ফলাফল' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabulation.results.map((stu, i) => (
                      <tr key={stu.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">#{stu.class_rank || i + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{stu.roll_number || '—'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{stu.student_name}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {stu.total_marks} <span className="text-slate-400 text-[10px]">/ {stu.total_full_marks}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{stu.percentage}%</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{stu.gpa}</td>
                        <td className="py-3 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stu.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                            stu.grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {stu.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {stu.status}
                          </span>
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

      {/* MODAL 1: CONFIRM OFFICIAL PUBLISH */}
      {confirmPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Send size={28} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {isBn ? 'অফিশিয়াল ফলাফল প্রকাশ নিশ্চিতকরণ' : 'Confirm Official Result Publication'}
              </h3>
              <p className="text-xs text-slate-500">
                {isBn
                  ? `আপনি কি নিশ্চিত যে "${readiness?.rule?.title}"-এর ফলাফল প্রকাশ করতে চান? প্রকাশের সাথে সাথে সকল শিক্ষার্থী তাদের নিজ নিজ স্টুডেন্ট পোর্টাল থেকে গ্রেডশিট দেখতে ও ডাউনলোড করতে পারবে।`
                  : `Are you sure you want to officially publish results for "${readiness?.rule?.title}"? All evaluated students will immediately see their transcripts in the Student Portal.`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? 'শ্রেণি:' : 'Class:'}</span>
                <span className="font-bold text-slate-800">{readiness?.rule?.class_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? 'মোট শিক্ষার্থী:' : 'Total Students:'}</span>
                <span className="font-mono font-bold text-slate-800">{readiness?.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? 'অন্তর্ভুক্ত বিষয়:' : 'Assessed Subjects:'}</span>
                <span className="font-mono font-bold text-blue-600">{readiness?.totalAssessmentItems}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPublishModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handlePublishOfficial(true)}
                disabled={publishing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>{publishing ? (isBn ? 'প্রকাশ হচ্ছে...' : 'Publishing...') : (isBn ? 'হ্যাঁ, প্রকাশ করুন' : 'Confirm Publish')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CORRECTION */}
      {correctionModalOpen && selectedScheduleForCorrection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'শিক্ষককে নম্বর সংশোধনের নির্দেশ দিন' : 'Request Marks Correction'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedScheduleForCorrection.subject_name} • {selectedScheduleForCorrection.teacher_name}
                </p>
              </div>
              <button onClick={() => setCorrectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'সংশোধনের কারণ বা নির্দেশনা লিখুন' : 'Correction Instructions'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: রোল ৩ এর প্র্যাকটিক্যাল নম্বর পুনঃযাচাই করুন...' : 'e.g. Please re-check roll 3 practical marks...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {isBn ? 'অনুরোধ পাঠান' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

