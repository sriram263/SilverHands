import re
import random
from decimal import Decimal
from typing import Any, Dict, List, Optional
from .ai_client import ai_client

CATEGORIES = [
    {"slug": "cooking", "name": "Traditional Cooking & Baking", "default_price": 700, "unit": "per service"},
    {"slug": "tailoring", "name": "Tailoring & Stitching", "default_price": 550, "unit": "per service"},
    {"slug": "tutoring", "name": "Tutoring & Language Lessons", "default_price": 400, "unit": "per hour"},
    {"slug": "wellness", "name": "Traditional Care & Wellness", "default_price": 600, "unit": "per session"},
    {"slug": "gardening", "name": "Terrace Gardening & Plants", "default_price": 450, "unit": "per visit"},
    {"slug": "handcrafts", "name": "Handcrafts & Embroidery", "default_price": 650, "unit": "per piece"},
    {"slug": "maintenance", "name": "Home Repair & Craft Care", "default_price": 500, "unit": "per service"},
]

PROMPTS_BY_LANG = {
    'en': {
        'all_set': "Excellent! I have collected all your required details. You can review your profile summary below and click Complete Registration.",
        'need_info': "Thank you! I have extracted your details. To finish your registration, please share your {missing_list}.",
        'field_names': {
            'first_name': 'name',
            'phone': 'phone number',
            'password': 'account password',
            'address': 'neighborhood or city location',
            'experience_years': 'years of experience',
            'skills': 'skills or craft expertise',
            'service_title': 'service offering title',
            'suggested_price': 'expected pricing or rate'
        }
    },
    'ta': {
        'all_set': "அருமை! உங்கள் பதிவுக்கான அனைத்து விவரங்களும் பெறப்பட்டுவிட்டன. கீழே உள்ள விவரங்களை சரிபார்த்து பதிவை முடிக்கவும்.",
        'need_info': "நன்றி! உங்கள் விவரங்களை பதிவு செய்துள்ளேன். உங்கள் பதிவை முழுமையாக முடிக்க, தயவுசெய்து உங்கள் {missing_list} கூறுங்கள்.",
        'field_names': {
            'first_name': 'பெயர்',
            'phone': 'தொலைபேசி எண்',
            'password': 'கடவுச்சொல் (Password)',
            'address': 'வசிக்கும் பகுதி அல்லது ஊர்',
            'experience_years': 'அனுபவ ஆண்டுகள்',
            'skills': 'திறன்கள் அல்லது கைவினை',
            'service_title': 'வழங்கும் சேவை விவரம்',
            'suggested_price': 'சேவைக்கான கட்டணம்'
        }
    },
    'hi': {
        'all_set': "बहुत बढ़िया! आपकी पंजीकरण संबंधी सभी जानकारी मिल गई है। नीचे विवरण देखें और पंजीकरण पूरा करें।",
        'need_info': "धन्यवाद! मैंने आपकी जानकारी दर्ज कर ली है। पंजीकरण पूरा करने के लिए कृपया अपना {missing_list} बताएं।",
        'field_names': {
            'first_name': 'नाम',
            'phone': 'फोन नंबर',
            'password': 'पासवर्ड (Password)',
            'address': 'इलाका या शहर',
            'experience_years': 'अनुभव के वर्ष',
            'skills': 'हुनर या कौशल',
            'service_title': 'प्रदान की जाने वाली सेवा',
            'suggested_price': 'अपेक्षित सेवा शुल्क'
        }
    },
    'te': {
        'all_set': "చాలా బాగుంది! మీ రిజిస్ట్రేషన్‌కు అవసరమైన అన్ని వివరాలు అందాయి. వివరాలు సరిచూసి రిజిస్ట్రేషన్ పూర్తి చేయండి.",
        'need_info': "ధన్యవాదాలు! మీ వివరాలను నమోదు చేసుకున్నాను. రిజిస్ట్రేషన్ పూర్తి చేయడానికి దయచేసి మీ {missing_list} చెప్పండి.",
        'field_names': {
            'first_name': 'పేరు',
            'phone': 'ఫోన్ నంబర్',
            'password': 'పాస్‌వర్డ్ (Password)',
            'address': 'ప్రాంతం లేదా నగరం',
            'experience_years': 'అనుభవ సంవత్సరాలు',
            'skills': 'నైపుణ్యాలు',
            'service_title': 'సేవ వివరాలు',
            'suggested_price': 'సేవ రుసుము'
        }
    },
    'kn': {
        'all_set': "ಉತ್ತಮ! ನಿಮ್ಮ ನೋಂದಣಿಗೆ ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಪಡೆಯಲಾಗಿದೆ. ಕೆಳಗಿನ ಸಾರಾಂಶ ಪರಿಶೀಲಿಸಿ ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ.",
        'need_info': "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ {missing_list} ತಿಳಿಸಿ.",
        'field_names': {
            'first_name': 'ಹೆಸರು',
            'phone': 'ಫೋನ್ ಸಂಖ್ಯೆ',
            'password': 'ಪಾಸ್‌ವರ್ಡ್ (Password)',
            'address': 'ಸ್ಥಳ ಅಥವಾ ನಗರ',
            'experience_years': 'ಅನುಭವದ ವರ್ಷಗಳು',
            'skills': 'ಕೌಶಲ್ಯಗಳು',
            'service_title': 'ಸೇವೆಯ ವಿವರ',
            'suggested_price': 'ಸೇವಾ ಶುಲ್ಕ'
        }
    },
    'ml': {
        'all_set': "വളരെ നല്ലത്! രജിസ്ട്രേഷന് ആവശ്യമായ എല്ലാ വിവരങ്ങളും ലഭിച്ചു. താഴെയുള്ള വിവരങ്ങൾ പരിശോധിച്ച് രജിസ്ട്രേഷൻ പൂർത്തിയാക്കുക.",
        'need_info': "നന്ദി! രജിസ്ട്രേഷൻ പൂർത്തിയാക്കാൻ ദയവായി നിങ്ങളുടെ {missing_list} പറയുക.",
        'field_names': {
            'first_name': 'പേര്',
            'phone': 'ഫോൺ നമ്പർ',
            'password': 'പാസ്‌വേഡ് (Password)',
            'address': 'സ്ഥലം അല്ലെങ്കിൽ നഗരം',
            'experience_years': 'പ്രവൃത്തിപരിചയ വർഷങ്ങൾ',
            'skills': 'കഴിവുകൾ അല്ലെങ്കിൽ കരകൗശലം',
            'service_title': 'നൽകുന്ന സേവനം',
            'suggested_price': 'സേവന നിരക്ക്'
        }
    }
}


