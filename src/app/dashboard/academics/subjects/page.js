'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import {
  BookOpen, Plus, UserPlus, Users, Edit2, Trash2,
  FileText, Check, X, Shield, Search, Filter
} from 'lucide-react';

export default function SubjectsPage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    class_id: '',
    name: '',
    code: '',
    type: 'MANDATORY',
    teacher_id: ''
  });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: 'Teacher@2026' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, subRes, teachRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/subjects'),
        api.get('/academics/teachers')
      ]);
      setClasses(classRes.data.data || []);
      setSubjects(subRes.data.data || []);
      setTeachers(teachRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load subject data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Subject Submit
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/academics/subjects/${editingSubject.id}`, subjectForm);
        toast.success(isBn ? 'বিষয় সফলভাবে আপডেট হয়েছে' : 'Subject updated successfully');
      } else {
        await api.post('/academics/subjects', subjectForm);
        toast.success(isBn ? 'নতুন বিষয় যুক্ত হয়েছে' : 'Subject created successfully');
      }
      setShowSubjectModal(false);
      setEditingSubject(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (sub) => {
    if (!confirm(isBn ? `আপনি কি "${sub.name}" মুছে ফেলতে চান?` : `Are you sure you want to delete "${sub.name}"?`)) return;
    try {
      await api.delete(`/academics/subjects/${sub.id}`);
      toast.success(isBn ? 'বিষয় মুছে ফেলা হয়েছে' : 'Subject deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  // Quick Add Teacher
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/academics/teachers', teacherForm);
      toast.success(isBn ? 'শিক্ষক সফলভাবে যুক্ত হয়েছেন' : 'Teacher registered successfully');
      setShowTeacherModal(false);
      setTeacherForm({ name: '', email: '', password: 'Teacher@2026' });
      // Refresh teacher list
      const teachRes = await api.get('/academics/teachers');
      const updatedTeachers = teachRes.data.data || [];
      setTeachers(updatedTeachers);
      // If subject modal was open, auto-select this new teacher
      if (res.data.data?.id) {
        setSubjectForm(prev => ({ ...prev, teacher_id: res.data.data.id }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add teacher');
    }
  };

  const filteredSubjects = subjects.filter(sub => {
    const matchesClass = selectedClassId ? sub.class_id === selectedClassId : true;
    const matchesSearch = searchQuery
      ? sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.code && sub.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sub.teacher_name && sub.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isBn ? 'বিষয় ও শিক্ষক বরাদ্দকরণ' : 'Subjects & Teacher Assignment'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn ? 'শ্রেণিভিত্তিক বিষয়সমূহ এবং বিষয়ভিত্তিক দায়িত্বপ্রাপ্ত শিক্ষক পরিচালনা করুন' : 'Manage academic subjects, course codes, and assign specialized subject teachers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTeacherModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus size={16} className="text-blue-600" />
            {isBn ? '+ শিক্ষক যোগ' : '+ Add Teacher'}
          </button>
          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjectForm({
                class_id: selectedClassId || (classes[0]?.id || ''),
                name: '',
                code: '',
                type: 'MANDATORY',
                teacher_id: ''
              });
              setShowSubjectModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus size={16} />
            {isBn ? '+ নতুন বিষয় যোগ' : '+ Add Subject'}
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
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'মোট বিষয়' : 'Total Subjects'}</p>
            <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'নিবন্ধিত শিক্ষক' : 'Faculty Teachers'}</p>
            <p className="text-2xl font-bold text-slate-900">{teachers.length}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{isBn ? 'বাধ্যতামূলক বিষয়' : 'Mandatory Core'}</p>
            <p className="text-2xl font-bold text-slate-900">
              {subjects.filter(s => s.type === 'MANDATORY').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white font-medium text-slate-700"
          >
            <option value="">{isBn ? 'সকল শ্রেণির বিষয়' : 'All Classes'}</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isBn ? 'বিষয় বা শিক্ষকের নাম খুঁজুন...' : 'Search subjects or teachers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
          />
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            {isBn ? 'বিষয়সমূহ লোড হচ্ছে...' : 'Loading subjects...'}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">{isBn ? 'কোন বিষয় পাওয়া যায়নি' : 'No subjects found'}</p>
            <p className="text-xs mt-1 text-slate-400">
              {classes.length === 0 
                ? (isBn ? 'প্রথমে একটি শ্রেণি তৈরি করুন' : 'Please create a class first') 
                : (isBn ? 'নতুন বিষয় যুক্ত করতে উপরের বাটনে ক্লিক করুন' : 'Click "+ Add Subject" to create one')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">{isBn ? 'বিষয় ও কোড' : 'Subject & Code'}</th>
                  <th className="py-3 px-5">{isBn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="py-3 px-5">{isBn ? 'ধরন' : 'Type'}</th>
                  <th className="py-3 px-5">{isBn ? 'দায়িত্বপ্রাপ্ত শিক্ষক' : 'Assigned Teacher'}</th>
                  <th className="py-3 px-5 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {sub.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sub.name}</p>
                          {sub.code && <p className="text-xs font-mono text-slate-500">{sub.code}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800">{sub.class_name}</span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        sub.type === 'MANDATORY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.type === 'MANDATORY' ? (isBn ? 'আবশ্যিক' : 'Mandatory') : (isBn ? 'ঐচ্ছিক' : 'Elective')}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {sub.teacher_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold">
                            {sub.teacher_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{sub.teacher_name}</p>
                            <p className="text-[10px] text-slate-400">{sub.teacher_email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isBn ? 'নির্ধারিত নেই' : 'Unassigned'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSubject(sub);
                            setSubjectForm({
                              class_id: sub.class_id,
                              name: sub.name,
                              code: sub.code || '',
                              type: sub.type || 'MANDATORY',
                              teacher_id: sub.teacher_id || ''
                            });
                            setShowSubjectModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={15} />
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

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSubject ? (isBn ? 'বিষয় সম্পাদনা' : 'Edit Subject') : (isBn ? 'নতুন বিষয় যোগ' : 'Add New Subject')}
              </h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শ্রেণি নির্বাচন' : 'Class'} *
                </label>
                <select
                  required
                  value={subjectForm.class_id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select Class --'}</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'বিষয়ের নাম' : 'Subject Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: সাধারণ গণিত, ইংরেজি' : 'e.g. Higher Mathematics, Physics'}
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'বিষয় কোড' : 'Subject Code'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MATH-101"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'ধরন' : 'Subject Type'}
                  </label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                  >
                    <option value="MANDATORY">{isBn ? 'আবশ্যিক (Mandatory)' : 'Mandatory'}</option>
                    <option value="ELECTIVE">{isBn ? 'ঐচ্ছিক (Elective)' : 'Elective'}</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isBn ? 'বিষয় শিক্ষক' : 'Subject Teacher'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTeacherModal(true)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {isBn ? '+ নতুন শিক্ষক' : '+ New Teacher'}
                  </button>
                </div>
                <select
                  value={subjectForm.teacher_id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="">{isBn ? '-- কোনো শিক্ষক বরাদ্দ নেই --' : '-- Unassigned --'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingSubject ? (isBn ? 'আপডেট করুন' : 'Save Changes') : (isBn ? 'সংরক্ষণ করুন' : 'Save Subject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {isBn ? 'নতুন শিক্ষক নিবন্ধন' : 'Quick Register Teacher'}
              </h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শিক্ষকের পূর্ণ নাম' : 'Teacher Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: মোহাম্মদ রফিকুল ইসলাম' : 'e.g. Md. Rafiqul Islam'}
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শিক্ষকের ইমেইল' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  placeholder="teacher@institution.edu.bd"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'প্রাথমিক পাসওয়ার্ড' : 'Initial Password'}
                </label>
                <input
                  type="text"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-hidden focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {isBn ? 'শিক্ষক এই পাসওয়ার্ড দিয়ে শিক্ষক পোর্টালে লগইন করতে পারবেন।' : 'Teacher can use this initial password to access their portal.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {isBn ? 'শিক্ষক যুক্ত করুন' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

