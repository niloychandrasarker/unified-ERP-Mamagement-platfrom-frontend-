'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import { uploadToImageKit } from '@/lib/upload';
import {
  User, Building2, Camera, UploadCloud, Trash2, CheckCircle2,
  ShieldCheck, Lock, Phone, MapPin, Mail, Sparkles, Loader2,
  Save, School, KeyRound, BookOpen, AlertCircle, Copy
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'INSTITUTION_ADMIN';

  // Common Loading & Active Tab
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(isStudent ? 'personal' : 'admin');

  // ==========================================
  // STUDENT PROFILE STATE
  // ==========================================
  const [studentData, setStudentData] = useState({
    name: '',
    student_id: '',
    class_name: '',
    section_name: '',
    roll_number: '',
    gender: '',
    dob: '',
    blood_group: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Father',
    address: '',
    photo_url: '',
    new_password: ''
  });
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);

  // ==========================================
  // ADMIN / STAFF / USER PROFILE STATE
  // ==========================================
  const [userProfileData, setUserProfileData] = useState({
    name: '',
    email: '',
    avatar_url: '',
    password: ''
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ==========================================
  // INSTITUTION BRANDING STATE (ADMIN ONLY)
  // ==========================================
  const [institutionData, setInstitutionData] = useState({
    name: '',
    eiin_number: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
    banner_url: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!user) return;

    setUserProfileData({
      name: user.name || '',
      email: user.email || '',
      avatar_url: user.avatar_url || '',
      password: ''
    });

    if (user.institution) {
      setInstitutionData({
        name: user.institution.name || '',
        eiin_number: user.institution.eiin_number || '',
        address: user.institution.address || '',
        phone: user.institution.phone || '',
        email: user.institution.email || '',
        logo: user.institution.logo || '',
        banner_url: user.institution.banner_url || ''
      });
    }

    if (isStudent) {
      const fetchStudentProfile = async () => {
        try {
          setLoadingData(true);
          const res = await api.get('/students/me');
          const stu = res.data.data;
          setStudentData({
            name: stu.name || '',
            student_id: stu.student_id || '',
            class_name: stu.class_name || '',
            section_name: stu.section_name || '',
            roll_number: stu.roll_number || '',
            gender: stu.gender || 'MALE',
            dob: stu.dob ? stu.dob.slice(0, 10) : '',
            blood_group: stu.blood_group || '',
            guardian_name: stu.guardian_name || '',
            guardian_phone: stu.guardian_phone || '',
            guardian_relation: stu.guardian_relation || 'Father',
            address: stu.address || '',
            photo_url: stu.photo_url || user.avatar_url || '',
            new_password: ''
          });
        } catch (err) {
          // Fallback to user.student if available
          if (user.student) {
            const stu = user.student;
            setStudentData({
              name: stu.name || user.name || '',
              student_id: stu.student_id || '',
              class_name: stu.class_name || '',
              section_name: stu.section_name || '',
              roll_number: stu.roll_number || '',
              gender: stu.gender || 'MALE',
              dob: stu.dob ? stu.dob.slice(0, 10) : '',
              blood_group: stu.blood_group || '',
              guardian_name: stu.guardian_name || '',
              guardian_phone: stu.guardian_phone || '',
              guardian_relation: stu.guardian_relation || 'Father',
              address: stu.address || '',
              photo_url: stu.photo_url || user.avatar_url || '',
              new_password: ''
            });
          }
        } finally {
          setLoadingData(false);
        }
      };
      fetchStudentProfile();
    }
  }, [user, isStudent]);

  // Safe image URL resolver helper
  const getPhotoSrc = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.url || val.thumbnailUrl || '';
    if (typeof val === 'string') {
      if (val.startsWith('{') && val.includes('"url"')) {
        try {
          const parsed = JSON.parse(val);
          return parsed.url || parsed.thumbnailUrl || '';
        } catch (e) {
          return val;
        }
      }
      return val;
    }
    return '';
  };

  // ==========================================
  // STUDENT PHOTO UPLOAD HANDLER
  // ==========================================
  const handleStudentPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(isBn ? 'অনুগ্রহ করে ইমেজ ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? 'ছবি সর্বোচ্চ ৫MB হতে পারবে' : 'Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingStudentPhoto(true);
      const res = await uploadToImageKit(file, 'students', `student_${user?.id || Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setStudentData(prev => ({ ...prev, photo_url: cleanUrl }));
      toast.success(isBn ? 'ছবি আপলোড সম্পন্ন হয়েছে!' : 'Photo uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setUploadingStudentPhoto(false);
    }
  };

  // ==========================================
  // ADMIN AVATAR UPLOAD HANDLER
  // ==========================================
  const handleAdminAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(isBn ? 'অনুগ্রহ করে ইমেজ ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? 'ছবি সর্বোচ্চ ৫MB হতে পারবে' : 'Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await uploadToImageKit(file, 'avatars', `avatar_${user?.id || Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setUserProfileData(prev => ({ ...prev, avatar_url: cleanUrl }));
      toast.success(isBn ? 'প্রোফাইল ছবি আপলোড সম্পন্ন হয়েছে!' : 'Avatar uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ==========================================
  // INSTITUTION LOGO UPLOAD HANDLER
  // ==========================================
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await uploadToImageKit(file, 'institutions', `logo_${user?.institution?.id || Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setInstitutionData(prev => ({ ...prev, logo: cleanUrl }));
      toast.success(isBn ? 'লোগো সফলভাবে আপলোড হয়েছে!' : 'Logo uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ==========================================
  // INSTITUTION BANNER UPLOAD HANDLER
  // ==========================================
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const res = await uploadToImageKit(file, 'institutions', `banner_${user?.institution?.id || Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setInstitutionData(prev => ({ ...prev, banner_url: cleanUrl }));
      toast.success(isBn ? 'ক্যাম্পাস ব্যানার আপলোড সম্পন্ন হয়েছে!' : 'Campus banner uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Banner upload failed');
    } finally {
      setUploadingBanner(false);
    }
  };

  // ==========================================
  // SAVE STUDENT PROFILE
  // ==========================================
  const handleSaveStudentProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // 1. Update student self profile
      await api.patch('/students/me', {
        name: studentData.name,
        dob: studentData.dob || null,
        blood_group: studentData.blood_group || null,
        guardian_name: studentData.guardian_name || null,
        guardian_phone: studentData.guardian_phone || null,
        guardian_relation: studentData.guardian_relation || 'Father',
        address: studentData.address || null,
        photo_url: studentData.photo_url || null
      });

      // 2. If new password provided, update user auth profile
      if (studentData.new_password && studentData.new_password.trim()) {
        await api.patch('/auth/profile', {
          password: studentData.new_password.trim()
        });
        setStudentData(prev => ({ ...prev, new_password: '' }));
      }

      await refreshUser();
      toast.success(isBn ? 'আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Student profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SAVE ADMIN USER ACCOUNT
  // ==========================================
  const handleSaveAdminAccount = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: userProfileData.name,
        avatar_url: userProfileData.avatar_url || null
      };
      if (userProfileData.password && userProfileData.password.trim()) {
        payload.password = userProfileData.password.trim();
      }

      await api.patch('/auth/profile', payload);
      await refreshUser();
      setUserProfileData(prev => ({ ...prev, password: '' }));
      toast.success(isBn ? 'আপনার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SAVE INSTITUTION BRANDING & DETAILS
  // ==========================================
  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/institutions/profile', {
        name: institutionData.name,
        address: institutionData.address,
        phone: institutionData.phone,
        email: institutionData.email,
        logo: institutionData.logo || null,
        banner_url: institutionData.banner_url || null
      });

      await refreshUser();
      toast.success(isBn ? 'প্রতিষ্ঠানের তথ্য ও ব্র্যান্ডিং সফলভাবে সংরক্ষিত হয়েছে!' : 'Institution profile & branding updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update institution');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${isBn ? 'কপি হয়েছে!' : 'copied!'}`);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isStudent
              ? (isBn ? 'আমার প্রোফাইল ও সেটিংস' : 'My Student Profile')
              : (isBn ? 'প্রোফাইল ও প্রাতিষ্ঠানিক সেটিংস' : 'Profile & Account Settings')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isStudent
              ? (isBn ? 'আপনার ব্যক্তিগত তথ্য, ছবি এবং অভিভাবকের বিবরণ পরিচালনা করুন।' : 'Manage your personal profile, student photo, and contact details.')
              : (isBn ? 'অ্যাডমিন প্রোফাইল এবং শিক্ষা প্রতিষ্ঠানের ব্র্যান্ডিং ও লোগো পরিচালনা।' : 'Manage admin credentials, campus branding, logo, and banner.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-600" />
            {user.role}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDENT VIEW                                                           */}
      {/* ========================================================================= */}
      {isStudent && (
        <div className="space-y-6">
          {/* Student Identity Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo Avatar with ImageKit Upload */}
              <div className="relative group shrink-0">
                {studentData.photo_url ? (
                  <img
                    src={getPhotoSrc(studentData.photo_url)}
                    alt={studentData.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white/20 shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-blue-600/30 border-4 border-white/10 flex flex-col items-center justify-center text-white/80 shadow-inner">
                    <User size={48} className="text-blue-300" />
                    <span className="text-[10px] font-semibold mt-1 text-blue-200">{isBn ? 'ছবি নেই' : 'No Photo'}</span>
                  </div>
                )}

                {/* Overlay upload button */}
                <label className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200">
                  {uploadingStudentPhoto ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : (
                    <>
                      <Camera size={24} className="text-white" />
                      <span className="text-[11px] font-bold text-white mt-1">
                        {isBn ? 'ছবি পরিবর্তন' : 'Change Photo'}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    disabled={uploadingStudentPhoto}
                    onChange={handleStudentPhotoUpload}
                    className="hidden"
                  />
                </label>

                {studentData.photo_url && (
                  <button
                    type="button"
                    onClick={() => setStudentData(prev => ({ ...prev, photo_url: '' }))}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-colors"
                    title={isBn ? 'ছবি মুছে ফেলুন' : 'Remove Photo'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Student Metadata */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{studentData.name || user.name}</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold rounded-full">
                    ● Enrolled
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(studentData.student_id, 'Student ID')}
                    className="px-3 py-1 bg-white/10 hover:bg-white/15 text-blue-200 text-xs font-mono font-bold rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <span>ID: {studentData.student_id || '—'}</span>
                    <Copy size={12} className="opacity-70" />
                  </button>

                  <span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-bold rounded-xl border border-white/10">
                    {studentData.class_name || 'Class'} {studentData.section_name ? `• ${studentData.section_name}` : ''}
                  </span>

                  <span className="px-3 py-1 bg-white/10 text-amber-300 text-xs font-mono font-bold rounded-xl border border-white/10">
                    Roll: {studentData.roll_number || '—'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <School size={14} className="text-blue-400 shrink-0" />
                  <span>{user.institution?.name || 'Unified Education Management Platform'}</span>
                </p>

                {/* Photo upload action button */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md transition-colors">
                    {uploadingStudentPhoto ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{isBn ? 'ছবি আপলোড হচ্ছে...' : 'Uploading to ImageKit...'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>{studentData.photo_url ? (isBn ? 'নতুন ছবি আপলোড করুন' : 'Change Profile Photo') : (isBn ? 'ছবি আপলোড করুন' : 'Upload Student Photo')}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      disabled={uploadingStudentPhoto}
                      onChange={handleStudentPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Student Editable Form */}
          <form onSubmit={handleSaveStudentProfile} className="space-y-6">
            {/* Section 1: Personal Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <User size={16} className="text-blue-600" />
                {isBn ? 'ব্যক্তিগত বিবরণ' : 'Personal Information'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'আপনার পূর্ণ নাম' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentData.name}
                    onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'স্টুডেন্ট আইডি (অপরিবর্তনীয়)' : 'Student ID (Permanent)'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={studentData.student_id}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={studentData.dob}
                    onChange={(e) => setStudentData({ ...studentData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  </label>
                  <select
                    value={studentData.blood_group}
                    onChange={(e) => setStudentData({ ...studentData, blood_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={studentData.gender}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Guardian & Contact Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck size={16} className="text-blue-600" />
                {isBn ? 'অভিভাবক ও যোগাযোগের তথ্য' : 'Guardian & Contact Details'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'অভিভাবকের নাম' : 'Guardian Name'}
                  </label>
                  <input
                    type="text"
                    value={studentData.guardian_name}
                    onChange={(e) => setStudentData({ ...studentData, guardian_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'অভিভাবকের ফোন নম্বর' : 'Guardian Phone'}
                  </label>
                  <input
                    type="tel"
                    value={studentData.guardian_phone}
                    onChange={(e) => setStudentData({ ...studentData, guardian_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'সম্পর্ক' : 'Relationship'}
                  </label>
                  <select
                    value={studentData.guardian_relation}
                    onChange={(e) => setStudentData({ ...studentData, guardian_relation: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                  >
                    <option value="Father">{isBn ? 'পিতা (Father)' : 'Father'}</option>
                    <option value="Mother">{isBn ? 'মাতা (Mother)' : 'Mother'}</option>
                    <option value="Guardian">{isBn ? 'আইনি অভিভাবক (Legal Guardian)' : 'Legal Guardian'}</option>
                    <option value="Other">{isBn ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'বর্তমান ঠিকানা' : 'Current Address'}
                </label>
                <textarea
                  rows={2}
                  value={studentData.address}
                  onChange={(e) => setStudentData({ ...studentData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  placeholder={isBn ? 'বাড়ি/রোড নং, এলাকা, জেলা...' : 'House, Road, Area, District...'}
                />
              </div>
            </div>

            {/* Section 3: Password Update */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lock size={16} className="text-amber-600" />
                {isBn ? 'পোর্টাল পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)' : 'Change Portal Password (Optional)'}
              </h3>

              <div className="max-w-md space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                </label>
                <input
                  type="password"
                  placeholder={isBn ? 'পাসওয়ার্ড অপরিবর্তিত রাখতে ফাঁকা রাখুন' : 'Leave empty to keep current password'}
                  value={studentData.new_password}
                  onChange={(e) => setStudentData({ ...studentData, new_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'পাসওয়ার্ড সর্বনিম্ন ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.'}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving Changes...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isBn ? 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন' : 'Save Profile Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INSTITUTION ADMIN VIEW                                                 */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <User size={15} />
              {isBn ? 'অ্যাডমিন অ্যাকাউন্ট ও ছবি' : 'Admin Profile & Avatar'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'branding'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 size={15} />
              {isBn ? 'প্রতিষ্ঠান ব্র্যান্ডিং, লোগো ও ব্যানার' : 'Campus Identity, Logo & Banner'}
            </button>
          </div>

          {/* TAB 1: ADMIN PROFILE */}
          {activeTab === 'admin' && (
            <form onSubmit={handleSaveAdminAccount} className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                {/* Admin Avatar Box */}
                <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0">
                    {userProfileData.avatar_url ? (
                      <div className="relative group">
                        <img
                          src={getPhotoSrc(userProfileData.avatar_url)}
                          alt={userProfileData.name}
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setUserProfileData(prev => ({ ...prev, avatar_url: '' }))}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                          title="Remove Avatar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-3xl flex items-center justify-center shadow-xs">
                        {userProfileData.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {isBn ? 'অ্যাডমিন প্রোফাইল ছবি' : 'Admin Profile Avatar'}
                      </h3>
                      {userProfileData.avatar_url && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> ImageKit Cloud
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isBn
                        ? 'এই ছবি শীর্ষ নেভিগেশন বারের উপরের ডান কোনায় প্রদর্শিত হবে (JPG, PNG সর্বোচ্চ ৫MB)।'
                        : 'This image appears in the top navigation bar header (JPG, PNG max 5MB).'}
                    </p>
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
                        {uploadingAvatar ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-blue-600" />
                            <span>{isBn ? 'আপলোড হচ্ছে...' : 'Uploading to ImageKit...'}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} className="text-blue-600" />
                            <span>{userProfileData.avatar_url ? (isBn ? 'ছবি পরিবর্তন করুন' : 'Change Avatar') : (isBn ? 'ছবি আপলোড করুন' : 'Upload Avatar')}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          onChange={handleAdminAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'অ্যাডমিনের নাম' : 'Admin Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={userProfileData.name}
                      onChange={(e) => setUserProfileData({ ...userProfileData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'অ্যাডমিন ইমেইল' : 'Admin Email'}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userProfileData.email}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Change Password */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)' : 'Change Admin Password (Optional)'}
                  </label>
                  <input
                    type="password"
                    placeholder={isBn ? 'অপরিবর্তিত রাখতে ফাঁকা রাখুন' : 'Leave empty to keep current password'}
                    value={userProfileData.password}
                    onChange={(e) => setUserProfileData({ ...userProfileData, password: e.target.value })}
                    className="max-w-md w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isBn ? 'সর্বনিম্ন ৬ অক্ষরের পাসওয়ার্ড দিন।' : 'Minimum 6 characters.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'অ্যাডমিন প্রোফাইল সংরক্ষণ করুন' : 'Save Admin Profile')}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INSTITUTION BRANDING, LOGO & BANNER */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveInstitution} className="space-y-6">
              {/* BRANDING ASSETS CARD (LOGO & BANNER) */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles size={16} className="text-blue-600" />
                  {isBn ? '১. প্রতিষ্ঠানের লোগো ও ক্যাম্পাস ব্যানার' : '1. Institution Logo & Campus Banner'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Institution Logo Card */}
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {isBn ? 'প্রতিষ্ঠানের লোগো' : 'Institution Logo'}
                      </span>
                      {institutionData.logo && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> ImageKit
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {institutionData.logo ? (
                          <div className="relative group">
                            <img
                              src={getPhotoSrc(institutionData.logo)}
                              alt="Logo Preview"
                              className="w-20 h-20 rounded-2xl object-contain bg-white border border-slate-200 p-1 shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setInstitutionData(prev => ({ ...prev, logo: '' }))}
                              className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <School size={28} className="text-slate-300" />
                            <span className="text-[9px] mt-0.5">{isBn ? 'লোগো নেই' : 'No Logo'}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="text-[11px] text-slate-500">
                          {isBn ? 'সাইডবারের বামে প্রদর্শিত হবে।' : 'Displayed in sidebar navigation.'}
                        </p>
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
                            {uploadingLogo ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-blue-600" />
                                <span>{isBn ? 'আপলোড হচ্ছে...' : 'Uploading...'}</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={13} className="text-blue-600" />
                                <span>{institutionData.logo ? (isBn ? 'লোগো পরিবর্তন' : 'Change Logo') : (isBn ? 'লোগো আপলোড' : 'Upload Logo')}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingLogo}
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campus Banner Card */}
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {isBn ? 'ক্যাম্পাস হিরো ব্যানার' : 'Campus Hero Banner'}
                      </span>
                      {institutionData.banner_url && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> ImageKit
                        </span>
                      )}
                    </div>

                    <div className="relative h-20 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-r from-blue-900 to-indigo-900">
                      {institutionData.banner_url ? (
                        <>
                          <img
                            src={getPhotoSrc(institutionData.banner_url)}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setInstitutionData(prev => ({ ...prev, banner_url: '' }))}
                            className="absolute top-2 right-2 p-1 bg-rose-600/90 text-white rounded-lg hover:bg-rose-700 shadow-sm"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                          {isBn ? 'ডিফল্ট গ্রেডিয়েন্ট ব্যানার' : 'Default Gradient Banner'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
                        {uploadingBanner ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-blue-600" />
                            <span>{isBn ? 'আপলোড হচ্ছে...' : 'Uploading...'}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} className="text-blue-600" />
                            <span>{institutionData.banner_url ? (isBn ? 'ব্যানার পরিবর্তন' : 'Change Banner') : (isBn ? 'ব্যানার আপলোড' : 'Upload Banner')}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBanner}
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* BASIC INFO */}
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 pt-3">
                  <Building2 size={16} className="text-blue-600" />
                  {isBn ? '২. প্রতিষ্ঠানের বিবরণ ও যোগাযোগের তথ্য' : '2. Institution Information'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={institutionData.name}
                      onChange={(e) => setInstitutionData({ ...institutionData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'EIIN নম্বর' : 'EIIN Number'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={institutionData.eiin_number || 'EIIN-108246'}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'ক্যাম্পাসের ঠিকানা' : 'Campus Address'} *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={institutionData.address}
                    onChange={(e) => setInstitutionData({ ...institutionData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'অফিসিয়াল ফোন নম্বর' : 'Official Phone'} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={institutionData.phone}
                      onChange={(e) => setInstitutionData({ ...institutionData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'যোগাযোগের ইমেইল' : 'Contact Email'} *
                    </label>
                    <input
                      type="email"
                      required
                      value={institutionData.email}
                      onChange={(e) => setInstitutionData({ ...institutionData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'প্রতিষ্ঠান সেটিংস সংরক্ষণ করুন' : 'Save Institution Profile')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. OTHER ROLES (SUPER_ADMIN / STAFF)                                      */}
      {/* ========================================================================= */}
      {!isStudent && !isAdmin && (
        <form onSubmit={handleSaveAdminAccount} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <div className="relative shrink-0">
                {userProfileData.avatar_url ? (
                  <img
                    src={userProfileData.avatar_url}
                    alt={userProfileData.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-3xl flex items-center justify-center">
                    {userProfileData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{isBn ? 'প্রোফাইল ছবি' : 'Profile Picture'}</h3>
                <p className="text-xs text-slate-500">
                  {isBn ? 'ImageKit ক্লাউড স্টোরেজে আপলোড হবে।' : 'Uploaded to ImageKit Cloud storage.'}
                </p>
                <div className="pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs">
                    {uploadingAvatar ? <Loader2 size={13} className="animate-spin text-blue-600" /> : <UploadCloud size={13} className="text-blue-600" />}
                    <span>{userProfileData.avatar_url ? (isBn ? 'ছবি পরিবর্তন' : 'Change Avatar') : (isBn ? 'ছবি আপলোড' : 'Upload Avatar')}</span>
                    <input type="file" accept="image/*" disabled={uploadingAvatar} onChange={handleAdminAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'পূর্ণ নাম' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={userProfileData.name}
                  onChange={(e) => setUserProfileData({ ...userProfileData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
                </label>
                <input
                  type="email"
                  disabled
                  value={userProfileData.email}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'New Password (Optional)'}
              </label>
              <input
                type="password"
                placeholder={isBn ? 'অপরিবর্তিত রাখতে ফাঁকা রাখুন' : 'Leave empty to keep current password'}
                value={userProfileData.password}
                onChange={(e) => setUserProfileData({ ...userProfileData, password: e.target.value })}
                className="max-w-md w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সংরক্ষণ করুন' : 'Save Changes')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