def analyze_voice_registration(speech_text: str, current_data: Optional[Dict[str, Any]] = None, language: str = 'en') -> Dict[str, Any]:
    """
    Analyzes natural speech input in English, Tamil, Hindi, Telugu, Kannada, or Malayalam.
    Extracts name, years of experience, craft skills, detects service category, generates service offering,
    detects missing fields, and generates localized follow-up prompts.
    """
    cleaned_speech = (speech_text or "").strip()
    merged_data = dict(current_data or {})
    lang_key = language if language in PROMPTS_BY_LANG else 'en'

    system_instruction = (
        "You are the SilverHands Master Voice-Guided Registration & Service Extraction Engine.\n"
        "Analyze the user's speech in English, Tamil (தமிழ்), Hindi (हिंदी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), or Malayalam (മലയാളം).\n"
        "Extract or infer all available fields:\n"
        "1. 'first_name': Person's first name / preferred name.\n"
        "2. 'last_name': Person's last name or surname if given, else empty string.\n"
        "3. 'username': Clean alphanumeric username suggestion (lowercase, e.g. 'meena_rajaram').\n"
        "4. 'role': 'PROVIDER' if offering skills, services, cooking, tailoring, tutoring, craft, etc. 'CUSTOMER' if looking to buy/book services.\n"
        "5. 'experience_years': Integer number of practical mastery years mentioned (e.g. 20). If not stated, return 0 or preserve existing.\n"
        "6. 'skills': Array of practical skill names (e.g. ['Saree Blouse Stitching', 'Aari Work Embroidery']).\n"
        "7. 'category_slug': Best matching category slug from: ['cooking', 'tailoring', 'tutoring', 'wellness', 'gardening', 'handcrafts', 'maintenance'].\n"
        "8. 'service_title': Clear, compelling title for the service they can offer (e.g. 'Custom Saree Blouse Stitching & Alterations').\n"
        "9. 'service_description': Dignified, warm 2-3 sentence description of their service offering based on their story.\n"
        "10. 'suggested_price': Realistic fair Indian Rupee rate number (e.g. 600) based on craft and experience.\n"
        "11. 'pricing_unit': One of ['per service', 'per hour', 'per piece', 'per day'].\n"
        "12. 'address': Location / neighborhood / city mentioned (e.g. 'Mylapore, Chennai').\n"
        "13. 'phone': Phone number digits if mentioned.\n"
        "14. 'email': Email address if mentioned.\n"
        "15. 'password': Password if spoken/provided.\n"
        "16. 'is_senior': Boolean true if they mention being senior citizen / retired / elder / grandmother / grandfather.\n"
        "STRICT RULE: Return ONLY a valid JSON object matching these exact keys."
    )

    prompt = (
        f"Input Language: {language}\n"
        f"Existing Profile State: {merged_data}\n"
        f"New Spoken Transcript: \"{cleaned_speech}\"\n\n"
        f"Extract, update and synthesize full registration fields."
    )

    fallback = _fallback_voice_registration_extractor(cleaned_speech, merged_data, language)

    # Call AI Model Cascade
    ai_result = ai_client.generate_json(
        prompt=prompt,
        system_instruction=system_instruction,
        default_fallback=fallback
    )

    # Merge AI result with existing data (preserving existing values if AI omitted them)
    for k, v in ai_result.items():
        if v is not None and v != "" and v != 0 and v != []:
            merged_data[k] = v
        elif k not in merged_data:
            merged_data[k] = v

    # Normalize fields
    _normalize_registration_data(merged_data)

    # Missing fields audit
    missing_fields, completion_percentage = _audit_missing_fields(merged_data)
    is_complete = len(missing_fields) == 0

    # Build localized voice follow-up prompt
    voice_prompt, bot_message = _generate_localized_prompt(missing_fields, merged_data, lang_key)

    return {
        "extracted_data": merged_data,
        "missing_fields": missing_fields,
        "is_complete": is_complete,
        "completion_percentage": completion_percentage,
        "voice_prompt": voice_prompt,
        "bot_message": bot_message,
        "language": lang_key
    }


