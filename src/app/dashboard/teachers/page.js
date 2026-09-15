'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Search, KeyRound, Copy, Check, Eye, EyeOff,
  Printer, Mail, Phone, BookOpen, Building2, ShieldCheck,
  Sparkles, ExternalLink, Share2, AlertCircle, X, Edit3, Calendar, Award
} from 'lucide-react';
import { printCredentialSlip } from '@/lib/printRoutine';

const STANDARD_DESIGNATIONS = [
  { id: 'Principal', en: 'Principal', bn: 'অধ্যক্ষ' },
  { id: 'Vice Principal', en: 'Vice Principal', bn: 'উপাধ্যক্ষ' },
  { id: 'Head Teacher', en: 'Head Teacher / Headmaster', bn: 'প্রধান শিক্ষক' },
  { id: 'Assistant Head Teacher', en: 'Assistant Head Teacher', bn: 'সহকারী প্রধান শিক্ষক' },
  { id: 'Senior Teacher', en: 'Senior Teacher', bn: 'সিনিয়র শিক্ষক' },
  { id: 'Assistant Teacher', en: 'Assistant Teacher', bn: 'সহকারী শিক্ষক' },
  { id: 'Junior Teacher', en: 'Junior Teacher', bn: 'জুনিয়র শিক্ষক' },
  { id: 'Lecturer', en: 'Lecturer', bn: 'প্রভাষক' },
  { id: 'Physical Education Teacher', en: 'Physical Education Teacher', bn: 'শরীরচর্চা শিক্ষক' },
  { id: 'Religious Teacher', en: 'Religious Teacher (Moulvi)', bn: 'ধর্মীয় শিক্ষক (মাওলানা)' },
  { id: 'ICT Teacher', en: 'ICT & Computer Teacher', bn: 'আইসিটি শিক্ষক' },
  { id: 'Academic Coordinator', en: 'Academic Coordinator', bn: 'একাডেমিক কো-অর্ডিনেটর' },
  { id: 'Exam Controller', en: 'Exam Controller', bn: 'পরীক্ষা নিয়ন্ত্রক' },
  { id: 'Chief Accountant', en: 'Chief Accountant', bn: 'প্রধান হিসাব কর্মকর্তা' },
  { id: 'Office Assistant', en: 'Office Assistant / Computer Operator', bn: 'অফিস সহকারী' },
  { id: 'Librarian', en: 'Librarian', bn: 'গ্রন্থাগারিক' },
  { id: 'Lab Assistant', en: 'Lab Assistant', bn: 'ল্যাব সহকারী' }
];

const STANDARD_ADDITIONAL_DESIGNATIONS = [
  { id: 'Academic Coordinator', en: 'Academic Coordinator', bn: 'একাডেমিক সমন্বয়কারী' },
  { id: 'Routine & Schedule In-Charge', en: 'Routine & Schedule In-Charge', bn: 'ক্লাস রুটিন প্রণয়ন ইনচার্জ' },
  { id: 'Exam Committee Head', en: 'Exam Committee Head', bn: 'পরীক্ষা কমিটি আহ্বায়ক' },
  { id: 'Exam Committee Member', en: 'Exam Committee Member', bn: 'পরীক্ষা কমিটি সদস্য' },
  { id: 'Class Teacher', en: 'Class Teacher', bn: 'শ্রেণি শিক্ষক' },
  { id: 'Cultural Secretary', en: 'Cultural Secretary', bn: 'সাংস্কৃতিক বিষয়ক দায়িত্ব' },
  { id: 'Sports In-Charge', en: 'Sports In-Charge', bn: 'ক্রীড়া ইনচার্জ' },
  { id: 'ICT & Lab Coordinator', en: 'ICT & Smart Lab Coordinator', bn: 'আইসিটি ল্যাব ইনচার্জ' },
  { id: 'Discipline Committee Head', en: 'Discipline Committee Head', bn: 'শৃঙ্খলা কমিটি প্রধান' }
];

