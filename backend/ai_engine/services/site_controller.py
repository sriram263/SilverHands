import re
from typing import Dict, Any, List, Optional
from .ai_client import ai_client

SITE_CONTROLLER_SYSTEM_PROMPT = """
You are "SilverHands Autonomous Website Co-Pilot & Site Controller", the intelligent AI agent responsible for directly controlling, navigating, and executing tasks on the SilverHands web platform on behalf of users, especially senior citizens and elders.

CRITICAL CONTROLLER AGENT CAPABILITIES:
1. SCREEN GROUNDING AWARENESS:
   - You receive the real-time `screen_context` containing:
     - `path`: Current URL pathname (e.g. "/", "/products", "/products/3", "/services", "/services/2", "/radar", "/orders", "/bookings", "/profile", "/register-voice").
     - `title`: Current page title & active headings.
     - `visible_items`: 1-indexed list of visible cards on screen (index, id, type, title, price, status, can_cancel, can_review, route).
     - `active_modal`: Active open modal (e.g. ORDER_MODAL, BOOKING_MODAL, REVIEW_MODAL) if any.
     - `active_product_detail` / `active_service_detail`: Active item if on a detail page (with customer reviews).
     - `reviews`: Customer reviews on the active page.
   - When the user refers to items on screen ("open the 2nd one", "the first cook", "cancel this booking", "leave a 5 star review", "read reviews"), you MUST look up `visible_items` or active details and resolve the exact ID, route, and parameters!

2. UNIVERSAL REDIRECTION & DEEP NAVIGATION:
   - You can redirect to ANY page across the entire SilverHands platform:
     - Home: "/"
     - Handmade Products / Marketplace: "/products", "/products/:id"
     - Traditional Services: "/services", "/services/:id"
     - Master Artisans / Providers: "/providers", "/providers/:id"
     - Opportunity Radar (local elder demand): "/radar"
     - AI Match / Skill Matcher: "/ai-match"
     - AI Voice Assistant / Wizard: "/ai-assistant", "/ai-wizard"
     - Voice Registration / Onboarding: "/register-voice"
     - Customer Activity: 
       * Orders (Purchased handmade goods/products): "/orders" (Tamil: ஆர்டர்கள், Hindi: ऑर्डर्स)
       * Bookings (Scheduled services/cooks/tailors appointments): "/bookings" (Tamil: முன்பதிவுகள், Hindi: बुकिंग्स)
       * Messages: "/messages"
       * Profile: "/profile"
     - Provider Management: "/provider/dashboard", "/skill-passport"
     - Admin Control Panel: "/admin-panel"
     - Auth: "/login", "/register"

3. AUTONOMOUS TRANSACTION EXECUTION & WORKFLOWS:
   - "PLACE_ORDER": Placed ONLY when a specific product is identified on screen, on a product detail page, or specified by ordinal/name ("order the 1st product", "order this mango pickle").
     * IMPORTANT: If the user simply asks to "place an order" or "buy" without specifying any product and without being on a product detail page, DO NOT create an undefined order. Reply asking the user to "Please select a correct order or product first." and navigate to "/products".
   - "BOOK_SERVICE": Placed when user asks to book a service on screen or on a service detail page.
   - "CANCEL_TRANSACTION": Cancels a booking appointment or product order (requires elder confirmation guardrail).
   - "SWITCH_TAB": Navigates between category status tabs on Bookings ("/bookings?tab=PENDING", "/bookings?tab=COMPLETED") or Orders ("/orders?tab=ACTIVE", "/orders?tab=DELIVERED").
   - "SUBMIT_REVIEW": Submits a star rating (1-5) and feedback comment for a booking, order, service, or product.
   - "READ_REVIEWS": Reads and summarizes customer reviews on the current page aloud.
   - "SELECT_ITEM": Navigates to a specific item details page by index ("open the 2nd product").
   - "TOGGLE_SENIOR_MODE": Toggles high-contrast elder accessibility mode.
   - "SET_LANGUAGE": Switches language ("en", "ta", "hi", "te", "kn", "ml").
   - "READ_SCREEN": Summarizes the on-screen items for the elder user.
   - "SCROLL_PAGE": Scrolls "down", "up", "top", or "bottom".
   - "SEARCH" / "FILTER": Searches or filters catalog by keywords and price range.

4. MULTILINGUAL DIALOGUE:
   - Always reply in the user's language script (English, Tamil, Hindi, Telugu, Kannada, Malayalam).
   - Keep spoken_text crisp and plain text without symbols or markdown.

SCHEMA SPECIFICATION:
Return valid JSON matching:
{
  "reply": "Conversational explanation of what action you are taking (1-2 sentences).",
  "spoken_text": "Plain text for speech synthesis without markdown or symbols.",
  "suggested_actions": ["Action 1", "Action 2", "Action 3"],
  "route_suggestion": "/products or /services or /bookings or /orders or null",
  "action": {
    "type": "NAVIGATE | SELECT_ITEM | PLACE_ORDER | BOOK_SERVICE | CANCEL_TRANSACTION | SWITCH_TAB | SUBMIT_REVIEW | READ_REVIEWS | CLICK_ELEMENT | TOGGLE_SENIOR_MODE | SET_LANGUAGE | READ_SCREEN | SCROLL_PAGE | SEARCH | FILTER | NONE",
    "target": "/products/2 or /bookings?tab=PENDING or /products or null",
    "params": {
      "item_id": 2,
      "transaction_type": "booking | order | null",
      "booking_id": 2,
      "order_id": 2,
      "service_id": 2,
      "product_id": 2,
      "rating": 5,
      "comment": "Review text comment",
      "tab": "ALL | PENDING | ACCEPTED | UPCOMING | COMPLETED | CANCELLED | ACTIVE | SHIPPED | DELIVERED",
      "page": "bookings | orders",
      "item_type": "product | service | provider | booking | order | null",
      "title": "Title of the target item",
      "quantity": 1,
      "message": "Delivery instructions",
      "date": "Tomorrow",
      "time": "10:00 AM",
      "hours": 2,
      "route": "/products/2",
      "language_code": "en | ta | hi | te | kn | ml | null",
      "scroll_direction": "down | up | top | bottom | null",
      "query": "search text",
      "category": "category slug",
      "min_price": "min price string e.g. 100",
      "max_price": "max price string e.g. 500",
      "target_page": "products | services | providers | bookings | orders"
    },
    "requires_confirmation": false,
    "confirmation_prompt": null
  }
}
"""

def _detect_language_code(language: str, text: str) -> str:
    if language in ['ta', 'hi', 'te', 'kn', 'ml', 'en']:
        return language
    if re.search(r'[஀-௿]', text):
        return 'ta'
    if re.search(r'[ऀ-ॿ]', text):
        return 'hi'
    if re.search(r'[ఀ-౿]', text):
        return 'te'
    if re.search(r'[ಀ-೿]', text):
        return 'kn'
    if re.search(r'[ഀ-ൿ]', text):
        return 'ml'
    return 'en'

def _extract_ordinal_index(msg: str) -> Optional[int]:
    """Extracts 1-based ordinal index from message in 6 languages."""
    lower = msg.lower()
    
    # 1. First
    if any(w in lower for w in ['1st', 'first', 'first one', 'item 1', '#1', 'one', 'முதல்', 'முதலாவது', 'पहला', 'एक', 'ఒకటో', 'మొదటి', 'ಮೊದಲ', 'ಒಂದನೇ', 'ಒನ್ನಾಮത്തെ', 'ആദ്യ']):
        return 1
    # 2. Second
    if any(w in lower for w in ['2nd', 'second', 'second one', 'item 2', '#2', 'two', 'இரண்டாவது', 'இரண்டாம்', 'இரண்டு', 'दूसरा', 'दो', 'రెండో', 'రెండవ', 'ಎರಡನೇ', 'ಎರಡು', 'രണ്ടാമത്തെ', 'രണ്ട്']):
        return 2
    # 3. Third
    if any(w in lower for w in ['3rd', 'third', 'third one', 'item 3', '#3', 'three', 'மூன்றாவது', 'மூன்றாம்', 'மூன்று', 'तीसरा', 'तीन', 'మూడో', 'మూడవ', 'ಮೂರನೇ', 'ಮೂರು', 'മൂന്നാമത്തെ', 'മൂന്ന്']):
        return 3
    # 4. Fourth
    if any(w in lower for w in ['4th', 'fourth', 'fourth one', 'item 4', '#4', 'four', 'நான்காவது', 'நான்கு', 'चौथा', 'चार', 'నాలుగో', 'ನಾಲ್ಕನೇ', 'നാലാമത്തെ']):
        return 4
    # 5. Fifth
    if any(w in lower for w in ['5th', 'fifth', 'item 5', '#5', 'ஐந்தாவது', 'ஐந்து', 'पाँचवाँ', 'ಐದನೇ']):
        return 5
    # 6. Number search
    num_match = re.search(r'\b([1-9])\b', lower)
    if num_match:
        return int(num_match.group(1))
    return None