def _normalize_registration_data(data: Dict[str, Any]):
    """Cleans and standardizes extracted fields."""
    # Ensure role
    if not data.get('role'):
        data['role'] = 'PROVIDER'

    # Ensure experience years is integer
    try:
        data['experience_years'] = int(float(data.get('experience_years') or 0))
    except (ValueError, TypeError):
        data['experience_years'] = 0

    # Ensure skills is a clean list
    skills = data.get('skills', [])
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(',') if s.strip()]
    elif not isinstance(skills, list):
        skills = []
    data['skills'] = [str(s).strip() for s in skills if str(s).strip()]

    # Ensure price is numeric
    try:
        data['suggested_price'] = float(data.get('suggested_price') or 0)
    except (ValueError, TypeError):
        data['suggested_price'] = 500.0

    # Category normalization
    cat_slug = (data.get('category_slug') or '').lower().strip()
    valid_slugs = [c['slug'] for c in CATEGORIES]
    if cat_slug not in valid_slugs:
        # Infer category from skills
        cat_slug = _infer_category_slug(data.get('skills', []), data.get('service_title', ''))
    data['category_slug'] = cat_slug

    # Generate username if not present but first name is
    if not data.get('username') and data.get('first_name'):
        base_user = re.sub(r'[^a-zA-Z0-9]', '', data['first_name']).lower()
        if data.get('last_name'):
            base_user += '_' + re.sub(r'[^a-zA-Z0-9]', '', data['last_name']).lower()
        if len(base_user) < 3:
            base_user += str(random.randint(100, 999))
        data['username'] = base_user


