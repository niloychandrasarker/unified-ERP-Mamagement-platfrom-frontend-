'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  Printer,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Settings,
  Receipt,
  X
} from 'lucide-react';
import { printFeeInvoice } from '@/lib/printRoutine';

export default function InvoicesPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';
  const isStudent = user?.role === 'STUDENT';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({ total_amount: 0, paid_amount: 0, due_amount: 0 });

  // Filters
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Batch Generation Modal
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    class_id: 'ALL',
    academic_year: '2026',
    month: '2026-03',
    month_label: 'March 2026',
    due_date: '2026-03-25'
  });

  // Single Invoice Voucher Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedClass, selectedMonth, selectedStatus, search, page]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academics/classes');
      setClasses(Array.isArray(res.data.data) ? res.data.data : (res.data.data?.classes || []));
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (selectedClass !== 'ALL') params.append('class_id', selectedClass);
      if (selectedMonth !== 'ALL') params.append('month', selectedMonth);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      // If logged in as student, backend scopes to student automatically
      if (isStudent && user.student?.id) {
        params.append('student_id', user.student.id);
      }

      const res = await api.get(`/fees/invoices?${params.toString()}`);
      setInvoices(res.data.data?.invoices || []);
      setSummary(res.data.data?.summary || { total_amount: 0, paid_amount: 0, due_amount: 0 });
      const total = res.data.data?.total || 0;
      setTotalPages(Math.ceil(total / 15) || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await api.post('/fees/invoices/generate-batch', genForm);
      const data = res.data.data;
      toast.success(
        isBn
          ? `সফলভাবে ${data.generated_count} টি নতুন ইনভয়েস তৈরি হয়েছে! (${data.skipped_count} টি পূর্বেই ছিল)`
          : `Generated ${data.generated_count} invoices! (${data.skipped_count} already existed)`
      );
      setGenModalOpen(false);
      setPage(1);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate batch invoices');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} />
            {isBn ? 'পরিশোধিত' : 'PAID'}
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            {isBn ? 'আংশিক বকেয়া' : 'PARTIAL'}
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} />
            {isBn ? 'বকেয়া' : 'UNPAID'}
          </span>
        );
    }
  };

  const monthOptions = [
    { value: '2026-01', label: 'January 2026' },
    { value: '2026-02', label: 'February 2026' },
    { value: '2026-03', label: 'March 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' },
    { value: '2026-11', label: 'November 2026' },
    { value: '2026-12', label: 'December 2026' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="text-blue-600 w-6 h-6" />
            {isBn ? 'ফি ও ইনভয়েস ম্যানেজমেন্ট' : 'Student Invoices & Billing'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'শিক্ষার্থীদের মাসিক ফি ইনভয়েস তৈরি, হিসাব ও রসিদ ব্যবস্থাপনা।'
              : 'Generate batch monthly tuition bills, track payment statuses, and view vouchers.'}
          </p>
        </div>

        {!isStudent && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/fees/collect"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Wallet size={14} />
              {isBn ? 'টাকা গ্রহণ করুন (Receive Payment)' : 'Receive Payment'}
            </Link>
            <button
              onClick={() => setGenModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Plus size={14} />
              {isBn ? '+ ইনভয়েস তৈরি করুন' : '+ Generate Monthly Invoices'}
            </button>
            <Link
              href="/dashboard/fees/structures"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
              title="Fee Configuration"
            >
              <Settings size={14} className="text-slate-500" />
              {isBn ? 'ফি স্ট্রাকচার' : 'Fee Setup'}
            </Link>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isBn ? 'মোট ইনভয়েসকৃত ফি' : 'Total Billed Amount'}
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ৳ {summary.total_amount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all matching criteria</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            {isBn ? 'মোট সংগৃহীত ফি' : 'Total Collected (Paid)'}
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ৳ {summary.paid_amount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1 font-semibold">
            {summary.total_amount > 0
              ? `${((summary.paid_amount / summary.total_amount) * 100).toFixed(1)}% recovery rate`
              : '0%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
            {isBn ? 'মোট বকেয়া (Due Amount)' : 'Outstanding Dues'}
          </p>
          <p className="text-2xl font-black text-red-600 mt-1">
            ৳ {summary.due_amount.toLocaleString()}
          </p>
          <p className="text-[11px] text-red-500 mt-1 font-semibold">
            {isBn ? 'শিক্ষার্থীদের নিকট মোট পাওনা' : 'Pending student balances'}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Class Filter */}
          {!isStudent && (
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              <option value="ALL">{isBn ? 'সকল শ্রেণি' : 'All Classes'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">{isBn ? 'সকল মাস' : 'All Months'}</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">{isBn ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
            <option value="UNPAID">{isBn ? 'বকেয়া (Unpaid)' : 'Unpaid'}</option>
            <option value="PARTIAL">{isBn ? 'আংশিক (Partial)' : 'Partial'}</option>
            <option value="PAID">{isBn ? 'পরিশোধিত (Paid)' : 'Paid'}</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={isBn ? 'শিক্ষার্থী বা ইনভয়েস খুঁজুন...' : 'Search student or invoice #...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Class & Roll</th>
                <th className="px-4 py-3.5">Billing Month</th>
                <th className="px-4 py-3.5">Total (৳)</th>
                <th className="px-4 py-3.5">Paid (৳)</th>
                <th className="px-4 py-3.5">Due (৳)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    {isBn ? 'ইনভয়েস লোড হচ্ছে...' : 'Loading invoices...'}
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    {isBn ? 'কোনো ইনভয়েস পাওয়া যায়নি।' : 'No invoices found matching selection.'}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {inv.student_photo ? (
                          <img
                            src={inv.student_photo}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {inv.student_name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{inv.student_name}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: {inv.student_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {inv.class_name} {inv.section_name ? `(${inv.section_name})` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">Roll: {inv.roll_number || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {inv.month_label}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ৳ {parseFloat(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">
                      ৳ {parseFloat(inv.paid_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-red-600">
                      ৳ {parseFloat(inv.due_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {!isStudent && inv.status !== 'PAID' && (
                          <Link
                            href={`/dashboard/fees/collect?studentId=${inv.student_code || inv.student_id}`}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg transition-colors"
                          >
                            {isBn ? 'ফি গ্রহণ' : 'Collect'}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>
            {isBn ? `পৃষ্ঠা ${page} এর ${totalPages}` : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: BATCH INVOICE GENERATION */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={18} />
                {isBn ? 'এক ক্লিকে মাসিক ইনভয়েস তৈরি' : 'Batch Generate Invoices'}
              </h3>
              <button
                onClick={() => setGenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {isBn
                ? 'সিলেক্টেড শ্রেণির সকল শিক্ষার্থীর জন্য নির্ধারিত ফি স্ট্রাকচার অনুযায়ী স্বয়ংক্রিয়ভাবে ইনভয়েস তৈরি হবে।'
                : 'Automatically generate monthly bills for all enrolled students based on class fee package.'}
            </p>

            <form onSubmit={handleGenerateInvoices} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'শ্রেণি নির্বাচন' : 'Target Class'}
                </label>
                <select
                  value={genForm.class_id}
                  onChange={(e) => setGenForm({ ...genForm, class_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="ALL">{isBn ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'বিলিং মাস (Billing Month)' : 'Billing Month'}
                </label>
                <select
                  value={genForm.month}
                  onChange={(e) => {
                    const selected = monthOptions.find((m) => m.value === e.target.value);
                    setGenForm({
                      ...genForm,
                      month: e.target.value,
                      month_label: selected?.label || e.target.value
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'টাকা পরিশোধের শেষ তারিখ (Due Date)' : 'Payment Due Date'}
                </label>
                <input
                  type="date"
                  required
                  value={genForm.due_date}
                  onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-800">
                <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p>
                  {isBn
                    ? 'কোনো শিক্ষার্থীর এই মাসের ইনভয়েস ইতোমধ্যে তৈরি হয়ে থাকলে সেটি ডুপ্লিকেট হবে না (নিরাপদ)।'
                    : 'Safe auto-skip: Students who already have a bill for this month will not be duplicated.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGenModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {generating
                    ? (isBn ? 'তৈরি হচ্ছে...' : 'Generating...')
                    : (isBn ? 'ইনভয়েস জেনারেট করুন' : 'Generate Invoices')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE INVOICE VOUCHER VIEW */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="printable-invoice" className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Student Fee Invoice
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedInvoice.invoice_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Billing Period: {selectedInvoice.month_label}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            {/* Student Meta */}
            <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.student_name}</p>
                <p className="text-slate-500 font-mono">ID: {selectedInvoice.student_code}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">
                  {selectedInvoice.class_name} {selectedInvoice.section_name ? `(${selectedInvoice.section_name})` : ''}
                </p>
                <p className="text-slate-500">Roll: {selectedInvoice.roll_number || '—'}</p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Breakdown</p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                {(selectedInvoice.items || []).map((itm, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{itm.name || 'Tuition Fee'}</span>
                    <span className="font-bold text-slate-900">৳ {parseFloat(itm.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total / Paid / Due Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Invoiced:</span>
                <span className="font-bold text-white">৳ {parseFloat(selectedInvoice.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Paid Amount:</span>
                <span className="font-bold">৳ {parseFloat(selectedInvoice.paid_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-400 pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold">Net Remaining Due:</span>
                <span className="font-black text-base">৳ {parseFloat(selectedInvoice.due_amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>{getStatusBadge(selectedInvoice.status)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!selectedInvoice) return;
                    printFeeInvoice({
                      invoice: selectedInvoice,
                      institution: user?.institution,
                      isBn
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                >
                  <Printer size={14} />
                  {isBn ? 'ইনভয়েস প্রিন্ট' : 'Print Invoice'}
                </button>
                {!isStudent && selectedInvoice.status !== 'PAID' && (
                  <Link
                    href={`/dashboard/fees/collect?studentId=${selectedInvoice.student_code || selectedInvoice.student_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                  >
                    <Wallet size={14} />
                    {isBn ? 'ফি গ্রহণ করুন' : 'Collect Fee'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

