import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
  Minimize2,
  Maximize2,
  Globe,
  Compass,
  LayoutDashboard,
  Sliders,
} from 'lucide-react';
import { aiVoiceAssistant, aiSiteController } from '../../api/client';
import { extractScreenContext } from '../../utils/screenContextExtractor';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoiceAgent } from '../../context/VoiceAgentContext';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', speechLang: 'en-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speechLang: 'ta-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', speechLang: 'hi-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speechLang: 'te-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', speechLang: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', speechLang: 'ml-IN' },
];

const UI_STRINGS = {
  en: {
    title: 'SilverVoice Co-Pilot',
    subtitle: 'Multilingual Voice & Text Assistant',
    listening: '🎙️ Listening to you...',
    speaking: '🔊 Speaking...',
    inputPlaceholder: 'Type or ask in voice...',
    listeningPlaceholder: 'Listening to your voice...',
    doneSpeaking: 'Done speaking',
    speakClearly: 'Listening... Speak clearly in your language',
    explore: 'Explore',
    listen: 'Listen',
    thinking: 'Thinking...',
    resetTooltip: 'Reset conversation',
    muteTooltip: 'Mute voice reading',
    unmuteTooltip: 'Unmute voice reading',
    langTooltip: 'Switch Language',
    networkErr: 'I had a temporary connection issue. Please feel free to browse our services or try again.'
  },
  ta: {
    title: 'சில்வர்வாய்ஸ் கோ-பைலட்',
    subtitle: 'பன்மொழி குரல் & உரை உதவியாளர்',
    listening: '🎙️ உங்கள் குரலைக் கேட்கிறது...',
    speaking: '🔊 பதிலளிக்கிறது...',
    inputPlaceholder: 'பேசவும் அல்லது தட்டச்சு செய்யவும்...',
    listeningPlaceholder: 'உங்கள் குரலைப் பதிவு செய்கிறது...',
    doneSpeaking: 'பேசி முடித்தேன்',
    speakClearly: 'கேட்கிறது... தமிழில் தெளிவாகப் பேசுங்கள்',
    explore: 'பார்வையிட',
    listen: 'கேட்க',
    thinking: 'சிந்திக்கிறது...',
    resetTooltip: 'உரையாடலை மீட்டமைக்க',
    muteTooltip: 'குரலை முடக்கு',
    unmuteTooltip: 'குரலை இயக்கு',
    langTooltip: 'மொழியை மாற்றவும்',
    networkErr: 'தொடர்பு பிழை ஏற்பட்டது. தயவுசெய்து எங்கள் சேவைகளை உலாவவும்.'
  },
  hi: {
    title: 'सिल्वरवॉइस को-पायलट',
    subtitle: 'बहुभाषी वॉइस एवं टेक्स्ट असिस्टेंट',
    listening: '🎙️ आपकी आवाज़ सुन रहा हूँ...',
    speaking: '🔊 उत्तर दे रहा हूँ...',
    inputPlaceholder: 'बोलें या टाइप करें...',
    listeningPlaceholder: 'आपकी आवाज़ सुनी जा रही है...',
    doneSpeaking: 'बोलना समाप्त',
    speakClearly: 'सुन रहा है... कृपया स्पष्ट बोलें',
    explore: 'देखें',
    listen: 'सुनें',
    thinking: 'सोच रहा है...',
    resetTooltip: 'बातचीत रीसेट करें',
    muteTooltip: 'आवाज़ बंद करें',
    unmuteTooltip: 'आवाज़ चालू करें',
    langTooltip: 'भाषा बदलें',
    networkErr: 'कनेक्शन में समस्या आई। कृपया पुनः प्रयास करें।'
  },
  te: {
    title: 'సిల్వర్‌వాయిస్ కో-పైలట్',
    subtitle: 'బహుభాషా వాయిస్ & టెక్స్ట్ అసిస్టెంట్',
    listening: '🎙️ మీ మాటలను వింటోంది...',
    speaking: '🔊 మాట్లాడుతోంది...',
    inputPlaceholder: 'మాట్లాడండి లేదా టైప్ చేయండి...',
    listeningPlaceholder: 'మీ వాయిస్ రికార్డ్ అవుతోంది...',
    doneSpeaking: 'పూర్తయింది',
    speakClearly: 'వింటోంది... తెలుగులో స్పష్టంగా మాట్లాడండి',
    explore: 'చూడండి',
    listen: 'వినండి',
    thinking: 'ఆలోచిస్తోంది...',
    resetTooltip: 'రీసెట్ చేయండి',
    muteTooltip: 'మ్యూట్ చేయండి',
    unmuteTooltip: 'అన్‌మ్యూట్ చేయండి',
    langTooltip: 'భాషను మార్చండి',
    networkErr: 'కనెక్షన్ సమస్య వచ్చింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
  },
  kn: {
    title: 'ಸಿಲ್ವರ್‌ವಾಯ್ಸ್ AI',
    subtitle: 'ಬಹುಭಾಷಾ ಧ್ವನಿ ಮತ್ತು ಪಠ್ಯ ಸಹಾಯಕ',
    listening: '🎙️ ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ...',
    speaking: '🔊 ಮಾತನಾಡುತ್ತಿದೆ...',
    inputPlaceholder: 'ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ...',
    listeningPlaceholder: 'ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    doneSpeaking: 'ಮುಗಿದಿದೆ',
    speakClearly: 'ಆಲಿಸುತ್ತಿದೆ... ಕನ್ನಡದಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ',
    explore: 'ನೋಡಿ',
    listen: 'ಕೇಳಿ',
    thinking: 'ಯೋಚಿಸುತ್ತಿದೆ...',
    resetTooltip: 'ಮರುಹೊಂದಿಸಿ',
    muteTooltip: 'ಮ್ಯೂಟ್ ಮಾಡಿ',
    unmuteTooltip: 'ಅನ್‌ಮ್ಯೂಟ್ ಮಾಡಿ',
    langTooltip: 'ಭಾಷೆ ಬದಲಾಯಿಸಿ',
    networkErr: 'ತಾತ್ಕಾಲಿಕ ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.'
  },
  ml: {
    title: 'സിൽവർവോയ്‌സ് AI',
    subtitle: 'ബഹുഭാഷാ വോയ്‌സ് & ടെക്സ്റ്റ് അസിസ്റ്റന്റ്',
    listening: '🎙️ ശബ്ദം കേൾക്കുന്നു...',
    speaking: '🔊 സംസാരിക്കുന്നു...',
    inputPlaceholder: 'സംസാരിക്കുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക...',
    listeningPlaceholder: 'വോയ്സ് റെക്കോർഡ് ചെയ്യുന്നു...',
    doneSpeaking: 'പൂർത്തിയായി',
    speakClearly: 'കേൾക്കുന്നു... മലയാളത്തിൽ വ്യക്തമായി സംസാരിക്കുക',
    explore: 'കാണുക',
    listen: 'കേൾക്കൂ',
    thinking: 'ചിന്തിക്കുന്നു...',
    resetTooltip: 'റീസെറ്റ് ചെയ്യുക',
    muteTooltip: 'മ്യൂട്ട് ചെയ്യുക',
    unmuteTooltip: 'അൺമ്യൂട്ട് ചെയ്യുക',
    langTooltip: 'ഭാഷ മാറ്റുക',
    networkErr: 'നെറ്റ്‌വർക്ക് തകരാർ. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
  }
};

