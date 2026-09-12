'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useLanguage } from '@/lib/language';
import {
  School, Users, KeyRound, Eye, Edit3, CheckCircle2,
  AlertTriangle, Shield, Search, RefreshCw, X, Copy,
  Check, ExternalLink, Sliders, BookOpen, CreditCard,
  Phone, Mail, MapPin, Award, Calendar, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstitutionsManagementPage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  // Data states
  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [selectedInst, setSelectedInst] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'users' | 'edit'

  // Users in institution state
  const [instUsers, setInstUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Password reset modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null); // null means default lead admin
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Edit institution state
  const [editFormData, setEditFormData] = useState({
    name: '', type: 'SCHOOL', address: '', phone: '', email: '',
    adminName: '', adminEmail: '', status: 'ACTIVE'
  });
  const [editLoading, setEditLoading] = useState(false);

  // Status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch institutions and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [instRes, statsRes] = await Promise.all([
        api.get('/institutions', {
          params: {
            status: statusFilter || undefined,
            search: searchTerm || undefined,
            limit: 50
          }
        }),
        api.get('/institutions/dashboard-stats')
      ]);
      setInstitutions(instRes.data.data?.institutions || []);
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      toast.error(isBn ? 'প্রতিষ্ঠান লোড করতে ব্যর্থ হয়েছে' : 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Open Details Modal & fetch deep details
  const handleOpenDetails = async (inst) => {
    setSelectedInst(inst);
    setDetailTab('overview');
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/institutions/${inst.id}/details`);
      setDetailData(res.data?.data || inst);
      // Pre-fill edit form
      setEditFormData({
        name: res.data.data?.name || inst.name || '',
        type: res.data.data?.type || inst.type || 'SCHOOL',
        address: res.data.data?.address || inst.address || '',
        phone: res.data.data?.phone || inst.phone || '',
        email: res.data.data?.email || inst.email || '',
        adminName: res.data.data?.leadAdmin?.name || inst.admin_name || '',
        adminEmail: res.data.data?.leadAdmin?.email || inst.admin_email || '',
        status: res.data.data?.status || inst.status || 'ACTIVE'
      });
    } catch (e) {
      setDetailData(inst);
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch institution users when user tab selected
  const handleFetchUsers = async (instId) => {
    setUsersLoading(true);
    try {
      const res = await api.get(`/institutions/${instId}/users`);
      setInstUsers(res.data?.data || []);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (detailModalOpen && detailTab === 'users' && selectedInst) {
      handleFetchUsers(selectedInst.id);
    }
  }, [detailTab, detailModalOpen]);

  // Open Password Reset Modal
  const handleOpenPasswordReset = (inst, user = null) => {
    setSelectedInst(inst);
    setTargetUser(user);
    setNewPassword(generateRandomPassword());
    setCopiedPass(false);
    setPasswordModalOpen(true);
  };

  // Generate strong random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${res}@2026`;
  };

  // Handle Password Submit
  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setPasswordLoading(true);
    try {
      if (targetUser) {
        // Direct user password update
        await api.put(`/institutions/users/${targetUser.id}/password`, { newPassword });
      } else {
        // Institution admin password update
        await api.put(`/institutions/${selectedInst.id}/password`, { newPassword });
      }
      toast.success(isBn ? 'পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!' : 'Password updated successfully!');
      setPasswordModalOpen(false);
      fetchData();
      if (detailModalOpen && detailTab === 'users' && selectedInst) {
        handleFetchUsers(selectedInst.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Edit Institution Submit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/institutions/${selectedInst.id}`, editFormData);
      toast.success(isBn ? 'প্রতিষ্ঠানের তথ্য সফলভাবে আপডেট হয়েছে' : 'Institution updated successfully');
      setDetailModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update institution');
    } finally {
      setEditLoading(false);
    }
  };

  // Status Change (Approve, Suspend, Activate)
  const handleOpenStatusModal = (inst, status) => {
    setSelectedInst(inst);
    setTargetStatus(status);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedInst || !targetStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/institutions/${selectedInst.id}/status`, { status: targetStatus });
      toast.success(`Institution status updated to ${targetStatus}`);
      setStatusModalOpen(false);
      fetchData();
      if (detailModalOpen) {
        setDetailModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Impersonate / Inspect Institution
  const handleInspectCampus = async (inst) => {
    try {
      localStorage.setItem('activeTenantId', inst.id);
      toast.success(isBn ? `${inst.name} এর ওয়ার্কস্পেসে প্রবেশ করা হচ্ছে...` : `Switched context to ${inst.name}`);
      window.location.href = `/dashboard?institutionId=${inst.id}`;
    } catch (e) {
      toast.error('Failed to switch institution');
    }
  };

  // Copy helper
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(isBn ? 'ক্লিপবোর্ডে কপি করা হয়েছে' : 'Copied to clipboard');
  };

  const typeBadges = {
    SCHOOL: { label: isBn ? 'স্কুল / কলেজ' : 'School / College', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    KINDERGARTEN: { label: isBn ? 'কিন্ডারগার্টেন' : 'Kindergarten', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COACHING_CENTER: { label: isBn ? 'কোচিং সেন্টার' : 'Coaching', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  // Filter list by search and type
  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = searchTerm === '' ||
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.phone?.includes(searchTerm) ||
      inst.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.admin_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === '' || inst.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. TOP HEADER & KPI CARDS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {isBn ? 'সুপার অ্যাডমিন প্ল্যাটফর্ম কন্ট্রোল' : 'Super Admin Master Control'}
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isBn ? 'নিবন্ধিত সকল শিক্ষা প্রতিষ্ঠান ও ক্রেডেনশিয়াল ব্যবস্থাপনা' : 'Institution Registry & Credentials Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'সকল ক্যাম্পাসের তথ্য পর্যবেক্ষণ, পাসওয়ার্ড আপডেট, স্টুডেন্ট/শিক্ষক সংখ্যা ও লাইভ অ্যাকশন পরিচালনা করুন।'
              : 'Direct oversight of all registered campuses, admin credentials, population stats, and system overrides.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>{isBn ? 'মোট ক্যাম্পাস' : 'Total Campuses'}</span>
            <School size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{isBn ? 'প্ল্যাটফর্মে নিবন্ধিত' : 'Registered on UEMP'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>{isBn ? 'সক্রিয় প্রতিষ্ঠান' : 'Active Campuses'}</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{stats.active || 0}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">{isBn ? 'লাইভ ও সচল' : 'Fully Operational'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>{isBn ? 'পেন্ডিং অনুমোদন' : 'Pending Approval'}</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-2">{stats.pending || 0}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">{isBn ? 'অনুমোদনের অপেক্ষায়' : 'Action Required'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>{isBn ? 'স্থগিত প্রতিষ্ঠান' : 'Suspended'}</span>
            <Shield size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{stats.suspended || 0}</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">{isBn ? 'সাময়িকভাবে বন্ধ' : 'Access Restricted'}</p>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isBn ? 'ক্যাম্পাসের নাম, ইমেইল, ফোন বা অ্যাডমিন দিয়ে খুঁজুন...' : 'Search campus name, email, phone or admin...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="">{isBn ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
            <option value="ACTIVE">{isBn ? 'Active (সক্রিয়)' : 'Active'}</option>
            <option value="PENDING">{isBn ? 'Pending (পেন্ডিং)' : 'Pending'}</option>
            <option value="SUSPENDED">{isBn ? 'Suspended (স্থগিত)' : 'Suspended'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="">{isBn ? 'সকল ধরন' : 'All Types'}</option>
            <option value="SCHOOL">{isBn ? 'স্কুল / কলেজ' : 'School / College'}</option>
            <option value="KINDERGARTEN">{isBn ? 'কিন্ডারগার্টেন' : 'Kindergarten'}</option>
            <option value="COACHING_CENTER">{isBn ? 'কোচিং সেন্টার' : 'Coaching Center'}</option>
          </select>
        </div>
      </div>

      {/* 3. INSTITUTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="px-5 py-3.5">{isBn ? 'প্রতিষ্ঠান ও ধরন' : 'Institution & Type'}</th>
                <th className="px-5 py-3.5">{isBn ? 'প্রিন্সিপাল / অ্যাডমিন' : 'Lead Administrator'}</th>
                <th className="px-5 py-3.5">{isBn ? 'শিক্ষার্থী ও শিক্ষক' : 'Population'}</th>
                <th className="px-5 py-3.5">{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                <th className="px-5 py-3.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-5 py-3.5 text-right">{isBn ? 'মাস্টার কন্ট্রোল' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <span>{isBn ? 'প্রতিষ্ঠান তালিকা লোড হচ্ছে...' : 'Loading institution directory...'}</span>
                  </td>
                </tr>
              ) : filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <School size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">{isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No institutions found'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{isBn ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন' : 'Try adjusting search or status filters'}</p>
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const typeInfo = typeBadges[inst.type] || { label: inst.type, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  const initial = inst.name?.charAt(0)?.toUpperCase() || 'U';

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Type */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{inst.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{inst.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lead Admin Info */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{inst.admin_name || 'Admin'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{inst.admin_email || inst.email}</p>
                          {inst.admin_initial_password && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 border border-slate-200">
                                Pass: {inst.admin_initial_password}
                              </span>
                              <button
                                onClick={() => handleCopyText(inst.admin_initial_password)}
                                title="Copy Password"
                                className="text-slate-400 hover:text-blue-600"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Population Stats */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            <Users size={12} className="text-blue-600" />
                            <span>{inst.student_count || 0}</span>
                            <span className="text-slate-400 font-normal">{isBn ? 'ছাত্র/ছাত্রী' : 'Students'}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <BookOpen size={12} className="text-purple-600" />
                            <span>{inst.teacher_count || 0}</span>
                            <span className="text-slate-400 font-normal">{isBn ? 'শিক্ষক' : 'Teachers'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 text-[11px]">
                          <p className="text-slate-700 font-mono">{inst.phone}</p>
                          <p className="text-slate-400 truncate max-w-[140px]">{inst.email}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {inst.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                        {inst.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {inst.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Master Control Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Full Details */}
                          <button
                            onClick={() => handleOpenDetails(inst)}
                            title={isBn ? 'সম্পূর্ণ তথ্য ও পরিসংখ্যান দেখুন' : 'View Full Details & Stats'}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all"
                          >
                            <Eye size={15} />
                          </button>

                          {/* 2. Password Reset Button */}
                          <button
                            onClick={() => handleOpenPasswordReset(inst)}
                            title={isBn ? 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন করুন' : 'Reset Admin Password'}
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 rounded-lg transition-all"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* 3. Inspect Campus Workspace */}
                          <button
                            onClick={() => handleInspectCampus(inst)}
                            title={isBn ? 'ক্যাম্পাসের ড্যাশবোর্ডে প্রবেশ করুন' : 'Enter Campus Workspace'}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-all"
                          >
                            <ExternalLink size={15} />
                          </button>

                          {/* Status Actions */}
                          {inst.status === 'PENDING' && (
                            <button
                              onClick={() => handleOpenStatusModal(inst, 'ACTIVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all"
                            >
                              {isBn ? 'অনুমোদন' : 'Approve'}
                            </button>
                          )}
                          {inst.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleOpenStatusModal(inst, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all"
                            >
                              {isBn ? 'স্থগিত' : 'Suspend'}
                            </button>
                          )}
                          {inst.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleOpenStatusModal(inst, 'ACTIVE')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all"
                            >
                              {isBn ? 'পুনরায় সক্রিয়' : 'Reactivate'}
                            </button>
                          )}
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

      {/* ============================================================
          MODAL 1: COMPREHENSIVE INSTITUTION DETAILS & STATS DRAWER
          ============================================================ */}
      {detailModalOpen && selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {selectedInst.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedInst.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-medium">{selectedInst.email}</span>
                    <span>•</span>
                    <span className="text-xs text-slate-500 font-mono">{selectedInst.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
              <button
                onClick={() => setDetailTab('overview')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  detailTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <School size={14} />
                <span>{isBn ? 'ক্যাম্পাস ওভারভিউ ও পরিসংখ্যান' : 'Overview & Live Stats'}</span>
              </button>

              <button
                onClick={() => setDetailTab('users')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  detailTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={14} />
                <span>{isBn ? 'সকল শিক্ষক ও স্টাফ তালিকা' : 'Faculty & Staff Users'}</span>
              </button>

              <button
                onClick={() => setDetailTab('edit')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  detailTab === 'edit'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 size={14} />
                <span>{isBn ? 'তথ্য পরিবর্তন (Edit Profile)' : 'Edit Profile & Settings'}</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {detailLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                  <span>{isBn ? 'তথ্য সংগৃহীত হচ্ছে...' : 'Loading deep metrics...'}</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & STATS */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      {/* 6 Real-time Aggregated Metric Cards */}
                      <div>
                        <h4 className="font-bold text-slate-900 mb-3 text-sm">
                          {isBn ? 'লাইভ একাডেমিক ও আর্থিক মেট্রিক্স' : 'Live Academic & Financial Metrics'}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-600">{isBn ? 'মোট শিক্ষার্থী' : 'Enrolled Students'}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{detailData?.stats?.students || 0}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'সক্রিয় ছাত্র/ছাত্রী' : 'Active students'}</p>
                          </div>

                          <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                            <p className="text-[10px] font-bold uppercase text-purple-600">{isBn ? 'মোট শিক্ষক' : 'Teachers & Staff'}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{detailData?.stats?.teachers || 0}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'অনবোর্ডকৃত শিক্ষকবৃন্দ' : 'Faculty members'}</p>
                          </div>

                          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-bold uppercase text-emerald-600">{isBn ? 'শ্রেণি সংখ্যা' : 'Active Classes'}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{detailData?.stats?.classes || 0}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{detailData?.stats?.sections || 0} {isBn ? 'টি শাখা' : 'Sections'}</p>
                          </div>

                          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-bold uppercase text-amber-600">{isBn ? 'নির্ধারিত পরীক্ষা' : 'Exams'}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{detailData?.stats?.exams || 0}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'টার্ম/মাসিক পরীক্ষা' : 'Evaluations'}</p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase text-slate-600">{isBn ? 'সংগৃহীত ফি পরিমাণ' : 'Fees Inflow Collected'}</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                              ৳ {(detailData?.stats?.feesCollected || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'সরাসরি রসিদ ও অনলাইন ফি' : 'Counter & MFS Collections'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Lead Administrator Credentials Box */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <KeyRound size={15} className="text-blue-600" />
                            <span>{isBn ? 'প্রধান অ্যাডমিনিস্ট্রেটর ক্রেডেনশিয়াল' : 'Lead Administrator Credentials'}</span>
                          </h4>
                          <button
                            onClick={() => handleOpenPasswordReset(selectedInst, detailData?.leadAdmin)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                          >
                            {isBn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{isBn ? 'অ্যাডমিন নাম' : 'Admin Name'}</span>
                            <p className="font-bold text-slate-900">{detailData?.leadAdmin?.name || selectedInst.admin_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{isBn ? 'অফিসিয়াল ইমেইল' : 'Admin Email'}</span>
                            <p className="font-mono text-slate-800">{detailData?.leadAdmin?.email || selectedInst.admin_email || selectedInst.email}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{isBn ? 'বর্তমান সেট করা পাসওয়ার্ড' : 'Initial Password'}</span>
                            <p className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-max mt-0.5 flex items-center gap-2">
                              <span>{detailData?.leadAdmin?.initial_password || selectedInst.admin_initial_password || 'Custom / Set by Admin'}</span>
                              {(detailData?.leadAdmin?.initial_password || selectedInst.admin_initial_password) && (
                                <button
                                  onClick={() => handleCopyText(detailData?.leadAdmin?.initial_password || selectedInst.admin_initial_password)}
                                  title="Copy"
                                >
                                  <Copy size={12} />
                                </button>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}</span>
                            <p className="font-bold text-emerald-600 mt-0.5">
                              {detailData?.leadAdmin?.is_active !== false ? '● Active' : '✕ Deactivated'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Direct Inspection Action */}
                      <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <div>
                          <p className="font-bold text-indigo-900">{isBn ? 'ক্যাম্পাসের সম্পূর্ণ ড্যাশবোর্ডে প্রবেশ করুন' : 'Launch Full Campus Dashboard'}</p>
                          <p className="text-[11px] text-indigo-700 mt-0.5">
                            {isBn ? 'সুপার অ্যাডমিন হিসেবে এই প্রতিষ্ঠানের ছাত্র, শিক্ষক, পরীক্ষা ও ফি দেখতে পাবেন।' : 'Inspect attendance, routine, and fee ledger in real-time as this institution.'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleInspectCampus(selectedInst)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all shadow-sm"
                        >
                          <ExternalLink size={14} />
                          <span>{isBn ? 'ওয়ার্কস্পেস খুলুন' : 'Open Workspace'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: FACULTY & STAFF USERS */}
                  {detailTab === 'users' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 text-sm">
                          {isBn ? 'প্রতিষ্ঠানের সকল ইউজার তালিকা' : 'Registered Users in this Institution'}
                        </p>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                          {instUsers.length} {isBn ? 'জন ইউজার' : 'Users'}
                        </span>
                      </div>

                      {usersLoading ? (
                        <div className="py-10 text-center text-slate-400">
                          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                          <span>{isBn ? 'ইউজার তালিকা লোড হচ্ছে...' : 'Loading users...'}</span>
                        </div>
                      ) : instUsers.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          No users found in this campus.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                          {instUsers.map((u) => (
                            <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">{u.name}</p>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    {u.role}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email || u.username}</p>
                                {u.initial_password && (
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Pass: <strong className="text-slate-700">{u.initial_password}</strong>
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleOpenPasswordReset(selectedInst, u)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5"
                              >
                                <KeyRound size={12} />
                                <span>{isBn ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: EDIT PROFILE */}
                  {detailTab === 'edit' && (
                    <form onSubmit={handleSaveEdit} className="space-y-4 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'প্রতিষ্ঠানের নাম *' : 'Institution Name *'}</label>
                          <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}</label>
                          <select
                            value={editFormData.type}
                            onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                          >
                            <option value="SCHOOL">School / College</option>
                            <option value="KINDERGARTEN">Kindergarten</option>
                            <option value="COACHING_CENTER">Coaching Center</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'অফিসিয়াল ফোন *' : 'Official Phone *'}</label>
                          <input
                            type="text"
                            required
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'অফিসিয়াল ইমেইল *' : 'Official Email *'}</label>
                          <input
                            type="email"
                            required
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'ঠিকানা *' : 'Address *'}</label>
                          <input
                            type="text"
                            required
                            value={editFormData.address}
                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'অ্যাডমিন নাম' : 'Admin Name'}</label>
                          <input
                            type="text"
                            value={editFormData.adminName}
                            onChange={(e) => setEditFormData({ ...editFormData, adminName: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'অ্যাডমিন ইমেইল' : 'Admin Email'}</label>
                          <input
                            type="email"
                            value={editFormData.adminEmail}
                            onChange={(e) => setEditFormData({ ...editFormData, adminEmail: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">{isBn ? 'প্রাতিষ্ঠানিক স্ট্যাটাস' : 'Status'}</label>
                          <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING">PENDING</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDetailTab('overview')}
                          className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold"
                        >
                          {isBn ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                        >
                          {editLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                          <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: DIRECT PASSWORD UPDATE & CREDENTIAL GENERATOR
          ============================================================ */}
      {passwordModalOpen && selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-purple-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isBn ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Security Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedInst.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  {isBn ? 'টার্গেট ব্যবহারকারী:' : 'Target User:'}
                </span>
                <p className="font-bold text-slate-800 text-sm">
                  {targetUser ? targetUser.name : (selectedInst.admin_name || 'Lead Administrator')}
                </p>
                <p className="text-slate-500 font-mono">
                  {targetUser ? targetUser.email : (selectedInst.admin_email || selectedInst.email)}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    {isBn ? 'নতুন পাসওয়ার্ড *' : 'New Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-purple-600 hover:text-purple-700 font-bold text-[11px] underline"
                  >
                    {isBn ? 'নতুন পাসওয়ার্ড তৈরি করুন' : 'Auto Generate'}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. School@2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold outline-none focus:bg-white focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText(newPassword)}
                    title="Copy to clipboard"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'কমপক্ষে ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন।' : 'Must be at least 6 characters long.'}
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {passwordLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{isBn ? 'পাসওয়ার্ড সেভ করুন' : 'Save Password'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: STATUS CONFIRMATION MODAL
          ============================================================ */}
      {statusModalOpen && selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center space-y-3">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                targetStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {targetStatus === 'ACTIVE' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
              </div>

              <h3 className="text-lg font-black text-slate-900">
                {targetStatus === 'ACTIVE'
                  ? (isBn ? 'প্রতিষ্ঠান অনুমোদন ও সক্রিয়করণ' : 'Approve / Activate Institution')
                  : (isBn ? 'প্রতিষ্ঠান স্থগিতকরণ' : 'Suspend Institution')}
              </h3>

              <p className="text-xs text-slate-600">
                {isBn
                  ? `আপনি কি নিশ্চিতভাবে "${selectedInst.name}" এর স্ট্যাটাস "${targetStatus}" করতে চান?`
                  : `Are you sure you want to change status of "${selectedInst.name}" to ${targetStatus}?`}
              </p>

              <div className="flex justify-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={statusLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 ${
                    targetStatus === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {statusLoading ? <RefreshCw size={13} className="animate-spin" /> : null}
                  <span>{isBn ? 'হ্যাঁ, নিশ্চিত করুন' : 'Confirm'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
