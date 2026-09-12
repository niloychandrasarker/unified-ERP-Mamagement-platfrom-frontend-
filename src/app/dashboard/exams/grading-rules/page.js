'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import toast from 'react-hot-toast';
import {
  Sliders,
  Award,
  Plus,
  Trash2,
  Edit,
  Play,
  Calculator,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function GradingRulesPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState(null);
  const [rules, setRules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    class_id: '',
    academic_year: '2026',
    term: 'Term 1',
    title: '',
    weights: [] // Array of { exam_id, weight_percentage }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, classRes, examsRes] = await Promise.all([
        api.get('/exams/grading-rules/list'),
        api.get('/academics/classes'),
        api.get('/exams')
      ]);
      setRules(rulesRes.data.data || []);
      setClasses(classRes.data.data || []);
      setExams(examsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load grading rules');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new or editing
  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        class_id: rule.class_id,
        academic_year: rule.academic_year?.toString() || '2026',
        term: rule.term || 'Term 1',
        title: rule.title || '',
        weights: (rule.contributing_exams || []).map(e => ({
          exam_id: e.exam_id,
          weight_percentage: e.weight_percentage?.toString() || '0'
        }))
      });
    } else {
      setEditingRule(null);
      setForm({
        class_id: classes[0]?.id || '',
        academic_year: '2026',
        term: 'Term 1',
        title: '',
        weights: exams.length > 0 ? [{ exam_id: exams[0].id, weight_percentage: '100' }] : []
      });
    }
    setShowModal(true);
  };

  // Add exam item to weights list
  const handleAddWeightItem = () => {
    const availableExam = exams.find(e => !form.weights.some(w => w.exam_id === e.id));
    if (!availableExam) {
      toast.error(isBn ? 'সকল পরীক্ষা ইতোমধ্যে যুক্ত করা হয়েছে' : 'All exams already added');
      return;
    }
    setForm(prev => ({
      ...prev,
      weights: [...prev.weights, { exam_id: availableExam.id, weight_percentage: '0' }]
    }));
  };

  // Remove exam item from weights list
  const handleRemoveWeightItem = (index) => {
    setForm(prev => ({
      ...prev,
      weights: prev.weights.filter((_, idx) => idx !== index)
    }));
  };

  // Update weight percentage or exam selection
  const handleWeightChange = (index, field, val) => {
    setForm(prev => {
      const nextWeights = [...prev.weights];
      nextWeights[index] = { ...nextWeights[index], [field]: val };
      return { ...prev, weights: nextWeights };
    });
  };

  // Calculate current sum of weights
  const currentTotalWeight = useMemo(() => {
    return form.weights.reduce((sum, item) => sum + (parseFloat(item.weight_percentage) || 0), 0);
  }, [form.weights]);

  const isValidSum = Math.abs(currentTotalWeight - 100.0) < 0.01;

  // Save rule
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!isValidSum) {
      toast.error(isBn ? `মোট ওয়েট ১০০% হতে হবে (বর্তমানে ${currentTotalWeight.toFixed(1)}%)` : `Total weight must equal 100% (currently ${currentTotalWeight.toFixed(1)}%)`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        class_id: form.class_id,
        academic_year: parseInt(form.academic_year, 10),
        term: form.term,
        title: form.title || `${classes.find(c => c.id === form.class_id)?.name || 'Class'} ${form.term} Final Aggregation`,
        weights: form.weights.map(w => ({
          exam_id: w.exam_id,
          weight_percentage: parseFloat(w.weight_percentage)
        }))
      };

      if (editingRule) {
        await api.put(`/exams/grading-rules/${editingRule.id}`, payload);
        toast.success(isBn ? 'গ্রেডিং রুল সফলভাবে আপডেট হয়েছে!' : 'Grading rule updated successfully!');
      } else {
        await api.post('/exams/grading-rules', payload);
        toast.success(isBn ? 'নতুন ওয়েট কনফিগারেশন তৈরি সম্পন্ন!' : 'Grading rule created successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিত এই ওয়েট কনফিগারেশন মুছে ফেলতে চান?' : 'Are you sure you want to delete this grading rule?')) return;
    try {
      await api.delete(`/exams/grading-rules/${ruleId}`);
      toast.success(isBn ? 'মুছে ফেলা হয়েছে' : 'Rule deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Calculate results action
  const handleCalculate = async (rule) => {
    try {
      setCalculatingId(rule.id);
      const res = await api.post(`/exams/grading-rules/${rule.id}/calculate`);
      toast.success(res.data.message || 'Results calculated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculatingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Sliders size={16} />
            <span>{isBn ? 'ফাইনাল গ্রেডিং কনফিগারেশন' : 'Assessment Weight Builder'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'ফ্লেক্সিবল ফাইনাল ওয়েট কনফিগারেশন' : 'Flexible Assessment Weights & Final Grading'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBn
              ? 'সেমিস্টার ফাইনালে কোন পরীক্ষার কত শতাংশ অবদান থাকবে তা নির্ধারণ করুন (যেমন: মাসিক পরীক্ষা ২০% + ফাইনাল ৮০% = ১০০%)।'
              : 'Configure how much percentage each internal/monthly exam contributes to the semester final result.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={16} />
          <span>{isBn ? '+ নতুন ওয়েট কনফিগ যোগ করুন' : '+ New Weight Rule'}</span>
        </button>
      </div>

      {/* SAMPLE FORMULA CAROUSEL CARD */}
      <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold uppercase rounded-full">
            💡 Flexible Grading Engine
          </span>
          <h3 className="text-lg font-black tracking-tight">
            {isBn ? 'বহুমুখী মূল্যায়ন ব্যবস্থা (Multi-Assessment Aggregation)' : 'Custom Weight Formulas for Semester Results'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isBn
              ? '১ম মাসিক (১০%) + ২য় মাসিক (১০%) + ক্লাস টেস্ট (১০%) + সেমিস্টার ফাইনাল (৭০%) = ১০০% অথবা ১টি মাসিক (২০%) + ফাইনাল (৮০%) = ১০০% ইত্যাদি যেকোনো ফর্মুলা স্বয়ংক্রিয়ভাবে জিপিএ, মোট নম্বর ও ক্লাস র‍্যাংক নির্ণয় করবে।'
              : 'Combine any number of internal assessments with custom percentage contributions summing to 100%. The engine computes weighted GPA, marks & rank automatically.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/dashboard/exams/results"
            className="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileText size={15} />
            <span>{isBn ? 'ফলাফল শীট দেখুন' : 'Go to Tabulation Sheet'}</span>
          </Link>
        </div>
      </div>

      {/* RULES GRID */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
          <Sliders className="w-8 h-8 animate-bounce text-purple-500 mx-auto mb-2" />
          <p className="text-xs font-semibold">{isBn ? 'কনফিগারেশন লোড হচ্ছে...' : 'Loading weight rules...'}</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <Sliders size={32} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {isBn ? 'কোনো ওয়েট কনফিগারেশন রুল নেই' : 'No Assessment Weight Rules Created'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isBn
              ? 'শ্রেণি ও টার্ম নির্বাচন করে ফাইনাল গ্রেডিংয়ের জন্য পরীক্ষার ওয়েট নির্ধারণ করুন।'
              : 'Create a weight rule to define how exams contribute to the final report card.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>{isBn ? 'প্রথম রুল তৈরি করুন' : 'Create First Rule'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl">
                    {rule.class_name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                    {rule.academic_year} • {rule.term}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{rule.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isBn ? 'মোট ওয়েট: ' : 'Total Weight: '}{' '}
                    <strong className="text-purple-600 font-mono">{rule.total_weight_percentage}%</strong>
                  </p>
                </div>

                {/* Contributing Exams Breakdown Table */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isBn ? 'অন্তর্ভুক্ত পরীক্ষাসমূহ ও শতকরা হার' : 'Contributing Exams & Weight %'}
                  </p>
                  <div className="space-y-1.5">
                    {(rule.contributing_exams || []).map((exam, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700 truncate pr-2">
                          {exam.exam_name} ({exam.exam_type})
                        </span>
                        <span className="font-mono font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                          {exam.weight_percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={calculatingId === rule.id}
                    onClick={() => handleCalculate(rule)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Calculator size={14} />
                    <span>{calculatingId === rule.id ? (isBn ? 'হিসাব হচ্ছে...' : 'Calculating...') : (isBn ? 'ফলাফল হিসাব করুন' : 'Run Calculation')}</span>
                  </button>

                  <Link
                    href={`/dashboard/exams/results?rule_id=${rule.id}`}
                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                    title="View Tabulation Sheet"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(rule)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit Rule"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT RULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRule
                      ? (isBn ? 'ওয়েট কনফিগারেশন সম্পাদনা' : 'Edit Assessment Weight Rule')
                      : (isBn ? 'নতুন ফাইনাল ওয়েট কনফিগারেশন' : 'Create Assessment Weight Rule')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'পরীক্ষাসমূহ নির্বাচন করে শতকরা অবদান দিন।' : 'Assign percentage weights summing to 100%.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'শ্রেণি' : 'Class'} *</label>
                  <select
                    required
                    disabled={!!editingRule}
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'টার্ম / সেমিস্টার' : 'Term'} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Term 1 / Semester 1"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'কনফিগারেশনের শিরোনাম' : 'Rule Title (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: ১ম সাময়িক ফাইনাল গ্রেডিং' : 'e.g. Class 1 Term 1 Final Aggregation'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Assessment Weights List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    {isBn ? 'অন্তর্ভুক্ত পরীক্ষাসমূহ ও ওয়েট (%)' : 'Contributing Exams & Weight (%)'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddWeightItem}
                    className="text-purple-600 hover:text-purple-800 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>{isBn ? '+ পরীক্ষা যোগ করুন' : '+ Add Exam'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {form.weights.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={w.exam_id}
                        onChange={(e) => handleWeightChange(idx, 'exam_id', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                      >
                        {exams.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.exam_type})</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          required
                          value={w.weight_percentage}
                          onChange={(e) => handleWeightChange(idx, 'weight_percentage', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-white"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveWeightItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Progress Bar & Sum Indicator */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      {isBn ? 'মোট ওয়েট অনুপাত: ' : 'Total Weight Sum: '}
                    </span>
                    <span className={`font-mono font-extrabold ${isValidSum ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {currentTotalWeight.toFixed(1)}% / 100%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isValidSum ? 'bg-emerald-500' : currentTotalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, currentTotalWeight)}%` }}
                    />
                  </div>

                  {!isValidSum && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      {isBn
                        ? `⚠️ মোট ওয়েট অবশ্যই ১০০% হতে হবে। এখনো ${(100 - currentTotalWeight).toFixed(1)}% বাকি/অতিরিক্ত।`
                        : `⚠️ Total weight must equal 100%. Currently ${(100 - currentTotalWeight).toFixed(1)}% remaining/excess.`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving || !isValidSum}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'কনফিগারেশন সেভ করুন' : 'Save Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

