'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import {
  UploadCloud, FileText, Download, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, ArrowRight, Copy, Users,
  Search, Filter, Sparkles
} from 'lucide-react';

export default function BulkStudentImportPage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const fileInputRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');

  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState(null);

  // Preview Pagination & Filter States
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewClassFilter, setPreviewClassFilter] = useState('ALL');
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState('ALL'); // '25', '50', '100', 'ALL'

  // Post-Import Results Pagination & Filter States
  const [resultSearch, setResultSearch] = useState('');
  const [resultClassFilter, setResultClassFilter] = useState('ALL');
  const [resultPage, setResultPage] = useState(1);
  const [resultPageSize, setResultPageSize] = useState('ALL');

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/sections')
        ]);
        setClasses(cRes.data.data || []);
        setSections(sRes.data.data || []);
        setTargetClassId('auto');
      } catch (err) {
        toast.error('Failed to load classes or sections');
      }
    };
    loadAcademicData();
  }, []);

  const filteredSections = sections.filter(s => s.class_id === targetClassId);

  // Download Sample CSV
  const downloadSampleCsv = () => {
    const link = document.createElement('a');
    link.setAttribute('href', '/sample_students_import.csv');
    link.setAttribute('download', 'sample_students_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple CSV Parser
  const parseCsvText = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const values = currentLine.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj = {};
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || '';
      });

      if (rowObj.name) {
        rows.push(rowObj);
      }
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = parseCsvText(text);
        if (rows.length === 0) {
          toast.error(isBn ? 'CSV ফাইলে কোন শিক্ষার্থীর তথ্য পাওয়া যায়নি' : 'No student records found in CSV');
        } else {
          setParsedRows(rows);
          setPreviewPage(1);
          toast.success(isBn ? `${rows.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য লোড হয়েছে` : `Loaded all ${rows.length} student records`);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Import
  const handleBulkImport = async () => {
    if (!targetClassId) {
      toast.error(isBn ? 'অনুগ্রহ করে শ্রেণি বা বণ্টন মোড নির্বাচন করুন' : 'Please select target class or auto mode');
      return;
    }
    if (parsedRows.length === 0) {
      toast.error(isBn ? 'কোন শিক্ষার্থী নির্বাচিত নেই' : 'No students to import');
      return;
    }

    try {
      setImporting(true);
      const payload = {
        class_id: targetClassId === 'auto' ? 'auto' : targetClassId,
        section_id: targetClassId === 'auto' ? null : (targetSectionId || null),
        students: parsedRows
      };

      const res = await api.post('/students/bulk-import', payload);
      setImportedResult(res.data.data);
      setResultPage(1);
      toast.success(isBn ? `সফলভাবে ${res.data.data.count} জন শিক্ষার্থীর ভর্তি ও অ্যাকাউন্ট তৈরি হয়েছে!` : `Successfully imported and provisioned ${res.data.data.count} students!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Download Generated Credentials CSV
  const downloadCredentialsCsv = () => {
    if (!importedResult || !importedResult.credentials) return;

    let csv = 'Name,Student_ID,Password,Class,Section,Roll_Number\n';
    importedResult.credentials.forEach(c => {
      csv += `"${c.name}","${c.studentId}","${c.initialPassword}","${c.className}","${c.sectionName || ''}","${c.rollNumber || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_credentials_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isBn ? 'ক্রেডেনশিয়াল CSV ডাউনলোড হয়েছে!' : 'Credentials CSV exported!');
  };

  // Filtered Preview Data
  const filteredPreviewRows = useMemo(() => {
    return parsedRows.filter(row => {
      if (previewClassFilter !== 'ALL') {
        const rowClass = (row.class || row.class_name || '').toLowerCase();
        if (!rowClass.includes(previewClassFilter.toLowerCase())) return false;
      }
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase().trim();
        const matchName = (row.name || '').toLowerCase().includes(q);
        const matchPhone = (row.guardian_phone || '').includes(q);
        const matchGuardian = (row.guardian_name || '').toLowerCase().includes(q);
        const matchRoll = (row.roll_number || '').toString().includes(q);
        const matchAddress = (row.address || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchGuardian && !matchRoll && !matchAddress) return false;
      }
      return true;
    });
  }, [parsedRows, previewClassFilter, previewSearch]);

  const displayedPreviewRows = useMemo(() => {
    if (previewPageSize === 'ALL') return filteredPreviewRows;
    const size = parseInt(previewPageSize, 10);
    const start = (previewPage - 1) * size;
    return filteredPreviewRows.slice(start, start + size);
  }, [filteredPreviewRows, previewPage, previewPageSize]);

  const previewTotalPages = useMemo(() => {
    if (previewPageSize === 'ALL') return 1;
    return Math.ceil(filteredPreviewRows.length / parseInt(previewPageSize, 10)) || 1;
  }, [filteredPreviewRows, previewPageSize]);

  // Unique classes in preview
  const previewClassList = useMemo(() => {
    const set = new Set();
    parsedRows.forEach(r => {
      const c = r.class || r.class_name;
      if (c) set.add(c.trim());
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [parsedRows]);

  // Post-Import Filtered Credentials
  const filteredCredentials = useMemo(() => {
    if (!importedResult?.credentials) return [];
    return importedResult.credentials.filter(c => {
      if (resultClassFilter !== 'ALL') {
        if (!c.className?.toLowerCase().includes(resultClassFilter.toLowerCase())) return false;
      }
      if (resultSearch.trim()) {
        const q = resultSearch.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.studentId?.toLowerCase().includes(q);
        const matchRoll = c.rollNumber?.toString().includes(q);
        if (!matchName && !matchId && !matchRoll) return false;
      }
      return true;
    });
  }, [importedResult, resultClassFilter, resultSearch]);

  const displayedCredentials = useMemo(() => {
    if (resultPageSize === 'ALL') return filteredCredentials;
    const size = parseInt(resultPageSize, 10);
    const start = (resultPage - 1) * size;
    return filteredCredentials.slice(start, start + size);
  }, [filteredCredentials, resultPage, resultPageSize]);

  const resultTotalPages = useMemo(() => {
    if (resultPageSize === 'ALL') return 1;
    return Math.ceil(filteredCredentials.length / parseInt(resultPageSize, 10)) || 1;
  }, [filteredCredentials, resultPageSize]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline mb-2"
        >
          <ChevronLeft size={14} className="mr-1" />
          {isBn ? 'শিক্ষার্থী তালিকায় ফিরুন' : 'Back to Students Directory'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isBn ? 'বাল্ক শিক্ষার্থী ভর্তি (CSV Import)' : 'Bulk Student CSV Import'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isBn
            ? 'এক ক্লিকে ২০০+ শিক্ষার্থীর সম্পূর্ণ তালিকা প্রিভিউ করুন এবং চোখের পলকে স্বয়ংক্রিয় ক্রেডেনশিয়ালসহ ভর্তি সম্পন্ন করুন।'
            : 'Preview complete cohort lists (200+ students) and lightning-fast import with auto-generated credentials.'}
        </p>
      </div>

      {/* RESULT VIEW AFTER IMPORT */}
      {importedResult ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isBn ? 'বাল্ক ভর্তি সফলভাবে সম্পন্ন হয়েছে!' : 'Cohort Admission Successful!'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? `মোট ${importedResult.count} জন শিক্ষার্থীর স্টুডেন্ট আইডি ও পোর্টাল পাসওয়ার্ড সক্রিয় করা হয়েছে।`
                    : `Generated Student IDs and Passwords for all ${importedResult.count} students.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadCredentialsCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Download size={15} />
                {isBn ? 'ক্রেডেনশিয়াল CSV ডাউনলোড' : 'Export Credentials CSV'}
              </button>
              <button
                onClick={() => {
                  setImportedResult(null);
                  setParsedRows([]);
                  setFileName('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                {isBn ? 'নতুন ফাইল ইমপোর্ট' : 'Import Another File'}
              </button>
            </div>
          </div>

          {/* Result Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                value={resultSearch}
                onChange={(e) => {
                  setResultSearch(e.target.value);
                  setResultPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={resultClassFilter}
                onChange={(e) => {
                  setResultClassFilter(e.target.value);
                  setResultPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="ALL">{isBn ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
                {Array.from(new Set(importedResult.credentials.map(c => c.className))).filter(Boolean).map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>{isBn ? 'প্রদর্শন:' : 'Show:'}</span>
                <select
                  value={resultPageSize}
                  onChange={(e) => {
                    setResultPageSize(e.target.value);
                    setResultPage(1);
                  }}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">{isBn ? `সবগুলো (${filteredCredentials.length})` : `All (${filteredCredentials.length})`}</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Credentials Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 z-10">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{isBn ? 'নাম' : 'Name'}</th>
                  <th className="py-3 px-4">{isBn ? 'শ্রেণি ও সেকশন' : 'Class & Section'}</th>
                  <th className="py-3 px-4">{isBn ? 'রোল' : 'Roll'}</th>
                  <th className="py-3 px-4 font-mono">{isBn ? 'স্টুডেন্ট আইডি' : 'Student ID'}</th>
                  <th className="py-3 px-4 font-mono">{isBn ? 'পাসওয়ার্ড' : 'Initial Password'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCredentials.map((stu, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {resultPageSize === 'ALL' ? i + 1 : (resultPage - 1) * parseInt(resultPageSize, 10) + i + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{stu.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{stu.className} ({stu.sectionName || 'N/A'})</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{stu.rollNumber || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{stu.studentId}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold bg-emerald-50/50 px-2 rounded">
                      {stu.initialPassword}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Result Pagination */}
          {resultPageSize !== 'ALL' && resultTotalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-slate-500">
              <span>
                {isBn
                  ? `মোট ${filteredCredentials.length} জনের মধ্যে পৃষ্ঠা ${resultPage} / ${resultTotalPages}`
                  : `Showing page ${resultPage} of ${resultTotalPages} (${filteredCredentials.length} students)`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={resultPage <= 1}
                  onClick={() => setResultPage(p => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-semibold px-2">{resultPage} / {resultTotalPages}</span>
                <button
                  disabled={resultPage >= resultTotalPages}
                  onClick={() => setResultPage(p => Math.min(resultTotalPages, p + 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* IMPORT CONFIG & FILE UPLOAD VIEW */
        <div className="space-y-6">
          {/* Target Class & Section Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isBn ? '১. টার্গেট শ্রেণি ও বণ্টন মোড নির্বাচন করুন' : '1. Target Class & Distribution Mode'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'ভর্তি বণ্টন মোড / শ্রেণি' : 'Admission Mode / Target Class'} *
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value);
                    setTargetSectionId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white font-medium"
                >
                  <option value="auto">
                    {isBn ? '⚡ স্বয়ংক্রিয় ডিস্ট্রিবিউশন (CSV-এর Class কলাম অনুযায়ী বণ্টন)' : '⚡ Auto-Distribute (CSV Class Column)'}
                  </option>
                  <optgroup label={isBn ? 'নির্দিষ্ট একটি শ্রেণিতে সব শিক্ষার্থী' : 'Assign All to Single Specific Class'}>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'টার্গেট সেকশন' : 'Target Section'}
                </label>
                <select
                  value={targetSectionId}
                  disabled={targetClassId === 'auto'}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white ${
                    targetClassId === 'auto' ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {targetClassId === 'auto'
                      ? (isBn ? 'CSV-এর Section কলাম অনুযায়ী স্বয়ংক্রিয়' : 'Auto-resolved from CSV')
                      : (isBn ? '-- সেকশন নির্বাচন করুন --' : '-- Select Section --')}
                  </option>
                  {filteredSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {targetClassId === 'auto' && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <span className="font-bold text-blue-600">💡 {isBn ? 'স্বয়ংক্রিয় বণ্টন:' : 'Auto Distribution:'}</span>
                <span>
                  {isBn
                    ? 'CSV ফাইলে class কলাম (যেমন: "Class 1", "Class 2", "Class 6" ইত্যাদি) থাকলে প্রতিটি শিক্ষার্থী স্বয়ংক্রিয়ভাবে তার নির্দিষ্ট ক্লাসে ভর্তি হবে এবং প্রতিটি ক্লাসের নির্দিষ্ট রোল (০১, ০২...) ও আইডি তৈরি হবে।'
                    : 'With the "class" column in your CSV, students will automatically distribute into their respective classes with sequential IDs and roll numbers generated per class.'}
                </span>
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isBn ? '২. CSV ফাইল আপলোড করুন' : '2. Upload CSV File'}
              </h3>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
              >
                <Download size={14} />
                {isBn ? 'মাল্টি-ক্লাস নমুনা CSV ডাউনলোড' : 'Download Multi-Class Sample CSV'}
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <UploadCloud size={40} className="text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {fileName ? fileName : (isBn ? 'CSV ফাইল সিলেক্ট করতে এখানে ক্লিক করুন' : 'Click to browse or drop CSV file here')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isBn ? 'সাপোর্টেড ফরম্যাট: .csv (UTF-8)' : 'Supported format: .csv (UTF-8 encoded)'}
              </p>
            </div>
          </div>

          {/* PARSED PREVIEW TABLE (SHOW ALL STUDENTS) */}
          {parsedRows.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              {/* Header with Import Button and Fast Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? '৩. শিক্ষার্থীদের সম্পূর্ণ প্রিভিউ' : '3. Complete Students Preview'}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {parsedRows.length} {isBn ? 'জন শিক্ষার্থী' : 'Students'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={importing}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isBn ? 'অতিদ্রুত ইমপোর্ট হচ্ছে...' : 'Fast Importing...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{isBn ? `সকল ${parsedRows.length} শিক্ষার্থীর ভর্তি নিশ্চিত করুন` : `Confirm Import All ${parsedRows.length} Students`}</span>
                    </>
                  )}
                </button>
              </div>

              {/* KPI Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  {isBn ? 'মোট শিক্ষার্থী:' : 'Total:'} <strong className="text-slate-900">{parsedRows.length}</strong>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                  {isBn ? 'শ্রেণি সংখ্যা:' : 'Classes:'} <strong>{previewClassList.length || 'Auto'}</strong>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                  {isBn ? 'ছাত্র:' : 'Male:'} <strong>{parsedRows.filter(r => (r.gender || 'MALE').toUpperCase() === 'MALE').length}</strong>
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                  {isBn ? 'ছাত্রী:' : 'Female:'} <strong>{parsedRows.filter(r => (r.gender || '').toUpperCase() === 'FEMALE').length}</strong>
                </div>
                <div className="ml-auto text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>{isBn ? 'হাই-স্পিড ব্যাচ ইনসার্ট সক্রিয়' : 'Turbo Batch Insert Active'}</span>
                </div>
              </div>

              {/* Preview Search & Page Control Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                {/* Search in Preview */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isBn ? 'নাম, ফোন বা রোল দিয়ে প্রিভিউতে ফিল্টার করুন...' : 'Filter preview by name, roll, phone...'}
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      setPreviewPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Class Filter Dropdown */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  {previewClassList.length > 0 && (
                    <select
                      value={previewClassFilter}
                      onChange={(e) => {
                        setPreviewClassFilter(e.target.value);
                        setPreviewPage(1);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">{isBn ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
                      {previewClassList.map(clsName => (
                        <option key={clsName} value={clsName}>{clsName}</option>
                      ))}
                    </select>
                  )}

                  {/* Show All / Page Size Switcher */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium">{isBn ? 'প্রদর্শন:' : 'View:'}</span>
                    <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPageSize('ALL');
                          setPreviewPage(1);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          previewPageSize === 'ALL'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isBn ? `সব (${filteredPreviewRows.length})` : `All (${filteredPreviewRows.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPageSize('50');
                          setPreviewPage(1);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          previewPageSize === '50'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        50
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPageSize('25');
                          setPreviewPage(1);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          previewPageSize === '25'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        25
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Container - Smooth Scrollable for all 200 */}
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] z-10 shadow-2xs">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">{isBn ? 'শিক্ষার্থীর নাম' : 'Name'}</th>
                      <th className="py-3 px-3">{isBn ? 'শ্রেণি' : 'Class'}</th>
                      <th className="py-3 px-3">{isBn ? 'সেকশন' : 'Section'}</th>
                      <th className="py-3 px-3">{isBn ? 'রোল' : 'Roll'}</th>
                      <th className="py-3 px-3">{isBn ? 'লিঙ্গ' : 'Gender'}</th>
                      <th className="py-3 px-3">{isBn ? 'অভিভাবকের নাম' : 'Guardian Name'}</th>
                      <th className="py-3 px-3">{isBn ? 'অভিভাবকের ফোন' : 'Guardian Phone'}</th>
                      <th className="py-3 px-3">{isBn ? 'ঠিকানা' : 'Address'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-400">
                          {isBn ? 'কোন রেকর্ড পাওয়া যায়নি' : 'No records match your filter'}
                        </td>
                      </tr>
                    ) : (
                      displayedPreviewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">
                            {previewPageSize === 'ALL' ? i + 1 : (previewPage - 1) * parseInt(previewPageSize, 10) + i + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {row.class || row.class_name || (targetClassId !== 'auto' ? classes.find(c => c.id === targetClassId)?.name : 'Auto')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            {row.section || row.section_name || (targetSectionId ? sections.find(s => s.id === targetSectionId)?.name : 'Section A')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {row.roll_number || (isBn ? 'স্বয়ংক্রিয়' : 'Auto')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              (row.gender || '').toUpperCase() === 'FEMALE'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-sky-50 text-sky-700'
                            }`}>
                              {row.gender || 'MALE'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{row.guardian_name || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{row.guardian_phone || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{row.address || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Preview Footer / Pagination info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                <div>
                  {previewPageSize === 'ALL' ? (
                    <span>
                      {isBn
                        ? `সকল ${filteredPreviewRows.length} জন শিক্ষার্থীর প্রিভিউ এক নজরে প্রদর্শিত হচ্ছে।`
                        : `Showing all ${filteredPreviewRows.length} student records in single view.`}
                    </span>
                  ) : (
                    <span>
                      {isBn
                        ? `মোট ${filteredPreviewRows.length} জনের মধ্যে পৃষ্ঠা ${previewPage} / ${previewTotalPages}`
                        : `Showing page ${previewPage} of ${previewTotalPages} (${filteredPreviewRows.length} filtered records)`}
                    </span>
                  )}
                </div>

                {previewPageSize !== 'ALL' && previewTotalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="font-semibold px-2">{previewPage} / {previewTotalPages}</span>
                    <button
                      disabled={previewPage >= previewTotalPages}
                      onClick={() => setPreviewPage(p => Math.min(previewTotalPages, p + 1))}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
