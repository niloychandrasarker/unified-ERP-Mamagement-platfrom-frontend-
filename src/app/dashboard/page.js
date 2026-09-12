'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  Building2, Users, TrendingUp, Activity, Shield, Clock,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
  UserPlus, ClipboardCheck, CreditCard, Award,
  Calendar, BookOpen, BarChart3, Zap, AlertTriangle, FileText,
  GraduationCap, Sparkles, CheckCircle2, Mail, Phone, MapPin, KeyRound,
  Camera, UploadCloud, Image as ImageIcon, Loader2, X, Check, Wallet,
  Copy, ExternalLink, Share2, Briefcase, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToImageKit } from '@/lib/upload';
import StudentPortalDashboard from './portal/student/page';
import TeacherPortalDashboard from './portal/teacher/page';

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      const fetchStats = async () => {
        try {
          const res = await api.get('/institutions/dashboard-stats');
          setStats(res.data.data);
        } catch (error) {
          console.error('Failed to fetch stats', error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100"></div>
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-100"></div>
      </div>
    );
  }

  if (user?.role === 'SUPER_ADMIN') return <SuperAdminDashboard stats={stats} user={user} />;
  if (user?.role === 'INSTITUTION_ADMIN') return <InstitutionAdminDashboard user={user} />;
  if (user?.role === 'STUDENT') return <StudentPortalDashboard />;
  if (user?.role === 'TEACHER') return <TeacherPortalDashboard />;
  return <DefaultDashboard user={user} />;
}

/* ============================================================
   SUPER ADMIN DASHBOARD
   ============================================================ */
function SuperAdminDashboard({ stats, user }) {
  return (
    <div className="space-y-8">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mb-1">
            UEMP Cloud Platform {'>'} Master Control {'>'} Super Admin Cockpit
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Executive Tenant Orchestrator
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Healthy (99.98% 30-Day Uptime)
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
              <Shield className="w-3 h-3" />
              PostgreSQL Cluster: Active
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Zap className="w-4 h-4" />
            Manually Provision Tenant
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-100 transition-colors border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            Emergency Maintenance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Registered Tenants"
          value={stats?.total || 0}
          suffix="Institutions"
          icon={Building2}
          trend="+28 this month"
          trendUp={true}
          detail={`${stats?.active || 0} Active • ${stats?.pending || 0} Pending • ${stats?.suspended || 0} Suspended`}
          accentColor="blue"
        />
        <StatCard
          label="Active Student Population"
          value="248,650"
          suffix=""
          icon={Users}
          trend="Spanning 12 Districts"
          trendUp={null}
          detail=""
          accentColor="emerald"
        />
        <StatCard
          label="Monthly Recurring Revenue"
          value="৳ 38.45"
          suffix="Lakhs"
          icon={TrendingUp}
          trend="~+14.2% MoM"
          trendUp={true}
          detail=""
          accentColor="violet"
        />
        <StatCard
          label="API & Webhook Ingestion"
          value="14.2M"
          suffix="Reqs/24h"
          icon={Activity}
          trend="99.9% Success Rate"
          trendUp={true}
          detail="P95 Gateway Latency: 0.04s"
          accentColor="orange"
        />
      </div>

      {/* Tenant Table + Pending */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TenantRegistryLedger />
        </div>
        <div>
          <PendingRegistrations />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, icon: Icon, trend, trendUp, detail, accentColor }) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
  };
  const c = colors[accentColor] || colors.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight max-w-[140px]">{label}</p>
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {suffix && <span className="text-sm text-slate-500 font-medium">{suffix}</span>}
      </div>
      {trend && (
        <p className={`text-xs font-medium flex items-center gap-1 ${
          trendUp === true ? 'text-emerald-600' : trendUp === false ? 'text-red-500' : 'text-slate-400'
        }`}>
          {trendUp === true && <ArrowUpRight className="w-3.5 h-3.5" />}
          {trendUp === false && <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend}
        </p>
      )}
      {detail && <p className="text-xs text-slate-400 mt-1">{detail}</p>}
    </div>
  );
}