const getMultilingualInitialMessage = (currentUser, lang = 'en') => {
  const langKey = UI_STRINGS[lang] ? lang : 'en';
  const displayName = currentUser
    ? currentUser.first_name || currentUser.name || currentUser.username || 'Friend'
    : '';
  const role = currentUser ? (currentUser.role || '').toUpperCase() : '';
  const isProvider =
    role === 'PROVIDER' ||
    currentUser?.is_staff ||
    ['lakshmi', 'meena', 'saraswathi', 'kamala'].includes(currentUser?.username);

  // 1. TAMIL
  if (langKey === 'ta') {
    if (isProvider) {
      return {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `வணக்கம் ${displayName}! நான் சில்வர்வாய்ஸ், உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர். 🌟\n\nஉங்கள் கைவினை சேவைகளை நிர்வகிக்க, புதிய தயாரிப்புகளைப் பட்டியலிட, நியாயமான விலையை சரிபார்க்க அல்லது வாய்ப்பு ரேடாரை ஆராய என்னிடம் பேசுங்கள்.`,
        spokenText: `வணக்கம் ${displayName}! நான் சில்வர்வாய்ஸ். உங்கள் கைவினைப் பட்டியல்கள் அல்லது ஆர்டர்களில் நான் இன்று எவ்வாறு உதவலாம்?`,
        suggestedActions: [
          'வாய்ப்பு ரேடார் பார்க்க',
          'நியாயமான விலை சரிபார்க்க',
          'கைவினைப் பொருட்களை எவ்வாறு சேர்ப்பது?',
          'AI சுயவிவர வழிகாட்டி',
        ],
        route: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } else if (currentUser) {
      return {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `வணக்கம் ${displayName}! நான் சில்வர்வாய்ஸ், உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர். 🌟\n\nபாரம்பரிய சமையல் கலைஞர்கள், தையல் வல்லுநர்கள், ஆசிரியர்கள் மற்றும் கைவினைப் பொருட்களைக் கண்டறிய பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.`,
        spokenText: `வணக்கம் ${displayName}! நான் சில்வர்வாய்ஸ். உங்களுக்கு இன்று எவ்வாறு உதவலாம்?`,
        suggestedActions: [
          'பாரம்பரிய சமையல் கலைஞர்கள்',
          'கைவினைப் பொருட்கள் வாங்க',
          'என் ஆர்டர்கள் & முன்பதிவுகள்',
          'நியாயமான விலை சரிபார்க்க',
        ],
        route: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: "வணக்கம்! நான் சில்வர்வாய்ஸ், உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர். 🌟\n\nபாரம்பரிய சமையல் கலைஞர்கள், தையல் வல்லுநர்கள், கைவினைப் பொருட்கள் மற்றும் நியாயமான கட்டணங்களை அறிய என்னிடம் கேளுங்கள்.",
      spokenText: "வணக்கம்! நான் உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர் சில்வர்வாய்ஸ். உங்களுக்கு இன்று எவ்வாறு உதவலாம்?",
      suggestedActions: [
        'பாரம்பரிய சமையல் கலைஞர்கள்',
        'கைவினைப் பொருட்கள்',
        'என் திறமைகளை பதிவு செய்ய',
        'நியாயமான விலை சரிபார்க்க',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 2. HINDI
  if (langKey === 'hi') {
    if (isProvider) {
      return {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `नमस्ते ${displayName}! मैं सिल्वरवॉइस हूँ, आपका AI वॉइस असिस्टेंट। 🌟\n\nअपनी सेवाओं का प्रबंधन करने, नए हस्तनिर्मित उत्पाद जोड़ने, उचित मूल्य जांचने या अपॉर्चुनिटी रडार देखने के लिए मुझसे बात करें।`,
        spokenText: `नमस्ते ${displayName}! मैं सिल्वरवॉइस हूँ। आज मैं आपकी सेवाओं या उत्पादों में क्या मदद कर सकता हूँ?`,
        suggestedActions: [
          'अपॉर्चुनिटी रडार देखें',
          'उचित मूल्य जांचें',
          'हस्तनिर्मित उत्पाद कैसे जोड़ें?',
          'AI प्रोफाइल विज़ार्ड',
        ],
        route: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } else if (currentUser) {
      return {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `नमस्ते ${displayName}! मैं सिल्वरवॉइस हूँ, आपका AI वॉइस असिस्टेंट। 🌟\n\nपारंपरिक रसोइयों, अनुभवी दर्जी, ट्यूटर्स और घर के बने अचार/सामग्री खोजने के लिए बोलें या लिखें।`,
        spokenText: `नमस्ते ${displayName}! मैं सिल्वरवॉइस हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?`,
        suggestedActions: [
          'पारंपरिक रसोइया खोजें',
          'हस्तनिर्मित उत्पाद खरीदें',
          'मेरी बुकिंग्स और ऑर्डर्स',
          'उचित मूल्य जांचें',
        ],
        route: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: "नमस्ते! मैं सिल्वरवॉइस हूँ, आपका सिल्वरहैंड्स AI वॉइस असिस्टेंट। 🌟\n\nपारंपरिक रसोइयों, दर्जी, शिक्षकों और हस्तनिर्मित उत्पादों की खोज के लिए बोलें या टाइप करें।",
      spokenText: "नमस्ते! मैं आपका सिल्वरहैंड्स AI वॉइस असिस्टेंट सिल्वरवॉइस हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?",
      suggestedActions: [
        'पारंपरिक रसोइया खोजें',
        'हस्तनिर्मित उत्पाद',
        'कौशल रजिस्टर करें',
        'उचित मूल्य जांचें',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 3. TELUGU
  if (langKey === 'te') {
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: `నమస్కారం ${displayName ? displayName : ''}! నేను సిల్వర్‌వాయిస్, మీ AI వాయిస్ అసిస్టెంట్. 🌟\n\nసంప్రదాయ వంట మనుషులు, దర్జీలు, చేతివృత్తుల ఉత్పత్తులు మరియు సరసమైన ధరల వివరాల కోసం మాట్లాడండి లేదా టైప్ చేయండి.`,
      spokenText: `నమస్కారం! నేను సిల్వర్‌వాయిస్. నేను మీకు ఎలా సహాయపడగలను?`,
      suggestedActions: [
        'వంట నిపుణులను కనుగొనండి',
        'హస్తకళల ఉత్పత్తులు',
        'ధర వివరాలు',
        'నైపుణ్య నమోదు',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 4. KANNADA
  if (langKey === 'kn') {
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: `ನಮಸ್ಕಾರ ${displayName ? displayName : ''}! ನಾನು ಸಿಲ್ವರ್‌ವಾಯ್ಸ್, ನಿಮ್ಮ AI ವಾಯ್ಸ್ ಸಹಾಯಕ. 🌟\n\nಸಾಂಪ್ರದಾಯಿಕ ಅಡುಗೆಯವರು, ಟೈಲರ್‌ಗಳು, ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ನ್ಯಾಯಯುತ ಬೆಲೆಗಳ ಮಾಹಿತಿಗಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.`,
      spokenText: `ನಮಸ್ಕಾರ! ನಾನು ಸಿಲ್ವರ್‌ವಾಯ್ಸ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
      suggestedActions: [
        'ಅಡುಗೆಯವರನ್ನು ಹುಡುಕಿ',
        'ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳು',
        'ಸರಿಯಾದ ಬೆಲೆ ಪರಿಶೀಲಿಸಿ',
        'ಕೌಶಲ್ಯ ನೋಂದಣಿ',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 5. MALAYALAM
  if (langKey === 'ml') {
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: `നമസ്കാരം ${displayName ? displayName : ''}! ഞാൻ സിൽവർവോയ്‌സ്, നിങ്ങളുടെ AI വോയ്‌സ് അസിസ്റ്റന്റ്. 🌟\n\nപരമ്പരാഗത പാചകക്കാർ, തയ്യൽക്കാർ, കരകൗശല ഉൽപ്പന്നങ്ങൾ എന്നിവ കണ്ടെത്താൻ സംസാരിക്കുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക.`,
      spokenText: `നമസ്കാരം! ഞാൻ സിൽവർവോയ്‌സ്. ഞാൻ എങ്ങനെ സഹായിക്കണം?`,
      suggestedActions: [
        'പാചകക്കാരെ കണ്ടെത്തുക',
        'കരകൗശಲ ഉൽപ്പന്നങ്ങൾ',
        'വില വിവരങ്ങൾ',
        'രജിസ്ട്രേഷൻ',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 6. DEFAULT (ENGLISH)
  if (isProvider) {
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: `Vanakkam ${displayName}! I'm SilverVoice, your SilverHands AI assistant. 🌟\n\nI can help you manage your artisanal services, list new handmade products, verify fair prices, or explore neighborhood demand on Opportunity Radar.`,
      spokenText: `Vanakkam ${displayName}! I am SilverVoice, your SilverHands AI assistant. How can I help with your artisanal listings or orders today?`,
      suggestedActions: [
        'View Opportunity Radar',
        'Check Fair Market Price',
        'How to add handmade crafts?',
        'Open AI Profile Wizard',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } else if (currentUser) {
    return {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: `Vanakkam ${displayName}! I'm SilverVoice, your SilverHands AI assistant. 🌟\n\nAsk me anything! Speak or type to discover verified senior cooks, master tailors, tutors, handmade pickles, cotton bags, or track your orders.`,
      spokenText: `Vanakkam ${displayName}! I am SilverVoice, your SilverHands AI assistant. How can I help you today?`,
      suggestedActions: [
        'Find Traditional Cooks',
        'Browse Handmade Products',
        'Check Fair Market Price',
        'Explore Opportunity Radar',
      ],
      route: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  return {
    id: `init-${Date.now()}`,
    sender: 'bot',
    text: "Vanakkam! I'm SilverVoice, your SilverHands AI assistant. 🌟\n\nAsk me anything! Speak or type to discover senior cooks, master tailors, tutors, handmade pickles, cotton bags, or check fair pricing.",
    spokenText: "Vanakkam! I am SilverVoice, your SilverHands AI assistant. How can I help you today?",
    suggestedActions: [
      'Find Traditional Cooks',
      'Browse Handmade Products',
      'How to list my skills?',
      'Check Fair Market Price',
    ],
    route: null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

// Helper to detect and cancel acoustic echo (when microphone hears the bot's own TTS playback)
const isAcousticEcho = (userSpoken, botSpoken) => {
  if (!userSpoken || !botSpoken) return false;
  const u = userSpoken.toLowerCase().replace(/[^a-zA-Z0-9஀-௿ऀ-ॿఀ-౿ಀ-೿ഀ-ൿ\s]/g, ' ').trim();
  const b = botSpoken.toLowerCase().replace(/[^a-zA-Z0-9஀-௿ऀ-ॿఀ-౿ಀ-೿ഀ-ൿ\s]/g, ' ').trim();
  
  if (!u || !b) return false;
  if (u === b) return true;
  if (b.includes(u) && u.length > 5) return true;
  if (u.includes(b) && b.length > 5) return true;

  const uWords = u.split(/\s+/).filter((w) => w.length > 2);
  const bWords = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (uWords.length >= 2) {
    const overlap = uWords.filter((w) => bWords.has(w)).length;
    if (overlap / uWords.length >= 0.6) {
      return true;
    }
  }
  return false;
};

export const FloatingVoiceBot = () => {
  const { user, token } = useAuth();
  const { language: globalLanguage } = useLanguage();
  const navigate = useNavigate();
  const { agentMode, setAgentMode, executeAction, pendingAction, confirmPendingAction, cancelPendingAction } = useVoiceAgent();

  const [activeLang, setActiveLang] = useState(globalLanguage || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true); // Continuous Live Agent active by default
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState(() => [getMultilingualInitialMessage(user, activeLang)]);
  const [screenInfo, setScreenInfo] = useState(() => extractScreenContext());
  const [isChatExpanded, setIsChatExpanded] = useState(false); // Default to minimal HUD in Controller mode

  // Periodically refresh screen snapshot when open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setScreenInfo(extractScreenContext());
      const interval = setInterval(() => {
        setScreenInfo(extractScreenContext());
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized]);

  const userKey = user?.id ? `${user.id}-${user.username}` : (token ? `token-${token.slice(-8)}` : 'guest');
  const previousUserKeyRef = useRef(userKey);
  const previousLangRef = useRef(activeLang);

  const isLiveModeRef = useRef(isLiveMode);
  const isOpenRef = useRef(isOpen);
  const isMinimizedRef = useRef(isMinimized);
  const isSpeakingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);
  const lastBotSpokenTextRef = useRef('');
  const restartTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const ui = UI_STRINGS[activeLang] || UI_STRINGS['en'];
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === activeLang) || SUPPORTED_LANGUAGES[0];

  const pendingActionRef = useRef(pendingAction);

  // Keep refs synchronized
  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
  }, [isLiveMode]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    isMinimizedRef.current = isMinimized;
    if (isOpen && !isMinimized && isLiveModeRef.current) {
      const timer = setTimeout(() => {
        if (!isSpeakingRef.current && !isLoadingRef.current) {
          startListening();
        }
      }, 80);
      return () => clearTimeout(timer);
    } else if (!isOpen || isMinimized) {
      stopListening();
    }
  }, [isOpen, isMinimized]);

  // Sync when global language context changes
  useEffect(() => {
    if (globalLanguage && globalLanguage !== activeLang) {
      setActiveLang(globalLanguage);
    }
  }, [globalLanguage]);

  // Refresh conversation when user changes or active language changes
  useEffect(() => {
    const userChanged = previousUserKeyRef.current !== userKey;
    const langChanged = previousLangRef.current !== activeLang;

    if (userChanged || langChanged) {
      previousUserKeyRef.current = userKey;
      previousLangRef.current = activeLang;

      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }

      setTranscript('');
      setInputText('');
      setIsLoading(false);
      isLoadingRef.current = false;
      setMessages([getMultilingualInitialMessage(user, activeLang)]);
    }
  }, [userKey, activeLang, user]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading, transcript]);

  useEffect(() => {
    return () => {
      isLiveModeRef.current = false;
      stopListening();
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleLanguageSelect = (langCode) => {
    setActiveLang(langCode);
    setShowLangMenu(false);
  };

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window) || !text) {
      if (isLiveModeRef.current && isOpenRef.current && !isMinimizedRef.current) {
        setTimeout(() => {
          if (isLiveModeRef.current && !isLoadingRef.current && !isProcessingRef.current) {
            startListening();
          }
        }, 80);
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      stopListening(); // Mute mic immediately

      // Immediately flag speaking synchronously to block any mic resumption
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      lastBotSpokenTextRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
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

      utterance.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      };

      const handleSpeechEnd = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        // Acoustic dissipation buffer: wait 650ms after TTS completely stops before restarting microphone
        if (isLiveModeRef.current && isOpenRef.current && !isMinimizedRef.current && !isLoadingRef.current && !isProcessingRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (
              isLiveModeRef.current &&
              isOpenRef.current &&
              !isSpeakingRef.current &&
              !isLoadingRef.current &&
              !isProcessingRef.current &&
              !isListeningRef.current &&
              (!window.speechSynthesis || !window.speechSynthesis.speaking)
            ) {
              startListening();
            }
          }, 80);
        }
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = handleSpeechEnd;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (isLiveModeRef.current && isOpenRef.current && !isMinimizedRef.current) {
        startListening();
      }
    }
  };

  const toggleMute = () => {
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    setIsMuted(!isMuted);
  };

  const toggleLiveMode = () => {
    const nextLive = !isLiveMode;
    setIsLiveMode(nextLive);
    isLiveModeRef.current = nextLive;
    if (nextLive) {
      startListening();
    } else {
      stopListening();
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        // Detach listeners before stopping to avoid duplicate onresult or onend triggers
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  const startListening = () => {
    if (
      isSpeakingRef.current ||
      isLoadingRef.current ||
      isProcessingRef.current ||
      (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking)
    ) {
      return;
    }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported by browser.');
      return;
    }

    try {
      stopListening();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = currentLangObj.speechLang || 'en-IN';
      recognition.continuous = true; // Continuous listening keeps microphone actively engaged
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event) => {
        if (
          isProcessingRef.current ||
          isLoadingRef.current ||
          isSpeakingRef.current ||
          (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking)
        ) {
          return;
        }

        let currentText = '';
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        setTranscript(currentText);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        // Wait for a full 2.2 second continuous silence gap before dispatching
        // so elders can speak complete complex sentences naturally without mid-sentence cutoffs
        silenceTimerRef.current = setTimeout(() => {
          if (
            currentText.trim() &&
            !isProcessingRef.current &&
            !isLoadingRef.current &&
            !isSpeakingRef.current &&
            (!window.speechSynthesis || !window.speechSynthesis.speaking)
          ) {
            const finalTranscript = currentText.trim();
            stopListening();
            handleSend(finalTranscript);
          }
        }, 2200);
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        if (event.error === 'not-allowed') {
          setIsLiveMode(false);
          isLiveModeRef.current = false;
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }
        console.warn('Speech recognition notice:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;

        // In continuous live mode, cleanly resume listening when idle
        if (
          isLiveModeRef.current &&
          isOpenRef.current &&
          !isMinimizedRef.current &&
          !isSpeakingRef.current &&
          !isLoadingRef.current &&
          !isProcessingRef.current &&
          (!window.speechSynthesis || !window.speechSynthesis.speaking)
        ) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (
              isLiveModeRef.current &&
              isOpenRef.current &&
              !isSpeakingRef.current &&
              !isLoadingRef.current &&
              !isProcessingRef.current &&
              !isListeningRef.current &&
              (!window.speechSynthesis || !window.speechSynthesis.speaking)
            ) {
              startListening();
            }
          }, 80);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start caught error:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      const pendingText = transcript.trim();
      stopListening();
      if (pendingText && !isProcessingRef.current && !isLoadingRef.current) {
        handleSend(pendingText);
      }
    } else {
      if (!isOpen) setIsOpen(true);
      if (isMinimized) setIsMinimized(false);
      setIsLiveMode(true);
      isLiveModeRef.current = true;
      startListening();
    }
  };

  const handleSend = async (messageText) => {
    const text = (messageText || inputText).trim();
    if (!text) return;

    // 1. Strict in-flight processing lock to prevent any duplicate execution
    if (isProcessingRef.current || isLoadingRef.current) {
      return;
    }

    // 2. Exact duplicate message suppression within 2 seconds
    const now = Date.now();
    if (text.toLowerCase() === lastProcessedTextRef.current.toLowerCase() && (now - lastProcessedTimeRef.current < 2000)) {
      return;
    }

    // 3. Acoustic Echo Suppression: Ignore if microphone picked up bot's own audio
    if (isAcousticEcho(text, lastBotSpokenTextRef.current)) {
      console.log('Suppressed acoustic echo of bot own speech:', text);
      return;
    }

    // Acquire lock immediately before any asynchronous gap
    isProcessingRef.current = true;
    isLoadingRef.current = true;
    lastProcessedTextRef.current = text;
    lastProcessedTimeRef.current = now;

        setInputText('');
    setTranscript('');
    stopListening();

    const lowerText = (text || '').toLowerCase().trim();

    // Check if elder is responding to a pending guardrail confirmation
    const activePending = pendingActionRef.current || pendingAction;
    if (activePending) {
      const cleanLower = lowerText.replace(/['’]/g, '').replace(/[.,?!:;_\-]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cleanLower.split(' ');

      // Differentiate between a request to cancel a specific item ("cancel my booking") vs a pure confirmation/rejection response
      const isNewCancelAction = words.some((w) => ['booking', 'order', 'appointment', 'item', 'first', 'second', '1st', '2nd', 'முன்பதி', 'ஆர்டர்', 'बुकिंग'].some(k => w.includes(k)));

      // Rejection / Cancellation phrases
      const cancelKeywords = [
        "dont place it", "dont retrieve it", "dont cancel",
        "do not place", "do not retrieve", "do not cancel", "dont place", "dont retrieve",
        "no", "dismiss", "dont", "never mind", "nevermind", "stop", "abort", "reject", "decline",
        "leave it", "keep it", "not now", "no cancel", "dont do it",
        // Tamil
        'வேண்டாம்', 'இல்லை', 'போடாதே', 'ஆர்டர் செய்யாதே', 'ரத்து செய்யாதே', 'நிறுத்து', 'இப்போது வேண்டாம்',
        // Hindi
        'नहीं', 'मत करो', 'ऑर्डर मत करो', 'रद्द मत करो', 'रहने दो', 'मत करना', 'अभी नहीं',
        // Telugu
        'వద్దు', 'చేయవద్దు',
        // Kannada
        'ಬೇಡ', 'ಮಾಡಬೇಡಿ',
        // Malayalam
        'വേണ്ട', 'ചെയ്യരുത്'
      ];

      // Confirmation phrases
      const confirmKeywords = [
        'yes', 'okay', 'ok', 'confirm', 'confirm it', 'place it', 'place order', 'place the order', 'place',
        'proceed', 'sure', 'do it', 'go ahead', 'accept', 'accept it', 'book it', 'book', 'submit', 'submit it',
        'yes cancel', 'yes place it', 'cancel it', 'yes do it', 'please', 'yeah', 'yep', 'correct', 'fine', 'alright',
        // Tamil
        'ஆமாம்', 'சரி', 'உறுதி செய்', 'உறுதி', 'ஆர்டர் செய்', 'ஆம்', 'சரி செய்', 'போடு', 'பதிவு செய்', 'நிச்சயமாக',
        // Hindi
        'हाँ', 'पुष्टि करें', 'पुष्टि', 'ऑर्डर करो', 'कर दो', 'हाँ करो', 'सही है', 'जरूर', 'बुक करो',
        // Telugu
        'అవును', 'సరే', 'ధృవీకరించు', 'ఆర్డర్ చేయండి',
        // Kannada
        'ಹೌದು', 'ಸರಿ', 'ಖಚಿತಪಡಿಸಿ', 'ಆರ್ಡರ್ ಮಾಡಿ',
        // Malayalam
        'അതെ', 'ശരി', 'ഉറപ്പാക്കുക', 'ഓർഡർ ചെയ്യുക'
      ];

      const isCancel = !isNewCancelAction && cancelKeywords.some((phrase) => {
        return cleanLower === phrase || cleanLower.startsWith(phrase + ' ') || cleanLower.includes(' ' + phrase + ' ') || cleanLower.endsWith(' ' + phrase) || (words.length <= 2 && words.includes(phrase));
      });

      const isConfirm = !isNewCancelAction && !isCancel && confirmKeywords.some((phrase) => {
        return cleanLower === phrase || cleanLower.startsWith(phrase + ' ') || cleanLower.includes(' ' + phrase + ' ') || cleanLower.endsWith(' ' + phrase) || (words.length <= 3 && words.includes(phrase));
      });

      if (isConfirm) {
        await confirmPendingAction();
        const confirmReply =
          activeLang === 'ta'
            ? 'உறுதி செய்யப்பட்டது. செயல்முறை வெற்றிகரமாக நிறைவேற்றப்பட்டது!'
            : activeLang === 'hi'
            ? 'पुष्टि हो गई। कार्य सफलतापूर्वक पूरा हुआ!'
            : 'Action confirmed and executed successfully!';
        const botMsg = {
          id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: 'bot',
          text: confirmReply,
          spokenText: confirmReply,
          suggestedActions: ['Explore Marketplace', 'My Bookings', 'My Orders'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          botMsg,
        ]);
        speakText(confirmReply);
        setIsLoading(false);
        isLoadingRef.current = false;
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 300);
        return;
      } else if (isCancel) {
        cancelPendingAction();
        const cancelReply =
          activeLang === 'ta'
            ? 'செயல்முறை ரத்து செய்யப்பட்டது.'
            : activeLang === 'hi'
            ? 'कार्य रद्द कर दिया गया।'
            : 'Action has been cancelled.';
        const botMsg = {
          id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: 'bot',
          text: cancelReply,
          spokenText: cancelReply,
          suggestedActions: ['Explore Marketplace', 'My Bookings', 'My Orders'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          botMsg,
        ]);
        speakText(cancelReply);
        setIsLoading(false);
        isLoadingRef.current = false;
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 300);
        return;
      } else if (!isNewCancelAction) {
        // If user changed the topic or issued a new navigation/search command, dismiss stale pending action
        cancelPendingAction();
      }
    }

    // Check for explicit user stop / close command in voice
    if (['stop', 'stop listening', 'close', 'bye', 'goodbye', 'நிறுத்து', 'रोकें', 'बंद करो', 'ఆపు', 'ನಿಲ್ಲಿಸು', 'നിർത്തുക'].includes(lowerText)) {
      setIsLiveMode(false);
      isLiveModeRef.current = false;
      stopListening();
      const closeMsg = {
        id: `bot-stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'bot',
        text: 'Live dialogue paused. You can tap the microphone or "Start Live" anytime to resume hands-free conversation.',
        spokenText: 'Live dialogue paused. Tap microphone anytime to resume.',
        suggestedActions: ['Start Live Agent', 'Find Traditional Cooks', 'Browse Products'],
        route: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, { id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, closeMsg]);
      speakText(closeMsg.spokenText);
      setIsLoading(false);
      isLoadingRef.current = false;
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
      return;
    }

    const userMsg = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => {
      // Prevent consecutive duplicate user messages
      const last = prev[prev.length - 1];
      if (last && last.sender === 'user' && last.text.trim().toLowerCase() === text.toLowerCase()) {
        return prev;
      }
      return [...prev, userMsg];
    });
    setIsLoading(true);

    // Track fast-path action to prevent double-execution
    let fastPathType = null;
    if (lowerText.includes('senior mode') || lowerText.includes('large text') || lowerText.includes('பெரிய எழுத்து') || lowerText.includes('சீனியர்') || lowerText.includes('सीनियर')) {
      executeAction({ type: 'TOGGLE_SENIOR_MODE' });
      fastPathType = 'TOGGLE_SENIOR_MODE';
    } else if (lowerText.includes('radar') || lowerText.includes('வாய்ப்பு') || lowerText.includes('ரேடார்') || lowerText.includes('रडार') || lowerText.includes('opportunity')) {
      executeAction({ type: 'NAVIGATE', target: '/radar' });
      fastPathType = 'NAVIGATE';
    } else if (lowerText.includes('wizard') || lowerText.includes('register') || lowerText.includes('பதிவு') || lowerText.includes('வழிகாட்டி') || lowerText.includes('रजिस्टर')) {
      executeAction({ type: 'NAVIGATE', target: '/register-voice' });
      fastPathType = 'NAVIGATE';
    }

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const currentScreen = extractScreenContext();
      let res;
      if (agentMode === 'controller') {
        res = await aiSiteController({
          message: text,
          history: historyPayload,
          language: activeLang,
          screen_context: currentScreen,
        });
      } else {
        res = await aiVoiceAssistant({
          message: text,
          history: historyPayload,
          language: activeLang,
          page_context: {
            path: currentScreen.path,
            title: currentScreen.title,
          },
        });
      }

      const data = res.data;

      // Autonomous Action Execution on client only if not already executed by fast-path
      if (data.action && data.action.type && data.action.type !== fastPathType) {
        executeAction(data.action);
      }

      const botMsg = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'bot',
        text: data.reply || "I'm here to help you connect with verified senior artisans and homemakers.",
        spokenText: data.spoken_text || data.reply,
        suggestedActions: data.suggested_actions || [],
        route: data.route_suggestion || null,
        action: data.action || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(botMsg.spokenText);
    } catch (error) {
      console.error('Voice Assistant API error:', error);
      const errorMsg = {
        id: `bot-err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'bot',
        text: ui.networkErr,
        spokenText: ui.networkErr,
        suggestedActions: [ui.explore + ' Services', ui.explore + ' Products'],
        route: '/services',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakText(errorMsg.spokenText);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 80);
    }
  };

  const handleResetChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    setMessages([getMultilingualInitialMessage(user, activeLang)]);
    if (isLiveModeRef.current) {
      startListening();
    }
  };

  const handleActionClick = (actionText) => {
    if (actionText === 'Start Live Agent' || actionText === 'நேரலையைத் தொடங்கு') {
      setIsLiveMode(true);
      isLiveModeRef.current = true;
      startListening();
      return;
    }
    handleSend(actionText);
  };

  const handleNavigate = (route) => {
    if (route) {
      navigate(route);
      setIsMinimized(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto max-w-[95vw]">
      {/* 1. Fully Collapsed Floating Trigger (when closed) */}
      {!isOpen && (
        <div className="relative group flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-warmgray-900/90 text-white text-xs font-semibold py-2 px-3.5 rounded-2xl shadow-warm-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-saffron animate-pulse" />
            <span>{currentLangObj.native} • SilverVoice AI</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsLiveMode(true);
              isLiveModeRef.current = true;
              startListening();
            }}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-med-blue-deep via-med-blue-dark to-med-blue-primary text-white shadow-warm-xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/50 focus:outline-none"
            title="Open SilverVoice Multilingual AI Assistant"
            aria-label="Open SilverVoice AI Assistant"
          >
            <div className="absolute -inset-1 rounded-full bg-med-blue-primary/30 animate-ping opacity-75 pointer-events-none" />
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Minimal HUD Controller Pill (Default in Controller Mode for maximum screen visibility) */}
      {isOpen && agentMode === 'controller' && !isChatExpanded && (
        <div className="bg-warmgray-900/95 backdrop-blur-md rounded-2xl shadow-warm-2xl border border-warmgray-700/80 p-2.5 flex items-center gap-3 text-white transition-all duration-300 animate-fade-in max-w-lg w-auto">
          {/* Mic / Live Action Pulse */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                : isSpeaking
                ? 'bg-med-blue-primary text-white animate-bounce ring-4 ring-med-blue-primary/30'
                : 'bg-warmgray-800 hover:bg-warmgray-700 text-white'
            }`}
            title={isListening ? 'Listening... Click to pause' : 'Click to speak'}
          >
            {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : isSpeaking ? <Volume2 className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-warmgray-400" />}
          </button>

          {/* Real-time Status / Transcript Info */}
          <div className="flex-1 min-w-[140px] max-w-[280px] truncate">
            {pendingAction ? (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 truncate">
                    Confirm Action
                  </span>
                </div>
                <p className="text-xs text-amber-200 truncate font-bold">
                  {transcript ? `"${transcript}"` : pendingAction.prompt}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isListening ? 'bg-red-400 animate-ping' : isSpeaking ? 'bg-med-blue-primary animate-pulse' : 'bg-green-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warmgray-300 truncate">
                    {isListening ? 'Listening (Continuous)' : isSpeaking ? 'Speaking Reply...' : 'Site Controller'}
                  </span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800/60 shrink-0">
                    {screenInfo.visible_items?.length || 0} items
                  </span>
                </div>
                <p className="text-xs text-white/90 truncate font-medium">
                  {transcript ? `"${transcript}"` : (messages[messages.length - 1]?.text || 'Say "Open #1", "Order this", "Radar"...')}
                </p>
              </div>
            )}
          </div>

          {/* Quick Controls / Confirmation Buttons */}
          {pendingAction ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => confirmPendingAction()}
                className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                title="Confirm action"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
              <button
                type="button"
                onClick={() => cancelPendingAction()}
                className="px-2 py-1.5 bg-warmgray-800 hover:bg-warmgray-700 text-warmgray-300 hover:text-white text-xs font-medium rounded-xl border border-warmgray-700 transition-all active:scale-95 flex items-center gap-1"
                title="Cancel action"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsChatExpanded(true)}
                className="px-2.5 py-1.5 bg-warmgray-800 hover:bg-warmgray-700 text-warmgray-200 text-xs font-semibold rounded-xl border border-warmgray-700 transition-all flex items-center gap-1"
                title="View full chat history & messages"
              >
                <span>💬</span>
                <span className="hidden sm:inline text-[11px]">Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setAgentMode('chatbot')}
                className="px-2 py-1.5 bg-warmgray-800 hover:bg-warmgray-700 text-warmgray-300 text-[11px] font-semibold rounded-xl border border-warmgray-700 transition-all"
                title="Switch to Conversational Chatbot"
              >
                Q&A
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl text-warmgray-400 hover:text-white hover:bg-warmgray-800 transition-colors"
                title="Close Controller"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Full Expanded Chat Window (in Chatbot mode or when user explicitly taps Chat History) */}
      {isOpen && (agentMode === 'chatbot' || isChatExpanded) && (
        <div
          className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-warm-2xl border border-warmgray-200 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'w-72 h-14 shadow-warm'
              : 'w-[94vw] sm:w-[410px] md:w-[430px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-med-blue-deep to-med-blue-primary px-4 py-3 text-white flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-heading font-bold text-sm tracking-wide">{ui.title}</h3>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-med-blue-light" /> {currentLangObj.native}
                  </span>
                  <button
                    type="button"
                    onClick={toggleLiveMode}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                      isLiveMode
                        ? 'bg-red-500 text-white shadow-xs animate-pulse ring-2 ring-red-300'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                    title={isLiveMode ? 'Live Mode Active: Continuous hands-free listening' : 'Click to enable hands-free Live Mode'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-white' : 'bg-red-400'}`} />
                    {isLiveMode ? '🔴 LIVE ON' : '⏸️ PAUSED'}
                  </button>
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-med-blue-light font-sans">
                    {isListening ? ui.listening : isSpeaking ? ui.speaking : (agentMode === 'controller' ? '🕹️ Autonomous Website Controller' : '💬 Conversational Q&A Assistant')}
                  </p>
                )}
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              {agentMode === 'controller' && (
                <button
                  type="button"
                  onClick={() => setIsChatExpanded(false)}
                  className="px-2 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                  title="Minimize back to compact HUD bar"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>HUD</span>
                </button>
              )}

              {!isMinimized && (
                <>
                  {/* Language Switcher Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white flex items-center gap-1 text-xs font-semibold"
                      title={ui.langTooltip}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px] uppercase font-bold">{activeLang}</span>
                    </button>

                    {/* Language Dropdown Menu */}
                    {showLangMenu && (
                      <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-warm-2xl border border-warmgray-200 py-1.5 z-50 text-warmgray-900 animate-fade-in">
                        <div className="px-3 py-1 text-[10px] font-bold text-warmgray-400 uppercase tracking-wider border-b border-warmgray-100">
                          Languages
                        </div>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-cream-100 transition-colors ${
                              activeLang === lang.code ? 'text-saffron-dark font-bold bg-amber-50' : ''
                            }`}
                          >
                            <span>{lang.native}</span>
                            <span className="text-[10px] text-warmgray-400 uppercase">{lang.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={toggleMute}
                    className={`p-1.5 rounded-xl hover:bg-white/20 transition-colors ${
                      isMuted ? 'text-white/60' : 'text-white'
                    }`}
                    title={isMuted ? ui.unmuteTooltip : ui.muteTooltip}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleResetChat}
                    className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
                    title={ui.resetTooltip}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  stopListening();
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body & Messages Area */}
          {!isMinimized && (
            <>
              {/* Mode Switcher Tabs: Controller vs Chatbot */}
              <div className="bg-warmgray-900 text-white px-3 py-2 border-b border-warmgray-800 flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-1.5 bg-warmgray-800/90 p-0.5 rounded-xl border border-warmgray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setAgentMode('controller');
                      setIsChatExpanded(false); // minimize to HUD in controller mode
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      agentMode === 'controller'
                        ? 'bg-gradient-to-r from-med-blue-primary to-med-blue-dark text-white shadow-sm'
                        : 'text-warmgray-400 hover:text-white'
                    }`}
                  >
                    <span>🕹️</span>
                    <span>Site Controller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentMode('chatbot')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      agentMode === 'chatbot'
                        ? 'bg-gradient-to-r from-med-blue-primary to-med-blue-dark text-white shadow-sm'
                        : 'text-warmgray-400 hover:text-white'
                    }`}
                  >
                    <span>💬</span>
                    <span>Voice Chatbot</span>
                  </button>
                </div>

                {agentMode === 'controller' && (
                  <div className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/50 truncate max-w-[130px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">{screenInfo.visible_items?.length || 0} items on screen</span>
                  </div>
                )}
              </div>

              {/* Quick Language Switcher Bar */}
              <div className="bg-amber-50/80 px-3 py-1.5 border-b border-amber-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-saffron" /> Lang:
                </span>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                      activeLang === lang.code
                        ? 'bg-saffron text-white shadow-xs scale-105'
                        : 'bg-white text-warmgray-700 hover:bg-amber-100/60 border border-warmgray-200'
                    }`}
                  >
                    {lang.native}
                  </button>
                ))}
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[88%] ${
                        msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          msg.sender === 'user'
                            ? 'bg-saffron text-white shadow-xs'
                            : 'bg-gradient-to-tr from-warmgray-800 to-warmgray-900 text-amber-300 shadow-xs'
                        }`}
                      >
                        {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-saffron text-white rounded-tr-xs shadow-warm-sm font-medium'
                            : 'bg-white text-warmgray-900 rounded-tl-xs shadow-warm-sm border border-warmgray-200/80 font-sans'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {msg.route && (
                          <div className="mt-3 pt-2.5 border-t border-warmgray-100 flex items-center justify-between">
                            <button
                              onClick={() => handleNavigate(msg.route)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-saffron/10 hover:bg-saffron/20 text-saffron-dark font-bold text-xs rounded-xl transition-all"
                            >
                              <span>{ui.explore} {msg.route.replace('/', '').toUpperCase() || 'Page'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {msg.sender === 'bot' && msg.spokenText && (
                          <div className="mt-2 flex items-center justify-between text-[11px] text-warmgray-400">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => speakText(msg.spokenText)}
                              className="flex items-center gap-1 hover:text-saffron transition-colors"
                              title="Listen to this reply"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{ui.listen}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="text-[11px] font-semibold bg-white hover:bg-cream-100 text-warmgray-700 hover:text-saffron-dark border border-warmgray-200/80 px-2.5 py-1 rounded-xl shadow-xs transition-all active:scale-95"
                          >
                            ⚡ {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {pendingAction && (
                  <div className="mx-1 my-2 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 shadow-warm-sm animate-slide-up">
                    <div className="flex items-center gap-2 text-amber-800 mb-1">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        Elder Guardrail Confirmation
                      </span>
                    </div>
                    <p className="text-xs text-warmgray-900 font-bold mb-2.5">
                      {pendingAction.prompt}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => confirmPendingAction()}
                        className="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm (Yes)
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelPendingAction()}
                        className="flex-1 py-1.5 px-3 bg-white hover:bg-warmgray-100 text-warmgray-700 text-xs font-semibold rounded-xl border border-warmgray-300 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel (No)
                      </button>
                    </div>
                    <p className="text-[10px] text-warmgray-500 mt-2 text-center">
                      🎙️ Say <strong>"YES"</strong> / <strong>"ஆமாம்"</strong> / <strong>"हाँ"</strong> or <strong>"NO"</strong> / <strong>"வேண்டாம்"</strong>
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-warmgray-800 text-amber-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-3 shadow-warm-sm border border-warmgray-200">
                      <div className="flex items-center gap-1.5 text-xs text-warmgray-500 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-saffron animate-spin" />
                        <span>{ui.thinking}</span>
                        <div className="flex gap-1 ml-1">
                          <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Listening Active Visualizer Overlay */}
              {isListening && (
                <div className="px-4 py-3 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-t border-b border-red-200 flex flex-col gap-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-red-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      {isLiveMode ? '🔴 LIVE (Listening continuously)' : ui.speakClearly}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsLiveMode(false);
                          isLiveModeRef.current = false;
                          stopListening();
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all"
                        title="Stop Live Agent and pause listening"
                      >
                        ⏹️ Stop Live
                      </button>
                      <button
                        onClick={stopListening}
                        className="text-[11px] underline hover:text-red-800"
                      >
                        {ui.doneSpeaking}
                      </button>
                    </div>
                  </div>
                  {transcript ? (
                    <p className="text-xs text-warmgray-800 italic font-medium bg-white/70 p-2 rounded-xl border border-red-100">
                      "{transcript}"
                    </p>
                  ) : (
                    <div className="flex items-center justify-center py-1 gap-1">
                      <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse [animation-delay:0.1s]" />
                      <span className="w-1 h-7 bg-red-600 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse [animation-delay:0.3s]" />
                      <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              )}

              {/* Input Control Bar */}
              <div className="p-3 bg-white border-t border-warmgray-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-warm-sm ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                      : 'bg-cream-100 hover:bg-cream-200 text-saffron-dark'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start speaking'}
                  aria-label="Voice input toggle"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputText.trim() && !isProcessingRef.current && !isLoadingRef.current) { handleSend(inputText.trim()); }
                  }}
                  className="flex-1 flex items-center gap-1.5"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? ui.listeningPlaceholder : ui.inputPlaceholder}
                    className="flex-1 bg-cream-50 border border-warmgray-200 text-warmgray-900 rounded-2xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
                    disabled={isLoading || isListening}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="w-10 h-10 rounded-2xl bg-saffron hover:bg-saffron-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-warm-sm transition-all"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
