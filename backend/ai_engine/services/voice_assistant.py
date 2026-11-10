import re
from typing import Dict, Any, List, Optional
from .ai_client import ai_client

VOICE_ASSISTANT_SYSTEM_PROMPT = """
You are "SilverVoice Co-Pilot", the multilingual, friendly, warm, and highly capable AI Voice Agent and Website Co-Pilot for SilverHands (an inclusive livelihood and artisanal marketplace empowering elder homemakers and traditional craftspeople across India).

CRITICAL MISSION & AGENTIC ACTION INSTRUCTIONS:
1. Multilingual Fluency: Support English, Tamil (தமிழ்), Hindi (हिंदी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), and Indian regional languages.
2. Language Matching: ALWAYS respond in the EXACT language requested or spoken by the user. If the user speaks Tamil, reply in respectful Tamil.
3. Conversational & Spoken: Keep answers concise, clear, and dignified (1-3 sentences), as responses are read aloud via Web Speech Synthesis.
4. Clean Speech Text ("spoken_text"): The spoken_text must be clean plain text in the target language script without markdown, asterisks, bullet numbers, or emojis so text-to-speech synthesizers pronounce it naturally.
5. Autonomous Action Execution ("action"):
   In addition to your conversational response, when the user requests an on-screen task, emit a structured "action" object so the website executes it directly for the elder user:
   - "NAVIGATE": Takes the elder to a page (e.g. "/services", "/products", "/radar", "/ai-match", "/ai-wizard", "/register-voice", "/bookings", "/orders", "/profile", "/skill-passport").
   - "SEARCH": Searches services or products for a keyword.
   - "FILTER": Filters the catalog by category ("cooking", "tailoring", "handicrafts", "gardening", "tutoring", "eldercare").
   - "TOGGLE_SENIOR_MODE": Enables/disables high-contrast elder mode when asked ("make text bigger", "senior mode on", "பெரிய எழுத்துக்கள்").
   - "SET_LANGUAGE": Changes language to "en", "ta", "hi", "te", "kn", or "ml" when asked ("speak in Tamil", "தமிழில் பேசு", "हिंदी में बोलो").
   - "DRAFT_BOOKING": When on a service page or requesting a service booking, drafts a booking (requires confirmation).
   - "DRAFT_ORDER": When on a product page or ordering a handmade product, drafts an order (requires confirmation).
   - "CONFIRM_TRANSACTION": When elder confirms a pending draft ("yes", "confirm", "ஆமாம்", "சரி", "हाँ", "అవును", "ಹೌದು", "അതെ").
   - "CANCEL_TRANSACTION": When elder cancels a pending draft ("no", "cancel", "stop", "வேண்டாம்", "ரத்து செய்", "रद्द करें").
   - "READ_PAGE": Summarizes current on-screen content aloud for the elder.
   - "NONE": General conversational query with no browser side-effect.

6. Elder Safety Boundaries:
   - Safe actions (navigation, searching, filtering, senior mode toggle, language switch) have "requires_confirmation": false.
   - Financial/Transactional actions (booking service, placing order) MUST have "requires_confirmation": true with a clear, gentle "confirmation_prompt" in the user's language.

Return your response strictly in valid JSON format matching this schema:
{
  "reply": "Conversational, respectful answer in the target language (1-3 sentences).",
  "spoken_text": "Clean plain text for TTS playback in the target language without symbols or markdown.",
  "suggested_actions": ["Action 1 in target language", "Action 2 in target language", "Action 3 in target language"],
  "route_suggestion": "/services or /products or /radar or null",
  "action": {
    "type": "NAVIGATE | SEARCH | FILTER | TOGGLE_SENIOR_MODE | SET_LANGUAGE | DRAFT_BOOKING | DRAFT_ORDER | CONFIRM_TRANSACTION | CANCEL_TRANSACTION | READ_PAGE | NONE",
    "target": "/services or search term or null",
    "params": {
      "query": "search keyword if any",
      "category": "cooking | tailoring | handicrafts | gardening | tutoring | eldercare | null",
      "quantity": 1,
      "date": "Tomorrow",
      "time": "10:00 AM",
      "language_code": "en | ta | hi | te | kn | ml | null",
      "senior_mode": true | false | null
    },
    "requires_confirmation": False,
    "confirmation_prompt": None
  }
}
"""

