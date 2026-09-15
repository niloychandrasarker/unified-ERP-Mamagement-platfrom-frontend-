'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  Calendar, Clock, BookOpen, User, Plus, Edit2,
  Trash2, AlertTriangle, CheckCircle2, X, Printer,
  Sparkles, Filter, Building, ChevronRight, Layers,
  Sliders, RotateCcw, Save, Coffee
} from 'lucide-react';
import { printClassRoutine } from '@/lib/printRoutine';

const DAYS_OF_WEEK = [
  { key: 'SUNDAY', en: 'Sunday', bn: 'রবিবার' },
  { key: 'MONDAY', en: 'Monday', bn: 'সোমবার' },
  { key: 'TUESDAY', en: 'Tuesday', bn: 'মঙ্গলবার' },
  { key: 'WEDNESDAY', en: 'Wednesday', bn: 'বুধবার' },
  { key: 'THURSDAY', en: 'Thursday', bn: 'বৃহস্পতিবার' },
  { key: 'SATURDAY', en: 'Saturday', bn: 'শনিবার' }
];

const DEFAULT_PERIODS = [
  { num: 1, start: '08:30', end: '09:15', labelEn: 'Period 1', labelBn: '১ম পিরিয়ড', isBreak: false },
  { num: 2, start: '09:15', end: '10:00', labelEn: 'Period 2', labelBn: '২য় পিরিয়ড', isBreak: false },
  { num: 3, start: '10:00', end: '10:45', labelEn: 'Period 3', labelBn: '৩য় পিরিয়ড', isBreak: false },
  { num: 0, start: '10:45', end: '11:15', labelEn: 'Tiffin Break', labelBn: 'টিফিন বিরতি', isBreak: true },
  { num: 4, start: '11:15', end: '12:00', labelEn: 'Period 4', labelBn: '৪র্থ পিরিয়ড', isBreak: false },
  { num: 5, start: '12:00', end: '12:45', labelEn: 'Period 5', labelBn: '৫ম পিরিয়ড', isBreak: false },
  { num: 6, start: '12:45', end: '01:30', labelEn: 'Period 6', labelBn: '৬ষ্ঠ পিরিয়ড', isBreak: false },
  { num: 7, start: '01:30', end: '02:15', labelEn: 'Period 7', labelBn: '৭ম পিরিয়ড', isBreak: false }
];

