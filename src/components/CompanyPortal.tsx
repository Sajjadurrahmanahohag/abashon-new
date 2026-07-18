
import React from 'react';
import { Database, CheckCircle2, Sliders, DollarSign, Sparkles, Trash2, User, Compass, Activity } from 'lucide-react';
import { AppUser, Property, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CompanyPortalProps {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  lang: Language;
  darkMode: boolean;
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  globalPlatformFee: number;
  setGlobalPlatformFee: React.Dispatch<React.SetStateAction<number>>;
  autoApproveLandlordAds: boolean;
  setAutoApproveLandlordAds: React.Dispatch<React.SetStateAction<boolean>>;
  adminSystemInput: string;
  setAdminSystemInput: React.Dispatch<React.SetStateAction<string>>;
  adminSuccessLog: string;
  setAdminSuccessLog: React.Dispatch<React.SetStateAction<string>>;
  handleAdminSystemImport: (e: React.FormEvent) => void;
  handleAutoGenerateSystemData: () => void;
  logSystemAction: (message: string, level?: 'SUCCESS' | 'INFO' | 'WARN' | 'ERROR') => void;
  androidBuildStatus: 'idle' | 'building' | 'success' | 'failed';
  androidBuildProgress: number;
  androidBuildLogs: string[];
  handleRunAndroidSimulation: () => void;
  systemLogs: any[];
}

const CompanyPortal: React.FC<CompanyPortalProps> = ({
  isLoggedIn,
  currentUser,
  lang,
  darkMode,
  properties,
  setProperties,
  users,
  setUsers,
  globalPlatformFee,
  setGlobalPlatformFee,
  autoApproveLandlordAds,
  setAutoApproveLandlordAds,
  adminSystemInput,
  setAdminSystemInput,
  adminSuccessLog,
  handleAdminSystemImport,
  handleAutoGenerateSystemData,
  logSystemAction,
  androidBuildStatus,
  androidBuildProgress,
  androidBuildLogs,
  handleRunAndroidSimulation,
}) => {
  return (
    <div className="space-y-6 animate-fade-in" id="portal_company_view">
      {isLoggedIn && currentUser && (
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-600/20">
            {currentUser.avatar}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {lang === 'EN' ? `Welcome, ${currentUser.name}` : `${currentUser.name}, স্বাগতম`}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-wide">
              {lang === 'EN' ? 'System Administrator Control Center & Data Analytics.' : 'সিস্টেম অ্যাডমিনিস্ট্রেটর কন্ট্রোল সেন্টার ও ডেটা অ্যানালিটিক্স।'}
            </p>
          </div>
        </div>
      )}
      
      {/* Admin top stats blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[9px] uppercase font-bold block">{lang === 'EN' ? 'Abashon Core Database' : 'আবাসন মূল ডাটাবেস'}</span>
            <span className="text-xl font-black">{properties.length} {lang === 'EN' ? 'Total System Listings' : 'টি মোট সিস্টেম লিস্টিং'}</span>
          </div>
          <Database className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[9px] uppercase font-bold block">{lang === 'EN' ? 'Approved / Live Listings' : 'অনুমোদিত / সক্রিয় বিজ্ঞাপন'}</span>
            <span className="text-xl font-black text-emerald-400">{properties.filter(p => p.isApproved).length} {lang === 'EN' ? 'Live Ads' : 'টি লাইভ বিজ্ঞাপন'}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[9px] uppercase font-bold block">{lang === 'EN' ? 'Pending Verification' : 'যাচাইকরণের অপেক্ষায়'}</span>
            <span className="text-xl font-black text-amber-400">{properties.filter(p => !p.isApproved).length} {lang === 'EN' ? 'Audits Left' : 'টি অডিট বাকি'}</span>
          </div>
          <Sliders className="w-8 h-8 text-amber-500 opacity-60" />
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[9px] uppercase font-bold block">{lang === 'EN' ? 'Platform Fee Loop' : 'প্ল্যাটফর্ম সার্ভিস ফি'}</span>
            <span className="text-xl font-black text-purple-400">{globalPlatformFee}% {lang === 'EN' ? 'commission' : 'কমিশন'}</span>
          </div>
          <DollarSign className="w-8 h-8 text-purple-500 opacity-60" />
        </div>
      </div>

      {/* Corporate Admin Layout columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* UPLOAD SYSTEM & ENTRY CONSOLE (5 COLUMNS) */}
        <div className={`lg:col-span-5 p-5 rounded-3xl border shadow flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{lang === 'EN' ? 'Platform Upload System' : 'প্ল্যাটফর্ম আপলোড সিস্টেম'}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{lang === 'EN' ? 'Admin catalog loader & bulk JSON listing injector' : 'অ্যাডমিন ক্যাটালগ লোডার এবং বাল্ক JSON লিস্টিং ইনজেক্টর'}</p>
              </div>
            </div>

            <form onSubmit={handleAdminSystemImport} className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>{lang === 'EN' ? 'Structured JSON Entry Block' : 'কাঠামোগত JSON এন্ট্রি ব্লক'}</span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSystemData}
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{TRANSLATIONS[lang].importSample}</span>
                  </button>
                </div>

                <textarea
                  rows={10}
                  value={adminSystemInput}
                  onChange={(e) => setAdminSystemInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-mono font-semibold text-purple-600 dark:text-purple-400 focus:outline-none"
                  placeholder="[ { 'title': '...', 'price': ... } ]"
                />
              </div>

              {adminSuccessLog && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-xl border border-emerald-100 animate-pulse">
                  {adminSuccessLog}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow transition"
              >
                {TRANSLATIONS[lang].importAction}
              </button>
            </form>
          </div>

          {/* Company global variables */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-3 text-xs font-semibold">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">{TRANSLATIONS[lang].platformSettings}</span>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{TRANSLATIONS[lang].autoApprove}</span>
              <button
                onClick={() => {
                  setAutoApproveLandlordAds(!autoApproveLandlordAds);
                  logSystemAction(`Global Landlord Ad Auto-Approval toggled to: ${!autoApproveLandlordAds}`, 'WARN');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition ${autoApproveLandlordAds ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition ${autoApproveLandlordAds ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{TRANSLATIONS[lang].platformFee}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={globalPlatformFee}
                  onChange={(e) => {
                    setGlobalPlatformFee(parseInt(e.target.value));
                    logSystemAction(`Global platform fee updated to ${e.target.value}%`, 'WARN');
                  }}
                  className="w-20 accent-purple-600"
                />
                <span className="text-purple-600 font-extrabold">{globalPlatformFee}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* LISTINGS AUDIT MANAGER & REAL-TIME LOGS PANEL (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Listings verification catalog table */}
          <div className={`p-5 rounded-3xl border shadow ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3">{TRANSLATIONS[lang].activeProperties}</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-2.5">{lang === 'EN' ? 'Title' : 'শিরোনাম'}</th>
                    <th className="pb-2.5">{lang === 'EN' ? 'Region' : 'এলাকা'}</th>
                    <th className="pb-2.5">{lang === 'EN' ? 'Price' : 'ভাড়া'}</th>
                    <th className="pb-2.5">{lang === 'EN' ? 'Status' : 'অবস্থা'}</th>
                    <th className="pb-2.5 text-right">{lang === 'EN' ? 'Actions' : 'পদক্ষেপ'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                  {properties.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 max-w-[150px] truncate pr-2 font-black">{p.title}</td>
                      <td className="py-2.5 text-slate-400">{p.region as any}</td>
                      <td className="py-2.5 text-emerald-500">৳{p.price.toLocaleString()}</td>
                      <td className="py-2.5">
                        {p.isApproved ? (
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400 px-2 py-0.5 rounded text-[9px] uppercase font-mono">{lang === 'EN' ? 'Approved' : 'অনুমোদিত'}</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400 px-2 py-0.5 rounded text-[9px] uppercase font-mono">{lang === 'EN' ? 'Pending' : 'অপেক্ষমাণ'}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setProperties(prev => prev.map(item => item.id === p.id ? { ...item, isApproved: !item.isApproved } : item));
                            logSystemAction(`Toggled approved status for property listing "${p.title}"`, 'WARN');
                          }}
                          className={`px-2 py-1 rounded text-[9px] font-extrabold ${p.isApproved ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {p.isApproved ? (lang === 'EN' ? 'Suspend' : 'সাময়িক স্থগিত') : (lang === 'EN' ? 'Verify & Approve' : 'যাচাই ও অনুমোদন')}
                        </button>
                        <button
                          onClick={() => {
                            setProperties(prev => prev.filter(item => item.id !== p.id));
                            logSystemAction(`Archived/Deleted property listing ID: ${p.id}`, 'WARN');
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Delete/Archive Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* USER MANAGEMENT & ROLE PERMISSIONS */}
          <div className={`p-5 rounded-3xl border shadow ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{lang === 'EN' ? 'User Access Control' : 'ইউজার এক্সেস কন্ট্রোল'}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{lang === 'EN' ? 'Manage global user permissions and assign portal access' : 'গ্লোবাল ইউজার পারমিশন এবং পোর্টাল এক্সেস ম্যানেজ করুন'}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-2.5">{lang === 'EN' ? 'User' : 'ইউজার'}</th>
                    <th className="pb-2.5">{lang === 'EN' ? 'Email' : 'ইমেল'}</th>
                    <th className="pb-2.5">{lang === 'EN' ? 'Active Role' : 'সক্রিয় ভূমিকা'}</th>
                    <th className="pb-2.5 text-right">{lang === 'EN' ? 'Permission Matrix' : 'পারমিশন ম্যাট্রিক্স'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black">{u.avatar}</div>
                          <span className="font-black text-slate-800 dark:text-slate-200">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 font-medium">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                          u.role === 'company' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            setUsers(prev => prev.map(user => user.id === u.id ? { ...user, role: newRole } : user));
                            logSystemAction(`Admin updated role for ${u.name} to ${newRole}`, 'WARN');
                          }}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="owner">Owner</option>
                          <option value="company">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Android APK Compiler Hub */}
          <div className={`p-5 rounded-3xl border shadow space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 text-white rounded-xl">
                  <Compass className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">{lang === 'EN' ? 'Android APK Compiler Hub' : 'অ্যান্ড্রয়েড APK কম্পাইলার হাব'}</h3>
                  <p className="text-[9px] text-slate-400 font-bold">{lang === 'EN' ? 'Complete hybrid mobile APK workspace with live build simulator' : 'লাইভ বিল্ড সিমুলেটর সহ হাইব্রিড মোবাইল APK ওয়ার্কস্পেস'}</p>
                </div>
              </div>
              <span className="text-[8px] bg-emerald-50 dark:bg-slate-800 text-emerald-600 px-2.5 py-1 rounded-full font-extrabold border border-emerald-100 dark:border-slate-700">CAPACITOR ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/55 dark:border-slate-850">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">{lang === 'EN' ? 'Integrated Platform Files Status' : 'ইন্টিগ্রেটেড ফাইল স্ট্যাটাস'}</span>
                <ul className="space-y-1.5 font-semibold text-slate-600 dark:text-slate-350">
                  <li className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>capacitor.config.ts (com.abashon.app)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Capacitor Mobile core dependency package</span>
                  </li>
                  <li className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>package.json script variables (:build, :sync)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>.github/workflows/android.yml (Automated CI APK Build)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/55 dark:border-slate-850 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-1">{lang === 'EN' ? 'Cloud CI Automated Build' : 'ক্লাউড CI স্বয়ংক্রিয় বিল্ড'}</span>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                    {lang === 'EN' 
                      ? 'We configured a robust GitHub Action workflow. Simply export or push this workspace code to GitHub, and the cloud will automatically compile the APK for you!'
                      : 'আমরা গিটহাব অ্যাকশন ওয়ার্কফ্লো কনফিগার করেছি। গিটহাবে এই কোড পুশ করলেই ক্লাউড স্বয়ংক্রিয়ভাবে আপনার জন্য APK বিল্ড করবে!'}
                  </p>
                </div>
                <div className="flex gap-2 text-[9px] font-bold">
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 px-2 py-0.5 rounded font-mono">JDK 17</span>
                  <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 px-2 py-0.5 rounded font-mono">Gradle Daemon</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow">
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="ml-1">Gradle CLI Terminal (Simulated)</span>
                </div>
                {androidBuildStatus === 'building' && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Activity className="w-3 h-3 animate-pulse" />
                    <span>Compiling {androidBuildProgress}%</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-4 font-mono text-[9px] leading-relaxed text-slate-350 min-h-[140px] max-h-[180px] overflow-y-auto space-y-1">
                {androidBuildLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">
                    {lang === 'EN' 
                      ? 'Click "Simulate Android Gradle Compiler" below to test the build process!' 
                      : 'বিল্ড পদ্ধতি টেস্ট করতে নিচে "অ্যান্ড্রয়েড গ্রেডেল কম্পাইলার সিমুলেট" বাটনে ক্লিক করুন!'}
                  </p>
                ) : (
                  androidBuildLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 font-mono">
                      <span className="text-slate-600">$&gt;</span>
                      <span className={log.includes('SUCCESS') || log.includes('SUCCESSFUL') ? 'text-emerald-400 font-extrabold' : 'text-slate-350'}>{log}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-900 p-3 flex items-center justify-between text-xs">
                {androidBuildStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[9px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>app-debug.apk Compiled Successfully!</span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[9px] font-medium">Ready to compile</span>
                )}

                <button
                  onClick={handleRunAndroidSimulation}
                  disabled={androidBuildStatus === 'building'}
                  className={`px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9px] rounded-lg transition-all ${
                    androidBuildStatus === 'building' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {androidBuildStatus === 'building' 
                    ? (lang === 'EN' ? 'Compiling Debug...' : 'কম্পাইল হচ্ছে...') 
                    : (lang === 'EN' ? 'Simulate Android Gradle Compiler' : 'অ্যান্ড্রয়েড গ্রেডেল কম্পাইলার সিমুলেট করুন')}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/55 dark:border-slate-850 text-xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">{lang === 'EN' ? 'How to compile locally into real APK:' : 'অরিজিনাল APK ফাইল লোকালি তৈরি করার নিয়মাবলী:'}</span>
              <ol className="space-y-1.5 font-semibold text-slate-600 dark:text-slate-350 list-decimal list-inside text-[10px] leading-relaxed">
                <li>{lang === 'EN' ? 'Export this project workspace ZIP (under Settings menu).' : 'এই প্রজেক্টের জিপ (ZIP) ফাইলটি ডাউনলোড করে এক্সপোর্ট করুন।'}</li>
                <li>{lang === 'EN' ? 'Open terminal in the folder and run: ' : 'ফোল্ডারে গিয়ে টার্মিনাল ওপেন করুন এবং রান করুন: '} <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-500">npm install</code></li>
                <li>{lang === 'EN' ? 'Add Android platform files: ' : 'অ্যান্ড্রয়েড প্ল্যাটফর্ম যুক্ত করতে রান করুন: '} <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-500">npx cap add android</code></li>
                <li>{lang === 'EN' ? 'Sync web bundle and prepare compiler: ' : 'ওয়েব ফাইল অ্যান্ড্রয়েডে যুক্ত করতে রান করুন: '} <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-500">npm run build && npx cap sync</code></li>
                <li>{lang === 'EN' ? 'Compile and open in Android Studio: ' : 'অ্যান্ড্রয়েড স্টুডিও ওপেন করতে রান করুন: '} <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-500">npx cap open android</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPortal;
