'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Search, KeyRound, Copy, Check, Eye, EyeOff,
  Printer, Mail, Phone, BookOpen, Building2, ShieldCheck,
  Sparkles, ExternalLink, Share2, AlertCircle, X
} from 'lucide-react';

export default function TeachersManagementPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Faculty Member',
    initial_password: 'Teacher@2026'
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  const institutionId = user?.institution_id || user?.institution?.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const teacherPortalUrl = `${origin}/portal/${institutionId}/teacher`;

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/teachers');
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load teachers', err);
      toast.error(isBn ? 'শিক্ষকদের তালিকা লোড করা যায়নি' : 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCopyCredentials = (teacher) => {
    const text = `🏫 ${user?.institution?.name || 'School'} — Faculty Login Credentials\n\n👤 Teacher: ${teacher.name}\n✉️ Email: ${teacher.email}\n🔑 Password: ${teacher.initial_password || 'Teacher@2026'}\n🌐 Teacher Portal: ${teacherPortalUrl}\n\nPlease log in and manage your class routine, attendance, and exam marks.`;
    navigator.clipboard.writeText(text);
    setCopiedId(teacher.id);
    toast.success(isBn ? 'লগইন তথ্য কপি করা হয়েছে!' : 'Login credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTogglePassword = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast.error(isBn ? 'নাম এবং ইমেইল দেওয়া আবশ্যক' : 'Name and email are required');
      return;
    }

    try {
      setSavingTeacher(true);
      const res = await api.post('/academics/teachers', addForm);
      toast.success(isBn ? 'নতুন শিক্ষক যুক্ত হয়েছে!' : 'Teacher added successfully!');
      setAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        designation: 'Faculty Member',
        initial_password: 'Teacher@2026'
      });
      await fetchTeachers();

      // Open credential slip for the newly created teacher
      if (res.data?.data) {
        setSelectedTeacher(res.data.data);
        setSlipModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'শিক্ষক যুক্ত করা যায়নি' : 'Failed to add teacher'));
    } finally {
      setSavingTeacher(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            <Users size={15} />
            <span>{isBn ? 'প্রশাসনিক ব্যবস্থাপনা' : 'Academic Administration'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isBn ? 'শিক্ষক ও স্টাফ একাউন্ট ও ক্রেডেনশিয়াল' : 'Teachers & Staff Credentials Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'সকল শিক্ষকদের পোর্টাল লগইন আইডি ও পাসওয়ার্ড তৈরি, প্রিন্ট ও কপি করে দিন।'
              : 'Manage faculty portal logins, generate initial passwords, and print credential slips.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
          >
            <UserPlus size={16} />
            <span>{isBn ? '+ নতুন শিক্ষক যুক্ত করুন' : '+ Add New Teacher'}</span>
          </button>
        </div>
      </div>

      {/* Portal Link Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-purple-200">
            {isBn ? 'শিক্ষকদের লগইন লিংক' : 'Official Faculty Portal Link'}
          </span>
          <h3 className="text-base font-bold text-white">
            {isBn ? 'শিক্ষকদের সাথে শেয়ার করার লিংক:' : 'Direct Shareable Portal URL:'}
          </h3>
          <p className="text-xs text-purple-200 font-mono break-all bg-black/20 px-3 py-1.5 rounded-lg">
            {teacherPortalUrl}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(teacherPortalUrl);
              toast.success(isBn ? 'শিক্ষক পোর্টাল লিংক কপি হয়েছে!' : 'Teacher portal link copied!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy size={14} />
            {isBn ? 'লিংক কপি' : 'Copy Link'}
          </button>
          <a
            href={teacherPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <ExternalLink size={14} />
            {isBn ? 'ভিউ পোর্টাল' : 'Open Portal'}
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search teachers by name, email, or phone...'}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {isBn ? `মোট শিক্ষক: ${teachers.length} জন` : `Total Faculty Members: ${teachers.length}`}
        </div>
      </div>

      {/* Teachers Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">{isBn ? 'শিক্ষক ও পরিচিতি' : 'Teacher Profile'}</th>
                <th className="px-6 py-3.5">{isBn ? 'লগইন ইমেইল (ইউজারনেম)' : 'Login Email'}</th>
                <th className="px-6 py-3.5">{isBn ? 'প্রাথমিক পাসওয়ার্ড' : 'Initial Password'}</th>
                <th className="px-6 py-3.5">{isBn ? 'বরাদ্দকৃত বিষয়' : 'Assigned Courses'}</th>
                <th className="px-6 py-3.5 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-44"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No faculty members found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isBn ? 'উপরের বাটনে ক্লিক করে নতুন শিক্ষক যুক্ত করুন।' : 'Add a new teacher using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const passRevealed = revealedPasswords[teacher.id];
                  const passwordDisplay = teacher.initial_password || 'Teacher@2026';

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {teacher.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                            <p className="text-[11px] text-slate-400">{teacher.phone || teacher.designation || 'Faculty Member'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                          {teacher.email}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-md border border-purple-100">
                            {passRevealed ? passwordDisplay : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(teacher.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                            title={passRevealed ? 'Hide' : 'Reveal'}
                          >
                            {passRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <BookOpen size={12} />
                          <span>{teacher.assigned_subjects_count || 0} {isBn ? 'টি বিষয়' : 'Subjects'}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyCredentials(teacher)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                            title="Copy Login Details"
                          >
                            {copiedId === teacher.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span className="hidden sm:inline">{copiedId === teacher.id ? (isBn ? 'কপিকৃত' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setSlipModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs transition-colors"
                            title="Print Slip"
                          >
                            <Printer size={13} />
                            <span>{isBn ? 'স্লিপ প্রিন্ট' : 'Print Slip'}</span>
                          </button>
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

      {/* ADD TEACHER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                <UserPlus size={18} />
                <span>{isBn ? 'নতুন শিক্ষক যুক্ত করুন' : 'Add New Teacher'}</span>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {isBn ? 'শিক্ষকের পূর্ণ নাম *' : 'Teacher Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isBn ? 'যেমন: মোহাম্মদ শফিকুল ইসলাম' : 'e.g. Md. Shafiqul Islam'}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {isBn ? 'অফিসিয়াল ইমেইল (লগইন ইউজারনেম) *' : 'Official Email (Login Username) *'}
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="teacher@school.edu.bd"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {isBn ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01711-XXXXXX"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {isBn ? 'পদবী' : 'Designation'}
                  </label>
                  <input
                    type="text"
                    value={addForm.designation}
                    onChange={(e) => setAddForm(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder={isBn ? 'সহকারী শিক্ষক' : 'Assistant Teacher'}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    {isBn ? 'প্রাথমিক পাসওয়ার্ড *' : 'Initial Password *'}
                  </label>
                  <span className="text-[10px] text-purple-600 font-medium">
                    {isBn ? 'প্রিন্ট স্লিপে প্রদর্শিত হবে' : 'Will appear on credential slip'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={addForm.initial_password}
                  onChange={(e) => setAddForm(prev => ({ ...prev, initial_password: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingTeacher}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {savingTeacher ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'যুক্ত ও স্লিপ প্রিন্ট করুন' : 'Save & Print Slip')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CREDENTIAL SLIP MODAL */}
      {slipModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            
            {/* Modal Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <ShieldCheck size={18} className="text-purple-600" />
                <span>{isBn ? 'শিক্ষক প্রবেশপত্র / ক্রেডেনশিয়াল স্লিপ' : 'Official Faculty Credential Slip'}</span>
              </div>
              <button
                onClick={() => setSlipModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Slip Card */}
            <div id="printable-credential-slip" className="border-2 border-purple-200 rounded-2xl p-6 bg-purple-50/20 space-y-5">
              {/* Institution Header */}
              <div className="text-center pb-4 border-b border-purple-100">
                <div className="w-14 h-14 mx-auto rounded-xl bg-white p-1 border border-purple-200 shadow-xs flex items-center justify-center mb-2 overflow-hidden">
                  {user?.institution?.logo ? (
                    <img src={user.institution.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-purple-600 text-white font-black text-xl flex items-center justify-center rounded-lg">
                      {user?.institution?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  {user?.institution?.name || 'Institution Name'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user?.institution?.address || 'Campus Address'} • Session: 2026
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                  Faculty Access Document
                </span>
              </div>

              {/* Teacher Details */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">{isBn ? 'শিক্ষকের নাম:' : 'Teacher Name:'}</span>
                  <span className="font-bold text-slate-900">{selectedTeacher.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">{isBn ? 'লগইন ইমেইল:' : 'Login Email:'}</span>
                  <span className="font-mono font-bold text-purple-700">{selectedTeacher.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">{isBn ? 'প্রাথমিক পাসওয়ার্ড:' : 'Initial Password:'}</span>
                  <span className="font-mono font-bold text-slate-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedTeacher.initial_password || 'Teacher@2026'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">{isBn ? 'পোর্টাল লিংক:' : 'Portal URL:'}</span>
                  <span className="font-mono text-[10px] text-blue-600 font-semibold">{teacherPortalUrl}</span>
                </div>
              </div>

              {/* Security Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>{isBn ? 'জরুরি নির্দেশনা:' : 'Important Notice:'}</strong>{' '}
                {isBn
                  ? 'এই স্লিপটি অত্যন্ত সতর্কতার সাথে শিক্ষকের নিকট হস্তান্তর করুন। শিক্ষক প্রথমবার লগইন করে পাসওয়ার্ড পরিবর্তন করে নিতে পারবেন।'
                  : 'Hand over this slip confidentially to the faculty member. The teacher can manage their course marks, routine, and class attendance.'}
              </div>
            </div>

            {/* Print & Copy Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedTeacher)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Copy size={14} />
                <span>{isBn ? 'টেক্সট কপি' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md transition-colors"
              >
                <Printer size={14} />
                <span>{isBn ? 'স্লিপ প্রিন্ট করুন' : 'Print Slip'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

