import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Award,
  Globe,
  User,
  Briefcase,
  Phone,
  Lock,
  MapPin,
  Tag,
  DollarSign,
  Clock,
  Sparkle
} from 'lucide-react';
import { aiVoiceRegisterAnalyze, aiVoiceRegisterSubmit } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', native: 'English', speechLang: 'en-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speechLang: 'ta-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', speechLang: 'hi-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speechLang: 'te-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', speechLang: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', speechLang: 'ml-IN' },
];

export const VoiceRegisterPage = () => {
  const { language: globalLang } = useLanguage();
  const { login: authLogin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [activeLang, setActiveLang] = useState(globalLang || 'en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [transcript, setTranscript] = useState('');
  const [voicePromptText, setVoicePromptText] = useState('');
  
  // Registration Form State (Auto-filled by AI)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    role: 'PROVIDER',
    experience_years: 0,
    skills: [],
    category_slug: 'cooking',
    service_title: '',
    service_description: '',
    suggested_price: 600,
    pricing_unit: 'per service',
    is_senior: true
  });

  const [missingFields, setMissingFields] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentLangObj = SUPPORTED_LANGS.find(l => l.code === activeLang) || SUPPORTED_LANGS[0];

  // Sync with global language on mount or change
  useEffect(() => {
    if (globalLang && globalLang !== activeLang) {
      setActiveLang(globalLang);
    }
  }, [globalLang]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window) || !text) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const speechLangCode = currentLangObj.speechLang || 'en-IN';
      utterance.lang = speechLangCode;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang === speechLangCode ||
          v.lang.replace('_', '-').startsWith(activeLang) ||
          v.lang.toLowerCase().includes(activeLang) ||
          v.lang.includes('en-IN') ||
          v.name.includes('India')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser. You can type directly in the fields below.');
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = currentLangObj.speechLang || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // Auto-trigger analysis after 2.2 seconds of silence
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentText.trim()) {
            stopListening();
            handleAnalyzeSpeech(currentText.trim());
          }
        }, 2200);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleAnalyzeSpeech(transcript.trim());
      }
    } else {
      startListening();
    }
  };

  const handleAnalyzeSpeech = async (spokenText) => {
    if (!spokenText || isAnalyzing) return;
    setIsAnalyzing(true);
    setHasStarted(true);

    try {
      const res = await aiVoiceRegisterAnalyze({
        speech_text: spokenText,
        current_data: formData,
        language: activeLang
      });

      const data = res.data;
      const extracted = data.extracted_data || {};
      
      setFormData(prev => ({
        ...prev,
        ...extracted,
        skills: extracted.skills || prev.skills || [],
        experience_years: extracted.experience_years !== undefined ? extracted.experience_years : prev.experience_years,
        suggested_price: extracted.suggested_price !== undefined ? extracted.suggested_price : prev.suggested_price,
      }));

      setMissingFields(data.missing_fields || []);
      setCompletionPercentage(data.completion_percentage || 0);

      const promptMsg = data.voice_prompt || data.bot_message || '';
      setVoicePromptText(promptMsg);
      speakText(promptMsg);

      showToast(`AI extracted your details (${data.completion_percentage || 0}% Complete)`, 'success');
    } catch (err) {
      console.error('Voice registration analyze error:', err);
      showToast('AI analysis error. Please verify your fields or try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    setActiveLang(langCode);
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Recalculate basic completion percentage locally
      let count = 0;
      if (updated.first_name) count++;
      if (updated.phone || updated.email) count++;
      if (updated.password) count++;
      if (updated.address) count++;
      if (updated.role === 'PROVIDER') {
        if (updated.experience_years > 0) count++;
        if (updated.skills && updated.skills.length > 0) count++;
        if (updated.service_title) count++;
        if (updated.suggested_price > 0) count++;
        setCompletionPercentage(Math.min(100, Math.round((count / 8) * 100)));
      } else {
        setCompletionPercentage(Math.min(100, Math.round((count / 4) * 100)));
      }
      return updated;
    });
  };

  const handleSubmitRegistration = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.first_name) {
      showToast('Please provide your name to register.', 'error');
      return;
    }
    if (!formData.password) {
      showToast('Please provide a password for your account.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        preferred_language: activeLang
      };

      const res = await aiVoiceRegisterSubmit(payload);
      const data = res.data;

      if (data.token && data.user) {
        // Save to AuthContext and localStorage
        localStorage.setItem('sh_token', data.token);
        if (data.refresh) localStorage.setItem('sh_refresh', data.refresh);
        localStorage.setItem('sh_user', JSON.stringify(data.user));

        showToast('🎉 Account & Skill Passport created successfully! Welcome to SilverHands.', 'success');
        
        // Redirect to dashboard if provider, or home if customer
        if (data.user.role === 'PROVIDER') {
          navigate('/provider/dashboard');
        } else {
          navigate('/');
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      const errMsg = err.response?.data?.error || 'Registration failed. Please check your fields.';
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setTranscript('');
    setVoicePromptText('');
    setHasStarted(false);
    setMissingFields([]);
    setCompletionPercentage(0);
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      role: 'PROVIDER',
      experience_years: 0,
      skills: [],
      category_slug: 'cooking',
      service_title: '',
      service_description: '',
      suggested_price: 600,
      pricing_unit: 'per service',
      is_senior: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8 px-2 sm:px-4 animate-fade-in">
      
      {/* 1. Header & Language Selection Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200 text-xs font-bold shadow-warm-sm">
          <Sparkles className="w-3.5 h-3.5 text-saffron animate-pulse" />
          <span>Multilingual Voice AI Onboarding</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-warmgray-900 tracking-tight">
          Voice-Guided Registration
        </h1>

        <p className="text-xs sm:text-sm text-warmgray-600 max-w-xl mx-auto">
          Speak your story, practical skills, and experience naturally in your native language. Our AI automatically organizes your profile, detects your craft services, and prepares your verified Skill Passport.
        </p>

        {/* 6-Language Switcher Pills */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
          {SUPPORTED_LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeLang === lang.code
                  ? 'bg-saffron text-white shadow-warm scale-105'
                  : 'bg-white text-warmgray-700 hover:bg-cream-100 border border-warmgray-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{lang.native}</span>
              <span className="text-[10px] opacity-75 uppercase">({lang.code})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Microphone Card */}
      <div className="card-surface p-6 sm:p-8 rounded-3xl shadow-warm-xl border-2 border-saffron/30 text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-white via-cream-50/50 to-white">
        
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-warmgray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkle className="w-3.5 h-3.5 text-saffron" /> Voice Input ({currentLangObj.native})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isMuted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded-xl border border-warmgray-200 hover:bg-cream-100 text-warmgray-600 transition-colors"
              title={isMuted ? 'Unmute AI voice questions' : 'Mute AI voice questions'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-saffron" />}
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl border border-warmgray-200 hover:bg-cream-100 text-warmgray-600 transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Reset Voice Form"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Big Pulsating Mic Button */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-36 h-36 bg-saffron/20 rounded-full animate-ping pointer-events-none" />
                <div className="absolute w-44 h-44 bg-med-blue-primary/10 rounded-full animate-pulse pointer-events-none" />
              </>
            )}
            <button
              type="button"
              onClick={handleToggleListening}
              disabled={isAnalyzing}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white shadow-warm-2xl transition-all duration-300 transform active:scale-95 ${
                isListening
                  ? 'bg-gradient-to-tr from-red-500 to-rose-600 scale-110 ring-4 ring-red-200'
                  : isAnalyzing
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 animate-pulse'
                  : 'bg-gradient-to-tr from-med-blue-deep via-med-blue-dark to-med-blue-primary hover:scale-105'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Tap to Stop</span>
                </>
              ) : isAnalyzing ? (
                <>
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Analyzing</span>
                </>
              ) : (
                <>
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Tap to Speak</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">
              {isListening
                ? '🎙️ Listening to your story... Speak freely in ' + currentLangObj.native
                : isAnalyzing
                ? '🧠 Gemini AI is structuring your experience...'
                : hasStarted
                ? 'Tap the microphone to speak more details or answer AI questions'
                : 'Tap the microphone & tell us about yourself'}
            </h3>
            <p className="text-xs text-warmgray-500 max-w-md mx-auto italic">
              {isListening
                ? 'Auto-analyzes automatically when you pause speaking for 2 seconds.'
                : 'Example: "My name is Meena Rajaram. I live in Mylapore, Chennai. I have 20 years experience in tailoring and blouse designing. My phone is 9840123456."'}
            </p>
          </div>
        </div>

        {/* Live Spoken Transcript */}
        {transcript && (
          <div className="p-4 rounded-2xl bg-cream-100 border border-warmgray-200 text-left animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-saffron uppercase tracking-wider flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" /> Spoken Transcript
              </span>
              <span className="text-[10px] text-warmgray-500 font-medium">Listening ({currentLangObj.native})</span>
            </div>
            <p className="text-sm font-medium text-warmgray-900 leading-relaxed italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* AI Voice Question / Prompt Banner */}
        {voicePromptText && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2 animate-fade-in shadow-warm-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-saffron" />
                <span>AI Assistant Response & Next Step</span>
              </div>
              <button
                onClick={() => speakText(voicePromptText)}
                className="text-xs font-bold text-saffron flex items-center gap-1 hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Voice
              </button>
            </div>
            <p className="text-sm text-warmgray-800 font-medium leading-relaxed">
              {voicePromptText}
            </p>
          </div>
        )}

        {/* Progress & Missing Fields Status Meter */}
        {hasStarted && (
          <div className="space-y-3 pt-2 border-t border-warmgray-100 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-warmgray-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sage" /> Profile Completion
              </span>
              <span className={completionPercentage === 100 ? 'text-green-600' : 'text-saffron-dark'}>
                {completionPercentage}% Complete
              </span>
            </div>

            <div className="w-full bg-cream-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPercentage === 100
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-med-blue-dark to-med-blue-primary'
                }`}
                style={{ width: `${Math.max(5, completionPercentage)}%` }}
              />
            </div>

            {/* Missing Fields Checklist Chips */}
            {missingFields.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Missing Required Fields:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map(m => (
                    <span
                      key={m.field}
                      className="px-2.5 py-1 rounded-xl bg-white border border-red-300 text-red-700 text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <Mic className="w-3 h-3 text-red-500" />
                      <span>{m.label}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-red-700 italic">
                  Tap the mic to speak these remaining details or type them in the fields below.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-2 text-xs font-bold text-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>All required registration fields are complete! Ready to create your account.</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. Interactive Form & AI Proposal Preview */}
      <div className="card-surface p-6 sm:p-8 rounded-3xl shadow-warm-xl border border-warmgray-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-warmgray-100">
          <div>
            <h2 className="font-heading text-xl font-bold text-warmgray-900">
              Extracted Profile & Service Proposal
            </h2>
            <p className="text-xs text-warmgray-500">
              Review and edit any field directly. Changes are automatically saved.
            </p>
          </div>
          <span className="badge-tag bg-cream-200 text-warmgray-800 font-bold">
            Role: {formData.role}
          </span>
        </div>

        <form onSubmit={handleSubmitRegistration} className="space-y-5">
          
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1.5">Registering As:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFieldChange('role', 'PROVIDER')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  formData.role === 'PROVIDER'
                    ? 'border-saffron bg-saffron-50 text-saffron-dark shadow-warm-sm'
                    : 'border-warmgray-200 bg-cream-50 text-warmgray-600'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>👩🏽‍🍳 Homemaker / Artisan Provider</span>
              </button>

              <button
                type="button"
                onClick={() => handleFieldChange('role', 'CUSTOMER')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  formData.role === 'CUSTOMER'
                    ? 'border-sage bg-sage-50 text-sage-dark shadow-warm-sm'
                    : 'border-warmgray-200 bg-cream-50 text-warmgray-600'
                }`}
              >
                <User className="w-4 h-4" />
                <span>🛍️ Customer / Buyer</span>
              </button>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                placeholder="e.g. Meena"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                placeholder="e.g. Rajaram"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                placeholder="e.g. meena_rajaram"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="e.g. 9840123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Account Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="e.g. demo1234"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Location / Neighborhood *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="e.g. Mylapore, Chennai"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="e.g. meena@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>
          </div>

          {/* Provider Specific Service & Craft Details */}
          {formData.role === 'PROVIDER' && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm border-b border-amber-200 pb-2">
                <Award className="w-4 h-4 text-saffron" />
                <span>AI Extracted Craft, Skills & Service Offering</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">Years of Practical Experience *</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => handleFieldChange('experience_years', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 20"
                    min="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">Service Category *</label>
                  <select
                    value={formData.category_slug}
                    onChange={(e) => handleFieldChange('category_slug', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                  >
                    <option value="cooking">Traditional Cooking & Baking</option>
                    <option value="tailoring">Tailoring & Stitching</option>
                    <option value="tutoring">Tutoring & Language Lessons</option>
                    <option value="wellness">Traditional Care & Wellness</option>
                    <option value="gardening">Terrace Gardening & Plants</option>
                    <option value="handcrafts">Handcrafts & Embroidery</option>
                    <option value="maintenance">Home Repair & Craft Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">Fair Market Rate (₹) *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.suggested_price}
                      onChange={(e) => handleFieldChange('suggested_price', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 600"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                    />
                    <select
                      value={formData.pricing_unit}
                      onChange={(e) => handleFieldChange('pricing_unit', e.target.value)}
                      className="px-2 py-2.5 rounded-xl border border-warmgray-300 bg-white text-xs font-medium"
                    >
                      <option value="per service">per service</option>
                      <option value="per hour">per hour</option>
                      <option value="per day">per day</option>
                      <option value="per piece">per piece</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Extracted Practical Skills</label>
                <input
                  type="text"
                  value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                  onChange={(e) => handleFieldChange('skills', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="e.g. Saree Blouse Stitching, Aari Work, Garment Alterations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Service Listing Title *</label>
                <input
                  type="text"
                  value={formData.service_title}
                  onChange={(e) => handleFieldChange('service_title', e.target.value)}
                  placeholder="e.g. Custom Saree Blouse Stitching & Alterations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Artisan Bio & Service Description</label>
                <textarea
                  rows={2}
                  value={formData.service_description}
                  onChange={(e) => handleFieldChange('service_description', e.target.value)}
                  placeholder="Warm summary of your craft background and service offering..."
                  className="w-full p-3 rounded-xl border border-warmgray-300 bg-white text-sm font-medium"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center">
            <button
              type="button"
              onClick={handleToggleListening}
              className="w-full sm:w-1/2 btn-secondary !py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 text-saffron" />
              <span>{isListening ? 'Stop Speaking' : 'Speak More Details'}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !formData.first_name || !formData.password}
              className="w-full sm:w-1/2 btn-primary !py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-warm-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'Creating Account & Passport...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>

      <div className="text-center text-xs text-warmgray-600">
        Prefer traditional form typing?{' '}
        <Link to="/register" className="font-bold text-saffron hover:underline">
          Standard Registration Form
        </Link>
      </div>

    </div>
  );
};