def _infer_category_slug(skills: List[str], title: str) -> str:
    combined = " ".join(skills + [title]).lower()
    if any(w in combined for w in ['cook', 'baking', 'pickle', 'food', 'சமையல்', 'खाना', 'వంట', 'ಅಡುಗೆ', 'പാചകം']):
        return 'cooking'
    if any(w in combined for w in ['tailor', 'stitch', 'blouse', 'embroidery', 'aari', 'தையல்', 'सिलाई', 'కుట్టు', 'ಹೊಲಿಗೆ', 'തയ്യൽ']):
        return 'tailoring'
    if any(w in combined for w in ['teach', 'tutor', 'math', 'science', 'tamil', 'language', 'பாடம்', 'ट्यूशन', 'బోధన', 'ಕಲಿಕೆ', 'ട്യൂഷൻ']):
        return 'tutoring'
    if any(w in combined for w in ['garden', 'plant', 'organic', 'compost', 'தோட்டம்', 'बागवानी', 'తోట', 'ತೋಟ', 'തോട്ടം']):
        return 'gardening'
    if any(w in combined for w in ['wellness', 'elder', 'care', 'health', 'ஆரோக்கியம்', 'स्वास्थ्य', 'ఆరోగ్యం', 'ಆರೋಗ್ಯ', 'ആരോഗ്യം']):
        return 'wellness'
    if any(w in combined for w in ['craft', 'bag', 'artisan', 'handcraft', 'கைவினை', 'हस्तशिल्प', 'హస్తకళ', 'ಕರಕುಶಲ', 'കരകൗശലം']):
        return 'handcrafts'
    return 'maintenance'


def _audit_missing_fields(data: Dict[str, Any]) -> tuple:
    """
    Checks all mandatory registration fields and provider-specific fields.
    Returns list of missing field objects and integer completion percentage.
    """
    role = data.get('role', 'PROVIDER')
    
    # Core fields for any user
    core_checklist = [
        ('first_name', 'Full Name', bool(data.get('first_name'))),
        ('username', 'Username', bool(data.get('username'))),
        ('phone', 'Phone Number', bool(data.get('phone') or data.get('email'))),
        ('password', 'Account Password', bool(data.get('password'))),
        ('address', 'Location / Area', bool(data.get('address'))),
    ]

    # Provider specific fields
    provider_checklist = []
    if role == 'PROVIDER':
        provider_checklist = [
            ('experience_years', 'Years of Experience', (data.get('experience_years') or 0) > 0),
            ('skills', 'Skills & Expertise', len(data.get('skills') or []) > 0),
            ('service_title', 'Service Title', bool(data.get('service_title'))),
            ('suggested_price', 'Pricing / Rate', (data.get('suggested_price') or 0) > 0),
        ]

    full_checklist = core_checklist + provider_checklist
    total_fields = len(full_checklist)
    completed_fields = sum(1 for _, _, satisfied in full_checklist if satisfied)
    
    missing_fields = []
    for key, label, satisfied in full_checklist:
        if not satisfied:
            missing_fields.append({
                "field": key,
                "label": label
            })

    percentage = int((completed_fields / total_fields) * 100) if total_fields > 0 else 100
    return missing_fields, percentage


def _generate_localized_prompt(missing_fields: List[Dict[str, str]], data: Dict[str, Any], lang: str) -> tuple:
    """Builds conversational voice and chat text in the selected language."""
    strings = PROMPTS_BY_LANG.get(lang, PROMPTS_BY_LANG['en'])
    field_dict = strings.get('field_names', PROMPTS_BY_LANG['en']['field_names'])

    if not missing_fields:
        name = data.get('first_name', '')
        greeting = f" {name}" if name else ""
        msg = f"{strings['all_set']}"
        return msg, msg

    missing_names = [field_dict.get(m['field'], m['label']) for m in missing_fields[:3]]
    if len(missing_names) > 1:
        missing_str = ", ".join(missing_names[:-1]) + (" and " if lang == 'en' else " மற்றும் " if lang == 'ta' else " और " if lang == 'hi' else " మరియు " if lang == 'te' else " ಮತ್ತು " if lang == 'kn' else " കൂടാതെ ") + missing_names[-1]
    else:
        missing_str = missing_names[0] if missing_names else "details"

    voice_prompt = strings['need_info'].format(missing_list=missing_str)
    bot_message = voice_prompt

    return voice_prompt, bot_message


