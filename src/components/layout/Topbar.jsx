'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import {
  Menu, Search, Bell, ChevronDown, LogOut, User,
  Award, CreditCard, AlertTriangle, ClipboardCheck,
  CheckCheck, Clock, ExternalLink
} from 'lucide-react';

function NotificationMenu({ isBn }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=8');
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch (e) {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      api.patch(`/notifications/${notif.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EXAM':
        return <Award size={16} className="text-purple-600" />;
      case 'FEE':
        return <CreditCard size={16} className="text-emerald-600" />;
      case 'WARNING':
        return <AlertTriangle size={16} className="text-amber-600" />;
      case 'ATTENDANCE':
        return <ClipboardCheck size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diffSec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diffSec < 60) return isBn ? 'এইমাত্র' : 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return isBn ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return isBn ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return isBn ? `${diffDay} দিন আগে` : `${diffDay}d ago`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isBn ? 'নোটিফিকেশন ও অ্যালার্ট' : 'Notifications'}
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {unreadCount} {isBn ? 'নতুন' : 'new'}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <CheckCheck size={13} />
                <span>{isBn ? 'সব পঠিত' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-50 max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {isBn ? 'লোড হচ্ছে...' : 'Loading notifications...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell size={28} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">
                  {isBn ? 'কোনো নতুন নোটিফিকেশন নেই' : 'All caught up!'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'গুরুত্বপূর্ণ প্রাতিষ্ঠানিক আপডেট আসলে এখানে পাবেন।' : 'New activity updates will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 px-4 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                    !n.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs leading-tight truncate ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                    {n.link && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 pt-0.5">
                        <span>{isBn ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                        <ExternalLink size={10} />
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const isBn = lang === 'bn';
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isInstAdmin = user.role === 'INSTITUTION_ADMIN';

  const [avatarError, setAvatarError] = useState(false);
  
  const getAvatarUrl = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.url || val.thumbnailUrl || '';
    if (typeof val === 'string') {
      if (val.startsWith('{') && val.includes('"url"')) {
        try {
          return JSON.parse(val).url || '';
        } catch (e) {
          return val;
        }
      }
      return val;
    }
    return '';
  };

  const resolvedAvatarUrl = getAvatarUrl(user.avatar_url);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs z-10 sticky top-0">
      <div className="flex items-center flex-1">
        <button
          onClick={onMenuClick}
          className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-hidden lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isSuperAdmin && (
          <div className="hidden md:flex flex-1 max-w-md items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search campuses, cluster IDs, domains..."
              className="bg-transparent border-none outline-hidden w-full text-sm text-gray-700 placeholder-gray-500"
            />
          </div>
        )}

        {isInstAdmin && (
          <div className="hidden lg:flex items-center space-x-4 flex-1">
            <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
              Session: 2026-2027
            </div>
            <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              99.9% Synced
            </div>
            <div className="flex-1 max-w-xs items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 flex focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder={isBn ? 'শিক্ষার্থী খুঁজুন 🔍' : 'Search student 🔍'}
                className="bg-transparent border-none outline-hidden w-full text-sm text-gray-700"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {isSuperAdmin && (
          <div className="hidden lg:flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 mr-1">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span className="text-xs text-gray-600 font-bold">South Asia Core Cluster • Latency 24ms</span>
          </div>
        )}
        
        {/* Language Toggle */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden text-xs font-bold bg-slate-100 p-0.5">
          <button 
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded transition-all ${lang !== 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            EN
          </button>
          <button 
            type="button"
            onClick={() => setLang('bn')}
            className={`px-2 py-0.5 rounded transition-all ${lang === 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            বাংলা
          </button>
        </div>

        {/* Live Notification Center Dropdown */}
        <NotificationMenu isBn={isBn} />

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 focus:outline-hidden p-1.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
          >
            {resolvedAvatarUrl && !avatarError ? (
              <img
                src={resolvedAvatarUrl}
                alt={user.name}
                onError={() => setAvatarError(true)}
                className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-xs ring-2 ring-blue-100 shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[140px]">{user.name}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {isSuperAdmin ? 'Root Platform Level' : isInstAdmin ? 'Principal (Admin)' : user.role}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl py-1.5 border border-gray-100 ring-1 ring-black/5 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email || user.username}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center font-semibold transition-colors"
              >
                <User className="h-4 w-4 mr-2.5 text-blue-600" />
                My Profile & Campus
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center font-semibold transition-colors border-t border-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                Terminate Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