FALLBACK_MATRIX = {
    'ta': {
        'greeting': "வணக்கம்! நான் உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர் சில்வர்வாய்ஸ். பாரம்பரிய சமையல், தையல், கைவினைப் பொருட்கள் மற்றும் பக்கங்களை இயக்க என்னிடம் கேளுங்கள்.",
        'greeting_spoken': "வணக்கம்! நான் உங்கள் சில்வர்ஹேண்ட்ஸ் AI குரல் உதவியாளர் சில்வர்வாய்ஸ். உங்களுக்கு இன்று எவ்வாறு உதவலாம்?",
        'greeting_actions': ["பாரம்பரிய சமையல்", "கைவினைப் பொருட்கள்", "பெரிய எழுத்து முறை", "வாய்ப்பு ரேடார்"],
        'cooking': "எங்களிடம் பாரம்பரிய வீட்டு சமையல் மற்றும் செட்டிநாடு சுவைகளை தயார் செய்யும் அனுபவமிக்க மூத்த சமையல் கலைஞர்கள் உள்ளனர். அவர்களை இப்போது காட்டுகிறேன்.",
        'cooking_spoken': "பாரம்பரிய வீட்டு சமையல் கலைஞர்களின் பட்டியலை இப்போது திறக்கிறேன்.",
        'cooking_actions': ["சமையல் கலைஞர்கள்", "சைவ சமையல்", "சமையல் கட்டணங்கள்", "முன்பதிவு"],
        'tailoring': "எங்கள் திறமையான தையல் கலைஞர்கள் புடவை பிளவுஸ் தையல் மற்றும் ஆரி வேலைப்பாடுகளில் சிறந்தவர்கள். தையல் சேவைகளைத் திறக்கிறேன்.",
        'tailoring_spoken': "தையல் கலைஞர்களின் பட்டியலை இப்போது காட்டுகிறேன்.",
        'tailoring_actions': ["தையல் கலைஞர்கள்", "ஆரி வேலைப்பாடுகள்", "தையல் கட்டணங்கள்"],
        'products': "வீட்டில் தயாரிக்கப்பட்ட சுவையான ஊறுகாய்கள், பாரம்பரிய முறுக்கு வகைகள் மற்றும் கைவினைப் பொருட்களை எங்கள் சந்தையில் காணலாம். சந்தைப் பக்கத்திற்குச் செல்கிறேன்.",
        'products_spoken': "கைவினைப் பொருட்கள் சந்தைப் பக்கத்திற்கு இப்போது செல்கிறோம்.",
        'products_actions': ["பாரம்பரிய ஊறுகாய்", "முறுக்கு வகைகள்", "காட்டன் பைகள்", "ஆர்டர் செய்ய"],
        'wizard': "உங்கள் திறமைகளை பதிவு செய்ய எங்கள் குரல் பதிவு வழிகாட்டியை இப்போது திறக்கிறேன்.",
        'wizard_spoken': "குரல் பதிவு வழிகாட்டியை இப்போது திறக்கிறேன்.",
        'wizard_actions': ["AI சுயவிவர வழிகாட்டி", "குரல் பதிவு", "திறன் பாஸ்போர்ட்"],
        'radar': "உங்கள் பகுதியில் உள்ள சமையல், தையல் தேவைகளை அறிய வாய்ப்பு ரேடார் பக்கத்திற்குச் செல்கிறோம்.",
        'radar_spoken': "வாய்ப்பு ரேடார் பக்கத்திற்கு இப்போது செல்கிறேன்.",
        'radar_actions': ["வாய்ப்பு ரேடார்", "உள்ளூர் தேவைகள்", "விண்ணப்பிக்க"],
        'senior_mode': "மூத்த குடிமக்கள் எளிதாக வாசிக்க பெரிய எழுத்து முறை மற்றும் உயர் மாறுபாட்டை மாற்றியுள்ளேன்.",
        'senior_mode_spoken': "பெரிய எழுத்து முறை இயக்கப்பட்டது.",
        'confirm_yes': "உங்கள் கோரிக்கையை உறுதி செய்து செயல்படுத்தியுள்ளேன்.",
        'confirm_yes_spoken': "சரி, உங்கள் கோரிக்கை உறுதி செய்யப்பட்டுவிட்டது.",
        'confirm_cancel': "சரி, கோரிக்கை ரத்து செய்யப்பட்டது. உங்களுக்கு வேறு ஏதேனும் உதவி தேவையா?",
        'confirm_cancel_spoken': "சரி, செயல்பாடு ரத்து செய்யப்பட்டது.",
        'read_page': "இந்த பக்கத்தில் கிடைக்கும் சேவைகள் மற்றும் விவரங்களை நீங்கள் எளிதாக குரல் வழியே தேர்ந்தெடுக்கலாம்."
    },
    'hi': {
        'greeting': "नमस्ते! मैं आपका सिल्वरहैंड्स AI वॉइस असिस्टेंट सिल्वरवॉइस हूँ। पारंपरिक रसोइयों, अनुभवी दर्जी, हस्तनिर्मित उत्पाद और वेबसाइट संचालन के लिए मुझसे कहें।",
        'greeting_spoken': "नमस्ते! मैं आपका सिल्वरहैंड्स AI वॉइस असिस्टेंट सिल्वरवॉइस हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?",
        'greeting_actions': ["पारंपरिक रसोइया", "हस्तनिर्मित उत्पाद", "सीनियर मोड ऑन करें", "अपॉर्चुनिटी रडार"],
        'cooking': "हमारे पास प्रामाणिक भोजन बनाने वाले अनुभवी वरिष्ठ रसोइये उपलब्ध हैं। मैं आपको सेवा सूची दिखा रहा हूँ।",
        'cooking_spoken': "पारंपरिक रसोइयों की सूची खोली जा रही है।",
        'cooking_actions': ["रसोइये खोजें", "शुद्ध शाकाहारी", "रसोई दरें", "बुक करें"],
        'tailoring': "हमारे विशेषज्ञ दर्जी साड़ी ब्लाउज सिलाई और आरी कढ़ाई में माहिर हैं। दर्जी सूची खोली जा रही है।",
        'tailoring_spoken': "दर्जी सेवाओं की सूची खोली जा रही है।",
        'tailoring_actions': ["मास्टर दर्जी", "आरी कढ़ाई", "सिलाई दरें"],
        'products': "हमारे मार्केटप्लेस पर घर का बना स्वादिष्ट अचार, पारंपरिक स्नैक्स उपलब्ध हैं। उत्पाद पेज पर जा रहे हैं।",
        'products_spoken': "हस्तनिर्मित उत्पादों के मार्केटप्लेस पर ले जा रहा हूँ।",
        'products_actions': ["घर का अचार", "पारंपरिक स्नैक्स", "कॉटन बैग", "ऑर्डर करें"],
        'wizard': "कौशल पंजीकरण के लिए वॉइस रजिस्ट्रेशन विज़ार्ड खोला जा रहा है।",
        'wizard_spoken': "वॉइस रजिस्ट्रेशन विज़ार्ड खोला जा रहा है।",
        'wizard_actions': ["AI प्रोफाइल विज़ार्ड", "वॉइस रजिस्ट्रेशन", "स्किल पासपोर्ट"],
        'radar': "स्थानीय मांगों को देखने के लिए अपॉर्चुनिटी रडार खोला जा रहा है।",
        'radar_spoken': "अपॉर्चुनिटी रडार खोला जा रहा है।",
        'radar_actions': ["अपॉर्चुनिटी रडार", "स्थानीय मांगें", "प्रस्ताव भेजें"],
        'senior_mode': "वरिष्ठ नागरिकों के लिए बड़ा टेक्स्ट और हाई कंट्रास्ट मोड बदल दिया गया है।",
        'senior_mode_spoken': "सीनियर एक्सेसिबिलिटी मोड टॉगल किया गया।",
        'confirm_yes': "आपकी बुकिंग / आर्डर की पुष्टि कर दी गई है।",
        'confirm_yes_spoken': "आपका अनुरोध सफलतापूर्वक पुष्ट कर दिया गया है।",
        'confirm_cancel': "अनुरोध रद्द कर दिया गया है।",
        'confirm_cancel_spoken': "कार्रवाई रद्द कर दी गई है।",
        'read_page': "यह पेज सिल्वरहैंड्स के सत्यापित कारीगरों और सेवाओं की जानकारी दिखाता है।"
    },
    'te': {
        'greeting': "నమస్కారం! నేను మీ సిల్వర్‌హ్యాండ్స్ AI వాయిస్ అసిస్టెంట్ సిల్వర్‌వాయిస్. సంప్రదాయ వంట మనుషులు, దర్జీలు, ఉత్పత్తులను నావిగేట్ చేయడానికి నాతో మాట్లాడండి.",
        'greeting_spoken': "నమస్కారం! నేను మీ సిల్వర్‌హ్యాండ్స్ AI వాయిస్ అసిస్టెంట్ సిల్వర్‌వాయిస్. నేను ఎలా సహాయపడగలను?",
        'greeting_actions': ["వంట నిపుణులు", "హస్తకళల ఉత్పత్తులు", "సీనియర్ మోడ్", "అవకాశాల రాడార్"],
        'cooking': "సంప్రదాయ వంట నిపుణుల జాబితాను ఇప్పుడు చూపిస్తున్నాను.",
        'cooking_spoken': "వంట సేవల పేజీని తెరుస్తున్నాను.",
        'cooking_actions': ["వంట నిపుణులు", "శాకాహార వంటకాలు", "బుక్ చేయండి"],
        'tailoring': "దర్జీ సేవల జాబితాను ఇప్పుడు తెరుస్తున్నాను.",
        'tailoring_spoken': "దర్జీ సేవల పేజీని తెరుస్తున్నాను.",
        'tailoring_actions': ["మాస్టర్ దర్జీలు", "ఆరి ఎంబ్రాయిడరీ"],
        'products': "హస్తకళల ఉత్పత్తుల మార్కెట్‌ప్లేస్‌కి వెళ్తున్నాము.",
        'products_spoken': "హస్తకళల మార్కెట్‌ప్లేస్ పేజీకి తీసుకువెళ్తున్నాను.",
        'products_actions': ["ఇంటి పచ్చళ్ళు", "స్నాక్స్", "ఆర్డర్ చేయండి"],
        'wizard': "వాయిస్ రిజిస్ట్రేషన్ పేజీని తెరుస్తున్నాను.",
        'wizard_spoken': "వాయిస్ రిజిస్ట్రేషన్ పేజీని తెరుస్తున్నాను.",
        'wizard_actions': ["వాయిస్ నమోదు", "స్కిల్ పాస్‌పోర్ట్"],
        'radar': "అవకాశాల రాడార్ పేజీకి వెళ్తున్నాము.",
        'radar_spoken': "అవకాశాల రాడార్ పేజీకి వెళ్తున్నాము.",
        'radar_actions': ["అవకాశాల రాడార్", "స్థానిక అవసరాలు"],
        'senior_mode': "సీనియర్ మోడ్ మార్చబడింది.",
        'senior_mode_spoken': "సీనియర్ మోడ్ మార్చబడింది.",
        'confirm_yes': "మీ అభ్యర్థన విజయవంతంగా నిర్ధారించబడింది.",
        'confirm_yes_spoken': "అభ్యర్థన నిర్ధారించబడింది.",
        'confirm_cancel': "అభ్యర్థన రద్దు చేయబడింది.",
        'confirm_cancel_spoken': "రద్దు చేయబడింది.",
        'read_page': "ఈ పేజీలోని వివరాలను వాయిస్ ద్వారా సులభంగా నిర్వహించవచ్చు."
    },
    'kn': {
        'greeting': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಿಲ್ವರ್‌ಹ್ಯಾಂಡ್ಸ್ AI ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್ ಸಿಲ್ವರ್‌ವಾಯ್ಸ್. ಸಾಂಪ್ರದಾಯಿಕ ಸೇವೆಗಳು ಮತ್ತು ವೆಬ್‌ಸೈಟ್ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ನನ್ನನ್ನು ಕೇಳಿ.",
        'greeting_spoken': "ನಮಸ್ಕಾರ! ನಾನು ಸಿಲ್ವರ್‌ವಾಯ್ಸ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        'greeting_actions': ["ಅಡುಗೆಯವರು", "ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳು", "ಹಿರಿಯರ ಮೋಡ್", "ಆಪರ್ಚುನಿಟಿ ರೇಡಾರ್"],
        'cooking': "ಸಾಂಪ್ರದಾಯಿಕ ಅಡುಗೆಯವರ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'cooking_spoken': "ಅಡುಗೆಯವರ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'cooking_actions': ["ಅಡುಗೆಯವರು", "ಸಸ್ಯಾಹಾರಿ", "ಬುಕ್ ಮಾಡಿ"],
        'tailoring': "ಟೈಲರಿಂಗ್ ಸೇವೆಗಳ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'tailoring_spoken': "ಟೈಲರಿಂಗ್ ಸೇವೆಗಳ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'tailoring_actions': ["ಟೈಲರ್‌ಗಳು", "ಆರಿ ಎಂಬ್ರಾಯಿಡರಿ"],
        'products': "ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳ ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
        'products_spoken': "ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳ ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
        'products_actions': ["ಮನೆ ಉಪ್ಪಿನಕಾಯಿ", "ತಿಂಡಿಗಳು", "ಆರ್ಡರ್ ಮಾಡಿ"],
        'wizard': "ಧ್ವನಿ ನೋಂದಣಿ ವಿಝಾರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'wizard_spoken': "ಧ್ವನಿ ನೋಂದಣಿ ವಿಝಾರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
        'wizard_actions': ["ಧ್ವನಿ ನೋಂದಣಿ", "ಸ್ಕಿಲ್ ಪಾಸ್‌ಪೋರ್ಟ್"],
        'radar': "ಆಪರ್ಚುನಿಟಿ ರೇಡಾರ್ ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
        'radar_spoken': "ಆಪರ್ಚುನಿಟಿ ರೇಡಾರ್ ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
        'radar_actions': ["ಆಪರ್ಚುನಿಟಿ ರೇಡಾರ್", "ಸ್ಥಳೀಯ ಬೇಡಿಕೆಗಳು"],
        'senior_mode': "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ.",
        'senior_mode_spoken': "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ.",
        'confirm_yes': "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಖಚಿತಪಡಿಸಲಾಗಿದೆ.",
        'confirm_yes_spoken': "ವಿನಂತಿಯನ್ನು ಖಚಿತಪಡಿಸಲಾಗಿದೆ.",
        'confirm_cancel': "ವಿನಂತಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
        'confirm_cancel_spoken': "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
        'read_page': "ಈ ಪುಟದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಸೇವೆಗಳನ್ನು ನೀವು ಧ್ವನಿಯ ಮೂಲಕ ಸುಲಭವಾಗಿ ಬಳಸಬಹುದು."
    },
    'ml': {
        'greeting': "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സിൽവർഹാൻഡ്സ് AI വോയ്‌സ് അസിസ്റ്റന്റ് സിൽവർവോയ്‌സ് ആണ്. സേവനങ്ങളും വെബ്സൈറ്റും നിയന്ത്രിക്കാൻ എന്നോട് സംസാരിക്കാം.",
        'greeting_spoken': "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സിൽവർവോയ്‌സ് ആണ്. ഞാൻ എങ്ങനെ സഹായിക്കണം?",
        'greeting_actions': ["പാചകക്കാർ", "കരകൗശല ഉൽപ്പന്നങ്ങൾ", "സീനിയർ മോഡ്", "അവസര റഡാർ"],
        'cooking': "പരമ്പരാഗത പാചകക്കാരുടെ പട്ടിക തുറക്കുന്നു.",
        'cooking_spoken': "പാചകക്കാരുടെ ലിസ്റ്റ് തുറക്കുന്നു.",
        'cooking_actions': ["പാചകക്കാരെ കണ്ടെത്തുക", "സസ്യാഹാരം", "ബുക്ക് ചെയ്യുക"],
        'tailoring': "തയ്യൽക്കാരുടെ ലിസ്റ്റ് തുറക്കുന്നു.",
        'tailoring_spoken': "തയ്യൽ സേവനങ്ങൾ തുറക്കുന്നു.",
        'tailoring_actions': ["തയ്യൽക്കാർ", "ആരി എംബ്രോയ്ഡറി"],
        'products': "കരകൗശല ഉൽപ്പന്നങ്ങളുടെ മാർക്കറ്റിലേക്ക് പോകുന്നു.",
        'products_spoken': "മാർക്കറ്റ്പ്ലേസിലേക്ക് പോകുന്നു.",
        'products_actions': ["നാടൻ അച്ചാറുകൾ", "പലഹാരങ്ങൾ", "ഓർഡർ ചെയ്യുക"],
        'wizard': "വോയ്സ് രജിസ്ട്രേഷൻ വിസാർഡ് തുറക്കുന്നു.",
        'wizard_spoken': "വോയ്സ് രജിസ്ട്രേഷൻ വിസാർഡ് തുറക്കുന്നു.",
        'wizard_actions': ["വോയ്സ് രജിസ്ട്രേഷൻ", "സ്കിൽ പാസ്പോർട്ട്"],
        'radar': "അവസര റഡാർ പേജിലേക്ക് പോകുന്നു.",
        'radar_spoken': "അവസര റഡാർ പേജിലേക്ക് പോകുന്നു.",
        'radar_actions': ["അവസര റഡാർ", "പ്രാദേശിക ആവശ്യങ്ങൾ"],
        'senior_mode': "സീനിയർ ആക്സസിബിലിറ്റി മോഡ് മാറ്റിയിരിക്കുന്നു.",
        'senior_mode_spoken': "സീനിയർ മോഡ് മാറ്റിയിരിക്കുന്നു.",
        'confirm_yes': "നിങ്ങളുടെ അപേക്ഷ വിജയകരമായി സ്ഥിരീകരിച്ചു.",
        'confirm_yes_spoken': "അപേക്ഷ സ്ഥിരീകരിച്ചു.",
        'confirm_cancel': "അപേക്ഷ റദ്ദാക്കി.",
        'confirm_cancel_spoken': "റദ്ദാക്കി.",
        'read_page': "ഈ പേജിലെ വിവരങ്ങൾ വോയ്സ് കമാൻഡുകളിലൂടെ എളുപ്പത്തിൽ ഉപയോഗിക്കാം."
    },
    'en': {
        'greeting': "Vanakkam! I am SilverVoice, your autonomous AI Co-Pilot for SilverHands. You can tell me to navigate pages, search home cooks, book services, order handmade goods, or adjust text size.",
        'greeting_spoken': "Vanakkam! I am SilverVoice, your SilverHands AI Co-Pilot. How can I control or assist you on the website today?",
        'greeting_actions': ["Find Traditional Cooks", "Browse Handmade Goods", "Toggle Senior Mode", "Open Opportunity Radar"],
        'cooking': "Opening verified traditional home cooks and catering services for you now.",
        'cooking_spoken': "Opening traditional cooking services now.",
        'cooking_actions': ["Browse Home Cooks", "Pure Veg Chefs", "Book a Cook"],
        'tailoring': "Opening master tailors, saree blouse stitchers, and Aari embroidery artists for you.",
        'tailoring_spoken': "Opening tailoring services now.",
        'tailoring_actions': ["Master Tailors", "Aari Works", "Book Tailor"],
        'products': "Navigating to our handmade marketplace for authentic homemade pickles, snacks, and craft items.",
        'products_spoken': "Navigating to handmade products marketplace now.",
        'products_actions': ["Homemade Pickles", "Traditional Snacks", "Cotton Bags", "Order Item"],
        'wizard': "Opening the Voice Registration & AI Profile Wizard for you to share your craft.",
        'wizard_spoken': "Opening Voice Registration Wizard now.",
        'wizard_actions': ["Voice Registration", "AI Profile Wizard", "Skill Passport"],
        'radar': "Navigating to Opportunity Radar to explore local elder livelihood gigs in your neighborhood.",
        'radar_spoken': "Navigating to Opportunity Radar now.",
        'radar_actions': ["Opportunity Radar", "Neighborhood Demands", "Submit Quote"],
        'senior_mode': "Senior Accessibility Mode has been toggled with large text and enhanced contrast.",
        'senior_mode_spoken': "Senior accessibility mode toggled.",
        'confirm_yes': "Your requested transaction has been confirmed and submitted successfully.",
        'confirm_yes_spoken': "Your request has been confirmed and processed.",
        'confirm_cancel': "Transaction cancelled. How else can I help you?",
        'confirm_cancel_spoken': "Action cancelled.",
        'read_page': "This screen displays verified services and handmade items. You can ask me to book or filter any of them."
    }
}

