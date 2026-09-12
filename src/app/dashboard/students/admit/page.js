'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language';
import {
  UserPlus, CheckCircle2, Copy, Printer, ArrowRight,
  ShieldCheck, AlertCircle, Sparkles, BookOpen, Users, KeyRound, ChevronLeft,
  Camera, UploadCloud, Trash2, Loader2, Image as ImageIcon
} from 'lucide-react';
import { uploadToImageKit } from '@/lib/upload';

function StudentAdmissionContent() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('class_id') || '';

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Safe image URL resolver helper
  const getPhotoSrc = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.url || val.thumbnailUrl || '';
    if (typeof val === 'string') {
      if (val.startsWith('{') && val.includes('"url"')) {
        try {
          return JSON.parse(val).url || val;
        } catch (e) {
          return val;
        }
      }
      return val;
    }
    return '';
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    class_id: preselectedClassId,
    section_id: '',
    roll_number: '',
    gender: 'MALE',
    dob: '',
    blood_group: 'A+',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Father',
    address: '',
    email: '',
    photo_url: ''
  });

  // Success Modal State with Credentials
  const [credentialModal, setCredentialModal] = useState(null);

  // Next ID & Roll Preview State
  const [nextPreview, setNextPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        const [classRes, secRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/sections')
        ]);
        const clsList = classRes.data.data || [];
        setClasses(clsList);
        setSections(secRes.data.data || []);

        setFormData(prev => {
          const targetId = preselectedClassId && clsList.some(c => c.id === preselectedClassId)
            ? preselectedClassId
            : (prev.class_id || clsList[0]?.id || '');
          return { ...prev, class_id: targetId };
        });
      } catch (err) {
        toast.error('Failed to load classes or sections');
      } finally {
        setLoadingInitial(false);
      }
    };
    loadAcademicData();
  }, [preselectedClassId]);

  // Fetch next ID & Roll preview when selected class changes
  useEffect(() => {
    if (!formData.class_id) {
      setNextPreview(null);
      return;
    }
    const fetchPreview = async () => {
      try {
        setLoadingPreview(true);
        const res = await api.get(`/students/next-id?class_id=${formData.class_id}`);
        setNextPreview(res.data.data);
      } catch (err) {
        // Silently catch preview error if any
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [formData.class_id]);

  const filteredSections = sections.filter(s => s.class_id === formData.class_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_id) {
      toast.error(isBn ? 'শ্রেণি নির্বাচন আবশ্যক' : 'Class selection is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/students/admit', formData);
      const data = res.data.data;

      // Show success modal with credentials
      setCredentialModal({
        ...data.credentials,
        classId: formData.class_id,
        photo_url: formData.photo_url || data.student?.photo_url || ''
      });
      toast.success(isBn ? 'শিক্ষার্থী সফলভাবে ভর্তি সম্পন্ন হয়েছে!' : 'Student admitted and credentials generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
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
      setUploadingPhoto(true);
      const res = await uploadToImageKit(file, 'students', `student_${Date.now()}`);
      const cleanUrl = typeof res === 'string' ? res.toString() : (res?.url || '');
      setFormData(prev => ({ ...prev, photo_url: cleanUrl }));
      toast.success(isBn ? 'শিক্ষার্থীর ছবি সফলভাবে আপলোড হয়েছে!' : 'Student photo uploaded to ImageKit!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload student photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${isBn ? 'কপি হয়েছে!' : 'copied to clipboard!'}`);
  };

  const copyAllCredentials = () => {
    if (!credentialModal) return;
    const text = `--- Student Portal Credentials ---
Institution Portal: ${window.location.origin}/login
Student Name: ${credentialModal.name}
Class & Section: ${credentialModal.className} (${credentialModal.sectionName || 'N/A'})
Roll Number: ${credentialModal.rollNumber || 'N/A'}
Student ID / Username: ${credentialModal.studentId}
Security Password: ${credentialModal.initialPassword}
----------------------------------`;
    navigator.clipboard.writeText(text);
    toast.success(isBn ? 'সম্পূর্ণ লগইন তথ্য কপি হয়েছে!' : 'Full credentials copied to clipboard!');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      class_id: classes[0]?.id || '',
      section_id: '',
      roll_number: '',
      gender: 'MALE',
      dob: '',
      blood_group: 'A+',
      guardian_name: '',
      guardian_phone: '',
      guardian_relation: 'Father',
      address: '',
      email: '',
      photo_url: ''
    });
    setCredentialModal(null);
  };

  const currentSelectedClass = classes.find(c => c.id === formData.class_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back link & Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/students"
            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline mb-2"
          >
            <ChevronLeft size={14} className="mr-1" />
            {isBn ? 'শিক্ষার্থী তালিকায় ফিরুন' : 'Back to Students Directory'}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isBn ? 'নতুন শিক্ষার্থী ভর্তি ফরম' : 'Student Admission Form'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBn
              ? 'শিক্ষার্থী ভর্তি সম্পন্ন হলে স্বয়ংক্রিয়ভাবে তার নির্দিষ্ট ক্লাসে যুক্ত হবে এবং পোর্টাল ক্রেডেনশিয়াল তৈরি হবে।'
              : 'Admit student with automated generation of Student ID and Portal Login Password.'}
          </p>
        </div>

        <Link
          href="/dashboard/students/bulk"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          {isBn ? 'বাল্ক CSV ইমপোর্ট করুন' : 'Bulk CSV Import'}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Info Notice Box */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
          <Sparkles size={18} />
        </div>
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold text-blue-950">
            {isBn ? 'স্বয়ংক্রিয় স্টুডেন্ট আইডি ও রোল নম্বর সিস্টেম:' : 'Automated Student ID & Class Sequence Roll:'}
          </p>
          <p className="text-blue-800/90 leading-relaxed">
            {isBn
              ? 'স্টুডেন্টের রোল নম্বর টাইপ করার প্রয়োজন নেই। ভর্তির সাথে সাথে ক্লাসের ক্রমানুসারে রোল (০১, ০২...) এবং আইডি ফরম্যাট (বছর-ব্যাচ-ক্লাস-রোল, যেমন: ২৬১২০১) স্বয়ংক্রিয়ভাবে তৈরি হবে।'
              : 'Roll number input is not required. Student ID will follow {year}{batch}{class}{roll} format (e.g. 261201) with sequential roll (01, 02...).'}
          </p>
        </div>
      </div>

      {/* Admission Form */}
      {loadingInitial ? (
        <div className="p-12 text-center text-slate-400 animate-pulse bg-white rounded-2xl border border-slate-200">
          {isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading admission structure...'}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle size={32} className="text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800">{isBn ? 'কোন শ্রেণি পাওয়া যায়নি' : 'No Classes Found'}</h3>
          <p className="text-xs text-slate-500">
            {isBn ? 'শিক্ষার্থী ভর্তি করার পূর্বে অন্তত একটি শ্রেণি ও সেকশন তৈরি করুন।' : 'Please create at least one class and section before admitting students.'}
          </p>
          <Link
            href="/dashboard/academics/classes"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
          >
            {isBn ? 'শ্রেণি ব্যবস্থাপনায় যান' : 'Go to Classes & Sections'}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Academic Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen size={16} className="text-blue-600" />
              {isBn ? '১. একাডেমিক তথ্য (শ্রেণি ও সেকশন)' : '1. Academic Information & Class Assignment'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'ভর্তিকৃত শ্রেণি' : 'Target Class'} *
                </label>
                <select
                  required
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: '' })}
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
                  {isBn ? 'সেকশন / শাখা' : 'Section / Branch'}
                </label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="">{isBn ? '-- সেকশন নির্বাচন করুন --' : '-- Select Section --'}</option>
                  {filteredSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.room_number ? `(Room ${s.room_number})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'রোল নম্বর (স্বয়ংক্রিয়)' : 'Roll Number (Auto-Assigned)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    loadingPreview
                      ? (isBn ? 'হিসাব করা হচ্ছে...' : 'Calculating...')
                      : nextPreview
                      ? (isBn ? `স্বয়ংক্রিয় রোল: ${nextPreview.rollNumber}` : `Auto: ${nextPreview.rollNumber}`)
                      : (isBn ? 'স্বয়ংক্রিয়: ০১, ০২...' : 'Auto: 01, 02...')
                  }
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-slate-50/50"
                />
                {nextPreview && !formData.roll_number && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-medium">
                    <Sparkles size={12} className="text-emerald-600 shrink-0" />
                    <span>
                      {isBn
                        ? `পরবর্তী আইডি: ${nextPreview.studentId} • রোল: ${nextPreview.rollNumber}`
                        : `Next ID: ${nextPreview.studentId} • Roll: ${nextPreview.rollNumber}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Personal Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users size={16} className="text-blue-600" />
              {isBn ? '২. শিক্ষার্থীর ব্যক্তিগত তথ্য' : '2. Student Personal Information'}
            </h3>

            {/* Student Photo Upload (Optional) */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {formData.photo_url ? (
                  <div className="relative group">
                    <img
                      src={getPhotoSrc(formData.photo_url)}
                      alt="Student Photo Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 shadow-sm"
                      title={isBn ? 'ছবি সরান' : 'Remove Photo'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-xs">
                    <Camera size={26} className="text-slate-300" />
                    <span className="text-[10px] font-medium text-slate-400 mt-1">{isBn ? 'ছবি নেই' : 'No Photo'}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {isBn ? 'শিক্ষার্থীর ছবি' : 'Student Photo'}
                  </span>
                  <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {isBn ? 'ঐচ্ছিক' : 'Optional'}
                  </span>
                  {formData.photo_url && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> ImageKit Cloud
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isBn
                    ? 'ভর্তির সময় ছবি দেওয়া আবশ্যক নয়। পরবর্তীতে শিক্ষার্থী পোর্টাল থেকেও ছবি পরিবর্তন করা যাবে (PNG, JPG সর্বোচ্চ ৫MB)।'
                    : 'Photo is not mandatory during admission. Students can also upload or update it from their portal.'}
                </p>
                <div className="pt-0.5">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs ${
                    uploadingPhoto
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    {uploadingPhoto ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-blue-600" />
                        <span>{isBn ? 'আপলোড হচ্ছে...' : 'Uploading to ImageKit...'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={13} className="text-blue-600" />
                        <span>{formData.photo_url ? (isBn ? 'অন্য ছবি দিন' : 'Change Photo') : (isBn ? 'ছবি আপলোড করুন' : 'Upload Photo')}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      disabled={uploadingPhoto}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শিক্ষার্থীর পূর্ণ নাম' : 'Student Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: আবরার জামান' : 'e.g. Abrar Zaman'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'শিক্ষার্থীর ইমেইল (ঐচ্ছিক)' : 'Student Personal Email (Optional)'}
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="MALE">{isBn ? 'ছাত্র (Male)' : 'Male'}</option>
                  <option value="FEMALE">{isBn ? 'ছাত্রী (Female)' : 'Female'}</option>
                  <option value="OTHER">{isBn ? 'অন্যান্য (Other)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                </label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Guardian & Contact Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck size={16} className="text-blue-600" />
              {isBn ? '৩. অভিভাবক ও যোগাযোগের তথ্য' : '3. Guardian & Contact Details'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'অভিভাবকের নাম' : 'Guardian Name'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: মো: রফিকুল ইসলাম' : 'e.g. Md. Rafiqul Islam'}
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'অভিভাবকের ফোন নম্বর' : 'Guardian Phone'}
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'সম্পর্ক' : 'Relationship'}
                </label>
                <select
                  value={formData.guardian_relation}
                  onChange={(e) => setFormData({ ...formData, guardian_relation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 bg-white"
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
                {isBn ? 'বর্তমান ঠিকানা' : 'Address'}
              </label>
              <textarea
                rows={2}
                placeholder={isBn ? 'বাড়ি/ফ্ল্যাট নং, রোড, এলাকা, জেলা...' : 'House, Road, Area, District...'}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/students')}
              className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <UserPlus size={16} />
              {submitting
                ? (isBn ? 'ভর্তি প্রক্রিয়াধীন...' : 'Admitting Student...')
                : (isBn ? 'ভর্তি সম্পন্ন ও পাসওয়ার্ড জেনারেট করুন' : 'Confirm Admission & Generate Credentials')}
            </button>
          </div>
        </form>
      )}

      {/* CREDENTIALS SUCCESS MODAL */}
      {credentialModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header with celebration */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {isBn ? 'ভর্তি সফলভাবে সম্পন্ন হয়েছে!' : 'Admission Successful!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isBn
                  ? `শিক্ষার্থী "${credentialModal.className}" এ সফলভাবে যুক্ত হয়েছে। পোর্টাল ক্রেডেনশিয়াল সংরক্ষণ করুন:`
                  : `Student enrolled into "${credentialModal.className}". Provide credentials to parent/student:`}
              </p>
            </div>

            {/* Student Meta summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {credentialModal.photo_url ? (
                  <img
                    src={getPhotoSrc(credentialModal.photo_url)}
                    alt={credentialModal.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {credentialModal.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-800 text-sm">{credentialModal.name}</p>
                  <p className="text-slate-600 font-semibold mt-0.5">
                    {credentialModal.className} {credentialModal.sectionName ? `• ${credentialModal.sectionName}` : ''}{' '}
                    {credentialModal.rollNumber ? `• Roll: ${credentialModal.rollNumber}` : ''}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px]">
                {credentialModal.className}
              </span>
            </div>

            {/* Credentials Card */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <KeyRound size={14} />
                  {isBn ? 'স্টুডেন্ট লগইন ক্রেডেনশিয়াল' : 'Portal Login Credentials'}
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* Student ID */}
              <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isBn ? 'ইউজারনেম / স্টুডেন্ট আইডি' : 'Student ID / Username'}
                  </p>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    {credentialModal.studentId}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentialModal.studentId, 'Student ID')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy Student ID"
                >
                  <Copy size={18} />
                </button>
              </div>

              {/* Initial Password */}
              <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isBn ? 'প্রাথমিক সিকিউরিটি পাসওয়ার্ড' : 'Initial Password'}
                  </p>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    {credentialModal.initialPassword}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentialModal.initialPassword, 'Password')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy Password"
                >
                  <Copy size={18} />
                </button>
              </div>

              <p className="text-[11px] text-blue-900/80 leading-tight">
                {isBn
                  ? 'লগইন লিংক: '
                  : 'Login URL: '}{' '}
                <span className="font-semibold underline">{typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={copyAllCredentials}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Copy size={16} />
                {isBn ? 'সম্পূর্ণ তথ্য ক্লিপবোর্ডে কপি করুন' : 'Copy All Credentials to Clipboard'}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handlePrintSlip}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer size={15} />
                  {isBn ? 'ভর্তি স্লিপ প্রিন্ট' : 'Print Slip'}
                </button>

                <button
                  onClick={handleResetForm}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus size={15} />
                  {isBn ? 'আরেকজন ভর্তি করুন' : 'Admit Another'}
                </button>
              </div>

              {/* Direct Link to that specific class roster */}
              <button
                onClick={() => router.push(`/dashboard/students?class_id=${credentialModal.classId || formData.class_id}`)}
                className="w-full text-center py-2.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {isBn
                  ? `👉 ${credentialModal.className} এর সকল শিক্ষার্থী তালিকায় দেখুন`
                  : `👉 View all ${credentialModal.className} students roster`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentAdmissionPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading admission form...</div>}>
      <StudentAdmissionContent />
    </Suspense>
  );
}
