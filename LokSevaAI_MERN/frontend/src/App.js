import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import Profile from "./Pages/Profile";
import VapiChatAssistant from './components/VapiChatAssistant';
import MSPTracker from './components/MSPTracker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, ShieldX, Activity, Settings, Type, CheckCircle, UploadCloud, FileText, Sun, Moon, MessageCircle, Smartphone, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

// Language Dictionary for Dynamic Translation
const DICTIONARY = {
  'English': {
    title: "Find Your Government Benefit",
    subtitle: "Discover schemes you're entitled to — in your language, instantly.",
    tab_browse: "Browse Schemes",
    tab_ai: "AI Assistant + Voice",
    tab_fraud: "Fraud Heatmap",
    tab_pdf: "PDF Wizard",
    tab_location: "Nearby Offices",
    active_schemes: "Active Schemes",
    categories: "Categories",
    languages: "Languages",
    fraud_protection: "Fraud Protection",
    apply_now: "Apply Now",
    eligibility_score: "Your Eligibility Score",
    sync_live: "Sync Live Schemes",
    my_profile: "MY PROFILE",
    view_profile: "View Profile",
    logout: "Logout",
    login: "Login with Google",
    language_header: "LANGUAGE",
    filters_header: "SCHEME FILTERS",
    tab_taaza: "Taaza Khabar",
    taaza_desc: "Latest notifications and news regarding government schemes in India."
  },
  'हिंदी': {
    title: "अपना सरकारी लाभ खोजें",
    subtitle: "अपनी भाषा में तुरंत उन योजनाओं की खोज करें जिनके आप हकदार हैं।",
    tab_browse: "योजनाएं खोजें",
    tab_ai: "एआई सहायक + वॉयस",
    tab_fraud: "धोखाधड़ी हीटमैप",
    tab_pdf: "पीडीएफ विश्लेषक",
    tab_location: "निकटतम कार्यालय",
    active_schemes: "सक्रिय योजनाएं",
    categories: "श्रेणियाँ",
    languages: "भाषाएं",
    fraud_protection: "धोखाधड़ी सुरक्षा",
    apply_now: "अभी आवेदन करें",
    eligibility_score: "आपकी पात्रता स्कोर",
    sync_live: "लाइव सिंक",
    my_profile: "मेरी प्रोफ़ाइल",
    view_profile: "प्रोफ़ाइल देखें",
    logout: "लॉग आउट",
    login: "Google से लॉगिन करें",
    language_header: "भाषा",
    filters_header: "फिल्टर्स",
    tab_taaza: "ताज़ा ख़बर",
    taaza_desc: "भारत में सरकारी योजनाओं के बारे में नवीनतम सूचनाएं और समाचार।"
  },
  'मराठी': {
    title: "तुमचा सरकारी लाभ शोधा",
    subtitle: "तुमच्या भाषेत लगेचच तुम्ही पात्र असलेल्या योजना शोधा.",
    tab_browse: "योजना शोधा",
    tab_ai: "AI सहाय्यक + व्हॉइस",
    tab_fraud: "फसवणूक हीटमॅप",
    tab_pdf: "PDF विश्लेषक",
    tab_location: "जवळची कार्यालये",
    active_schemes: "सक्रिय योजना",
    categories: "श्रेण्या",
    languages: "भाषा",
    fraud_protection: "फसवणूक संरक्षण",
    apply_now: "आता अर्ज करा",
    eligibility_score: "तुमचा पात्रता स्कोअर",
    sync_live: "लाइव्ह सिंक",
    my_profile: "माझी प्रोफाईल",
    view_profile: "प्रोफाईल पहा",
    logout: "लॉगआउट",
    login: "Google सह लॉग इन करा",
    language_header: "भाषा",
    filters_header: "फिल्टर्स",
    tab_taaza: "ताजी बातमी",
    taaza_desc: "भारतातील सरकारी योजनांबद्दलच्या नवीनतम सूचना आणि बातम्या."
  },
  'தமிழ்': {
    title: "உங்கள் அரசு நன்மையை கண்டறியவும்",
    subtitle: "உங்களுக்கு உரிமையான திட்டங்களை — உங்கள் மொழியில், உடனடியாக கண்டறியவும்.",
    tab_browse: "திட்டங்களை உலாவு",
    tab_ai: "AI உதவியாளர் + குரல்",
    tab_fraud: "மோசடி வெப்ப வரைபடம்",
    tab_pdf: "PDF வழிகாட்டி",
    tab_location: "அருகிலுள்ள அலுவலகங்கள்",
    active_schemes: "செயலில் உள்ள திட்டங்கள்",
    categories: "வகைகள்",
    languages: "மொழிகள்",
    fraud_protection: "மோசடி பாதுகாப்பு",
    apply_now: "இப்போது விண்ணப்பிக்கவும்",
    eligibility_score: "உங்கள் தகுதி மதிப்பெண்",
    sync_live: "நேரடி சுருக்கம்",
    my_profile: "என் சுயவிவரம்",
    view_profile: "சுயவிவரத்தைக் காண்க",
    logout: "வெளியேறு",
    login: "Google உடன் உள்நுழைக",
    language_header: "மொழி",
    filters_header: "திட்ட வடிப்பான்கள்",
    tab_taaza: "சமீபத்திய செய்திகள்",
    taaza_desc: "இந்தியாவில் உள்ள அரசு திட்டங்கள் குறித்த சமீபத்திய அறிவிப்புகள் மற்றும் செய்திகள்."
  },
  'తెలుగు': {
    title: "మీ ప్రభుత్వ ప్రయోజనాన్ని కనుగొనండి",
    subtitle: "మీకు అర్హత ఉన్న పథకాలను — మీ భాషలో, తక్షణమే కనుగొనండి.",
    tab_browse: "పథకాలను బ్రౌజ్ చేయండి",
    tab_ai: "AI అసిస్టెంట్ + వాయిస్",
    tab_fraud: "మోసాల హీట్‌మ్యాప్",
    tab_pdf: "PDF విశ్లేషకుడు",
    tab_location: "సమీప కార్యాలయాలు",
    active_schemes: "క్రియాశీల పథకాలు",
    categories: "కేటగిరీలు",
    languages: "భాషలు",
    fraud_protection: "మోసం రక్షణ",
    apply_now: "ఇప్పుడే దరఖాస్తు చేసుకోండి",
    eligibility_score: "మీ అర్హత స్కోరు",
    sync_live: "లైవ్ సింక్",
    my_profile: "నా ప్రొఫైల్",
    view_profile: "ప్రొఫైల్ చూడండి",
    logout: "లాగ్అవుట్",
    login: "Google తో లాగిన్ చేయండి",
    language_header: "భాష",
    filters_header: "ఫిల్టర్లు",
    tab_taaza: "తాజా వార్తలు",
    taaza_desc: "భారతదేశంలో ప్రభుత్వ పథకాలకు సంబంధించిన తాజా నోటిఫికేషన్‌లు మరియు వార్తలు."
  }
};