function TenantRegistryLedger() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await api.get('/institutions?page=1&limit=10');
        setInstitutions(res.data.data.institutions || []);
      } catch (error) {
        console.error('Failed to fetch institutions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  const typeColors = {
    SCHOOL: 'bg-blue-50 text-blue-700 border-blue-200',
    KINDERGARTEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COACHING_CENTER: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  const typeLabels = { SCHOOL: 'School', KINDERGARTEN: 'Kindergarten', COACHING_CENTER: 'Coaching' };

  const statusColors = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    SUSPENDED: 'bg-red-50 text-red-700',
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '??';
  const avatarColors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-orange-600', 'bg-rose-600', 'bg-cyan-600'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tenant Registry Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Manage multitenant infrastructure tiers, routings, and resource quotas.</p>
        </div>
        <Link
          href="/dashboard/institutions"
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
        >
          <span>Manage All & Passwords</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Institution</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                  <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : institutions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  No institutions registered yet
                </td>
              </tr>
            ) : (
              institutions.map((inst, idx) => (
                <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${avatarColors[idx % avatarColors.length]} text-white text-xs font-bold flex items-center justify-center`}>
                        {getInitials(inst.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{inst.name}</p>
                        <p className="text-xs text-slate-400">{inst.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${typeColors[inst.type] || ''}`}>
                      {typeLabels[inst.type] || inst.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-600">{inst.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[inst.status] || ''}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href="/dashboard/institutions"
                      className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <KeyRound size={12} />
                      <span>Manage</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingRegistrations() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await api.get('/institutions?status=PENDING&page=1&limit=10');
      setPending(res.data.data.institutions || []);
    } catch (error) {
      console.error('Failed to fetch pending', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/institutions/${id}/status`, { status: 'ACTIVE' });
      fetchPending();
    } catch (error) {
      console.error('Failed to approve', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/institutions/${id}/status`, { status: 'SUSPENDED' });
      fetchPending();
    } catch (error) {
      console.error('Failed to reject', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Pending Registrations</h3>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold bg-red-500 text-white rounded-full">
            {pending.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-400 animate-pulse">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No pending registrations</p>
          </div>
        ) : (
          pending.map((inst) => (
            <div key={inst.id} className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{inst.name}</h4>
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  {inst.type === 'SCHOOL' ? 'School' : inst.type === 'KINDERGARTEN' ? 'Kindergarten' : 'Coaching'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-1">{inst.email}</p>
              <p className="text-xs text-slate-400 mb-3">{inst.phone} • {inst.address}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(inst.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(inst.id)}
                  className="px-3 py-1.5 text-red-600 text-xs font-semibold hover:bg-red-50 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


/* ============================================================
   INSTITUTION ADMIN DASHBOARD
   ============================================================ */
function InstitutionAdminDashboard({ user }) {
  const { setUser, refreshUser } = useAuth();
  const [attSummary, setAttSummary] = useState(null);
  const [livePeriods, setLivePeriods] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [institution, setInstitution] = useState(user?.institution || null);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    logo: user?.institution?.logo || '',
    banner_url: user?.institution?.banner_url || ''
  });
  const [savingBranding, setSavingBranding] = useState(false);

  // Phase 7 Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [velocityRange, setVelocityRange] = useState('week');
  const [loadingVelocity, setLoadingVelocity] = useState(false);

  const fetchAnalytics = async (range = velocityRange) => {
    try {
      setLoadingVelocity(true);
      const res = await api.get(`/analytics/institution?range=${range}`);
      if (res.data?.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load institution analytics', err);
    } finally {
      setLoadingVelocity(false);
    }
  };

  const handleRangeChange = (newRange) => {
    setVelocityRange(newRange);
    fetchAnalytics(newRange);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [attRes, liveRes, instRes, feeRes, analyticsRes] = await Promise.all([
          api.get('/attendance/daily-summary').catch(() => ({ data: { data: null } })),
          api.get('/routines/live').catch(() => ({ data: { data: null } })),
          api.get('/institutions/profile').catch(() => ({ data: { data: null } })),
          api.get('/fees/analytics').catch(() => ({ data: { data: null } })),
          api.get(`/analytics/institution?range=${velocityRange}`).catch(() => ({ data: { data: null } }))
        ]);
        setAttSummary(attRes.data?.data);
        setLivePeriods(liveRes.data?.data);
        if (instRes.data?.data) {
          setInstitution(instRes.data.data);
          setBrandingForm({
            logo: instRes.data.data.logo || '',
            banner_url: instRes.data.data.banner_url || ''
          });
        }
        if (feeRes.data?.data) {
          setFinancials(feeRes.data.data);
        }
        if (analyticsRes.data?.data) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch live dashboard operations', err);
      }
    };
    fetchDashboardData();
  }, []);

  // Handle Logo Upload to ImageKit
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      const res = await uploadToImageKit(file, 'institutions', `logo_${Date.now()}`);
      setBrandingForm(prev => ({ ...prev, logo: res.url }));
      toast.success('Logo uploaded to ImageKit! Click Save Changes to apply.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  // Handle Banner Upload to ImageKit
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBannerUploading(true);
      const res = await uploadToImageKit(file, 'institutions', `banner_${Date.now()}`);
      setBrandingForm(prev => ({ ...prev, banner_url: res.url }));
      toast.success('Banner uploaded to ImageKit! Click Save Changes to apply.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Banner upload failed');
    } finally {
      setBannerUploading(false);
    }
  };

  // Save Branding to Backend
  const handleSaveBranding = async () => {
    try {
      setSavingBranding(true);
      const res = await api.put('/institutions/profile', {
        logo: brandingForm.logo,
        banner_url: brandingForm.banner_url
      });
      setInstitution(res.data.data);
      setBrandingModalOpen(false);
      toast.success('Campus Branding (Logo & Banner) updated successfully!');
      // Update local user object in memory if possible
      if (user && user.institution) {
        user.institution.logo = res.data.data.logo;
        user.institution.banner_url = res.data.data.banner_url;
      }
      
      // Update global auth state so Sidebar and Topbar update in real time
      if (setUser) {
        setUser(prev => prev ? ({
          ...prev,
          institution: {
            ...prev.institution,
            ...res.data.data
          }
        }) : prev);
      }
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campus branding');
    } finally {
      setSavingBranding(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  return (
    <div className="space-y-6">
      {/* CAMPUS DYNAMIC HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-md">
        {institution?.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${institution.banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-blue-950/80 backdrop-blur-[1px]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
        )}

        <div className="relative p-6 sm:p-8 text-white z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Institution Logo */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/95 p-1.5 shadow-xl border-2 border-white/80 flex items-center justify-center overflow-hidden">
                {institution?.logo ? (
                  <img src={institution.logo} alt={institution.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl">
                    {institution?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setBrandingModalOpen(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-white transition-transform hover:scale-110"
                title="Change Logo"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/15 text-blue-200 border border-white/20 backdrop-blur-md">
                  ● Institutional Executive Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Session: 2026-2027
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                {institution?.name || 'My Institution'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-blue-400" />
                  {institution?.address || 'Campus Location'}
                </span>
                {institution?.phone && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="flex items-center gap-1">
                      <Phone size={13} className="text-emerald-400" />
                      {institution.phone}
                    </span>
                  </>
                )}
                {institution?.email && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="flex items-center gap-1">
                      <Mail size={13} className="text-purple-300" />
                      {institution.email}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => setBrandingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md shadow-xs transition-all"
            >
              <Camera size={14} />
              Customize Banner & Logo
            </button>
            <Link
              href="/dashboard/students/admit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all"
            >
              <UserPlus size={14} />
              + Quick Admission
            </Link>
            <Link
              href="/dashboard/academics/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs bg-white text-slate-800 hover:bg-slate-100 shadow-md transition-all"
            >
              <ClipboardCheck size={14} className="text-blue-600" />
              Take Attendance
            </Link>
            <Link
              href="/dashboard/fees/collect"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
            >
              <Wallet size={14} />
              + Collect Fee
            </Link>
          </div>
        </div>
      </div>

      {/* BRANDING CUSTOMIZATION MODAL */}
      {brandingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="text-blue-600" size={20} />
                  Customize Campus Banner & Logo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload high-resolution images powered by ImageKit Cloud CDN
                </p>
              </div>
              <button
                onClick={() => setBrandingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Logo Section */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Institution Logo</h4>
                  <p className="text-xs text-slate-500">Displayed in Sidebar, Topbar, and Certificates (Square ratio recommended)</p>
                </div>
                {brandingForm.logo && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={12} /> Set
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                  {brandingForm.logo ? (
                    <img src={brandingForm.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={24} />
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:bg-blue-50/50 transition-all">
                    {logoUploading ? <Loader2 className="animate-spin text-blue-600" size={14} /> : <UploadCloud size={14} className="text-blue-600" />}
                    <span>{logoUploading ? 'Uploading to ImageKit...' : 'Select Logo Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, SVG or WEBP up to 5MB</p>
                </div>
              </div>
            </div>

            {/* 2. Banner Section */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Campus Hero Banner</h4>
                  <p className="text-xs text-slate-500">High-resolution campus photo displayed at dashboard top (16:9 ratio recommended)</p>
                </div>
                {brandingForm.banner_url && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={12} /> Set
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="h-28 w-full rounded-xl bg-slate-200 border border-slate-300 overflow-hidden relative flex items-center justify-center shadow-xs">
                  {brandingForm.banner_url ? (
                    <img src={brandingForm.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="mx-auto mb-1" size={24} />
                      <span className="text-[11px]">No custom banner uploaded yet</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:bg-blue-50/50 transition-all">
                    {bannerUploading ? <Loader2 className="animate-spin text-blue-600" size={14} /> : <UploadCloud size={14} className="text-blue-600" />}
                    <span>{bannerUploading ? 'Uploading to ImageKit...' : 'Select Banner Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={bannerUploading}
                      onChange={handleBannerUpload}
                    />
                  </label>
                  {brandingForm.banner_url && (
                    <button
                      type="button"
                      onClick={() => setBrandingForm(prev => ({ ...prev, banner_url: '' }))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove Custom Banner
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBrandingModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingBranding || logoUploading || bannerUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all"
              >
                {savingBranding ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>{savingBranding ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Links & Sharing Hub */}
      <PortalSharingHub institution={institution} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <InstitutionStatCard
          label="STUDENT BODY COUNT"
          value={analytics?.overview?.total_students !== undefined ? Number(analytics.overview.total_students).toLocaleString() : '1,428'}
          badge={analytics?.overview?.total_students !== undefined ? `${analytics.overview.total_students} Enrolled` : '+42 new'}
          icon={Users}
          details={analytics?.overview ? [
            `${analytics.overview.boys_count || 0} Boys`,
            `${analytics.overview.girls_count || 0} Girls`,
            `${(analytics.overview.boys_count || 0) + (analytics.overview.girls_count || 0)} Total`
          ] : ['824 Boys', '604 Girls', 'K-12 & Model Batches']}
          extra={analytics?.overview?.active_teachers ? `Faculty: ${analytics.overview.active_teachers} Active Teachers` : 'Capacity: 92.4% (Max 1,550)'}
        />
        <InstitutionStatCard
          label="DAILY ATTENDANCE ROSTER"
          value={analytics?.overview?.attendance_rate !== undefined ? `${analytics.overview.attendance_rate}%` : (attSummary ? `${attSummary.attendanceRate}%` : '94.2%')}
          badge={analytics?.overview?.today_marked ? `${analytics.overview.today_marked} Marked` : (attSummary?.totalStudents ? `${attSummary.markedTotal}/${attSummary.totalStudents}` : 'Live')}
          icon={ClipboardCheck}
          details={analytics?.overview ? [
            `${analytics.overview.today_present || 0} Present`,
            `${analytics.overview.today_absent || 0} Absent`,
            `${analytics.overview.today_late || 0} Late`
          ] : [
            attSummary ? `${attSummary.present} Present` : '1,345 Present',
            attSummary ? `${attSummary.absent} Absent` : '62 Absent',
            attSummary ? `${attSummary.late} Late` : '21 Late'
          ]}
          extra={livePeriods ? `Live: ${livePeriods.activePeriodsCount} Classrooms Running` : 'Period Live Tracking Active'}
        />
        <InstitutionStatCard
          label="FEES & COLLECTIONS"
          value={analytics?.overview?.total_collected !== undefined ? `৳ ${Number(analytics.overview.total_collected).toLocaleString()}` : (financials ? `৳ ${Number(financials.total_collected || 0).toLocaleString()}` : '৳ 0')}
          badge={analytics?.overview?.recovery_rate !== undefined ? `${analytics.overview.recovery_rate}% Recovery` : (financials ? `${financials.recoveryRate || 0}% Recovery` : 'Live')}
          icon={CreditCard}
          details={analytics?.overview ? [
            `Billed: ৳ ${Number(analytics.overview.total_billed || 0).toLocaleString()}`,
            `Collected: ৳ ${Number(analytics.overview.total_collected || 0).toLocaleString()}`
          ] : [
            financials ? `Billed: ৳ ${Number(financials.total_billed || 0).toLocaleString()}` : 'Billed: ৳ 0',
            financials ? `Collected: ৳ ${Number(financials.total_collected || 0).toLocaleString()}` : 'Collected: ৳ 0'
          ]}
          extra={analytics?.overview ? `Total Dues: ৳ ${Number(analytics.overview.total_dues || 0).toLocaleString()}` : (financials ? `Total Dues: ৳ ${Number(financials.total_dues || 0).toLocaleString()}` : 'Dues tracking active')}
        />
        <InstitutionStatCard
          label="TERM EXAM & PASS RATE"
          value={analytics?.overview?.total_exams ? `${analytics.overview.total_exams} Active` : '5 Days'}
          badge={analytics?.overview?.pass_rate !== undefined ? `${analytics.overview.pass_rate}% Pass Rate` : 'Exam Center'}
          icon={BookOpen}
          details={analytics?.overview ? [
            `${analytics.overview.submitted_schedules || 0} / ${analytics.overview.total_schedules || 0} Submitted`,
            `${analytics.overview.published_schedules || 0} Published`
          ] : ['18 / 24 Subjects Covered', 'Admit Cards Ready']}
          extra={analytics?.overview?.average_gpa ? `Avg Campus GPA: ${analytics.overview.average_gpa}` : 'Hall Plan: Final'}
        />
      </div>

      {/* Charts + Period Tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InstitutionalVelocityChart
            velocity={analytics?.velocity}
            range={velocityRange}
            onRangeChange={handleRangeChange}
            loading={loadingVelocity}
          />
        </div>

        <div className="space-y-6">
          {/* Period Tracker */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Current Period Tracker</h3>
              <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                {livePeriods ? `${livePeriods.currentDay} • ${livePeriods.currentTime}` : 'Active Sessions'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Period Progress</span>
                <span className="text-slate-400">32 mins elapsed / 13 remaining</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '71%' }}></div>
              </div>
              {livePeriods && livePeriods.activePeriods && livePeriods.activePeriods.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Classrooms Live</span>
                    <span className="text-emerald-600 font-bold">{livePeriods.activePeriodsCount} Ongoing Sessions</span>
                  </div>
                  {livePeriods.activePeriods.slice(0, 4).map((item, i) => (
                    <div key={i} className="py-2 border-t border-slate-50 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.class_name} ({item.section_name}) - {item.subject_name}</span>
                        <span className="text-blue-600 font-semibold">{item.room_number ? `Room ${item.room_number}` : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Teacher: {item.teacher_name || 'Assigned'}</span>
                        <span className="font-mono">{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <Clock size={24} className="mx-auto mb-1 text-slate-300" />
                  <p className="font-semibold text-slate-600">No active periods running right now</p>
                  <Link href="/dashboard/academics/routine" className="text-blue-600 hover:underline mt-1 inline-block">
                    View full weekly routine
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Live Event Stream */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-900">Live Event Stream</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded">Real-time</span>
            </div>
            <div className="space-y-3">
              {analytics?.activity_stream && analytics.activity_stream.length > 0 ? (
                analytics.activity_stream.map((event, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-xs text-slate-700 py-2.5 border-t border-slate-50 first:border-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1 rounded bg-slate-50 text-slate-500 mt-0.5 shrink-0">
                        {event.type === 'PAYMENT' ? <CreditCard size={13} className="text-emerald-600" /> :
                         event.type === 'ADMISSION' ? <UserPlus size={13} className="text-blue-600" /> :
                         event.type === 'EXAM' ? <Award size={13} className="text-purple-600" /> :
                         <Activity size={13} className="text-amber-600" />}
                      </div>
                      <span className="leading-snug truncate sm:whitespace-normal">{event.text}</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 font-mono">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                ))
              ) : (
                [
                  'Daily attendance sync verified across classrooms',
                  'Fee collection ledger updated with bank reconciliation',
                  'Academic session calendar synchronized',
                ].map((event, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 py-2 border-t border-slate-50 first:border-0">
                    <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{event}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalSharingHub({ institution }) {
  const [copiedType, setCopiedType] = useState(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const instId = institution?.id;

  const studentPortalUrl = `${origin}/portal/${instId}/student`;
  const teacherPortalUrl = `${origin}/portal/${instId}/teacher`;

  const copyUrl = (url, type) => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    toast.success(`${type === 'student' ? 'Student' : 'Teacher'} portal link copied!`);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const shareWhatsApp = (type) => {
    const isStudent = type === 'student';
    const text = isStudent
      ? `Assalamu Alaikum,\nHere is the official Student & Guardian Portal link for ${institution?.name || 'our school'}:\n${studentPortalUrl}\n\nStudents can log in with their Student ID to view attendance, published exam results, fee dues, and routine.`
      : `Dear Faculty,\nHere is the official Faculty & Staff Portal link for ${institution?.name || 'our school'}:\n${teacherPortalUrl}\n\nPlease log in with your faculty email and initial password to manage class attendance and course marks.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              ● Live Multi-Portal Engine
            </span>
            <span className="text-xs font-semibold text-slate-300">Brand-Customized Login URLs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Share2 size={22} className="text-blue-400" />
            <span>Institution Portals & Direct Sharing Hub</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Share these dedicated, branded login portals with your Students, Guardians, and Teachers.
          </p>
        </div>

        <Link
          href="/dashboard/teachers"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <KeyRound size={15} className="text-amber-400" />
          <span>Manage Faculty Credentials</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        {/* Student Portal Sharing Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <GraduationCap size={14} />
                Student & Guardian Portal
              </span>
              <span className="text-[10px] text-slate-400">Self-Service</span>
            </div>
            <p className="text-xs text-slate-300">
              Students and guardians log in with their Student ID & password to check live attendance, term report cards, fee dues, and timetable.
            </p>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-blue-200 truncate">
              {studentPortalUrl}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => copyUrl(studentPortalUrl, 'student')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {copiedType === 'student' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedType === 'student' ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => shareWhatsApp('student')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title="Share on WhatsApp"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </button>
            <a
              href={studentPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              title="Open Student Portal"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Teacher Portal Sharing Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Briefcase size={14} />
                Faculty & Staff Portal
              </span>
              <span className="text-[10px] text-slate-400">Scoped Access</span>
            </div>
            <p className="text-xs text-slate-300">
              Teachers log in with their work email & initial password to take daily attendance, enter course marks with privacy, and view routine.
            </p>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-purple-200 truncate">
              {teacherPortalUrl}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => copyUrl(teacherPortalUrl, 'teacher')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {copiedType === 'teacher' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedType === 'teacher' ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => shareWhatsApp('teacher')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title="Share on WhatsApp"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </button>
            <a
              href={teacherPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              title="Open Teacher Portal"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionalVelocityChart({ velocity = [], range = 'week', onRangeChange, loading }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const data = Array.isArray(velocity) ? velocity : [];
  const count = data.length;

  // Chart dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 55;
  const padTop = 20;
  const padBottom = 35;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Scales
  const maxFeeVal = Math.max(5000, ...data.map(d => Number(d.fee_collected || 0)));
  const maxFee = Math.ceil(maxFeeVal / 1000) * 1000;

  const points = data.map((item, i) => {
    const x = count > 1 ? padLeft + (i / (count - 1)) * chartWidth : padLeft + chartWidth / 2;
    const att = Math.min(100, Math.max(0, Number(item.attendance_rate || 0)));
    const yAtt = padTop + chartHeight - (att / 100) * chartHeight;

    const fee = Number(item.fee_collected || 0);
    const barHeight = Math.min(chartHeight, (fee / maxFee) * chartHeight);
    const yFee = padTop + chartHeight - barHeight;

    return { ...item, x, yAtt, yFee, barHeight, fee, att };
  });

  const linePoints = points.map(p => `${p.x.toFixed(1)},${p.yAtt.toFixed(1)}`).join(' ');
  const barW = Math.max(8, Math.min(26, (chartWidth / (count || 1)) * 0.45));
  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Institutional Velocity Timeline</h3>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Synchronized Daily Attendance Rate (%) vs. Daily Fee Collections (BDT ৳)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Attendance %
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              Fee Collections (৳)
            </span>
          </div>

          {/* Time range toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => onRangeChange?.('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                range === 'week' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => onRangeChange?.('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                range === 'month' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {count === 0 ? (
        <div className="h-52 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
          No activity logs recorded for this period yet
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          {/* Hover detail tooltip bar */}
          <div className="min-h-7 mb-2 flex items-center justify-between text-xs px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">
            {hovered ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-slate-800">📅 {hovered.label || hovered.date}</span>
                <span className="text-blue-600 font-semibold">
                  ● Attendance: <strong>{hovered.att}%</strong>
                </span>
                <span className="text-emerald-600 font-semibold">
                  ■ Collections: <strong>৳{Number(hovered.fee).toLocaleString()}</strong>
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">
                Hover over data points to inspect detailed daily metric breakdown
              </span>
            )}
            <div className="flex md:hidden items-center gap-2 text-[10px]">
              <span className="text-blue-600">● Attendance</span>
              <span className="text-emerald-600">■ Fees</span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            style={{ maxHeight: '240px' }}
          >
            <defs>
              <linearGradient id="feeBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="attAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = padTop + chartHeight - (pct / 100) * chartHeight;
              const feeVal = Math.round((pct / 100) * maxFee);
              return (
                <g key={pct}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 ? "0" : "3 3"}
                  />
                  {/* Left Y Axis Label (Attendance %) */}
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {pct}%
                  </text>
                  {/* Right Y Axis Label (Fees ৳) */}
                  <text
                    x={svgWidth - padRight + 8}
                    y={y + 3}
                    textAnchor="start"
                    fontSize="9"
                    fill="#10b981"
                    fontFamily="monospace"
                  >
                    {feeVal >= 1000 ? `${(feeVal / 1000).toFixed(0)}k` : feeVal}
                  </text>
                </g>
              );
            })}

            {/* Fee Collection Bars */}
            {points.map((p, idx) => (
              <rect
                key={`bar-${idx}`}
                x={p.x - barW / 2}
                y={p.yFee}
                width={barW}
                height={Math.max(2, p.barHeight)}
                rx="3"
                fill="url(#feeBarGrad)"
                className="transition-all duration-200 cursor-pointer hover:opacity-100"
                opacity={hoveredIdx === idx ? 1 : 0.8}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}

            {/* Attendance Area Fill */}
            {points.length > 1 && (
              <polygon
                points={`${points[0].x},${padTop + chartHeight} ${linePoints} ${points[points.length - 1].x},${padTop + chartHeight}`}
                fill="url(#attAreaGrad)"
              />
            )}

            {/* Attendance Line */}
            {points.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            )}

            {/* Attendance Data Nodes */}
            {points.map((p, idx) => (
              <g key={`node-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.yAtt}
                  r={hoveredIdx === idx ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            ))}

            {/* X-Axis Date Labels */}
            {points.map((p, idx) => {
              if (count > 12 && idx % Math.ceil(count / 8) !== 0 && idx !== count - 1) {
                return null;
              }
              return (
                <text
                  key={`label-${idx}`}
                  x={p.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                  fontWeight={hoveredIdx === idx ? "bold" : "normal"}
                >
                  {p.label ? p.label.split(',')[0] : p.date.slice(5)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

function InstitutionStatCard({ label, value, badge, icon: Icon, details, extra }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</span>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{badge}</span>
      </div>
      <div className="space-y-1 mb-2">
        {details.map((d, i) => (
          <span key={i} className="inline-block text-xs text-slate-500 mr-2">{d}</span>
        ))}
      </div>
      {extra && <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-50">{extra}</p>}
    </div>
  );
}

function ActionButton({ icon: Icon, label, variant, disabled }) {
  const base = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${base} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ============================================================
   STUDENT PORTAL DASHBOARD
   ============================================================ */
function StudentDashboard({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const student = user.student || {};

  useEffect(() => {
    const fetchStudentSubjects = async () => {
      try {
        if (student.class_id) {
          const res = await api.get('/academics/subjects', {
            params: { classId: student.class_id }
          });
          setSubjects(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load student subjects', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchStudentSubjects();
  }, [student.class_id]);

  return (
    <div className="space-y-6 pb-12">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Active Student
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/15 text-white">
                  ID: {user.username || student.student_id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
                {user.institution?.name} • Session 2026-2027
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-blue-200">Enrolled Class</p>
              <p className="text-sm font-bold text-white">{student.class_name || 'N/A'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-blue-200">Section</p>
              <p className="text-sm font-bold text-white">{student.section_name || 'General'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-blue-200">Roll No</p>
              <p className="text-sm font-mono font-bold text-white">#{student.roll_number || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Registered Subjects</p>
            <p className="text-2xl font-bold text-slate-900">{subjects.length} Courses</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Attendance Standing</p>
            <p className="text-2xl font-bold text-emerald-600">98.5% Regular</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Current Term</p>
            <p className="text-2xl font-bold text-slate-900">Term 2 Exam</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Subjects & Institutional Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Enrolled Subjects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" />
              My Academic Subjects ({student.class_name || 'Enrolled'})
            </h2>
            <span className="text-xs text-slate-400 font-medium">Session: 2026</span>
          </div>

          {loadingSubjects ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 animate-pulse">
              Loading enrolled subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No subjects assigned for your class yet.</p>
              <p className="text-xs mt-1 text-slate-400">Your institution administration will configure the subject list shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                        sub.type === 'MANDATORY' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.type === 'MANDATORY' ? 'Core Mandatory' : 'Elective'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {sub.name}
                      </h3>
                    </div>
                    {sub.code && (
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {sub.code}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-400">Faculty:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {sub.teacher_name || 'Faculty Member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Campus & Portal Security Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            Campus Information
          </h2>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{user.institution?.name}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{user.institution?.address || 'Institutional Campus Address'}</span>
              </div>
              {user.institution?.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="font-mono">{user.institution?.phone}</span>
                </div>
              )}
              {user.institution?.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span>{user.institution?.email}</span>
                </div>
              )}
            </div>

            {/* Portal security reminder */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <KeyRound size={13} className="text-amber-700" />
                Security Advice
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Keep your Student ID (<span className="font-mono font-bold">{user.username || student.student_id}</span>) safe. Do not share your login password with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DEFAULT DASHBOARD
   ============================================================ */
function DefaultDashboard({ user }) {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to UEMP</h2>
      <p className="text-slate-500">Hi {user?.name}, your dashboard features are coming soon. Stay tuned!</p>
    </div>
  );
}
