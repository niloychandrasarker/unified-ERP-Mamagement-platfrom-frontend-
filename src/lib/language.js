'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    features: 'Features',
    solutions: 'Solutions',
    pricing: 'Pricing',
    documentation: 'Documentation',
    contact: 'Contact',
    signIn: 'Sign In',
    registerInstitution: 'Register Institution',
    newInstitution: 'New Institution?',
    registerNow: 'Register Now',

    // Hero
    multiTenantPlatform: 'Multi-Tenant SaaS Platform',
    secureIsolated: 'Secure & Isolated',
    heroTitle: 'The All-in-One Operating System for Modern Educational Institutions',
    heroSubtitle: 'বিদ্যালয়, কিন্ডারগার্টেন ও কোচিং সেন্টারের আধুনিক ডিজিটাল প্ল্যাটফর্ম',
    heroDesc: 'Auto-provisioned high-speed workspace with strict database isolation. Manage admissions, attendance, fee collection, and board-compliant marksheets — all in one sovereign cloud infrastructure.',
    watchTour: 'Watch 2-Min Product Tour',
    trustedCampuses: 'Trusted by 450+ Campuses',
    regions: 'Across Dhaka, Chattogram, Sylhet, and Rajshahi',

    // Stats
    activeInstalls: 'Active Installs',
    activeInstallsSub: 'Institutions running daily',
    tuitionProcessed: 'Tuition Processed',
    tuitionProcessedSub: 'Through bKash, Nagad & Banks',
    dailyAttendance: 'Daily Attendance',
    dailyAttendanceSub: 'Biometric & In-app Logs/Day',
    examGradebooks: 'Exam Gradebooks',
    examGradebooksSub: 'Board Compliant Tabulation',

    // Login
    loginTitle: 'Sign In to Your Workspace',
    loginDesc: 'Enter your credentials to access your dedicated dashboard',
    workEmail: 'Work Email / Institution Email',
    securityPassword: 'Security Password',
    trustWorkstation: 'Trust this institutional workstation (30 days)',
    accessDashboard: 'Authenticate & Access Dashboard',
    detectedRole: 'Detected Role',
    autoDetectInfo: 'Automatic Role Routing',

    // Register
    regTitle: 'Register Your Institution',
    regDesc: 'Activate your dedicated multi-tenant campus cloud instance with dual-script bilingual support. 14-day full access free trial.',
    step1: 'Institution Identity',
    step2: 'Admin & Security',
    step3: 'Academic Session',
    step4: 'Cloud Provisioning',
    instClassification: '1. Institutional Classification',
    instDemographics: '2. Institution Demographics & Compliance',
    adminCreds: '3. Administrator Credentials',
    instNameEn: 'Institution Name (English)',
    instNameBn: 'Institution Name (Bengali)',
    phone: 'Official Phone Number',
    instEmail: 'Institution Email',
    address: 'Campus Address',
    district: 'Division / District',
    adminName: 'Admin Full Name',
    adminEmail: 'Admin Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    submitRegister: 'Provision & Activate Workspace →',
    haveAccount: 'Already have an account?',
    loginHere: 'Log in here',

    // Dashboard
    dashboard: 'Dashboard',
    welcomeBack: 'Welcome back',
    overview: 'Platform Overview',
    tenantInstitutions: 'Tenant Institutions',
    pendingApprovals: 'Pending Registrations',
    logout: 'Logout',
    session: 'Session: 2026-2027',
  },
  bn: {
    // Navigation
    features: 'সুবিধাসমূহ',
    solutions: 'সমাধান',
    pricing: 'মূল্যতালিকা',
    documentation: 'ডকুমেন্টেশন',
    contact: 'যোগাযোগ',
    signIn: 'লগইন করুন',
    registerInstitution: 'রেজিস্ট্রেশন করুন',
    newInstitution: 'নতুন প্রতিষ্ঠান?',
    registerNow: 'এখনই নিবন্ধন করুন',

    // Hero
    multiTenantPlatform: 'মাল্টি-টেন্যান্ট ক্লাউড প্ল্যাটফর্ম',
    secureIsolated: 'নিরাপদ ও আইসোলেটেড ডেটাবেজ',
    heroTitle: 'আধুনিক শিক্ষা প্রতিষ্ঠানের জন্য সর্বাধুনিক অপারেটিং সিস্টেম',
    heroSubtitle: 'বিদ্যালয়, কিন্ডারগার্টেন ও কোচিং সেন্টারের আধুনিক ডিজিটাল প্ল্যাটফর্ম',
    heroDesc: 'স্বয়ংক্রিয় ক্লাউড ওয়ার্কস্পেস ও সর্বোচ্চ ডেটা নিরাপত্তা। ভর্তি কার্যক্রম, ডিজিটাল হাজিরা, বিকাশ-নগদ ফি আদায় ও পরীক্ষার ফলাফল প্রস্তুত করুন এক ক্লিকেই।',
    watchTour: '২ মিনিটের ভিডিও দেখুন',
    trustedCampuses: '৪৫০+ শিক্ষা প্রতিষ্ঠানের আস্থা',
    regions: 'ঢাকা, চট্টগ্রাম, সিলেট, ও রাজশাহীর শীর্ষ প্রতিষ্ঠানসমূহে ব্যবহৃত',

    // Stats
    activeInstalls: 'সক্রিয় প্রতিষ্ঠান',
    activeInstallsSub: 'প্রতিদিন সফলভাবে ব্যবহৃত',
    tuitionProcessed: 'আদায়কিত টিউশন ফি',
    tuitionProcessedSub: 'বিকাশ, নগদ ও ব্যাংকের মাধ্যমে',
    dailyAttendance: 'দৈনিক ডিজিটাল হাজিরা',
    dailyAttendanceSub: 'বায়োমেট্রিক ও অ্যাপে সংগৃহীত',
    examGradebooks: 'নম্বরপত্র ও রেজাল্ট',
    examGradebooksSub: 'শিক্ষা বোর্ড গ্রেডিং নিয়মানুযায়ী',

    // Login
    loginTitle: 'আপনার ওয়ার্কস্পেসে লগইন করুন',
    loginDesc: 'ড্যাশবোর্ডে প্রবেশ করতে আপনার ইমেইল ও পাসওয়ার্ড প্রদান করুন',
    workEmail: 'প্রাতিষ্ঠানিক বা ইউজার ইমেইল',
    securityPassword: 'গোপন পাসওয়ার্ড',
    trustWorkstation: 'এই ডিভাইসে ৩০ দিন লগইন মনে রাখুন',
    accessDashboard: 'লগইন ও ড্যাশবোর্ডে প্রবেশ করুন',
    detectedRole: 'শনাক্তকৃত রোল',
    autoDetectInfo: 'স্বয়ংক্রিয় রোল শনাক্তকরণ',

    // Register
    regTitle: 'আপনার প্রতিষ্ঠানের নিবন্ধন সম্পন্ন করুন',
    regDesc: 'আপনার স্কুলের জন্য নিবেদিত ক্লাউড সফটওয়্যার চালু করুন। বাংলা ও ইংরেজি উভয় ভাষায় ব্যবহারের সুবিধা সহ ১৪ দিনের ফ্রি ট্রায়াল।',
    step1: 'প্রতিষ্ঠানের পরিচয়',
    step2: 'অ্যাডমিন ও নিরাপত্তা',
    step3: 'একাডেমিক সেশন',
    step4: 'ক্লাউড সক্রিয়করণ',
    instClassification: '১. প্রতিষ্ঠানের ধরণ নির্বাচন',
    instDemographics: '২. প্রতিষ্ঠানের বিবরণ ও তথ্য',
    adminCreds: '৩. প্রধান অ্যাডমিনের তথ্য',
    instNameEn: 'প্রতিষ্ঠানের নাম (ইংরেজি)',
    instNameBn: 'প্রতিষ্ঠানের নাম (বাংলা)',
    phone: 'অফিসিয়াল মোবাইল নম্বর',
    instEmail: 'প্রতিষ্ঠানের অফিসিয়াল ইমেইল',
    address: 'প্রতিষ্ঠানের পূর্ণ ঠিকানা',
    district: 'বিভাগ / জেলা',
    adminName: 'অ্যাডমিনের পূর্ণ নাম',
    adminEmail: 'অ্যাডমিনের ব্যক্তিগত ইমেইল',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পুনরায় পাসওয়ার্ড নিশ্চিত করুন',
    submitRegister: 'নিবন্ধন সম্পন্ন করুন এবং চালু করুন →',
    haveAccount: 'ইতিমধ্যে নিবন্ধিত প্রতিষ্ঠান?',
    loginHere: 'এখানে লগইন করুন',

    // Dashboard
    dashboard: 'ড্যাশবোর্ড',
    welcomeBack: 'স্বাগতম',
    overview: 'প্ল্যাটফর্ম ওভারভিউ',
    tenantInstitutions: 'নিবন্ধিত প্রতিষ্ঠানসমূহ',
    pendingApprovals: 'অপেক্ষমাণ অনুমোদনসমূহ',
    logout: 'লগআউট',
    session: 'শিক্ষাবর্ষ: ২০২৬-২০২৭',
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('uemp_lang');
    if (saved === 'bn' || saved === 'en') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('uemp_lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      t: (key) => translations.en[key] || key
    };
  }
  return context;
};
