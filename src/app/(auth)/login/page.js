'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import {
  School, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2,
  Sparkles, AlertCircle, ArrowRight, Mail, BookOpen,
  Users, UserCheck, KeyRound, HelpCircle, PhoneCall
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const isBn = lang === 'bn';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        delete next.form;
        return next;
      });
    }
  };

  const getDetectedRole = () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) return null;
    if (email === 'admin@uemp.com' || email.includes('super')) {
      return {
        title: isBn ? 'সুপার অ্যাডমিনিস্ট্রেটর' : 'Super Administrator',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: ShieldCheck
      };
    }
    if (email.includes('teacher') || email.includes('faculty')) {
      return {
        title: isBn ? 'শিক্ষক / স্টাফ পোর্টাল' : 'Faculty / Teacher Portal',
        badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: BookOpen
      };
    }
    if (email.includes('student') || email.includes('guardian')) {
      return {
        title: isBn ? 'শিক্ষার্থী / অভিভাবক পোর্টাল' : 'Student & Parent Portal',
        badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Users
      };
    }
    if (email.includes('@') && email.length > 5) {
      return {
        title: isBn ? 'প্রতিষ্ঠান প্রশাসন (Principal)' : 'Institution Principal / Admin',
        badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: School
      };
    }
    return null;
  };

  const detectedRole = getDetectedRole();

  // One-click quick fill for testing
  const handleFillDemo = (email, password) => {
    setFormData({ email, password });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = isBn ? 'অফিসিয়াল ইমেইল বা আইডি দেওয়া আবশ্যক' : 'Institutional email or ID is required';
    }

    if (!formData.password) {
      newErrors.password = isBn ? 'পাসওয়ার্ড দেওয়া আবশ্যক' : 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      toast.success(isBn ? 'লগইন সফল হয়েছে! স্বাগতম।' : 'Login successful! Welcome back.');
      router.push('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || (isBn ? 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে' : 'Invalid email or password provided');
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
                  {isBn ? 'সমন্বিত শিক্ষা প্রতিষ্ঠান ব্যবস্থাপনা' : 'Unified Education Management'}
                </p>
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Language Switcher */}
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${!isBn ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${isBn ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  বাংলা
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 font-medium">
                <span>{isBn ? 'নতুন প্রতিষ্ঠান?' : 'New institution?'}</span>
              </div>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                <span>{isBn ? 'প্রতিষ্ঠান নিবন্ধন' : 'Register Campus'}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. SUB-BANNER: TRUST & AVAILABILITY */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 shrink-0 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              {isBn
                ? 'সার্বক্ষণিক সুরক্ষিত ক্লাউড প্ল্যাটফর্ম • রোল অনুযায়ী স্বয়ংক্রিয় পোর্টাল রিডাইরেক্ট'
                : 'High-Availability Cloud Engine • Automated Role-Based Portal Access'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              {isBn ? '১০০% ডেটা সুরক্ষা' : 'Enterprise Grade Privacy'}
            </span>
            <span>•</span>
            <span>{isBn ? '২৪/৭ ক্লাউড অ্যাক্টিভ' : '99.9% Uptime Active'}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SIGN-IN WORKSPACE */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
          
          {/* LEFT SIDE: INSTITUTIONAL BRANDING & CAPABILITIES */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-indigo-900/60 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md">
                <Sparkles size={14} className="text-blue-300" />
                <span>{isBn ? 'একক নিরাপদ লগইন গেটওয়ে' : 'Unified Academic Sign-In'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {isBn ? (
                  <>
                    আপনার প্রতিষ্ঠানের <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">ডিজিটাল অ্যাকাউন্টে</span> স্বাগতম
                  </>
                ) : (
                  <>
                    Welcome to Your <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">Campus Digital</span> Gateway
                  </>
                )}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {isBn
                  ? 'আপনার প্রাতিষ্ঠানিক ইমেইল বা আইডি ও পাসওয়ার্ড দিন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনার রোল শনাক্ত করে নির্ধারিত পোর্টালে নিয়ে যাবে।'
                  : 'Enter your verified institutional credentials. Our system automatically routes administrators, educators, students, and guardians to their dedicated workspaces.'}
              </p>

              {/* 3 Dedicated Role Workspaces Preview */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                    <School size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isBn ? 'অধ্যক্ষ ও প্রশাসন ড্যাশবোর্ড' : 'Principal & Campus Administration'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isBn ? 'ভর্তি, রুটিন তৈরি, ফি আদায় ও সার্বিক পরিচালনা' : 'Admissions, routine planning, fee ledger & approvals'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isBn ? 'শিক্ষক ও স্টাফ পোর্টাল' : 'Teacher & Faculty Workspace'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isBn ? 'ক্লাসরুম হাজিরা, সিলেবাস অগ্রগতি ও পরীক্ষার নম্বর এন্ট্রি' : 'Digital attendance, marks entry & weekly timetable'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isBn ? 'শিক্ষার্থী ও অভিভাবক পোর্টাল' : 'Student & Guardian Portal'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isBn ? 'অনলাইনে রেজাল্ট দেখা, হাজিরা চেক ও বিকাশ/নগদে ফি পরিশোধ' : 'Live report cards, attendance status & instant MFS fee pay'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Pillars */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                <p className="text-base font-black text-white">৪৫০+</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{isBn ? 'ক্যাম্পাস' : 'Campuses'}</p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                <p className="text-base font-black text-emerald-400">৯৯.৯%</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{isBn ? 'আপটাইম' : 'Uptime'}</p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                <p className="text-base font-black text-blue-300">১০০%</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{isBn ? 'সুরক্ষিত' : 'Privacy'}</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: MODERN SIGN-IN CARD */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              {/* Form Title */}
              <div className="mb-6 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-600 tracking-wider uppercase">
                    {isBn ? 'নিরাপদ প্রাতিষ্ঠানিক লগইন' : 'Official Workspace Sign-In'}
                  </span>
                  {detectedRole && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${detectedRole.badgeColor} animate-in fade-in`}>
                      <detectedRole.icon size={13} />
                      <span>{detectedRole.title}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {isBn ? 'সাইন ইন করুন' : 'Sign In to Workspace'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  {isBn
                    ? 'আপনার অ্যাকাউন্টের তথ্যাবলী প্রদান করে ড্যাশবোর্ডে প্রবেশ করুন'
                    : 'Enter your credentials below to access your institutional dashboard'}
                </p>
              </div>

              {/* Quick Demo Access Chips for Fast Evaluation */}
              <div className="mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={13} className="text-blue-600" />
                    {isBn ? 'কুইক ডেমো এক্সেস (এক ক্লিকে পূরণ করুন):' : 'Quick Demo Fill (Click to evaluate):'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin@uemp.com', 'Admin@123456')}
                    className="px-3 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <ShieldCheck size={13} className="text-purple-600" />
                    <span>Super Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('principal@school.edu.bd', 'Principal@123')}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <School size={13} className="text-blue-600" />
                    <span>Principal (Admin)</span>
                  </button>
                </div>
              </div>

              {/* Error banner if any */}
              {errors.form && (
                <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errors.form}</span>
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email or ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isBn ? 'ইমেইল বা প্রাতিষ্ঠানিক ইউজার আইডি *' : 'Work Email or Institutional ID *'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      name="email"
                      type="text"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={isBn ? 'e.g. principal@school.edu.bd বা admin@uemp.com' : 'e.g. principal@school.edu.bd or admin@uemp.com'}
                      className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-white focus:bg-white border rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 outline-none font-medium shadow-2xs transition-all ${
                        errors.email
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      {isBn ? 'গোপন পাসওয়ার্ড *' : 'Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => toast(isBn ? 'পাসওয়ার্ড ভুলে গেলে আপনার প্রতিষ্ঠান প্রধান অথবা UEMP হেল্পলাইনে যোগাযোগ করুন।' : 'Contact your campus administrator or UEMP support for password reset.', { icon: 'ℹ️' })}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 hover:bg-white focus:bg-white border rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 outline-none font-medium shadow-2xs transition-all ${
                        errors.password
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-400/20'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      {isBn ? 'এই ডিভাইসে লগইন মনে রাখুন' : 'Remember my session on this device'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>{isBn ? 'লগইন করুন ও ড্যাশবোর্ডে প্রবেশ করুন' : 'Sign In & Enter Dashboard'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Options */}
            <div className="pt-6 mt-6 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs text-slate-500">
                {isBn ? 'আপনার প্রতিষ্ঠানের কি এখনো UEMP অ্যাকাউন্ট নেই? ' : "Don't have an institution account yet? "}
                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                  {isBn ? 'বিনামূল্যে প্রতিষ্ঠান নিবন্ধন করুন' : 'Register your campus free'}
                </Link>
              </p>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                <Link href="/" className="hover:text-slate-600 transition-colors">
                  {isBn ? '← মূল হোমপেজে ফিরে যান' : '← Back to Homepage'}
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <PhoneCall size={12} className="text-emerald-500" />
                  {isBn ? 'হেল্পলাইন: +880 1700-000000' : 'Helpline: +880 1700-000000'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
