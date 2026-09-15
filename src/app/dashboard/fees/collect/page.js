'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Wallet,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Printer,
  X,
  CreditCard,
  Building2,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Receipt
} from 'lucide-react';
import { printMoneyReceipt } from '@/lib/printRoutine';

export default function CollectFeesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState({}); // { [invId]: amount }
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success Receipt Modal
  const [receiptData, setReceiptData] = useState(null);

  // Read URL query parameter for prefilling student
  useEffect(() => {
    const studentIdParam = searchParams.get('studentId');
    if (studentIdParam) {
      setSearchQuery(studentIdParam);
      handleSearchStudent(studentIdParam);
    }
  }, [searchParams]);

  const handleSearchStudent = async (identifier = searchQuery) => {
    if (!identifier || !identifier.trim()) {
      toast.error(isBn ? 'স্টুডেন্ট আইডি বা রোল লিখুন' : 'Enter Student ID or Roll');
      return;
    }

    try {
      setSearching(true);
      const res = await api.get(`/fees/students/${identifier.trim()}/pending-dues`);
      const data = res.data.data;
      setStudentData(data);

      // By default: Pre-select ALL pending invoices for instant multi-month checkout!
      const initialSelections = {};
      (data.pending_invoices || []).forEach(inv => {
        initialSelections[inv.id] = parseFloat(inv.due_amount);
      });
      setSelectedInvoices(initialSelections);

      if (data.pending_invoices.length === 0) {
        toast.success(isBn ? 'এই শিক্ষার্থীর কোনো বকেয়া নেই!' : 'Student has no pending dues! (All Clear)');
      } else {
        toast.success(
          isBn
            ? `${data.pending_invoices.length} টি মাসের বকেয়া ইনভয়েস পাওয়া গেছে।`
            : `Found ${data.pending_invoices.length} pending monthly invoices.`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Student not found or error occurred');
      setStudentData(null);
      setSelectedInvoices({});
    } finally {
      setSearching(false);
    }
  };

  // Toggle invoice checkbox
  const handleToggleInvoice = (inv) => {
    setSelectedInvoices(prev => {
      const updated = { ...prev };
      if (updated[inv.id] !== undefined) {
        delete updated[inv.id];
      } else {
        updated[inv.id] = parseFloat(inv.due_amount);
      }
      return updated;
    });
  };

  // Select / Deselect All
  const handleToggleAll = () => {
    if (!studentData?.pending_invoices) return;
    const allSelected = Object.keys(selectedInvoices).length === studentData.pending_invoices.length;

    if (allSelected) {
      setSelectedInvoices({});
    } else {
      const newSelect = {};
      studentData.pending_invoices.forEach(inv => {
        newSelect[inv.id] = parseFloat(inv.due_amount);
      });
      setSelectedInvoices(newSelect);
    }
  };

  // Update specific invoice allocation amount
  const handleAmountChange = (invId, maxDue, val) => {
    const num = Math.max(0, Math.min(parseFloat(maxDue) || 0, parseFloat(val) || 0));
    setSelectedInvoices(prev => ({ ...prev, [invId]: num }));
  };

  // Sum total payable
  const totalPayable = Object.values(selectedInvoices).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const selectedCount = Object.keys(selectedInvoices).length;

  // Submit Multi-Month Payment
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!studentData?.student?.id) return;
    if (selectedCount === 0 || totalPayable <= 0) {
      toast.error(isBn ? 'কমপক্ষে একটি মাসের ইনভয়েস সিলেক্ট করুন' : 'Select at least one invoice to pay');
      return;
    }

    const allocations = Object.entries(selectedInvoices)
      .filter(([_, amt]) => parseFloat(amt) > 0)
      .map(([invId, amt]) => ({
        invoice_id: invId,
        amount: parseFloat(amt)
      }));

    try {
      setSubmitting(true);
      const res = await api.post('/fees/collect', {
        student_id: studentData.student.id,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || null,
        notes: notes.trim() || null,
        allocations
      });

      toast.success(isBn ? 'পেমেন্ট সফলভাবে গৃহীত হয়েছে এবং মানি রিসিট প্রস্তুত!' : 'Payment recorded & receipt generated!');
      setReceiptData(res.data.data);

      // Refresh student's dues
      handleSearchStudent(studentData.student.id);
      setTransactionId('');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment collection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Wallet className="text-emerald-600 w-7 h-7" />
            {isBn ? 'ফি ও বকেয়া কালেকশন (Receive Payment)' : 'Fee Collection & Dues Clearance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'শিক্ষার্থীর ২-৩ মাসের বা যেকোনো বকেয়া ফি একসাথে ক্যাশ, বিকাশ বা নগদে গ্রহণ করুন।'
              : 'Collect tuition fees for single or multiple pending months in a single unified transaction.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/fees/dues"
            className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
          >
            {isBn ? 'বকেয়া খাতা (Dues Ledger)' : 'View Dues Ledger'}
          </Link>
          <Link
            href="/dashboard/fees/invoices"
            className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
          >
            {isBn ? 'সকল ইনভয়েস' : 'All Invoices'}
          </Link>
        </div>
      </div>

      {/* 1. STUDENT SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchStudent();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                isBn
                  ? 'শিক্ষার্থীর আইডি (যেমন: 261102), রোল নম্বর বা নাম লিখুন...'
                  : 'Enter Student ID (e.g. 261102), Roll, or Name...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Search size={15} />
            {searching ? (isBn ? 'খোঁজা হচ্ছে...' : 'Searching...') : (isBn ? 'শিক্ষার্থী খুঁজুন' : 'Find Student')}
          </button>
        </form>
      </div>

      {/* 2. STUDENT FOUND & DUES BREAKDOWN */}
      {studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: STUDENT INFO & MULTI-MONTH SELECTOR (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Student Profile Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {studentData.student?.photo_url ? (
                  <img
                    src={studentData.student.photo_url}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                    {studentData.student?.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{studentData.student?.name}</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {studentData.student?.class_name} {studentData.student?.section_name ? `• ${studentData.student.section_name}` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Student ID: <span className="font-bold text-slate-800">{studentData.student?.student_code}</span> | Roll: {studentData.student?.roll_number || '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Phone size={11} /> {studentData.student?.guardian_phone || 'No phone recorded'} ({studentData.student?.guardian_name || 'Guardian'})
                  </p>
                </div>
              </div>

              {/* Total Dues KPI Badge */}
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl text-right shrink-0">
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                  {isBn ? 'মোট বকেয়া (Total Due)' : 'Total Outstanding'}
                </p>
                <p className="text-2xl font-black text-red-600">
                  ৳ {studentData.total_outstanding_due.toLocaleString()}
                </p>
                <p className="text-[10px] text-red-700 font-semibold mt-0.5">
                  {studentData.unpaid_months_count} {isBn ? 'মাসের ফি বাকি' : 'Months Unpaid'}
                </p>
              </div>
            </div>

            {/* MULTI-MONTH UNPAID INVOICES ROSTER */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-600" />
                    {isBn ? 'বকেয়া মাস ও ইনভয়েস নির্বাচন করুন' : 'Select Months to Pay'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn
                      ? 'একাধিক মাস একসাথে সিলেক্ট করে একক রসিদে ফি গ্রহণ করা যাবে।'
                      : 'Check multiple months to bundle into a single transaction & voucher.'}
                  </p>
                </div>

                {studentData.pending_invoices.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg shadow-2xs transition-all"
                  >
                    {selectedCount === studentData.pending_invoices.length
                      ? (isBn ? 'সব আনচেক করুন' : 'Deselect All')
                      : (isBn ? 'সব মাস সিলেক্ট করুন' : 'Select All Dues')}
                  </button>
                )}
              </div>

              {studentData.pending_invoices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800 text-base">
                    {isBn ? 'এই শিক্ষার্থীর কোনো বকেয়া নেই!' : 'No Pending Dues!'}
                  </p>
                  <p className="text-xs max-w-md mx-auto">
                    {isBn
                      ? 'শিক্ষার্থীর সকল মাসিক ফি পরিশোধিত আছে অথবা চলতি মাসের জন্য এখনো ইনভয়েস তৈরি করা হয়নি।'
                      : 'All issued invoices have been settled, or invoices for the target month have not been generated yet.'}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/fees/invoices"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all border border-blue-200"
                    >
                      <Sparkles size={14} />
                      {isBn ? 'নতুন মাসের ইনভয়েস জেনারেট করুন' : 'Generate Monthly Invoices'}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {studentData.pending_invoices.map((inv) => {
                    const isChecked = selectedInvoices[inv.id] !== undefined;
                    return (
                      <div
                        key={inv.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isChecked ? 'bg-emerald-50/30' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Checkbox + Month details */}
                        <div className="flex items-center gap-3.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleInvoice(inv)}
                            className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{inv.month_label}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {inv.invoice_number}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Due Date: {inv.due_date ? inv.due_date.slice(0, 10) : '—'} | Total: ৳{parseFloat(inv.total_amount).toLocaleString()}
                              {parseFloat(inv.paid_amount) > 0 && ` (Already paid ৳${parseFloat(inv.paid_amount).toLocaleString()})`}
                            </p>
                          </div>
                        </div>

                        {/* Amount to pay for this invoice */}
                        <div className="flex items-center gap-2 sm:self-end">
                          <span className="text-xs font-bold text-slate-500">
                            {isBn ? 'প্রদেয়:' : 'Paying:'}
                          </span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">৳</span>
                            <input
                              type="number"
                              disabled={!isChecked}
                              value={selectedInvoices[inv.id] ?? inv.due_amount}
                              onChange={(e) => handleAmountChange(inv.id, inv.due_amount, e.target.value)}
                              className="w-28 pl-6 pr-2 py-1 text-sm font-bold bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:opacity-50 text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PAYMENT CHECKOUT PANEL (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
                  Payment Summary
                </p>
                <h3 className="text-base font-black text-slate-900">
                  {isBn ? 'কালেকশন ও রসিদ বিবরণ' : 'Checkout & Receipt'}
                </h3>
              </div>

              {/* Dynamic Calculation Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Selected Invoices:</span>
                  <span className="font-bold text-white">{selectedCount} Month(s)</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-emerald-400 uppercase">
                    {isBn ? 'মোট গ্রহণকৃত টাকা:' : 'Total Payable:'}
                  </span>
                  <span className="text-2xl font-black text-white">
                    ৳ {totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? 'পেমেন্ট মেথড (Payment Method) *' : 'Payment Method *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'CASH', name: isBn ? '💵 নগদ ক্যাশ (কাউন্টার)' : '💵 Cash (School Counter)', color: 'border-emerald-400 text-emerald-800 bg-emerald-50 font-bold' },
                      { id: 'BKASH', name: 'bKash (বিকাশ)', color: 'border-pink-300 text-pink-700 bg-pink-50' },
                      { id: 'NAGAD', name: 'Nagad (নগদ)', color: 'border-orange-300 text-orange-700 bg-orange-50' },
                      { id: 'BANK_TRANSFER', name: isBn ? 'Bank (ব্যাংক)' : 'Bank Transfer', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                      { id: 'ROCKET', name: 'Rocket (রকেট)', color: 'border-purple-300 text-purple-700 bg-purple-50' },
                      { id: 'UPAY', name: 'Upay (উপায়)', color: 'border-amber-300 text-amber-700 bg-amber-50' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          paymentMethod === m.id
                            ? `${m.color} ring-2 ring-emerald-500 shadow-2xs`
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash vs Digital helper & Transaction ID */}
                {paymentMethod === 'CASH' ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{isBn ? 'সরাসরি নগদ (Cash) কালেকশন' : 'Direct Cash Collection'}</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        {isBn
                          ? 'কাউন্টার ক্যাশিয়ার হিসেবে নগদ টাকা গ্রহণ করে সাবমিট করুন। ট্রানজেকশন আইডির প্রয়োজন নেই, তাৎক্ষণিক ক্যাশ রসিদ তৈরি হবে।'
                          : 'Receiving physical cash at the school accounts counter. No TrxID required; money receipt will be generated instantly.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'ট্রানজেকশন / স্লিপ আইডি (ঐচ্ছিক)' : 'Transaction ID / Slip #'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TRX98234729 or Bank Deposit Ref"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নোট / মন্তব্য (Remarks)' : 'Notes / Remarks'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in full for 2 terms"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || selectedCount === 0 || totalPayable <= 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={18} />
                  {submitting
                    ? (isBn ? 'প্রসেসিং হচ্ছে...' : 'Processing Payment...')
                    : (isBn ? 'টাকা গ্রহণ করুন ও রসিদ তৈরি করুন' : 'Confirm & Generate Receipt')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRINTABLE MONEY RECEIPT MODAL (VOUCHER) */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            {/* Modal Actions (Top) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 size={14} />
                Payment Confirmed
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!receiptData) return;
                    printMoneyReceipt({
                      receipt: receiptData.receipt,
                      allocatedInvoices: receiptData.allocated_invoices,
                      totalRemainingDue: receiptData.total_remaining_due,
                      isBn
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Printer size={14} />
                  {isBn ? 'রসিদ প্রিন্ট করুন' : 'Print Voucher'}
                </button>
                <button
                  onClick={() => setReceiptData(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-money-receipt" className="border-2 border-slate-900/80 p-6 rounded-2xl space-y-5 bg-white text-slate-900">
              {/* Institution Header */}
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {receiptData.receipt?.institution_name || 'Ideal School & College'}
                </h2>
                <p className="text-xs text-slate-600">
                  {receiptData.receipt?.institution_address || 'Campus Location, Dhaka'}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Phone: {receiptData.receipt?.institution_phone || '01700000000'} | Email: {receiptData.receipt?.institution_email || 'info@school.edu.bd'}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-md">
                    MONEY RECEIPT / ফি আদায়ের রসিদ
                  </span>
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500 font-semibold">
                    Receipt No: <span className="font-mono font-bold text-slate-900">{receiptData.receipt?.receipt_number}</span>
                  </p>
                  <p className="text-slate-500 font-semibold">
                    Date: <span className="font-bold text-slate-900">{new Date(receiptData.receipt?.payment_date).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-semibold">
                    Method: <span className="font-bold text-emerald-700">
                      {receiptData.receipt?.payment_method === 'CASH' ? 'CASH (নগদ ক্যাশ)' : receiptData.receipt?.payment_method}
                    </span>
                  </p>
                  {receiptData.receipt?.payment_method === 'CASH' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                      ✓ Paid In Cash at Counter
                    </span>
                  )}
                  {receiptData.receipt?.transaction_id && (
                    <p className="text-slate-500 font-semibold">
                      TrxID: <span className="font-mono font-bold text-slate-900">{receiptData.receipt?.transaction_id}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="bg-slate-50 p-3.5 rounded-xl grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-500">Student Name: </span>
                  <span className="font-bold text-slate-900">{receiptData.receipt?.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Student ID: </span>
                  <span className="font-mono font-bold text-slate-900">{receiptData.receipt?.student_code}</span>
                </div>
                <div>
                  <span className="text-slate-500">Class & Sec: </span>
                  <span className="font-bold text-slate-900">
                    {receiptData.receipt?.class_name} {receiptData.receipt?.section_name ? `(${receiptData.receipt?.section_name})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Roll Number: </span>
                  <span className="font-bold text-slate-900">{receiptData.receipt?.roll_number || '—'}</span>
                </div>
              </div>

              {/* Itemized Paid Months Table */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Fees Cleared & Allocated</p>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2">Month & Year</th>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2 text-right">Allocated Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(receiptData.allocated_invoices || []).map((a, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold text-slate-900">{a.month_label}</td>
                        <td className="p-2 font-mono text-slate-500">{a.invoice_number}</td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          ৳ {parseFloat(a.allocated_amount).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            {a.invoice_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <div>
                  <p className="text-xs text-slate-500 font-normal">Remaining Total Dues:</p>
                  <p className="text-red-600 font-mono font-bold">৳ {receiptData.total_remaining_due.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-normal">Total Paid Today:</p>
                  <p className="text-xl font-black text-slate-900">৳ {parseFloat(receiptData.receipt?.amount_paid).toLocaleString()}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-xs text-slate-600">
                <div className="text-center">
                  <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                    Student / Guardian
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                    Authorized Cashier / Seal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

