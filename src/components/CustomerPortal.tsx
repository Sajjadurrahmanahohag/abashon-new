
import React, { useState, useEffect } from 'react';
import { User, Search, MapPin, LayoutGrid, Heart, Plus, Bell, Compass, Map as MapIcon, X, Calendar, MessageSquare, Folder, CheckCircle2, Globe, RefreshCw, FileText, ChevronLeft, Loader2 } from 'lucide-react';
import { AppUser, Property, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { createCalendarEvent, createGoogleChatSpace, listDriveFiles, saveToGoogleDrive, DriveFileInfo } from '../lib/workspace';

interface CustomerPortalProps {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  lang: Language;
  darkMode: boolean;
  properties: Property[];
  filteredProperties: Property[];
  mapCursor: { x: number; y: number } | null;
  mapAnchor: { x: number; y: number } | null;
  setMapAnchor: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  searchRadius: number;
  setSearchRadius: React.Dispatch<React.SetStateAction<number>>;
  hoveredPropertyId: string | null;
  setHoveredPropertyId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPropertyId: string;
  setSelectedPropertyId: React.Dispatch<React.SetStateAction<string>>;
  activeScreen: string;
  setActiveScreen: React.Dispatch<React.SetStateAction<string>>;
  logSystemAction: (message: string, level?: 'SUCCESS' | 'INFO' | 'WARN' | 'ERROR') => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  handleMapClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  handleMapMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  googleToken?: string | null;
  setGoogleToken?: React.Dispatch<React.SetStateAction<string | null>>;
  handleGoogleLogin?: () => Promise<void>;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({
  isLoggedIn,
  currentUser,
  lang,
  darkMode,
  properties,
  filteredProperties,
  mapCursor,
  mapAnchor,
  setMapAnchor,
  searchRadius,
  setSearchRadius,
  hoveredPropertyId,
  setHoveredPropertyId,
  selectedPropertyId,
  setSelectedPropertyId,
  activeScreen,
  setActiveScreen,
  logSystemAction,
  svgRef,
  handleMapClick,
  handleMapMouseMove,
  googleToken,
  setGoogleToken,
  handleGoogleLogin,
}) => {
  // --- GOOGLE WORKSPACE INTEGRATION STATES ---
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState<string | null>(null);

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatSpaceUrl, setChatSpaceUrl] = useState<string | null>(null);
  const [chatSuccess, setChatSuccess] = useState<string | null>(null);

  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [docSuccess, setDocSuccess] = useState<string | null>(null);

  // Mandatory user confirmation modal before mutating data (Calendar, Chat, Drive write)
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'calendar' | 'chat' | 'drive';
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // --- ACTIONS & EFFECT HANDLERS ---
  const fetchDriveFiles = async () => {
    if (!googleToken) return;
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await listDriveFiles(googleToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Failed to list Google Drive files');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      fetchDriveFiles();
    }
  }, [googleToken]);

  // Find active property details
  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  // 1. Google Calendar Event Creation helper
  const handleScheduleViewing = async () => {
    if (!googleToken || !activeProperty) return;
    
    const requestAction = async () => {
      setIsCreatingEvent(true);
      setCalendarSuccess(null);
      try {
        const startISO = `${selectedDate}T${selectedTime}:00`;
        const endHour = parseInt(selectedTime.split(':')[0]) + 1;
        const endMinutes = selectedTime.split(':')[1];
        const endISO = `${selectedDate}T${String(endHour).padStart(2, '0')}:${endMinutes}:00`;

        await createCalendarEvent({
          summary: `Property Viewing: ${activeProperty.title}`,
          location: activeProperty.locationName || 'Dhaka, Bangladesh',
          description: `Scheduled view/tour of "${activeProperty.title}". Price: ৳${activeProperty.price.toLocaleString()} Rent/month. Organized via Abashon Real Estate App.`,
          startTime: startISO,
          endTime: endISO,
        }, googleToken);

        setCalendarSuccess(`Viewing scheduled successfully on ${selectedDate} at ${selectedTime}!`);
        logSystemAction(`Renter added viewing appointment to Google Calendar for "${activeProperty.title}"`, 'SUCCESS');
      } catch (err: any) {
        console.error(err);
        logSystemAction(`Google Calendar Event creation failed: ${err.message}`, 'ERROR');
      } finally {
        setIsCreatingEvent(false);
      }
    };

    setConfirmationModal({
      type: 'calendar',
      title: lang === 'EN' ? 'Confirm Calendar Event' : 'ক্যালেন্ডার ইভেন্ট নিশ্চিত করুন',
      message: lang === 'EN' 
        ? `Would you like to schedule a viewing for "${activeProperty.title}" on ${selectedDate} at ${selectedTime} and add it directly to your Google Calendar?`
        : `আপনি কি "${activeProperty.title}" এর জন্য ${selectedDate} তারিখ ${selectedTime} টায় একটি বুকিং সেশন আপনার গুগল ক্যালেন্ডারে যুক্ত করতে চান?`,
      action: requestAction
    });
  };

  // 2. Google Chat Space Creation helper
  const handleCreateInquiryChatSpace = async () => {
    if (!googleToken || !activeProperty) return;

    const requestAction = async () => {
      setIsCreatingChat(true);
      setChatSuccess(null);
      try {
        // Safe alphanumeric and spaces display name for space API
        const safeName = `Abashon: ${activeProperty.title.replace(/[^a-zA-Z0-9 ]/g, '')}`.slice(0, 50);
        const space = await createGoogleChatSpace(safeName, googleToken);
        
        // Form a generic chat web URL or save displayName
        setChatSuccess(`Inquiry Chat Space "${space.displayName}" created successfully!`);
        setChatSpaceUrl(`https://chat.google.com/`);
        logSystemAction(`Google Chat Space created: "${space.displayName}"`, 'SUCCESS');
      } catch (err: any) {
        console.error(err);
        logSystemAction(`Google Chat Space creation failed: ${err.message}`, 'ERROR');
      } finally {
        setIsCreatingChat(false);
      }
    };

    setConfirmationModal({
      type: 'chat',
      title: lang === 'EN' ? 'Create Google Chat Space' : 'গুগল চ্যাট স্পেস তৈরি করুন',
      message: lang === 'EN'
        ? `Would you like to initiate a formal Google Chat Room Space for inquiries about "${activeProperty.title}"?`
        : `আপনি কি "${activeProperty.title}" সম্পর্কিত আলোচনার জন্য একটি গুগল চ্যাট স্পেস তৈরি করতে চান?`,
      action: requestAction
    });
  };

  // 3. Google Drive Document Export helper
  const handleExportBrochureToDrive = async () => {
    if (!googleToken || !activeProperty) return;

    const requestAction = async () => {
      setIsSavingDoc(true);
      setDocSuccess(null);
      try {
        const docName = `Abashon_Property_Brochure_${activeProperty.id}.txt`;
        const content = `=====================================================
ABASHON HOUSING DISCOVERY HUB - OFFICIAL PROPERTY SHEET
=====================================================

Property Title: ${activeProperty.title}
Region Name:    ${activeProperty.locationName}
Monthly Rent:   ৳${activeProperty.price.toLocaleString()} BDT
Specifications: ${activeProperty.beds} Bedrooms, ${activeProperty.baths} Bathrooms, ${activeProperty.sqft} Sq. Ft.
Property Type:  ${activeProperty.type}

DESCRIPTION:
${activeProperty.description}

AMENITIES:
${activeProperty.amenities.map(a => `- ${a}`).join('\n')}

-----------------------------------------------------
Document saved via secure Google Drive integration API.
Printed on: ${new Date().toLocaleDateString()}
=====================================================`;

        const doc = await saveToGoogleDrive(docName, content, googleToken);
        setDocSuccess(`Successfully uploaded "${doc.name}" to Google Drive!`);
        logSystemAction(`Uploaded property listing sheet for "${activeProperty.title}" to Google Drive`, 'SUCCESS');
        
        // Refresh the file list
        fetchDriveFiles();
      } catch (err: any) {
        console.error(err);
        logSystemAction(`Failed to save document to Google Drive: ${err.message}`, 'ERROR');
      } finally {
        setIsSavingDoc(false);
      }
    };

    setConfirmationModal({
      type: 'drive',
      title: lang === 'EN' ? 'Save Document to Google Drive' : 'গুগল ড্রাইভে ডকুমেন্ট সংরক্ষণ',
      message: lang === 'EN'
        ? `Would you like to generate and export a professional listing brochure for "${activeProperty.title}" as a text document in your Google Drive?`
        : `আপনি কি "${activeProperty.title}" এর জন্য একটি পেশাদার তথ্যপত্র টেক্সট আকারে আপনার গুগল ড্রাইভে সংরক্ষণ করতে চান?`,
      action: requestAction
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="portal_customer_view">
      
      {/* LEFT SIDE: DISCOVERY PANEL */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className={`flex-1 rounded-3xl border shadow-lg flex flex-col transition-all h-[580px] lg:h-[calc(100vh-140px)] sticky top-24 ${
          darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/70' : 'bg-white border-slate-200 shadow-slate-200'
        }`} id="customer_discovery_panel">
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 py-6">
            
            {isLoggedIn && currentUser && (
              <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow">
                  {currentUser.avatar}
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase leading-none">
                    {currentUser.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
                    {currentUser.role} Account
                  </p>
                </div>
              </div>
            )}

            {/* App content starts here */}
            {activeScreen === 'home' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                    {lang === 'EN' ? 'Recent Discoveries' : 'সাম্প্রতিক অনুসন্ধান'}
                  </h4>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {properties.slice(0, 5).map((p: Property) => (
                    <div key={p.id} className={`p-4 rounded-2xl border transition-all shadow-sm group hover:shadow-md ${darkMode ? 'bg-slate-850/50 border-slate-800 hover:border-emerald-500/40' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'}`}>
                      <div className="flex gap-4">
                        <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${p.imageColor} overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-black shadow-inner`}>
                          {p.type.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                            <span className="text-[10px] font-bold text-slate-400">#DH-2024</span>
                          </div>
                          <h5 className="text-sm font-black truncate leading-tight group-hover:text-emerald-500 transition-colors">{p.title}</h5>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{p.locationName}</span>
                          </div>
                          <div className="text-sm font-black text-emerald-500 mt-2">
                            ৳{p.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeScreen === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                    {lang === 'EN' ? 'User Settings' : 'ইউজার সেটিংস'}
                  </h4>
                  <button onClick={() => setActiveScreen('home')} className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Back</button>
                </div>
                
                <div className="space-y-4">
                  <div className={`p-6 rounded-3xl border text-center ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg mb-4">
                      {currentUser?.avatar || 'U'}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{currentUser?.name || 'Guest User'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{currentUser?.role || 'Guest'} Account</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${darkMode ? 'bg-slate-850 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-500/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300">Edit Profile</span>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:rotate-45" />
                    </button>

                    <button className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${darkMode ? 'bg-slate-850 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-500/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300">Notifications</span>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:rotate-45" />
                    </button>
                  </div>

                  {/* Google Drive Document Integration section on Profile page */}
                  {googleToken && (
                    <div className="space-y-3 mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {lang === 'EN' ? 'Connected Google Drive Docs' : 'কানেক্টেড গুগল ড্রাইভ ফাইল'}
                        </h5>
                        <button onClick={fetchDriveFiles} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition" title="Refresh Drive">
                          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {isLoadingDrive ? (
                        <div className="flex items-center justify-center py-6 text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Loading...</span>
                        </div>
                      ) : driveFiles.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {driveFiles.map((file) => (
                            <a
                              key={file.id}
                              href={file.webViewLink || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className={`p-2.5 rounded-xl border flex items-center justify-between hover:border-emerald-500/40 transition ${
                                darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-150 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                <span className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200">
                                  {file.name}
                                </span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">View File</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wide py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          No files found in Google Drive
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FULLY DETAILED PROPERTY DETAILS SCREEN */}
            {activeScreen === 'details' && activeProperty && (
              <div className="space-y-6 animate-fade-in pb-12">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveScreen('home');
                      setCalendarSuccess(null);
                      setChatSuccess(null);
                      setDocSuccess(null);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'EN' ? 'Back to Listings' : 'তালিকায় ফিরে যান'}</span>
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    ID: {activeProperty.id}
                  </span>
                </div>

                {/* Cover Gradient/Image Box */}
                <div className={`w-full h-40 rounded-3xl bg-gradient-to-br ${activeProperty.imageColor} shadow-inner flex items-center justify-center text-white text-3xl font-black relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 backdrop-brightness-95"></div>
                  <span className="relative z-10 filter drop-shadow">{activeProperty.type}</span>
                </div>

                {/* Primary Meta info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-md uppercase tracking-tight">Verified Real Estate</span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-tight">{activeProperty.type}</span>
                  </div>
                  <h3 className={`text-lg font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {activeProperty.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{activeProperty.locationName || 'Dhaka Metro'}</span>
                  </div>
                  <div className="text-xl font-black text-emerald-500 mt-2">
                    ৳{activeProperty.price.toLocaleString()} <span className="text-xs font-bold text-slate-400 lowercase">/ month</span>
                  </div>
                </div>

                {/* Core specifications */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className={`p-3 rounded-2xl border text-center ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sq. Footage</span>
                    <strong className="text-xs font-black text-emerald-500">{activeProperty.sqft} sqft</strong>
                  </div>
                  <div className={`p-3 rounded-2xl border text-center ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bedrooms</span>
                    <strong className="text-xs font-black text-emerald-500">{activeProperty.beds} Bed</strong>
                  </div>
                  <div className={`p-3 rounded-2xl border text-center ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bathrooms</span>
                    <strong className="text-xs font-black text-emerald-500">{activeProperty.baths} Bath</strong>
                  </div>
                </div>

                {/* Amenities section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Included Amenities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProperty.amenities.map((amenity, idx) => (
                      <span key={idx} className={`text-[10px] font-bold px-3 py-1 rounded-xl border ${darkMode ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-700'}`}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {activeProperty.description}
                  </p>
                </div>

                {/* ======================================================== */}
                {/* GOOGLE WORKSPACE SYSTEM INTEGRATIONS HUB */}
                {/* ======================================================== */}
                <div className={`rounded-3xl border p-5 space-y-4 shadow-sm transition-all ${
                  darkMode ? 'bg-slate-900 border-emerald-500/20 shadow-slate-950/40' : 'bg-emerald-500/5 border-emerald-500/10 shadow-emerald-500/5'
                }`} id="google_workspace_hub">
                  <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 leading-tight">
                        {lang === 'EN' ? 'Google Workspace Portal' : 'গুগল ওয়ার্কস্পেস পোর্টাল'}
                      </h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                        {lang === 'EN' ? 'Integrated Cloud Services' : 'ইন্টিগ্রেটেড ক্লাউড সার্ভিসসমূহ'}
                      </p>
                    </div>
                  </div>

                  {!googleToken ? (
                    <div className="py-2 text-center space-y-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {lang === 'EN' 
                          ? 'Unlock Google Cloud Services. Sign in with Google to schedule viewing events on your Calendar, create dynamic Chat inquires, and export documents directly to Drive!'
                          : 'গুগল ক্লাউড সেবাসমূহ আনলক করুন। আপনার গুগল অ্যাকাউন্টে লগইন করে সরাসরি ক্যালেন্ডার সেশন, চ্যাট রুম এবং ড্রাইভে ফাইল আপলোড করুন!'}
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-2.5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-750 font-black text-[10px] uppercase tracking-wider rounded-2xl shadow-sm transition-all"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>{lang === 'EN' ? 'Authorize Google Workspace' : 'গুগল অ্যাকাউন্ট সংযুক্ত করুন'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      
                      {/* 1. GOOGLE CALENDAR MODULE */}
                      <div className="space-y-2 bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            {lang === 'EN' ? '1. Google Calendar Scheduling' : '১. গুগল ক্যালেন্ডার বুকিং'}
                          </h5>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Viewing Date</label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Viewing Time</label>
                            <select
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="09:00">09:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="14:00">02:00 PM</option>
                              <option value="15:00">03:00 PM</option>
                              <option value="16:00">04:00 PM</option>
                              <option value="17:00">05:00 PM</option>
                              <option value="18:00">06:00 PM</option>
                            </select>
                          </div>
                        </div>

                        {calendarSuccess ? (
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[9px] font-bold text-emerald-500 flex items-center gap-1.5 mt-2 animate-fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{calendarSuccess}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isCreatingEvent}
                            onClick={handleScheduleViewing}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition mt-2 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isCreatingEvent ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Scheduling...</span>
                              </>
                            ) : (
                              <span>Schedule Viewing</span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 2. GOOGLE CHAT MODULE */}
                      <div className="space-y-2 bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            {lang === 'EN' ? '2. Google Chat Inquiries' : '২. গুগল চ্যাট ইনকোয়ারি'}
                          </h5>
                        </div>

                        {chatSuccess ? (
                          <div className="space-y-2 mt-2 animate-fade-in">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[9px] font-bold text-emerald-500 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{chatSuccess}</span>
                            </div>
                            {chatSpaceUrl && (
                              <a
                                href={chatSpaceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Launch Google Chat Web App</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isCreatingChat}
                            onClick={handleCreateInquiryChatSpace}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition mt-2 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isCreatingChat ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Creating Space...</span>
                              </>
                            ) : (
                              <span>Create Chat Space</span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 3. GOOGLE DRIVE MODULE */}
                      <div className="space-y-2 bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-purple-500" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            {lang === 'EN' ? '3. Google Drive Document Export' : '৩. গুগল ড্রাইভ ডকুমেন্ট ব্যাকআপ'}
                          </h5>
                        </div>

                        {docSuccess ? (
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[9px] font-bold text-emerald-500 flex items-center gap-1.5 mt-2 animate-fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{docSuccess}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isSavingDoc}
                            onClick={handleExportBrochureToDrive}
                            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition mt-2 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {isSavingDoc ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Exporting...</span>
                              </>
                            ) : (
                              <span>Save Brochure to Drive</span>
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: INTERACTIVE GEOLOGICAL MAP GRID CONTAINER */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col h-[580px] lg:h-[calc(100vh-140px)] sticky top-24 transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`} id="dhaka_map_subcontainer">
          
          {/* Map Header details */}
          <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            darkMode ? 'bg-slate-850 border-slate-750 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-2">
              <MapIcon className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest">{lang === 'EN' ? 'Dhaka Metropolitan Area' : 'ঢাকা মেট্রোপলিটন এলাকা'}</h3>
            </div>
            <div className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {mapCursor ? (lang === 'EN' ? `Cursor GPS: X:${mapCursor.x} Y:${mapCursor.y}` : `কার্সার কোঅর্ডিনেট: X:${mapCursor.x} Y:${mapCursor.y}`) : (lang === 'EN' ? 'Click map canvas to center radius query' : 'ব্যাসার্ধ ভিত্তিক অনুসন্ধানের জন্য ম্যাপে ক্লিক করুন')}
            </div>
          </div>

          {/* Slider and Range Controller bar */}
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/15 dark:bg-slate-900/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
              <Compass className="w-4 h-4 text-emerald-500 animate-spin-slow" />
              <span>
                {mapAnchor ? (
                  lang === 'EN' ? (
                    <span>Radial Filter around ({mapAnchor.x}, {mapAnchor.y}) : <strong className="text-emerald-500 font-extrabold">{searchRadius} miles</strong></span>
                  ) : (
                    <span>({mapAnchor.x}, {mapAnchor.y}) বিন্দুর চারপাশে রেডিয়াল ফিল্টার : <strong className="text-emerald-500 font-extrabold">{searchRadius} মাইল</strong></span>
                  )
                ) : (
                  <span>{lang === 'EN' ? 'Click map coordinate point to anchor search halo' : 'সার্চ সীমানা নির্ধারণ করতে ম্যাপের যেকোনো বিন্দুতে ক্লিক করুন'}</span>
                )}
              </span>
            </div>

            {mapAnchor && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'EN' ? 'Adjust Distance:' : 'দূরত্ব নির্ধারণ:'}</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                  className="w-24 accent-emerald-500 cursor-pointer"
                />
                <button
                  onClick={() => { setMapAnchor(null); logSystemAction('Cleared circular radius map anchor', 'WARN'); }}
                  className="p-1 hover:bg-rose-50 text-rose-500 rounded transition"
                  title="Reset Radius Anchor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* SVG MAP ELEMENT */}
          <div className="flex-1 relative overflow-hidden bg-[#e9eff1] dark:bg-slate-950">
            <svg
              ref={svgRef}
              viewBox="0 0 1000 1000"
              onClick={handleMapClick}
              onMouseMove={handleMapMouseMove}
              className="w-full h-full cursor-crosshair transition-colors duration-500 select-none"
            >
              <defs>
                <pattern id="cityMapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke={darkMode ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" opacity="0.45" />
                </pattern>

                <radialGradient id="searchSphereRing" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="75%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="lakeWaterBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
                </linearGradient>
              </defs>

              {/* Base Grid Pattern */}
              <rect width="1000" height="1000" fill="url(#cityMapGrid)" />

              {/* Water Bodies */}
              <path d="M 190,510 Q 230,550 200,610 T 250,700 T 210,810" fill="none" stroke="url(#lakeWaterBody)" strokeWidth="18" strokeLinecap="round" opacity="0.8" />
              <text x="180" y="740" className="text-[11px] font-black fill-sky-800/30 uppercase tracking-widest font-sans pointer-events-none transform rotate-45">{lang === 'EN' ? 'Dhanmondi Lake' : 'ধানমণ্ডি লেক'}</text>

              <path d="M 730,480 Q 760,580 750,680 T 790,830" fill="none" stroke="url(#lakeWaterBody)" strokeWidth="22" strokeLinecap="round" opacity="0.8" />
              <text x="760" y="750" className="text-[11px] font-black fill-sky-800/30 uppercase tracking-widest font-sans pointer-events-none transform rotate-90">{lang === 'EN' ? 'Gulshan Lake' : 'গুলশান লেক'}</text>

              <line x1="450" y1="0" x2="450" y2="1000" stroke={darkMode ? '#334155' : '#94a3b8'} strokeWidth="10" opacity="0.6" />
              <line x1="450" y1="0" x2="450" y2="1000" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="10 8" />
              <text x="465" y="80" className="text-[9px] font-mono font-bold fill-slate-400 uppercase tracking-wider pointer-events-none">{lang === 'EN' ? 'Airport Hwy / VIP Road' : 'এয়ারপোর্ট হাইওয়ে / ভিআইপি রোড'}</text>

              <g opacity="0.12" className="pointer-events-none">
                <circle cx="220" cy="580" r="110" fill="#10b981" />
                <text x="160" y="525" className="text-[13px] font-black fill-slate-700 uppercase">{lang === 'EN' ? 'Dhanmondi Sector' : 'ধানমণ্ডি এলাকা'}</text>

                <circle cx="680" cy="380" r="120" fill="#3b82f6" />
                <text x="610" y="325" className="text-[13px] font-black fill-slate-700 uppercase">{lang === 'EN' ? 'Bashundhara Zone' : 'বসুন্ধরা এলাকা'}</text>

                <circle cx="480" cy="160" r="100" fill="#f59e0b" />
                <text x="445" y="115" className="text-[13px] font-black fill-slate-700 uppercase">{lang === 'EN' ? 'Uttara Sector' : 'উত্তরা এলাকা'}</text>
              </g>

              {mapAnchor && (
                <>
                  <circle
                    cx={mapAnchor.x}
                    cy={mapAnchor.y}
                    r={searchRadius * 100}
                    fill="url(#searchSphereRing)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="pointer-events-none animate-pulse"
                  />
                  <g transform={`translate(${mapAnchor.x}, ${mapAnchor.y})`} className="pointer-events-none">
                    <circle r="10" fill="#10b981" opacity="0.25" />
                    <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                </>
              )}

              {properties.map((prop) => {
                const isFiltered = filteredProperties.some((fp) => fp.id === prop.id);
                const isHovered = hoveredPropertyId === prop.id;
                const isSelected = selectedPropertyId === prop.id;

                return (
                  <g
                    key={prop.id}
                    transform={`translate(${prop.x}, ${prop.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPropertyId(prop.id);
                      setActiveScreen('details');
                      logSystemAction(`Renter selected map listing: "${prop.title}"`, 'INFO');
                    }}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    className={`cursor-pointer transition-all duration-300 ${isFiltered ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
                  >
                    <path
                      d="M 0,0 C -8,-12 -12,-16 -12,-24 A 12,12 0 1,1 12,-24 C 12,-16 8,-12 0,0"
                      fill={isHovered || isSelected ? '#10b981' : (darkMode ? '#334155' : '#ffffff')}
                      stroke="#10b981"
                      strokeWidth="2"
                      className="drop-shadow-lg"
                    />
                    <circle cx="0" cy="-24" r="4" fill={isHovered || isSelected ? '#ffffff' : '#10b981'} />
                    
                    {(isHovered || isSelected) && (
                      <g transform="translate(18, -35)">
                        <rect x="0" y="0" width="120" height="40" rx="10" fill={darkMode ? '#1e293b' : '#ffffff'} className="shadow-xl" stroke="#10b981" strokeWidth="1" />
                        <text x="10" y="18" className={`text-[9px] font-black ${darkMode ? 'fill-slate-100' : 'fill-slate-900'}`}>{prop.title}</text>
                        <text x="10" y="32" className="text-[8px] font-bold fill-emerald-500">৳{prop.price.toLocaleString()}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL OVERLAY */}
      {confirmationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">
                {confirmationModal.title}
              </h3>
            </div>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
              {confirmationModal.message}
            </p>
            
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationModal(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-450 font-bold text-[10px] uppercase tracking-wider rounded-xl transition"
              >
                {lang === 'EN' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmationModal.action;
                  setConfirmationModal(null);
                  await action();
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                {lang === 'EN' ? 'Confirm' : 'নিশ্চিত'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPortal;