def _detect_language_code(language_input: str, message: str) -> str:
    lang = (language_input or '').lower().strip()
    if lang in ['ta', 'tamil', 'தமிழ்']: return 'ta'
    if lang in ['hi', 'hindi', 'हिंदी']: return 'hi'
    if lang in ['te', 'telugu', 'తెలుగు']: return 'te'
    if lang in ['kn', 'kannada', 'ಕನ್ನಡ']: return 'kn'
    if lang in ['ml', 'malayalam', 'മലയാളം']: return 'ml'
    
    msg = message or ''
    if any('஀' <= c <= '௿' for c in msg): return 'ta'
    if any('ऀ' <= c <= 'ॿ' for c in msg): return 'hi'
    if any('ఀ' <= c <= '౿' for c in msg): return 'te'
    if any('ಀ' <= c <= '೿' for c in msg): return 'kn'
    if any('ഀ' <= c <= 'ൿ' for c in msg): return 'ml'

    return 'en'

def _build_contextual_action_fallback(message: str, language: str = 'en', user_info: Optional[Dict[str, Any]] = None, page_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    lang_code = _detect_language_code(language, message)
    bundle = FALLBACK_MATRIX.get(lang_code, FALLBACK_MATRIX['en'])
    msg = (message or "").lower().strip()
    page_context = page_context or {}
    current_path = page_context.get('path', '')

    # 1. Senior Mode toggle intent
    if any(k in msg for k in ['senior mode', 'accessibility', 'பெரிய எழுத்து', 'சீனியர் மோட்', 'बड़ा टेक्स्ट', 'सीनियर मोड', 'పెద్ద అక్షరాలు', 'ದೊಡ್ಡ ಅಕ್ಷರ', 'വലിയ അಕ್ಷരങ്ങൾ']) or (('big' in msg or 'large' in msg or 'increase' in msg) and ('text' in msg or 'font' in msg or 'size' in msg)):
        return {
            "reply": bundle['senior_mode'],
            "spoken_text": bundle['senior_mode_spoken'],
            "suggested_actions": ["Browse Services", "Browse Products"],
            "route_suggestion": None,
            "action": {
                "type": "TOGGLE_SENIOR_MODE",
                "target": "senior-mode-toggle",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 2. Language Switch intent
    lang_switch_map = {
        'tamil': 'ta', 'தமிழ்': 'ta',
        'hindi': 'hi', 'हिंदी': 'hi', 'हिन्दी': 'hi',
        'telugu': 'te', 'తెలుగు': 'te',
        'kannada': 'kn', 'ಕನ್ನಡ': 'kn',
        'malayalam': 'ml', 'മലയാളം': 'ml',
        'english': 'en', 'ஆங்கிலம்': 'en', 'अंग्रेजी': 'en'
    }
    for trigger_word, target_lang in lang_switch_map.items():
        if f"speak in {trigger_word}" in msg or f"change language to {trigger_word}" in msg or f"switch to {trigger_word}" in msg or f"{trigger_word}ில் பேசு" in msg or f"{trigger_word} में बोलो" in msg or msg == trigger_word:
            target_bundle = FALLBACK_MATRIX.get(target_lang, FALLBACK_MATRIX['en'])
            return {
                "reply": target_bundle['greeting'],
                "spoken_text": target_bundle['greeting_spoken'],
                "suggested_actions": target_bundle['greeting_actions'],
                "route_suggestion": None,
                "action": {
                    "type": "SET_LANGUAGE",
                    "target": "language-selector",
                    "params": {"language_code": target_lang},
                    "requires_confirmation": False,
                    "confirmation_prompt": None
                }
            }

    # 3. Confirmation Intent ("yes", "confirm", "proceed", "ஆமாம்", "சரி", "हाँ", "అవును", "ಹೌದು", "അതെ")
    if msg in ['yes', 'confirm', 'ok', 'okay', 'proceed', 'sure', 'yes please', 'ஆமாம்', 'சரி', 'உறுதி செய்', 'हाँ', 'हाँ करो', 'ठीक है', 'అవును', 'సరే', 'ಹೌದು', 'ಸರಿ', 'അതെ', 'ശരി']:
        return {
            "reply": bundle['confirm_yes'],
            "spoken_text": bundle['confirm_yes_spoken'],
            "suggested_actions": ["View My Bookings", "View My Orders"],
            "route_suggestion": "/bookings",
            "action": {
                "type": "CONFIRM_TRANSACTION",
                "target": "active-modal",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 4. Cancellation Intent ("no", "cancel", "stop", "abort", "வேண்டாம்", "ரத்து செய்", "रद्द करें", "వద్దు", "ಬೇಡ", "വേണ്ട")
    if msg in ['no', 'cancel', 'stop', 'abort', 'dont', "don't", 'வேண்டாம்', 'ரத்து', 'ரத்து செய்', 'नहीं', 'रद्द करें', 'रोकें', 'వద్దు', 'రద్దు', 'ಬೇಡ', 'ರದ್ದು', 'വേണ്ട', 'റദ്ദാക്കുക']:
        return {
            "reply": bundle['confirm_cancel'],
            "spoken_text": bundle['confirm_cancel_spoken'],
            "suggested_actions": ["Browse Services", "Browse Products"],
            "route_suggestion": None,
            "action": {
                "type": "CANCEL_TRANSACTION",
                "target": "active-modal",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 5. Read Page Intent
    if any(k in msg for k in ['read page', 'read this', 'what is on screen', 'explain screen', 'பக்கத்தை வாசி', 'விளக்கு', 'स्क्रीन पढ़ो', 'यह क्या है', 'చదువు', 'ಓದು', 'വായിക്കുക']):
        return {
            "reply": bundle['read_page'],
            "spoken_text": bundle['read_page'],
            "suggested_actions": ["Find Traditional Cooks", "Browse Handmade Goods"],
            "route_suggestion": None,
            "action": {
                "type": "READ_PAGE",
                "target": "main-content",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 6. Bookings / Orders page navigation
    if any(k in msg for k in ['my bookings', 'my orders', 'show orders', 'past bookings', 'என் முன்பதிவுகள்', 'என் ஆர்டர்கள்', 'मेरी बुकिंग', 'मेरे ऑर्डर', 'నా బుకింగ్స్', 'ನನ್ನ ಬುಕಿಂಗ್', 'എന്റെ ബുക്കിംഗ്']):
        target_route = '/orders' if 'order' in msg or 'ஆர்டர்' in msg else '/bookings'
        reply_txt = "Opening your customer activity page." if lang_code == 'en' else "உங்கள் முன்பதிவுகள் மற்றும் ஆர்டர்கள் பக்கத்தைத் திறக்கிறேன்."
        return {
            "reply": reply_txt,
            "spoken_text": reply_txt,
            "suggested_actions": ["Back to Services", "Browse Products"],
            "route_suggestion": target_route,
            "action": {
                "type": "NAVIGATE",
                "target": target_route,
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 7. Cooking / Food intent
    if any(k in msg for k in ['cook', 'food', 'meal', 'sambar', 'rasam', 'chef', 'catering', 'diet', 'lunch', 'dinner', 'breakfast', 'சமையல்', 'ரசம்', 'சாப்பாடு', 'रसोई', 'खाना', 'వంట', 'ಅಡುಗೆ', 'ഭക്ഷണം']):
        return {
            "reply": bundle['cooking'],
            "spoken_text": bundle['cooking_spoken'],
            "suggested_actions": bundle['cooking_actions'],
            "route_suggestion": "/services",
            "action": {
                "type": "FILTER",
                "target": "/services",
                "params": {"category": "cooking", "query": "cooking"},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 8. Tailoring intent
    if any(k in msg for k in ['tailor', 'stitch', 'saree', 'blouse', 'aari', 'embroidery', 'alteration', 'dress', 'kurti', 'தையல்', 'புடவை', 'दर्जी', 'सिलाई', 'దర్జీ', 'కుట్టు', 'ಹೊಲಿಗೆ', 'തയ്യൽ']):
        return {
            "reply": bundle['tailoring'],
            "spoken_text": bundle['tailoring_spoken'],
            "suggested_actions": bundle['tailoring_actions'],
            "route_suggestion": "/services",
            "action": {
                "type": "FILTER",
                "target": "/services",
                "params": {"category": "tailoring", "query": "tailor"},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 9. Products / Marketplace intent
    if any(k in msg for k in ['product', 'item', 'pickle', 'murukku', 'bag', 'vermicompost', 'snack', 'handmade', 'buy', 'shop', 'craft', 'ஊறுகாய்', 'முறுக்கு', 'பொருள்', 'अचार', 'उत्पाद', 'పచ్చడి', 'ಉಪ್ಪಿನಕಾಯಿ', 'അച്ചാർ']):
        return {
            "reply": bundle['products'],
            "spoken_text": bundle['products_spoken'],
            "suggested_actions": bundle['products_actions'],
            "route_suggestion": "/products",
            "action": {
                "type": "NAVIGATE",
                "target": "/products",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 10. Voice Registration / Profile Wizard intent
    if any(k in msg for k in ['register', 'join', 'sell', 'wizard', 'story', 'onboard', 'start', 'list', 'பதிவு', 'வழிகாட்டி', 'रजिस्टर', 'विज़ार्ड', 'నమోదు', 'ನೋಂದಣಿ', 'രജിസ്ട്രേഷൻ']):
        return {
            "reply": bundle['wizard'],
            "spoken_text": bundle['wizard_spoken'],
            "suggested_actions": bundle['wizard_actions'],
            "route_suggestion": "/register-voice",
            "action": {
                "type": "NAVIGATE",
                "target": "/register-voice",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # 11. Opportunity Radar intent
    if any(k in msg for k in ['radar', 'opportunity', 'demand', 'jobs', 'nearby', 'neighborhood', 'requests', 'leads', 'வாய்ப்பு', 'ரேடார்', 'मांग', 'रडार', 'అవకాశాలు', 'ಬೇಡಿಕೆ', 'റഡാർ']):
        return {
            "reply": bundle['radar'],
            "spoken_text": bundle['radar_spoken'],
            "suggested_actions": bundle['radar_actions'],
            "route_suggestion": "/radar",
            "action": {
                "type": "NAVIGATE",
                "target": "/radar",
                "params": {},
                "requires_confirmation": False,
                "confirmation_prompt": None
            }
        }

    # Default greeting
    return {
        "reply": bundle['greeting'],
        "spoken_text": bundle['greeting_spoken'],
        "suggested_actions": bundle['greeting_actions'],
        "route_suggestion": "/services",
        "action": {
            "type": "NAVIGATE",
            "target": "/services",
            "params": {},
            "requires_confirmation": False,
            "confirmation_prompt": None
        }
    }

def ask_voice_assistant(message: str, history: List[Dict[str, str]] = None, language: str = 'en', user_info: Dict[str, Any] = None, page_context: Dict[str, Any] = None) -> Dict[str, Any]:
    history = history or []
    history_turns = []
    for h in history[-6:]:
        role = "User" if h.get('sender') == 'user' else "SilverVoice"
        history_turns.append(f"{role}: {h.get('text', '')}")
    history_text = "\n".join(history_turns)

    user_context = ""
    if user_info and user_info.get('username'):
        user_context = f"\nCurrent User: {user_info.get('name', user_info.get('username'))} (Role: {user_info.get('role', 'Visitor')}, Location: {user_info.get('location', 'Chennai')})"

    page_ctx_str = ""
    if page_context:
        page_ctx_str = f"\nCurrent Active Screen: Route '{page_context.get('path', '/')}', Title: '{page_context.get('title', '')}', Item: '{page_context.get('item_title', 'None')}'"

    lang_code = _detect_language_code(language, message)
    lang_names = {
        'ta': 'Tamil (தமிழ்)',
        'hi': 'Hindi (हिंदी)',
        'te': 'Telugu (తెలుగు)',
        'kn': 'Kannada (ಕನ್ನಡ)',
        'ml': 'Malayalam (മലയാളം)',
        'en': 'Indian English'
    }
    target_language_name = lang_names.get(lang_code, 'Indian English')

    prompt = f"""
TARGET LANGUAGE REQUIRED: {target_language_name}
Please ensure the 'reply', 'spoken_text', and 'suggested_actions' are written naturally and fluently in {target_language_name}.
{user_context}
{page_ctx_str}

--- CONVERSATION HISTORY ---
{history_text if history_text else "No prior turns."}

--- USER VOICE / TEXT MESSAGE ---
{message}
"""

    fallback = _build_contextual_action_fallback(message, language=lang_code, user_info=user_info, page_context=page_context)

    try:
        data = ai_client.generate_json(
            prompt=prompt,
            system_instruction=VOICE_ASSISTANT_SYSTEM_PROMPT,
            default_fallback=fallback
        )
        if isinstance(data, dict) and 'reply' in data:
            if not data.get('spoken_text'):
                data['spoken_text'] = data['reply']
            if 'action' not in data or not isinstance(data.get('action'), dict):
                data['action'] = fallback.get('action')
            return data
        return fallback
    except Exception:
        return fallback
