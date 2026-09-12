'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import {
  LayoutDashboard,
  School,
  CreditCard,
  Cloud,
  ScrollText,
  Settings,
  LogOut,
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Wallet,
  FileText,
  Edit3,
  Award,
  ChevronDown,
  GraduationCap,
  Sliders,
  CheckCircle2,
  User
} from 'lucide-react';

function CampusLogo({ logo, name, size = 'sm' }) {
  const [hasError, setHasError] = useState(false);
  let logoUrl = typeof logo === 'string' ? logo : (logo?.url || '');
  if (typeof logoUrl === 'string' && logoUrl.startsWith('{') && logoUrl.includes('"url"')) {
    try {
      logoUrl = JSON.parse(logoUrl).url || logoUrl;
    } catch (e) {}
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  React.useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const sizeClasses = size === 'lg'
    ? 'w-10 h-10 rounded-xl text-sm'
    : 'w-8 h-8 rounded-lg text-xs';

  if (!logoUrl || hasError) {
    return (
      <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center shadow-xs shrink-0 select-none`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} bg-white border border-slate-200 p-0.5 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden`}>
      <img
        src={logoUrl}
        alt={name || 'Institution Logo'}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isInstAdmin = user.role === 'INSTITUTION_ADMIN';
  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';

  const NavItem = ({ href, icon: Icon, label, active, disabled, badge, count }) => (
    <div className={`mb-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {disabled ? (
        <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-lg">
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 text-gray-400" />
            {label}
          </div>
          {badge && <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">{badge}</span>}
        </div>
      ) : (
        <Link
          href={href}
          onClick={onClose}
          className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            active
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center">
            <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-500'}`} />
            {label}
          </div>
          {count && (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {count}
            </span>
          )}
        </Link>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 overflow-y-auto">
      {/* SUPER ADMIN SIDEBAR */}
      {isSuperAdmin && (
        <>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">U</div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">UEMP</h1>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">SUPER ADMIN</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center text-xs text-gray-700 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Platform Control
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Prod-V3</span>
            </div>
          </div>

          <div className="flex-1 py-4 px-3 space-y-1">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Platform Overview" active={pathname === '/dashboard'} />
            <NavItem href="/dashboard/institutions" icon={School} label="Tenant Institutions" active={pathname.includes('/institutions')} count="148" />
            <NavItem href="#" icon={CreditCard} label="Subscriptions & Billing" disabled />
            <NavItem href="#" icon={Cloud} label="Cloud Infrastructure" disabled badge="●" />
            <NavItem href="#" icon={ScrollText} label="Audit Logs" disabled />
            <NavItem href="#" icon={Settings} label="System Settings" disabled />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs text-gray-500 font-medium">Language</span>
              <div className="flex space-x-1 text-xs font-bold border border-slate-200 rounded-lg p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded ${lang !== 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2 py-0.5 rounded ${lang === 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Terminate Session
            </button>
          </div>
        </>
      )}

      {/* INSTITUTION ADMIN SIDEBAR */}
      {isInstAdmin && (
        <>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <CampusLogo logo={user.institution?.logo} name={user.institution?.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-black tracking-tight text-gray-900 leading-tight truncate">
                    {user.institution?.name || 'UEMP'}
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 leading-none">Smart Campus</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">v3.2</span>
            </div>

            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className="mt-4 p-2.5 border border-gray-200 rounded-xl block hover:bg-slate-50 hover:border-blue-200 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-emerald-600 font-bold tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  ACTIVE CAMPUS
                </p>
                <span className="text-[9px] font-semibold text-slate-400 group-hover:text-blue-600">Settings →</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CampusLogo logo={user.institution?.logo} name={user.institution?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                    {user.institution?.name || 'My Institution'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {user.institution?.type || 'School'} • EIIN: {user.institution?.eiin_number || '108246'}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex-1 py-4 px-3 overflow-y-auto">
            <div className="mb-5">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CORE</p>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} />
              <NavItem href="/dashboard/students" icon={Users} label="Students Directory" active={pathname === '/dashboard/students'} />
              <NavItem href="/dashboard/students/admit" icon={UserPlus} label="New Admission" active={pathname === '/dashboard/students/admit'} />
              <NavItem href="/dashboard/students/bulk" icon={FileText} label="Bulk CSV Import" active={pathname === '/dashboard/students/bulk'} />
            </div>

            <div className="mb-5">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ACADEMICS</p>
              <NavItem href="/dashboard/academics/classes" icon={BookOpen} label="Classes & Sections" active={pathname.includes('/academics/classes')} />
              <NavItem href="/dashboard/academics/subjects" icon={FileText} label="Subjects & Teachers" active={pathname.includes('/academics/subjects')} />
              <NavItem href="/dashboard/academics/routine" icon={Calendar} label="Routine & Schedule" active={pathname.includes('/academics/routine')} />
              <NavItem href="/dashboard/academics/attendance" icon={ClipboardCheck} label="Daily Attendance" active={pathname.includes('/academics/attendance')} />
            </div>

            <div className="mb-5">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">FINANCE & FEES</p>
              <NavItem href="/dashboard/fees/collect" icon={Wallet} label="Receive Payment (ফি গ্রহণ)" active={pathname === '/dashboard/fees/collect'} />
              <NavItem href="/dashboard/fees/invoices" icon={CreditCard} label="Invoices & Billing (ইনভয়েস)" active={pathname === '/dashboard/fees/invoices'} />
              <NavItem href="/dashboard/fees/dues" icon={FileText} label="Dues Ledger (বকেয়া খাতা)" active={pathname === '/dashboard/fees/dues'} />
              <NavItem href="/dashboard/fees/structures" icon={Settings} label="Fee Config (ফি নির্ধারণ)" active={pathname === '/dashboard/fees/structures'} />
            </div>
            
            <div className="mb-5">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">EXAMS & ASSESSMENT</p>
              <NavItem href="/dashboard/exams" icon={Award} label="Exams & Routines" active={pathname === '/dashboard/exams'} />
              <NavItem href="/dashboard/exams/marks" icon={Edit3} label="Marks Entry (নম্বর এন্ট্রি)" active={pathname.includes('/exams/marks')} />
              <NavItem href="/dashboard/exams/grading-rules" icon={Sliders} label="Weight Config (ফাইনাল ওয়েট)" active={pathname.includes('/exams/grading-rules')} />
              <NavItem href="/dashboard/exams/publish" icon={CheckCircle2} label="Result Publish (ফলাফল প্রকাশ)" active={pathname.includes('/exams/publish')} />
              <NavItem href="/dashboard/exams/results" icon={FileText} label="Results & Marksheets" active={pathname.includes('/exams/results')} />
            </div>

            <div className="mb-5">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ADMINISTRATION</p>
              <NavItem href="/dashboard/profile" icon={Settings} label="Campus Profile & Logo" active={pathname === '/dashboard/profile'} />
              <NavItem href="/dashboard/teachers" icon={Users} label="Teachers & Staff (শিক্ষক ও স্টাফ)" active={pathname.includes('/teachers')} />
              <NavItem href="#" icon={ScrollText} label="Audit Logs" disabled badge="Soon" />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-gray-500 font-medium">Language</span>
              <div className="flex space-x-1 text-xs font-bold border border-slate-200 rounded-lg p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded ${lang !== 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2 py-0.5 rounded ${lang === 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </>
      )}

      {/* STUDENT SIDEBAR */}
      {isStudent && (
        <>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">U</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">UEMP</h1>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Student Portal</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] font-mono text-blue-700 mt-0.5">ID: {user.username || user.student?.student_id}</p>
              {user.student?.class_name && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user.student.class_name} {user.student.section_name ? `• ${user.student.section_name}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 py-4 px-3 space-y-1">
            <NavItem href="/dashboard/portal/student" icon={LayoutDashboard} label="Student Portal (আমার পোর্টাল)" active={pathname === '/dashboard/portal/student' || pathname === '/dashboard'} />
            <NavItem href="/dashboard/exams/results" icon={Award} label="My Exam Results & Marksheet" active={pathname.includes('/results')} />
            <NavItem href="/dashboard/academics/routine" icon={Calendar} label="Class Timetable" active={pathname.includes('/academics/routine')} />
            <NavItem href="/dashboard/fees/invoices" icon={CreditCard} label="My Fees & Invoices" active={pathname.includes('/fees')} />
            <NavItem href="/dashboard/profile" icon={GraduationCap} label="My Academic Profile" active={pathname === '/dashboard/profile'} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-gray-500 font-medium">Language</span>
              <div className="flex space-x-1 text-xs font-bold border border-slate-200 rounded-lg p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded ${lang !== 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2 py-0.5 rounded ${lang === 'bn' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </>
      )}

      {/* TEACHER SIDEBAR */}
      {isTeacher && (
        <>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">U</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">UEMP</h1>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Teacher Portal</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] font-mono text-purple-700 mt-0.5 truncate">{user.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Faculty Member
              </span>
            </div>
          </div>

          <div className="flex-1 py-4 px-3 space-y-1">
            <NavItem href="/dashboard/portal/teacher" icon={LayoutDashboard} label="Teacher Portal (শিক্ষক পোর্টাল)" active={pathname === '/dashboard/portal/teacher' || pathname === '/dashboard'} />
            <NavItem href="/dashboard/exams/marks" icon={Edit3} label="Course Marks Entry" active={pathname.includes('/exams/marks')} />
            <NavItem href="/dashboard/exams" icon={Award} label="Exam Routines" active={pathname === '/dashboard/exams'} />
            <NavItem href="/dashboard/academics/attendance" icon={ClipboardCheck} label="Daily Attendance" active={pathname.includes('/academics/attendance')} />
            <NavItem href="/dashboard/academics/routine" icon={Calendar} label="Class Timetable" active={pathname.includes('/academics/routine')} />
            <NavItem href="/dashboard/profile" icon={User} label="My Profile" active={pathname === '/dashboard/profile'} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </>
      )}

      {/* OTHER ROLES SIDEBAR */}
      {!isSuperAdmin && !isInstAdmin && !isStudent && !isTeacher && (
        <>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">U</div>
              <h1 className="text-xl font-bold text-gray-900">UEMP</h1>
            </div>
          </div>
          <div className="flex-1 py-4 px-3">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} />
          </div>
          <div className="p-4 border-t border-gray-200">
            <button onClick={logout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
