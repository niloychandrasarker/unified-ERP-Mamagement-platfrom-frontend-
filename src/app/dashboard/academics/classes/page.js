'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import {
  BookOpen, Plus, Users, DoorOpen, Edit2, Trash2,
  ChevronRight, ChevronDown, Check, X, School, AlertCircle, Sparkles
} from 'lucide-react';

export default function ClassesPage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', numeric_level: '', description: '' });

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    class_id: '',
    name: '',
    room_number: '',
    capacity: 50,
    class_teacher_id: ''
  });

  const [expandedClasses, setExpandedClasses] = useState({});
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'rooms'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, secRes, teachRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/sections'),
        api.get('/academics/teachers')
      ]);
      setClasses(classRes.data.data || []);
      setSections(secRes.data.data || []);
      setTeachers(teachRes.data.data || []);

      // Auto expand all classes initially
      const expandMap = {};
      (classRes.data.data || []).forEach(c => { expandMap[c.id] = true; });
      setExpandedClasses(expandMap);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (classId) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  // Seed standard classes 1 to 10
  const handleSeedStandard = async () => {
    try {
      await api.post('/academics/classes/seed-standard');
      toast.success(isBn ? 'ক্লাস ১ থেকে ১০ সফলভাবে কনফিগার হয়েছে!' : 'Classes 1 to 10 configured successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to setup classes');
    }
  };

  // Handle Class Submit
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/academics/classes/${editingClass.id}`, classForm);
        toast.success(isBn ? 'শ্রেণি সফলভাবে আপডেট হয়েছে' : 'Class updated successfully');
      } else {
        await api.post('/academics/classes', classForm);
        toast.success(isBn ? 'নতুন শ্রেণি যুক্ত হয়েছে' : 'Class created successfully');
      }
      setShowClassModal(false);
      setEditingClass(null);
      setClassForm({ name: '', numeric_level: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Delete Class
  const handleDeleteClass = async (cls) => {
    if (!confirm(isBn ? `আপনি কি "${cls.name}" শ্রেণি মুছে ফেলতে চান?` : `Are you sure you want to delete "${cls.name}"?`)) return;
    try {
      await api.delete(`/academics/classes/${cls.id}`);
      toast.success(isBn ? 'শ্রেণি মুছে ফেলা হয়েছে' : 'Class deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  // Open Section Modal
  const openAddSection = (classId) => {
    setEditingSection(null);
    setSectionForm({
      class_id: classId,
      name: '',
      room_number: '',
      capacity: 50,
      class_teacher_id: ''
    });
    setShowSectionModal(true);
  };

  const openEditSection = (sec) => {
    setEditingSection(sec);
    setSectionForm({
      class_id: sec.class_id,
      name: sec.name,
      room_number: sec.room_number || '',
      capacity: sec.capacity || 50,
      class_teacher_id: sec.class_teacher_id || ''
    });
    setShowSectionModal(true);
  };

  // Handle Section Submit
  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.put(`/academics/sections/${editingSection.id}`, sectionForm);
        toast.success(isBn ? 'সেকশন আপডেট হয়েছে' : 'Section updated successfully');
      } else {
        await api.post('/academics/sections', sectionForm);
        toast.success(isBn ? 'নতুন সেকশন তৈরি হয়েছে' : 'Section created successfully');
      }
      setShowSectionModal(false);
      setEditingSection(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Delete Section
  const handleDeleteSection = async (sec) => {
    if (!confirm(isBn ? `আপনি কি "${sec.name}" সেকশন মুছে ফেলতে চান?` : `Are you sure you want to delete section "${sec.name}"?`)) return;
    try {
      await api.delete(`/academics/sections/${sec.id}`);
      toast.success(isBn ? 'সেকশন মুছে ফেলা হয়েছে' : 'Section deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + (parseInt(c.student_count) || 0), 0);
  const totalSections = sections.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isBn ? 'শ্রেণি ও সেকশন ব্যবস্থাপনা' : 'Classes & Sections'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn ? 'আপনার প্রতিষ্ঠানের সকল শ্রেণি, সেকশন ও শিক্ষক অ্যাসাইনমেন্ট পরিচালনা করুন' : 'Configure grades, class sections, room allocations and assigned class teachers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {classes.length < 10 && (
            <button
              onClick={handleSeedStandard}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Sparkles size={15} />
              {isBn ? '⚡ ক্লাস ১-১০ অটো-সেটআপ' : '⚡ Auto-Setup Classes 1-10'}
            </button>
          )}
          <button
            onClick={() => {
              setEditingClass(null);
              setClassForm({ name: '', numeric_level: '', description: '' });
              setShowClassModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            {isBn ? '+ নতুন শ্রেণি যুক্ত করুন' : '+ Add New Class'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'মোট শ্রেণি' : 'Total Classes'}</p>
            <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DoorOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'মোট সেকশন' : 'Total Sections'}</p>
            <p className="text-2xl font-bold text-slate-900">{totalSections}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'মোট শিক্ষার্থী' : 'Enrolled Students'}</p>
            <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <BookOpen size={14} />
          <span>{isBn ? 'শ্রেণি ও সেকশন তালিকা' : 'Classes & Sections'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'classes' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <DoorOpen size={14} />
          <span>{isBn ? 'রুম ও শ্রেণিকক্ষ বরাদ্দ' : 'Room Allocations'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'rooms' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {sections.filter(s => s.room_number).length}
          </span>
        </button>
      </div>

      {/* Room Directory View */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
              <DoorOpen size={18} />
            </div>
            <div className="text-xs text-amber-900 space-y-0.5">
              <p className="font-bold">
                {isBn ? 'শ্রেণিকক্ষ ও রুম নম্বর ব্যবস্থাপনা:' : 'Classroom & Room Number Management:'}
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                {isBn
                  ? 'অ্যাডমিনরা এখান থেকে যেকোনো রুম নম্বর এডিট করতে পারবেন এবং উক্ত রুমটি কোন ক্লাসে বরাদ্দ থাকবে তা নির্বাচন বা পরিবর্তন (Class Assign) করতে পারবেন।'
                  : 'Admins can edit any room number here and assign or reassign which class uses that classroom.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map(sec => {
              const assignedClass = classes.find(c => c.id === sec.class_id);
              return (
                <div key={sec.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-sm">
                        <DoorOpen size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{sec.room_number ? `Room ${sec.room_number}` : (isBn ? 'রুম নম্বর নেই' : 'No Room #')}</span>
                          {sec.room_number && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                              {isBn ? 'সক্রিয়' : 'Active'}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'বরাদ্দকৃত সেকশন:' : 'Section:'} <span className="font-semibold text-slate-700">{sec.name}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openEditSection(sec)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      title={isBn ? 'রুম এডিট ও শ্রেণি পরিবর্তন' : 'Edit Room & Class'}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isBn ? 'বরাদ্দকৃত শ্রেণি:' : 'Assigned Class:'}</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {assignedClass?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isBn ? 'ধারণক্ষমতা:' : 'Capacity:'}</span>
                      <span className="font-medium text-slate-700">{sec.capacity || 50} {isBn ? 'আসন' : 'seats'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isBn ? 'শ্রেণি শিক্ষক:' : 'Class Teacher:'}</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">
                        {sec.class_teacher_name || (isBn ? 'নির্ধারিত নেই' : 'Unassigned')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditSection(sec)}
                    className="w-full py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>{isBn ? 'রুম এডিট ও শ্রেণি অ্যাসাইন করুন' : 'Edit Room & Assign Class'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Classes List */}
      {activeTab === 'classes' && (
        loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">
              {isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading academic structure...'}
            </div>
          ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <School size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{isBn ? 'কোন শ্রেণি পাওয়া যায়নি' : 'No Classes Created Yet'}</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isBn ? 'আপনার প্রতিষ্ঠানের প্রথম শ্রেণিটি যোগ করে শুরু করুন।' : 'Start organizing your academic structure by creating your first class and section.'}
          </p>
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            {isBn ? 'প্রথম শ্রেণি যোগ করুন' : 'Add First Class'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const classSections = sections.filter(s => s.class_id === cls.id);
            const isExpanded = !!expandedClasses[cls.id];

            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Class Header Bar */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(cls.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                        {cls.numeric_level && (
                          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                            Level {cls.numeric_level}
                          </span>
                        )}
                      </div>
                      {cls.description && <p className="text-xs text-slate-500 mt-0.5">{cls.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                    <Link
                      href={`/dashboard/students?class_id=${cls.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                      title="View students in this class"
                    >
                      <Users size={13} />
                      {isBn ? `শিক্ষার্থী (${cls.student_count || 0})` : `Students (${cls.student_count || 0})`}
                    </Link>

                    <Link
                      href={`/dashboard/students/admit?class_id=${cls.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Admit student directly to this class"
                    >
                      <Plus size={13} />
                      {isBn ? 'ভর্তি' : 'Admit'}
                    </Link>

                    <button
                      onClick={() => openAddSection(cls.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus size={14} />
                      {isBn ? 'সেকশন যোগ' : 'Add Section'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setClassForm({
                          name: cls.name,
                          numeric_level: cls.numeric_level || '',
                          description: cls.description || ''
                        });
                        setShowClassModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                      title="Edit Class"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteClass(cls)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Class"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sections Table / Details */}
                {isExpanded && (
                  <div className="p-5">
                    {classSections.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        {isBn ? 'এই শ্রেণিতে এখনও কোনো সেকশন যোগ করা হয়নি।' : 'No sections added for this class yet.'}{' '}
                        <button
                          onClick={() => openAddSection(cls.id)}
                          className="text-blue-600 font-semibold hover:underline ml-1"
                        >
                          {isBn ? 'এখনই একটি যোগ করুন' : 'Add one now'}
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="pb-3">{isBn ? 'সেকশন নাম' : 'Section'}</th>
                              <th className="pb-3">{isBn ? 'রুম নং' : 'Room'}</th>
                              <th className="pb-3">{isBn ? 'ধারণক্ষমতা' : 'Capacity'}</th>
                              <th className="pb-3">{isBn ? 'ক্লাস শিক্ষক' : 'Class Teacher'}</th>
                              <th className="pb-3">{isBn ? 'শিক্ষার্থী' : 'Students'}</th>
                              <th className="pb-3 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm">
                            {classSections.map((sec) => (
                              <tr key={sec.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  {sec.name}
                                </td>
                                <td className="py-3 text-slate-600 font-mono text-xs">
                                  <button
                                    onClick={() => openEditSection(sec)}
                                    title={isBn ? 'রুম ও শ্রেণি পরিবর্তন করতে ক্লিক করুন' : 'Click to edit room & reassign class'}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/60 rounded-lg transition-colors group cursor-pointer text-xs font-medium"
                                  >
                                    <DoorOpen size={13} className="text-slate-500 group-hover:text-blue-600" />
                                    <span>{sec.room_number ? `Room ${sec.room_number}` : (isBn ? '+ রুম বরাদ্দ' : '+ Assign Room')}</span>
                                    <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-blue-500 ml-0.5 transition-opacity" />
                                  </button>
                                </td>
                                <td className="py-3 text-slate-600 text-xs">
                                  {sec.capacity ? `${sec.capacity} seats` : '50 seats'}
                                </td>
                                <td className="py-3 text-slate-700 text-xs">
                                  {sec.class_teacher_name ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-medium">
                                      {sec.class_teacher_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">{isBn ? 'নির্ধারিত নেই' : 'Unassigned'}</span>
                                  )}
                                </td>
                                <td className="py-3 text-slate-700 text-xs font-semibold">
                                  {sec.student_count || 0}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => openEditSection(sec)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSection(sec)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
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
            );
          })}
        </div>
        )
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClass ? (isBn ? 'শ্রেণি সম্পাদনা' : 'Edit Class') : (isBn ? 'নতুন শ্রেণি তৈরি' : 'Add New Class')}
              </h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শ্রেণির নাম' : 'Class Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: Class 9, Class 10' : 'e.g. Class 9, Class 10'}
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'সাংখ্যিক লেভেল / ক্রম (ঐচ্ছিক)' : 'Numeric Level / Order (Optional)'}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 9 or 10"
                  value={classForm.numeric_level}
                  onChange={(e) => setClassForm({ ...classForm, numeric_level: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isBn ? 'শাখা বা ব্যাচ বিবরণ...' : 'Batch description...'}
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingClass ? (isBn ? 'আপডেট করুন' : 'Save Changes') : (isBn ? 'তৈরি করুন' : 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSection ? (isBn ? 'সেকশন সম্পাদনা' : 'Edit Section') : (isBn ? 'নতুন সেকশন যোগ' : 'Add New Section')}
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শ্রেণি নির্ধারণ (Assign Class)' : 'Assign to Class'} *
                </label>
                <select
                  required
                  value={sectionForm.class_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white font-medium text-slate-800"
                >
                  <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select Class --'}</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'সেকশনের নাম' : 'Section Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: Section A, পদ্মা, মেঘনা' : 'e.g. Section A, Padma, Science-A'}
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isBn ? 'রুম নম্বর' : 'Room Number'}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{isBn ? 'সম্পাদনাযোগ্য' : 'Editable'}</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101, 202, 402"
                    value={sectionForm.room_number}
                    onChange={(e) => setSectionForm({ ...sectionForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 font-mono font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'ধারণক্ষমতা' : 'Student Capacity'}
                  </label>
                  <input
                    type="number"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শ্রেণি শিক্ষক (Class Teacher)' : 'Class Teacher (Optional)'}
                </label>
                <select
                  value={sectionForm.class_teacher_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, class_teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="">{isBn ? '-- কোনো শিক্ষক নির্বাচন করেননি --' : '-- None / Select Teacher --'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingSection ? (isBn ? 'আপডেট করুন' : 'Save Changes') : (isBn ? 'সেকশন সংরক্ষণ' : 'Save Section')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

