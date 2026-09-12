'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import {
  GraduationCap, Lock, Eye, EyeOff, ShieldCheck,
  Building2, MapPin, Phone, Mail, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';

export default function StudentPortalLoginPage() {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const institutionId = params.institutionId;

  const [institution, setInstitution] = useState(null);
  const [loadingInst, setLoadingInst] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isBn = lang === 'bn';

  useEffect(() => {
    async function fetchInstitution() {
      try {
        setLoadingInst(true);
        const res = await api.get(`/institutions/${institutionId}/public-portal-info`);
        setInstitution(res.data.data);
      } catch (err) {
        console.error('Failed to load institution info', err);
        setErrorMsg(isBn ? 'প্রতিষ্ঠানের তথ্য লোড করা যায়নি' : 'Failed to load institution profile');
      } finally {
        setLoadingInst(false);
      }
    }
    if (institutionId) {
      fetchInstitution();
    }
  }, [institutionId, isBn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier.trim()) {
      toast.error(isBn ? 'অনুগ্রহ করে স্টুডেন্ট আইডি দিন' : 'Please enter your Student ID');
      return;
    }
    if (!formData.password) {
      toast.error(isBn ? 'অনুগ্রহ করে পাসওয়ার্ড দিন' : 'Please enter your password');
      return;
    }

    setLoginLoading(true);
    setErrorMsg('');
    try {
      await login(formData.identifier.trim(), formData.password);
      toast.success(isBn ? 'স্বাগতম! লগইন সফল হয়েছে' : 'Welcome! Login successful');
      router.push('/dashboard/portal/student');
    } catch (err) {
      const msg = err.response?.data?.message || (isBn ? 'স্টুডেন্ট আইডি বা পাসওয়ার্ড সঠিক নয়' : 'Invalid Student ID or password');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setFormData({
      identifier: '2611001',
      password: 'Student@2026'
    });
    toast.success(isBn ? 'ডেমো স্টুডেন্ট ক্রেডেনশিয়াল পূরণ করা হয়েছে' : 'Demo student credentials filled');
  };

  if (loadingInst) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 font-medium text-sm">
            {isBn ? 'প্রতিষ্ঠানের পোর্টাল প্রস্তুত হচ্ছে...' : 'Connecting to Institution Portal...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">UEMP</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Student Self-Service
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Unified Education Management Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md transition-colors ${lang !== 'bn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('bn')}
              className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              বাংলা
            </button>
          </div>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {isBn ? 'মেইন লগইন' : 'Staff Login'} →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="max-w-md w-full space-y-6">
          
          {/* Institution Identity Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center space-y-3 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
            
            {/* Institution Logo */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-lg border-2 border-slate-700/50 flex items-center justify-center overflow-hidden">
              {institution?.logo ? (
                <img src={institution.logo} alt={institution.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                  {institution?.name?.charAt(0) || 'S'}
                </div>
              )}
            </div>

            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                ● {isBn ? 'সেশন' : 'Academic Session'}: {institution?.active_session || '2026'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {institution?.name || 'Institution Student Portal'}
              </h1>
              {institution?.address && (
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1">
                  <MapPin size={12} className="text-blue-400 shrink-0" />
                  <span>{institution.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Login Form Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <GraduationCap size={16} />
                <span>{isBn ? 'শিক্ষার্থী ও অভিভাবক লগইন' : 'Student & Guardian Access'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isBn
                  ? 'আপনার স্টুডেন্ট আইডি বা রোল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।'
                  : 'Enter your institutional Student ID/Roll and password.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student ID / Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {isBn ? 'স্টুডেন্ট আইডি / রোল নম্বর' : 'Student ID / Roll Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                    placeholder={isBn ? 'যেমন: 2611001' : 'e.g. 2611001'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wide"
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <GraduationCap size={18} />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    {isBn ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {isBn ? 'ডিফল্ট পাসওয়ার্ড: Student@2026' : 'Default: Student@2026'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isBn ? 'পোর্টালে প্রবেশ করুন' : 'Sign In to Student Portal'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Quick Fill Helper */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-400" />
                {isBn ? 'পরীক্ষার জন্য ডেমো আইডি:' : 'Demo Quick Login:'}
              </span>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] rounded-lg border border-slate-700 transition-colors"
              >
                2611001 (Auto Fill)
              </button>
            </div>
          </div>

          {/* Footer Assistance */}
          <div className="text-center space-y-2 text-xs text-slate-500">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{isBn ? 'সুরক্ষিত ও একক এনক্রিপ্টেড সেশন' : 'Encrypted Student Self-Service Session'}</span>
            </p>
            {institution?.phone && (
              <p>
                {isBn ? 'সাহায্যের জন্য যোগাযোগ:' : 'School Helpline:'}{' '}
                <span className="text-slate-300 font-mono">{institution.phone}</span>
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

