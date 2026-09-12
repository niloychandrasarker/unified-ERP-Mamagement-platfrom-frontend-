'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useLanguage } from '@/lib/language';
import {
  School,
  Baby,
  Target,
  GraduationCap,
  Phone,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  MapPin,
  Check,
  Building2,
  Award,
  BookOpen
} from 'lucide-react';

export default function RegisterPage() {
  const { lang, setLang } = useLanguage();
  const isBn = lang === 'bn';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    institutionName: '',
    institutionNameBn: '',
    institutionType: 'SCHOOL',
    address: '',
    district: '',
    phone: '',
    email: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = isBn
        ? 'প্রতিষ্ঠানের ইংরেজি নাম দেওয়া আবশ্যক'
        : 'Institution name in English is required';
    }

    if (!formData.institutionType) {
      newErrors.institutionType = isBn
        ? 'প্রতিষ্ঠানের ধরন নির্বাচন করুন'
        : 'Select institution type';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isBn ? 'অফিসিয়াল ফোন নম্বর দেওয়া আবশ্যক' : 'Phone number is required';
    } else if (!/^[0-9+-\s()]{7,20}$/.test(formData.phone.trim())) {
      newErrors.phone = isBn ? 'সঠিক ফোন নম্বর প্রদান করুন' : 'Invalid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = isBn ? 'প্রতিষ্ঠানের অফিসিয়াল ইমেইল আবশ্যক' : 'Institution email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = isBn ? 'সঠিক ইমেইল ফরম্যাট দিন' : 'Invalid email format';
    }

    if (!formData.address.trim()) {
      newErrors.address = isBn ? 'ক্যাম্পাসের পূর্ণ ঠিকানা আবশ্যক' : 'Campus address is required';
    }

    if (!formData.district.trim()) {
      newErrors.district = isBn ? 'জেলা বা শহরের নাম দিন' : 'District/City is required';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = isBn ? 'প্রধান অ্যাডমিন / অধ্যক্ষের নাম আবশ্যক' : 'Lead administrator name is required';
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = isBn ? 'অ্যাডমিনের ইমেইল দেওয়া আবশ্যক' : 'Admin email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail.trim())) {
      newErrors.adminEmail = isBn ? 'সঠিক ইমেইল ফরম্যাট দিন' : 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = isBn ? 'পাসওয়ার্ড দেওয়া আবশ্যক' : 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = isBn ? 'পাসওয়ার্ডটি পুনরায় নিশ্চিত করুন' : 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isBn ? 'পাসওয়ার্ড দুটি মেলেনি' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(isBn ? 'অনুগ্রহ করে প্রয়োজনীয় সকল তথ্য সঠিকভাবে পূরণ করুন' : 'Please fill all required fields properly');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        institutionName: formData.institutionName.trim(),
        name: formData.institutionName.trim(),
        nameBn: formData.institutionNameBn.trim() || undefined,
        institutionType: formData.institutionType,
        type: formData.institutionType,
        address: formData.address.trim(),
        district: formData.district.trim(),
        phone: formData.phone.trim(),
        institutionEmail: formData.email.trim(),
        email: formData.email.trim(),
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPassword: formData.password,
        password: formData.password
      };

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        toast.success(
          isBn
            ? 'নিবন্ধন সফল হয়েছে! সুপার অ্যাডমিন পর্যালোচনা করে আপনার ক্যাম্পাস সক্রিয় করবেন।'
            : 'Registration submitted! Super Admin will review and activate your campus.'
        );
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        const mappedErrors = {};
        serverErrors.forEach((err) => {
          const field = err.path || err.param;
          if (field === 'institutionEmail') mappedErrors.email = err.msg;
          else if (field === 'adminPassword') mappedErrors.password = err.msg;
          else if (field) mappedErrors[field] = err.msg;
        });
        setErrors(prev => ({ ...prev, ...mappedErrors }));
        toast.error(error.response?.data?.message || (isBn ? 'ত্রুটি সংশোধন করুন' : 'Please fix the errors'));
      } else {
        const msg = error.response?.data?.message || (isBn ? 'নিবন্ধন ব্যর্থ হয়েছে' : 'Registration failed');
        if (msg.toLowerCase().includes('already registered')) {
          setErrors(prev => ({
            ...prev,
            adminEmail: isBn ? 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত' : 'This email is already registered'
          }));
        }
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const institutionTypes = [
    {
      id: 'SCHOOL',
      icon: School,
      title: isBn ? 'হাই স্কুল / মাধ্যমিক' : 'High School (K-12)',
      desc: isBn ? '১ম থেকে ১০ম শ্রেণি, শাখা ও বোর্ড সিলেবাস' : 'Class 1 to 10 with sections & NCTB grading',
      badge: isBn ? 'জনপ্রিয়' : 'Popular'
    },
    {
      id: 'COLLEGE',
      icon: GraduationCap,
      title: isBn ? 'কলেজ / উচ্চ মাধ্যমিক' : 'College (HSC)',
      desc: isBn ? 'বিজ্ঞান, মানবিক, ব্যবসায় শাখা ও বিষয়ভিত্তিক রুটিন' : 'Science, Arts, Commerce streams & term exams',
      badge: isBn ? 'উচ্চ শিক্ষা' : 'Higher Sec'
    },
    {
      id: 'KINDERGARTEN',
      icon: Baby,
      title: isBn ? 'কিন্ডারগার্টেন ও প্রাইমারি' : 'Kindergarten & Pre-School',
      desc: isBn ? 'প্লে, নার্সারি, কেজি ব্যাচ ও অভিভাবকদের সাথে সার্বক্ষণিক যোগাযোগ' : 'Play, Nursery, KG & instant parent communication',
      badge: isBn ? 'শিশু বান্ধব' : 'Child Care'
    },
    {
      id: 'COACHING_CENTER',
      icon: Target,
      title: isBn ? 'কোচিং ও একাডেমিক সেন্টার' : 'Coaching & Academic Center',
      desc: isBn ? 'ব্যাচভিত্তিক শিক্ষার্থী, মডেল টেস্ট ও উইকলি মেধা তালিকা' : 'Batch-wise enrollment & weekly model test merit ranks',
      badge: isBn ? 'ব্যাচ ও শিফট' : 'Batch Sync'
    }
  ];

  const selectedTypeInfo = institutionTypes.find(t => t.id === formData.institutionType) || institutionTypes[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-2xl tracking-tighter">U</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-2xl text-slate-900 tracking-tight">UEMP</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">v3.2</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {isBn ? 'সমন্বিত শিক্ষা প্রতিষ্ঠান ব্যবস্থাপনা প্ল্যাটফর্ম' : 'Unified Education Management Platform'}
                </p>
              </div>
            </Link>

            {/* Language Toggle & Login link */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${!isBn ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${isBn ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  বাংলা
                </button>
              </div>

              <span className="text-xs sm:text-sm text-slate-500 font-medium hidden md:inline">
                {isBn ? 'ইতিমধ্যে একাউন্ট আছে?' : 'Already registered?'}
              </span>

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl border border-blue-200 transition-all"
              >
                <span>{isBn ? 'সাইন ইন করুন' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-300">
              <Sparkles size={14} className="text-blue-400" />
              <span>{isBn ? 'সহজ অনলাইন রেজিস্ট্রেশন • সম্পূর্ণ আধুনিক ক্যাম্পাস ব্যবস্থাপনা' : 'Fast Online Onboarding • Next-Gen Campus Automation'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {isBn ? 'আপনার প্রতিষ্ঠানের ডিজিটাল ক্যাম্পাস শুরু করুন' : 'Register Your Institution Workspace'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {isBn
                ? 'মাত্র ২ মিনিটে আপনার স্কুল, কলেজ, কিন্ডারগার্টেন বা কোচিং সেন্টারের জন্য প্ল্যাটফর্ম সক্রিয় করুন। হাজিরা, রুটিন, পরীক্ষার মার্কশীট ও ফি কালেকশন এখন হাতের মুঠোয়।'
                : 'Empower your teachers, students, and administration with automated attendance, MFS & cash fee collection, class routines, and board-standard report cards.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex flex-col justify-center space-y-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>{isBn ? 'ফ্রি ট্রায়াল সুবিধা' : 'Instant Campus Access'}</span>
            </div>
            <p className="text-2xl font-black text-white">৳০ / সম্পূর্ণ ফ্রি অনবোর্ডিং</p>
            <p className="text-xs text-slate-300 font-medium">
              {isBn ? '২৪/৭ সার্বক্ষণিক সহায়তা ও প্রশিক্ষণ' : '24/7 Dedicated Support & Guidance'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM & INTERACTIVE PREVIEW GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: REGISTRATION FORM (8 COLS) */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* SECTION 1: INSTITUTION TYPE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    {isBn ? 'ধাপ ১: প্রতিষ্ঠানের ধরন নির্বাচন' : 'Step 1: Institution Category'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {formData.institutionType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {institutionTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.institutionType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setFormData(prev => ({ ...prev, institutionType: type.id }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                            {type.badge}
                          </span>
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {type.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {type.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: INSTITUTION BASIC INFO */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    {isBn ? 'ধাপ ২: প্রতিষ্ঠানের নাম ও পরিচিতি' : 'Step 2: Institution Identity'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* English Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{isBn ? 'প্রতিষ্ঠানের নাম (ইংরেজিতে) *' : 'Institution Name (English) *'}</span>
                    </label>
                    <input
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder={isBn ? 'যেমন: Ideal Model High School' : 'e.g. Milestone College & Academy'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 outline-none font-medium transition-all ${
                        errors.institutionName
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.institutionName && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.institutionName}
                      </p>
                    )}
                  </div>

                  {/* Bengali Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-slate-400" />
                      <span>{isBn ? 'প্রতিষ্ঠানের নাম (বাংলায় - ঐচ্ছিক)' : 'Institution Name (Bengali - Optional)'}</span>
                    </label>
                    <input
                      name="institutionNameBn"
                      value={formData.institutionNameBn}
                      onChange={handleChange}
                      placeholder="যেমন: আইডিয়াল মডেল হাই স্কুল"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none font-medium focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Official Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      <span>{isBn ? 'অফিসিয়াল ফোন নম্বর *' : 'Official Phone Number *'}</span>
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="017XXXXXXXX"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 outline-none transition-all ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Official Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" />
                      <span>{isBn ? 'অফিসিয়াল ইমেইল *' : 'Official Campus Email *'}</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="info@institution.edu.bd"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 outline-none transition-all ${
                        errors.email
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Campus Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{isBn ? 'ক্যাম্পাসের পূর্ণ ঠিকানা *' : 'Full Campus Address *'}</span>
                    </label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder={isBn ? 'যেমন: বাড়ি #১২, রোড #৪, ধানমন্ডি' : 'e.g. House 12, Road 4, Dhanmondi'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 outline-none font-medium transition-all ${
                        errors.address
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.address}
                      </p>
                    )}
                  </div>

                  {/* District / City */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      {isBn ? 'জেলা / শহর *' : 'District / Administrative Division *'}
                    </label>
                    <input
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder={isBn ? 'যেমন: ঢাকা, চট্টগ্রাম, রাজশাহী' : 'e.g. Dhaka, Chittagong, Sylhet'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 outline-none font-medium transition-all ${
                        errors.district
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.district && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.district}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: LEAD ADMIN ACCOUNT */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    {isBn ? 'ধাপ ৩: প্রধান অ্যাডমিন / অধ্যক্ষের লগইন তথ্য' : 'Step 3: Lead Administrator Credentials'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Admin Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      <span>{isBn ? 'অধ্যক্ষ / অ্যাডমিনের নাম *' : 'Principal / Admin Full Name *'}</span>
                    </label>
                    <input
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder={isBn ? 'যেমন: ড. মোহাম্মদ রফিক' : 'e.g. Dr. Mohammad Rafiq'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 outline-none font-medium transition-all ${
                        errors.adminName
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.adminName && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.adminName}
                      </p>
                    )}
                  </div>

                  {/* Admin Login Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" />
                      <span>{isBn ? 'অ্যাডমিন লগইন ইমেইল *' : 'Admin Login Email *'}</span>
                    </label>
                    <input
                      name="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="principal@institution.edu.bd"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 outline-none transition-all ${
                        errors.adminEmail
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    {errors.adminEmail && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.adminEmail}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock size={14} className="text-slate-400" />
                      <span>{isBn ? 'লগইন পাসওয়ার্ড *' : 'Login Password *'}</span>
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 pr-11 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 outline-none transition-all ${
                          errors.password
                            ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                            : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock size={14} className="text-slate-400" />
                      <span>{isBn ? 'পাসওয়ার্ড নিশ্চিতকরণ *' : 'Confirm Password *'}</span>
                    </label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 pr-11 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 outline-none transition-all ${
                          errors.confirmPassword
                            ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                            : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* TERMS & SUBMIT */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-start gap-2.5 text-xs text-slate-500">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p>
                    {isBn
                      ? 'নিবন্ধন সম্পন্ন করার মাধ্যমে আপনি UEMP প্ল্যাটফর্মের টার্মস ও প্রাইভেসি পলিসির সাথে সম্মত হচ্ছেন।'
                      : 'By submitting this registration, you agree to UEMP campus cloud terms of service and security standards.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>{isBn ? 'নিবন্ধন সম্পন্ন হচ্ছে...' : 'Submitting Registration...'}</span>
                  ) : (
                    <>
                      <span>{isBn ? 'ক্যাম্পাস রেজিস্ট্রেশন সম্পন্ন করুন' : 'Submit & Create Campus Workspace'}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: INTERACTIVE CAMPUS PASS PREVIEW (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Campus Identity Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    U
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tight">UEMP Campus Pass</p>
                    <p className="text-[10px] text-slate-400">Digital Workspace</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  {isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}
                </span>
              </div>

              {/* Institution Dynamic Title */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  {selectedTypeInfo.title}
                </span>
                <h3 className="text-xl font-black text-white leading-tight break-words">
                  {formData.institutionName || (isBn ? 'আপনার প্রতিষ্ঠানের নাম' : 'Institution Name')}
                </h3>
                {formData.institutionNameBn && (
                  <p className="text-xs text-indigo-200 font-medium">
                    {formData.institutionNameBn}
                  </p>
                )}
                <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                  <MapPin size={12} className="text-blue-400" />
                  <span>{formData.district ? `${formData.district}, Bangladesh` : (isBn ? 'ঠিকানা ও জেলা' : 'District, Bangladesh')}</span>
                </p>
              </div>

              {/* Campus Pass Details Grid */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">{isBn ? 'প্রধান অ্যাডমিন' : 'Lead Admin'}</p>
                  <p className="font-bold text-white truncate">{formData.adminName || 'Admin Full Name'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">{isBn ? 'যোগাযোগ' : 'Official Phone'}</p>
                  <p className="font-mono font-bold text-white truncate">{formData.phone || '017XXXXXXXX'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">{isBn ? 'একাডেমিক সেশন' : 'Session'}</p>
                  <p className="font-bold text-white">2026 - 2027</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">{isBn ? 'স্ট্যাটাস' : 'Status'}</p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDING APPROVAL
                  </span>
                </div>
              </div>

              {/* Fast Benefits List */}
              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>{isBn ? 'নগদ ক্যাশ ও বিকাশ/নগদে ফি কালেকশন' : 'Cash & MFS unified fee collection'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>{isBn ? 'স্বয়ংক্রিয় টার্ম রেজাল্ট ও গ্রেডশিট' : 'Auto GPA marksheet & tabulation'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>{isBn ? 'শিক্ষক ও শিক্ষার্থী পোর্টাল এক্সেস' : 'Student, teacher & guardian portals'}</span>
                </div>
              </div>

            </div>

            {/* Help / Contact Support Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                <span>{isBn ? 'সহায়তার প্রয়োজন?' : 'Need Assistance?'}</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isBn
                  ? 'রেজিস্ট্রেশন বা অনবোর্ডিং সম্পর্কিত যেকোনো সহায়তায় আমাদের সাপোর্ট টিম সার্বক্ষণিক প্রস্তুত।'
                  : 'Our support specialists are standing by to guide your institution through onboarding.'}
              </p>
              <div className="pt-1 flex items-center justify-between text-xs font-bold text-blue-700 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                <span>Hotline: +880 1700-000000</span>
                <span>support@uemp.edu.bd</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} UEMP (Unified Education Management Platform). All rights reserved.</p>
      </footer>
    </div>
  );
}