def _fallback_voice_registration_extractor(text: str, current_data: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Robust offline rule-based extractor across all 6 languages."""
    lower = text.lower()
    data = dict(current_data)

    # 1. Experience years extractor
    exp_match = re.search(r'(\d+)\s*(?:years?|yrs?|வருட[^\s]*|வருஷ[^\s]*|ஆண்டுக[^\s]*|साल[^\s]*|वर्ष[^\s]*|సంవత్సర[^\s]*|ವರ್ಷ[^\s]*|വർഷ[^\s]*)', lower)
    if exp_match:
        try:
            data['experience_years'] = int(exp_match.group(1))
        except ValueError:
            pass

    # 2. Phone number extractor
    phone_match = re.search(r'(?:\+?91[\-\s]?)?[6789]\d{9}', text)
    if phone_match:
        data['phone'] = phone_match.group(0)

    # 3. Email extractor
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    if email_match:
        data['email'] = email_match.group(0)

    # 4. Name extraction heuristics
    name_patterns = [
        r'(?:my name is|i am|i\'m|name is|பெயர்|என் பெயர்|நாந்தான்|मेरा नाम|నా పేరు|ನನ್ನ ಹೆಸರು|എന്റെ പേര്)\s+([A-Za-z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+(?:\s+[A-Za-z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+)?)',
    ]
    for np in name_patterns:
        nm = re.search(np, text, re.IGNORECASE)
        if nm:
            parts = nm.group(1).strip().split()
            if parts:
                data['first_name'] = parts[0].capitalize()
                if len(parts) > 1:
                    data['last_name'] = " ".join(parts[1:]).capitalize()
            break

    # 5. Location heuristics
    location_keywords = [
        'Mylapore', 'Adyar', 'T. Nagar', 'Velachery', 'Anna Nagar', 'Guindy', 'Tambaram',
        'Chennai', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Coimbatore', 'Madurai', 'Kochi', 'Trivandrum',
        'சென்னை', 'மயிலாப்பூர்', 'அடையாறு', 'தி. நகர்', 'வேளச்சேரி'
    ]
    for loc in location_keywords:
        if loc.lower() in lower:
            data['address'] = loc if ('Chennai' in loc or 'சென்னை' in loc or 'Bangalore' in loc) else f"{loc}, Chennai, TN"
            break

    # 6. Password detection
    pwd_match = re.search(r'(?:password|கடவுச்சொல்|पासवर्ड|పాస్‌వర్డ్|ಪಾಸ್‌ವರ್ಡ್|പാസ്‌വേഡ്)\s*(?:is|:)?\s*([A-Za-z0-9@#$!%^&*]{4,20})', text, re.IGNORECASE)
    if pwd_match:
        data['password'] = pwd_match.group(1).strip()

    # 7. Category & Skill keyword rules
    category_slug = _infer_category_slug(data.get('skills', []), text)
    data['category_slug'] = category_slug

    cat_defaults = next((c for c in CATEGORIES if c['slug'] == category_slug), CATEGORIES[0])
    
    if not data.get('service_title'):
        if category_slug == 'cooking':
            data['service_title'] = "Traditional Home Cooking & Feast Catering"
            data['service_description'] = "Authentic traditional recipes made fresh with decades of home cooking expertise."
            data['skills'] = list(set(data.get('skills', []) + ['Traditional Cooking', 'Festival Sweets', 'Homemade Snacks']))
            data['suggested_price'] = 750.0
            data['pricing_unit'] = 'per service'
        elif category_slug == 'tailoring':
            data['service_title'] = "Custom Saree Blouse Stitching & Alterations"
            data['service_description'] = "Precision blouse tailoring, Aari embroidery handwork, and perfect garment alterations."
            data['skills'] = list(set(data.get('skills', []) + ['Saree Blouse Stitching', 'Aari Work Embroidery', 'Dress Alterations']))
            data['suggested_price'] = 600.0
            data['pricing_unit'] = 'per service'
        elif category_slug == 'tutoring':
            data['service_title'] = "One-on-One Academic & Language Tutoring"
            data['service_description'] = "Patient, experienced tutoring in core subjects and language skills for school students."
            data['skills'] = list(set(data.get('skills', []) + ['Language Teaching', 'Math & Science', 'School Mentorship']))
            data['suggested_price'] = 400.0
            data['pricing_unit'] = 'per hour'
        elif category_slug == 'gardening':
            data['service_title'] = "Terrace & Balcony Garden Consultation"
            data['service_description'] = "Organic potting mix, native herbs, and natural pest care for thriving terrace gardens."
            data['skills'] = list(set(data.get('skills', []) + ['Terrace Gardening', 'Organic Composting', 'Herbal Plants']))
            data['suggested_price'] = 500.0
            data['pricing_unit'] = 'per visit'
        else:
            data['service_title'] = cat_defaults['name']
            data['service_description'] = "Authentic traditional artisan service delivered with practical mastery."
            data['skills'] = list(set(data.get('skills', []) + ['Traditional Craftsmanship', 'Home Service']))
            data['suggested_price'] = float(cat_defaults['default_price'])
            data['pricing_unit'] = cat_defaults['unit']

    return data
