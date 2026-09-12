'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Search,
  Filter,
  Users,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Printer,
  Copy,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
  GraduationCap,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DuesLedgerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState({
    students_with_dues: 0,
    total_outstanding: 0,
    total_billed: 0,
    total_collected: 0
  });

  // Filters
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [search, setSearch] = useState('');
  const [minDue, setMinDue] = useState('1');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // SMS Modal State
  const [smsModalStudent, setSmsModalStudent] = useState(null);
  const [smsText, setSmsText] = useState('');

  // Single Student Notice Modal State
  const [noticeStudent, setNoticeStudent] = useState(null);

  // Fetch Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        const data = res.data?.data || res.data || [];
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch Ledger Data
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        min_due: minDue || 1
      };
      if (selectedClass !== 'ALL') params.class_id = selectedClass;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/fees/dues-ledger', { params });
      const data = res.data?.data || {};

      setLedger(data.ledger || []);
      setTotalCount(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 15) || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dues ledger:', err);
      toast.error(isBn ? 'বকেয়া তালিকা লোড করতে ব্যর্থ হয়েছে' : 'Failed to load dues ledger');
    } finally {
      setLoading(false);
    }
  }, [page, selectedClass, search, minDue, isBn]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const handleOpenSmsModal = (student) => {
    setSmsModalStudent(student);
    const instName = user?.institution?.name || 'স্কুল প্রশাসন';
    const text = isBn
      ? `শ্রদ্ধেয় অভিভাবক, ${student.student_name} (শ্রেণি: ${student.class_name || 'N/A'}, রোল: ${student.roll_number || 'N/A'})-এর ${student.overdue_months_list || 'বিগত'} মাসের মোট বকেয়া ৳${Number(student.total_due).toLocaleString()}। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ - ${instName}`
      : `Dear Guardian, ${student.student_name} (Class: ${student.class_name || 'N/A'}, Roll: ${student.roll_number || 'N/A'}) has total outstanding dues of BDT ${Number(student.total_due).toLocaleString()} for (${student.overdue_months_list || 'previous months'}). Please clear the dues soon. - ${instName}`;
    setSmsText(text);
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(smsText);
    toast.success(isBn ? 'এসএমএস টেক্সট কপি করা হয়েছে!' : 'SMS notice copied to clipboard!');
  };

  const handlePrintWindow = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>{isBn ? 'বকেয়া খতিয়ান ও ওভারডিউ রিপোর্ট' : 'Dues Ledger & Overdue Tracking'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'শিক্ষার্থীভিত্তিক বকেয়া হিসাব' : 'Student Overdue Receivables'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn
              ? 'একাধিক মাসের অপরিশোধিত ফি পর্যবেক্ষণ করুন, রিমাইন্ডার পাঠান এবং সরাসরি পেমেন্ট গ্রহণ করুন।'
              : 'Track multi-month unpaid tuition fees, send SMS notices, and directly collect dues.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintWindow}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{isBn ? 'তালিকা প্রিন্ট' : 'Print Ledger'}</span>
          </button>
          <Link
            href="/dashboard/fees/collect"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm"
          >
            <Wallet className="w-4 h-4" />
            <span>{isBn ? 'পেমেন্ট গ্রহণ করুন' : 'Collect Payment'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Card 1: Total Outstanding Due */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {isBn ? 'মোট বকেয়া পরিমাণ' : 'Total Outstanding'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            ৳ {Number(stats.total_outstanding || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
            <span>{isBn ? 'অবিলম্বে আদায়যোগ্য' : 'Immediate receivables'}</span>
          </div>
        </div>

        {/* Card 2: Defaulter Students */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {isBn ? 'বকেয়া থাকা শিক্ষার্থী' : 'Students with Dues'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {stats.students_with_dues || 0}{' '}
            <span className="text-xs font-normal text-slate-500">{isBn ? 'জন' : 'Students'}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span>{isBn ? 'ফি অপরিশোধিত রয়েছে' : 'Unpaid invoices pending'}</span>
          </div>
        </div>

        {/* Card 3: Total Collected in Ledger Scope */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {isBn ? 'আদায়কৃত ফি' : 'Total Collected'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            ৳ {Number(stats.total_collected || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>{isBn ? 'আংশিক ও বিগত কালেকশন' : 'Collected so far'}</span>
          </div>
        </div>

        {/* Card 4: Total Billed in Scope */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {isBn ? 'মোট ইনভয়েসকৃত' : 'Total Invoiced'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            ৳ {Number(stats.total_billed || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <span>{isBn ? 'মোট বরাদ্দকৃত ডিমান্ড' : 'Total generated bill'}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 print:hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'শিক্ষার্থীর নাম, আইডি বা রোল দিয়ে খুঁজুন...' : 'Search student by name, ID or roll...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Class Select */}
          <div className="w-full sm:w-48">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">{isBn ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Due Select */}
          <div className="w-full sm:w-44">
            <select
              value={minDue}
              onChange={(e) => {
                setMinDue(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="1">{isBn ? 'বকেয়া >= ১ টাকা' : 'Due >= ৳1'}</option>
              <option value="500">{isBn ? 'বকেয়া >= ৫০০ টাকা' : 'Due >= ৳500'}</option>
              <option value="1000">{isBn ? 'বকেয়া >= ১,০০০ টাকা' : 'Due >= ৳1,000'}</option>
              <option value="2000">{isBn ? 'বকেয়া >= ২,০০০ টাকা' : 'Due >= ৳2,000'}</option>
              <option value="5000">{isBn ? 'বকেয়া >= ৫,০০০ টাকা' : 'Due >= ৳5,000'}</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-all"
          >
            {isBn ? 'ফিল্টার করুন' : 'Filter'}
          </button>
        </form>
      </div>

      {/* Printable Report Header (Visible ONLY during print) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{user?.institution?.name || 'UEMP Institution'}</h1>
        <p className="text-xs text-slate-600">{user?.institution?.address || ''}</p>
        <h2 className="text-lg font-bold text-slate-800 mt-2 uppercase tracking-wide">
          Student Overdue Fees Ledger & Notice
        </h2>
        <div className="flex justify-between text-xs text-slate-500 mt-2 px-4">
          <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
          <span>Filter: {selectedClass === 'ALL' ? 'All Classes' : 'Specific Class'}</span>
          <span>Total Overdue: BDT {Number(stats.total_outstanding || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* 4. Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">{isBn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="py-3.5 px-4">{isBn ? 'শ্রেণি ও রোল' : 'Class & Roll'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অভিভাবকের যোগাযোগ' : 'Guardian Contact'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অপরিশোধিত মাসসমূহ' : 'Overdue Months'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'মোট বিল' : 'Invoiced'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'পরিশোধিত' : 'Paid'}</th>
                <th className="py-3.5 px-4 text-right text-rose-600">{isBn ? 'বকেয়া পরিমাণ' : 'Due Balance'}</th>
                <th className="py-3.5 px-4 text-center print:hidden">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading dues ledger...'}</span>
                    </div>
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-medium text-slate-700">
                        {isBn ? 'কোনো বকেয়া রেকর্ড পাওয়া যায়নি!' : 'No overdue records found!'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isBn ? 'সকল শিক্ষার্থীর ফি পরিশোধিত রয়েছে অথবা ফিল্টারে কিছু মেলেনি।' : 'All fees are cleared or match your filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ledger.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-blue-200">
                          {row.photo_url ? (
                            <img src={row.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            row.student_name?.[0]?.toUpperCase() || 'S'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{row.student_name}</p>
                          <p className="text-xs font-mono text-slate-500">ID: {row.student_code || row.student_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Class & Roll */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{row.class_name || '—'}</p>
                      <p className="text-xs text-slate-500">
                        {row.section_name ? `Sec: ${row.section_name} • ` : ''}Roll: {row.roll_number || '—'}
                      </p>
                    </td>

                    {/* Guardian Contact */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-700">{row.guardian_name || '—'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {row.guardian_phone || 'N/A'}
                      </p>
                    </td>

                    {/* Overdue Months */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            {row.unpaid_months_count} {isBn ? 'টি মাস বকেয়া' : 'Months Overdue'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2" title={row.overdue_months_list}>
                          {row.overdue_months_list}
                        </p>
                      </div>
                    </td>

                    {/* Total Invoiced */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 font-mono">
                      ৳{Number(row.total_invoiced || 0).toLocaleString()}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 font-mono">
                      ৳{Number(row.total_paid || 0).toLocaleString()}
                    </td>

                    {/* Total Due */}
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono text-base">
                      ৳{Number(row.total_due || 0).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Collect Payment Button */}
                        <Link
                          href={`/dashboard/fees/collect?studentId=${row.student_code || row.student_id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-all shadow-sm"
                          title={isBn ? 'বকেয়া ফি গ্রহণ করুন' : 'Collect Dues'}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isBn ? 'আদায়' : 'Collect'}</span>
                        </Link>

                        {/* SMS Reminder */}
                        <button
                          onClick={() => handleOpenSmsModal(row)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                          title={isBn ? 'এসএমএস রিমাইন্ডার' : 'SMS Reminder'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Individual Notice */}
                        <button
                          onClick={() => setNoticeStudent(row)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title={isBn ? 'নোটিশ দেখুন / প্রিন্ট' : 'View / Print Notice'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 print:hidden">
            <p className="text-xs text-slate-500">
              {isBn
                ? `মোট ${totalCount} জন শিক্ষার্থীর মধ্যে ${page} নং পৃষ্ঠা প্রদর্শিত`
                : `Showing page ${page} of ${totalPages} (${totalCount} total students)`}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. SMS Reminder Modal */}
      {smsModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center gap-2.5 text-amber-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">
                  {isBn ? 'বকেয়া ফি রিমাইন্ডার মেসেজ' : 'Guardian Overdue SMS Notice'}
                </h3>
              </div>
              <button
                onClick={() => setSmsModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <p className="font-semibold text-slate-800">
                  {isBn ? 'প্রাপক:' : 'Recipient:'} {smsModalStudent.guardian_name} ({smsModalStudent.guardian_phone || 'No Phone'})
                </p>
                <p className="text-slate-500">
                  {isBn ? 'শিক্ষার্থী:' : 'Student:'} {smsModalStudent.student_name} • {isBn ? 'শ্রেণি:' : 'Class:'} {smsModalStudent.class_name} • {isBn ? 'মোট বকেয়া:' : 'Due:'} ৳{Number(smsModalStudent.total_due).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {isBn ? 'এসএমএস ড্রাফট (সম্পাদনাযোগ্য)' : 'SMS Draft (Editable)'}
                </label>
                <textarea
                  rows={5}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed font-sans"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {isBn ? 'মোট অক্ষর:' : 'Characters:'} {smsText.length}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSmsModalStudent(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-50"
                >
                  {isBn ? 'বাতিল' : 'Close'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySms}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm shadow-sm transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isBn ? 'কপি করুন' : 'Copy SMS'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Individual Student Dues Notice Voucher Modal */}
      {noticeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <h3 className="font-bold text-slate-800 text-sm">
                {isBn ? 'বকেয়া ফি নোটিশ স্লিপ' : 'Individual Dues Notice Slip'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isBn ? 'প্রিন্ট স্লিপ' : 'Print Slip'}</span>
                </button>
                <button
                  onClick={() => setNoticeStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Notice Paper */}
            <div className="p-6 bg-white space-y-4">
              <div className="text-center border-b pb-3">
                <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                  {user?.institution?.name || 'Institution Name'}
                </h2>
                <p className="text-xs text-slate-500">{user?.institution?.address || ''}</p>
                <div className="inline-block mt-2 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 uppercase tracking-wider">
                  {isBn ? 'বকেয়া ফি পরিশোধের তাগিদপত্র' : 'Fee Overdue Notice'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">{isBn ? 'শিক্ষার্থী:' : 'Student:'}</span>
                  <p className="font-bold text-slate-800">{noticeStudent.student_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">{isBn ? 'আইডি:' : 'ID:'}</span>
                  <p className="font-mono font-semibold text-slate-800">{noticeStudent.student_code || noticeStudent.student_id}</p>
                </div>
                <div>
                  <span className="text-slate-400">{isBn ? 'শ্রেণি ও রোল:' : 'Class & Roll:'}</span>
                  <p className="font-semibold text-slate-800">{noticeStudent.class_name} • Roll: {noticeStudent.roll_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">{isBn ? 'অভিভাবক:' : 'Guardian:'}</span>
                  <p className="font-semibold text-slate-800">{noticeStudent.guardian_name || 'N/A'}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between font-medium text-slate-600 border-b pb-1.5">
                  <span>{isBn ? 'অপরিশোধিত মাস' : 'Overdue Months'}</span>
                  <span>{noticeStudent.overdue_months_list}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>{isBn ? 'মোট ইনভয়েস বিল' : 'Total Invoiced'}</span>
                  <span>৳{Number(noticeStudent.total_invoiced || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-emerald-600">
                  <span>{isBn ? 'পরিশোধিত' : 'Paid Amount'}</span>
                  <span>৳{Number(noticeStudent.total_paid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-rose-600 pt-1.5 border-t">
                  <span>{isBn ? 'মোট বকেয়া পরিমাণ' : 'Total Outstanding Due'}</span>
                  <span>৳{Number(noticeStudent.total_due || 0).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic text-center">
                {isBn
                  ? 'দ্রুততম সময়ের মধ্যে স্কুলের একাউন্টস শাখায় অথবা অনলাইন পোর্টালের মাধ্যমে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।'
                  : 'Please settle all outstanding dues at the institution accounts office or via the online portal as soon as possible.'}
              </p>

              <div className="pt-6 flex justify-between text-xs text-slate-400 border-t">
                <div className="text-center">
                  <div className="w-24 border-b border-slate-300 mb-1"></div>
                  <span>{isBn ? 'একাউন্টস ইনচার্জ' : 'Accounts Incharge'}</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-300 mb-1"></div>
                  <span>{isBn ? 'অধ্যক্ষ / প্রধান শিক্ষক' : 'Principal / Headmaster'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

