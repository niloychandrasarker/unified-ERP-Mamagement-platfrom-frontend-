'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Settings,
  Plus,
  Save,
  BookOpen,
  DollarSign,
  Copy,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';

export default function FeeStructuresPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [activeTab, setActiveTab] = useState('structures'); // 'structures' | 'heads'
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026');
  const [feeHeads, setFeeHeads] = useState([]);
  const [existingStructures, setExistingStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Class structure items builder state
  const [structureTitle, setStructureTitle] = useState('');
  const [structureItems, setStructureItems] = useState([]);

  // Fee Head Modal
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [newHead, setNewHead] = useState({ name: '', code: '', description: '' });
  const [savingHead, setSavingHead] = useState(false);

  // Clone Modal
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneTargetClassId, setCloneTargetClassId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classRes, headRes, structRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/fees/heads'),
        api.get(`/fees/structures?academic_year=${academicYear}`)
      ]);

      const classList = Array.isArray(classRes.data.data) ? classRes.data.data : (classRes.data.data?.classes || []);
      setClasses(classList);
      setFeeHeads(headRes.data.data || []);
      setExistingStructures(structRes.data.data || []);

      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load initial fee data');
    } finally {
      setLoading(false);
    }
  };

  // When selected class or existing structures change, load the structure items
  useEffect(() => {
    if (!selectedClassId || feeHeads.length === 0) return;

    const currentStruct = existingStructures.find(s => s.class_id === selectedClassId);
    if (currentStruct) {
      setStructureTitle(currentStruct.title || '');
      // Map items
      const mapped = (currentStruct.items || []).map(itm => ({
        fee_head_id: itm.fee_head_id,
        amount: itm.amount || 0,
        frequency: itm.frequency || 'MONTHLY',
        due_day: itm.due_day || 10
      }));
      setStructureItems(mapped);
    } else {
      const targetClass = classes.find(c => c.id === selectedClassId);
      setStructureTitle(`${targetClass?.name || 'Class'} Standard Fees 2026`);
      // Default: Put tuition head by default
      const tuition = feeHeads.find(h => h.code === 'TUITION') || feeHeads[0];
      if (tuition) {
        setStructureItems([
          { fee_head_id: tuition.id, amount: 1500, frequency: 'MONTHLY', due_day: 10 }
        ]);
      } else {
        setStructureItems([]);
      }
    }
  }, [selectedClassId, existingStructures, feeHeads]);

  // Add Item to Structure
  const handleAddItem = (headId) => {
    if (structureItems.some(i => i.fee_head_id === headId)) {
      toast.error('This fee category is already added');
      return;
    }
    setStructureItems(prev => [
      ...prev,
      { fee_head_id: headId, amount: 500, frequency: 'MONTHLY', due_day: 10 }
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setStructureItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update Item Property
  const handleUpdateItem = (index, field, value) => {
    setStructureItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Structure
  const handleSaveStructure = async () => {
    if (!selectedClassId) {
      toast.error(isBn ? 'একটি শ্রেণি নির্বাচন করুন' : 'Please select a class');
      return;
    }
    const validItems = (structureItems || []).filter(i => i.fee_head_id);
    if (validItems.length === 0) {
      toast.error(isBn ? 'কমপক্ষে একটি ফি হেড যুক্ত করুন' : 'Please add at least one fee category item');
      return;
    }

    try {
      setSaving(true);
      const cleanedItems = validItems.map(itm => ({
        fee_head_id: itm.fee_head_id,
        amount: Math.max(0, parseFloat(itm.amount) || 0),
        frequency: itm.frequency || 'MONTHLY',
        due_day: itm.due_day ? parseInt(itm.due_day, 10) : 10
      }));

      await api.post('/fees/structures', {
        class_id: selectedClassId,
        academic_year: academicYear || '2026',
        title: structureTitle?.trim() || 'Standard Class Fee Structure',
        items: cleanedItems
      });

      toast.success(isBn ? 'ক্লাসের ফি স্ট্রাকচার সংরক্ষিত হয়েছে!' : 'Fee structure saved successfully!');
      // Refresh structures
      const res = await api.get(`/fees/structures?academic_year=${academicYear || '2026'}`);
      setExistingStructures(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  // Add New Fee Head
  const handleCreateHead = async (e) => {
    e.preventDefault();
    if (!newHead.name.trim()) {
      toast.error(isBn ? 'ফি হেডের নাম আবশ্যক' : 'Fee category name is required');
      return;
    }

    try {
      setSavingHead(true);
      const generatedCode = newHead.code?.trim() || newHead.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const payload = {
        name: newHead.name.trim(),
        code: generatedCode,
        description: newHead.description?.trim() || null
      };

      const res = await api.post('/fees/heads', payload);
      toast.success(isBn ? 'নতুন ফি হেড যুক্ত হয়েছে!' : 'Fee head created successfully!');
      setFeeHeads(prev => [...prev, res.data.data]);
      setHeadModalOpen(false);
      setNewHead({ name: '', code: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create fee head');
    } finally {
      setSavingHead(false);
    }
  };

  // Clone Structure to another class
  const handleCloneStructure = async () => {
    if (!cloneTargetClassId || cloneTargetClassId === selectedClassId) {
      toast.error('Please select a different target class');
      return;
    }
    const targetClass = classes.find(c => c.id === cloneTargetClassId);

    try {
      setSaving(true);
      await api.post('/fees/structures', {
        class_id: cloneTargetClassId,
        academic_year: academicYear,
        title: `${targetClass?.name || 'Class'} Fee Package ${academicYear}`,
        items: structureItems
      });

      toast.success(isBn ? `${targetClass?.name}-এ সফলভাবে ফি কপি করা হয়েছে!` : `Structure copied to ${targetClass?.name}!`);
      setCloneModalOpen(false);
      const res = await api.get(`/fees/structures?academic_year=${academicYear}`);
      setExistingStructures(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to copy fee structure');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total monthly fee
  const totalMonthlyFee = structureItems
    .filter(i => i.frequency === 'MONTHLY')
    .reduce((sum, itm) => sum + (parseFloat(itm.amount) || 0), 0);

  const totalOtherFee = structureItems
    .filter(i => i.frequency !== 'MONTHLY')
    .reduce((sum, itm) => sum + (parseFloat(itm.amount) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/fees/invoices"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              {isBn ? 'ইনভয়েস ড্যাশবোর্ড' : 'Invoices & Billing'}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Settings className="text-blue-600 w-6 h-6" />
            {isBn ? 'ফি স্ট্রাকচার ও ক্যাটাগরি কনফিগারেশন' : 'Fee Structure & Category Setup'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'শ্রেণিভিত্তিক মাসিক বেতন, ভর্তি ফি ও অন্যান্য ফি নির্ধারণ করুন।'
              : 'Configure class-wise monthly tuition, admission, exam, and lab fee packages.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
          >
            <Plus size={14} className="text-blue-600" />
            {isBn ? '+ নতুন ফি হেড' : '+ New Fee Category'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'structures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} />
          {isBn ? 'শ্রেণিভিত্তিক ফি স্ট্রাকচার' : 'Class Fee Structures'}
        </button>
        <button
          onClick={() => setActiveTab('heads')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'heads'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={16} />
          {isBn ? 'ফি হেড তালিকা' : 'Fee Categories (Heads)'}
        </button>
      </div>

      {/* TAB 1: CLASS FEE STRUCTURES BUILDER */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          {/* Class & Year Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {isBn ? 'শ্রেণি নির্বাচন' : 'Target Class'}
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-28 px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Quick KPI for the selected class */}
            <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 px-4 py-2.5 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase">
                  {isBn ? 'মোট মাসিক ফি' : 'Total Monthly Tuition'}
                </p>
                <p className="text-xl font-black text-blue-900">৳ {totalMonthlyFee.toLocaleString()}</p>
              </div>
              {totalOtherFee > 0 && (
                <div className="pl-3 border-l border-blue-200">
                  <p className="text-[10px] font-bold text-slate-600 uppercase">
                    {isBn ? 'বাৎসরিক/অন্যান্য ফি' : 'Other Fees'}
                  </p>
                  <p className="text-sm font-bold text-slate-800">৳ {totalOtherFee.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fee Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {structureTitle || 'Class Fee Configuration'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? 'এই শ্রেণির শিক্ষার্থীদের জন্য প্রযোজ্য ফি এবং টাকার পরিমাণ নির্ধারণ করুন।'
                    : 'Configure regular tuition and special fee heads for this student cohort.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCloneModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <Copy size={13} />
                  {isBn ? 'অন্য ক্লাসে কপি করুন' : 'Clone to Class'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Fee Category (হেড)</th>
                    <th className="px-5 py-3.5">Amount (টাকার পরিমাণ ৳)</th>
                    <th className="px-5 py-3.5">Frequency (আদায়ের ধরন)</th>
                    <th className="px-5 py-3.5">Monthly Due Day</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {structureItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        {isBn ? 'কোনো ফি হেড যোগ করা হয়নি। নিচে থেকে ফি হেড সিলেক্ট করুন।' : 'No fee items configured. Select categories below to add.'}
                      </td>
                    </tr>
                  ) : (
                    structureItems.map((itm, idx) => {
                      const head = feeHeads.find(h => h.id === itm.fee_head_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            {head?.name || 'Fee Category'}
                            {head?.code && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded font-mono">
                                {head.code}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="relative max-w-xs">
                              <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={itm.amount}
                                onChange={(e) => handleUpdateItem(idx, 'amount', e.target.value)}
                                className="w-32 pl-7 pr-3 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={itm.frequency}
                              onChange={(e) => handleUpdateItem(idx, 'frequency', e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                            >
                              <option value="MONTHLY">Monthly (প্রতি মাসে)</option>
                              <option value="ONE_TIME">One Time (এককালীন)</option>
                              <option value="TERM_WISE">Term-wise (টার্ম ভিত্তিক)</option>
                              <option value="ANNUAL">Annual (বার্ষিক)</option>
                            </select>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-xs">Day</span>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                value={itm.due_day || 10}
                                onChange={(e) => handleUpdateItem(idx, 'due_day', e.target.value)}
                                className="w-14 px-2 py-1 text-xs font-bold text-center bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add More Heads Bar */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase mr-1">
                  {isBn ? '+ ফি ক্যাটাগরি যুক্ত করুন:' : '+ Add Category:'}
                </span>
                {feeHeads
                  .filter(h => !structureItems.some(i => i.fee_head_id === h.id))
                  .map(head => (
                    <button
                      key={head.id}
                      type="button"
                      onClick={() => handleAddItem(head.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
                    >
                      <Plus size={12} />
                      {head.name.split('(')[0]}
                    </button>
                  ))}
              </div>

              <button
                type="button"
                onClick={handleSaveStructure}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'ফি স্ট্রাকচার সেভ করুন' : 'Save Fee Structure')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEE HEADS MANAGER */}
      {activeTab === 'heads' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isBn ? 'প্রাতিষ্ঠানিক ফি হেড সমূহ' : 'Active Institutional Fee Heads'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'বেতন, সেশন চার্জ, ল্যাব বা লাইব্রেরি ফিসহ সকল ধরণের ফি ক্যাটাগরি।'
                  : 'Manage standard categories applied across different class billing packages.'}
              </p>
            </div>
            <button
              onClick={() => setHeadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
            >
              <Plus size={14} />
              {isBn ? 'নতুন হেড যুক্ত করুন' : 'Add Fee Category'}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {feeHeads.map((h) => (
              <div key={h.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    ৳
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{h.name}</h3>
                    <p className="text-xs text-slate-400">{h.description || 'General fee head'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {h.code && (
                    <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-600 rounded font-semibold">
                      {h.code}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD FEE HEAD */}
      {headModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {isBn ? 'নতুন ফি হেড তৈরি করুন' : 'Create New Fee Category'}
            </h3>
            <form onSubmit={handleCreateHead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ফি হেডের নাম *' : 'Fee Head Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Lab Fee / ল্যাব ফি"
                  value={newHead.name}
                  onChange={(e) => setNewHead({ ...newHead, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'শর্ট কোড (ঐচ্ছিক)' : 'Short Code (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAB_FEE"
                  value={newHead.code}
                  onChange={(e) => setNewHead({ ...newHead, code: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'বিবরণ' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. For monthly maintenance of digital labs"
                  value={newHead.description}
                  onChange={(e) => setNewHead({ ...newHead, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHeadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingHead}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  {savingHead ? (isBn ? 'যোগ হচ্ছে...' : 'Saving...') : (isBn ? 'ফি হেড তৈরি করুন' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLONE STRUCTURE TO OTHER CLASS */}
      {cloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Copy className="text-blue-600" size={18} />
              {isBn ? 'ফি স্ট্রাকচার অন্য ক্লাসে কপি করুন' : 'Clone Fee Structure'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'বর্তমান ক্লাসের সকল ফি হেড ও টাকার পরিমাণ অন্য একটি শ্রেণিতে হুবহু কপি করে দেওয়া হবে।'
                : 'Duplicate the current class fee amounts and configuration into another class.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'টার্গেট শ্রেণি নির্বাচন করুন' : 'Select Target Class'}
              </label>
              <select
                value={cloneTargetClassId}
                onChange={(e) => setCloneTargetClassId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
              >
                <option value="">-- Choose Class --</option>
                {classes
                  .filter(c => c.id !== selectedClassId)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCloneModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCloneStructure}
                disabled={saving || !cloneTargetClassId}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isBn ? 'কপি করুন' : 'Apply to Target Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