// Auth Callback Component
function AuthCallback() {
  const { checkOnboardedStatus } = useAuth();
  const [status, setStatus] = useState("Completing authentication...");
  const hasRun = React.useRef(false);  // ← prevent re-runs when AuthContext re-renders

  const APP_URL = 'http://localhost:5000/app';

  useEffect(() => {
    // Guard: only run once even if deps change due to context re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isMockBypass = urlParams.get('mock_bypass') === 'true';
        const fromDataCollection = urlParams.get('from') === 'datacollection';

        // --- PRODUCTION SUPABASE AUTH ---
        // Step 1: Extract tokens from URL hash
        const rawHash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        let resolvedUser = null;

        if (access_token && refresh_token) {
          // Step 2: Explicitly set session at this origin (5000)
          setStatus("Setting up your session...");
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          resolvedUser = data?.user ?? null;
          // Clean hash from URL without a reload
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          // Fallback: session might already exist
          const { data } = await supabase.auth.getSession();
          resolvedUser = data?.session?.user ?? null;
        }

        if (cancelled) return;

        if (!resolvedUser) {
          window.location.href = 'http://localhost:5000';
          return;
        }

        setStatus("Checking your profile...");
        const isOnboarded = await checkOnboardedStatus(resolvedUser.email);
        if (cancelled) return;

        if (!isOnboarded) {
          window.location.href = 'http://localhost:5000/app/profile';
          return;
        }

        window.location.href = APP_URL;

      } catch (err) {
        console.error('AuthCallback error:', err);
        if (!cancelled) {
          setStatus('Error: ' + err.message + '. Redirecting...');
          setTimeout(() => { window.location.href = APP_URL; }, 2000);
        }
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, []); // empty deps — run once on mount only

  return null;
}


function App() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && !user && !window.location.pathname.includes('/auth/callback')) {
      window.location.href = 'http://localhost:5000/';
    }
  }, [user, authLoading]);
  const [schemes, setSchemes] = useState([
    {
      _id: 1,
      scheme_name: 'PM Kisan Samman Nidhi',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Direct income support of ₹6,000/year in 3 installments to small & marginal farmer families.',
      eligibility_criteria: 'All land-holding farmer families with cultivable land. Excludes institutional landholders and income tax payers.',
      benefits: '₹6,000 per year transferred directly to bank account in 3 equal installments.',
      required_documents: '7/12 Extract, Aadhar Card, Bank Account, Land Ownership Proof',
      application_link: 'https://pmkisan.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 85
    },
    {
      _id: 2,
      scheme_name: 'PM Fasal Bima Yojana',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Comprehensive crop insurance at just 2% premium for Kharif and 1.5% for Rabi crops.',
      eligibility_criteria: 'All farmers growing notified crops in notified areas. Both loanee and non-loanee farmers eligible.',
      benefits: 'Full insured sum coverage against natural calamities, pests, and diseases.',
      required_documents: '7/12 Extract, Aadhar Card, Bank Account, Sowing Certificate, Land Records',
      application_link: 'https://pmfby.gov.in/',
      start_date: 'Seasonal',
      end_date: 'Ongoing',
      eligibility_score: 80
    },
    {
      _id: 3,
      scheme_name: 'Pradhan Mantri Mudra Yojana (MUDRA)',
      category: 'Business',
      state: 'All India',
      income_level: 'All',
      summary: 'Collateral-free loans up to ₹20 Lakh for micro/small enterprises under Shishu, Kishore, and Tarun categories.',
      eligibility_criteria: 'Any Indian citizen with a business plan for non-farm income generating activity. No collateral required.',
      benefits: 'Shishu: up to ₹50K, Kishore: ₹50K-5L, Tarun: ₹5L-20L.',
      required_documents: 'Aadhar Card, PAN Card, Business Plan, Address Proof, Bank Statements',
      application_link: 'https://www.mudra.org.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 70
    },
    {
      _id: 4,
      scheme_name: 'Beti Bachao Beti Padhao',
      category: 'Women',
      state: 'All India',
      income_level: 'All',
      summary: 'National initiative for survival, protection, and education of the girl child.',
      eligibility_criteria: 'Families with girl children under 10 years of age. Focus on gender-critical districts.',
      benefits: 'Educational support, awareness campaigns, Sukanya Samriddhi Account benefits.',
      required_documents: 'Birth Certificate, Aadhar Card (parent), Bank Account',
      application_link: 'https://wcd.nic.in/bbbp-schemes',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 60
    },
    {
      _id: 5,
      scheme_name: 'Soil Health Card Scheme',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Free soil testing and health card for every farmer to improve productivity with nutrient-based recommendations.',
      eligibility_criteria: 'All farmers with agricultural land. Soil samples tested every 2 years.',
      benefits: 'Free soil analysis report with crop-wise fertilizer recommendations.',
      required_documents: '7/12 Extract, Aadhar Card, Land details',
      application_link: 'https://soilhealth.dac.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 90
    },
    {
      _id: 6,
      scheme_name: 'Pradhan Mantri Krishi Sinchai Yojana (PMKSY)',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Subsidy up to 55% on micro-irrigation (drip & sprinkler) systems. "Har Khet Ko Paani" mission.',
      eligibility_criteria: 'All farmers with own agricultural land. Priority for SC/ST and small/marginal farmers.',
      benefits: '55% subsidy for small farmers, 45% for others on drip/sprinkler systems.',
      required_documents: '7/12 Extract, 8A Extract, Aadhar Card, Bank Account, Caste Certificate (if SC/ST)',
      application_link: 'https://pmksy.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 75
    },
    {
      _id: 7,
      scheme_name: 'Ayushman Bharat - PMJAY',
      category: 'Health',
      state: 'All India',
      income_level: 'Backward Class',
      summary: 'Free health insurance cover of ₹5 Lakh per family per year for secondary and tertiary hospitalization.',
      eligibility_criteria: 'Families identified in SECC 2011 data. Deprived and vulnerable rural/urban families.',
      benefits: '₹5 Lakh cashless treatment at empaneled hospitals. Covers 1,350+ medical packages.',
      required_documents: 'Aadhar Card, Ration Card, Income Certificate, SECC data verification',
      application_link: 'https://pmjay.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 70
    },
    {
      _id: 8,
      scheme_name: 'PM Awas Yojana - Gramin',
      category: 'Housing',
      state: 'All India',
      income_level: 'Backward Class',
      summary: 'Financial assistance of ₹1.20 Lakh (plains) / ₹1.30 Lakh (hilly) for pucca house construction.',
      eligibility_criteria: 'Houseless families or families living in kutcha/dilapidated houses as per SECC 2011.',
      benefits: '₹1.20-1.30 Lakh assistance + 90 days MGNREGA wages + toilet assistance under SBM.',
      required_documents: 'Aadhar Card, Bank Account, BPL Card/Income Certificate, Land Ownership Proof',
      application_link: 'https://pmayg.nic.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 65
    },
    {
      _id: 9,
      scheme_name: 'Mahatma Jyotirao Phule Shetkari Karj Mukti Yojana',
      category: 'Farmers',
      state: 'Maharashtra',
      income_level: 'All',
      summary: 'Farm loan waiver up to ₹2 Lakh for Maharashtra farmers with crop loans from nationalized banks.',
      eligibility_criteria: 'Maharashtra domicile farmers with outstanding crop loans up to ₹2 Lakh taken before 30 Sep 2019.',
      benefits: 'Complete waiver of crop loans up to ₹2 Lakh. Incentive of ₹50,000 for regular repayers.',
      required_documents: '7/12 Extract, 8A Extract, Aadhar Card, Bank Loan Statement, Domicile Certificate',
      application_link: 'https://karjmafi.mahait.org/',
      start_date: 'Ongoing',
      end_date: 'December 31st, 2026',
      eligibility_score: 78
    },
    {
      _id: 10,
      scheme_name: 'Nanaji Deshmukh Krushi Sanjivani Yojana (PoCRA)',
      category: 'Farmers',
      state: 'Maharashtra',
      income_level: 'All',
      summary: 'Climate-resilient agriculture project with subsidies for farm ponds, drip irrigation, and more in drought-prone areas.',
      eligibility_criteria: 'Farmers in drought-prone areas of Maharashtra. Priority for small and marginal farmers.',
      benefits: 'Up to 75% subsidy on farm ponds, shade nets, polyhouse, and micro-irrigation.',
      required_documents: '7/12 Extract, Aadhar Card, Bank Account, Caste Certificate (if applicable)',
      application_link: 'https://pocra.mahait.org/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 72
    },
    {
      _id: 11,
      scheme_name: 'Gopinath Munde Shetkari Apghat Vima Yojana',
      category: 'Farmers',
      state: 'Maharashtra',
      income_level: 'All',
      summary: 'Free accident insurance of ₹2 Lakh for farmers in Maharashtra covering death and disability.',
      eligibility_criteria: 'All farmers in Maharashtra between 10-75 years of age holding 7/12 extract.',
      benefits: '₹2 Lakh for accidental death, ₹1 Lakh for partial disability, ₹50K for hospitalization.',
      required_documents: '7/12 Extract, Aadhar Card, Age Proof, FIR/Medical Certificate (for claim)',
      application_link: 'https://krishi.maharashtra.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 85
    },
    {
      _id: 12,
      scheme_name: 'National Scholarship Portal',
      category: 'Education',
      state: 'All India',
      income_level: 'Backward Class',
      summary: 'One-stop platform for pre-matric, post-matric, and merit-based scholarships for students from economically weaker sections.',
      eligibility_criteria: 'Students from SC/ST/OBC/Minority communities. Annual family income below ₹2.5 Lakh.',
      benefits: 'Scholarship amount varies by course: ₹5,000-50,000 per year.',
      required_documents: 'Income Certificate, Caste Certificate, Aadhar Card, Marksheet, Bank Account',
      application_link: 'https://scholarships.gov.in/',
      start_date: 'August 1st, 2026',
      end_date: 'October 31st, 2026',
      eligibility_score: 60
    },
    {
      _id: 13,
      scheme_name: 'PM Surya Ghar Muft Bijli Yojana',
      category: 'General',
      state: 'All India',
      income_level: 'All',
      summary: 'Subsidy up to ₹78,000 for rooftop solar panel installation. Get 300 units of free electricity every month.',
      eligibility_criteria: 'Any household with a valid electricity connection and suitable rooftop area.',
      benefits: '₹30,000 subsidy for 1kW, ₹60,000 for 2kW, ₹78,000 for 3kW+ systems.',
      required_documents: 'Electricity Bill, Aadhar Card, Bank Account, Property Document',
      application_link: 'https://pmsuryaghar.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 80
    },
    {
      _id: 14,
      scheme_name: 'Atal Pension Yojana',
      category: 'Senior Citizens',
      state: 'All India',
      income_level: 'All',
      summary: 'Guaranteed pension of ₹1,000-5,000/month after 60 years. Government co-contributes 50% for eligible subscribers.',
      eligibility_criteria: 'Indian citizens aged 18-40 years with a savings bank account. Not an income taxpayer.',
      benefits: 'Fixed monthly pension of ₹1,000 to ₹5,000 based on contribution.',
      required_documents: 'Aadhar Card, Bank Account, Mobile Number',
      application_link: 'https://npscra.nsdl.co.in/scheme-details.php',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 65
    },
    {
      _id: 15,
      scheme_name: 'PM Vishwakarma Yojana',
      category: 'Business',
      state: 'All India',
      income_level: 'Backward Class',
      summary: 'End-to-end support for traditional artisans and craftspeople with up to ₹3 Lakh loans at 5% interest.',
      eligibility_criteria: 'Traditional artisans/craftspeople (carpenter, blacksmith, goldsmith, potter, etc.) aged 18+.',
      benefits: 'Skill training, ₹15,000 toolkit, ₹1-3 Lakh collateral-free loans at 5%, digital marketing support.',
      required_documents: 'Aadhar Card, Bank Account, Craft Skill Certificate, Caste Certificate',
      application_link: 'https://pmvishwakarma.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 68
    },
    {
      _id: 16,
      scheme_name: 'Standup India Scheme',
      category: 'Business',
      state: 'All India',
      income_level: 'Backward Class',
      summary: 'Bank loans between ₹10 Lakh and ₹1 Crore for SC/ST and women entrepreneurs for greenfield enterprises.',
      eligibility_criteria: 'SC/ST or Women entrepreneurs aged 18+. For setting up greenfield enterprise in manufacturing or services.',
      benefits: 'Composite loan of ₹10 Lakh to ₹1 Crore covering 75% of project cost.',
      required_documents: 'Aadhar Card, PAN Card, Caste Certificate (SC/ST), Business Plan, ITR, Bank Statements',
      application_link: 'https://www.standupmitra.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 55
    },
    {
      _id: 17,
      scheme_name: 'PM Matru Vandana Yojana',
      category: 'Women',
      state: 'All India',
      income_level: 'All',
      summary: 'Cash incentive of ₹11,000 for pregnant and lactating women for the first living child.',
      eligibility_criteria: 'Pregnant women and lactating mothers for first live birth. Age 19+ years.',
      benefits: '₹5,000 in 3 installments + ₹6,000 for institutional delivery under JSY.',
      required_documents: 'Aadhar Card, Bank Account, MCP Card, Pregnancy Registration',
      application_link: 'https://pmmvy.wcd.gov.in/',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 70
    },
    {
      _id: 18,
      scheme_name: 'Kisan Credit Card (KCC)',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Revolving credit facility at 4% interest for crop production, post-harvest, and allied agriculture activities.',
      eligibility_criteria: 'All farmers, sharecroppers, tenant farmers, and self-help groups engaged in agriculture.',
      benefits: 'Credit limit up to ₹3 Lakh at 4% interest (with subvention). ATM-enabled smart card.',
      required_documents: '7/12 Extract, Aadhar Card, PAN Card, Passport Photo, Land Records',
      application_link: 'https://pmkisan.gov.in/KCCForm.aspx',
      start_date: 'Ongoing',
      end_date: 'Ongoing',
      eligibility_score: 88
    }
  ]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedIncome, setSelectedIncome] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  // New Feature States
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Translation Helper
  const t = (key) => DICTIONARY[selectedLanguage]?.[key] || DICTIONARY['English'][key] || key;

  // Taaza Khabar Dummy Data
  const taazaKhabarNews = [
    { id: 1, title: 'PM Kisan Samman Nidhi 16th Installment Released', date: '2026-03-10', time: '14:30', description: 'The government has released the 16th installment of PM Kisan Samman Nidhi. Eligible farmers will directly receive Rs 2000 in their bank accounts.' },
    { id: 2, title: 'New Subsidies for Rooftop Solar Panels', date: '2026-03-09', time: '10:15', description: 'Under the PM Surya Ghar scheme, subsidies up to 60% for 2kW systems are now open for applications through the national portal.' },
    { id: 3, title: 'Ayushman Bharat Expansion to Senior Citizens', date: '2026-03-08', time: '09:00', description: 'Citizens over 70 years are now automatically eligible for Rs 5 Lakh health coverage under Ayushman Bharat regardless of income.' },
    { id: 4, title: 'Mudra Loan Limits Enhanced', date: '2026-03-07', time: '16:45', description: 'The upper limit for Tarun category of Mudra loans has been enhanced to Rs 20 Lakhs from the existing Rs 10 Lakhs to support growing businesses.' },
  ];

  // OCR Document Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // '' | 'uploading' | 'success' | 'error'
  const [pdfInsights, setPdfInsights] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0=idle,1=uploading,2=ocr,3=gemini,4=done
  const [syncStatus, setSyncStatus] = useState(''); // '' | 'syncing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [eligibleSchemeNames, setEligibleSchemeNames] = useState([]);
  const [hardcodedSchemes, setHardcodedSchemes] = useState([]);

  const runOcr = async (file) => {
    setSelectedFile(file);
    setUploadStatus('uploading');
    setPdfInsights('');
    setErrorMessage('');
    setScanStep(1);

    const formData = new FormData();
    formData.append('document', file);

    // Simulate step progression for UX
    const stepTimer1 = setTimeout(() => setScanStep(2), 800);  // OCR
    const stepTimer2 = setTimeout(() => setScanStep(3), 2000); // Gemini

    try {
      const res = await fetch('/api/ocr/analyze-image', {
        method: 'POST',
        body: formData,
      });
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      const data = await res.json();
      if (data.success) {
        setPdfInsights(data.insights);
        setExtractedData(data.extractedData);
        setEligibleSchemeNames(data.eligibleSchemes || []);
        setHardcodedSchemes(data.hardcodedSchemes || []);
        setScanStep(4);
        setUploadStatus('success');
      } else {
        setErrorMessage(data.error || 'Document Analysis Failed');
        setScanStep(0);
        setUploadStatus('error');
      }
    } catch (err) {
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      setErrorMessage(err.message || 'Connection to backend failed');
      setScanStep(0);
      setUploadStatus('error');
      console.error(err);
    }
  };

  const handleSyncProfile = async () => {
    if (!extractedData || !user?.id) {
      alert("No user session found or no data to sync. Please sign in.");
      return;
    }
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/ocr/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.id, extractedData }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus('success');
        alert("Profile updated successfully from 7/12 document!");
      } else {
        setSyncStatus('error');
        alert(data.error || "Sync failed");
      }
    } catch (err) {
      setSyncStatus('error');
      console.error(err);
      alert("Sync failed: Network error");
    }
  };

  const handleFileUpload = (e) => { const file = e.target.files[0]; if (file) runOcr(file); };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) runOcr(file);
  };

  // Location params state for location tracer
  const [locationParams, setLocationParams] = useState(null);
  const [showMapPins, setShowMapPins] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('government+offices');

  useEffect(() => {
    if (activeTab === 'location' && !locationParams) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationParams({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          (error) => {
            console.error("Error getting location", error);
            // Default location: New Delhi
            setLocationParams({ lat: 28.6139, lng: 77.2090 });
          }
        );
      }
    }
  }, [activeTab]);

  // Fetch user profile from MongoDB to sync filters and UI highlights
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/users/profile?uid=${user.id}`);
          const data = await res.json();
          if (data.success && data.user) {
            setUserProfile(data.user);
            // Auto-set income level filter if profile has it (category now)
            if (data.user.income_category) {
              setSelectedIncome(data.user.income_category);
            } else if (data.user.income_level) {
              setSelectedIncome(data.user.income_level);
            }
          }
        } catch (err) {
          console.error("Error fetching profile for filters:", err);
        }
      }
    };
    fetchProfile();
  }, [user, syncStatus]);

  // ── Sync schemes + trigger WhatsApp notification ──
  const syncSchemes = async () => {
    console.log("SYNC CLICKED");
    console.log("user object:", user);
    console.log("uid being sent:", user?.id);
    try {
      setIsLoading(true);
      const uid = user?.id ?? "";
      const res = await fetch(`/api/firecrawl/sync?uid=${uid}`);
      const data = await res.json();
      console.log("Fetched schemes:", data);
      if (data.success && data.schemes) {
        setSchemes(data.schemes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the root font-size for full page accessibility scaling
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontSizeMultiplier}px`;
  }, [fontSizeMultiplier]);

  useEffect(() => {
    filterSchemes();
  }, [schemes, selectedCategory, selectedState, selectedIncome]);

  const filterSchemes = () => {
    let filtered = schemes;

    if (selectedCategory) {
      filtered = filtered.filter(scheme => scheme.category === selectedCategory);
    }

    if (selectedState) {
      filtered = filtered.filter(scheme => scheme.state === selectedState || scheme.state === 'All India');
    }

    if (selectedIncome && selectedIncome !== 'All') {
      filtered = filtered.filter(scheme => scheme.income_level === selectedIncome || scheme.income_level === 'All');
    }

    setFilteredSchemes(filtered);
  };

  // Compute eligibility status for a scheme based on user profile
  const getEligibilityStatus = (scheme) => {
    if (!userProfile) return { status: 'unknown', label: '❓ Login to Check', color: '#888' };
    let score = 0;
    let total = 0;
    let reasons = [];

    // Income match
    total++;
    if (scheme.income_level === 'All' || scheme.income_level === userProfile.income_category) {
      score++;
      reasons.push('Income matches');
    } else {
      reasons.push('Income: requires ' + scheme.income_level);
    }

    // State match
    total++;
    const userState = userProfile.district ? 'Maharashtra' : 'All India'; // Infer from district
    if (scheme.state === 'All India' || scheme.state === userState) {
      score++;
      reasons.push('State matches');
    } else {
      reasons.push('State: requires ' + scheme.state);
    }

    // Farmer category - check if user has land/survey
    if (scheme.category === 'Farmers') {
      total++;
      if (userProfile.survey_number || userProfile.land_area) {
        score++;
        reasons.push('Land record on file');
      } else {
        reasons.push('No land record — sync 7/12 via PDF Wizard');
      }
    }

    const pct = Math.round((score / total) * 100);
    if (pct >= 80) return { status: 'eligible', label: '✅ Eligible', color: '#276749', pct, reasons };
    if (pct >= 50) return { status: 'partial', label: '⚠️ Partially Eligible', color: '#b7791f', pct, reasons };
    return { status: 'not_eligible', label: '❌ Not Eligible', color: '#c53030', pct, reasons };
  };

  const categories = ['Farmers', 'Women', 'Business', 'Education', 'Health', 'Senior Citizens', 'Youth', 'Housing', 'General'];
  const states = ['All India', 'Punjab', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Rajasthan', 'Delhi'];
  const incomes = ['All', 'Backward Class', 'Middle Class', 'Higher Class'];
  const languages = ['English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు'];

  const getCategoryColor = (category) => {
    if (!category) return '#103567';
    const colors = {
      'Farmers': '#2d5a3d',
      'Women': '#8e44ad',
      'Business': '#e67300',
      'Education': '#2980b9',
      'Health': '#c0392b',
      'Senior Citizens': '#7f8c8d',
      'Youth': '#16a085',
      'Housing': '#d35400',
      'General': '#103567'
    };
    return colors[category] || '#103567';
  };


  const handleApply = (e, scheme) => {
    e.preventDefault();
    if (scheme.application_link && scheme.application_link !== '#') {
      window.open(scheme.application_link, '_blank');
    } else {
      // Fallback if no valid link exists
      alert("Application link is currently unavailable for this scheme.");
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className={`app ${isDarkMode ? 'dark-mode' : ''}`} style={{ fontSize: `${16 * fontSizeMultiplier}px` }}>
          {/* Top Banner */}
          <div className="top-banner">
            <div className="top-banner-inner">
              <span>Government of India | भारत सरकार</span>
              <span>Powered by KRISHISETU Platform</span>
            </div>
          </div>

          <div className="app-container">
            {/* Left Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <h1>KRISHISETU</h1>
                <p>Smart Scheme Finder</p>
              </div>

              {/* Language Section */}
              <div className="sidebar-section">
                <h3>{t('language_header')}</h3>
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="language-select">
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Filters Section */}
              <div className="sidebar-section">
                <h3>{t('filters_header')}</h3>

                <div className="filter-group">
                  <label>Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
                    <option value="">All categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>State / UT</label>
                  <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="filter-select">
                    <option value="">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Income Level</label>
                  <div className="income-tags">
                    {selectedIncome && (
                      <span className="income-tag">
                        {selectedIncome}
                        <button onClick={() => setSelectedIncome('')}>✕</button>
                      </span>
                    )}
                    {!selectedIncome && (
                      <select value={selectedIncome} onChange={(e) => setSelectedIncome(e.target.value)} className="filter-select">
                        <option value="">All</option>
                        {incomes.map(inc => (
                          <option key={inc} value={inc}>{inc}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="sidebar-section">
                <h3>{t('my_profile')}</h3>
                {user ? (
                  <>
                    <p className="user-email" style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#103567' }}>
                      {userProfile?.name || userProfile?.full_name || 'Farmer'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '2px 0 8px 0' }}>{user.email}</p>
                    
                    <div style={{ background: '#f7fafc', padding: '8px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.75rem' }}>
                      {(userProfile?.income_category || userProfile?.incomeClass) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{color: '#16a085', fontWeight: 700}}>💰 Income:</span>
                          <span style={{color: '#333'}}>{userProfile.incomeClass || userProfile.income_category}</span>
                        </div>
                      )}
                      {userProfile?.district && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{color: '#103567', fontWeight: 700}}>📍 District:</span>
                          <span style={{color: '#333'}}>{userProfile.district}</span>
                        </div>
                      )}
                      {(userProfile?.village || userProfile?.location || userProfile?.taluka) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{color: '#103567', fontWeight: 700}}>🏘️ Location:</span>
                          <span style={{color: '#333'}}>{userProfile.village || userProfile.location || ''} {userProfile.taluka ? `(${userProfile.taluka})` : ''}</span>
                        </div>
                      )}
                      {userProfile?.survey_number && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{color: '#d97706', fontWeight: 700}}>📄 Survey:</span>
                          <span style={{color: '#333'}}>{userProfile.survey_number}</span>
                        </div>
                      )}
                    </div>
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                      {t('view_profile')}
                    </button>
                    <button className="logout-btn" onClick={signOut}>
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                    Please sign in from the landing page.
                  </p>
                )}
              </div>

              {/* Data Sync */}
              <div className="sidebar-section">
                <h3>DATA SYNC</h3>
                <button
                  type="button"
                  className="sync-btn"
                  disabled={isLoading}
                  onClick={syncSchemes}
                >
                  {isLoading ? "Syncing..." : t('sync_live')}
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
              {/* Header with Stats */}
              <div className="main-header">
                <div className="header-left">
                  <h1>KRISHISETU</h1>
                  <p>सरकारी योजना खोजें | Government Scheme Finder</p>
                </div>
              </div>

              {/* Hero Section */}
              <section className="hero-section">
                <h2>{t('title')}</h2>
                <p>{t('subtitle')}</p>
                <div className="hero-stats">
                  <div className="stat-pill">
                    <span>18+</span> {t('active_schemes')}
                  </div>
                  <div className="stat-pill">
                    <span>9</span> {t('categories')}
                  </div>
                  <div className="stat-pill">
                    <span>8</span> {t('languages')}
                  </div>
                  <div className="stat-pill">
                    <span>AI</span> {t('fraud_protection')}
                  </div>
                </div>
              </section>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  {t('tab_browse')}
                </button>
                <button
                  className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assistant')}
                >
                  {t('tab_ai')}
                </button>
                <button
                  className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pdf')}
                >
                  {t('tab_pdf')}
                </button>
                <button
                  className={`tab ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveTab('location')}
                >
                  {t('tab_location')}
                </button>
                <button
                  className={`tab ${activeTab === 'fraud' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fraud')}
                >
                  {t('tab_taaza')}
                </button>
                <button
                  id="tab-msp-tracker"
                  className={`tab ${activeTab === 'msp' ? 'active' : ''}`}
                  onClick={() => setActiveTab('msp')}
                >
                  📊 MSP Tracker
                </button>
              </div>

              {/* Available Schemes */}
              {activeTab === 'browse' && (
                <div className="schemes-container">
                  <h3>📋 Available Schemes ({filteredSchemes.length})</h3>
                  {isLoading ? (
                    <div className="loading">Loading schemes...</div>
                  ) : filteredSchemes.length > 0 ? (
                    <div className="schemes-grid">
                      {filteredSchemes.map((scheme) => {
                        const elig = getEligibilityStatus(scheme);
                        return (
                          <div key={scheme._id} className="scheme-card">
                            <div className="card-header" style={{ background: getCategoryColor(scheme.category), borderTop: 'none', padding: '24px 24px 20px' }}>
                              <div className="card-category" style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                <span>✦ {scheme.category?.toUpperCase() || 'GENERAL'}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>{elig.label}</span>
                              </div>
                              <h3 className="card-title" style={{ color: '#ffffff' }}>{scheme.scheme_name}</h3>
                            </div>
                            <div className="card-body">
                              <p className="card-summary">{scheme.summary}</p>
                              <div className="card-meta">
                                <span className="meta-tag">State: {scheme.state}</span>
                                <span className="meta-tag">Income: {scheme.income_level}</span>
                                {scheme.end_date && <span className="meta-tag" style={{ color: scheme.end_date === 'Ongoing' ? '#276749' : '#c53030' }}>📅 {scheme.end_date}</span>}
                              </div>
                              <div className="eligibility-score">
                                <div className="score-label">{t('eligibility_score')}: <strong>{scheme.eligibility_score}%</strong></div>
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${scheme.eligibility_score}%` }}></div>
                                </div>
                              </div>
                              {/* Eligibility reasons */}
                              {elig.reasons && (
                                <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#555' }}>
                                  {elig.reasons.map((r, i) => <div key={i} style={{ padding: '2px 0' }}>• {r}</div>)}
                                </div>
                              )}
                              {/* Dual button row: Details + Apply Now */}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={() => setDetailsModal(scheme)}
                                  style={{ flex: 1, background: 'none', border: '2px solid #103567', color: '#103567', padding: '10px 0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
                                >
                                  📄 Details
                                </button>
                                <button
                                  onClick={(e) => handleApply(e, scheme)}
                                  className="btn-apply"
                                  style={{ flex: 1, margin: 0 }}
                                >
                                  {t('apply_now')} →
                                </button>
                              </div>
                              {userProfile?.survey_number && scheme.category === 'Farmers' && (
                                <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#103567', background: '#eef2ff', padding: '8px', borderRadius: '6px', borderLeft: '4px solid #103567' }}>
                                  ✅ Survey No: <strong>{userProfile.survey_number}</strong> — Apply with synced 7/12 extract.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-schemes">No schemes found matching your filters.</div>
                  )}
                </div>
              )}

              {/* Details Modal */}
              {detailsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                  onClick={() => setDetailsModal(null)}>
                  <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto', padding: '0', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                    onClick={(e) => e.stopPropagation()}>
                    <div style={{ background: getCategoryColor(detailsModal.category), color: 'white', padding: '24px 28px', borderRadius: '16px 16px 0 0' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 700, marginBottom: '6px' }}>✦ {detailsModal.category?.toUpperCase()}</div>
                      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{detailsModal.scheme_name}</h2>
                    </div>
                    <div style={{ padding: '24px 28px' }}>
                      <p style={{ color: '#4a5568', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>{detailsModal.summary}</p>

                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ background: '#f7fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #103567' }}>
                          <h4 style={{ margin: '0 0 6px', color: '#103567', fontSize: '0.85rem' }}>📋 Eligibility Criteria</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>{detailsModal.eligibility_criteria}</p>
                        </div>
                        <div style={{ background: '#f0fff4', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #276749' }}>
                          <h4 style={{ margin: '0 0 6px', color: '#276749', fontSize: '0.85rem' }}>💰 Benefits</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>{detailsModal.benefits}</p>
                        </div>
                        <div style={{ background: '#fffaf0', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #dd6b20' }}>
                          <h4 style={{ margin: '0 0 6px', color: '#dd6b20', fontSize: '0.85rem' }}>📄 Documents Required</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>{detailsModal.required_documents || 'Aadhar Card, Income Certificate, Bank Account'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1, background: '#eef2ff', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>START DATE</div>
                            <div style={{ fontWeight: 700, color: '#103567', fontSize: '0.9rem' }}>{detailsModal.start_date || 'N/A'}</div>
                          </div>
                          <div style={{ flex: 1, background: '#fff5f5', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>END DATE</div>
                            <div style={{ fontWeight: 700, color: detailsModal.end_date === 'Ongoing' ? '#276749' : '#c53030', fontSize: '0.9rem' }}>{detailsModal.end_date || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                        <button onClick={() => setDetailsModal(null)}
                          style={{ flex: 1, background: 'none', border: '2px solid #ccc', color: '#666', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                          Close
                        </button>
                        <button onClick={(e) => { handleApply(e, detailsModal); setDetailsModal(null); }}
                          className="btn-apply" style={{ flex: 1, margin: 0 }}>
                          Apply Now →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="tab-content">
                  <h3>{t('tab_ai')}</h3>
                  <p>Chat with our AI assistant or use voice search to find schemes.</p>
                </div>
              )}

              {/* PDF Parsing Wizard Tab */}
              {activeTab === 'pdf' && (
                <div className="tab-content pdf-wizard">
                  {/* Header */}
                  <div className="fraud-header">
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={26} color="#003366" /> AI Policy PDF &amp; Image Analyzer
                      </h3>
                      <p style={{ marginTop: 4, color: '#555', fontSize: '0.95rem' }}>
                        Upload any government policy document or image — our AI will OCR-scan it and generate a plain-language summary.
                      </p>
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      position: 'relative',
                      marginTop: '20px',
                      padding: '48px 32px',
                      background: isDragOver ? '#eef4ff' : '#f8faff',
                      border: `2px dashed ${isDragOver ? '#4a6cf7' : '#103567'}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      id="ocr-file-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploadStatus === 'uploading'}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10 }}
                    />
                    <UploadCloud size={56} color={isDragOver ? '#4a6cf7' : '#103567'} style={{ margin: '0 auto 14px', display: 'block', transition: 'color 0.2s' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#103567', fontSize: '1.15rem', fontWeight: 700 }}>
                      {isDragOver ? '📂 Release to Scan' : 'Drag & Drop a PDF or Image'}
                    </h4>
                    <p style={{ color: '#777', fontSize: '0.88rem', margin: '0 0 16px' }}>Supports PDF, PNG, JPG, JPEG &bull; Max 10 MB</p>
                    <button
                      style={{
                        pointerEvents: 'none',
                        background: '#103567', color: '#fff',
                        border: 'none', borderRadius: '6px',
                        padding: '10px 28px', fontWeight: 600, fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      {uploadStatus === 'uploading' ? '⏳ Scanning...' : 'Browse Files'}
                    </button>
                  </div>

                  {/* File preview chip */}
                  {selectedFile && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#e8f0fd', border: '1px solid #b3cdf5',
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '0.82rem', color: '#103567', fontWeight: 600,
                      }}>
                        📄 {selectedFile.name}
                        <span style={{ color: '#888', fontWeight: 400 }}>({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      </span>
                      {(uploadStatus === 'success' || uploadStatus === 'error') && (
                        <button
                          onClick={() => { setSelectedFile(null); setUploadStatus(''); setPdfInsights(''); setScanStep(0); }}
                          style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
                        >Clear</button>
                      )}
                    </div>
                  )}

                  {/* Scan Step Tracker */}
                  {uploadStatus === 'uploading' && (
                    <div style={{ marginTop: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px' }}>
                      <p style={{ fontWeight: 700, color: '#103567', marginBottom: '16px', fontSize: '0.95rem' }}>🔍 Scanning Document...</p>
                      {[
                        { step: 1, label: 'Uploading document to server', icon: '⬆️' },
                        { step: 2, label: scanStep >= 2 && selectedFile?.name?.toLowerCase().endsWith('.pdf') ? 'Extracting text from PDF' : 'Running Tesseract.js OCR on image', icon: '📖' },
                        { step: 3, label: 'Sending to Gemini AI for analysis', icon: '🤖' },
                      ].map(({ step, label, icon }) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', opacity: scanStep >= step ? 1 : 0.35, transition: 'opacity 0.4s' }}>
                          <span style={{ fontSize: '1.2rem' }}>{scanStep > step ? '✅' : scanStep === step ? '⏳' : icon}</span>
                          <span style={{ fontSize: '0.9rem', color: scanStep >= step ? '#103567' : '#999', fontWeight: scanStep === step ? 700 : 400 }}>{label}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '12px', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(scanStep / 3) * 100}%`, background: 'linear-gradient(90deg, #103567, #4a6cf7)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {uploadStatus === 'error' && (
                    <div style={{ marginTop: '20px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                      <div>
                        <p style={{ color: '#c53030', fontWeight: 700, margin: 0 }}>{errorMessage || 'Document Analysis Failed'}</p>
                        <p style={{ color: '#742a2a', fontSize: '0.87rem', marginTop: '4px' }}>
                          {errorMessage ? "Details: " + errorMessage : "Make sure the backend is running on port 5000 and the Gemini API key is set. Try a clearer image or a text-based PDF."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success — Summary Box */}
                  {uploadStatus === 'success' && pdfInsights && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <CheckCircle size={20} color="#276749" />
                        <h4 style={{ margin: 0, color: '#276749', fontSize: '1rem', fontWeight: 700 }}>AI Document Summary</h4>
                        <span style={{ marginLeft: 'auto', background: '#c6f6d5', color: '#276749', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Powered by Gemini + Tesseract</span>
                      </div>
                      <div
                        id="pdf-export-content"
                        style={{
                          background: '#f0fff4',
                          border: '1px solid #9ae6b4',
                          borderRadius: '10px',
                          padding: '20px 22px',
                          maxHeight: '420px',
                          overflowY: 'auto',
                        }}>
                        {/* Header for PDF export (hidden in UI, shown in PDF) */}
                        <div className="pdf-only-header" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #103567', paddingBottom: '10px' }}>
                          <h2 style={{ color: '#103567', margin: '0 0 5px' }}>KRISHISETU OFFICIAL REPORT</h2>
                          <p style={{ margin: 0, color: '#555', fontWeight: 600 }}>Document Analysis & Scheme Recommendations</p>
                          <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '10px 0' }} />
                        </div>

                        {extractedData && (
                          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #103567', borderRadius: '8px', background: '#eef2ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#103567', fontSize: '0.95rem', fontWeight: 700 }}>🔍 Extracted Profile Data</h4>
                              {!syncStatus && (
                                <button
                                  onClick={handleSyncProfile}
                                  style={{ background: '#103567', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Sync to Profile
                                </button>
                              )}
                              {syncStatus === 'syncing' && <span style={{ fontSize: '0.8rem', color: '#103567' }}>⌛ Syncing...</span>}
                              {syncStatus === 'success' && <span style={{ fontSize: '0.8rem', color: '#276749', fontWeight: 700 }}>✅ Profile Updated</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                              <div><span style={{ color: '#666' }}>Name:</span> <br /> <strong>{extractedData.full_name || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Survey No:</span> <br /> <strong>{extractedData.survey_number || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Land Area:</span> <br /> <strong>{extractedData.land_area || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Village:</span> <br /> <strong>{extractedData.village || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Taluka:</span> <br /> <strong>{extractedData.taluka || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>District:</span> <br /> <strong>{extractedData.district || '---'}</strong></div>
                            </div>
                          </div>
                        )}

                        {pdfInsights.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={i} style={{ height: '8px' }} />;
                          if (trimmed.startsWith('##') || trimmed.startsWith('**')) {
                            return <p key={i} style={{ fontWeight: 700, color: '#103567', margin: '14px 0 6px', fontSize: '1rem' }}>{trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</p>;
                          }
                          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            return <p key={i} style={{ margin: '4px 0 4px 18px', color: '#2d3748', fontSize: '0.9rem' }}>• {trimmed.slice(2)}</p>;
                          }
                          return <p key={i} style={{ margin: '6px 0', color: '#4a5568', fontSize: '0.92rem', lineHeight: 1.6 }}>{trimmed}</p>;
                        })}


                        {/* Eligible Schemes Section — ALWAYS VISIBLE */}
                        <div className="pdf-only-schemes" style={{ marginTop: '24px' }}>
                          <h3 style={{ borderBottom: '2px solid #103567', paddingBottom: '8px', color: '#103567', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏛️ Eligible Government Schemes
                          </h3>
                          <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#666', marginBottom: '12px' }}>
                            Based on your uploaded document{extractedData?.survey_number ? ` (Survey No: ${extractedData.survey_number})` : ''} and profile data.
                          </p>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ background: '#103567', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>#</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Scheme Name</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Benefit</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Documents Required</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Apply</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(hardcodedSchemes.length > 0 ? hardcodedSchemes : [
                                { name: 'PM Kisan Samman Nidhi', benefit: '₹6,000/year', documents: '7/12 Extract, Aadhar, Bank A/C', portal: 'https://pmkisan.gov.in/' },
                                { name: 'PM Fasal Bima Yojana', benefit: 'Crop insurance at 2%', documents: '7/12, Sowing Cert, Bank A/C', portal: 'https://pmfby.gov.in/' },
                                { name: 'Kisan Credit Card', benefit: '₹3L at 4% interest', documents: '7/12, Aadhar, PAN', portal: 'https://pmkisan.gov.in/KCCForm.aspx' },
                                { name: 'Soil Health Card', benefit: 'Free soil testing', documents: '7/12, Aadhar', portal: 'https://soilhealth.dac.gov.in/' },
                                { name: 'PM Krishi Sinchai Yojana', benefit: '55% irrigation subsidy', documents: '7/12, 8A, Aadhar', portal: 'https://pmksy.gov.in/' },
                                { name: 'Gopinath Munde Vima Yojana', benefit: '₹2L accident insurance', documents: '7/12, Aadhar, Age Proof', portal: 'https://krishi.maharashtra.gov.in/' },
                                { name: 'Nanaji Deshmukh Krushi Sanjivani', benefit: '75% farm pond subsidy', documents: '7/12, Aadhar, Bank A/C', portal: 'https://pocra.mahait.org/' },
                                { name: 'Shetkari Karj Mukti Yojana', benefit: 'Loan waiver up to ₹2L', documents: '7/12, Bank Statement, Domicile', portal: 'https://karjmafi.mahait.org/' },
                              ]).map((s, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f7fafc' : 'white' }}>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#103567' }}>{idx + 1}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{s.name}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', color: '#276749' }}>{s.benefit}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', color: '#666', fontSize: '0.78rem' }}>{s.documents}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                                    <a href={s.portal} target="_blank" rel="noopener noreferrer"
                                      style={{ color: '#103567', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>
                                      Apply →
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#eef2ff', borderLeft: '4px solid #103567', borderRadius: '4px', fontSize: '0.82rem', color: '#2d3748' }}>
                            <strong>💡 Tip:</strong> Visit the <strong>Browse Schemes</strong> tab for detailed information on each scheme including full eligibility criteria, start/end dates, and application guidance.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <button
                          onClick={() => navigator.clipboard?.writeText(pdfInsights)}
                          style={{ background: 'none', border: '1px solid #103567', borderRadius: '6px', padding: '8px 16px', color: '#103567', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >📋 Copy Text</button>

                        <button
                          onClick={() => {
                            const element = document.getElementById('pdf-export-content');
                            // Show headers
                            const header = element.querySelector('.pdf-only-header');
                            const schemes = element.querySelector('.pdf-only-schemes');
                            if (header) header.style.display = 'block';
                            if (schemes) schemes.style.display = 'block';

                            const opt = {
                              margin: [15, 10],
                              filename: `KrishiSetu_Report_${extractedData?.survey_number || 'Doc'}.pdf`,
                              image: { type: 'jpeg', quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            };

                            html2pdf().set(opt).from(element).save().then(() => {
                              if (header) header.style.display = 'none';
                              if (schemes) schemes.style.display = 'none';
                            });
                          }}
                          style={{ background: '#103567', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        ><Download size={16} /> Download PDF Report</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'location' && (
                <div className="tab-content taaza-dashboard">
                  <div className="location-tracer-container">
                    <div className="tracer-header">
                      <h3>🗺️ Nearby Government Offices</h3>
                      <p>Locate government authorities near your location using Google Earth view.</p>
                    </div>
                    {/* Office Category Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0' }}>
                      {[
                        { label: '🏛️ All Govt Offices', query: 'government+offices' },
                        { label: '📋 Tahsildar Office', query: 'tahsildar+office' },
                        { label: '🏢 Collector Office', query: 'collector+office' },
                        { label: '🏘️ Gram Panchayat', query: 'gram+panchayat' },
                        { label: '🌾 Krishi Bhavan', query: 'krishi+bhavan+agriculture+office' },
                        { label: '🏦 Banks', query: 'nationalized+bank' },
                        { label: '📮 Post Office', query: 'post+office' },
                      ].map((item) => (
                        <button
                          key={item.query}
                          onClick={() => { setMapSearchQuery(item.query); setShowMapPins(true); }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: mapSearchQuery === item.query ? '2px solid #103567' : '1px solid #ddd',
                            background: mapSearchQuery === item.query ? '#103567' : 'white',
                            color: mapSearchQuery === item.query ? 'white' : '#333',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {locationParams ? (
                      <div style={{ position: 'relative', width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <iframe
                          title="Government Offices Locator"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 'none' }}
                          referrerPolicy="no-referrer-when-downgrade"
                          src={showMapPins
                            ? `https://www.google.com/maps/embed/v1/search?key=AIzaSyBo76tcZqaSv8KSTeoAUhEdtnTLW28HTtg&q=${mapSearchQuery}&center=${locationParams.lat},${locationParams.lng}&zoom=13`
                            : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBo76tcZqaSv8KSTeoAUhEdtnTLW28HTtg&q=${locationParams.lat},${locationParams.lng}&zoom=14&maptype=satellite`}
                          allowFullScreen>
                        </iframe>
                        <button
                          className="btn-apply"
                          onClick={() => setShowMapPins(!showMapPins)}
                          style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '12px 24px',
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 10,
                            margin: 0,
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{showMapPins ? '🛰️' : '🏛️'}</span>
                          {showMapPins ? 'Satellite View' : 'Search Offices'}
                        </button>
                      </div>
                    ) : (
                      <div className="location-loading-state">
                        📍 Waiting for location access to show nearby government offices...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'fraud' && (
                <div className="tab-content taaza-dashboard">
                  <div className="fraud-header">
                    <div>
                      <h3>{t('tab_taaza')}</h3>
                      <p>{t('taaza_desc')}</p>
                    </div>
                  </div>

                  <div className="taaza-khabar-container">
                    <div className="marquee-wrapper">
                      <div className="marquee-content">
                        {taazaKhabarNews.map((news, index) => (
                          <div
                            key={news.id}
                            className="news-item curved-square"
                          >
                            <div className="news-header">
                              <span className="news-title">{news.title}</span>
                              <span className="news-meta">{news.date} | {news.time} IST</span>
                            </div>
                            <div className="news-desc">
                              {news.description}
                            </div>
                          </div>
                        ))}
                        {/* Duplicate for infinite scrolling effect */}
                        {taazaKhabarNews.map((news, index) => (
                          <div
                            key={`dup-${news.id}`}
                            className="news-item curved-square"
                          >
                            <div className="news-header">
                              <span className="news-title">{news.title}</span>
                              <span className="news-meta">{news.date} | {news.time} IST</span>
                            </div>
                            <div className="news-desc">
                              {news.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── MSP Tracker Tab ─── */}
              {activeTab === 'msp' && (
                <div className="tab-content">
                  <MSPTracker />
                </div>
              )}
            </main>
          </div>

          {/* WhatsApp Success Modal Overlay */}
          {whatsappStatus && (
            <div className="whatsapp-overlay">
              <div className="whatsapp-modal">
                {whatsappStatus === 'processing' ? (
                  <>
                    <div className="spinner"></div>
                    <h4>Processing Application...</h4>
                    <p>Connecting securely to government portals.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle size={56} color="#25D366" />
                    <h4 style={{ marginTop: '16px' }}>Application Successful!</h4>
                    <p>Future eligibility alerts and confirmation receipt have been linked to your registered mobile via <strong>WhatsApp (+91 8080484908)</strong>.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Floating Accessibility Widget */}
          <div className="accessibility-widget">
            <button className="accessibility-btn" onClick={() => setAccessibilityOpen(!accessibilityOpen)}>
              <Settings size={24} />
            </button>
            {accessibilityOpen && (
              <div className="accessibility-panel">
                <h4>Accessibility Tools</h4>

                <div className="acc-section">
                  <label>Theme</label>
                  <div className="acc-grid">
                    <div className={`acc-option ${!isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(false)}>
                      <Sun size={20} />
                      <span>Light Mode</span>
                    </div>
                    <div className={`acc-option ${isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(true)}>
                      <Moon size={20} />
                      <span>Dark Mode</span>
                    </div>
                  </div>
                </div>

                <div className="acc-section" style={{ marginTop: '16px' }}>
                  <label>Text Size</label>
                  <div className="acc-grid">
                    <div className="acc-option" onClick={() => setFontSizeMultiplier(prev => Math.min(prev + 0.1, 1.3))}>
                      <Type size={20} />
                      <span>Increase Text</span>
                    </div>
                    <div className="acc-option" onClick={() => setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.8))}>
                      <Type size={16} />
                      <span>Decrease Text</span>
                    </div>
                    <div className="acc-option" style={{ gridColumn: 'span 2' }} onClick={() => setFontSizeMultiplier(1)}>
                      <Settings size={20} />
                      <span>Reset Text</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inject VAPI Assistant Widget */}
          <VapiChatAssistant />
        </div>
      } />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;