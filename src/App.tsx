import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  Bed,
  Bath,
  Maximize2,
  Star,
  MessageSquare,
  Heart,
  X,
  Send,
  Check,
  ChevronRight,
  Compass,
  Sparkles,
  Home,
  PlusCircle,
  User,
  Phone,
  ArrowLeft,
  Bell,
  Map as MapIcon,
  Sun,
  Moon,
  Info,
  CheckSquare,
  Square,
  Settings,
  HelpCircle,
  DollarSign,
  Shield,
  Activity,
  FileText,
  BarChart3,
  Database,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Eye,
  Sliders,
  LayoutGrid,
  Plus
} from 'lucide-react';

import { AppUser, Property, ChatMessage, Language, SystemLog } from './types';
import { INITIAL_PROPERTIES, TRANSLATIONS, MOCK_USERS } from './constants';
import OwnerPortal from './components/OwnerPortal';
import CompanyPortal from './components/CompanyPortal';
import CustomerPortal from './components/CustomerPortal';

// Firebase Integrations
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc 
} from 'firebase/firestore';

export default function App() {
  // --- Portal Context Router State ---
  // 'customer' | 'owner' | 'company'
  const [activePortal, setActivePortal] = useState<'customer' | 'owner' | 'company'>('customer');

  // --- Authentication States ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<'customer' | 'owner' | 'company'>('customer');

  // --- Core States Shared across all Portals ---
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('abashon_properties');
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('abashon_saved_ids');
    return saved ? JSON.parse(saved) : ['prop-1', 'prop-3'];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('House'); // Tab selected
  const [rentLimit, setRentLimit] = useState<number>(60000);
  const [filterBeds, setFilterBeds] = useState<string>('Any');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Navigation Screens inside Smartphone Emulator (Customer view)
  // 'home' | 'search' | 'details' | 'saved' | 'messages' | 'chat' | 'profile' | 'add_property'
  const [activeScreen, setActiveScreen] = useState<string>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-1');
  const [activeChatHostId, setActiveChatHostId] = useState<string>('prop-1');

  // Map Radius Search state
  const [mapAnchor, setMapAnchor] = useState<{ x: number; y: number } | null>({ x: 220, y: 580 }); // Dhanmondi initially
  const [searchRadius, setSearchRadius] = useState<number>(3.5); // 1 unit = 100 pixels
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [mapCursor, setMapCursor] = useState<{ x: number; y: number } | null>(null);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // Language state: 'EN' (English) or 'BN' (Bangla)
  const [lang, setLang] = useState<'EN' | 'BN'>('EN');

  // Landlord/Owner Custom Ad Upload Form State
  const [ownerAdTitle, setOwnerAdTitle] = useState('');
  const [ownerAdPrice, setOwnerAdPrice] = useState('');
  const [ownerAdType, setOwnerAdType] = useState<'House' | 'Apartment' | 'Room' | 'Office'>('Apartment');
  const [ownerAdRegion, setOwnerAdRegion] = useState<'Dhanmondi' | 'Bashundhara' | 'Uttara' | 'Mirpur' | 'Gulshan' | 'Banani'>('Dhanmondi');
  const [ownerAdBeds, setOwnerAdBeds] = useState('3');
  const [ownerAdBaths, setOwnerAdBaths] = useState('2');
  const [ownerAdSqft, setOwnerAdSqft] = useState('1250');
  const [ownerAdDesc, setOwnerAdDesc] = useState('');
  const [ownerAdAmenities, setOwnerAdAmenities] = useState<string[]>(['Wi-Fi', 'Security']);
  
  // Message Thread Simulation States
  const [chats, setChats] = useState<{ [propId: string]: ChatMessage[] }>(() => {
    const saved = localStorage.getItem('abashon_chats');
    return saved ? JSON.parse(saved) : {
      'prop-1': [
        { sender: 'host', text: 'Hello Rafi! Is this property still available for viewing?', timestamp: '10:30 AM' },
        { sender: 'user', text: 'Yes, it is available. When would you like to visit?', timestamp: '10:32 AM' },
        { sender: 'host', text: 'I can come tomorrow evening around 6 PM.', timestamp: '10:33 AM' },
        { sender: 'user', text: 'Okay, 6 PM is perfect. I will wait for you near Dhanmondi Lake.', timestamp: '10:34 AM' },
        { sender: 'host', text: 'Great! See you then.', timestamp: '10:35 AM' }
      ],
      'prop-2': [
        { sender: 'host', text: 'Hello, regarding the luxury apartment in Bashundhara R/A, is parking safe?', timestamp: 'Yesterday' },
        { sender: 'user', text: 'Absolutely! We have 24/7 CCTV surveillance and basement guard gates.', timestamp: 'Yesterday' }
      ],
      'prop-3': [
        { sender: 'host', text: 'Hi Md. Shakib! I am interested in Sector 11 cozy room.', timestamp: '2 Days Ago' }
      ]
    };
  });
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Administrative / Company System Upload Console States
  const [adminSystemInput, setAdminSystemInput] = useState<string>(
    JSON.stringify([
      {
        "title": "Aesthetic Lakeside Condo",
        "price": 42000,
        "type": "Apartment",
        "region": "Banani",
        "beds": 3,
        "baths": 3,
        "sqft": 1700,
        "description": "Premium brand new condominium overlooking the scenic Banani lakeside. Equipped with dual elevators, standby generator, and private garden pavilion."
      }
    ], null, 2)
  );
  const [adminSuccessLog, setAdminSuccessLog] = useState<string>('');
  const [adminSelectedListingId, setAdminSelectedListingId] = useState<string>('prop-1');

  // Platform operational logs (Company Interface)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { id: '1', time: '11:24:05', level: 'INFO', message: 'Abason engine successfully loaded initial properties catalog' },
    { id: '2', time: '11:25:12', level: 'INFO', message: 'Geological map service generated geohash clusters for Dhaka Metropolitan Area' },
    { id: '3', time: '11:30:15', level: 'SUCCESS', message: 'Gemini 3.5 Flash chat model successfully bound server-side' }
  ]);

  // Global system rules (Company Interface)
  const [globalPlatformFee, setGlobalPlatformFee] = useState<number>(5); // Percentage
  const [platformRegistrationStatus, setPlatformRegistrationStatus] = useState<boolean>(true);
  const [autoApproveLandlordAds, setAutoApproveLandlordAds] = useState<boolean>(false);

  // Authentication States
  const [users, setUsers] = useState<AppUser[]>(() => {
    const savedUsers = localStorage.getItem('abashon_users');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        console.error("Failed to parse saved users", e);
        return MOCK_USERS;
      }
    }
    return MOCK_USERS;
  });

  // --- Firebase Seeding and Sync Operations ---
  const seedProperties = async (propsList: Property[]) => {
    try {
      logSystemAction("Seeding default listings to Firestore properties collection...", "INFO");
      for (const p of propsList) {
        await setDoc(doc(db, 'properties', p.id), p);
      }
      logSystemAction("Properties database seeding completed successfully!", "SUCCESS");
    } catch (err) {
      console.error("Failed to seed properties:", err);
    }
  };

  // 1. Sync Authentication Session with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setCurrentUser(userData);
            setIsLoggedIn(true);
            setActivePortal(userData.role);
            logSystemAction(`Firebase session restored: ${userData.name} (${userData.role})`, 'SUCCESS');
          } else {
            const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
            const email = fbUser.email || '';
            const newUser: AppUser = {
              id: fbUser.uid,
              name: name,
              email: email,
              role: 'customer',
              avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
            setIsLoggedIn(true);
            setActivePortal('customer');
            logSystemAction(`Firebase profile created: ${name}`, 'SUCCESS');
          }
        } catch (error) {
          console.error("Error restoring Firebase user profile:", error);
        }
      } else {
        // No user authenticated
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Properties Catalog Sync
  useEffect(() => {
    const q = query(collection(db, 'properties'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const props: Property[] = [];
        snapshot.forEach((doc) => {
          props.push({ id: doc.id, ...doc.data() } as Property);
        });
        setProperties(props);
      } else {
        // Seed if user gets logged in
        if (auth.currentUser) {
          seedProperties(INITIAL_PROPERTIES);
        }
      }
    }, (error) => {
      console.warn("Firestore properties snapshot fallback in effect:", error);
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

  // 3. Real-time Chat Thread Messages Sync
  useEffect(() => {
    if (!activeChatHostId) return;
    const chatDocRef = doc(db, 'chats', activeChatHostId);
    const messagesQuery = query(collection(chatDocRef, 'messages'));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          sender: data.senderRole === 'customer' ? 'user' : 'host',
          text: data.text,
          timestamp: data.timestamp
        });
      });
      if (msgs.length > 0) {
        setChats(prev => ({
          ...prev,
          [activeChatHostId]: msgs
        }));
      }
    }, (error) => {
      console.warn("Messages snapshot fallback in effect:", error);
    });
    return () => unsubscribe();
  }, [activeChatHostId]);

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem('abashon_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('abashon_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('abashon_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('abashon_saved_ids', JSON.stringify(savedIds));
  }, [savedIds]);

  // Android APK Compiler Simulation States
  const [androidBuildLogs, setAndroidBuildLogs] = useState<string[]>([]);
  const [androidBuildStatus, setAndroidBuildStatus] = useState<'idle' | 'building' | 'success' | 'failed'>('idle');
  const [androidBuildProgress, setAndroidBuildProgress] = useState<number>(0);

  const handleRunAndroidSimulation = () => {
    if (androidBuildStatus === 'building') return;
    setAndroidBuildStatus('building');
    setAndroidBuildProgress(5);
    setAndroidBuildLogs(['[Initialization] Initializing Android Gradle build sequence...']);
    logSystemAction('Triggered Simulated Android APK compilation sequence', 'INFO');

    const steps = [
      { prg: 15, log: '[Capacitor SDK] Validating config file "capacitor.config.ts" ...' },
      { prg: 25, log: '[Capacitor SDK] App ID detected: "com.abashon.app", App Name: "Abashon", Web Directory: "dist"' },
      { prg: 35, log: '[Vite Compiler] Executing production bundle creation: "npm run build" ...' },
      { prg: 50, log: '[Vite Compiler] Web bundle completed: dist/ folder created with 18 assets.' },
      { prg: 65, log: '[Capacitor CLI] Copying and synchronizing web assets to android platform: "npx cap sync"' },
      { prg: 75, log: '[Capacitor CLI] Sync success! Android asset folder updated with web index.html' },
      { prg: 82, log: '[Gradle Toolchain] Starting Android Gradle compilation daemon ...' },
      { prg: 88, log: '[Gradle Toolchain] Executing task ":app:compileDebugJavaWithJavac" ...' },
      { prg: 93, log: '[Gradle Toolchain] Executing task ":app:assembleDebug" ...' },
      { prg: 100, log: '[Android Build] BUILD SUCCESSFUL! APK generated: android/app/build/outputs/apk/debug/app-debug.apk (3.82 MB)' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAndroidBuildProgress(step.prg);
        setAndroidBuildLogs(prev => [...prev, step.log]);
        if (step.prg === 100) {
          setAndroidBuildStatus('success');
          logSystemAction('Simulated Android APK compiled successfully: app-debug.apk', 'SUCCESS');
        }
      }, (index + 1) * 850);
    });
  };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Helper to add system logs
  const logSystemAction = (message: string, level: 'SUCCESS' | 'INFO' | 'WARN' | 'ERROR' = 'INFO') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: SystemLog = { 
      id: Date.now().toString(), 
      time: timeStr, 
      level, 
      message 
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 15)]);
  };

  // Distance computation (SVG coordinate pixels to miles multiplier)
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 100;
  };

  // Filter properties logic (Tenant/Customer Discovery view)
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Must be approved by administrative company system (unless viewing in owner/company workspace)
      if (!prop.isApproved) return false;

      // Text search
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchTitle = prop.title.toLowerCase().includes(queryLower);
        const matchDesc = prop.description.toLowerCase().includes(queryLower);
        const matchLocation = prop.locationName.toLowerCase().includes(queryLower);
        if (!matchTitle && !matchDesc && !matchLocation) return false;
      }

      // Property structural type tab
      if (selectedType !== 'All' && prop.type !== selectedType) {
        return false;
      }

      // Neighborhood Region filter
      if (selectedLocation !== 'All' && prop.region !== selectedLocation) {
        return false;
      }

      // Rent Cap Limit
      if (prop.price > rentLimit) {
        return false;
      }

      // Bedrooms
      if (filterBeds !== 'Any') {
        const bedsNum = parseInt(filterBeds);
        if (prop.beds < bedsNum) return false;
      }

      // Amenities check
      for (const amenity of selectedAmenities) {
        if (!prop.amenities.includes(amenity)) return false;
      }

      // Radius boundary
      if (mapAnchor) {
        const dist = calculateDistance(mapAnchor.x, mapAnchor.y, prop.x, prop.y);
        if (dist > searchRadius) return false;
      }

      return true;
    });
  }, [properties, searchQuery, selectedType, selectedLocation, rentLimit, filterBeds, selectedAmenities, mapAnchor, searchRadius]);

  const activeProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId) || properties[0];
  }, [properties, selectedPropertyId]);

  // Handle Map Interaction Clicks
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    setMapAnchor({ x: Math.round(clickX), y: Math.round(clickY) });
    logSystemAction(`Radius anchor relocated to map position (${Math.round(clickX)}, ${Math.round(clickY)})`, 'INFO');
  };

  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = ((e.clientX - rect.left) / rect.width) * 1000;
    const cursorY = ((e.clientY - rect.top) / rect.height) * 1000;
    setMapCursor({ x: Math.round(cursorX), y: Math.round(cursorY) });
  };

  // Bookmark toggler
  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      logSystemAction(`Renter ${exists ? 'removed' : 'bookmarked'} property listing ${id}`, 'INFO');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  // Launch Chat Message
  const handleInquire = (propId: string) => {
    setActiveChatHostId(propId);
    setActiveScreen('chat');
    logSystemAction(`Renter opened message inquiry session on property ${propId}`, 'INFO');
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    const email = loginEmail.includes('@') ? loginEmail : `${loginEmail.toLowerCase()}@abashon.com`;
    
    try {
      logSystemAction(`Authenticating via Firebase: ${email}`, 'INFO');
      const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser;
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setActivePortal(userData.role);
        logSystemAction(`User logged in: ${userData.name} (${userData.role})`, 'SUCCESS');
      } else {
        const name = user.displayName || loginEmail.split('@')[0];
        const newUser: AppUser = {
          id: user.uid,
          name: name,
          email: user.email || email,
          role: 'customer',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        setCurrentUser(newUser);
        setIsLoggedIn(true);
        setActivePortal('customer');
        logSystemAction(`Logged in and profile initialized: ${name}`, 'SUCCESS');
      }
    } catch (error: any) {
      console.warn("Firebase sign-in failed, checking mock credentials:", error);
      const user = users.find(u => 
        (u.email === loginEmail || u.phone === loginEmail || (u.name.toLowerCase() === loginEmail.toLowerCase() && u.role === 'company')) && 
        (u.password === loginPassword)
      );
      
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setActivePortal(user.role);
        logSystemAction(`Mock session authorized: ${user.name} (${user.role})`, 'SUCCESS');
      } else {
        alert(lang === 'EN' ? `Authentication Error: ${error.message}` : `লগইন ত্রুটি: ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regName && regEmail && regPassword && regPhone) {
      setIsLoggingIn(true);
      const email = regEmail.includes('@') ? regEmail : `${regEmail.toLowerCase()}@abashon.com`;
      try {
        logSystemAction(`Registering via Firebase: ${email}`, 'INFO');
        const userCredential = await createUserWithEmailAndPassword(auth, email, regPassword);
        const fbUser = userCredential.user;
        
        const newUser: AppUser = {
          id: fbUser.uid,
          name: regName,
          email: email,
          phone: regPhone,
          role: regRole,
          avatar: regName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        };
        
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setIsLoggedIn(true);
        setActivePortal(regRole);
        logSystemAction(`Account registered and synced to Firestore: ${regName}`, 'SUCCESS');
        alert(`Account created successfully as ${regRole}!`);
      } catch (error: any) {
        console.warn("Firebase sign-up failed, fallback to mock registration:", error);
        const newUser: AppUser = {
          id: `u${users.length + 1}`,
          name: regName,
          email: regEmail,
          phone: regPhone,
          role: regRole,
          avatar: regName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          password: regPassword
        };
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
        setIsLoggedIn(true);
        setActivePortal(regRole);
        logSystemAction(`Mock account registered locally: ${regName}`, 'SUCCESS');
        alert(`Mock account created successfully! (${error.message})`);
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      alert('Please fill in all registration fields, including mobile number.');
    }
  };

  const updateUserRole = (userId: string, newRole: 'customer' | 'owner' | 'company') => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logSystemAction(`Admin updated role for user ${userId} to ${newRole}`, 'WARN');
    
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, role: newRole });
      setActivePortal(newRole);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail) {
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        setResetSent(true);
        logSystemAction(`Password reset email sent via Firebase to: ${resetEmail}`, 'SUCCESS');
      } catch (error: any) {
        console.warn("Firebase password reset failed, simulating fallback:", error);
        setResetSent(true);
        logSystemAction(`Simulated password reset email sent to: ${resetEmail}`, 'INFO');
      }
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    }
  };

  // Submit advertisement from Owner / Client interface
  const handleOwnerAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAdTitle || !ownerAdPrice) {
      alert('Please fill out the Advertisement Title and Rent Price!');
      return;
    }

    // Assign coordinate anchor depending on the selected neighborhood
    let px = 500;
    let py = 500;
    if (ownerAdRegion === 'Dhanmondi') { px = 220; py = 580; }
    else if (ownerAdRegion === 'Bashundhara') { px = 680; py = 380; }
    else if (ownerAdRegion === 'Uttara') { px = 480; py = 160; }
    else if (ownerAdRegion === 'Mirpur') { px = 180; py = 320; }
    else if (ownerAdRegion === 'Gulshan') { px = 750; py = 620; }
    else if (ownerAdRegion === 'Banani') { px = 520; py = 740; }

    // Offset coordinates slightly to avoid overlaying on same pins
    px += Math.floor(Math.random() * 90) - 45;
    py += Math.floor(Math.random() * 90) - 45;

    const gradients = [
      'from-emerald-500 via-teal-600 to-cyan-700',
      'from-fuchsia-600 via-pink-700 to-rose-900',
      'from-sky-500 via-blue-600 to-indigo-700',
      'from-amber-500 via-orange-600 to-red-700'
    ];
    const chosenColor = gradients[properties.length % gradients.length];

    const propId = `prop-${Date.now()}`;
    const newAd: Property = {
      id: propId,
      title: ownerAdTitle,
      price: parseInt(ownerAdPrice),
      type: ownerAdType,
      beds: parseInt(ownerAdBeds) || 1,
      baths: parseInt(ownerAdBaths) || 1,
      sqft: parseInt(ownerAdSqft) || 1000,
      locationName: `${ownerAdRegion}, Dhaka`,
      region: ownerAdRegion,
      rating: 5.0,
      reviewsCount: 1,
      description: ownerAdDesc || 'Elegant and beautiful modern Dhaka rental listing offering excellent spacious floorplans and dynamic premium ventilation.',
      imageColor: chosenColor,
      x: px,
      y: py,
      amenities: ownerAdAmenities.length > 0 ? ownerAdAmenities : ['Wi-Fi', 'AC', 'Security'],
      host: {
        name: currentUser?.name || 'Sajjad Godrej (Owner)',
        avatar: currentUser?.avatar || 'SG',
        responseRate: '100%',
        responseTime: 'Instant'
      },
      isApproved: autoApproveLandlordAds, // Depends on global admin settings toggles
      isFeatured: false
    };

    try {
      await setDoc(doc(db, 'properties', propId), newAd);
      logSystemAction(`Owner list advertisement successfully posted to Firestore: "${ownerAdTitle}"`, 'SUCCESS');
    } catch (error) {
      console.warn("Firestore property listing write failed, writing locally:", error);
      setProperties(prev => [newAd, ...prev]);
      logSystemAction(`Owner listed new advertisement locally: "${ownerAdTitle}"`, 'SUCCESS');
    }

    // Clear form fields
    setOwnerAdTitle('');
    setOwnerAdPrice('');
    setOwnerAdDesc('');
    
    alert(`Success! Your advertisement "${ownerAdTitle}" has been posted. ${newAd.isApproved ? 'It is instantly live on the discovery map!' : 'Our corporate system admin will audit and approve it shortly.'}`);
  };

  // Toggle Owner Ad Amenity Choice
  const handleToggleAdAmenity = (amenity: string) => {
    setOwnerAdAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Administrative Upload System Entry Submit
  const handleAdminSystemImport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(adminSystemInput);
      if (!Array.isArray(parsed)) {
        throw new Error('Input data must be a valid JSON Array of objects.');
      }

      let importCount = 0;
      const importedProps: Property[] = parsed.map((item: any, idx: number) => {
        if (!item.title || !item.price) {
          throw new Error(`Item ${idx} must contain at least 'title' and 'price' variables.`);
        }

        const regionName = item.region || 'Dhanmondi';
        let rx = 350;
        let ry = 350;
        if (regionName === 'Dhanmondi') { rx = 220; ry = 580; }
        else if (regionName === 'Bashundhara') { rx = 680; ry = 380; }
        else if (regionName === 'Uttara') { rx = 480; ry = 160; }
        else if (regionName === 'Mirpur') { rx = 180; ry = 320; }
        else if (regionName === 'Gulshan') { rx = 750; ry = 620; }
        else if (regionName === 'Banani') { rx = 520; ry = 740; }

        rx += Math.floor(Math.random() * 100) - 50;
        ry += Math.floor(Math.random() * 100) - 50;

        importCount++;
        return {
          id: `prop-sys-${Date.now()}-${idx}`,
          title: item.title,
          price: Number(item.price),
          type: item.type || 'Apartment',
          beds: Number(item.beds) || 2,
          baths: Number(item.baths) || 2,
          sqft: Number(item.sqft) || 1200,
          locationName: `${regionName}, Dhaka`,
          region: regionName,
          rating: 4.8,
          reviewsCount: 12,
          description: item.description || 'System entered administrative corporate property standard structure.',
          imageColor: 'from-blue-600 via-purple-700 to-indigo-800',
          x: rx,
          y: ry,
          amenities: item.amenities || ['Wi-Fi', 'Security', 'AC'],
          host: {
            name: 'Company Admin Pool',
            avatar: 'CAP',
            responseRate: '100%',
            responseTime: 'Within 2 mins'
          },
          isApproved: true,
          isFeatured: true
        };
      });

      setProperties(prev => [...importedProps, ...prev]);
      setAdminSuccessLog(`Successfully processed and uploaded ${importCount} system properties to active catalog.`);
      logSystemAction(`Admin bulk upload system import successfully entry-loaded ${importCount} listings.`, 'SUCCESS');
      
      setTimeout(() => {
        setAdminSuccessLog('');
      }, 5000);

    } catch (err: any) {
      alert(`Invalid data format: ${err.message}`);
    }
  };

  // Administrator Bulk Auto Generator
  const handleAutoGenerateSystemData = () => {
    const samples = [
      {
        title: "Boutique Duplex Sky-Loft",
        price: 52000,
        type: "Apartment",
        region: "Gulshan",
        beds: 4,
        baths: 4,
        sqft: 2200,
        description: "Elegant bespoke architectural design located in Sector 3 of Gulshan. Comes with professional housekeeping access, double height high glazing windows, and modern security."
      },
      {
        title: "Penthouse Overlook Room",
        price: 15000,
        type: "Room",
        region: "Dhanmondi",
        beds: 1,
        baths: 1,
        sqft: 320,
        description: "Lush private studio room suited perfectly for graduate scholars. Scenic lake view veranda attached with fast utilities access."
      },
      {
        title: "Commercial Headquarter Center",
        price: 95000,
        type: "Office",
        region: "Banani",
        beds: 0,
        baths: 3,
        sqft: 3400,
        description: "Prime floor space designed for startups or mid-sized agencies. Standard high energy layout configurations, optical fiber networks, and emergency air handling loops."
      }
    ];
    setAdminSystemInput(JSON.stringify(samples, null, 2));
    logSystemAction("Generated new layout sample JSON into entry system input field", "INFO");
  };

  // Sending Chat message with Gemini Server Call and Firestore Synchronization
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userText = typedMessage.trim();
    const chatProp = properties.find((p) => p.id === activeChatHostId) || properties[0];

    // Add user message locally as immediate feedback
    const userMsgObj: ChatMessage = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => ({
      ...prev,
      [chatProp.id]: [...(prev[chatProp.id] || []), userMsgObj]
    }));

    setTypedMessage('');
    setIsTyping(true);
    logSystemAction(`Message sent to host ${chatProp.host.name} on thread ${chatProp.id}`, 'INFO');

    // Attempt Firebase write
    try {
      const chatDocRef = doc(db, 'chats', chatProp.id);
      await setDoc(chatDocRef, {
        id: chatProp.id,
        propertyId: chatProp.id,
        propertyTitle: chatProp.title,
        tenantId: currentUser?.id || 'guest',
        tenantName: currentUser?.name || 'Guest User',
        landlordId: chatProp.host.name.replace(/\s+/g, '_'),
        landlordName: chatProp.host.name,
        lastMessageText: userText,
        lastMessageTimestamp: new Date().toISOString()
      }, { merge: true });

      const userMsgId = `msg-${Date.now()}`;
      await setDoc(doc(collection(chatDocRef, 'messages'), userMsgId), {
        id: userMsgId,
        senderId: currentUser?.id || 'guest',
        senderRole: currentUser?.role || 'customer',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      logSystemAction(`Message synchronized to Firestore thread ${chatProp.id}`, 'INFO');
    } catch (e) {
      console.warn("Firestore message save failed, relying on local chat fallback:", e);
    }

    try {
      const response = await fetch('/api/chat-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          hostName: chatProp.host.name,
          propertyTitle: chatProp.title,
          propertyDetails: `Type: ${chatProp.type}, Price: ৳${chatProp.price}, Rooms: ${chatProp.beds} beds, Location: ${chatProp.locationName}. Features: ${chatProp.description}`,
          chatHistory: chats[chatProp.id] || []
        })
      });

      const data = await response.json();
      const replyText = data.reply || `Hello there! I'd be absolutely thrilled to offer you a quick viewing session. What days usually suit your calendar?`;
      
      setTimeout(async () => {
        try {
          const chatDocRef = doc(db, 'chats', chatProp.id);
          const hostMsgId = `msg-reply-${Date.now()}`;
          await setDoc(doc(collection(chatDocRef, 'messages'), hostMsgId), {
            id: hostMsgId,
            senderId: chatProp.host.name.replace(/\s+/g, '_'),
            senderRole: 'owner',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          logSystemAction(`Gemini reply synchronized to Firestore thread ${chatProp.id}`, 'SUCCESS');
        } catch (e) {
          console.warn("Firestore host reply write failed, using local fallback state.");
          const hostMsgObj: ChatMessage = {
            sender: 'host',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChats(prev => ({
            ...prev,
            [chatProp.id]: [...(prev[chatProp.id] || []), hostMsgObj]
          }));
        }
        setIsTyping(false);
      }, 800);

    } catch (err) {
      console.error('Error during live Express Gemini proxy query:', err);
      // Fallback
      const replyText = `Hi! Thank you for inquiring about "${chatProp.title}". Yes, it is fully available and we are looking forward to showing you the area this weekend.`;
      setTimeout(async () => {
        try {
          const chatDocRef = doc(db, 'chats', chatProp.id);
          const hostMsgId = `msg-reply-${Date.now()}`;
          await setDoc(doc(collection(chatDocRef, 'messages'), hostMsgId), {
            id: hostMsgId,
            senderId: chatProp.host.name.replace(/\s+/g, '_'),
            senderRole: 'owner',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } catch (e) {
          const hostMsgObj: ChatMessage = {
            sender: 'host',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChats(prev => ({
            ...prev,
            [chatProp.id]: [...(prev[chatProp.id] || []), hostMsgObj]
          }));
        }
        setIsTyping(false);
      }, 1000);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} id="abason_portal_main_root">
      
      {!isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 w-full">
          <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-8 animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-24 relative">
                <img src="/logo.jpg" alt="Abashon Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                  {lang === 'EN' ? 'Welcome Back' : 'স্বাগতম'}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {lang === 'EN' ? 'Login to your Abashon Account' : 'আপনার আবাসন অ্যাকাউন্টে লগইন করুন'}
                </p>
              </div>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                    {lang === 'EN' ? 'Username or Mobile Number' : 'ইউজার নেম বা মোবাইল নম্বর'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={lang === 'EN' ? "admin or 017..." : "এডমিন অথবা মোবাইল নম্বর"}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Password' : 'পাসওয়ার্ড'}</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/10 flex items-center justify-center cursor-pointer">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{lang === 'EN' ? 'Remember me' : 'আমাকে মনে রাখুন'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[10px] font-black text-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    {lang === 'EN' ? 'Forgot Password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoggingIn 
                    ? (lang === 'EN' ? 'Authenticating...' : 'যাচাই করা হচ্ছে...') 
                    : (lang === 'EN' ? 'Sign In to Abashon' : 'লগইন করুন')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Full Name' : 'পুরো নাম'}</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Sajjad Islam"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Username' : 'ইউজার নেম'}</label>
                  <input
                    type="text"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sajjad_admin"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Mobile Number (Authentication)' : 'মোবাইল নম্বর (অথেন্টিকেশন)'}</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Account Role' : 'অ্যাকাউন্টের ভূমিকা'}</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="customer">{lang === 'EN' ? 'Customer (Looking to Rent)' : 'গ্রাহক (ভাড়া খুঁজছেন)'}</option>
                    <option value="owner">{lang === 'EN' ? 'Property Owner (Owner)' : 'প্রপার্টি মালিক'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">{lang === 'EN' ? 'Password' : 'পাসওয়ার্ড'}</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {lang === 'EN' ? 'Create Account' : 'অ্যাকাউন্ট তৈরি করুন'}
                </button>
              </form>
            )}

            <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
              {authMode === 'login' ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'EN' ? "Don't have an account?" : 'অ্যাকাউন্ট নেই?'} <span onClick={() => setAuthMode('register')} className="text-emerald-500 cursor-pointer hover:underline">{lang === 'EN' ? 'Create Account' : 'নতুন তৈরি করুন'}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'EN' ? 'Already have an account?' : 'আগেই অ্যাকাউন্ট আছে?'} <span onClick={() => setAuthMode('login')} className="text-emerald-500 cursor-pointer hover:underline">{lang === 'EN' ? 'Sign In Instead' : 'লগইন করুন'}</span>
                </p>
              )}
            </div>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
              <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                    {lang === 'EN' ? 'Reset Password' : 'পাসওয়ার্ড রিসেট'}
                  </h3>
                  <button onClick={() => setShowForgotPassword(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {resetSent ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase">{lang === 'EN' ? 'Email Sent!' : 'ইমেল পাঠানো হয়েছে!'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {lang === 'EN' ? 'Check your inbox for reset instructions.' : 'নির্দেশনার জন্য আপনার ইনবক্স চেক করুন।'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {lang === 'EN' ? 'Enter your registered email address and we will send you a link to reset your password.' : 'আপনার রেজিস্টার্ড ইমেল ঠিকানা দিন এবং আমরা আপনাকে পাসওয়ার্ড রিসেট করার একটি লিঙ্ক পাঠাবো।'}
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase block ml-1">{lang === 'EN' ? 'Registered Email' : 'রেজিস্টার্ড ইমেল'}</label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all"
                    >
                      {lang === 'EN' ? 'Send Reset Link' : 'লিঙ্ক পাঠান'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col w-full h-full">
          {/* ================= GLOBAL PORTAL SWITCHER & HERO BAR ================= */}
          <header className={`border-b sticky top-0 z-50 px-6 py-4 backdrop-blur-md transition-colors ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Logo Brand Frame */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-12 relative flex items-center justify-center">
                  <img 
                    src="/logo.jpg" 
                    alt="Abashon Logo" 
                    className="w-full h-full object-contain filter drop-shadow-md brightness-110 contrast-110 transition-all hover:scale-105" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-emerald-500">{TRANSLATIONS[lang].appName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full dark:bg-slate-800 dark:text-emerald-400 border border-emerald-100 dark:border-slate-700">{TRANSLATIONS[lang].motto}</span>
                  </div>
            </div>
          </div>

          {/* Portal Switcher moved to Bottom Nav */}

          {/* Actions & Theme Toggles */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn && currentUser && (
              <div className="flex items-center gap-2 mr-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black leading-none">{currentUser.name}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{currentUser.role}</span>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } catch (error) {
                      console.warn("Firebase sign out failed:", error);
                    }
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                    setAuthMode('login');
                    setLoginEmail('');
                    setLoginPassword('');
                    logSystemAction('User logged out', 'INFO');
                  }}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition"
                  title="Logout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-emerald-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-750'}`}
              title="Toggle Language / ভাষা পরিবর্তন"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'EN' ? 'বাংলা' : 'English'}</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              title="Toggle Application Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* ================= WORKSPACE PORTAL OUTLET ================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 mb-20" id="portal_outlet_space">
        <AnimatePresence mode="wait">
          {/* ======================================================= */}
          {/* 1. CUSTOMER PORTAL (TENANT MAP DISCOVERY & APP SIMULATION) */}
          {/* ======================================================= */}
          {activePortal === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CustomerPortal
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                lang={lang}
                darkMode={darkMode}
                properties={properties}
                filteredProperties={filteredProperties}
                mapCursor={mapCursor}
                mapAnchor={mapAnchor}
                setMapAnchor={setMapAnchor}
                searchRadius={searchRadius}
                setSearchRadius={setSearchRadius}
                hoveredPropertyId={hoveredPropertyId}
                setHoveredPropertyId={setHoveredPropertyId}
                selectedPropertyId={selectedPropertyId}
                setSelectedPropertyId={setSelectedPropertyId}
                activeScreen={activeScreen}
                setActiveScreen={setActiveScreen}
                logSystemAction={logSystemAction}
                svgRef={svgRef}
                handleMapClick={handleMapClick}
                handleMapMouseMove={handleMapMouseMove}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* 2. OWNER / CLIENT PORTAL (PROPERTY UPLOADER & ADVERTISING) */}
          {/* ======================================================= */}
          {activePortal === 'owner' && (
            <motion.div
              key="owner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OwnerPortal
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                lang={lang}
                darkMode={darkMode}
                properties={properties}
                ownerAdTitle={ownerAdTitle}
                setOwnerAdTitle={setOwnerAdTitle}
                ownerAdPrice={ownerAdPrice}
                setOwnerAdPrice={setOwnerAdPrice}
                ownerAdType={ownerAdType}
                setOwnerAdType={setOwnerAdType}
                ownerAdRegion={ownerAdRegion}
                setOwnerAdRegion={setOwnerAdRegion}
                ownerAdSqft={ownerAdSqft}
                setOwnerAdSqft={setOwnerAdSqft}
                ownerAdBeds={ownerAdBeds}
                setOwnerAdBeds={setOwnerAdBeds}
                ownerAdBaths={ownerAdBaths}
                setOwnerAdBaths={setOwnerAdBaths}
                ownerAdAmenities={ownerAdAmenities}
                handleToggleAdAmenity={handleToggleAdAmenity}
                ownerAdDesc={ownerAdDesc}
                setOwnerAdDesc={setOwnerAdDesc}
                handleOwnerAdSubmit={handleOwnerAdSubmit}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* 3. COMPANY WORKSPACE (CORPORATE ADMINISTRATIVE PANEL) */}
          {/* ======================================================= */}
          {activePortal === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CompanyPortal
                lang={lang}
                darkMode={darkMode}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                properties={properties}
                setProperties={setProperties}
                users={users}
                setUsers={setUsers}
                systemLogs={systemLogs}
                logSystemAction={logSystemAction}
                globalPlatformFee={globalPlatformFee}
                setGlobalPlatformFee={setGlobalPlatformFee}
                autoApproveLandlordAds={autoApproveLandlordAds}
                setAutoApproveLandlordAds={setAutoApproveLandlordAds}
                adminSystemInput={adminSystemInput}
                setAdminSystemInput={setAdminSystemInput}
                adminSuccessLog={adminSuccessLog}
                setAdminSuccessLog={setAdminSuccessLog}
                handleAdminSystemImport={handleAdminSystemImport}
                handleAutoGenerateSystemData={handleAutoGenerateSystemData}
                androidBuildStatus={androidBuildStatus}
                androidBuildProgress={androidBuildProgress}
                androidBuildLogs={androidBuildLogs}
                handleRunAndroidSimulation={handleRunAndroidSimulation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* ================= FIXED BOTTOM NAVIGATION MENU (PORTAL SWITCHER) ================= */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl transition-all duration-300 pb-safe ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`} id="abason_bottom_nav">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Customer Tab */}
          <button
            onClick={() => { setActivePortal('customer'); logSystemAction('Navigated to Customer Search Portal', 'INFO'); }}
            className={`flex flex-col items-center gap-1 group relative transition-all ${
              activePortal === 'customer' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activePortal === 'customer' ? 'bg-emerald-500/10 scale-110' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
              <Compass className={`w-5 h-5 ${activePortal === 'customer' ? 'animate-pulse' : ''}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{lang === 'EN' ? 'Search' : 'খুঁজুন'}</span>
            {activePortal === 'customer' && <div className="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
          </button>

          {/* Owner Tab */}
          <button
            onClick={() => { setActivePortal('owner'); logSystemAction('Navigated to Owner Ad Management', 'INFO'); }}
            className={`flex flex-col items-center gap-1 group relative transition-all ${
              activePortal === 'owner' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activePortal === 'owner' ? 'bg-emerald-500/10 scale-110' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
              <PlusCircle className={`w-5 h-5 ${activePortal === 'owner' ? 'rotate-90 transition-transform' : ''}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{lang === 'EN' ? 'Post Ads' : 'বিজ্ঞাপন'}</span>
            {activePortal === 'owner' && <div className="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
          </button>

          {/* Company Tab (Admin) - Only visible to Company Admin */}
          {isLoggedIn && currentUser?.role === 'company' && (
            <button
              onClick={() => { setActivePortal('company'); logSystemAction('Navigated to Company Admin Workspace', 'INFO'); }}
              className={`flex flex-col items-center gap-1 group relative transition-all ${
                activePortal === 'company' ? 'text-purple-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${activePortal === 'company' ? 'bg-purple-500/10 scale-110' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                <Database className={`w-5 h-5 ${activePortal === 'company' ? 'animate-bounce' : ''}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{lang === 'EN' ? 'Admin' : 'অ্যাডমিন'}</span>
              {activePortal === 'company' && <div className="absolute -top-1 w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
            </button>
          )}

          {/* Settings/Profile Tab (Simulated Page) */}
          <button
            onClick={() => { setActiveScreen('profile'); setActivePortal('customer'); logSystemAction('Navigated to Profile Settings', 'INFO'); }}
            className={`flex flex-col items-center gap-1 group relative transition-all ${
              activeScreen === 'profile' && activePortal === 'customer' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeScreen === 'profile' ? 'bg-emerald-500/10 scale-110' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{lang === 'EN' ? 'Settings' : 'সেটিংস'}</span>
          </button>

        </div>
      </nav>

      {/* ================= COMPLEMENTARY ARCHITECTURAL METADATA PANEL ================= */}
      <footer className={`border-t py-8 px-6 mt-12 mb-20 transition-colors ${
        darkMode ? 'bg-slate-950 border-slate-900 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">NoSQL Firestore Schema Blueprint</h4>
            <p className="leading-relaxed text-slate-500">
              The database structure outlines fully standardized collections: <code>/users</code> profiles, <code>/properties</code> coordinates with 8-character calculated geohashes, and <code>/chats</code> subcollections. Check <strong>FIRESTORE_SCHEMA.md</strong> in the workspace.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Server-Side Gemini AI Client</h4>
            <p className="leading-relaxed text-slate-500 font-medium">
              Landlord characters respond utilizing the modern <code>@google/genai</code> SDK on the server-side. Prompts are constructed dynamically with conversation context and structural property parameters.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Platform Roles Definition</h4>
            <p className="leading-relaxed text-slate-550">
              Aetheria/Abason separates workflows beautifully across seekers, owners, and administrative system managers, creating a comprehensive dynamic property discovery environment.
            </p>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-900/65 mt-6 pt-4 text-center text-[10px] font-semibold text-slate-400">
          Abason Premium House Discovery Platform • Powered by Express Gemini Proxy & SVG Geological Map Engine
        </div>
      </footer>

    </div>
  )}
</div>
);
}