def _extract_rating_score(msg: str) -> int:
    """Extracts star rating from 1 to 5 from voice input."""
    lower = msg.lower()
    m = re.search(r'([1-5])\s*(?:star|stars|star rating|rating|நட்சத்திரம்|நட்சத்திரங்கள்|सितारे|स्टार|రేటింగ్|స్టార్)', lower)
    if m:
        return int(m.group(1))
    if '5' in lower or 'five' in lower or 'ஐந்து' in lower or 'पाँच' in lower or 'ಐದು' in lower:
        return 5
    if '4' in lower or 'four' in lower or 'நான்கு' in lower or 'चार' in lower:
        return 4
    if '3' in lower or 'three' in lower or 'மூன்று' in lower or 'तीन' in lower:
        return 3
    if '2' in lower or 'two' in lower or 'இரண்டு' in lower or 'दो' in lower:
        return 2
    if '1' in lower or 'one' in lower or 'ஒரு' in lower or 'एक' in lower:
        return 1
    return 5

def _parse_filter_request(msg: str) -> Optional[Dict[str, Any]]:
    lower = msg.lower()
    min_price = None
    max_price = None
    
    # 1. Price patterns
    m_between = re.search(r'(?:between|from)\s+(\d+)\s*(?:and|to)\s*(\d+)', lower)
    if not m_between:
        m_between = re.search(r'(\d+)\s*(?:to|-)\s*(\d+)\s*(?:rs|rupees|inr|ரூபாய்|ரुपये)?', lower)
    if not m_between:
        m_between = re.search(r'(\d+)\s*முதல்\s*(\d+)\s*வரை', lower)
    if not m_between:
        m_between = re.search(r'(\d+)\s*से\s*(\d+)\s*(?:के बीच|तक)?', lower)

    if m_between:
        min_price = m_between.group(1)
        max_price = m_between.group(2)
    else:
        # Under / Below / Less than / Max price
        m_under = re.search(r'(?:under|below|less than|max price|max|maximum|upto|within|<=?)\s*:?\s*₹?\s*(\d+)', lower)
        if not m_under:
            m_under = re.search(r'(\d+)\s*(?:rs|rupees|inr|ரூபாய்|ரुपये)?\s*(?:க்கு\s*குறைவாக|க்கு\s*கீழே|க்குள்|வரை|ரூபாய்க்குள்|से\s*कम|के\s*अंदर|వరకు|ಒಳಗೆ|താഴെ)', lower)
        if m_under:
            max_price = m_under.group(1)

        # Above / More than / Greater than / Min price
        m_above = re.search(r'(?:above|more than|greater than|min price|min|minimum|at least|>=?)\s*:?\s*₹?\s*(\d+)', lower)
        if not m_above:
            m_above = re.search(r'(\d+)\s*(?:rs|rupees|inr|ரூபாய்|ரुपये)?\s*(?:க்கு\s*மேல்|க்கு\s*அதிகமாக|से\s*ज्यादा|से\s*अधिक|పైన|ಹೆಚ್ಚು|മുകളിൽ)', lower)
        if m_above:
            min_price = m_above.group(1)

    # 2. Category matching
    cat_slug = None
    if any(k in lower for k in ['pickle', 'snack', 'murukku', 'biscuit', 'sweet', 'cooking', 'food', 'culinary', 'ஊறுகாய்', 'முறுக்கு', 'ஸ்நாக்ஸ்', 'சமையல்', 'अचार', 'नमकीन', 'स्नैक्स', 'मिठाई', 'रसोई']):
        cat_slug = 'cooking'
    elif any(k in lower for k in ['garden', 'gardening', 'plant', 'vermicompost', 'compost', 'seed', 'தோட்டம்', 'உரம்', 'செடி', 'बागवानी', 'खाद', 'पौधे']):
        cat_slug = 'gardening'
    elif any(k in lower for k in ['tailor', 'tailoring', 'stitch', 'blouse', 'alteration', 'தையல்', 'தைக்க', 'दर्जी', 'सिलाई']):
        cat_slug = 'tailoring'
    elif any(k in lower for k in ['craft', 'bag', 'bags', 'cotton bag', 'decor', 'handicraft', 'கைவினை', 'பை', 'हस्तशिल्प', 'बैग']):
        cat_slug = 'handicrafts'
    elif any(k in lower for k in ['tutor', 'tutoring', 'tuition', 'study', 'maths', 'science', 'டியூஷன்', 'கல்வி', 'ट्यूशन', 'पढ़ाई']):
        cat_slug = 'tutoring'
    elif any(k in lower for k in ['childcare', 'eldercare', 'companion', 'பராமரிப்பு', 'देखभाल']):
        cat_slug = 'childcare'

    # 3. Clean search query keyword
    clean_query = lower
    triggers_to_strip = [
        'show me', 'show', 'filter', 'search for', 'search', 'find me', 'find', 'look for', 'get me', 'list', 'display',
        'under', 'below', 'less than', 'above', 'more than', 'between', 'and', 'to', 'rupees', 'rs', 'inr', 'price',
        'with', 'max', 'min', 'maximum', 'minimum',
        'காட்டு', 'தேடு', 'வடிகட்டு', 'பொருட்கள்', 'பொருள்', 'சேவை', 'ரூபாய்', 'ரூபாய்க்குள்', 'குறைவாக', 'மேல்', 'க்குள்', 'வரை',
        'दिखाओ', 'ढूंढो', 'खोजो', 'फ़िल्टर', 'उत्पाद', 'सेवा', 'रुपये', 'से कम', 'से ज्यादा', 'के', 'तक'
    ]
    if min_price:
        clean_query = clean_query.replace(min_price, '')
    if max_price:
        clean_query = clean_query.replace(max_price, '')
    
    for tr in triggers_to_strip:
        clean_query = re.sub(r'(\b|(?<=\s)|(?<=^))' + re.escape(tr) + r'(\b|(?=\s)|(?=$))', ' ', clean_query)
    
    clean_query = re.sub(r'[\d₹#:]', ' ', clean_query)
    clean_query = ' '.join(clean_query.split()).strip()

    target_page = 'products'
    if any(k in lower for k in ['service', 'services', 'cook service', 'tailoring service', 'gardener service', 'tuition', 'சேவை', 'सेवा']):
        target_page = 'services'
    elif any(k in lower for k in ['provider', 'providers', 'artisan', 'artisans', 'cooks', 'homemakers', 'elders', 'people', 'கலைஞர்கள்', 'कारीगर']):
        target_page = 'providers'
    elif any(k in lower for k in ['product', 'products', 'item', 'items', 'goods', 'pickle', 'murukku', 'bag', 'vermicompost', 'snack', 'biscuit', 'பொருள்', 'பொருட்கள்', 'उत्पाद']):
        target_page = 'products'

    if min_price or max_price or cat_slug or clean_query or any(k in lower for k in ['filter', 'search', 'find', 'வடிகட்டு', 'தேடு', 'फ़िल्टर', 'खोज']):
        return {
            'target_page': target_page,
            'query': clean_query,
            'category': cat_slug,
            'min_price': min_price,
            'max_price': max_price
        }
    return None

