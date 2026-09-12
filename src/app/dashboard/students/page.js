'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import {
  Users, UserPlus, FileText, Search, Filter,
  KeyRound, CheckCircle2, Copy, X, Phone,
  ShieldCheck, AlertCircle, Sparkles, ChevronRight, BookOpen,
  Eye, EyeOff, Edit, Save, RefreshCw, Lock, UserCheck, Calendar, MapPin,
  Camera, UploadCloud, Trash2, Loader2
} from 'lucide-react';
import { uploadToImageKit } from '@/lib/upload';

const getPhotoSrc = (val) => {
  if (!val) return '';
  if (typeof val === 'object') return val.url || val.secure_url || '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[object Object]') return '';
    if (trimmed.startsWith('{') && trimmed.includes('"url"')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.url || parsed.secure_url || '';
      } catch (e) {
        return '';
      }
    }
    return trimmed;
  }
  return '';
};

function StudentsDirectoryContent() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('class_id') || '';

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Password Reset Result Modal
  const [passwordModal, setPasswordModal] = useState(null);

  // Student Profile Detail Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState(null);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    student_id: '',
    password: '',
    class_id: '',
    section_id: '',
    roll_number: '',
    gender: 'MALE',
    dob: '',
    blood_group: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Parent',
    address: '',
    status: 'ENROLLED',
    photo_url: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Keep selectedClass synced if URL param changes
  useEffect(() => {
    if (initialClassId) {
      setSelectedClass(initialClassId);
    }
  }, [initialClassId]);

  const fetchFilters = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/sections')
      ]);
      setClasses(cRes.data.data || []);
      setSections(sRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        class_id: selectedClass || undefined,
        section_id: selectedSection || undefined,
        search: searchQuery || undefined
      };
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection, searchQuery, page]);

  const filteredSections = sections.filter(s => s.class_id === selectedClass);
  const activeClassObj = classes.find(c => c.id === selectedClass);
  const editModalSections = sections.filter(s => s.class_id === editFormData.class_id);

  // Handle Password Reset
  const handleResetPassword = async (student) => {
    if (!confirm(isBn ? `আপনি কি "${student.name}" এর স্টুডেন্ট পোর্টাল পাসওয়ার্ড রিসেট করতে চান?` : `Reset portal password for "${student.name}"?`)) return;
    try {
      const res = await api.post(`/students/${student.id}/reset-password`);
      const newPass = res.data.data.newPassword;
      setPasswordModal(res.data.data);
      
      // Update locally
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, initial_password: newPass } : s));
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(prev => ({ ...prev, initial_password: newPass }));
      }
      toast.success(isBn ? 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে' : 'Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  // Quick Change Password from Details Modal
  const handleQuickUpdatePassword = async () => {
    if (!newPasswordInput.trim()) return;
    try {
      setUpdatingPassword(true);
      const passToSet = newPasswordInput.trim();
      await api.put(`/students/${selectedStudent.id}`, { password: passToSet });
      
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, initial_password: passToSet } : s));
      setSelectedStudent(prev => ({ ...prev, initial_password: passToSet }));
      setIsChangingPassword(false);
      setShowPassword(true);
      toast.success(isBn ? 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!' : 'Password saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name || '',
      student_id: student.student_id || '',
      password: '',
      class_id: student.class_id || '',
      section_id: student.section_id || '',
      roll_number: student.roll_number || '',
      gender: student.gender || 'MALE',
      dob: student.dob ? student.dob.slice(0, 10) : '',
      blood_group: student.blood_group || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_relation: student.guardian_relation || 'Parent',
      address: student.address || '',
      status: student.status || 'ENROLLED',
      photo_url: student.photo_url || ''
    });
  };

  const handleEditPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(isBn ? 'অনুগ্রহ করে ইমেজ ফাইল নির্বাচন করুন' : 'Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে' : 'Image size must be less than 5MB');
      return;
    }
    try {
      setUploadingEditPhoto(true);
      const res = await uploadToImageKit(file, 'students', `student_${editingStudent?.id || Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setEditFormData(prev => ({ ...prev, photo_url: cleanUrl }));
      toast.success(isBn ? 'ছবি আপলোড সম্পন্ন হয়েছে!' : 'Photo uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingEditPhoto(false);
    }
  };

  // Save Edit Student
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error(isBn ? 'শিক্ষার্থীর নাম আবশ্যক' : 'Student name is required');
      return;
    }
    if (!editFormData.student_id.trim()) {
      toast.error(isBn ? 'স্টুডেন্ট আইডি আবশ্যক' : 'Student ID is required');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await api.put(`/students/${editingStudent.id}`, editFormData);
      const updated = res.data.data;
      const targetClassName = classes.find(c => c.id === updated.class_id)?.name || editingStudent.class_name;
      const targetSectionName = sections.find(s => s.id === updated.section_id)?.name || '';

      const fullyUpdated = {
        ...editingStudent,
        ...updated,
        photo_url: updated.photo_url || editFormData.photo_url,
        class_name: targetClassName,
        section_name: targetSectionName,
        initial_password: editFormData.password.trim() ? editFormData.password.trim() : (updated.initial_password || editingStudent.initial_password)
      };

      // Update in table
      setStudents(prev => prev.map(s => s.id === updated.id ? fullyUpdated : s));

      // Update details modal if open
      if (selectedStudent && selectedStudent.id === updated.id) {
        setSelectedStudent(fullyUpdated);
      }

      setEditingStudent(null);
      toast.success(isBn ? 'শিক্ষার্থীর সকল তথ্য ও ক্রেডেনশিয়াল আপডেট হয়েছে!' : 'Student details & credentials updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSavingEdit(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${isBn ? 'কপি হয়েছে!' : 'copied to clipboard!'}`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isBn ? 'শিক্ষার্থী তালিকা ও ডিরেক্টরি' : 'Student Directory & Roster'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn
              ? 'সকল শ্রেণির শিক্ষার্থী তালিকা, আইডি-পাসওয়ার্ড এবং পূর্ণাঙ্গ তথ্য পরিচালনা'
              : 'Browse students, manage portal credentials (ID & password), and edit records'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/students/bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <FileText size={15} className="text-blue-600" />
            {isBn ? 'মাল্টি-ক্লাস বাল্ক ইমপোর্ট' : 'Bulk CSV Import'}
          </Link>

          <Link
            href={selectedClass ? `/dashboard/students/admit?class_id=${selectedClass}` : '/dashboard/students/admit'}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus size={15} />
            {isBn
              ? (activeClassObj ? `+ ${activeClassObj.name} এ ভর্তি` : '+ নতুন ভর্তি')
              : (activeClassObj ? `+ Admit to ${activeClassObj.name}` : '+ Admit Student')}
          </Link>
        </div>
      </div>

      {/* QUICK CLASS FILTER PILLS (Classes 1-10) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen size={13} className="text-blue-600" />
            {isBn ? 'শ্রেণিভিত্তিক ফিল্টার (Classes 1 - 10)' : 'Select Class Cohort (Classes 1 - 10)'}
          </span>
          {selectedClass && (
            <button
              onClick={() => { setSelectedClass(''); setSelectedSection(''); setPage(1); }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              {isBn ? 'সব শ্রেণি দেখুন' : 'View All Classes'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => { setSelectedClass(''); setSelectedSection(''); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              !selectedClass
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            {isBn ? 'সকল শ্রেণি' : 'All Classes'}
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${!selectedClass ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {total}
            </span>
          </button>

          {classes.map((cls) => {
            const isSelected = selectedClass === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClass(cls.id);
                  setSelectedSection('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {cls.name}
                {parseInt(cls.student_count) > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {cls.student_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Section Filter */}
          {selectedClass && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{isBn ? 'সেকশন:' : 'Section:'}</span>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:border-blue-600"
              >
                <option value="">{isBn ? 'সকল সেকশন' : 'All Sections'}</option>
                {filteredSections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeClassObj && (
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              {activeClassObj.name} {selectedSection ? `• ${filteredSections.find(s => s.id === selectedSection)?.name}` : ''}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isBn ? 'নাম, স্টুডেন্ট আইডি বা রোল খুঁজুন...' : 'Search name, student ID, roll...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            {isBn ? 'শিক্ষার্থী তালিকা লোড হচ্ছে...' : 'Loading students directory...'}
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">
              {activeClassObj
                ? (isBn ? `"${activeClassObj.name}" এ এখনও কোনো শিক্ষার্থী ভর্তি হয়নি` : `No students enrolled in ${activeClassObj.name} yet`)
                : (isBn ? 'কোন শিক্ষার্থী পাওয়া যায়নি' : 'No students found')}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeClassObj ? (
                <Link
                  href={`/dashboard/students/admit?class_id=${activeClassObj.id}`}
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
                >
                  {isBn ? `+ ${activeClassObj.name} এ প্রথম শিক্ষার্থী ভর্তি করুন` : `+ Admit first student into ${activeClassObj.name}`}
                </Link>
              ) : (
                <Link
                  href="/dashboard/students/admit"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
                >
                  {isBn ? '+ নতুন শিক্ষার্থী ভর্তি করুন' : '+ Admit New Student'}
                </Link>
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">{isBn ? 'শিক্ষার্থী ও আইডি' : 'Student & ID'}</th>
                  <th className="py-3 px-5">{isBn ? 'শ্রেণি ও সেকশন' : 'Class & Section'}</th>
                  <th className="py-3 px-5">{isBn ? 'রোল' : 'Roll'}</th>
                  <th className="py-3 px-5">{isBn ? 'অভিভাবকের যোগাযোগ' : 'Guardian Contact'}</th>
                  <th className="py-3 px-5">{isBn ? 'লগইন পাসওয়ার্ড' : 'Portal Password'}</th>
                  <th className="py-3 px-5">{isBn ? 'স্থিতি' : 'Status'}</th>
                  <th className="py-3 px-5 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {getPhotoSrc(stu.photo_url) ? (
                          <img
                            src={getPhotoSrc(stu.photo_url)}
                            alt={stu.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {stu.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{stu.name}</p>
                          <span className="inline-block font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold mt-0.5">
                            {stu.student_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => setSelectedClass(stu.class_id)}
                        className="font-bold text-slate-800 hover:text-blue-600 text-left block"
                      >
                        {stu.class_name}
                      </button>
                      <p className="text-xs text-slate-500">{stu.section_name || 'No Section'}</p>
                    </td>

                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-700">
                      {stu.roll_number || '—'}
                    </td>

                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{stu.guardian_name || '—'}</p>
                      {stu.guardian_phone && (
                        <p className="text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-slate-400" />
                          {stu.guardian_phone}
                        </p>
                      )}
                    </td>

                    {/* Quick Portal Password Hint in Table */}
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-mono font-semibold border border-amber-200/60">
                        <Lock size={11} className="text-amber-600" />
                        {stu.initial_password || 'Stu@2026'}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        {stu.status || 'ENROLLED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Full Profile & Credentials */}
                        <button
                          onClick={() => {
                            setSelectedStudent(stu);
                            setShowPassword(false);
                            setIsChangingPassword(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          title="View Details & Credentials"
                        >
                          <Eye size={13} />
                          <span className="hidden sm:inline">{isBn ? 'বিস্তারিত ও পাসওয়ার্ড' : 'Details & Pass'}</span>
                        </button>

                        {/* Edit Student Info & ID */}
                        <button
                          onClick={() => handleOpenEditModal(stu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Edit Student Info & ID"
                        >
                          <Edit size={13} />
                          <span className="hidden sm:inline">{isBn ? 'এডিট' : 'Edit'}</span>
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(stu)}
                          className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                          title={isBn ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
                        >
                          <KeyRound size={14} />
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

      {/* PASSWORD RESET RESULT MODAL */}
      {passwordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound size={16} />
                </div>
                <h3 className="font-bold text-slate-900">{isBn ? 'নতুন পাসওয়ার্ড প্রস্তুত' : 'Password Reset Complete'}</h3>
              </div>
              <button onClick={() => setPasswordModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {isBn
                ? `শিক্ষার্থী "${passwordModal.name}" (${passwordModal.studentId}) এর জন্য নতুন সিকিউর পাসওয়ার্ড প্রস্তুত হয়েছে:`
                : `New login password generated for student "${passwordModal.name}" (${passwordModal.studentId}):`}
            </p>

            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {isBn ? 'নতুন পাসওয়ার্ড' : 'New Security Password'}
                </p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                  {passwordModal.newPassword}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(passwordModal.newPassword, 'Password')}
                className="p-2 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors"
                title="Copy Password"
              >
                <Copy size={18} />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPasswordModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                {isBn ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS & CREDENTIALS MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{isBn ? 'শিক্ষার্থীর প্রোফাইল ও ক্রেডেনশিয়াল' : 'Student Profile & Credentials'}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setIsChangingPassword(false);
                  setShowPassword(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Top Identity Card */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {getPhotoSrc(selectedStudent.photo_url) ? (
                <img
                  src={getPhotoSrc(selectedStudent.photo_url)}
                  alt={selectedStudent.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-xl font-bold flex items-center justify-center shadow-sm shrink-0">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">{selectedStudent.name}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                    {selectedStudent.status || 'ENROLLED'}
                  </span>
                </div>
                <p className="text-xs font-mono font-semibold text-blue-600 mt-0.5">ID: {selectedStudent.student_id}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudent.class_name} • {selectedStudent.section_name || 'No Section'} • Roll: {selectedStudent.roll_number || 'N/A'}
                </p>
              </div>
            </div>

            {/* STUDENT PORTAL CREDENTIALS CARD */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Lock size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    {isBn ? 'স্টুডেন্ট পোর্টাল লগইন ক্রেডেনশিয়াল' : 'Student Portal Credentials'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  {isBn ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Account'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Student ID / Username */}
                <div className="p-2.5 bg-white rounded-xl border border-amber-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{isBn ? 'স্টুডেন্ট আইডি / ইউজার' : 'Student ID / User'}</p>
                    <p className="font-mono font-bold text-slate-900 text-sm">{selectedStudent.student_id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedStudent.student_id, 'Student ID')}
                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Copy Student ID"
                  >
                    <Copy size={15} />
                  </button>
                </div>

                {/* Password */}
                <div className="p-2.5 bg-white rounded-xl border border-amber-200/70 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{isBn ? 'লগইন পাসওয়ার্ড' : 'Portal Password'}</p>
                    <p className="font-mono font-bold text-slate-900 text-sm truncate">
                      {showPassword ? (selectedStudent.initial_password || 'Stu@2026') : '••••••••'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedStudent.initial_password || 'Stu@2026', 'Password')}
                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Copy Password"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Change Password Inline */}
              {isChangingPassword ? (
                <div className="pt-2.5 border-t border-amber-200/60 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    {isBn ? 'নতুন পাসওয়ার্ড টাইপ করুন:' : 'Enter New Password:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder={isBn ? 'উদা: Stu@9876' : 'e.g. Stu@9876'}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const random = Math.floor(1000 + Math.random() * 9000);
                        setNewPasswordInput(`Stu@${random}`);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl"
                    >
                      🎲 {isBn ? 'র‌্যান্ডম' : 'Random'}
                    </button>
                    <button
                      type="button"
                      disabled={updatingPassword || !newPasswordInput.trim()}
                      onClick={handleQuickUpdatePassword}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                    >
                      <Save size={13} />
                      {isBn ? 'সেভ' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsChangingPassword(false); setNewPasswordInput(''); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(true);
                      const random = Math.floor(1000 + Math.random() * 9000);
                      setNewPasswordInput(`Stu@${random}`);
                    }}
                    className="text-amber-800 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <KeyRound size={12} />
                    {isBn ? '🔑 পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetPassword(selectedStudent)}
                    className="text-slate-500 hover:text-slate-800 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    {isBn ? 'স্বয়ংক্রিয় নতুন পাসওয়ার্ড রিসেট' : 'Auto Reset'}
                  </button>
                </div>
              )}
            </div>

            {/* Academic & Personal Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'শ্রেণি' : 'Class'}</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedStudent.class_name}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'সেকশন' : 'Section'}</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedStudent.section_name || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'রোল' : 'Roll'}</span>
                <span className="font-bold text-slate-800 mt-0.5 block font-mono">{selectedStudent.roll_number || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'লিঙ্গ' : 'Gender'}</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedStudent.gender || 'MALE'}</span>
              </div>
            </div>

            {/* Guardian & Contact */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'অভিভাবকের নাম' : 'Guardian Name'}</span>
                  <span className="font-bold text-slate-800">{selectedStudent.guardian_name || '—'} ({selectedStudent.guardian_relation || 'Parent'})</span>
                </div>
                {selectedStudent.guardian_phone && (
                  <div className="text-right">
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'ফোন' : 'Phone'}</span>
                    <span className="font-mono font-bold text-blue-600">{selectedStudent.guardian_phone}</span>
                  </div>
                )}
              </div>

              {selectedStudent.address && (
                <div className="pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">{isBn ? 'ঠিকানা' : 'Address'}</span>
                  <p className="text-slate-700 mt-0.5">{selectedStudent.address}</p>
                </div>
              )}
            </div>

            {/* Footer with Edit Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleOpenEditModal(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Edit size={14} />
                {isBn ? '✏️ শিক্ষার্থীর তথ্য ও আইডি পরিবর্তন করুন' : '✏️ Edit Student Info & ID'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setIsChangingPassword(false);
                  setShowPassword(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT & CREDENTIALS MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Edit size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? 'শিক্ষার্থীর তথ্য ও ক্রেডেনশিয়াল সম্পাদনা' : 'Edit Student Details & Credentials'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'আইডি, পাসওয়ার্ড, রোল, শ্রেণি ও অন্যান্য তথ্য যেকোনো সময় পরিবর্তন করতে পারবেন।' : 'Modify ID, password, roll, class, and profile info at any time.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Student Photo Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                <div className="relative shrink-0">
                  {editFormData.photo_url ? (
                    <div className="relative group">
                      <img
                        src={getPhotoSrc(editFormData.photo_url)}
                        alt="Student"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, photo_url: '' }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 shadow-xs"
                        title={isBn ? 'ছবি সরান' : 'Remove'}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={20} className="text-slate-300" />
                      <span className="text-[9px] mt-0.5">{isBn ? 'ছবি নেই' : 'No Photo'}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {isBn ? 'শিক্ষার্থীর ছবি' : 'Student Photo'}
                    </span>
                    {editFormData.photo_url && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.2 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> ImageKit
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isBn ? 'ImageKit ক্লাউডে আপলোড হবে (JPG/PNG সর্বোচ্চ ৫MB)' : 'Uploaded to ImageKit Cloud (JPG/PNG max 5MB)'}
                  </p>
                  <div>
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs ${
                      uploadingEditPhoto
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}>
                      {uploadingEditPhoto ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-blue-600" />
                          <span>{isBn ? 'আপলোড হচ্ছে...' : 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={12} className="text-blue-600" />
                          <span>{editFormData.photo_url ? (isBn ? 'ছবি পরিবর্তন করুন' : 'Change Photo') : (isBn ? 'ছবি আপলোড করুন' : 'Upload Photo')}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        disabled={uploadingEditPhoto}
                        onChange={handleEditPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="p-4 bg-amber-500/10 border border-amber-200/80 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  🔑 {isBn ? 'স্টুডেন্ট পোর্টাল ক্রেডেনশিয়াল পরিবর্তন' : 'Student Portal Credentials'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isBn ? 'স্টুডেন্ট আইডি (ইউজারনেম)' : 'Student ID (Username)'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.student_id}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, student_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:outline-hidden focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isBn ? 'আইডি পরিবর্তন করলে স্টুডেন্ট পোর্টালের লগইন ইউজারও পরিবর্তন হবে।' : 'Changing ID updates portal login username.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isBn ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'New Password (Optional)'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={isBn ? 'অপরিবর্তিত রাখতে খালি রাখুন' : 'Leave blank to keep current'}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const random = Math.floor(1000 + Math.random() * 9000);
                          setEditFormData(prev => ({ ...prev, password: `Stu@${random}` }));
                        }}
                        className="px-2.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl whitespace-nowrap"
                        title="Generate Random Password"
                      >
                        🎲 {isBn ? 'র‌্যান্ডম' : 'Random'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শিক্ষার্থীর পূর্ণ নাম' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'স্থিতি (Status)' : 'Status'}
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="ENROLLED">{isBn ? 'ভর্তিকৃত (ENROLLED)' : 'ENROLLED'}</option>
                    <option value="SUSPENDED">{isBn ? 'সাময়িক স্থগিত (SUSPENDED)' : 'SUSPENDED'}</option>
                    <option value="TRANSFERRED">{isBn ? 'ছাড়পত্র প্রাপ্ত (TRANSFERRED)' : 'TRANSFERRED'}</option>
                    <option value="GRADUATED">{isBn ? 'উত্তীর্ণ (GRADUATED)' : 'GRADUATED'}</option>
                  </select>
                </div>
              </div>

              {/* Class, Section, Roll */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'শ্রেণি' : 'Class'} *
                  </label>
                  <select
                    required
                    value={editFormData.class_id}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setEditFormData(prev => ({ ...prev, class_id: cid, section_id: '' }));
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
                    value={editFormData.section_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, section_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? 'কোন সেকশন নেই' : 'No Section'}</option>
                    {editModalSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'রোল নম্বর' : 'Roll Number'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.roll_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="MALE">{isBn ? 'ছাত্র (MALE)' : 'MALE'}</option>
                    <option value="FEMALE">{isBn ? 'ছাত্রী (FEMALE)' : 'FEMALE'}</option>
                    <option value="OTHER">{isBn ? 'অন্যান্য (OTHER)' : 'OTHER'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  </label>
                  <select
                    value={editFormData.blood_group}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, blood_group: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">{isBn ? 'অজানা' : 'Unknown'}</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'অভিভাবকের নাম' : 'Guardian Name'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.guardian_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isBn ? 'অভিভাবকের ফোন' : 'Guardian Phone'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.guardian_phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {isBn ? 'বর্তমান ঠিকানা' : 'Address'}
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  <Save size={14} />
                  {savingEdit
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsDirectoryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading student directory...</div>}>
      <StudentsDirectoryContent />
    </Suspense>
  );
}
