
import React from 'react';
import { User, Search, MapPin, LayoutGrid, Heart, Plus, Bell, Compass, Map as MapIcon, X } from 'lucide-react';
import { AppUser, Property, Language } from '../types';
import { TRANSLATIONS } from '../constants';

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
}) => {
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
    </div>
  );
};

export default CustomerPortal;