def _resolve_screen_action(message: str, history: List[Dict[str, str]] = None, language: str = 'en', user_info: Dict[str, Any] = None, screen_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Deterministic real-time screen resolver ensuring 100% accurate website control,
    index resolution, order drafting, cancellation, review management, multi-turn confirmation handling, and deep routing even if offline.
    """
    msg = (message or '').lower().strip()
    history = history or []
    screen_context = screen_context or {}
    path = screen_context.get('path', '/')
    visible_items = screen_context.get('visible_items', [])
    active_prod = screen_context.get('active_product_detail')
    active_serv = screen_context.get('active_service_detail')
    screen_reviews = screen_context.get('reviews') or (active_prod.get('reviews') if active_prod else active_serv.get('reviews') if active_serv else [])

    lang = _detect_language_code(language, message)

    # Dictionary of responses per language
    text_bundle = {
        'en': {
            'navigating': lambda dest: f"Navigating to {dest.replace('/', '').capitalize() or 'Home'}.",
            'opened_item': lambda title, idx: f"Opening item #{idx}: {title}.",
            'order_placed': lambda title: f"Drafting your order for {title}. Confirming your order now.",
            'order_success': lambda title: f"Order for {title} has been submitted successfully!",
            'select_order_first': "Please select a correct order or product first. You can browse our handmade products or say 'open item number 1'.",
            'book_service': lambda title: f"Opening booking for {title}.",
            'cancel_prompt': lambda ttype, title, id_val: f"Are you sure you want to cancel {ttype} #{id_val} ({title})? Say YES or click Confirm.",
            'cancel_reply': lambda ttype, title: f"I am preparing to cancel your {ttype} for {title}. Please confirm.",
            'tab_switched': lambda tab, page: f"Switched to {tab} {page}.",
            'review_prompt': lambda rating, title: f"Confirm leaving a {rating}-star review for {title}? Say YES or click Confirm.",
            'review_reply': lambda rating, title: f"Preparing to submit your {rating}-star review for {title}.",
            'reading_reviews': lambda count, summary: f"Here are the reviews ({count} found): {summary}" if summary else "No reviews are currently posted for this item.",
            'senior_mode': "Toggled Senior Accessibility Mode with large text and high contrast.",
            'screen_read': lambda count: f"You are currently on {path}. There are {count} items visible on screen.",
            'scrolled': "Scrolling page for you.",
            'scrolled_top': "Moving to the top of the page.",
            'scrolled_bottom': "Moving to the bottom of the page.",
            'filter_applied': lambda desc: f"Filtering catalog for {desc}."
        },
        'ta': {
            'navigating': lambda dest: f"{dest.replace('/', '').capitalize()} பக்கத்திற்குச் செல்கிறோம்.",
            'opened_item': lambda title, idx: f"வரிசை எண் #{idx}: {title} விவரங்களைத் திறக்கிறேன்.",
            'order_placed': lambda title: f"{title} பொருளுக்கான உங்கள் ஆர்டரைத் தயார் செய்கிறேன்.",
            'order_success': lambda title: f"{title} வெற்றிகரமாக ஆர்டர் செய்யப்பட்டுவிட்டது!",
            'select_order_first': "தயவுசெய்து முதலில் ஆர்டர் செய்ய வேண்டிய சரியான பொருளைத் தேர்ந்தெடுக்கவும். நீங்கள் தயாரிப்புகளை உலாவலாம் அல்லது 'முதல் பொருளைத் திற' என்று கூறலாம்.",
            'book_service': lambda title: f"{title} சேவைக்கான முன்பதிவைத் திறக்கிறேன்.",
            'cancel_prompt': lambda ttype, title, id_val: f"{title} ({ttype} #{id_val}) ரத்து செய்யவா? உறுதிப்படுத்த 'ஆம்' என்று சொல்லுங்கள்.",
            'cancel_reply': lambda ttype, title: f"{title} {ttype} ரத்து செய்யத் தயாராகிறது. தயவுசெய்து உறுதிப்படுத்தவும்.",
            'tab_switched': lambda tab, page: f"{tab} {page} பகுதிக்கு மாற்றப்பட்டது.",
            'review_prompt': lambda rating, title: f"{title} க்கு {rating} நட்சத்திர மதிப்பீடு மற்றும் விமர்சனத்தை பதிவு செய்யவா?",
            'review_reply': lambda rating, title: f"{title} க்கு {rating} நட்சத்திர விமர்சனம் தயார் செய்யப்படுகிறது.",
            'reading_reviews': lambda count, summary: f"வாடிக்கையாளர் விமர்சனங்கள் ({count}): {summary}" if summary else "இந்த பொருளுக்கு இதுவரை விமர்சனங்கள் இல்லை.",
            'senior_mode': "பெரிய எழுத்துக்கள் மற்றும் உயர் மாறுபாடு முறை மாற்றப்பட்டது.",
            'screen_read': lambda count: f"நீங்கள் இப்போது {path} பக்கத்தில் உள்ளீர்கள். திரையில் {count} பொருட்கள் கிடைக்கின்றன.",
            'scrolled': "பக்கத்தை உருட்டுகிறேன்.",
            'scrolled_top': "பக்கத்தின் ஆரம்பத்திற்கு செல்கிறேன்.",
            'scrolled_bottom': "பக்கத்தின் கீழ் பகுதிக்கு செல்கிறேன்.",
            'filter_applied': lambda desc: f"{desc} அடிப்படையில் பொருட்களை வடிகட்டுகிறேன்."
        },
        'hi': {
            'navigating': lambda dest: f"{dest.replace('/', '').capitalize()} पेज खोला जा रहा है।",
            'opened_item': lambda title, idx: f"आइटम #{idx}: {title} खोला जा रहा है।",
            'order_placed': lambda title: f"{title} के लिए ऑर्डर तैयार किया जा रहा है।",
            'order_success': lambda title: f"{title} का ऑर्डर सफलतापूर्वक दर्ज कर दिया गया है!",
            'select_order_first': "कृपया पहले ऑर्डर करने के लिए एक सही उत्पाद या ऑर्डर चुनें। आप उत्पादों को देख सकते हैं या 'पहला आइटम खोलो' कह सकते हैं।",
            'book_service': lambda title: f"{title} सेवा के लिए बुकिंग खोली जा रही है।",
            'cancel_prompt': lambda ttype, title, id_val: f"क्या आप {title} ({ttype} #{id_val}) को रद्द करना चाहते हैं? पुष्टि के लिए हाँ कहें।",
            'cancel_reply': lambda ttype, title: f"{title} {ttype} को रद्द करने की तैयारी की जा रही है।",
            'tab_switched': lambda tab, page: f"{tab} {page} टैब खोला गया।",
            'review_prompt': lambda rating, title: f"क्या आप {title} के लिए {rating}-स्टार रिव्यू सबमिट करना चाहते हैं?",
            'review_reply': lambda rating, title: f"{title} के लिए {rating}-स्टार रिव्यू तैयार किया जा रहा है।",
            'reading_reviews': lambda count, summary: f"समीक्षाएं ({count}): {summary}" if summary else "इस आइटम के लिए अभी कोई समीक्षा उपलब्ध नहीं है।",
            'senior_mode': "वरिष्ठ नागरिकों के लिए बड़ा टेक्स्ट और हाई कंट्रास्ट मोड टॉगल किया गया।",
            'screen_read': lambda count: f"आप वर्तमान में {path} पर हैं। स्क्रीन पर {count} आइटम दिखाई दे रहे हैं।",
            'scrolled': "पेज को स्क्रॉल किया जा रहा है।",
            'scrolled_top': "पेज के शुरुआत में जा रहे हैं।",
            'scrolled_bottom': "पेज के नीचे जा रहे हैं।",
            'filter_applied': lambda desc: f"{desc} के लिए फ़िल्टर लागू किया जा रहा है।"
        },
        'te': {
            'navigating': lambda dest: f"{dest} పేజీకి వెళ్తున్నాము.",
            'opened_item': lambda title, idx: f"అంశం #{idx}: {title} తెరవబడుతోంది.",
            'order_placed': lambda title: f"{title} కోసం ఆర్డర్ సిద్ధం చేయబడుతోంది.",
            'order_success': lambda title: f"{title} ఆర్డర్ విజయవంతంగా సమర్పించబడింది!",
            'select_order_first': "దయచేసి ముందుగా సరైన ఉత్పత్తి లేదా ఆర్డర్‌ను ఎంచుకోండి.",
            'book_service': lambda title: f"{title} సేవా బుకింగ్ ప్రారంభించబడింది.",
            'cancel_prompt': lambda ttype, title, id_val: f"{title} ({ttype} #{id_val}) రద్దు చేయాలనుకుంటున్నారా? అవును అని చెప్పండి.",
            'cancel_reply': lambda ttype, title: f"{title} రద్దు చేయబడుతోంది.",
            'tab_switched': lambda tab, page: f"{tab} {page} కు మార్చబడింది.",
            'review_prompt': lambda rating, title: f"{title} కు {rating} స్టార్ రేటింగ్ ఇవ్వాలా?",
            'review_reply': lambda rating, title: f"{title} కు రేటింగ్ నమోదు చేయబడుతోంది.",
            'reading_reviews': lambda count, summary: f"సమీక్షలు: {summary}" if summary else "సమీక్షలు లేవు.",
            'senior_mode': "సీనియర్ మోడ్ మార్చబడింది.",
            'screen_read': lambda count: f"మీరు {path} పేజీలో ఉన్నారు.",
            'scrolled': "పేజీ స్క్రోల్ చేయబడుతోంది.",
            'scrolled_top': "పేజీ పైభాగానికి వెళ్తున్నాము.",
            'scrolled_bottom': "పేజీ క్రింది భాగానికి వెళ్తున్నాము.",
            'filter_applied': lambda desc: f"{desc} కోసం ఫిల్టర్ చేస్తున్నాము."
        },
        'kn': {
            'navigating': lambda dest: f"{dest} ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.",
            'opened_item': lambda title, idx: f"ಆಯ್ಕೆ #{idx}: {title} ತೆರೆಯಲಾಗುತ್ತಿದೆ.",
            'order_placed': lambda title: f"{title} ಗಾಗಿ ಆರ್ಡರ್ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ.",
            'order_success': lambda title: f"{title} ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿದೆ!",
            'select_order_first': "ದಯವಿಟ್ಟು ಮೊದಲು ಸರಿಯಾದ ಉತ್ಪನ್ನ ಅಥವಾ ಆರ್ಡರ್ ಅನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            'book_service': lambda title: f"{title} ಸೇವಾ ಬುಕಿಂಗ್ ತೆರೆಯಲಾಗಿದೆ.",
            'cancel_prompt': lambda ttype, title, id_val: f"{title} ರದ್ದುಗೊಳಿಸಬೇಕೇ?",
            'cancel_reply': lambda ttype, title: f"{title} ರದ್ದುಮಾಡಲಾಗುತ್ತಿದೆ.",
            'tab_switched': lambda tab, page: f"{tab} {page} ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.",
            'review_prompt': lambda rating, title: f"{title} ಗೆ {rating} ಸ್ಟಾರ್ ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಬೇಕೇ?",
            'review_reply': lambda rating, title: f"{title} ಗೆ ವಿಮರ್ಶೆ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ.",
            'reading_reviews': lambda count, summary: f"ವಿಮರ್ಶೆಗಳು: {summary}" if summary else "ವಿಮರ್ಶೆಗಳಿಲ್ಲ.",
            'senior_mode': "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ.",
            'screen_read': lambda count: f"ನೀವು {path} ಪುಟದಲ್ಲಿದ್ದೀರಿ.",
            'scrolled': "ಪುಟವನ್ನು ಸ್ಕ್ರೋಲ್ ಮಾಡಲಾಗುತ್ತಿದೆ.",
            'scrolled_top': "ಪುಟದ ಆರಂಭಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
            'scrolled_bottom': "ಪುಟದ ಕೊನೆಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
            'filter_applied': lambda desc: f"{desc} ಗಾಗಿ ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಲಾಗುತ್ತಿದೆ."
        },
        'ml': {
            'navigating': lambda dest: f"{dest} പേജിലേക്ക് പോകുന്നു.",
            'opened_item': lambda title, idx: f"ഇനം #{idx}: {title} തുറക്കുന്നു.",
            'order_placed': lambda title: f"{title} ഓർഡർ തയ്യാറാക്കുന്നു.",
            'order_success': lambda title: f"{title} ഓർഡർ വിജയകരമായി സമർപ്പിച്ചു!",
            'select_order_first': "ഓർഡർ ചെയ്യുന്നതിന് മുമ്പ് ദയവായി ശരിയായ ഉൽപ്പന്നം തിരഞ്ഞെടുക്കുക.",
            'book_service': lambda title: f"{title} ബുക്കിംഗ് തുറക്കുന്നു.",
            'cancel_prompt': lambda ttype, title, id_val: f"{title} റദ്ദാക്കണമോ?",
            'cancel_reply': lambda ttype, title: f"{title} റദ്ദാക്കുന്നു.",
            'tab_switched': lambda tab, page: f"{tab} {page} മാറ്റി.",
            'review_prompt': lambda rating, title: f"{title} ന് {rating} സ്റ്റാർ റിവ്യൂ നൽകണമോ?",
            'review_reply': lambda rating, title: f"{title} ന് റിവ്യൂ സമർപ്പിക്കുന്നു.",
            'reading_reviews': lambda count, summary: f"അവലോകനങ്ങൾ: {summary}" if summary else "അവലോകനങ്ങൾ ലഭ്യമല്ല.",
            'senior_mode': "സീനിയർ മോഡ് മാറ്റി.",
            'screen_read': lambda count: f"നിങ്ങൾ {path} പേജിലാണ്.",
            'scrolled': "പേജ് സ്ക്രോൾ ചെയ്യുന്നു.",
            'scrolled_top': "പേജിന്റെ തുടക്കത്തിലേക്ക് പോകുന്നു.",
            'scrolled_bottom': "പേജിന്റെ താഴേക്ക് പോകുന്നു.",
            'filter_applied': lambda desc: f"{desc} അടിസ്ഥാനമാക്കി ഫിൽട്ടർ ചെയ്യുന്നു."
        }
    }
    t = text_bundle.get(lang, text_bundle['en'])

    # 0. Check for Direct Confirmation or Rejection Response (Multi-Turn Dialogue Resolution)
    # Strip apostrophes first so "don't" -> "dont", then space out other punctuation
    clean_msg = re.sub(r"['’]", "", msg)
    clean_msg = re.sub(r"[.,?!:;_\-]", " ", clean_msg)
    clean_msg = " ".join(clean_msg.split()).strip()
    words_list = clean_msg.split()

    # Differentiate between a command to cancel a booking/order ("cancel my booking", "cancel 1st booking")
    # vs a pure rejection response ("dont cancel", "no", "leave it", "dont place it")
    is_cancel_action_command = any(k in msg for k in ['booking', 'order', 'appointment', 'item', 'first', 'second', '1st', '2nd', '#', 'முன்பதி', 'ஆர்டர்', 'பொருள்', 'சேவை', 'बुकिंग', 'ऑर्डर', 'आइटम']) and any(k in msg for k in ['cancel', 'cancellation', 'ரத்து', 'रद्द', 'कैंसिल'])

    cancel_phrases = [
        "dont place it", "dont retrieve it", "dont cancel", "do not place", "do not retrieve", "do not cancel",
        "dont place", "dont retrieve", "dont do it", "no", "dismiss", "dont", "never mind", "nevermind",
        "stop", "abort", "reject", "decline", "leave it", "keep it", "not now", "no cancel", "no dont",
        # Tamil
        "வேண்டாம்", "இல்லை", "போடாதே", "ஆர்டர் செய்யாதே", "ரத்து செய்யாதே", "நிறுத்து", "இப்போது வேண்டாம்",
        # Hindi
        "नहीं", "मत करो", "ऑर्डर मत करो", "रद्द मत करो", "रहने दो", "मत करना", "अभी नहीं",
        # Telugu / Kannada / Malayalam
        "వద్దు", "చేయవద్దు", "ಬೇಡ", "ಮಾಡಬೇಡಿ", "വേണ്ട", "ചെയ്യരുത്"
    ]

    confirm_phrases = [
        "yes", "okay", "ok", "confirm", "confirm it", "place it", "place order", "place the order", "place",
        "proceed", "sure", "do it", "go ahead", "accept", "accept it", "book it", "book", "submit", "submit it",
        "yes cancel", "yes place it", "cancel it", "yes do it", "please", "yeah", "yep", "correct", "fine", "alright",
        # Tamil
        "ஆமாம்", "சரி", "உறுதி செய்", "உறுதி", "ஆர்டர் செய்", "ஆம்", "சரி செய்", "போடு", "பதிவு செய்", "நிச்சயமாக",
        # Hindi
        "हाँ", "पुष्टि करें", "पुष्टि", "ऑर्डर करो", "कर दो", "हाँ करो", "सही है", "जरूर", "बुक करो",
        # Telugu
        "అవును", "సరే", "ధృవీకరించు", "ఆర్డర్ చేయండి",
        # Kannada
        "ಹೌದು", "ಸರಿ", "ಖಚಿತಪಡಿಸಿ", "ಆರ್ಡರ್ ಮಾಡಿ",
        # Malayalam
        "അതെ", "ശരി", "ഉറപ്പാക്കുക", "ഓർഡർ ചെയ്യുക"
    ]

    is_explicit_cancel = not is_cancel_action_command and any(clean_msg == p or clean_msg.startswith(p + " ") or (" " + p + " ") in (" " + clean_msg + " ") or clean_msg.endswith(" " + p) or (len(words_list) <= 2 and p in words_list) for p in cancel_phrases)
    is_explicit_confirm = not is_cancel_action_command and not is_explicit_cancel and any(clean_msg == p or clean_msg.startswith(p + " ") or (" " + p + " ") in (" " + clean_msg + " ") or clean_msg.endswith(" " + p) or (len(words_list) <= 3 and p in words_list) for p in confirm_phrases)

    if (is_explicit_cancel or is_explicit_confirm) and not is_cancel_action_command:
        # Inspect past conversation history for pending guarded actions
        prev_bot_texts = [h.get('text', '') for h in history if h.get('sender') in ['bot', 'assistant', 'Controller']][-3:]
        combined_prev = " ".join(prev_bot_texts).lower()

        if is_explicit_cancel:
            cancel_feedback = (
                "Action has been cancelled as requested." if lang == 'en'
                else "செயல்முறை ரத்து செய்யப்பட்டது." if lang == 'ta'
                else "कार्य रद्द कर दिया गया।" if lang == 'hi'
                else "రద్దు చేయబడింది." if lang == 'te'
                else "ರದ್ದುಮಾಡಲಾಗಿದೆ." if lang == 'kn'
                else "റദ്ദാക്കി."
            )
            return {
                "reply": cancel_feedback,
                "spoken_text": cancel_feedback,
                "suggested_actions": ["Explore Marketplace", "My Bookings", "My Orders"],
                "route_suggestion": path,
                "action": {
                    "type": "NONE",
                    "target": path,
                    "params": {},
                    "requires_confirmation": False
                }
            }

        if is_explicit_confirm:
            # 1. Was it a cancellation confirmation?
            if any(k in combined_prev for k in ['cancel', 'ரத்து', 'रद्द', 'booking #', 'order #']) or '/bookings' in path or '/orders' in path:
                # Find booking/order ID from previous message or visible items
                id_m = re.search(r'(?:booking|order|#)\s*(\d+)', combined_prev)
                target_id = int(id_m.group(1)) if id_m else None
                
                is_booking = '/bookings' in path or 'booking' in combined_prev or 'முன்பதிவு' in combined_prev or 'बुकिंग' in combined_prev
                ttype = 'booking' if is_booking else 'order'
                target_dest = '/bookings' if is_booking else '/orders'
                
                if not target_id and visible_items:
                    cand = next((it for it in visible_items if it.get('can_cancel') or it.get('status') in ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ACTIVE', 'SHIPPED']), visible_items[0])
                    target_id = cand.get('id', 1)
                    target_title = cand.get('title', f"{ttype.capitalize()} #{target_id}")
                else:
                    target_id = target_id or 1
                    target_title = f"{ttype.capitalize()} #{target_id}"

                confirm_reply = (
                    f"Action confirmed! Your {ttype} #{target_id} has been cancelled successfully." if lang == 'en'
                    else f"உறுதி செய்யப்பட்டது! {target_title} ரத்து செய்யப்பட்டுவிட்டது." if lang == 'ta'
                    else f"पुष्टि हो गई! आपका {target_title} सफलतापूर्वक रद्द कर दिया गया है।" if lang == 'hi'
                    else f"{target_title} విజయవంతంగా రద్దు చేయబడింది." if lang == 'te'
                    else f"{target_title} ಯಶಸ್ವಿಯಾಗಿ ರದ್ದುಗೊಂಡಿದೆ."
                )
                return {
                    "reply": confirm_reply,
                    "spoken_text": confirm_reply,
                    "suggested_actions": ["My Bookings", "My Orders", "Explore Products"],
                    "route_suggestion": target_dest,
                    "action": {
                        "type": "CANCEL_TRANSACTION",
                        "target": target_dest,
                        "params": {
                            "item_id": target_id,
                            "booking_id": target_id if ttype == 'booking' else None,
                            "order_id": target_id if ttype == 'order' else None,
                            "transaction_type": ttype,
                            "title": target_title,
                            "route": target_dest
                        },
                        "requires_confirmation": False
                    }
                }

            # 2. Was it an order confirmation?
            if any(k in combined_prev for k in ['order for', 'drafting your order', 'ஆர்டர்', 'ऑर्डर']) or active_prod or '/products' in path:
                p_title = active_prod.get('title') if active_prod else (visible_items[0].get('title') if visible_items else 'Handmade Product')
                p_id = active_prod.get('id') if active_prod else (visible_items[0].get('id') if visible_items else 1)
                p_route = active_prod.get('route') if active_prod else (f"/products/{p_id}" if p_id else "/products")
                
                order_reply = (
                    f"Order confirmed! 1x {p_title} has been placed successfully." if lang == 'en'
                    else f"உறுதி செய்யப்பட்டது! {p_title} வெற்றிகரமாக ஆர்டர் செய்யப்பட்டது." if lang == 'ta'
                    else f"पुष्टि हो गई! {p_title} का ऑर्डर दर्ज कर दिया गया है।" if lang == 'hi'
                    else f"{p_title} ఆర్డర్ విజయవంతంగా నమోదు చేయబడింది."
                )
                return {
                    "reply": order_reply,
                    "spoken_text": order_reply,
                    "suggested_actions": ["My Orders", "Explore Marketplace", "Home"],
                    "route_suggestion": "/orders",
                    "action": {
                        "type": "PLACE_ORDER",
                        "target": p_route,
                        "params": {
                            "item_id": p_id,
                            "product_id": p_id,
                            "item_type": "product",
                            "title": p_title,
                            "quantity": 1,
                            "route": p_route
                        },
                        "requires_confirmation": False
                    }
                }

            # 3. Was it a service booking confirmation?
            if any(k in combined_prev for k in ['booking for', 'service', 'முன்பதிவு', 'बुकिंग']) or active_serv or '/services' in path:
                s_title = active_serv.get('title') if active_serv else (visible_items[0].get('title') if visible_items else 'Traditional Service')
                s_id = active_serv.get('id') if active_serv else (visible_items[0].get('id') if visible_items else 1)
                s_route = active_serv.get('route') if active_serv else (f"/services/{s_id}" if s_id else "/services")
                
                booking_reply = (
                    f"Booking confirmed! Appointment for {s_title} has been scheduled." if lang == 'en'
                    else f"முன்பதிவு உறுதி செய்யப்பட்டது! {s_title} சேவைக்கான நேரம் பதிவு செய்யப்பட்டது." if lang == 'ta'
                    else f"बुकिंग की पुष्टि हो गई! {s_title} सेवा बुक कर दी गई है।" if lang == 'hi'
                    else f"{s_title} బుకింగ్ నిర్ధారించబడింది."
                )
                return {
                    "reply": booking_reply,
                    "spoken_text": booking_reply,
                    "suggested_actions": ["My Bookings", "Explore Services", "Home"],
                    "route_suggestion": "/bookings",
                    "action": {
                        "type": "BOOK_SERVICE",
                        "target": s_route,
                        "params": {
                            "item_id": s_id,
                            "service_id": s_id,
                            "item_type": "service",
                            "title": s_title,
                            "date": "Tomorrow",
                            "time": "10:00 AM",
                            "hours": 2,
                            "route": s_route
                        },
                        "requires_confirmation": False
                    }
                }

    # 1. Check for Cancellation Intent on Bookings or Orders
    if any(k in msg for k in ['cancel', 'cancellation', 'ரத்து', 'ரத்து செய்', 'ரத்து பண்ணு', 'रद्द', 'कैंसिल', 'రద్దు', 'ರದ್ದು', 'റദ്ദാക്കുക']):
        ordinal = _extract_ordinal_index(msg)
        target_item = None
        if ordinal is not None and visible_items and (0 <= ordinal - 1 < len(visible_items)):
            target_item = visible_items[ordinal - 1]
        
        if not target_item:
            id_m = re.search(r'(?:booking|order|#)\s*(\d+)', msg)
            if id_m:
                target_id = int(id_m.group(1))
                target_item = next((it for it in visible_items if it.get('id') == target_id), None)

        if not target_item and visible_items:
            target_item = next((it for it in visible_items if it.get('can_cancel') or it.get('status') in ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ACTIVE', 'SHIPPED']), visible_items[0])

        is_booking = '/bookings' in path or (target_item and target_item.get('type') == 'booking') or any(k in msg for k in ['booking', 'appointment', 'முன்பதிவு', 'बुकिंग', 'బుకింగ్'])
        ttype = 'booking' if is_booking else 'order'
        target_dest = '/bookings' if is_booking else '/orders'
        item_id = target_item.get('id') if target_item else 1
        item_title = target_item.get('title', f"{ttype.capitalize()} #{item_id}") if target_item else f"{ttype.capitalize()} #{item_id}"

        prompt_str = t['cancel_prompt'](ttype, item_title, item_id)
        reply_str = t['cancel_reply'](ttype, item_title)

        return {
            "reply": reply_str,
            "spoken_text": prompt_str,
            "suggested_actions": ["Confirm Cancellation", "Keep Active", "Go Home"],
            "route_suggestion": target_dest,
            "action": {
                "type": "CANCEL_TRANSACTION",
                "target": target_dest,
                "params": {
                    "item_id": item_id,
                    "transaction_type": ttype,
                    "title": item_title,
                    "route": target_dest
                },
                "requires_confirmation": True,
                "confirmation_prompt": prompt_str
            }
        }

    # 2. Check for Tab / Category Navigation in Bookings & Orders
    tab_keywords = {
        'PENDING': ['pending', 'waiting', 'நிலுவை', 'காத்திருக்கும்', 'पेंडिंग', 'लंबित'],
        'ACCEPTED': ['accepted', 'confirmed', 'ஏற்றுக்கொள்ளப்பட்ட', 'स्वीकृत', 'मंजूर'],
        'UPCOMING': ['upcoming', 'scheduled', 'in progress', 'வரவிருக்கும்', 'आगामी'],
        'COMPLETED': ['completed', 'finished', 'done', 'past', 'history', 'முடிந்த', 'நிறைவடைந்த', 'पूरा', 'पूर्ण'],
        'ACTIVE': ['active', 'processing', 'நடப்பில்', 'செயலில்', 'सक्रिय'],
        'SHIPPED': ['shipped', 'dispatched', 'in transit', 'அனுப்பப்பட்ட', 'भेजा गया'],
        'DELIVERED': ['delivered', 'received', 'டெலிவரி', 'वितरित'],
        'CANCELLED': ['cancelled', 'canceled', 'ரத்துசெய்யப்பட்ட', 'ரத்து ஆன', 'रद्द'],
        'ALL': ['all bookings', 'all orders', 'all', 'அனைத்தும்', 'எல்லாம்', 'सभी', 'सारे']
    }

    matched_tab = None
    for tab_name, triggers in tab_keywords.items():
        if any(tr in msg for tr in triggers):
            if any(w in msg for w in ['tab', 'bookings', 'orders', 'show', 'view', 'list', 'filter', 'பகுதி', 'காட்டு', 'टैब', 'दिखाओ', 'பிரிவு']) or path in ['/bookings', '/orders']:
                matched_tab = tab_name
                break

    if matched_tab:
        is_orders_context = '/orders' in path or any(k in msg for k in ['order', 'orders', 'purchases', 'items', 'ஆர்டர்', 'பொருட்கள்', 'ऑर्डर'])
        target_page = 'orders' if is_orders_context else 'bookings'
        target_url = f"/{target_page}?tab={matched_tab}"

        tab_reply = t['tab_switched'](matched_tab, target_page.capitalize())
        return {
            "reply": tab_reply,
            "spoken_text": tab_reply,
            "suggested_actions": [f"View #1 in {matched_tab}", "Switch to All", "Explore Marketplace"],
            "route_suggestion": target_url,
            "action": {
                "type": "SWITCH_TAB",
                "target": target_url,
                "params": {
                    "tab": matched_tab,
                    "page": target_page,
                    "route": target_url
                },
                "requires_confirmation": False
            }
        }

    # 3. Check for Review Submission Intent
    if any(k in msg for k in ['review', 'rate', 'rating', 'stars', 'star', 'விமர்சனம்', 'மதிப்பீடு', 'நட்சத்திரம்', 'ரिव्यू', 'रेटिंग', 'स्टार', 'రీవ్యూ', 'రేటింగ్']):
        if not any(k in msg for k in ['read', 'what', 'show', 'tell me', 'வாசி', 'படி', 'என்ன', 'पढ़ो', 'सुनाओ', 'बताओ', 'చదువు']):
            rating_score = _extract_rating_score(msg)
            
            comment_text = "Excellent service and handcrafted quality. Highly recommended!"
            for split_word in ['saying', 'comment:', 'review:', 'that', 'என்று', 'விமர்சனம்:', 'कहते हुए', 'रिव्यू:']:
                if split_word in msg:
                    parts = msg.split(split_word, 1)
                    if len(parts) > 1 and len(parts[1].strip()) > 2:
                        comment_text = parts[1].strip()
                        break

            target_id = None
            target_type = 'service'
            target_title = 'Elder Craft'

            if active_prod:
                target_id = active_prod.get('id')
                target_type = 'product'
                target_title = active_prod.get('title', 'Handmade Product')
            elif active_serv:
                target_id = active_serv.get('id')
                target_type = 'service'
                target_title = active_serv.get('title', 'Traditional Service')
            elif visible_items:
                cand = next((it for it in visible_items if it.get('can_review') or it.get('status') in ['COMPLETED', 'DELIVERED']), visible_items[0])
                target_id = cand.get('id')
                target_type = cand.get('type', 'booking')
                target_title = cand.get('title', 'Completed Service')

            prompt_str = t['review_prompt'](rating_score, target_title)
            reply_str = t['review_reply'](rating_score, target_title)

            params_payload = {
                "rating": rating_score,
                "comment": comment_text,
                "title": target_title
            }
            if target_type == 'booking':
                params_payload['booking_id'] = target_id
            elif target_type == 'order':
                params_payload['order_id'] = target_id
            elif target_type == 'product':
                params_payload['product_id'] = target_id
            else:
                params_payload['service_id'] = target_id

            return {
                "reply": reply_str,
                "spoken_text": prompt_str,
                "suggested_actions": ["Confirm Review", "Edit Comment", "Cancel"],
                "route_suggestion": path,
                "action": {
                    "type": "SUBMIT_REVIEW",
                    "target": path,
                    "params": params_payload,
                    "requires_confirmation": True,
                    "confirmation_prompt": prompt_str
                }
            }

    # 4. Check for Read Reviews Intent
    if any(k in msg for k in ['read reviews', 'what are the reviews', 'customer reviews', 'reviews for this', 'விமர்சனங்களை படி', 'விமர்சனங்கள் என்ன', 'ரिव्यू बताओ', 'समीक्षाएं', 'రీవ్యూలు']):
        review_list = screen_reviews or []
        count = len(review_list)
        summary = ". ".join(review_list[:3]) if review_list else ""
        spoken_reply = t['reading_reviews'](count, summary)

        return {
            "reply": spoken_reply,
            "spoken_text": spoken_reply,
            "suggested_actions": ["Leave a 5-Star Review", "Order This Item", "Back to Catalog"],
            "route_suggestion": path,
            "action": {
                "type": "READ_REVIEWS",
                "target": path,
                "params": {
                    "count": count,
                    "reviews": review_list
                },
                "requires_confirmation": False
            }
        }

    # 5. Check for Ordinal Item Selection ("open the 2nd one", "show 1st product", "இரண்டாவது பொருள்")
    ordinal = _extract_ordinal_index(msg)
    if ordinal is not None and visible_items:
        target_idx = ordinal - 1
        if 0 <= target_idx < len(visible_items):
            item = visible_items[target_idx]
            route = item.get('route') or f"/products/{item.get('id')}"
            title = item.get('title', f"Item #{ordinal}")
            
            # If user also said "order" or "buy"
            if any(w in msg for w in ['order', 'buy', 'purchase', 'ஆர்டர்', 'வாங்க', 'खरीद', 'ऑर्डर', 'కొనుగోలు', 'ಖರೀದಿಸಿ']):
                return {
                    "reply": t['order_placed'](title),
                    "spoken_text": t['order_placed'](title),
                    "suggested_actions": ["Confirm Order", "Cancel Order", "View Cart"],
                    "route_suggestion": route,
                    "action": {
                        "type": "PLACE_ORDER",
                        "target": route,
                        "params": {
                            "item_id": item.get('id'),
                            "item_type": item.get('type', 'product'),
                            "title": title,
                            "price": item.get('price'),
                            "quantity": 1,
                            "route": route
                        },
                        "requires_confirmation": True,
                        "confirmation_prompt": f"Confirm order for 1x {title} ({item.get('price', '')})?"
                    }
                }

            return {
                "reply": t['opened_item'](title, ordinal),
                "spoken_text": t['opened_item'](title, ordinal),
                "suggested_actions": [f"Order {title}", "Back to List", "View Reviews"],
                "route_suggestion": route,
                "action": {
                    "type": "SELECT_ITEM",
                    "target": route,
                    "params": {
                        "item_id": item.get('id'),
                        "item_type": item.get('type', 'product'),
                        "index": ordinal,
                        "title": title,
                        "route": route
                    },
                    "requires_confirmation": False
                }
            }

    # 6. Check for Order / Buy Intent on active screen
    if any(w in msg for w in ['order', 'buy', 'purchase', 'place order', 'ஆர்டர்', 'வாங்க', 'ऑर्डर', 'खरीद', 'బుక్ ఆర్డర్', 'ಖರೀದಿ']):
        # If on product detail page
        if active_prod and active_prod.get('id'):
            p_title = active_prod.get('title') or "Handmade Product"
            p_id = active_prod.get('id')
            return {
                "reply": t['order_placed'](p_title),
                "spoken_text": t['order_placed'](p_title),
                "suggested_actions": ["Confirm Order", "Change Quantity", "Cancel"],
                "route_suggestion": path,
                "action": {
                    "type": "PLACE_ORDER",
                    "target": path,
                    "params": {
                        "item_id": p_id,
                        "item_type": "product",
                        "title": p_title,
                        "price": active_prod.get('price'),
                        "quantity": 1,
                        "route": path
                    },
                    "requires_confirmation": True,
                    "confirmation_prompt": f"Confirm order for 1x {p_title}?"
                }
            }

        # If user explicitly specified ordinal index (e.g. "order the 2nd item")
        if ordinal is not None and visible_items:
            target_idx = ordinal - 1
            if 0 <= target_idx < len(visible_items):
                target_p = visible_items[target_idx]
                if target_p.get('type') == 'product':
                    t_title = target_p.get('title', f"Product #{ordinal}")
                    t_route = target_p.get('route', f"/products/{target_p.get('id')}")
                    return {
                        "reply": t['order_placed'](t_title),
                        "spoken_text": t['order_placed'](t_title),
                        "suggested_actions": ["Confirm Order", "View Details"],
                        "route_suggestion": t_route,
                        "action": {
                            "type": "PLACE_ORDER",
                            "target": t_route,
                            "params": {
                                "item_id": target_p.get('id'),
                                "item_type": "product",
                                "title": t_title,
                                "price": target_p.get('price'),
                                "quantity": 1,
                                "route": t_route
                            },
                            "requires_confirmation": True,
                            "confirmation_prompt": f"Confirm order for 1x {t_title}?"
                        }
                    }

        # If user mentioned specific product keywords (e.g. "order pickle", "order murukku", "buy bag")
        if visible_items:
            matched_prod = None
            for it in visible_items:
                if it.get('type') == 'product':
                    it_title_lower = it.get('title', '').lower()
                    if any(k in msg for k in it_title_lower.split() if len(k) > 3) or any(k in it_title_lower for k in ['pickle', 'murukku', 'bag', 'compost', 'snack', 'biscuit', 'sweet'] if k in msg):
                        matched_prod = it
                        break
            if matched_prod:
                m_title = matched_prod.get('title', 'Handmade Product')
                m_route = matched_prod.get('route', f"/products/{matched_prod.get('id')}")
                return {
                    "reply": t['order_placed'](m_title),
                    "spoken_text": t['order_placed'](m_title),
                    "suggested_actions": ["Confirm Order", "View Details"],
                    "route_suggestion": m_route,
                    "action": {
                        "type": "PLACE_ORDER",
                        "target": m_route,
                        "params": {
                            "item_id": matched_prod.get('id'),
                            "item_type": "product",
                            "title": m_title,
                            "price": matched_prod.get('price'),
                            "quantity": 1,
                            "route": m_route
                        },
                        "requires_confirmation": True,
                        "confirmation_prompt": f"Confirm order for 1x {m_title}?"
                    }
                }

        # If user simply wishes to place an order without specifying any product context:
        # Prompt user to select a correct product / order first!
        select_msg = t['select_order_first']
        return {
            "reply": select_msg,
            "spoken_text": select_msg,
            "suggested_actions": ["Browse Products", "Open #1", "Explore Pickles", "Traditional Snacks"],
            "route_suggestion": "/products",
            "action": {
                "type": "NAVIGATE",
                "target": "/products",
                "params": {"route": "/products"},
                "requires_confirmation": False
            }
        }

    # 7. Check for Service Booking Intent
    if any(w in msg for w in ['book', 'hire', 'appointment', 'முன்பதிவு', 'சேவை', 'बुक', 'నియామకం', 'ಬುಕ್']):
        if active_serv and active_serv.get('id'):
            s_title = active_serv.get('title') or "Home Service"
            s_id = active_serv.get('id')
            return {
                "reply": t['book_service'](s_title),
                "spoken_text": t['book_service'](s_title),
                "suggested_actions": ["Confirm Booking", "Cancel"],
                "route_suggestion": path,
                "action": {
                    "type": "BOOK_SERVICE",
                    "target": path,
                    "params": {
                        "item_id": s_id,
                        "item_type": "service",
                        "title": s_title,
                        "date": "Tomorrow",
                        "time": "10:00 AM",
                        "hours": 2
                    },
                    "requires_confirmation": True,
                    "confirmation_prompt": f"Confirm booking for {s_title}?"
                }
            }
        elif visible_items and visible_items[0].get('type') == 'service':
            first_s = visible_items[0]
            return {
                "reply": t['book_service'](first_s.get('title')),
                "spoken_text": t['book_service'](first_s.get('title')),
                "suggested_actions": ["Confirm Booking", "View Details"],
                "route_suggestion": first_s.get('route'),
                "action": {
                    "type": "BOOK_SERVICE",
                    "target": first_s.get('route'),
                    "params": {
                        "item_id": first_s.get('id'),
                        "item_type": "service",
                        "title": first_s.get('title')
                    },
                    "requires_confirmation": True,
                    "confirmation_prompt": f"Confirm booking for {first_s.get('title')}?"
                }
            }

    # 8. Filter & Search Intent with Keywords and Price Range
    filter_data = _parse_filter_request(msg)
    if filter_data and (
        filter_data.get('min_price') or
        filter_data.get('max_price') or
        filter_data.get('category') or
        (filter_data.get('query') and any(k in msg.lower() for k in ['filter', 'search', 'find', 'show', 'வடிகட்டு', 'தேடு', 'காட்டு', 'ढूंढो', 'दिखाओ', 'फ़िल्टर']))
    ):
        base_route = f"/{filter_data['target_page']}"
        query_params = []
        if filter_data.get('query'):
            query_params.append(f"search={filter_data['query']}")
        if filter_data.get('category'):
            query_params.append(f"category={filter_data['category']}")
        if filter_data.get('min_price'):
            query_params.append(f"min_price={filter_data['min_price']}")
        if filter_data.get('max_price'):
            query_params.append(f"max_price={filter_data['max_price']}")
        
        target_url = f"{base_route}?{'&'.join(query_params)}" if query_params else base_route
        
        desc_parts = []
        if filter_data.get('query'):
            desc_parts.append(f"'{filter_data['query']}'")
        if filter_data.get('category'):
            desc_parts.append(f"category {filter_data['category']}")
        if filter_data.get('min_price') and filter_data.get('max_price'):
            desc_parts.append(f"₹{filter_data['min_price']} - ₹{filter_data['max_price']}")
        elif filter_data.get('max_price'):
            desc_parts.append(f"under ₹{filter_data['max_price']}")
        elif filter_data.get('min_price'):
            desc_parts.append(f"above ₹{filter_data['min_price']}")
        
        filter_desc = " ".join(desc_parts) if desc_parts else "selected criteria"
        reply_txt = t.get('filter_applied', lambda d: f"Filtering for {d}.")(filter_desc)

        return {
            "reply": reply_txt,
            "spoken_text": reply_txt,
            "suggested_actions": ["Reset Filters", "Open #1", "Order #1"],
            "route_suggestion": target_url,
            "action": {
                "type": "FILTER",
                "target": target_url,
                "params": {
                    "query": filter_data.get('query'),
                    "category": filter_data.get('category'),
                    "min_price": filter_data.get('min_price'),
                    "max_price": filter_data.get('max_price'),
                    "target_page": filter_data['target_page'],
                    "route": target_url
                },
                "requires_confirmation": False
            }
        }

    # 9. Deep Redirections across entire platform
    routes_map = [
        (['radar', 'opportunity', 'demand', 'leads', 'வாய்ப்பு', 'ரேடார்', 'रडार', 'అవకాశాలు', 'ಬೇಡಿಕೆ'], '/radar'),
        (['product', 'marketplace', 'shop', 'pickle', 'bag', 'handicraft', 'பொருள்', 'சந்தை', 'उत्पाद', 'दुकान', 'వస్తువులు'], '/products'),
        (['service', 'cook', 'tailor', 'artisan', 'சேவை', 'சமையல்', 'தையல்', 'सेवा', 'रसोई', 'दर्जी', 'సేవలు', 'ಅಡುಗೆ'], '/services'),
        (['provider', 'elder', 'homemaker', 'artisan list', 'கலைஞர்கள்', 'कारीगर', 'నిపుణులు'], '/providers'),
        (['order', 'my orders', 'purchases', 'track order', 'ஆர்டர்கள்', 'ऑर्डर सूची', 'ఆర్డర్లు'], '/orders'),
        (['booking', 'my bookings', 'appointments', 'முன்பதிவுகள்', 'बुकिंग्स', 'బుకింగ్స్'], '/bookings'),
        (['wizard', 'onboard', 'register skill', 'voice register', 'பதிவு', 'வழிகாட்டி', 'रजिस्टर', 'నమోదు'], '/register-voice'),
        (['profile', 'my account', 'settings', 'சுயவிவரம்', 'प्रोफाइल', 'ప్రొఫైల్'], '/profile'),
        (['match', 'ai match', 'find artisan', 'பொருத்தம்', 'मैच'], '/ai-match'),
        (['dashboard', 'provider dashboard', 'income', 'வருமானம்', 'डैशबोर्ड'], '/provider/dashboard'),
        (['home', 'main page', 'start', 'முகப்பு', 'होम', 'హోమ్'], '/'),
        (['login', 'sign in', 'நுழை', 'लॉगिन', 'లాగిన్'], '/login'),
        (['admin', 'admin panel', 'நிர்வாகம்', 'एडमिन'], '/admin-panel')
    ]

    for keywords, target_route in routes_map:
        if any(k in msg for k in keywords):
            return {
                "reply": t['navigating'](target_route),
                "spoken_text": t['navigating'](target_route),
                "suggested_actions": ["Explore Page", "Senior Mode", "Go Home"],
                "route_suggestion": target_route,
                "action": {
                    "type": "NAVIGATE",
                    "target": target_route,
                    "params": {"route": target_route},
                    "requires_confirmation": False
                }
            }

    # 10. Senior Mode Toggle
    if any(k in msg for k in ['senior mode', 'large text', 'high contrast', 'bigger', 'பெரிய எழுத்து', 'சீனியர்', 'सीनियर मोड', 'పెద్ద అక్షరాలు', 'ದೊಡ್ಡ ಅಕ್ಷರ']):
        return {
            "reply": t['senior_mode'],
            "spoken_text": t['senior_mode'],
            "suggested_actions": ["Explore Services", "Explore Products"],
            "route_suggestion": None,
            "action": {
                "type": "TOGGLE_SENIOR_MODE",
                "target": None,
                "params": {},
                "requires_confirmation": False
            }
        }

    # 11. Read Screen Context aloud
    if any(k in msg for k in ['what is on', 'read screen', 'describe page', 'என்ன இருக்கிறது', 'स्क्रीन पर क्या', 'చదవండి']):
        count = len(visible_items)
        items_summary = ", ".join([f"#{it.get('index')}: {it.get('title')}" for it in visible_items[:4]])
        reply_txt = f"{t['screen_read'](count)}. Visible items: {items_summary}" if items_summary else t['screen_read'](count)
        return {
            "reply": reply_txt,
            "spoken_text": reply_txt,
            "suggested_actions": ["Open #1", "Open #2", "Scroll Down"] if count >= 2 else ["Explore Products", "Explore Services"],
            "route_suggestion": None,
            "action": {
                "type": "READ_SCREEN",
                "target": None,
                "params": {"item_count": count},
                "requires_confirmation": False
            }
        }

    # 12. Scroll
    if any(k in msg for k in ['scroll down', 'scroll up', 'scroll to top', 'go to top', 'move to top', 'move to start', 'scroll to start', 'beginning of page', 'start of page', 'more items', 'கீழே', 'மேலே', 'ஆரம்பம்', 'ஆரம்பத்திற்கு', 'नीचे', 'ऊपर', 'शुरुआत']):
        if any(k in msg for k in ['top', 'start', 'beginning', 'ஆரம்பம்', 'ஆரம்பத்திற்கு', 'शुरुआत', 'प्रारंभ']):
            direction = 'top'
            reply_text = t.get('scrolled_top', "Moving to the top of the page.")
        elif any(k in msg for k in ['bottom', 'end', 'முடிவு']):
            direction = 'bottom'
            reply_text = t.get('scrolled_bottom', "Moving to the bottom of the page.")
        elif any(k in msg for k in ['up', 'மேலே', 'ऊपर']):
            direction = 'up'
            reply_text = t['scrolled']
        else:
            direction = 'down'
            reply_text = t['scrolled']

        return {
            "reply": reply_text,
            "spoken_text": reply_text,
            "suggested_actions": ["Open #1", "Go to Top"],
            "route_suggestion": None,
            "action": {
                "type": "SCROLL_PAGE",
                "target": None,
                "params": {"scroll_direction": direction},
                "requires_confirmation": False
            }
        }

    # Default Controller Fallback
    return {
        "reply": f"Controller standing by. Ask me to open any item (#1, #2), cancel a booking, leave a review, or filter by price and category.",
        "spoken_text": "I am your website controller. Tell me what action or page you want to open or manage.",
        "suggested_actions": ["Open #1", "My Bookings", "My Orders", "Explore Products"],
        "route_suggestion": "/products",
        "action": {
            "type": "NAVIGATE",
            "target": "/products",
            "params": {"route": "/products"},
            "requires_confirmation": False
        }
    }

def ask_site_controller(message: str, history: List[Dict[str, str]] = None, language: str = 'en', user_info: Dict[str, Any] = None, screen_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main Autonomous Site Controller endpoint handling screen grounding and AI action dispatch.
    """
    history = history or []
    history_turns = []
    for h in history[-6:]:
        role = "User" if h.get('sender') == 'user' else "Controller"
        history_turns.append(f"{role}: {h.get('text', '')}")
    history_text = "\n".join(history_turns)

    screen_context = screen_context or {}
    path = screen_context.get('path', '/')
    title = screen_context.get('title', 'SilverHands')
    visible_items = screen_context.get('visible_items', [])
    active_modal = screen_context.get('active_modal')
    active_prod = screen_context.get('active_product_detail')
    active_serv = screen_context.get('active_service_detail')
    screen_reviews = screen_context.get('reviews') or (active_prod.get('reviews') if active_prod else active_serv.get('reviews') if active_serv else [])

    screen_desc = f"""CURRENT SCREEN CONTEXT:
- Active Route: {path}
- Page Title: {title}
- Active Modal: {active_modal.get('type') if active_modal else 'None'}
- Active Detail: {active_prod.get('title') if active_prod else active_serv.get('title') if active_serv else 'None'}
- Customer Reviews on Page: {screen_reviews}
- Visible Elements on Screen ({len(visible_items)} items):
"""
    for it in visible_items:
        screen_desc += f"  * [#{it.get('index')}] ID: {it.get('id')} ({it.get('type')}): '{it.get('title')}' | Status: {it.get('status', 'N/A')} | Price: {it.get('price')} | Can Cancel: {it.get('can_cancel')} | Can Review: {it.get('can_review')} | Route: {it.get('route')}\n"

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
TARGET LANGUAGE: {target_language_name}
{screen_desc}

--- CONVERSATION HISTORY ---
{history_text if history_text else "No prior history."}

--- USER REQUEST / COMMAND ---
"{message}"
"""

    fallback = _resolve_screen_action(message, history=history, language=lang_code, user_info=user_info, screen_context=screen_context)

    try:
        if ai_client.is_configured():
            data = ai_client.generate_json(
                prompt=prompt,
                system_instruction=SITE_CONTROLLER_SYSTEM_PROMPT,
                default_fallback=fallback
            )
            if isinstance(data, dict) and 'action' in data and isinstance(data['action'], dict):
                if not data.get('spoken_text'):
                    data['spoken_text'] = data.get('reply', '')

                # Order intent validation
                lower_msg = message.lower()
                if any(w in lower_msg for w in ['order', 'buy', 'purchase', 'ஆர்டர்', 'வாங்க', 'खरीद', 'ऑर्डर', 'కొనుగోలు', 'ಖರೀದಿಸಿ']):
                    act_type = data.get('action', {}).get('type')
                    act_params = data.get('action', {}).get('params', {})
                    item_id = act_params.get('item_id')
                    item_title = act_params.get('title')

                    # If an order action was created without a valid product id or title
                    if act_type == 'PLACE_ORDER' and (not item_id or not item_title or str(item_title).lower() in ['undefined', 'none', 'null', '']):
                        data = fallback
                    elif act_type == 'PLACE_ORDER':
                        data['action']['requires_confirmation'] = True

                # Cancel intent enforcement
                if any(w in lower_msg for w in ['cancel', 'ரத்து', 'रद्द', 'రద్దు', 'ರದ್ದು']):
                    data['action']['type'] = 'CANCEL_TRANSACTION'
                    data['action']['requires_confirmation'] = True

                return data
        return fallback
    except Exception:
        return fallback