export default function TeachersManagementPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Assistant Teacher',
    additional_designation: '',
    custom_additional_designation: '',
    department: 'General',
    initial_password: 'Teacher@2026'
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    designation: 'Assistant Teacher',
    additional_designation: '',
    custom_additional_designation: '',
    department: 'General'
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const institutionId = user?.institution_id || user?.institution?.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const teacherPortalUrl = `${origin}/portal/${institutionId}/teacher`;

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/teachers');
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load teachers', err);
      toast.error(isBn ? 'শিক্ষকদের তালিকা লোড করা যায়নি' : 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCopyCredentials = (teacher) => {
    const text = `🏫 ${user?.institution?.name || 'School'} — Faculty Login Credentials\n\n👤 Teacher: ${teacher.name}\n🔖 Designation: ${teacher.designation || 'Faculty Member'}${teacher.additional_designation ? ` (${teacher.additional_designation})` : ''}\n✉️ Email: ${teacher.email}\n🔑 Password: ${teacher.initial_password || 'Teacher@2026'}\n🌐 Teacher Portal: ${teacherPortalUrl}\n\nPlease log in to access your class routines, attendance, and exam marks.`;
    navigator.clipboard.writeText(text);
    setCopiedId(teacher.id);
    toast.success(isBn ? 'লগইন তথ্য কপি করা হয়েছে!' : 'Login credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTogglePassword = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast.error(isBn ? 'নাম এবং ইমেইল দেওয়া আবশ্যক' : 'Name and email are required');
      return;
    }

    const finalAdditional =
      addForm.additional_designation === 'CUSTOM'
        ? addForm.custom_additional_designation.trim()
        : addForm.additional_designation;

    try {
      setSavingTeacher(true);
      const res = await api.post('/academics/teachers', {
        ...addForm,
        additional_designation: finalAdditional || null
      });
      toast.success(isBn ? 'নতুন শিক্ষক সফলভাবে যুক্ত হয়েছে!' : 'Teacher added successfully!');
      setAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        designation: 'Assistant Teacher',
        additional_designation: '',
        custom_additional_designation: '',
        department: 'General',
        initial_password: 'Teacher@2026'
      });
      await fetchTeachers();

      if (res.data?.data) {
        setSelectedTeacher(res.data.data);
        setSlipModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'শিক্ষক যুক্ত করা যায়নি' : 'Failed to add teacher'));
    } finally {
      setSavingTeacher(false);
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    const isStandard = STANDARD_ADDITIONAL_DESIGNATIONS.some(d => d.id === teacher.additional_designation);
    setEditForm({
      name: teacher.name || '',
      phone: teacher.phone || '',
      designation: teacher.designation || 'Assistant Teacher',
      additional_designation: teacher.additional_designation ? (isStandard ? teacher.additional_designation : 'CUSTOM') : '',
      custom_additional_designation: !isStandard && teacher.additional_designation ? teacher.additional_designation : '',
      department: teacher.department || 'General'
    });
    setEditModalOpen(true);
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error(isBn ? 'নাম দেওয়া আবশ্যক' : 'Name is required');
      return;
    }

    const finalAdditional =
      editForm.additional_designation === 'CUSTOM'
        ? editForm.custom_additional_designation.trim()
        : editForm.additional_designation;

    try {
      setSavingEdit(true);
      await api.put(`/academics/teachers/${selectedTeacher.id}`, {
        name: editForm.name,
        phone: editForm.phone,
        designation: editForm.designation,
        additional_designation: finalAdditional || null,
        department: editForm.department
      });
      toast.success(isBn ? 'শিক্ষকের তথ্য আপডেট হয়েছে!' : 'Teacher updated successfully!');
      setEditModalOpen(false);
      await fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'আপডেট করা যায়নি' : 'Update failed'));
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.additional_designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            <Users size={15} />
            <span>{isBn ? 'প্রশাসনিক ব্যবস্থাপনা' : 'Academic Administration'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isBn ? 'শিক্ষক ও স্টাফ একাউন্ট ও পদবি' : 'Teachers & Staff Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'সকল শিক্ষকদের প্রাতিষ্ঠানিক পদবি, বিশেষ দায়িত্ব এবং পোর্টাল লগইন আইডি ও পাসওয়ার্ড পরিচালনা করুন।'
              : 'Manage faculty designations, assign special roles, and oversee portal credentials.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/admin/access-control"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shadow-2xs"
          >
            <ShieldCheck size={16} className="text-indigo-600" />
            <span>{isBn ? 'রোল ও পারমিশন কন্ট্রোল →' : 'Access & Roles Hub →'}</span>
          </Link>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
          >
            <UserPlus size={16} />
            <span>{isBn ? '+ নতুন শিক্ষক যুক্ত করুন' : '+ Add New Teacher'}</span>
          </button>
        </div>
      </div>

      {/* Portal Link Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-purple-200">
            {isBn ? 'শিক্ষকদের লগইন লিংক' : 'Official Faculty Portal Link'}
          </span>
          <h3 className="text-base font-bold text-white">
            {isBn ? 'শিক্ষকদের সাথে শেয়ার করার লিংক:' : 'Direct Shareable Portal URL:'}
          </h3>
          <p className="text-xs text-purple-200 font-mono break-all bg-black/20 px-3 py-1.5 rounded-lg">
            {teacherPortalUrl}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(teacherPortalUrl);
              toast.success(isBn ? 'শিক্ষক পোর্টাল লিংক কপি হয়েছে!' : 'Teacher portal link copied!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy size={14} />
            {isBn ? 'লিংক কপি' : 'Copy Link'}
          </button>
          <a
            href={teacherPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <ExternalLink size={14} />
            {isBn ? 'ভিউ পোর্টাল' : 'Open Portal'}
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'নাম, পদবি, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search teachers by name, designation, email...'}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {isBn ? `মোট শিক্ষক: ${teachers.length} জন` : `Total Faculty Members: ${teachers.length}`}
        </div>
      </div>

      {/* Teachers Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">{isBn ? 'শিক্ষক ও পরিচিতি' : 'Teacher Profile'}</th>
                <th className="px-6 py-3.5">{isBn ? 'পদবি ও দায়িত্ব' : 'Designation & Roles'}</th>
                <th className="px-6 py-3.5">{isBn ? 'লগইন ইমেইল' : 'Login Email'}</th>
                <th className="px-6 py-3.5">{isBn ? 'প্রাথমিক পাসওয়ার্ড' : 'Initial Password'}</th>
                <th className="px-6 py-3.5">{isBn ? 'বরাদ্দকৃত বিষয়' : 'Assigned Courses'}</th>
                <th className="px-6 py-3.5 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-44"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No faculty members found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isBn ? 'উপরের বাটনে ক্লিক করে নতুন শিক্ষক যুক্ত করুন।' : 'Add a new teacher using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const passRevealed = revealedPasswords[teacher.id];
                  const passwordDisplay = teacher.initial_password || 'Teacher@2026';
                  const isRoutine = teacher.additional_designation?.toLowerCase().includes('routine');
                  const isExam = teacher.additional_designation?.toLowerCase().includes('exam');

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {teacher.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                            <p className="text-[11px] text-slate-400">{teacher.phone || teacher.department || 'General'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Designations Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                            {teacher.designation || 'Faculty Member'}
                          </span>
                          {teacher.additional_designation && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isRoutine
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isExam
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {isRoutine && <Calendar size={11} />}
                              {isExam && <Award size={11} />}
                              {teacher.additional_designation}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                          {teacher.email}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-md border border-purple-100">
                            {passRevealed ? passwordDisplay : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(teacher.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                            title={passRevealed ? 'Hide' : 'Reveal'}
                          >
                            {passRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <BookOpen size={12} />
                          <span>{teacher.total_subjects || teacher.assigned_subjects_count || 0} {isBn ? 'টি বিষয়' : 'Subjects'}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Teacher */}
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                            title={isBn ? 'পদবি ও তথ্য সম্পাদন' : 'Edit Profile'}
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Access & Permissions */}
                          <Link
                            href="/dashboard/admin/access-control"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-200"
                            title={isBn ? 'রোল ও পারমিশন কন্ট্রোল' : 'Configure Permissions'}
                          >
                            <ShieldCheck size={14} />
                          </Link>

                          {/* Copy Credentials */}
                          <button
                            onClick={() => handleCopyCredentials(teacher)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                            title="Copy Login Details"
                          >
                            {copiedId === teacher.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span className="hidden sm:inline">{copiedId === teacher.id ? (isBn ? 'কপিকৃত' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                          </button>

                          {/* Print Slip */}
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setSlipModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs transition-colors"
                            title="Print Slip"
                          >
                            <Printer size={13} />
                            <span>{isBn ? 'স্লিপ' : 'Slip'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TEACHER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                <UserPlus size={18} />
                <span>{isBn ? 'নতুন শিক্ষক যুক্ত করুন' : 'Add New Teacher'}</span>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  {isBn ? 'শিক্ষকের পূর্ণ নাম *' : 'Teacher Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isBn ? 'যেমন: মোহাম্মদ শফিকুল ইসলাম' : 'e.g. Md. Shafiqul Islam'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  {isBn ? 'লগইন ইমেইল ঠিকানা *' : 'Login Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="teacher@school.edu.bd"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01711-XXXXXX"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Primary Designation Dropdown */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {isBn ? 'মূল পদবি (Designation) *' : 'Primary Designation *'}
                  </label>
                  <select
                    value={addForm.designation}
                    onChange={(e) => setAddForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-medium"
                  >
                    {STANDARD_DESIGNATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isBn ? d.bn : d.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Designation Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  {isBn ? 'অতিরিক্ত দায়িত্ব (Additional Role / Special Duty)' : 'Additional Role / Special Duty'}
                </label>
                <select
                  value={addForm.additional_designation}
                  onChange={(e) => setAddForm(prev => ({ ...prev, additional_designation: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-medium"
                >
                  <option value="">{isBn ? '-- কোনো অতিরিক্ত দায়িত্ব নেই --' : '-- None --'}</option>
                  {STANDARD_ADDITIONAL_DESIGNATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isBn ? d.bn : d.en}
                    </option>
                  ))}
                  <option value="CUSTOM">{isBn ? '➕ অন্য কোনো দায়িত্ব (নিজে লিখুন)' : '➕ Custom...'}</option>
                </select>

                {addForm.additional_designation === 'CUSTOM' && (
                  <input
                    type="text"
                    value={addForm.custom_additional_designation}
                    onChange={(e) => setAddForm(prev => ({ ...prev, custom_additional_designation: e.target.value }))}
                    placeholder={isBn ? 'কাস্টম দায়িত্ব লিখুন...' : 'Enter custom special role title...'}
                    className="mt-1.5 w-full px-3.5 py-2 bg-indigo-50/40 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-indigo-900"
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    {isBn ? 'প্রাথমিক পাসওয়ার্ড *' : 'Initial Password *'}
                  </label>
                  <span className="text-[10px] text-purple-600 font-medium">
                    {isBn ? 'প্রিন্ট স্লিপে প্রদর্শিত হবে' : 'Will appear on credential slip'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={addForm.initial_password}
                  onChange={(e) => setAddForm(prev => ({ ...prev, initial_password: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono font-bold text-indigo-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingTeacher}
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {savingTeacher ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'যুক্ত ও স্লিপ প্রিন্ট করুন' : 'Save & Print Slip')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Edit3 size={18} />
                <span>{isBn ? 'শিক্ষকের পদবি ও তথ্য সম্পাদন' : 'Edit Faculty Profile & Designation'}</span>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTeacher} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">{isBn ? 'নাম' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isBn ? 'ফোন নম্বর' : 'Phone'}</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isBn ? 'মূল পদবি' : 'Primary Designation'}</label>
                  <select
                    value={editForm.designation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"
                  >
                    {STANDARD_DESIGNATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isBn ? d.bn : d.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  {isBn ? 'অতিরিক্ত পদবি / বিশেষ দায়িত্ব' : 'Additional Role / Special Duty'}
                </label>
                <select
                  value={editForm.additional_designation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, additional_designation: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"
                >
                  <option value="">{isBn ? '-- কোনো অতিরিক্ত দায়িত্ব নেই --' : '-- None --'}</option>
                  {STANDARD_ADDITIONAL_DESIGNATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isBn ? d.bn : d.en}
                    </option>
                  ))}
                  <option value="CUSTOM">{isBn ? '➕ অন্য কোনো দায়িত্ব (নিজে লিখুন)' : '➕ Custom...'}</option>
                </select>

                {editForm.additional_designation === 'CUSTOM' && (
                  <input
                    type="text"
                    value={editForm.custom_additional_designation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, custom_additional_designation: e.target.value }))}
                    placeholder={isBn ? 'কাস্টম দায়িত্ব লিখুন...' : 'Enter custom special role title...'}
                    className="mt-1.5 w-full px-3.5 py-2 bg-blue-50/40 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {savingEdit ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'আপডেট করুন' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIAL SLIP MODAL */}
      {slipModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                <KeyRound size={18} />
                <span>{isBn ? 'শিক্ষক পোর্টাল লগইন স্লিপ' : 'Teacher Portal Login Slip'}</span>
              </div>
              <button
                onClick={() => setSlipModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div id="printable-credential-slip" className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5 text-xs font-mono">
              <div className="text-center font-sans font-bold text-sm text-purple-900 border-b border-purple-100 pb-2">
                {user?.institution?.name || 'School Name'}
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-500">{isBn ? 'শিক্ষকের নাম:' : 'Teacher:'}</span>
                <span className="font-bold text-slate-800">{selectedTeacher.name}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-500">{isBn ? 'পদবি:' : 'Designation:'}</span>
                <span className="font-bold text-indigo-700">
                  {selectedTeacher.designation || 'Faculty Member'}
                  {selectedTeacher.additional_designation ? ` (${selectedTeacher.additional_designation})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isBn ? 'লগইন ইমেইল:' : 'Login Email:'}</span>
                <span className="font-bold text-purple-700">{selectedTeacher.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isBn ? 'পাসওয়ার্ড:' : 'Password:'}</span>
                <span className="font-bold text-purple-700">{selectedTeacher.initial_password || 'Teacher@2026'}</span>
              </div>
              <div className="pt-2 border-t border-purple-100 flex flex-col font-sans">
                <span className="text-[10px] text-slate-400">{isBn ? 'পোর্টাল লিংক:' : 'Portal URL:'}</span>
                <span className="text-[10px] text-blue-600 font-mono break-all">{teacherPortalUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleCopyCredentials(selectedTeacher)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                {copiedId === selectedTeacher.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedId === selectedTeacher.id ? (isBn ? 'কপিকৃত' : 'Copied') : (isBn ? 'তথ্য কপি করুন' : 'Copy Credentials')}</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedTeacher) return;
                  printCredentialSlip({
                    staff: selectedTeacher,
                    institution: user?.institution,
                    portalUrl: teacherPortalUrl,
                    isBn
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                <Printer size={14} />
                <span>{isBn ? 'স্লিপ প্রিন্ট' : 'Print Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
