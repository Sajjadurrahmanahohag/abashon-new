
import React from 'react';
import { UploadCloud, PlusCircle, Trash2 } from 'lucide-react';
import { AppUser, Property, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface OwnerPortalProps {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  lang: Language;
  darkMode: boolean;
  properties: Property[];
  ownerAdTitle: string;
  setOwnerAdTitle: React.Dispatch<React.SetStateAction<string>>;
  ownerAdType: 'House' | 'Apartment' | 'Room' | 'Office';
  setOwnerAdType: React.Dispatch<React.SetStateAction<'House' | 'Apartment' | 'Room' | 'Office'>>;
  ownerAdPrice: string;
  setOwnerAdPrice: React.Dispatch<React.SetStateAction<string>>;
  ownerAdRegion: 'Dhanmondi' | 'Bashundhara' | 'Uttara' | 'Mirpur' | 'Gulshan' | 'Banani';
  setOwnerAdRegion: React.Dispatch<React.SetStateAction<'Dhanmondi' | 'Bashundhara' | 'Uttara' | 'Mirpur' | 'Gulshan' | 'Banani'>>;
  ownerAdSqft: string;
  setOwnerAdSqft: React.Dispatch<React.SetStateAction<string>>;
  ownerAdBeds: string;
  setOwnerAdBeds: React.Dispatch<React.SetStateAction<string>>;
  ownerAdBaths: string;
  setOwnerAdBaths: React.Dispatch<React.SetStateAction<string>>;
  ownerAdAmenities: string[];
  handleToggleAdAmenity: (amenity: string) => void;
  ownerAdDesc: string;
  setOwnerAdDesc: React.Dispatch<React.SetStateAction<string>>;
  handleOwnerAdSubmit: (e: React.FormEvent) => void;
}

const OwnerPortal: React.FC<OwnerPortalProps> = ({
  isLoggedIn,
  currentUser,
  lang,
  darkMode,
  properties,
  ownerAdTitle,
  setOwnerAdTitle,
  ownerAdType,
  setOwnerAdType,
  ownerAdPrice,
  setOwnerAdPrice,
  ownerAdRegion,
  setOwnerAdRegion,
  ownerAdSqft,
  setOwnerAdSqft,
  ownerAdBeds,
  setOwnerAdBeds,
  ownerAdBaths,
  setOwnerAdBaths,
  ownerAdAmenities,
  handleToggleAdAmenity,
  ownerAdDesc,
  setOwnerAdDesc,
  handleOwnerAdSubmit,
}) => {
  return (
    <div className="space-y-6 animate-fade-in" id="portal_owner_view">
      {isLoggedIn && currentUser && (
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/20">
            {currentUser.avatar}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {lang === 'EN' ? `Welcome back, ${currentUser.name}` : `${currentUser.name}, আপনাকে স্বাগতম`}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-wide">
              {lang === 'EN' ? 'Manage your property portfolio and monitor real-time inquiries.' : 'আপনার প্রপার্টি পোর্টফোলিও পরিচালনা করুন এবং অনুসন্ধানগুলো মনিটর করুন।'}
            </p>
          </div>
        </div>
      )}
      
      {/* Header statistics bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-2xl">
          <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">{lang === 'EN' ? 'My Listed Properties' : 'আমার তালিকাভুক্ত বিজ্ঞাপন'}</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {properties.filter(p => p.host.name.includes('Sajjad') || p.host.name.includes('Owner')).length} {lang === 'EN' ? 'Active Ads' : 'টি সক্রিয় বিজ্ঞাপন'}
          </span>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">{lang === 'EN' ? 'Incoming Chat Inquiries' : 'ইনকামিং চ্যাট অনুসন্ধান'}</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">8 {lang === 'EN' ? 'Prospective Tenants' : 'জন সম্ভাব্য ভাড়াটিয়া'}</span>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 rounded-2xl">
          <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider block">{lang === 'EN' ? 'Owner Response Rate' : 'মালিকের রেসপন্স রেট'}</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">100% {lang === 'EN' ? 'Verified' : 'যাচাইকৃত'}</span>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider block">{lang === 'EN' ? 'Simulated Ad Views' : 'বিজ্ঞাপন ভিউ (সিমুলেটেড)'}</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">2,410 {lang === 'EN' ? 'Impression clicks' : 'টি ইম্প্রেশন ক্লিক'}</span>
        </div>
      </div>

      {/* Main content grid: Left side form, Right side list & live messages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LANDLORD ENTRY SYSTEM / UPLOAD WIZARD (5 COLUMNS) */}
        <div className={`lg:col-span-5 p-5 rounded-3xl border shadow flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{lang === 'EN' ? 'Property Entry System' : 'প্রপার্টি এন্ট্রি সিস্টেম'}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{lang === 'EN' ? 'Instantly give house rental advertisements on Abashon' : 'আবাসনে তাৎক্ষণিকভাবে ভাড়ার বিজ্ঞাপন দিন'}</p>
              </div>
            </div>

            <form onSubmit={handleOwnerAdSubmit} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].adTitle} *</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'EN' ? "e.g. Modern Full Duplex House with Lake View" : "উদাঃ লেক ভিউ সহ আধুনিক ডুপ্লেক্স বাড়ি"}
                  value={ownerAdTitle}
                  onChange={(e) => setOwnerAdTitle(e.target.value)}
                  className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].propertyType}</label>
                  <select
                    value={ownerAdType}
                    onChange={(e: any) => setOwnerAdType(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="House">{lang === 'EN' ? 'House' : 'বাড়ি'}</option>
                    <option value="Apartment">{lang === 'EN' ? 'Apartment' : 'ফ্ল্যাট / অ্যাপার্টমেন্ট'}</option>
                    <option value="Room">{lang === 'EN' ? 'Room' : 'রুম'}</option>
                    <option value="Office">{lang === 'EN' ? 'Office' : 'অফিস'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].rentPrice} *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={ownerAdPrice}
                    onChange={(e) => setOwnerAdPrice(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].selectRegion}</label>
                  <select
                    value={ownerAdRegion}
                    onChange={(e: any) => setOwnerAdRegion(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Dhanmondi">{lang === 'EN' ? 'Dhanmondi' : 'ধানমণ্ডি'}</option>
                    <option value="Bashundhara">{lang === 'EN' ? 'Bashundhara R/A' : 'বসুন্ধরা আবাসিক এলাকা'}</option>
                    <option value="Uttara">{lang === 'EN' ? 'Uttara' : 'উত্তরা'}</option>
                    <option value="Mirpur">{lang === 'EN' ? 'Mirpur' : 'মিরপুর'}</option>
                    <option value="Gulshan">{lang === 'EN' ? 'Gulshan' : 'গুলশান'}</option>
                    <option value="Banani">{lang === 'EN' ? 'Banani' : 'বনানী'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].sqftSize}</label>
                  <input
                    type="number"
                    placeholder="1200"
                    value={ownerAdSqft}
                    onChange={(e) => setOwnerAdSqft(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].bedCount}</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={ownerAdBeds}
                    onChange={(e) => setOwnerAdBeds(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].bathCount}</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={ownerAdBaths}
                    onChange={(e) => setOwnerAdBaths(e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].amenities}</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Wi-Fi', 'Security', 'AC', 'Parking', 'Gym', 'Rooftop', 'Elevator'].map(amenity => {
                    const isChosen = ownerAdAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleToggleAdAmenity(amenity)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-extrabold border transition ${
                          isChosen
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isChosen ? '✓ ' : ''}{amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">{TRANSLATIONS[lang].description}</label>
                <textarea
                  placeholder={lang === 'EN' ? "Write friendly information regarding bills, security, neighborhood guide, etc..." : "বিল, নিরাপত্তা, এলাকা সংক্রান্ত প্রয়োজনীয় তথ্য লিখুন..."}
                  rows={3}
                  value={ownerAdDesc}
                  onChange={(e) => setOwnerAdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow transition mt-1.5"
              >
                {TRANSLATIONS[lang].submitAd}
              </button>

            </form>
          </div>

        </div>

        {/* RIGHT SIDE: ACTIVE LANDLORD ADS & LIVE TENANT INQUIRY SIMULATION (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Listings Grid */}
          <div className={`p-5 rounded-3xl border shadow ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3">{TRANSLATIONS[lang].yourActiveListings}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.filter(p => p.host.name.includes('Sajjad') || p.host.name.includes('Owner')).map(prop => (
                <div key={prop.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col justify-between gap-3">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${prop.imageColor} rounded-xl flex items-center justify-center text-white text-xs font-black`}>
                      {prop.type.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black truncate text-slate-800 dark:text-slate-100 leading-tight">{prop.title}</h4>
                      <span className="text-[9px] text-slate-400 font-bold block">{prop.locationName}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <div>
                      <span className="text-blue-500 font-extrabold">৳{prop.price.toLocaleString()}</span>
                      <span className="text-[8px] text-slate-400">/{lang === 'EN' ? 'mo' : 'মাস'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {prop.isApproved ? (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400 px-2 py-0.5 rounded text-[8px] uppercase font-bold">{lang === 'EN' ? 'LIVE ON MAP' : 'ম্যাপে লাইভ আছে'}</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400 px-2 py-0.5 rounded text-[8px] uppercase font-bold">{lang === 'EN' ? 'PENDING AUDIT' : 'অনুমোদনের অপেক্ষায়'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Placeholder */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <PlusCircle className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-[10px] text-slate-400 font-bold">{lang === 'EN' ? 'Add another advertisement listing using the Entry Wizard.' : 'এন্ট্রি উইজার্ড ব্যবহার করে আরেকটি ভাড়ার বিজ্ঞাপন যোগ করুন।'}</span>
              </div>
            </div>
          </div>

          {/* Tenant Inquiry Chat Terminal simulation */}
          <div className={`p-5 rounded-3xl border shadow ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{lang === 'EN' ? 'Tenant Inquiry Live Chat Centre' : 'ভাড়াটিয়াদের সরাসরি চ্যাট কেন্দ্র'}</h3>
              <span className="bg-blue-100 text-blue-700 text-[9px] px-2.5 py-0.5 rounded-full font-bold">{lang === 'EN' ? 'Rafi Islam (Prospective Tenant)' : 'রাফি ইসলাম (সম্ভাব্য ভাড়াটিয়া)'}</span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl h-44 overflow-y-auto space-y-3 mb-3 text-xs font-semibold leading-relaxed">
              <div className="self-start text-left max-w-[80%] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <span className="block text-[8px] text-slate-400 font-bold">{lang === 'EN' ? 'Rafi Islam (Tenant) • 11:32 AM' : 'রাফি ইসলাম (ভাড়াটিয়া) • ১১:৩২ AM'}</span>
                {lang === 'EN' ? 'Is the monthly utility service bills included in the ৳25,000 monthly rent?' : '৳২৫,০০০ মাসিক ভাড়ার মধ্যে কি বিদ্যুৎ ও গ্যাস বিল অন্তর্ভুক্ত?'}
              </div>

              <div className="self-end text-right ml-auto max-w-[80%] bg-blue-600 text-white p-2.5 rounded-xl shadow">
                <span className="block text-[8px] text-blue-200 font-bold">{lang === 'EN' ? 'Me (Host) • 11:34 AM' : 'আমি (মালিক) • ১১:৩৪ AM'}</span>
                {lang === 'EN' ? 'Hello Rafi! No, gas and electricity bills are billed separately depending on usage, but high-speed Wi-Fi and security are included.' : 'হ্যালো রাফি! না, গ্যাস ও বিদ্যুৎ বিল আলাদাভাবে পরিশোধ করতে হবে, তবে ওয়াই-ফাই এবং সিকিউরিটি সার্ভিস অন্তর্ভুক্ত রয়েছে।'}
              </div>

              <div className="self-start text-left max-w-[80%] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <span className="block text-[8px] text-slate-400 font-bold">{lang === 'EN' ? 'Rafi Islam (Tenant) • Just Now' : 'রাফি ইসলাম (ভাড়াটিয়া) • এইমাত্র'}</span>
                {lang === 'EN' ? 'Awesome! That sounds very reasonable. Can I schedule a walkthrough visit tomorrow at 6 PM?' : 'দারুণ! অনেক ভালো প্রস্তাব। আমি কি আগামীকাল সন্ধ্যা ৬টায় বাড়িটি দেখতে আসতে পারি?'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert(lang === 'EN' ? 'Fast Response Simulated: "Yes, 6 PM tomorrow works perfectly!" sent to tenant Rafi.' : 'তাত্ক্ষণিক উত্তর সিমুলেটেড: "হ্যাঁ, আগামীকাল সন্ধ্যা ৬টায় ভিজিট করতে পারেন!" ভাড়াটিয়া রাফিকে পাঠানো হয়েছে।')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold rounded-xl shadow"
              >
                {lang === 'EN' ? 'Approve Visit (6 PM Tomorrow)' : 'ভিজিট অনুমোদন করুন (আগামীকাল সন্ধ্যা ৬টা)'}
              </button>
              <button
                onClick={() => alert(lang === 'EN' ? 'Fast Response Simulated: "Let me check availability and get back to you." sent.' : 'তাত্ক্ষণিক উত্তর সিমুলেটেড: "আমি একটু সময়সূচী দেখে জানাচ্ছি।" পাঠানো হয়েছে।')}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-xl"
              >
                {lang === 'EN' ? 'Ask to Reschedule' : 'সময় পরিবর্তনের অনুরোধ করুন'}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default OwnerPortal;
