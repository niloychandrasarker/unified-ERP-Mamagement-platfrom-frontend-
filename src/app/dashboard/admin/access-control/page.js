'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Users, UserPlus, Search, KeyRound, Copy, Check, Eye, EyeOff,
  Printer, Mail, Phone, BookOpen, Calendar, Award, Wallet, CheckCircle2,
  Sliders, Settings, Bell, Filter, Edit3, Trash2, UserCheck, ShieldAlert,
  Sparkles, ExternalLink, X, RefreshCw, ChevronRight, Lock, Unlock, BadgeCheck
} from 'lucide-react';
import { printCredentialSlip } from '@/lib/printRoutine';

export default function AccessControlPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [staffList, setStaffList] = useState([]);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Assistant Teacher',
    additional_designation: '',
    custom_additional_designation: '',
    department: 'General',
    employee_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    role: 'TEACHER',
    initial_password: 'Staff@2026',
    preset: 'TEACHER_GENERAL'
  });

  const [permissionsState, setPermissionsState] = useState({
    role: 'TEACHER',
    additional_designation: '',
    permissions: []
  });

  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const institutionId = user?.institution_id || user?.institution?.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const portalUrl = `${origin}/portal/${institutionId}/teacher`;

  // Fetch staff list and permission taxonomy schema
  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, schemaRes] = await Promise.all([
        api.get('/staff'),
        api.get('/staff/permissions-schema')
      ]);
      setStaffList(staffRes.data.data || []);
      setSchema(schemaRes.data.data || null);
    } catch (err) {
      console.error('Failed to load staff or schema', err);
      toast.error(isBn ? 'স্টাফ ও পারমিশন ডাটা লোড করা যায়নি' : 'Failed to load staff & permissions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Standard Designations fallback
  const standardDesignations = schema?.standardDesignations || [
    { id: 'Principal', en: 'Principal', bn: 'অধ্যক্ষ' },
    { id: 'Vice Principal', en: 'Vice Principal', bn: 'উপাধ্যক্ষ' },
    { id: 'Head Teacher', en: 'Head Teacher / Headmaster', bn: 'প্রধান শিক্ষক' },
    { id: 'Assistant Head Teacher', en: 'Assistant Head Teacher', bn: 'সহকারী প্রধান শিক্ষক' },
    { id: 'Senior Teacher', en: 'Senior Teacher', bn: 'সিনিয়র শিক্ষক' },
    { id: 'Assistant Teacher', en: 'Assistant Teacher', bn: 'সহকারী শিক্ষক' },
    { id: 'Junior Teacher', en: 'Junior Teacher', bn: 'জুনিয়র শিক্ষক' },
    { id: 'Lecturer', en: 'Lecturer', bn: 'প্রভাষক' },
    { id: 'Physical Education Teacher', en: 'Physical Education Teacher', bn: 'শরীরচর্চা শিক্ষক' },
    { id: 'Religious Teacher', en: 'Religious Teacher (Moulvi)', bn: 'ধর্মীয় শিক্ষক (মাওলানা)' },
    { id: 'ICT Teacher', en: 'ICT Teacher / Instructor', bn: 'আইসিটি শিক্ষক' },
    { id: 'Academic Coordinator', en: 'Academic Coordinator', bn: 'একাডেমিক কো-অর্ডিনেটর' },
    { id: 'Exam Controller', en: 'Exam Controller', bn: 'পরীক্ষা নিয়ন্ত্রক' },
    { id: 'Chief Accountant', en: 'Chief Accountant', bn: 'প্রধান হিসাব কর্মকর্তা' },
    { id: 'Cashier', en: 'Cashier / Assistant Accountant', bn: 'ক্যাশিয়ার' },
    { id: 'Office Assistant', en: 'Office Assistant / Computer Operator', bn: 'অফিস সহকারী' },
    { id: 'Librarian', en: 'Librarian', bn: 'গ্রন্থাগারিক' },
    { id: 'Lab Assistant', en: 'Lab Assistant', bn: 'ল্যাব সহকারী' },
    { id: 'Security Guard', en: 'Security Guard / Staff', bn: 'নিরাপত্তাকর্মী / অফিস সহায়ক' }
  ];

  const standardAdditionalDesignations = schema?.additionalDesignations || [
    { id: 'Academic Coordinator', en: 'Academic Coordinator', bn: 'একাডেমিক সমন্বয়কারী' },
    { id: 'Routine & Schedule In-Charge', en: 'Routine & Schedule In-Charge', bn: 'ক্লাস রুটিন প্রণয়ন ইনচার্জ' },
    { id: 'Exam Committee Head', en: 'Exam Committee Head', bn: 'পরীক্ষা কমিটি আহ্বায়ক' },
    { id: 'Exam Committee Member', en: 'Exam Committee Member', bn: 'পরীক্ষা কমিটি সদস্য' },
    { id: 'Class Teacher', en: 'Class Teacher', bn: 'শ্রেণি শিক্ষক' },
    { id: 'Cultural Secretary', en: 'Cultural & Events Secretary', bn: 'সাংস্কৃতিক ও অনুষ্ঠান বিষয়ক দায়িত্ব' },
    { id: 'Sports In-Charge', en: 'Sports & Athletics In-Charge', bn: 'ক্রীড়া ও খেলাধুলা ইনচার্জ' },
    { id: 'ICT & Lab Coordinator', en: 'ICT & Smart Lab Coordinator', bn: 'আইসিটি ও ডিজিটাল ল্যাব ইনচার্জ' },
    { id: 'Scout & BNCC Leader', en: 'Scout / BNCC Leader', bn: 'স্কাউট / বিএনসিসি শিক্ষক' },
    { id: 'Discipline Committee Head', en: 'Discipline Committee Head', bn: 'শৃঙ্খলা কমিটি প্রধান' }
  ];

  const presets = schema?.presets || [];
  const modules = schema?.modules || [];

  // Metrics computation
  const metrics = useMemo(() => {
    const total = staffList.length;
    const routineManagers = staffList.filter(s => {
      const perms = Array.isArray(s.permissions) ? s.permissions : (typeof s.permissions === 'string' ? JSON.parse(s.permissions || '[]') : []);
      return perms.includes('academic.routine') || (s.additional_designation && s.additional_designation.toLowerCase().includes('routine'));
    }).length;
    const examControllers = staffList.filter(s => {
      const perms = Array.isArray(s.permissions) ? s.permissions : (typeof s.permissions === 'string' ? JSON.parse(s.permissions || '[]') : []);
      return perms.includes('exams.publish') || (s.additional_designation && s.additional_designation.toLowerCase().includes('exam'));
    }).length;
    const accountants = staffList.filter(s => s.role === 'ACCOUNTANT' || (Array.isArray(s.permissions) && s.permissions.includes('fees.collect'))).length;
    return { total, routineManagers, examControllers, accountants };
  }, [staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.employee_id?.toLowerCase().includes(q) ||
        s.designation?.toLowerCase().includes(q) ||
        s.additional_designation?.toLowerCase().includes(q);

      const matchDept = selectedDepartment === 'ALL' || s.department === selectedDepartment;

      let matchRole = true;
      if (selectedRoleFilter === 'ROUTINE') {
        const perms = Array.isArray(s.permissions) ? s.permissions : [];
        matchRole = perms.includes('academic.routine') || s.additional_designation?.toLowerCase().includes('routine');
      } else if (selectedRoleFilter === 'EXAMS') {
        const perms = Array.isArray(s.permissions) ? s.permissions : [];
        matchRole = perms.includes('exams.publish') || s.additional_designation?.toLowerCase().includes('exam');
      } else if (selectedRoleFilter === 'ACCOUNTANT') {
        matchRole = s.role === 'ACCOUNTANT';
      } else if (selectedRoleFilter === 'ADMIN') {
        matchRole = s.role === 'INSTITUTION_ADMIN';
      }

      return matchSearch && matchDept && matchRole;
    });
  }, [staffList, searchTerm, selectedDepartment, selectedRoleFilter]);

  // Handle Preset Change in Add Form
  const handlePresetSelect = (presetId) => {
    const p = presets.find(item => item.presetId === presetId);
    if (!p) return;
    setFormData(prev => ({
      ...prev,
      preset: presetId,
      role: p.baseRole,
      additional_designation:
        presetId === 'ACADEMIC_COORDINATOR'
          ? 'Routine & Schedule In-Charge'
          : presetId === 'EXAM_CONTROLLER'
          ? 'Exam Committee Head'
          : prev.additional_designation
    }));
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'Assistant Teacher',
      additional_designation: '',
      custom_additional_designation: '',
      department: 'General',
      employee_id: `EMP-${new Date().getFullYear()}-${String(staffList.length + 1).padStart(3, '0')}`,
      joining_date: new Date().toISOString().split('T')[0],
      role: 'TEACHER',
      initial_password: 'Staff@2026',
      preset: 'TEACHER_GENERAL'
    });
    setAddModalOpen(true);
  };

  // Submit Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(isBn ? 'নাম এবং ইমেইল দেওয়া আবশ্যক' : 'Name and email are required');
      return;
    }

    const finalAdditional =
      formData.additional_designation === 'CUSTOM'
        ? formData.custom_additional_designation.trim()
        : formData.additional_designation;

    // Resolve preset permissions
    const p = presets.find(item => item.presetId === formData.preset);
    const initialPerms = p ? p.defaultPermissions : ['academic.attendance', 'exams.marks', 'students.view'];

    try {
      setSaving(true);
      const res = await api.post('/staff', {
        ...formData,
        additional_designation: finalAdditional || null,
        permissions: initialPerms
      });

      toast.success(isBn ? 'নতুন শিক্ষক/স্টাফ সফলভাবে যুক্ত হয়েছে!' : 'Staff member registered successfully!');
      setAddModalOpen(false);
      await fetchData();

      // Open credentials slip for newly added staff
      if (res.data?.data) {
        setSelectedStaff(res.data.data);
        setSlipModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (isBn ? 'স্টাফ যুক্ত করা যায়নি' : 'Failed to register staff'));
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    const isStandardAdd = standardAdditionalDesignations.some(d => d.id === staff.additional_designation);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      designation: staff.designation || 'Assistant Teacher',
      additional_designation: staff.additional_designation ? (isStandardAdd ? staff.additional_designation : 'CUSTOM') : '',
      custom_additional_designation: !isStandardAdd && staff.additional_designation ? staff.additional_designation : '',
      department: staff.department || 'General',
      employee_id: staff.employee_id || '',
      joining_date: staff.joining_date ? String(staff.joining_date).split('T')[0] : '',
      role: staff.role || 'TEACHER',
      initial_password: staff.initial_password || 'Staff@2026'
    });
    setEditModalOpen(true);
  };

  // Submit Edit Staff
  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(isBn ? 'নাম দেওয়া আবশ্যক' : 'Name is required');
      return;
    }

    const finalAdditional =
      formData.additional_designation === 'CUSTOM'
        ? formData.custom_additional_designation.trim()
        : formData.additional_designation;

    try {
      setSaving(true);
      await api.put(`/staff/${selectedStaff.id}`, {
        name: formData.name,
        phone: formData.phone,
        designation: formData.designation,
        additional_designation: finalAdditional || null,
        department: formData.department,
        employee_id: formData.employee_id,
        joining_date: formData.joining_date || null
      });

      toast.success(isBn ? 'প্রোফাইল তথ্য আপডেট হয়েছে!' : 'Profile updated successfully!');
      setEditModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'আপডেট করা যায়নি' : 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  // Open Permissions Drawer/Modal
  const openPermissionsModal = (staff) => {
    setSelectedStaff(staff);
    const rawPerms = Array.isArray(staff.permissions)
      ? staff.permissions
      : (typeof staff.permissions === 'string' ? JSON.parse(staff.permissions || '[]') : []);

    setPermissionsState({
      role: staff.role || 'TEACHER',
      additional_designation: staff.additional_designation || '',
      permissions: [...rawPerms]
    });
    setPermissionsModalOpen(true);
  };

  // Toggle single permission key
  const togglePermission = (key) => {
    setPermissionsState(prev => {
      const exists = prev.permissions.includes(key);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== key)
          : [...prev.permissions, key]
      };
    });
  };

  // Apply a preset directly in permissions modal
  const applyPresetToState = (presetId) => {
    const p = presets.find(item => item.presetId === presetId);
    if (!p) return;
    setPermissionsState(prev => ({
      ...prev,
      role: p.baseRole,
      permissions: [...p.defaultPermissions],
      additional_designation:
        presetId === 'ACADEMIC_COORDINATOR'
          ? 'Routine & Schedule In-Charge'
          : presetId === 'EXAM_CONTROLLER'
          ? 'Exam Committee Head'
          : prev.additional_designation
    }));
    toast.success(isBn ? `"${p.nameBn}" প্রিসেট প্রয়োগ করা হয়েছে!` : `Preset "${p.name}" applied!`);
  };

  // Select all or clear all in a module
  const toggleModulePermissions = (module) => {
    const moduleKeys = module.permissions.map(p => p.key);
    const allSelected = moduleKeys.every(k => permissionsState.permissions.includes(k));

    setPermissionsState(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(k => !moduleKeys.includes(k))
        : Array.from(new Set([...prev.permissions, ...moduleKeys]))
    }));
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      await api.put(`/staff/${selectedStaff.id}/permissions`, {
        role: permissionsState.role,
        permissions: permissionsState.permissions,
        additional_designation: permissionsState.additional_designation
      });

      toast.success(isBn ? 'পারমিশন সফলভাবে সংরক্ষণ করা হয়েছে!' : 'Permissions saved successfully!');
      setPermissionsModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'পারমিশন সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save permissions'));
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (staff) => {
    try {
      await api.patch(`/staff/${staff.id}/toggle-status`);
      toast.success(isBn ? 'স্টাফ একাউন্ট স্ট্যাটাস পরিবর্তিত হয়েছে!' : 'Status updated!');
      await fetchData();
    } catch (err) {
      toast.error(isBn ? 'স্ট্যাটাস পরিবর্তন করা যায়নি' : 'Failed to toggle status');
    }
  };

  // Copy Credentials
  const handleCopyCredentials = (staff) => {
    const text = `🏫 ${user?.institution?.name || 'School'} — Official Faculty Login Credentials\n\n👤 Name: ${staff.name}\n🔖 Designation: ${staff.designation}${staff.additional_designation ? ` (${staff.additional_designation})` : ''}\n🆔 Staff ID: ${staff.employee_id || staff.username || '—'}\n✉️ Login Email: ${staff.email}\n🔑 Initial Password: ${staff.initial_password || 'Staff@2026'}\n🌐 Faculty Portal: ${portalUrl}\n\nPlease keep your credentials confidential.`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    toast.success(isBn ? 'লগইন তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Login credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle revealed password
  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Print Slip
  const handlePrintSlip = () => {
    if (!selectedStaff) return;
    printCredentialSlip({
      staff: selectedStaff,
      institution: user?.institution,
      portalUrl,
      isBn
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <ShieldCheck size={16} className="text-indigo-600" />
            <span>{isBn ? 'ইনস্টিটিউট অ্যাডমিন • অ্যাক্সেস ও পারমিশন কন্ট্রোল' : 'Institute Admin • Access & Role Control'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isBn ? 'স্টাফ ম্যানেজমেন্ট ও রোল পারমিশন সেন্টার' : 'Faculty & Staff Access Control Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {isBn
              ? 'সকল শিক্ষক ও স্টাফদের পদবি (Designation), অতিরিক্ত দায়িত্ব (যেমন: একাডেমিক রুটিন ইনচার্জ, পরীক্ষা নিয়ন্ত্রক) এবং ফিচার-ভিত্তিক অ্যাক্সেস পারমিশন পরিচালনা করুন।'
              : 'Onboard faculty with authentic institutional designations, assign special operational roles (Routine Managers, Exam Controllers), and configure granular feature permissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs hover:rotate-180"
            title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <UserPlus size={16} />
            <span>{isBn ? '+ নতুন শিক্ষক / স্টাফ যুক্ত করুন' : '+ Add Faculty / Staff'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBn ? 'মোট শিক্ষক ও স্টাফ' : 'Total Faculty & Staff'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBn ? 'ইনস্টিটিউটের সক্রিয় একাউন্ট' : 'Registered institution accounts'}
          </p>
        </div>

        {/* Academic Routine Managers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              {isBn ? 'রুটিন ইনচার্জ (Academic Maintain)' : 'Routine In-Charges'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.routineManagers}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBn ? 'ক্লাস রুটিন প্রণয়ন ও নিয়ন্ত্রণ ক্ষমতা' : 'Can edit & publish class timetables'}
          </p>
        </div>

        {/* Exam Controllers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              {isBn ? 'পরীক্ষা নিয়ন্ত্রক / সমন্বয়কারী' : 'Exam Controllers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.examControllers}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBn ? 'পরীক্ষার রুটিন ও ফলাফল প্রকাশের ক্ষমতা' : 'Exam schedule & result approval'}
          </p>
        </div>

        {/* Financial Staff */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              {isBn ? 'হিসাব ও ফি আদায় কর্মকর্তা' : 'Accounts & Billing Staff'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.accountants}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBn ? 'কাউন্টার ফি গ্রহণ ও ইনভয়েস ট্র্যাকিং' : 'Fee collection & ledger control'}
          </p>
        </div>
      </div>

      {/* 3. Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'নাম, ইমেইল, পদবি বা ফোন দিয়ে খুঁজুন...' : 'Search staff by name, email, designation...'}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedRoleFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isBn ? 'সকল' : 'All'}
            </button>
            <button
              onClick={() => setSelectedRoleFilter('ROUTINE')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                selectedRoleFilter === 'ROUTINE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar size={13} />
              <span>{isBn ? 'রুটিন ইনচার্জ' : 'Routine'}</span>
            </button>
            <button
              onClick={() => setSelectedRoleFilter('EXAMS')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                selectedRoleFilter === 'EXAMS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={13} />
              <span>{isBn ? 'পরীক্ষা' : 'Exams'}</span>
            </button>
            <button
              onClick={() => setSelectedRoleFilter('ACCOUNTANT')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                selectedRoleFilter === 'ACCOUNTANT' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet size={13} />
              <span>{isBn ? 'হিসাবরক্ষক' : 'Finance'}</span>
            </button>
          </div>

          {/* Department Select */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">{isBn ? 'সব বিভাগ (Department)' : 'All Departments'}</option>
            <option value="General">{isBn ? 'জেনারেল (General)' : 'General'}</option>
            <option value="Science">{isBn ? 'বিজ্ঞান (Science)' : 'Science'}</option>
            <option value="Humanities">{isBn ? 'মানবিক (Humanities)' : 'Humanities'}</option>
            <option value="Business Studies">{isBn ? 'ব্যবসায় শিক্ষা (Commerce)' : 'Business Studies'}</option>
            <option value="Administration">{isBn ? 'প্রশাসন (Administration)' : 'Administration'}</option>
          </select>
        </div>
      </div>

      {/* 4. Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              {isBn ? 'স্টাফ ও ফ্যাকাল্টি রোস্টার' : 'Staff & Faculty Roster'}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredStaff.length} {isBn ? 'জন' : 'members'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isBn ? 'প্রতিটি স্টাফের পারমিশন আলাদাভাবে পরিবর্তন করা যাবে' : 'Granular permissions can be customized per staff'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading staff directory...'}</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">{isBn ? 'কোনো স্টাফ পাওয়া যায়নি' : 'No staff members found'}</p>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'নতুন শিক্ষক বা স্টাফ যোগ করতে উপরের বোতামটি ব্যবহার করুন।' : 'Add new staff members using the button above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">{isBn ? 'স্টাফ বিবরণ' : 'Faculty Member'}</th>
                  <th className="py-3 px-4">{isBn ? 'মূল পদবি' : 'Primary Designation'}</th>
                  <th className="py-3 px-4">{isBn ? 'অতিরিক্ত দায়িত্ব / পদবি' : 'Additional Role / Special Duty'}</th>
                  <th className="py-3 px-4">{isBn ? 'সক্রিয় পারমিশন' : 'Active Permissions'}</th>
                  <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const perms = Array.isArray(staff.permissions)
                    ? staff.permissions
                    : (typeof staff.permissions === 'string' ? JSON.parse(staff.permissions || '[]') : []);

                  const isRoutineInCharge = perms.includes('academic.routine') || staff.additional_designation?.toLowerCase().includes('routine');
                  const isExamInCharge = perms.includes('exams.publish') || staff.additional_designation?.toLowerCase().includes('exam');

                  return (
                    <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {staff.name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 truncate">{staff.name}</p>
                              {staff.employee_id && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  {staff.employee_id}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail size={11} />
                                {staff.email}
                              </span>
                              {staff.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={11} />
                                  {staff.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Primary Designation */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                          {staff.designation || 'Faculty Member'}
                        </span>
                        {staff.department && staff.department !== 'General' && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Dept: {staff.department}
                          </span>
                        )}
                      </td>

                      {/* Additional Designation */}
                      <td className="py-3 px-4">
                        {staff.additional_designation ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isRoutineInCharge
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                              : isExamInCharge
                              ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isRoutineInCharge && <Calendar size={12} className="text-emerald-600" />}
                            {isExamInCharge && <Award size={12} className="text-purple-600" />}
                            {staff.additional_designation}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {isBn ? 'কোনো অতিরিক্ত দায়িত্ব নেই' : 'Standard Faculty'}
                          </span>
                        )}
                      </td>

                      {/* Active Permissions Summary */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {isRoutineInCharge && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {isBn ? 'রুটিন কন্ট্রোল' : 'Routine'}
                            </span>
                          )}
                          {perms.includes('exams.marks') && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {isBn ? 'নম্বর এন্ট্রি' : 'Marks'}
                            </span>
                          )}
                          {perms.includes('academic.attendance') && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {isBn ? 'হাজিরা' : 'Attendance'}
                            </span>
                          )}
                          {perms.includes('fees.collect') && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {isBn ? 'ফি আদায়' : 'Fees'}
                            </span>
                          )}
                          {perms.includes('exams.publish') && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              {isBn ? 'ফলাফল প্রকাশ' : 'Results'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-semibold px-1 py-0.5 bg-slate-100 rounded">
                            +{perms.length} {isBn ? 'টি' : 'perms'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            staff.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {staff.is_active ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manage Permissions */}
                          <button
                            onClick={() => openPermissionsModal(staff)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all border border-indigo-200/80 shadow-2xs group/btn"
                            title={isBn ? 'রোল ও পারমিশন পরিবর্তন করুন' : 'Configure Roles & Permissions'}
                          >
                            <ShieldCheck size={14} className="group-hover/btn:rotate-12 transition-transform" />
                            <span>{isBn ? 'পারমিশন' : 'Access'}</span>
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200"
                            title={isBn ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Print Credential Slip */}
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setSlipModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200"
                            title={isBn ? 'লগইন স্লিপ প্রিন্ট ও কপি' : 'Print/Copy Login Slip'}
                          >
                            <KeyRound size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          5. MODAL: ADD NEW STAFF / FACULTY
          ========================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isBn ? 'নতুন শিক্ষক বা স্টাফ যুক্ত করুন' : 'Add New Faculty / Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'পদবি ও রোল নির্বাচন করে শিক্ষকের একাউন্ট তৈরি করুন' : 'Assign designations and role permissions directly'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddStaff} className="p-6 space-y-4 text-xs">
              {/* Quick Preset Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isBn ? '১. রোল প্রিসেট বেছে নিন (Quick Role Preset)' : '1. Select Role Preset'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presets.map((p) => {
                    const isSelected = formData.preset === p.presetId;
                    return (
                      <button
                        type="button"
                        key={p.presetId}
                        onClick={() => handlePresetSelect(p.presetId)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {isBn ? p.nameBn : p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wider">
                  {isBn ? '২. শিক্ষক / স্টাফের ব্যক্তিগত বিবরণ' : '2. Personal & Profile Details'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'পূর্ণ নাম (Full Name) *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Md. Rafiqul Islam"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'লগইন ইমেইল (Login Email) *' : 'Login Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rafiq@school.edu.bd"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'মোবাইল নম্বর (Phone)' : 'Mobile Phone'}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 01712345678"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'স্টাফ / শিক্ষক আইডি (Employee ID)' : 'Employee / Staff ID'}
                    </label>
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="e.g. EMP-2026-001"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Designations Section */}
              <div className="border-t border-slate-100 pt-3">
                <p className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wider">
                  {isBn ? '৩. প্রাতিষ্ঠানিক পদবি ও দায়িত্ব' : '3. Institutional Designation & Duties'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Designation Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'মূল পদবি (Primary Designation) *' : 'Primary Designation *'}
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white font-medium"
                    >
                      {standardDesignations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {isBn ? d.bn : d.en} ({d.id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isBn ? 'স্কুলে যে পদে শিক্ষক বা কর্মচারী নিযুক্ত আছেন' : 'Official appointment title'}
                    </p>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'বিভাগ / শাখা (Department)' : 'Department / Faculty'}
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white font-medium"
                    >
                      <option value="General">{isBn ? 'জেনারেল (General)' : 'General'}</option>
                      <option value="Science">{isBn ? 'বিজ্ঞান (Science)' : 'Science'}</option>
                      <option value="Humanities">{isBn ? 'মানবিক (Humanities)' : 'Humanities'}</option>
                      <option value="Business Studies">{isBn ? 'ব্যবসায় শিক্ষা (Commerce)' : 'Business Studies'}</option>
                      <option value="Primary">{isBn ? 'প্রাথমিক শাখা (Primary Section)' : 'Primary Section'}</option>
                      <option value="Administration">{isBn ? 'প্রশাসন ও অফিস (Administration)' : 'Administration'}</option>
                    </select>
                  </div>

                  {/* Additional Designation Dropdown */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'অতিরিক্ত পদবি / বিশেষ দায়িত্ব (Additional Designation)' : 'Additional Role / Special Duty'}
                    </label>
                    <select
                      value={formData.additional_designation}
                      onChange={(e) => setFormData({ ...formData, additional_designation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white font-medium"
                    >
                      <option value="">{isBn ? '-- কোনো অতিরিক্ত দায়িত্ব নেই (None) --' : '-- None --'}</option>
                      {standardAdditionalDesignations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {isBn ? d.bn : d.en} ({d.id})
                        </option>
                      ))}
                      <option value="CUSTOM">{isBn ? '➕ অন্য কোনো দায়িত্ব (নিজে লিখুন...)' : '➕ Custom Designation...'}</option>
                    </select>

                    {formData.additional_designation === 'CUSTOM' && (
                      <input
                        type="text"
                        value={formData.custom_additional_designation}
                        onChange={(e) => setFormData({ ...formData, custom_additional_designation: e.target.value })}
                        placeholder={isBn ? 'কাস্টম অতিরিক্ত পদবি লিখুন...' : 'Enter custom special role title...'}
                        className="mt-2 w-full p-2.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-indigo-50/20 font-semibold text-indigo-900"
                      />
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isBn ? 'যেমন: ক্লাস রুটিন ইনচার্জ, পরীক্ষা কমিটির প্রধান ইত্যাদি' : 'Special responsibility e.g. Routine In-Charge, Exam Head'}
                    </p>
                  </div>

                  {/* Initial Password */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'প্রাথমিক পাসওয়ার্ড (Initial Password)' : 'Initial Password'}
                    </label>
                    <input
                      type="text"
                      value={formData.initial_password}
                      onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'যোগদানের তারিখ (Joining Date)' : 'Joining Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'যুক্ত ও সংরক্ষণ করুন' : 'Register Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          6. MODAL: EDIT STAFF DETAILS
          ========================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isBn ? 'প্রোফাইল ও পদবি সম্পাদন' : 'Edit Faculty Profile'}
                </h3>
                <p className="text-xs text-slate-500">{selectedStaff?.name} • {selectedStaff?.email}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ফোন নম্বর' : 'Phone'}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'এমপ্লয়ি আইডি' : 'Employee ID'}</label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মূল পদবি' : 'Primary Designation'}</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium"
                  >
                    {standardDesignations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isBn ? d.bn : d.en} ({d.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'বিভাগ' : 'Department'}</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Science">Science</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Business Studies">Business Studies</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isBn ? 'অতিরিক্ত পদবি / বিশেষ দায়িত্ব' : 'Additional Role / Special Duty'}
                </label>
                <select
                  value={formData.additional_designation}
                  onChange={(e) => setFormData({ ...formData, additional_designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium"
                >
                  <option value="">{isBn ? '-- কোনো অতিরিক্ত দায়িত্ব নেই --' : '-- None --'}</option>
                  {standardAdditionalDesignations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isBn ? d.bn : d.en}
                    </option>
                  ))}
                  <option value="CUSTOM">{isBn ? '➕ অন্য কোনো দায়িত্ব (নিজে লিখুন)' : '➕ Custom...'}</option>
                </select>

                {formData.additional_designation === 'CUSTOM' && (
                  <input
                    type="text"
                    value={formData.custom_additional_designation}
                    onChange={(e) => setFormData({ ...formData, custom_additional_designation: e.target.value })}
                    placeholder={isBn ? 'কাস্টম পদবি লিখুন...' : 'Enter custom designation...'}
                    className="mt-2 w-full p-2.5 rounded-xl border border-indigo-300 outline-none bg-indigo-50/20 font-semibold"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'আপডেট করুন' : 'Update Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          7. MODAL: GRANULAR ACCESS & PERMISSIONS MATRIX
          ========================================== */}
      {permissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedStaff?.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {selectedStaff?.designation || 'Faculty'}
                    </span>
                    {selectedStaff?.additional_designation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold">
                        {selectedStaff?.additional_designation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isBn ? 'ফিচার-ভিত্তিক পারমিশন নিয়ন্ত্রণ ও রোল অনুমোদন' : 'Configure feature-level permissions and administrative roles'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Quick Presets Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles size={14} className="text-indigo-600" />
                    {isBn ? '১-ক্লিক প্রিসেট প্রয়োগ করুন (Quick Presets)' : 'Apply 1-Click Role Presets'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isBn ? 'প্রিসেট ক্লিক করলে স্বয়ংক্রিয় পারমিশন সেট হবে' : 'Automatically toggles recommended permissions'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.presetId}
                      type="button"
                      onClick={() => applyPresetToState(p.presetId)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all shadow-2xs group"
                    >
                      <p className="font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-1">
                        {isBn ? p.nameBn : p.name}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {p.defaultPermissions.length} {isBn ? 'টি পারমিশন' : 'perms'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Focus Notice for Academic Routine */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Calendar size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900 text-xs">
                    {isBn ? 'একাডেমিক রুটিন পরিচালনা ও মেইনটেইন (Academic Maintain)' : 'Academic Routine Management'}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {isBn
                      ? 'যে শিক্ষকদের ক্লাস রুটিন তৈরি ও পরিবর্তনের দায়িত্ব দিতে চান, নিচের "ক্লাস রুটিন প্রণয়ন ও নিয়ন্ত্রণ (academic.routine)" পারমিশনটি সিলেক্ট করে দিন।'
                      : 'Grant "academic.routine" below to allow this teacher to create, adjust, and publish weekly class timetables.'}
                  </p>
                </div>
              </div>

              {/* Categorized Permissions Checklists */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                    {isBn ? 'ফিচার ও মডিউল পারমিশন তালিকা' : 'Feature & Module Permissions'}
                  </h4>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {permissionsState.permissions.length} {isBn ? 'টি পারমিশন সক্রিয়' : 'permissions active'}
                  </span>
                </div>

                {modules.map((module) => {
                  const moduleKeys = module.permissions.map(p => p.key);
                  const activeCount = moduleKeys.filter(k => permissionsState.permissions.includes(k)).length;
                  const allActive = activeCount === moduleKeys.length;

                  return (
                    <div
                      key={module.moduleId}
                      className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            {isBn ? module.moduleNameBn : module.moduleName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {activeCount}/{moduleKeys.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(module)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {allActive ? (isBn ? 'সব মুছুন' : 'Deselect All') : (isBn ? 'সব সিলেক্ট করুন' : 'Select All')}
                        </button>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {module.permissions.map((perm) => {
                          const isChecked = permissionsState.permissions.includes(perm.key);
                          const isSpecialRoutine = perm.key === 'academic.routine';

                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? isSpecialRoutine
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30'
                                    : 'bg-indigo-50/50 border-indigo-300 text-indigo-950'
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.key)}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs leading-snug">
                                    {isBn ? perm.nameBn : perm.name}
                                  </p>
                                  {isSpecialRoutine && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider">
                                      Special
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                                  {isBn ? perm.descriptionBn : perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {isBn ? 'পরিবর্তন করার সাথে সাথে শিক্ষক পোর্টালে কার্যকর হবে' : 'Changes apply immediately on portal login'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  <span>{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'পারমিশন সংরক্ষণ করুন' : 'Save Permissions')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          8. MODAL: CREDENTIALS SLIP & QUICK COPY
          ========================================== */}
      {slipModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isBn ? 'শিক্ষক/স্টাফ লগইন স্লিপ' : 'Official Credentials Slip'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{isBn ? 'পোর্টাল ব্যবহারের জন্য হস্তান্তর করুন' : 'Hand over to faculty member'}</p>
                </div>
              </div>
              <button
                onClick={() => setSlipModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slip Paper Card */}
            <div id="printable-credential-slip" className="my-5 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100 shadow-inner space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-dashed border-indigo-200">
                <p className="font-black text-sm text-indigo-950 font-sans tracking-wide">
                  {user?.institution?.name || 'Unified Education Management Platform'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans mt-0.5">
                  FACULTY LOGIN CREDENTIAL SLIP
                </p>
              </div>

              <div className="space-y-1.5 font-sans text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{isBn ? 'নাম:' : 'Name:'}</span>
                  <span className="font-bold text-slate-900">{selectedStaff.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{isBn ? 'পদবি:' : 'Designation:'}</span>
                  <span className="font-bold text-indigo-700">
                    {selectedStaff.designation}
                    {selectedStaff.additional_designation && ` (${selectedStaff.additional_designation})`}
                  </span>
                </div>
                {selectedStaff.employee_id && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">{isBn ? 'এমপ্লয়ি আইডি:' : 'Staff ID:'}</span>
                    <span className="font-mono text-slate-800">{selectedStaff.employee_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{isBn ? 'লগইন ইমেইল:' : 'Email:'}</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStaff.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">{isBn ? 'প্রাথমিক পাসওয়ার্ড:' : 'Password:'}</span>
                  <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {selectedStaff.initial_password || 'Staff@2026'}
                  </span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-slate-500 mb-1">{isBn ? 'পোর্টাল লিংক:' : 'Portal URL:'}</span>
                  <span className="font-mono text-[10px] text-blue-600 break-all bg-white p-2 rounded border border-slate-200">
                    {portalUrl}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedStaff)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                {copiedId === selectedStaff.id ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span>{isBn ? 'কপি সম্পন্ন!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>{isBn ? 'তথ্য কপি করুন (WhatsApp/SMS)' : 'Copy Credentials'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrintSlip}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <Printer size={16} />
                <span>{isBn ? 'স্লিপ প্রিন্ট' : 'Print Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

