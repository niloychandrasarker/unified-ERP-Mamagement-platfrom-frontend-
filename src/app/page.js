'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language';
import {
  School, Baby, Target, Users, CreditCard, Award, Calendar,
  BookOpen, Clock, ArrowRight, Check, Sparkles, Phone, Mail,
  ChevronDown, ChevronUp, Layers, Sliders, Smartphone, Laptop,
  Zap, CheckCircle2, ShieldCheck, HeartHandshake, FileText,
  DollarSign, TrendingUp, UserCheck, Bell, Search, ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const { lang, setLang } = useLanguage();
  const isBn = lang === 'bn';

  // Interactive Hero Demo Tab
  const [heroTab, setHeroTab] = useState('principal'); // 'principal' | 'teacher' | 'student'

  // Interactive Teacher Attendance Simulation
  const [simulatedStudents, setSimulatedStudents] = useState([
    { id: 1, name: 'Arif Hossain', roll: '01', status: 'PRESENT' },
    { id: 2, name: 'Farzana Akter', roll: '02', status: 'PRESENT' },
    { id: 3, name: 'Tanvir Ahmed', roll: '03', status: 'ABSENT' },
    { id: 4, name: 'Nusrat Jahan', roll: '04', status: 'PRESENT' },
  ]);

  const toggleStudentStatus = (id) => {
    setSimulatedStudents(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'PRESENT' ? 'ABSENT' : s.status === 'ABSENT' ? 'LATE' : 'PRESENT';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Interactive Student Fee Payment Simulation
  const [simulatedFeePaid, setSimulatedFeePaid] = useState(false);

  // Interactive Feature Module Tab
  const [activeFeature, setActiveFeature] = useState(0);

  // Interactive Institution Solution Category
  const [activeCategory, setActiveCategory] = useState('school'); // 'school' | 'kindergarten' | 'coaching'

  // Interactive Savings Calculator
  const [studentCount, setStudentCount] = useState(650);

  // Interactive FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Dynamic calculations for savings
  const hoursSaved = Math.round(studentCount * 0.12);
  const costSaved = Math.round(studentCount * 28);

  const featuresList = [
    {
      icon: UserCheck,
      title: isBn ? 'স্মার্ট ডিজিটাল হাজিরা' : 'Smart Digital Attendance',
      subtitle: isBn ? 'বিষয় ও ক্লাস ভিত্তিক ১-ক্লিকে হাজিরা ও অভিভাবকদের স্বয়ংক্রিয় এসএমএস' : 'Subject & Class-wise 1-click attendance with instant SMS alerts',
      color: 'blue',
      points: isBn ? [
        'মোবাইল বা কম্পিউটার থেকে কয়েক সেকেন্ডে পুরো ক্লাসের হাজিরা গ্রহণ',
        'অনুপস্থিত থাকলে অভিভাবকের ফোনে সাথে সাথে স্বয়ংক্রিয় এসএমএস বার্তা',
        'মাসিক উপস্থিতি পার্সেন্টেজ ও রিয়েল-টাইম রিপোর্ট জেনারেশন'
      ] : [
        'Take full class attendance in seconds from mobile or laptop',
        'Instant automated SMS notifications to parents for absent students',
        'Automated monthly attendance percentage & compliance reports'
      ]
    },
    {
      icon: CreditCard,
      title: isBn ? 'ফি ও টিউশন কালেকশন' : 'Automated Fees & MFS Collection',
      subtitle: isBn ? 'বিকাশ, নগদ, ব্যাংক ও ক্যাশ কাউন্টার রিসিট ম্যানেজমেন্ট' : 'Seamless bKash, Nagad, Bank & Cash counter receipt generation',
      color: 'emerald',
      points: isBn ? [
        'মাসিক টিউশন, ভর্তি ফি, সেশন ফি ও বিশেষ চার্জের স্বয়ংক্রিয় ইনভয়েস',
        'বিকাশ ও নগদ দিয়ে সরাসরি পেমেন্ট এবং তাৎক্ষণিক ডিজিটাল রসিদ',
        'বকেয়া তালিকা, ওয়েভার ও কিস্তি ট্র্যাকিং লেজার'
      ] : [
        'Automated invoices for tuition, admission, exam & session fees',
        'Direct bKash & Nagad payments with instant digital receipts',
        'Live dues ledger, financial waivers, and installment tracking'
      ]
    },
    {
      icon: Award,
      title: isBn ? 'পরীক্ষা ও ফলাফল প্রকাশ' : 'Exams & Official Tabulation',
      subtitle: isBn ? 'সাপ্তাহিক, মাসিক ও টার্ম ফাইনাল মার্কশীট এবং মেধা তালিকা' : 'Weekly, monthly & semester final report cards with merit ranks',
      color: 'purple',
      points: isBn ? [
        'শিক্ষক কর্তৃক নির্ধারিত বিষয়ে নম্বর এন্ট্রি এবং প্রধান শিক্ষকের অনুমোদন',
        'স্বয়ংক্রিয় জিপিএ, লেটার গ্রেড এবং সমন্বিত মেধা তালিকা (Merit List)',
        'বোর্ড স্ট্যান্ডার্ড প্রিন্টযোগ্য ডিজিটাল মার্কশীট ও প্রশংসাপত্র'
      ] : [
        'Subject-scoped teacher marks entry with principal approval workflow',
        'Automated GPA, letter grade, and combined merit list computation',
        'Board-compliant printable digital report cards and transcripts'
      ]
    },
    {
      icon: Calendar,
      title: isBn ? 'ক্লাস রুটিন ও পিরিয়ড ট্র্যাকার' : 'Automated Routine & Timetable',
      subtitle: isBn ? 'শিক্ষক ও রুমের সংঘাতমুক্ত স্বয়ংক্রিয় একাডেমিক রুটিন' : 'Conflict-free scheduling for teachers, classrooms, and periods',
      color: 'amber',
      points: isBn ? [
        'শিক্ষক ও ক্লাসরুম ওভারল্যাপ প্রতিরোধে স্মার্ট সংঘাত সনাক্তকরণ',
        'লাইভ পিরিয়ড ট্র্যাকার — বর্তমানে কোন রুমে কোন শিক্ষক ক্লাস নিচ্ছেন',
        'শিক্ষার্থী ও শিক্ষকদের নিজস্ব সাপ্তাহিক রুটিন টাইমটেবিল'
      ] : [
        'Smart conflict detection prevents teacher and room scheduling overlaps',
        'Live Period Tracker reveals active ongoing classrooms in real time',
        'Personalized weekly routine views for both faculty and students'
      ]
    },
    {
      icon: School,
      title: isBn ? 'শিক্ষক ও স্টাফ পোর্টাল' : 'Dedicated Faculty Workspaces',
      subtitle: isBn ? 'শিক্ষকদের জন্য বিশেষায়িত ডিজিটাল ওয়ার্কস্পেস' : 'Individual workspaces for attendance, grades, and routine',
      color: 'indigo',
      points: isBn ? [
        'শিক্ষক শুধুমাত্র তার বরাদ্দকৃত ক্লাসের ছাত্রছাত্রীদের নম্বর দেখতে ও দিতে পারেন',
        'পরীক্ষার নম্বর ইনপুট ও প্রধান শিক্ষকের কাছে সাবমিশন পাইপলাইন',
        'শিক্ষক পোর্টাল লিংক শেয়ারিং ও পাসওয়ার্ড ম্যানেজমেন্ট'
      ] : [
        'Strict privacy: Teachers only access and grade their assigned courses',
        'Streamlined submission pipeline to principal for official publishing',
        'Easy faculty credential management with direct portal access'
      ]
    },
    {
      icon: Users,
      title: isBn ? 'শিক্ষার্থী ও অভিভাবক পোর্টাল' : 'Student & Parent Self-Service',
      subtitle: isBn ? 'রেজাল্ট, হাজিরা ও ফি দেখতে সার্বক্ষণিক এক্সেস' : '24/7 access to live attendance, term report cards, and fee status',
      color: 'rose',
      points: isBn ? [
        'স্টুডেন্ট আইডি ও পাসওয়ার্ড দিয়ে সরাসরি ঘরে বসেই ফলাফল দেখার সুবিধা',
        'প্রতিদিনের উপস্থিতির স্ট্যাটাস ও আসন্ন পরীক্ষার সময়সূচী পর্যবেক্ষণ',
        'বকেয়া ফি চেক এবং বিকাশ/নগদে ফি পরিশোধ করার সহজ অপশন'
      ] : [
        'Instant result checking from home using Student ID & password',
        'Daily attendance tracking and upcoming examination schedules',
        'Check fee balances and make instant mobile payments'
      ]
    }
  ];

  const faqs = [
    {
      q: isBn ? 'আমাদের প্রতিষ্ঠানে UEMP চালু করতে কি কোনো অতিরিক্ত সফটওয়্যার বা সার্ভার লাগবে?' : 'Do we need extra servers or installed software to use UEMP?',
      a: isBn 
        ? 'না, কোনো বাড়তি কম্পিউটার সার্ভার বা সফটওয়্যার ইনস্টলেশন প্রয়োজন নেই। UEMP একটি আধুনিক ক্লাউড প্ল্যাটফর্ম। যেকোনো কম্পিউটার, ল্যাপটপ বা মোবাইল ফোনের ব্রাউজার থেকেই এটি সরাসরি চালানো যায়।'
        : 'No, zero on-premise servers or installations are required. UEMP is 100% cloud-hosted and runs smoothly on any web browser via laptop, desktop, tablet, or smartphone.'
    },
    {
      q: isBn ? 'শিক্ষক ও শিক্ষার্থীদের জন্য আলাদা লগইন করার নিয়ম কি?' : 'How do teachers and students access their individual portals?',
      a: isBn
        ? 'প্রধান শিক্ষক ড্যাশবোর্ডে শিক্ষক ও শিক্ষার্থীদের যোগ করলেই তাদের নামে স্বতন্ত্র ইউজার আইডি তৈরি হয়। প্রতিষ্ঠান প্রধান একটি নির্দিষ্ট পোর্টাল লিংক তাদের সাথে শেয়ার করলেই তারা নিজ নিজ তথ্য দেখতে পারবেন।'
        : 'When the administrator adds faculty and admits students, dedicated credentials are automatically generated. The principal simply shares the branded portal URL for instant self-service access.'
    },
    {
      q: isBn ? 'অভিভাবকরা কি bKash বা নগদের মাধ্যমে স্কুলের ফি দিতে পারবেন?' : 'Can parents pay tuition fees through bKash or Nagad?',
      a: isBn
        ? 'হ্যাঁ, UEMP-এ স্বয়ংক্রিয় বিকাশ, নগদ এবং ব্যাংক পেমেন্ট সাপোর্ট রয়েছে। অভিভাবকরা তাদের স্টুডেন্ট পোর্টাল থেকে ফি পরিশোধ করতে পারেন এবং সাথে সাথে ডিজিটাল মানি রিসিট ডাউনলোড করতে পারেন।'
        : 'Yes, integrated MFS (bKash & Nagad) and cash counter workflows allow parents to pay tuition directly and download verified payment vouchers instantaneously.'
    },
    {
      q: isBn ? 'আমাদের প্রতিষ্ঠানের তথ্যের গোপনীয়তা ও নিরাপত্তা কতটুকু সুরক্ষিত?' : 'How secure is our institution’s academic and student data?',
      a: isBn
        ? 'আপনার প্রতিষ্ঠানের সমস্ত তথ্য সম্পূর্ণ সুরক্ষিত ক্লাউড এনভায়রনমেন্টে সংরক্ষিত থাকে। অন্য কোনো প্রতিষ্ঠানের সাথে আপনার ডেটা শেয়ার হয় না এবং প্রতিদিন স্বয়ংক্রিয় ক্লাউড ব্যাকআপ নিশ্চিত করা হয়।'
        : 'Your data is protected with enterprise-grade cloud encryption and automated continuous backups. Every institution enjoys complete privacy and sovereign data autonomy.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
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

            {/* Nav Menu */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">
                {isBn ? 'ফিচারসমূহ' : 'Features'}
              </a>
              <a href="#demo" className="hover:text-blue-600 transition-colors">
                {isBn ? 'লাইভ ডেমো' : 'Live Interactive Demo'}
              </a>
              <a href="#solutions" className="hover:text-blue-600 transition-colors">
                {isBn ? 'প্রতিষ্ঠান ক্যাটাগরি' : 'Solutions'}
              </a>
              <a href="#calculator" className="hover:text-blue-600 transition-colors">
                {isBn ? 'সাশ্রয় ক্যালকুলেটর' : 'Savings Calculator'}
              </a>
              <a href="#faq" className="hover:text-blue-600 transition-colors">
                {isBn ? 'প্রশ্নোত্তর' : 'FAQ'}
              </a>
            </div>

            {/* Actions */}
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

              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-bold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                {isBn ? 'লগইন' : 'Sign In'}
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all"
              >
                <span>{isBn ? 'প্রতিষ্ঠান নিবন্ধন' : 'Register Campus'}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-700 shadow-2xs">
              <Sparkles size={14} className="text-blue-600" />
              <span>{isBn ? 'বাংলাদেশের শিক্ষা প্রতিষ্ঠানের জন্য সম্পূর্ণ স্মার্ট সমাধান' : 'Modern Operating System for Educational Campuses'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {isBn ? (
                <>
                  বিদ্যালয় ও কলেজের <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">ডিজিটাল পরিচালনা</span> এখন আরও সহজ ও স্মার্ট
                </>
              ) : (
                <>
                  The Complete Operating System for <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Modern Educational</span> Campuses
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              {isBn
                ? 'শিক্ষার্থী ভর্তি, ১-ক্লিকে ডিজিটাল হাজিরা, বিকাশ ও নগদ ফি আদায়, ক্লাস রুটিন তৈরি, পরীক্ষার মার্কশীট ও ফলাফল প্রকাশ—সবকিছু পরিচালিত করুন একটি একক সুরক্ষিত প্ল্যাটফর্মে।'
                : 'Automate admissions, daily biometric & classroom attendance, bKash & Nagad tuition collection, conflict-free routine building, and board-standard report card tabulation in one unified cloud system.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all text-center"
              >
                <span>{isBn ? 'ফ্রি প্রতিষ্ঠান নিবন্ধন করুন' : 'Get Started Free Today'}</span>
                <ArrowRight size={18} />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base rounded-2xl border border-slate-200/90 shadow-2xs transition-all text-center"
              >
                <Laptop size={18} className="text-blue-600" />
                <span>{isBn ? 'লাইভ ডেমো এক্সপ্লোর করুন' : 'Explore Interactive Demo'}</span>
              </a>
            </div>

            {/* Institutional Trust Badges (Zero Developer Jargon) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>{isBn ? '১০০% নিরাপদ ডেটা' : '100% Secure Data'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CreditCard size={18} className="text-blue-600 shrink-0" />
                <span>{isBn ? 'বিকাশ / নগদ সাপোর্ট' : 'bKash & MFS Ready'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Smartphone size={18} className="text-purple-600 shrink-0" />
                <span>{isBn ? 'মোবাইল ফ্রেন্ডলি' : 'Mobile & Web Sync'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <HeartHandshake size={18} className="text-amber-600 shrink-0" />
                <span>{isBn ? '২৪/৭ সাপোর্ট হেল্পলাইন' : '24/7 Campus Support'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: UEMP Platform Ecosystem Overview (No individual registered institute info) */}
          <div className="lg:col-span-5 relative">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-indigo-900/60 relative overflow-hidden space-y-6">
              {/* Platform Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/30">
                    U
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      {isBn ? 'ইউইএমপি ক্লাউড প্ল্যাটফর্ম' : 'UEMP Cloud Ecosystem'}
                    </h3>
                    <p className="text-xs text-blue-300 font-medium">
                      {isBn ? 'সমন্বিত প্রাতিষ্ঠানিক অটোমেশন' : 'Unified Campus Operating Engine'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  {isBn ? 'সিস্টেম অ্যাক্টিভ' : 'System Active'}
                </span>
              </div>

              {/* 4 Platform Core Value Highlights */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold">
                    <Layers size={14} />
                    <span>{isBn ? '৬টি পূর্ণাঙ্গ মডিউল' : '6 Core Modules'}</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {isBn ? 'অল-ইন-ওয়ান' : 'All-in-One'}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isBn ? 'ভর্তি, হাজিরা, রুটিন, ফি, পরীক্ষা' : 'Admissions, Attendance, Routine, Fees'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                    <Users size={14} />
                    <span>{isBn ? '৩টি স্বতন্ত্র পোর্টাল' : '3 Scoped Portals'}</span>
                  </div>
                  <p className="text-xl font-black text-emerald-400">
                    {isBn ? 'নিরাপদ এক্সেস' : 'Role-Based'}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isBn ? 'অধ্যক্ষ, শিক্ষক ও শিক্ষার্থী' : 'Principal, Teacher & Student'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
                    <CreditCard size={14} />
                    <span>{isBn ? 'ডিজিটাল পেমেন্ট' : 'Direct MFS'}</span>
                  </div>
                  <p className="text-xl font-black text-purple-300">
                    {isBn ? 'বিকাশ ও নগদ' : 'bKash • Nagad'}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isBn ? 'তাৎক্ষণিক স্বয়ংক্রিয় মানি রসিদ' : 'Instant digital payment receipts'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                    <Zap size={14} />
                    <span>{isBn ? 'ক্লাউড ডেপ্লয়মেন্ট' : 'Cloud Setup'}</span>
                  </div>
                  <p className="text-xl font-black text-amber-300">
                    {isBn ? '০ খরচ' : 'Zero Setup'}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isBn ? 'কোনো বাড়তি সার্ভার বা পিসির দরকার নেই' : 'No hardware or installation required'}
                  </p>
                </div>
              </div>

              {/* Multi-Device Support Pill */}
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                    <Laptop size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {isBn ? 'সার্বক্ষণিক ক্লাউড সিঙ্ক' : 'Multi-Device Cloud Sync'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isBn ? 'মোবাইল, ট্যাবলেট ও কম্পিউটার বান্ধব' : 'Desktop, Laptop, Tablet & Mobile'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                  100% Online
                </span>
              </div>

              {/* Platform Trust & Safety Notes */}
              <div className="space-y-2 pt-1 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {isBn ? 'স্বয়ংক্রিয় এসএমএস ও নোটিফিকেশন ইঞ্জিন সক্রিয়' : 'Automated SMS alerts & guardian notifications'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                  <span className="truncate">
                    {isBn ? 'বোর্ড স্ট্যান্ডার্ড রেজাল্ট ও স্বয়ংক্রিয় মার্কশীট তৈরি' : 'Board-standard automated grading & tabulation'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE WORKSPACE SANDBOX */}
      <section id="demo" className="py-20 bg-white border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              {isBn ? 'ইন্টারেক্টিভ লাইভ স্যান্ডবক্স' : 'Interactive Live Sandbox'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isBn ? '৩টি বিশেষায়িত পোর্টাল নিজ হাতে পরীক্ষা করুন' : 'Test Drive the 3 Specialized Portals Live'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {isBn
                ? 'প্রধান শিক্ষক, বিষয়ভিত্তিক শিক্ষক এবং শিক্ষার্থী/অভিভাবকদের আলাদা আলাদা ওয়ার্কস্পেস কীভাবে কাজ করে তা সরাসরি ক্লিক করে দেখুন।'
                : 'Click below to switch between the Principal, Teacher, and Student interfaces to experience the full operational workflow.'}
            </p>

            {/* Interactive Tab Switcher */}
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs gap-1 max-w-full overflow-x-auto">
              <button
                onClick={() => setHeroTab('principal')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                  heroTab === 'principal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <School size={16} />
                <span>{isBn ? '১. প্রধান শিক্ষক ড্যাশবোর্ড' : '1. Principal Dashboard'}</span>
              </button>

              <button
                onClick={() => setHeroTab('teacher')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                  heroTab === 'teacher' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen size={16} />
                <span>{isBn ? '২. শিক্ষক পোর্টাল' : '2. Teacher Portal'}</span>
              </button>

              <button
                onClick={() => setHeroTab('student')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                  heroTab === 'student' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={16} />
                <span>{isBn ? '৩. শিক্ষার্থী ও অভিভাবক পোর্টাল' : '3. Student & Parent Portal'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Container */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
            {/* TAB 1: PRINCIPAL / ADMIN */}
            {heroTab === 'principal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-xl font-bold text-white">
                        {isBn ? 'ক্যাম্পাস ওভারভিউ ও এক্সিকিউটিভ কন্ট্রোল' : 'Campus Executive Cockpit'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isBn ? 'প্রতিষ্ঠান প্রধানের সার্বিক মনিটরিং ও সিদ্ধান্ত গ্রহণ প্যানেল' : 'Full real-time oversight of attendance, collections, exams, and routines'}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <span>{isBn ? 'এডমিন ড্যাশবোর্ডে প্রবেশ করুন' : 'Launch Full Admin Suite'}</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'মোট শিক্ষার্থী' : 'Enrolled Students'}</p>
                    <p className="text-3xl font-black text-white mt-1">1,428</p>
                    <p className="text-xs text-emerald-400 mt-1">824 {isBn ? 'ছাত্র' : 'Boys'} • 604 {isBn ? 'ছাত্রী' : 'Girls'}</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'আজকের উপস্থিতি' : 'Attendance Rate'}</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1">96.8%</p>
                    <p className="text-xs text-slate-300 mt-1">1,382 {isBn ? 'জন উপস্থিত' : 'Present today'}</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'চলতি মাসের ফি আদায়' : 'Fees Collected'}</p>
                    <p className="text-3xl font-black text-blue-400 mt-1">৳ 14.85L</p>
                    <p className="text-xs text-slate-300 mt-1">81.6% {isBn ? 'রিকভারি সম্পন্ন' : 'Recovery Rate'}</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'টার্ম পরীক্ষার প্রস্তুতি' : 'Exam Readiness'}</p>
                    <p className="text-3xl font-black text-purple-400 mt-1">100%</p>
                    <p className="text-xs text-slate-300 mt-1">{isBn ? 'সকল বিষয়ের নম্বর প্রকাশিত' : 'All results published'}</p>
                  </div>
                </div>

                {/* Simulated Chart Bar */}
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      {isBn ? 'সাপ্তাহিক উপস্থিতি ও ফি কালেকশন ট্রেন্ড' : 'Weekly Velocity Trend: Daily Attendance % vs Fee Inflow'}
                    </span>
                    <span className="text-emerald-400 font-mono">● {isBn ? 'স্বয়ংক্রিয় সিঙ্ক' : 'Live Sync'}</span>
                  </div>
                  <div className="h-20 flex items-end gap-2 pt-4">
                    {[65, 80, 92, 88, 96, 94, 98].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-emerald-400 transition-all duration-500 hover:opacity-100 opacity-80"
                          style={{ height: `${val}%` }}
                        />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Today'][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEACHER PORTAL (INTERACTIVE ATTENDANCE) */}
            {heroTab === 'teacher' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                      <h3 className="text-xl font-bold text-white">
                        {isBn ? 'শিক্ষক ওয়ার্কস্পেস ও ক্লাসরুম হাজিরা' : 'Teacher Course Workspace & Marks Entry'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isBn ? 'নিচে ছাত্রছাত্রীদের স্ট্যাটাসে ক্লিক করে টেস্ট করুন (উপস্থিত / অনুপস্থিত / বিলম্ব)' : 'Interactive: Click on any student row below to toggle attendance status'}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full font-bold">
                    Class 9-A • Physics
                  </span>
                </div>

                {/* Simulated Attendance Roster */}
                <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs text-slate-400 font-bold">
                    <span>{isBn ? 'শিক্ষার্থীর নাম ও রোল' : 'Student Name & Roll'}</span>
                    <span>{isBn ? 'ক্লিক করে পরিবর্তন করুন' : 'Interactive Status Toggle'}</span>
                  </div>

                  {simulatedStudents.map(student => (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentStatus(student.id)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/40 cursor-pointer transition-all select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 font-mono text-xs font-bold flex items-center justify-center">
                          {student.roll}
                        </span>
                        <span className="text-sm font-semibold text-white">{student.name}</span>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          student.status === 'PRESENT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : student.status === 'ABSENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {student.status === 'PRESENT' ? '✓ Present (উপস্থিত)' : student.status === 'ABSENT' ? '✕ Absent (অনুপস্থিত)' : '⏱ Late (বিলম্ব)'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
                  <span>
                    {isBn ? 'মোট উপস্থিত:' : 'Attendance Summary:'} <strong className="text-emerald-400">{simulatedStudents.filter(s => s.status === 'PRESENT').length}</strong> / {simulatedStudents.length}
                  </span>
                  <span className="text-purple-300 font-bold">
                    {isBn ? 'নম্বর এন্ট্রি অগ্রগতি: ৮৫% সম্পন্ন' : 'Marks Entry Progress: 85% Complete'}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: STUDENT & PARENT (INTERACTIVE RESULT & FEE) */}
            {heroTab === 'student' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-xl font-bold text-white">
                        {isBn ? 'শিক্ষার্থী ও অভিভাবক স্ব-সেবা পোর্টাল' : 'Student & Guardian Live Portal'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isBn ? 'অনলাইনে মেধা তালিকা, গ্রেডশীট দেখা ও ফি পরিশোধ' : 'Check examination marksheets, term ranks, and pay tuition fees'}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-bold">
                    Student ID: STU-84920
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Results Card */}
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        {isBn ? 'টার্ম ২ ফাইনাল রেজাল্ট' : 'Term 2 Final Result'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Passed
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-white">GPA 5.00</span>
                      <span className="text-sm font-bold text-emerald-400">Grade: A+</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center text-xs">
                      <div className="p-2 bg-slate-900/60 rounded-xl">
                        <p className="text-slate-400 text-[10px]">{isBn ? 'মোট নম্বর' : 'Total Marks'}</p>
                        <p className="font-bold text-white mt-0.5">582 / 600</p>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded-xl">
                        <p className="text-slate-400 text-[10px]">{isBn ? 'শতকরা' : 'Percentage'}</p>
                        <p className="font-bold text-emerald-400 mt-0.5">97.0%</p>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded-xl">
                        <p className="text-slate-400 text-[10px]">{isBn ? 'মেধা স্থান' : 'Merit Rank'}</p>
                        <p className="font-bold text-amber-400 mt-0.5">১ম (1st)</p>
                      </div>
                    </div>
                  </div>

                  {/* Fee Payment Simulation */}
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                          {isBn ? 'টিউশন ফি বিল' : 'Tuition Fee Invoice'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          simulatedFeePaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {simulatedFeePaid ? 'Paid (পরিশোধিত)' : 'Due (বকেয়া)'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">৳ 2,500</span>
                        <span className="text-xs text-slate-400">Monthly Tuition + Exam Fee</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimulatedFeePaid(!simulatedFeePaid)}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        simulatedFeePaid
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-600/30'
                      }`}
                    >
                      <CreditCard size={15} />
                      <span>
                        {simulatedFeePaid
                          ? (isBn ? '✓ রসিদ ডাউনলোড করুন (Paid)' : '✓ Download Receipt (Paid)')
                          : (isBn ? 'বিকাশ দিয়ে ফি পরিশোধ করুন' : 'Pay ৳ 2,500 via bKash')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE FUNCTIONAL MODULES */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
            {isBn ? 'সম্পূর্ণ ফিচার স্যুট' : 'Comprehensive Feature Suite'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isBn ? 'প্রতিষ্ঠানের সকল কাজের জন্য একটি মাত্র সফটওয়্যার' : 'Everything Your Campus Needs to Operate Seamlessly'}
          </h2>
          <p className="text-base text-slate-600">
            {isBn
              ? 'হাতে খাতা লেখা ও কাগজপত্রের জটিল হিসাব থেকে মুক্ত হয়ে আধুনিক ডিজিটাল অটোমেশনের সুবিধা নিন।'
              : 'Say goodbye to scattered paperwork and fragile spreadsheets with our modular educational workflow engine.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                    {item.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>{isBn ? 'বিস্তারিত দেখুন' : 'Explore Capability'}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. INSTITUTION SOLUTIONS (SCHOOL, KINDERGARTEN, COACHING) */}
      <section id="solutions" className="py-20 bg-slate-100/70 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
              {isBn ? 'আপনার প্রতিষ্ঠানের ধরন অনুযায়ী' : 'Tailored by Academic Institution Type'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isBn ? 'যেকোনো ধরনের শিক্ষা প্রতিষ্ঠানের জন্য উপযোগী' : 'Engineered for Schools, Kindergartens & Coaching Centers'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-7 border-2 border-blue-500 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <School size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isBn ? 'স্কুল, কলেজ ও মাদ্রাসা' : 'K-12 Schools & Colleges'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? '১ম থেকে ১২শ শ্রেণি, শাখাভিত্তিক ছাত্রছাত্রী ভর্তি, আবশ্যিক ও ঐচ্ছিক বিষয়, বোর্ড স্ট্যান্ডার্ড রেজাল্ট গ্রেডিং ও বার্ষিক ফি ম্যানেজমেন্ট।'
                  : 'Classes 1 through 12, section-wise admissions, mandatory & elective subjects, board exam tabulation, and annual tuition management.'}
              </p>
              <div className="pt-2 text-xs font-bold text-blue-600 flex items-center gap-1.5">
                <Check size={16} /> <span>{isBn ? 'বোর্ড স্ট্যান্ডার্ড গ্রেডিং সিস্টেম' : 'Board Standard Grade Rules'}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Baby size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isBn ? 'কিন্ডারগার্টেন ও প্রাইমারি' : 'Kindergarten & Pre-School'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? 'প্লে, নার্সারি, কেজি ব্যাচ, অ্যাক্টিভিটি ভিত্তিক মূল্যায়ন, শিশুর দৈনিক হাজিরা ও অভিভাবকদের নিয়মিত এসএমএস আপডেট।'
                  : 'Playgroup, Nursery, KG batches, developmental assessment milestones, and automated parent communication.'}
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <Check size={16} /> <span>{isBn ? 'অভিভাবকদের সাথে সার্বক্ষণিক কানেকশন' : 'Direct Guardian Engagement'}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isBn ? 'কোচিং সেন্টার ও মডেল টেস্ট' : 'Coaching & Academic Centers'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? 'বিষয়ভিত্তিক ব্যাচ, শিফট ব্যবস্থাপনা, মডেল টেস্ট ও উইকলি পরীক্ষার মেধা তালিকা এবং টোকেন ভিত্তিক মাসিক টিউশন কালেকশন।'
                  : 'Batch-wise enrollments, shift coordination, weekly model test merit rankings, and tokenized tuition collection.'}
              </p>
              <div className="pt-2 text-xs font-bold text-amber-600 flex items-center gap-1.5">
                <Check size={16} /> <span>{isBn ? 'দ্রুতগতির ব্যাচ এনরোলমেন্ট' : 'High-Speed Batch Ingestion'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE SAVINGS & ROI CALCULATOR */}
      <section id="calculator" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-blue-200 border border-white/20 uppercase tracking-wider">
              {isBn ? 'সাশ্রয় ও কার্যকারিতা ক্যালকুলেটর' : 'Interactive ROI & Savings Calculator'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {isBn ? 'UEMP ব্যবহারে আপনার প্রতিষ্ঠানের কত সময় ও টাকা বাঁচবে?' : 'See How Much Time & Money UEMP Saves Your Campus'}
            </h2>
            <p className="text-sm text-slate-300">
              {isBn
                ? 'নিচের স্লাইডারটি টেনে আপনার প্রতিষ্ঠানের বর্তমান ছাত্রছাত্রীর সংখ্যা নির্ধারণ করুন।'
                : 'Drag the slider below to match your approximate student body count and see the live impact.'}
            </p>
          </div>

          {/* Slider Control */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm font-bold text-blue-200">
                {isBn ? 'মোট শিক্ষার্থী সংখ্যা:' : 'Total Student Body:'}
              </span>
              <span className="text-2xl font-black text-white font-mono bg-blue-600/40 px-4 py-1 rounded-xl border border-blue-400/30">
                {studentCount.toLocaleString()} {isBn ? 'জন' : 'Students'}
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="2500"
              step="50"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>100 {isBn ? 'জন' : 'Students'}</span>
              <span>1,250 {isBn ? 'জন' : 'Students'}</span>
              <span>2,500+ {isBn ? 'জন' : 'Students'}</span>
            </div>
          </div>

          {/* Dynamic Savings Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-1 text-center sm:text-left">
              <p className="text-xs text-slate-400 uppercase font-bold">{isBn ? 'প্রতি মাসে সংরক্ষিত কর্মঘণ্টা' : 'Staff Hours Saved / Month'}</p>
              <p className="text-4xl font-black text-emerald-400 font-mono">{hoursSaved}+ {isBn ? 'ঘণ্টা' : 'Hours'}</p>
              <p className="text-xs text-slate-300">{isBn ? 'হাতে খাতা লেখা ও হিসাব থেকে মুক্তি' : 'Freed from manual spreadsheet logging'}</p>
            </div>

            <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-1 text-center sm:text-left">
              <p className="text-xs text-slate-400 uppercase font-bold">{isBn ? 'কাগজ ও প্রিন্টিং খরচ সাশ্রয়' : 'Monthly Printing Saved'}</p>
              <p className="text-4xl font-black text-blue-400 font-mono">৳ {costSaved.toLocaleString()}</p>
              <p className="text-xs text-slate-300">{isBn ? 'ডিজিটাল রসিদ ও অটো মার্কশীটের সুবিধা' : 'Digital receipts and web transcripts'}</p>
            </div>

            <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-1 text-center sm:text-left">
              <p className="text-xs text-slate-400 uppercase font-bold">{isBn ? 'ফি আদায়ে ত্বরণ' : 'Faster Fee Recovery'}</p>
              <p className="text-4xl font-black text-amber-400 font-mono">+25% {isBn ? 'দ্রুততর' : 'Faster'}</p>
              <p className="text-xs text-slate-300">{isBn ? 'স্বয়ংক্রিয় এসএমএস ও বকেয়া নোটিফিকেশন' : 'Automated reminder alerts & bKash'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (INTERACTIVE ACCORDION) */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              {isBn ? 'সাধারণ জিজ্ঞাসা' : 'Common Inquiries'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isBn ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <div className={`p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isBn ? 'আজই আপনার প্রতিষ্ঠানকে করুন আধুনিক ও ডিজিটাল' : 'Transform Your Institution into a Digital Powerhouse'}
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            {isBn
              ? 'কয়েক মিনিটের মধ্যে বিনামূল্যে আপনার প্রতিষ্ঠানের ডিজিটাল ক্যাম্পাস ইনস্ট্যান্স চালু করুন।'
              : 'Provision your campus workspace in less than 2 minutes. No technical expertise required.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 hover:bg-slate-100 font-bold text-base rounded-2xl shadow-xl transition-all"
            >
              {isBn ? 'নিবন্ধন শুরু করুন' : 'Register Institution Instance'}
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-bold text-base rounded-2xl border border-white/20 transition-all"
            >
              {isBn ? 'লগইন করুন' : 'Sign In to Workspace'}
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 pt-16 pb-12 text-slate-400 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  U
                </div>
                <span className="text-xl font-black text-white">UEMP</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {isBn
                  ? 'বাংলাদেশের বিদ্যালয়, কিন্ডারগার্টেন ও কোচিং সেন্টারের জন্য সমন্বিত আধুনিক শিক্ষা প্ল্যাটফর্ম।'
                  : 'Unified Education Management Platform powering modern schools, kindergartens, and institutions across Bangladesh.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">{isBn ? 'মডিউলসমূহ' : 'Core Modules'}</p>
              <ul className="space-y-2">
                <li>{isBn ? 'স্মার্ট ডিজিটাল হাজিরা' : 'Smart Digital Attendance'}</li>
                <li>{isBn ? 'ফি ও বিকাশ কালেকশন' : 'Fees & MFS Invoicing'}</li>
                <li>{isBn ? 'পরীক্ষা ও ফলাফল প্রকাশ' : 'Exam Result Tabulation'}</li>
                <li>{isBn ? 'ক্লাস রুটিন ও পিরিয়ড' : 'Class Routine Timetable'}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">{isBn ? 'পোর্টালসমূহ' : 'Portals'}</p>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-white transition-colors">{isBn ? 'এডমিন ড্যাশবোর্ড' : 'Admin Cockpit'}</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">{isBn ? 'শিক্ষক পোর্টাল' : 'Teacher Workspace'}</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">{isBn ? 'শিক্ষার্থী ও অভিভাবক' : 'Student & Parent Portal'}</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">{isBn ? 'প্রতিষ্ঠান নিবন্ধন' : 'Campus Registration'}</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">{isBn ? 'ক্যাম্পাস সাপোর্ট' : 'Direct Helpline'}</p>
              <p className="flex items-center gap-2 text-slate-300 font-mono">
                <Phone size={14} className="text-emerald-400" />
                <span>+880 1700-000000</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail size={14} className="text-blue-400" />
                <span>support@uemp.edu.bd</span>
              </p>
              <p className="text-slate-500 pt-2">
                {isBn ? 'সকাল ৯টা থেকে রাত ৯টা (সপ্তাহের ৭ দিন)' : '9:00 AM - 9:00 PM (7 Days a Week)'}
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} UEMP Platform. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400">{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</a>
              <a href="#" className="hover:text-slate-400">{isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
