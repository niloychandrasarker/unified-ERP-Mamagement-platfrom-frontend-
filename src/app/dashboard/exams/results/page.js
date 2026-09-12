'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Download,
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
  Edit3
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

function ResultsHubContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  // State for Admin / Teacher
  const [rules, setRules] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState(searchParams.get('rule_id') || '');
  const [analytics, setAnalytics] = useState(null);
  const [resultsList, setResultsList] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // State for Student Portal View
  const [studentPublishedCards, setStudentPublishedCards] = useState([]);
  const [loadingStudentResults, setLoadingStudentResults] = useState(false);

  // Initial Data
  useEffect(() => {
    if (isStudent) {
      loadStudentResults();
    } else {
      loadGradingRules();
    }
  }, [isStudent]);

  // Load Admin Rules
  const loadGradingRules = async () => {
    try {
      const res = await api.get('/exams/grading-rules/list');
      const list = res.data.data || [];
      setRules(list);
      if (!selectedRuleId && list.length > 0) {
        setSelectedRuleId(list[0].id);
      }
    } catch (err) {
      toast.error('Failed to load grading rules');
    }
  };

  // Load Results when rule changes
  useEffect(() => {
    if (!isStudent && selectedRuleId) {
      fetchTabulationSheet();
    }
  }, [selectedRuleId, isStudent]);

  const fetchTabulationSheet = async () => {
    try {
      setLoadingResults(true);
      const res = await api.get(`/exams/grading-rules/${selectedRuleId}/results`);
      setAnalytics(res.data.data.analytics);
      setResultsList(res.data.data.results || []);
    } catch (err) {
      toast.error('Failed to load tabulation results');
      setResultsList([]);
    } finally {
      setLoadingResults(false);
    }
  };

  // Student Results
  const loadStudentResults = async () => {
    try {
      setLoadingStudentResults(true);
      const res = await api.get('/exams/student/my-results');
      setStudentPublishedCards(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load your published results');
    } finally {
      setLoadingStudentResults(false);
    }
  };

  // Publish / Unpublish Action
  const handleUpdatePublication = async (published) => {
    const confirmMsg = published
      ? (isBn ? 'আপনি কি ফলাফল স্টুডেন্ট পোর্টালে প্রকাশ করতে চান? শিক্ষার্থীরা তাদের আইডি দিয়ে ফলাফল ও মার্কশিট দেখতে পারবে।' : 'Publish results to Student Portal? Students will immediately be able to view their report cards.')
      : (isBn ? 'ফলাফল অপ্রকাশিত করতে চান?' : 'Unpublish results from Student Portal?');

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      await api.post(`/exams/grading-rules/${selectedRuleId}/status`, { published });
      toast.success(published ? 'ফলাফল সফলভাবে প্রকাশিত হয়েছে!' : 'Results unpublished');
      fetchTabulationSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredResults = useMemo(() => {
    return resultsList.filter(item => {
      const matchSearch = !searchStudent ||
        item.student_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        item.student_code.toLowerCase().includes(searchStudent.toLowerCase()) ||
        item.roll_number?.toString().includes(searchStudent);
      const matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [resultsList, searchStudent, statusFilter]);

  // =========================================================================
  // 1. STUDENT VIEW
  // =========================================================================
  if (isStudent) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <GraduationCap size={16} />
            <span>{isBn ? 'শিক্ষার্থী ফলাফল পোর্টাল' : 'Student Result Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'আমার পরীক্ষার ফলাফল ও মার্কশিট' : 'My Examination Results & Report Cards'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn ? 'প্রকাশিত সকল পরীক্ষার বিষয়ভিত্তিক নম্বর ও গ্রেডশিট ডাউনলোড করুন।' : 'View and download official academic marksheets for published exam terms.'}
          </p>
        </div>

        {loadingStudentResults ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
            <Award className="w-8 h-8 animate-bounce text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">{isBn ? 'ফলাফল লোড হচ্ছে...' : 'Loading results...'}</p>
          </div>
        ) : studentPublishedCards.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <Award size={36} className="text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {isBn ? 'এখনো কোনো ফলাফল প্রকাশিত হয়নি' : 'No Examination Results Published Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isBn
                ? 'অধ্যক্ষ / পরীক্ষা কমিটি ফলাফল অনুমোদন ও প্রকাশ করার পর তা এখানে দেখা যাবে।'
                : 'Your examination results will appear here as soon as the Principal approves and publishes them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {studentPublishedCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-md space-y-6"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl">
                      ● {isBn ? 'প্রকাশিত ফলাফল' : 'Official Published Result'}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-2">{card.rule_title}</h2>
                    <p className="text-xs text-slate-500">
                      {card.class_name} {card.section_name ? `• ${card.section_name}` : ''} • Roll: {card.roll_number} • ID: {card.student_code}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentResult(card);
                      setShowReportCardModal(true);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <Printer size={15} />
                    <span>{isBn ? 'অফিসিয়াল মার্কশিট প্রিন্ট' : 'Print Official Report Card'}</span>
                  </button>
                </div>

                {/* Performance Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-blue-800 uppercase">{isBn ? 'জিপিএ (GPA)' : 'GPA'}</p>
                    <p className="text-2xl font-mono font-black text-blue-900 mt-0.5">{card.gpa}</p>
                    <span className="text-[10px] font-bold text-blue-600">Grade: {card.grade}</span>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">{isBn ? 'মোট প্রাপ্ত নম্বর' : 'Total Marks'}</p>
                    <p className="text-2xl font-mono font-black text-emerald-900 mt-0.5">{card.total_marks}</p>
                    <span className="text-[10px] font-semibold text-emerald-600">{card.percentage}%</span>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-purple-800 uppercase">{isBn ? 'শ্রেণি অবস্থান' : 'Class Rank'}</p>
                    <p className="text-2xl font-mono font-black text-purple-900 mt-0.5">
                      #{card.class_rank || '—'}
                    </p>
                    <span className="text-[10px] font-semibold text-purple-600">
                      {card.section_rank ? `Sec Rank: #${card.section_rank}` : 'In Class'}
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl text-center border ${
                    card.status === 'PASSED' ? 'bg-teal-50/70 border-teal-100 text-teal-900' : 'bg-rose-50/70 border-rose-100 text-rose-900'
                  }`}>
                    <p className="text-[10px] font-bold uppercase">{isBn ? 'ফলাফল অবস্থা' : 'Result Status'}</p>
                    <p className="text-xl font-black mt-1">{card.status}</p>
                    <span className="text-[10px] font-semibold">{card.status === 'PASSED' ? 'Promoted' : 'Needs Review'}</span>
                  </div>
                </div>

                {/* Subject-wise Marks Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isBn ? 'বিষয়ভিত্তিক প্রাপ্ত নম্বর ও মূল্যায়ন বিশ্লেষণ' : 'Subject-wise Breakdown & Weighted Scores'}
                  </h4>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-4">{isBn ? 'বিষয়' : 'Subject'}</th>
                          <th className="py-2.5 px-3 text-center">{isBn ? 'পূর্ণমান' : 'Full'}</th>
                          <th className="py-2.5 px-3 text-center">{isBn ? 'প্রাপ্ত নম্বর' : 'Obtained'}</th>
                          <th className="py-2.5 px-3 text-center">{isBn ? 'লেটার গ্রেড' : 'Grade'}</th>
                          <th className="py-2.5 px-3 text-center">{isBn ? 'গ্রেড পয়েন্ট' : 'Point'}</th>
                          <th className="py-2.5 px-4">{isBn ? 'মূল্যায়ন অবদান' : 'Assessment Breakdown'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(card.subject_results || []).map((sub, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {sub.subject_name} {sub.subject_code ? `(${sub.subject_code})` : ''}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{sub.full_marks}</td>
                            <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900">
                              {sub.obtained_marks}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                                sub.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                                sub.grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                              {sub.grade_point}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500">
                              <div className="flex flex-wrap gap-1.5">
                                {(sub.assessments || []).map((asm, aIdx) => (
                                  <span key={aIdx} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                                    {asm.exam_name} ({asm.weight_percentage}%): <strong>{asm.obtained_marks}</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRINT REPORT CARD MODAL */}
        {showReportCardModal && selectedStudentResult && (
          <ReportCardPrintModal
            result={selectedStudentResult}
            institution={user?.institution}
            onClose={() => setShowReportCardModal(false)}
            isBn={isBn}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. ADMIN / TEACHER TABULATION SHEET & WORKFLOW VIEW
  // =========================================================================
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Award size={16} />
            <span>{isBn ? 'ফলাফল পর্যালোচনা ও প্রকাশনা' : 'Results Tabulation & Approval'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'একাডেমিক ফলাফল ও মূল্যায়ন শীট' : 'Academic Tabulation Sheet & Report Cards'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'ওয়েটেড রেজাল্ট রিভিউ করুন, অনুমোদন দিন এবং স্টুডেন্ট পোর্টালে ফলাফল প্রকাশ করুন।'
              : 'Review weighted final calculations, approve results, and publish to the Student Portal.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/dashboard/exams/grading-rules"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Sliders size={14} className="text-purple-600" />
            <span>{isBn ? 'ওয়েট কনফিগারেশন' : 'Weight Config'}</span>
          </Link>
          <Link
            href="/dashboard/exams/marks"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} className="text-blue-600" />
            <span>{isBn ? 'নম্বর এন্ট্রি' : 'Marks Entry'}</span>
          </Link>
        </div>
      </div>

      {/* RULE SELECTOR & ACTIONS BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isBn ? 'গ্রেডিং রুল / টার্ম নির্বাচন' : 'Select Grading Rule / Term'}
            </label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-blue-600 bg-white text-slate-800"
            >
              {rules.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.class_name}] {r.title} ({r.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isBn ? 'ফলাফল ফিল্টার' : 'Status Filter'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 bg-white"
            >
              <option value="">{isBn ? '-- সকল ফলাফল --' : '-- All Results --'}</option>
              <option value="PASSED">Passed Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Publication Actions for Admin */}
        {isAdmin && (
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>{isBn ? 'শীট প্রিন্ট' : 'Print Tabulation'}</span>
            </button>

            {analytics?.isPublished ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdatePublication(false)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Lock size={14} />
                <span>{isBn ? 'অপ্রকাশিত করুন' : 'Unpublish Results'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading || resultsList.length === 0}
                onClick={() => handleUpdatePublication(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Globe size={15} />
                <span>{isBn ? 'পোর্টালে ফলাফল প্রকাশ করুন' : 'Publish to Student Portal'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ANALYTICS SUMMARY TILES */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'মোট পরীক্ষার্থী' : 'Total Students'}</p>
            <p className="text-2xl font-mono font-black text-slate-900 mt-0.5">{analytics.totalStudents}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">{isBn ? 'উত্তীর্ণ (Passed)' : 'Passed'}</p>
            <p className="text-2xl font-mono font-black text-emerald-700 mt-0.5">{analytics.passedStudents}</p>
            <span className="text-[10px] font-semibold text-emerald-600">{analytics.passPercentage}%</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold text-rose-600 uppercase">{isBn ? 'অনুত্তীর্ণ (Failed)' : 'Failed'}</p>
            <p className="text-2xl font-mono font-black text-rose-700 mt-0.5">{analytics.failedStudents}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold text-blue-600 uppercase">{isBn ? 'গড় জিপিএ (Average GPA)' : 'Avg GPA'}</p>
            <p className="text-2xl font-mono font-black text-blue-700 mt-0.5">{analytics.averageGpa}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold text-purple-600 uppercase">{isBn ? 'প্রকাশনার অবস্থা' : 'Publish Status'}</p>
            <div className="mt-1">
              {analytics.isPublished ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} /> Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Draft / Unreleased
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABULATION TABLE */}
      {loadingResults ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
          <Award className="w-8 h-8 animate-bounce text-blue-500 mx-auto mb-2" />
          <p className="text-xs font-semibold">{isBn ? 'ফলাফল তালিকা লোড হচ্ছে...' : 'Loading tabulation sheet...'}</p>
        </div>
      ) : resultsList.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <FileText size={32} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {isBn ? 'এই নিয়মের কোনো ফলাফল পাওয়া যায়নি' : 'No Results Calculated for this Rule'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isBn
              ? 'প্রথমে "ফাইনাল ওয়েট কনফিগ" পেজ থেকে ফলাফল হিসাব (Run Calculation) করুন।'
              : 'Please run the calculation engine from the Weight Config page to generate results.'}
          </p>
          <Link
            href="/dashboard/exams/grading-rules"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Sliders size={14} />
            <span>{isBn ? 'ওয়েট কনফিগে যান' : 'Go to Weight Config'}</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isBn ? 'রোল, নাম বা আইডি খুঁজুন...' : 'Search student...'}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <p className="text-xs text-slate-500 font-semibold">
              Showing {filteredResults.length} of {resultsList.length} students
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center">{isBn ? 'ক্লাস র‍্যাংক' : 'Rank'}</th>
                  <th className="py-3 px-3">Roll</th>
                  <th className="py-3 px-4">{isBn ? 'শিক্ষার্থী' : 'Student Name & ID'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'মোট নম্বর' : 'Total Marks'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'শতকরা (%)' : 'Percentage'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'জিপিএ (GPA)' : 'GPA'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'লেটার গ্রেড' : 'Grade'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'ফলাফল' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block w-7 h-7 rounded-lg text-xs font-mono font-extrabold flex items-center justify-center ${
                        row.class_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        row.class_rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                        row.class_rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                        'text-slate-500'
                      }`}>
                        #{row.class_rank || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                      {row.roll_number || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {row.photo_url ? (
                          <img
                            src={getPhotoSrc(row.photo_url)}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {row.student_name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{row.student_name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            ID: {row.student_code} {row.section_name ? `• ${row.section_name}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-extrabold text-slate-900">
                      {row.total_marks} <span className="text-slate-400 text-[10px]">/{row.total_full_marks}</span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-600 font-bold">
                      {row.percentage}%
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-extrabold text-sm text-blue-700">
                      {row.gpa}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        row.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                        row.grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {row.grade}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        row.status === 'PASSED'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentResult(row)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>{isBn ? 'বিশ্লেষণ' : 'Details'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentResult(row);
                            setShowReportCardModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Printer size={13} />
                          <span>{isBn ? 'মার্কশিট' : 'Card'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL INSPECT MODAL */}
      {selectedStudentResult && !showReportCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedStudentResult.student_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll: {selectedStudentResult.roll_number} • ID: {selectedStudentResult.student_code} • {selectedStudentResult.class_name}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentResult(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">GPA</p>
                <p className="text-lg font-mono font-black text-blue-700 mt-0.5">{selectedStudentResult.gpa}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Grade</p>
                <p className="text-lg font-mono font-black text-slate-800 mt-0.5">{selectedStudentResult.grade}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Class Rank</p>
                <p className="text-lg font-mono font-black text-purple-700 mt-0.5">#{selectedStudentResult.class_rank || '—'}</p>
              </div>
            </div>

            {/* Itemized Subject Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isBn ? 'বিষয়ভিত্তিক প্রাপ্ত মূল্যায়ন বিবরণ' : 'Subject Assessment Breakdown'}
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(selectedStudentResult.subject_results || []).map((sub, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900">{sub.subject_name}</span>
                        {sub.subject_code && <span className="text-[10px] font-mono text-slate-400 ml-1.5">({sub.subject_code})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{sub.obtained_marks}/100</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                          {sub.grade} ({sub.grade_point})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                      {(sub.assessments || []).map((a, aIdx) => (
                        <div key={aIdx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] flex items-center gap-1">
                          <span className="font-semibold text-slate-600">{a.exam_name} ({a.weight_percentage}%):</span>
                          <span className="font-mono font-bold text-slate-900">{a.obtained_marks}</span>
                          <span className="text-[9px] text-purple-600 font-bold">→ {a.weighted_score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentResult(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => setShowReportCardModal(true)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>{isBn ? 'মার্কশিট প্রিন্ট করুন' : 'Print Marksheet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT REPORT CARD MODAL */}
      {showReportCardModal && selectedStudentResult && (
        <ReportCardPrintModal
          result={selectedStudentResult}
          institution={user?.institution}
          onClose={() => setShowReportCardModal(false)}
          isBn={isBn}
        />
      )}
    </div>
  );
}

// ==========================================
// FORMAL PRINTABLE REPORT CARD MODAL
// ==========================================
function ReportCardPrintModal({ result, institution, onClose, isBn }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-100 space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
        {/* Top Control Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="text-blue-600" size={18} />
            <h3 className="font-extrabold text-slate-900 text-sm">
              {isBn ? 'অফিসিয়াল মার্কশিট প্রিভিউ' : 'Official Academic Transcript Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={15} />
              <span>{isBn ? 'প্রিন্ট করুন (Print)' : 'Print'}</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE MARKSHEET BODY */}
        <div className="p-6 sm:p-8 border-2 border-slate-800 rounded-2xl space-y-6 bg-white text-slate-900 print:m-0 print:border-2">
          {/* Institutional Letterhead */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-4">
            <div className="flex items-center justify-center gap-3">
              {institution?.logo && (
                <img
                  src={getPhotoSrc(institution.logo)}
                  alt="Logo"
                  className="w-14 h-14 object-contain"
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {institution?.name || 'Unified Education Management Platform'}
                </h1>
                <p className="text-xs text-slate-600">
                  {institution?.address || 'Dhaka, Bangladesh'}
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-500">
                  EIIN: {institution?.eiin_number || '108246'} • Academic Session: {result.academic_year || '2026'}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-block px-4 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-md">
                ACADEMIC TRANSCRIPT / REPORT CARD
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">{result.rule_title}</p>
            </div>
          </div>

          {/* Student Meta Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p><strong>Student Name:</strong> {result.student_name}</p>
              <p className="mt-1 font-mono"><strong>Student ID:</strong> {result.student_code}</p>
            </div>
            <div>
              <p><strong>Class:</strong> {result.class_name} {result.section_name ? `(${result.section_name})` : ''}</p>
              <p className="mt-1 font-mono"><strong>Roll Number:</strong> {result.roll_number || '—'}</p>
            </div>
          </div>

          {/* Academic Grading Key */}
          <div className="text-[10px] text-slate-500 grid grid-cols-7 text-center border border-slate-200 py-1 bg-slate-50 rounded">
            <span>80-100: <strong>A+ (5.0)</strong></span>
            <span>70-79: <strong>A (4.0)</strong></span>
            <span>60-69: <strong>A- (3.5)</strong></span>
            <span>50-59: <strong>B (3.0)</strong></span>
            <span>40-49: <strong>C (2.0)</strong></span>
            <span>33-39: <strong>D (1.0)</strong></span>
            <span>0-32: <strong>F (0.0)</strong></span>
          </div>

          {/* Subject-wise Marks Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Subject Name</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Full</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Weighted Score</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Letter Grade</th>
                  <th className="py-2.5 px-3 text-center">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(result.subject_results || []).map((sub, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold border-r border-slate-200">
                      {sub.subject_name} {sub.subject_code ? `(${sub.subject_code})` : ''}
                    </td>
                    <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{sub.full_marks}</td>
                    <td className="py-2 px-3 text-center font-mono font-extrabold border-r border-slate-200">
                      {sub.obtained_marks}
                    </td>
                    <td className="py-2 px-3 text-center font-bold border-r border-slate-200">{sub.grade}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold">{sub.grade_point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Result Box */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Marks</p>
              <p className="text-base font-mono font-black mt-0.5">{result.total_marks}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Grade Point Average (GPA)</p>
              <p className="text-base font-mono font-black text-blue-700 mt-0.5">{result.gpa}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Overall Grade</p>
              <p className="text-base font-mono font-black mt-0.5">{result.grade}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Result Status</p>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">{result.status}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs">
            <div className="border-t border-slate-800 pt-1">
              <p className="font-bold">Class Teacher</p>
            </div>
            <div className="border-t border-slate-800 pt-1">
              <p className="font-bold">Convener, Exam Committee</p>
            </div>
            <div className="border-t border-slate-800 pt-1">
              <p className="font-bold">Head of Institution / Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsHubPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading results module...</div>}>
      <ResultsHubContent />
    </Suspense>
  );
}