export default function RoutinePage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // Customizable Periods State
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [periodsModalOpen, setPeriodsModalOpen] = useState(false);
  const [tempPeriods, setTempPeriods] = useState(DEFAULT_PERIODS);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filter Selection
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [viewMode, setViewMode] = useState('CLASS'); // 'CLASS' or 'TEACHER'

  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slot Builder Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    section_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 'SUNDAY',
    period_number: 1,
    start_time: '08:30',
    end_time: '09:15',
    room_number: ''
  });

  // Conflict Checking State
  const [conflictWarning, setConflictWarning] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);

  // Load custom periods from localStorage
  useEffect(() => {
    const instId = user?.institution?.id || 'default';
    const storageKey = `uemp_routine_periods_${instId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPeriods(parsed);
          setTempPeriods(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved periods', e);
    }
    setPeriods(DEFAULT_PERIODS);
    setTempPeriods(DEFAULT_PERIODS);
  }, [user]);

  // Load initial academic metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        const [cRes, sRes, tRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/sections'),
          isAdmin ? api.get('/academics/teachers') : Promise.resolve({ data: { data: [] } })
        ]);

        const cls = cRes.data.data || [];
        const secs = sRes.data.data || [];
        setClasses(cls);
        setSections(secs);
        setTeachers(tRes.data.data || []);

        if (isStudent && user?.student?.class_id) {
          setSelectedClassId(user.student.class_id);
          setSelectedSectionId(user.student.section_id || '');
        } else if (cls.length > 0) {
          setSelectedClassId(cls[0].id);
          const firstSec = secs.find(s => s.class_id === cls[0].id);
          if (firstSec) setSelectedSectionId(firstSec.id);
        }
      } catch (err) {
        toast.error(isBn ? 'একাডেমিক তথ্য লোড করা যায়নি' : 'Failed to load academic setup');
      } finally {
        setLoading(false);
      }
    };
    loadMetadata();
  }, [isAdmin, isStudent, user, isBn]);

  // Load subjects when selected class changes in modal or filter
  useEffect(() => {
    const fetchSubjects = async () => {
      const cid = modalOpen ? formData.class_id : selectedClassId;
      if (!cid) {
        setSubjects([]);
        return;
      }
      try {
        const res = await api.get(`/academics/subjects?classId=${cid}&class_id=${cid}`);
        setSubjects(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubjects();
  }, [selectedClassId, formData.class_id, modalOpen]);

  // Load Routines
  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const params = {};
      if (viewMode === 'CLASS') {
        if (selectedClassId) params.class_id = selectedClassId;
        if (selectedSectionId) params.section_id = selectedSectionId;
      } else if (viewMode === 'TEACHER') {
        if (selectedTeacherId) params.teacher_id = selectedTeacherId;
      }

      const res = await api.get('/routines', { params });
      setRoutines(res.data.data || []);
    } catch (err) {
      toast.error(isBn ? 'রুটিন লোড করতে ব্যর্থ হয়েছে' : 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId || selectedTeacherId) {
      fetchRoutines();
    }
  }, [selectedClassId, selectedSectionId, selectedTeacherId, viewMode]);

  // Real-time Conflict Detection on Form Change
  useEffect(() => {
    if (!modalOpen || !isAdmin) return;
    if (!formData.day_of_week || !formData.start_time || !formData.end_time) return;

    const timer = setTimeout(async () => {
      try {
        setCheckingConflict(true);
        const res = await api.post('/routines/check-conflict', {
          ...formData,
          exclude_id: editingSlot?.id
        });
        if (res.data.data.hasConflict) {
          setConflictWarning(res.data.data.conflicts);
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingConflict(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    formData.day_of_week,
    formData.start_time,
    formData.end_time,
    formData.section_id,
    formData.teacher_id,
    formData.room_number,
    modalOpen,
    editingSlot,
    isAdmin
  ]);

  const activeFilteredSections = sections.filter(s => s.class_id === selectedClassId);
  const modalSections = sections.filter(s => s.class_id === formData.class_id);

  // Period Timings Modal Handlers
  const handleOpenPeriodsModal = () => {
    setTempPeriods(JSON.parse(JSON.stringify(periods)));
    setPeriodsModalOpen(true);
  };

  const handleUpdateTempPeriod = (index, field, value) => {
    const updated = [...tempPeriods];
    updated[index] = { ...updated[index], [field]: value };
    setTempPeriods(updated);
  };

  const handleAddTempPeriod = () => {
    const nonBreakPeriods = tempPeriods.filter(p => !p.isBreak);
    const nextNum = nonBreakPeriods.length > 0 ? Math.max(...nonBreakPeriods.map(p => p.num)) + 1 : 1;
    const lastPeriod = tempPeriods[tempPeriods.length - 1];
    const newPeriod = {
      num: nextNum,
      start: lastPeriod ? lastPeriod.end : '08:30',
      end: '09:15',
      labelEn: `Period ${nextNum}`,
      labelBn: `${nextNum}ম পিরিয়ড`,
      isBreak: false
    };
    setTempPeriods([...tempPeriods, newPeriod]);
  };

  const handleDeleteTempPeriod = (index) => {
    if (tempPeriods.length <= 1) {
      toast.error(isBn ? 'কমপক্ষে একটি পিরিয়ড থাকতে হবে' : 'At least one period is required');
      return;
    }
    const updated = tempPeriods.filter((_, i) => i !== index);
    setTempPeriods(updated);
  };

  const handleResetDefaultPeriods = () => {
    setTempPeriods(DEFAULT_PERIODS);
    toast.success(isBn ? 'ডিফল্ট সময়সূচী রিস্টোর করা হয়েছে' : 'Restored to default period timings');
  };

  const handleSavePeriods = () => {
    // Re-index non-break periods
    let counter = 1;
    const normalized = tempPeriods.map(p => {
      if (p.isBreak) {
        return { ...p, num: 0 };
      }
      const num = counter++;
      return {
        ...p,
        num,
        labelEn: p.labelEn || `Period ${num}`,
        labelBn: p.labelBn || `${num}ম পিরিয়ড`
      };
    });

    setPeriods(normalized);
    const instId = user?.institution?.id || 'default';
    try {
      localStorage.setItem(`uemp_routine_periods_${instId}`, JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save periods to localStorage', e);
    }
    setPeriodsModalOpen(false);
    toast.success(isBn ? 'পিরিয়ড সময়সূচী সফলভাবে সংরক্ষিত হয়েছে!' : 'Period timings saved successfully!');
  };

  // Open Modal for New Slot
  const handleOpenAddModal = (presetDay = 'SUNDAY', presetPeriod = null) => {
    setEditingSlot(null);
    setConflictWarning(null);

    const firstValidPeriod = periods.find(p => !p.isBreak) || DEFAULT_PERIODS[0];
    let startTime = firstValidPeriod.start;
    let endTime = firstValidPeriod.end;
    let pNum = firstValidPeriod.num;

    if (presetPeriod) {
      startTime = presetPeriod.start;
      endTime = presetPeriod.end;
      pNum = presetPeriod.num;
    }

    const initialClassId = selectedClassId || (classes[0]?.id || '');
    const validSections = sections.filter(s => s.class_id === initialClassId);
    const currentSec = validSections.find(s => s.id === selectedSectionId) || validSections[0];

    setFormData({
      class_id: initialClassId,
      section_id: currentSec?.id || '',
      subject_id: '',
      teacher_id: '',
      day_of_week: presetDay,
      period_number: pNum,
      start_time: startTime,
      end_time: endTime,
      room_number: currentSec?.room_number || ''
    });
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (slot) => {
    setEditingSlot(slot);
    setConflictWarning(null);
    setFormData({
      class_id: slot.class_id,
      section_id: slot.section_id || '',
      subject_id: slot.subject_id,
      teacher_id: slot.teacher_id || '',
      day_of_week: slot.day_of_week,
      period_number: slot.period_number,
      start_time: slot.start_time ? slot.start_time.slice(0, 5) : '08:30',
      end_time: slot.end_time ? slot.end_time.slice(0, 5) : '09:15',
      room_number: slot.room_number || ''
    });
    setModalOpen(true);
  };

  // Save Slot (Create / Update)
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id) {
      toast.error(isBn ? 'শ্রেণি ও বিষয় নির্বাচন আবশ্যক' : 'Class and subject are required');
      return;
    }

    try {
      setSavingSlot(true);
      if (editingSlot) {
        await api.put(`/routines/${editingSlot.id}`, formData);
        toast.success(isBn ? 'পিরিয়ড স্লট আপডেট সম্পন্ন হয়েছে!' : 'Period slot updated!');
      } else {
        await api.post('/routines', formData);
        toast.success(isBn ? 'নতুন পিরিয়ড সফলভাবে যুক্ত হয়েছে!' : 'New period slot scheduled!');
      }
      setModalOpen(false);
      fetchRoutines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save routine slot');
    } finally {
      setSavingSlot(false);
    }
  };

  // Delete Slot
  const handleDeleteSlot = async (slotId) => {
    if (!confirm(isBn ? 'আপনি কি এই পিরিয়ড স্লটটি মুছে ফেলতে চান?' : 'Delete this routine period?')) return;
    try {
      await api.delete(`/routines/${slotId}`);
      toast.success(isBn ? 'স্লট মুছে ফেলা হয়েছে' : 'Slot removed');
      fetchRoutines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete slot');
    }
  };

  // Helper to find slot in timetable
  const getSlot = (dayKey, periodNum) => {
    return routines.find(r => r.day_of_week === dayKey && r.period_number === periodNum);
  };

  const handlePrintRoutine = () => {
    const currentClass = classes.find(c => c.id === selectedClassId);
    const currentSection = sections.find(s => s.id === selectedSectionId);
    const currentTeacher = teachers.find(t => t.id === selectedTeacherId);

    printClassRoutine({
      institutionName: user?.institution?.name || 'Unified Education Management Platform',
      institutionAddress: user?.institution?.address || '',
      className: viewMode === 'TEACHER'
        ? (currentTeacher ? `${isBn ? 'শিক্ষক' : 'Teacher'}: ${currentTeacher.name}` : (isBn ? 'শিক্ষকের রুটিন' : 'Teacher Schedule'))
        : (currentClass ? currentClass.name : (isBn ? 'সকল শ্রেণি' : 'All Classes')),
      sectionName: viewMode === 'TEACHER' ? '' : (currentSection ? currentSection.name : ''),
      academicYear: '2026',
      routines: routines,
      periodTimings: periods,
      isBn
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Calendar size={15} />
            <span>{isBn ? 'একাডেমিক রুটিন ম্যানেজমেন্ট' : 'Academic Schedule Builder'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            {isBn ? 'ক্লাস রুটিন ও সময়সূচী' : 'Class Routine & Timetable'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'সাপ্তাহিক পিরিয়ড শিডিউল প্রণয়ন, কাস্টম সময়সূচী পরিবর্তন এবং শিক্ষক ও শ্রেণিকক্ষ সংঘাত (Conflict) নিরসন।'
              : 'Weekly timetable schedule builder with customizable period timings & live conflict prevention.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 print:hidden">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenPeriodsModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Sliders size={15} className="text-purple-600" />
              <span>{isBn ? '⚙️ পিরিয়ড সময়সূচী পরিবর্তন' : '⚙️ Customize Period Timings'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintRoutine}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Printer size={15} />
            <span>{isBn ? 'প্রিন্ট রুটিন' : 'Print Routine'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus size={16} />
              <span>{isBn ? '+ নতুন পিরিয়ড স্লট' : '+ Add Period Slot'}</span>
            </button>
          )}
        </div>
      </div>

      {/* No classes warning banner */}
      {classes.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {isBn ? 'কোনো শ্রেণি পাওয়া যায়নি!' : 'No Classes Registered Yet!'}
              </h4>
              <p className="text-[11px] text-amber-700">
                {isBn
                  ? 'রুটিন তৈরির জন্য প্রথমে একাডেমিক সেকশনে শ্রেণি ও সেকশন যোগ করুন।'
                  : 'To build class routines, please set up classes and sections in Academics.'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link
              href="/dashboard/academics/classes"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
            >
              {isBn ? 'শ্রেণি তৈরি করুন' : 'Setup Classes'}
            </Link>
          )}
        </div>
      )}

      {/* Filter and Mode Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('CLASS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'CLASS' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isBn ? 'শ্রেণিভিত্তিক রুটিন' : 'Class View'}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setViewMode('TEACHER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'TEACHER' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isBn ? 'শিক্ষকভিত্তিক রুটিন' : 'Teacher View'}
              </button>
            )}
          </div>

          {viewMode === 'CLASS' ? (
            <>
              {/* Class Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">{isBn ? 'শ্রেণি:' : 'Class:'}</span>
                <select
                  disabled={isStudent}
                  value={selectedClassId}
                  onChange={(e) => {
                    const newCId = e.target.value;
                    setSelectedClassId(newCId);
                    const sec = sections.find(s => s.class_id === newCId);
                    setSelectedSectionId(sec ? sec.id : '');
                  }}
                  className="min-w-[170px] px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-blue-600 shadow-2xs"
                >
                  <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select Class --'}</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">{isBn ? 'সেকশন:' : 'Section:'}</span>
                <select
                  disabled={isStudent}
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="min-w-[150px] px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-blue-600 shadow-2xs"
                >
                  <option value="">{isBn ? 'সকল সেকশন' : 'All Sections'}</option>
                  {activeFilteredSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Teacher Selector */
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{isBn ? 'শিক্ষক:' : 'Teacher:'}</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-blue-600 shadow-2xs"
              >
                <option value="">{isBn ? '-- শিক্ষক নির্বাচন করুন --' : '-- Select Teacher --'}</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span className="font-semibold text-slate-700">
            {isBn ? `মোট ${routines.length} টি পিরিয়ড বরাদ্দ` : `${routines.length} periods scheduled`}
          </span>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">{user?.institution?.name || 'Unified Education Management Platform'}</h2>
        <p className="text-sm text-slate-600 mt-0.5">
          {viewMode === 'CLASS'
            ? `${classes.find(c => c.id === selectedClassId)?.name || ''} ${sections.find(s => s.id === selectedSectionId)?.name || ''} Routine`
            : `Teacher Schedule: ${teachers.find(t => t.id === selectedTeacherId)?.name || ''}`}
        </p>
      </div>

      {/* TIMETABLE GRID */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-32 border-r border-slate-200/70">{isBn ? 'দিন (Day)' : 'Day'}</th>
              {periods.map((p, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-3 text-center border-r border-slate-200/70 last:border-r-0 ${
                    p.isBreak ? 'bg-amber-50/60 w-24' : 'min-w-[135px]'
                  }`}
                >
                  <span className="block text-slate-800 font-bold">{isBn ? (p.labelBn || p.labelEn) : p.labelEn}</span>
                  <span className="block font-mono text-[10px] text-slate-500 font-medium mt-0.5">
                    {p.start} - {p.end}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {DAYS_OF_WEEK.map((day) => (
              <tr key={day.key} className="hover:bg-slate-50/30 transition-colors">
                {/* Day Header Column */}
                <td className="py-4 px-4 font-bold text-slate-900 bg-slate-50/40 border-r border-slate-200/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>{isBn ? day.bn : day.en}</span>
                  </div>
                </td>

                {/* Periods Columns */}
                {periods.map((p, pIdx) => {
                  if (p.isBreak) {
                    return (
                      <td
                        key={pIdx}
                        className="py-3 px-2 bg-amber-50/40 text-center border-r border-slate-200/70 text-amber-800 font-semibold text-[11px]"
                      >
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[10px] font-bold">
                          <Coffee size={11} />
                          {isBn ? (p.labelBn || 'বিরতি') : (p.labelEn || 'Break')}
                        </span>
                      </td>
                    );
                  }

                  const slot = getSlot(day.key, p.num);

                  return (
                    <td key={pIdx} className="py-2.5 px-2.5 border-r border-slate-200/70 last:border-r-0 align-top">
                      {slot ? (
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/70 space-y-1.5 group relative hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 text-xs leading-tight">
                              {slot.subject_name}
                            </span>
                            {slot.room_number && (
                              <span className="px-1.5 py-0.5 bg-white text-blue-700 text-[10px] font-bold rounded-md border border-blue-100 shadow-2xs shrink-0">
                                {slot.room_number}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-600 flex items-center gap-1">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{slot.teacher_name || 'N/A'}</span>
                          </div>

                          {viewMode === 'TEACHER' && (
                            <div className="text-[10px] text-blue-700 font-semibold">
                              {slot.class_name} {slot.section_name ? `(${slot.section_name})` : ''}
                            </div>
                          )}

                          {/* Quick Admin Actions on hover */}
                          {isAdmin && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 px-1 py-0.5 rounded-lg border border-slate-200 shadow-xs print:hidden">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(slot)}
                                className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Edit Slot"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                                title="Delete Slot"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Empty Slot Placeholder */
                        isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddModal(day.key, p)}
                            className="w-full h-16 rounded-xl border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-300 hover:text-blue-600 flex items-center justify-center transition-colors print:hidden group"
                            title={isBn ? 'নতুন ক্লাস স্লট যোগ করুন' : 'Schedule class'}
                          >
                            <Plus size={14} className="group-hover:scale-125 transition-transform" />
                          </button>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* PERIOD TIMINGS CUSTOMIZATION MODAL                                       */}
      {/* ========================================================================= */}
      {periodsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? 'পিরিয়ড ও সময়সূচী কাস্টমাইজেশন' : 'Customize Period Schedule Timings'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn
                      ? 'প্রতিটি পিরিয়ডের শুরু ও শেষের সময় এবং বিরতির সময় পরিবর্তন করুন।'
                      : 'Define daily periods, start/end times, and tiffin breaks for your campus.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setPeriodsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {tempPeriods.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                    p.isBreak ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {p.isBreak ? '☕' : p.num || idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Label (e.g. 1st Period / টিফিন বিরতি)"
                      value={isBn ? (p.labelBn || p.labelEn) : p.labelEn}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isBn) {
                          handleUpdateTempPeriod(idx, 'labelBn', val);
                        } else {
                          handleUpdateTempPeriod(idx, 'labelEn', val);
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 w-full sm:w-44 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-semibold">{isBn ? 'শুরু:' : 'Start:'}</span>
                      <input
                        type="time"
                        value={p.start}
                        onChange={(e) => handleUpdateTempPeriod(idx, 'start', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <span className="text-slate-300">-</span>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-semibold">{isBn ? 'শেষ:' : 'End:'}</span>
                      <input
                        type="time"
                        value={p.end}
                        onChange={(e) => handleUpdateTempPeriod(idx, 'end', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 ml-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!p.isBreak}
                        onChange={(e) => handleUpdateTempPeriod(idx, 'isBreak', e.target.checked)}
                        className="rounded text-amber-600 focus:ring-0"
                      />
                      <span>{isBn ? 'বিরতি' : 'Break'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteTempPeriod(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                      title="Remove Slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTempPeriod}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>{isBn ? '+ পিরিয়ড যোগ করুন' : '+ Add Period'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultPeriods}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>{isBn ? 'ডিফল্ট রিসেট' : 'Reset Defaults'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSavePeriods}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Save size={14} />
                  <span>{isBn ? 'সময়সূচী সংরক্ষণ করুন' : 'Save Timings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLOT BUILDER / EDITOR MODAL                                               */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingSlot
                      ? (isBn ? 'পিরিয়ড স্লট সম্পাদনা' : 'Edit Period Slot')
                      : (isBn ? 'নতুন পিরিয়ড স্লট নির্ধারণ' : 'Schedule New Period Slot')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'বিষয়, শিক্ষক, সময় এবং রুম নির্বাচন করুন' : 'Assign subject, faculty, period timing & room'}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* CONFLICT WARNING BANNER */}
            {conflictWarning && conflictWarning.length > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                  <AlertTriangle size={15} />
                  <span>{isBn ? 'সময়সূচী সংঘাত চিহ্নিত হয়েছে!' : 'Scheduling Conflict Detected!'}</span>
                </div>
                <div className="text-xs text-red-600 space-y-1 pl-5">
                  {conflictWarning.map((c, i) => (
                    <p key={i}>• {c.message}</p>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              {/* Class & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শ্রেণি' : 'Class'} *
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFormData(prev => ({ ...prev, class_id: cid, section_id: '', subject_id: '' }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? '-- শ্রেণি নির্বাচন --' : '-- Select Class --'}</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'সেকশন' : 'Section'}
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => {
                      const secId = e.target.value;
                      const sec = sections.find(s => s.id === secId);
                      setFormData(prev => ({
                        ...prev,
                        section_id: secId,
                        room_number: sec?.room_number || prev.room_number
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? '-- ঐচ্ছিক / সাধারণ --' : '-- Optional / General --'}</option>
                    {modalSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.room_number ? `Room ${s.room_number}` : 'No Room'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day & Period Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'সপ্তাহের দিন' : 'Day of Week'} *
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.key} value={d.key}>{isBn ? d.bn : d.en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'পিরিয়ড নম্বর' : 'Period'} *
                  </label>
                  <select
                    value={formData.period_number}
                    onChange={(e) => {
                      const pNum = parseInt(e.target.value, 10);
                      const std = periods.find(p => p.num === pNum);
                      setFormData(prev => ({
                        ...prev,
                        period_number: pNum,
                        start_time: std ? std.start : prev.start_time,
                        end_time: std ? std.end : prev.end_time
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    {periods.filter(p => !p.isBreak).map(p => (
                      <option key={p.num} value={p.num}>
                        {isBn ? (p.labelBn || p.labelEn) : p.labelEn} ({p.start}-{p.end})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'বিষয় (Subject)' : 'Subject'} *
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => {
                      const subId = e.target.value;
                      const sub = subjects.find(s => s.id === subId);
                      setFormData(prev => ({
                        ...prev,
                        subject_id: subId,
                        teacher_id: sub?.teacher_id || prev.teacher_id
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? '-- বিষয় নির্বাচন করুন --' : '-- Select Subject --'}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || s.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শিক্ষক (Teacher)' : 'Assigned Teacher'}
                  </label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? '-- কোনো শিক্ষক বরাদ্দ নেই --' : '-- No Teacher Assigned --'}</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time & Room Number */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শুরুর সময়' : 'Start Time'} *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শেষের সময়' : 'End Time'} *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'রুম নম্বর' : 'Room Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 302"
                    value={formData.room_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={savingSlot || checkingConflict || (conflictWarning && conflictWarning.length > 0)}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {savingSlot
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (editingSlot ? (isBn ? 'আপডেট করুন' : 'Update Slot') : (isBn ? 'পিরিয়ড নির্ধারণ করুন' : 'Schedule Period'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
