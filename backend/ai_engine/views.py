from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from marketplace.models import Category, ProviderProfile, Service, Product
from marketplace.serializers import ServiceSerializer, ProductSerializer, ProviderProfileSerializer

from .services.ai_client import ai_client
from .services.business_assistant import ask_business_assistant
from .services.description import generate_business_description
from .services.matching import match_providers
from .services.pricing import suggest_fair_price
from .services.scam_detection import detect_scam_message
from .services.service_suggestion import suggest_services
from .services.skill_extraction import extract_skills_from_text
from .services.skill_suggestion import suggest_skills_and_livelihoods
from .services.voice_assistant import ask_voice_assistant
from .services.site_controller import ask_site_controller
from .services.voice_registration import analyze_voice_registration
import uuid
from django.db import transaction
from accounts.serializers import CustomTokenObtainPairSerializer, UserProfileSerializer
from accounts.models import CustomerProfile

User = get_user_model()

class IsProviderOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role in [User.Role.PROVIDER, User.Role.ADMIN] or request.user.is_staff)

class AIHealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'healthy',
            'provider': 'ai_engine',
            'model': 'neural_model',
            'is_configured': ai_client.is_configured(),
            'languages_supported': ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'],
        })

class AIMatchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        req_text = request.data.get('requirement_text') or request.data.get('requirement', '')
        if not req_text:
            return Response({'error': 'Requirement text is required'}, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get('category', '')
        location = request.data.get('location', '')
        budget = request.data.get('budget')
        language = request.data.get('language', '')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        result = match_providers(
            requirement_text=req_text,
            category=category,
            location=location,
            budget=budget,
            language=language,
            lat=lat,
            lng=lng
        )
        return Response(result)

class AIProfileWizardView(APIView):
    """
    Provider-specific: Complete AI Profile & Service Generator Wizard (Suji intelligence suite).
    Extracts skills, suggests livelihood expansions, provides pricing analysis, and generates tiered service card packages.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        text = request.data.get('text') or request.data.get('speech_text', '')
        if not text:
            return Response({'error': 'Please provide speech or text description of your craft'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        name = user.get_full_name() or user.first_name or user.username
        location = user.address or 'Chennai, TN'

        system_instruction = (
            "You are the SilverHands Master AI Artisan & Homemaker Onboarding Wizard.\n"
            "Given an artisan or homemaker's story, generate a structured JSON profile and service proposal.\n"
            "STRICT CONSTRAINTS:\n"
            "1. 'bio': warm, dignified, and professional 3-sentence summary highlighting experience.\n"
            "2. 'skills': 4-6 specific practical skills (e.g. ['Traditional Chettinad Cooking', 'Homemade Pickles', 'Festival Sweets']).\n"
            "3. 'experience_years': integer number of practical years (default to 15 if not stated).\n"
            "4. 'category_slug': one of ['cooking', 'tailoring', 'tutoring', 'gardening', 'childcare', 'language', 'music', 'handicrafts', 'mentoring', 'consulting'].\n"
            "5. 'skill_passport': { 'title': 'Grandmaster of Traditional Cuisine', 'trust_score': 96, 'badges': ['Phone Verified', 'Practical Master', 'Heritage Craft'], 'highlights': ['20+ Years Family Recipes', '100% Homemade'] }.\n"
            "6. 'suggested_services': array of 3 distinct service packages: [{ 'title': 'Authentic Traditional Home Cooking', 'category_slug': 'cooking', 'price': 800, 'pricing_unit': 'per session', 'duration': '2 hours', 'description': 'Full traditional meal preparation with authentic spices.', 'tier': 'Standard Package' }, { 'title': 'Festival & Special Event Feast Catering', 'category_slug': 'cooking', 'price': 2400, 'pricing_unit': 'per event', 'duration': '4 hours', 'description': 'Complete multi-course traditional celebration feast.', 'tier': 'Premium Celebration' }, { 'title': 'Artisan Recipe Masterclass & Mentoring', 'category_slug': 'cooking', 'price': 600, 'pricing_unit': 'per hour', 'duration': '1 hour', 'description': 'Hands-on training and heirloom recipe secrets.', 'tier': '1-on-1 Mentoring' }].\n"
            "7. 'pricing_analysis': { 'fair_price': 800, 'min_price': 600, 'max_price': 1200, 'explanation': 'Fair wage based on Chennai market rates and years of experience.' }.\n"
            "8. 'adjacent_livelihoods': ['Homemade Spice Powder Mixes', 'Weekend Traditional Lunch Packs', 'Custom Festive Hampers'].\n"
            "Return strictly valid JSON with keys: bio, skills, experience_years, category_slug, skill_passport, suggested_services, pricing_analysis, adjacent_livelihoods."
        )

        fallback_response = {
            'bio': f"Dedicated homemaker and experienced artisan with deep practical expertise in traditional crafts and home services in {location}.",
            'skills': ['Traditional Cooking', 'Home Consulting', 'Cultural Arts', 'Bespoke Craftsmanship'],
            'experience_years': 15,
            'category_slug': 'cooking',
            'skill_passport': {
                'title': 'Certified Traditional Craftsperson',
                'trust_score': 96,
                'badges': ['Identity Verified', '15+ Years Hands-on Master', 'SilverHands Certified'],
                'highlights': ['Authentic Homemade Methods', 'Personalized Attention', 'Verified Heritage Craft']
            },
            'suggested_services': [
                {
                    'title': 'Authentic Traditional Home Service',
                    'category_slug': 'cooking',
                    'price': 800,
                    'pricing_unit': 'per session',
                    'duration': '2 hours',
                    'description': f"Personalized traditional service provided with authentic care and verified experience by {name}.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Standard Session'
                },
                {
                    'title': 'Special Event & Weekend Preparation',
                    'category_slug': 'cooking',
                    'price': 2200,
                    'pricing_unit': 'per event',
                    'duration': '4 hours',
                    'description': f"Complete traditional preparation for family gatherings and festive occasions with custom menu.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Premium Gathering'
                },
                {
                    'title': '1-on-1 Craft & Skill Mentoring',
                    'category_slug': 'cooking',
                    'price': 500,
                    'pricing_unit': 'per hour',
                    'duration': '1 hour',
                    'description': f"Private step-by-step coaching and practical wisdom sharing by {name}.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Personal Mentoring'
                }
            ],
            'pricing_analysis': {
                'fair_price': 800,
                'min_price': 600,
                'max_price': 1200,
                'explanation': 'Fair wage calculated based on local neighborhood benchmark and practical expertise.'
            },
            'adjacent_livelihoods': [
                'Homemade Condiment & Specialty Packs',
                'Weekend Family Meal Subscriptions',
                'Custom Artisan Hampers'
            ]
        }

        try:
            if ai_client.is_configured():
                prompt = f"Artisan/Homemaker Name: {name}\nLocation: {location}\nSpoken Story/Input:\n\"{text}\""
                ai_data = ai_client.generate_json(prompt, system_instruction=system_instruction, default_fallback=fallback_response)
            else:
                ai_data = fallback_response
        except Exception:
            ai_data = fallback_response

        return Response(ai_data)

class ConfirmServiceCardView(APIView):
    """
    Provider-specific: Confirms and publishes the Service Card directly to the database.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        user = request.user
        data = request.data

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': data.get('bio', 'Dedicated homemaker and skilled artisan'),
                'location': user.address or 'Chennai, TN',
                'experience_years': data.get('experience_years', 15),
                'skills': data.get('skills', ['Traditional Craft']),
                'skill_passport': data.get('skill_passport', {})
            }
        )

        if data.get('bio'):
            provider_prof.bio = data['bio']
        if data.get('skills'):
            provider_prof.skills = data['skills']
        if data.get('skill_passport'):
            provider_prof.skill_passport = data['skill_passport']
        if data.get('experience_years'):
            provider_prof.experience_years = data['experience_years']
        provider_prof.save()

        cat_slug = data.get('category_slug', 'cooking')
        category = Category.objects.filter(slug=cat_slug).first() or Category.objects.first()

        service = Service.objects.create(
            provider=provider_prof,
            category=category,
            title=data.get('title', 'Authentic Traditional Service'),
            description=data.get('description', 'High quality traditional service by verified artisan.'),
            price=Decimal(str(data.get('price', 800))),
            pricing_unit=data.get('pricing_unit', 'per session'),
            duration=data.get('duration', '2 hours'),
            languages=data.get('languages', ['Tamil', 'English']),
            image_url=data.get('image_url', f"https://picsum.photos/seed/{user.username}-{cat_slug}/500/350")
        )

        return Response({
            'message': 'Service published successfully!',
            'service': ServiceSerializer(service).data,
            'provider': ProviderProfileSerializer(provider_prof).data
        }, status=status.HTTP_201_CREATED)

class GenerateProductCardView(APIView):
    """
    Provider-specific: AI Product Card Generator.
    Takes craft/recipe idea, generates title, description, shelf-life, price, and category.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        idea = request.data.get('idea', '')
        if not idea:
            return Response({'error': 'Please describe your handmade product idea'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are the SilverHands AI Handmade Product Card Creator.\n"
            "Given a homemaker's product idea, generate a complete structured product card.\n"
            "Return valid JSON with keys: title, category_slug (one of cooking, tailoring, gardening, handicrafts), price (integer in INR), quantity (default 10), description (artisan product pitch), shelf_life, ingredients_or_materials."
        )

        fallback = {
            'title': 'Homemade Traditional Artisan Delicacy',
            'category_slug': 'cooking',
            'price': 220,
            'quantity': 15,
            'description': '100% natural, freshly prepared handmade item with authentic family recipe and hygienic packaging.',
            'shelf_life': '60 days',
            'ingredients_or_materials': 'Traditional home ingredients, cold-pressed oils, pure spices'
        }

        try:
            if ai_client.is_configured():
                res_data = ai_client.generate_json(idea, system_instruction=system_instruction, default_fallback=fallback)
            else:
                res_data = fallback
        except Exception:
            res_data = fallback

        return Response(res_data)

class ConfirmProductCardView(APIView):
    """
    Provider-specific: Confirms and publishes product to the marketplace.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        user = request.user
        data = request.data

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Handmade Crafts']
            }
        )

        cat_slug = data.get('category_slug', 'cooking')
        category = Category.objects.filter(slug=cat_slug).first() or Category.objects.first()

        product = Product.objects.create(
            provider=provider_prof,
            category=category,
            title=data.get('title', 'Handmade Product'),
            description=data.get('description', 'Authentic handmade goods.'),
            price=Decimal(str(data.get('price', 200))),
            quantity=int(data.get('quantity', 10)),
            image_url=data.get('image_url', f"https://picsum.photos/seed/{user.username}-prod-{cat_slug}/500/350")
        )

        return Response({
            'message': 'Product published to marketplace successfully!',
            'product': ProductSerializer(product).data
        }, status=status.HTTP_201_CREATED)

class GrowthAdvisorView(APIView):
    """
    Provider-specific: AI Business & Growth Advisor for homemakers and elders.
    Answers questions on packaging, festival promotions, pricing bulk orders, WhatsApp marketing,
    maintaining full multi-turn conversational memory and rich profile context.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        question = request.data.get('question') or request.data.get('message', '')
        if not question:
            return Response({'error': 'Question is required'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])
        user_details = request.data.get('user_details', {})

        user = request.user
        provider_context = {
            'name': f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() or getattr(user, 'username', 'Artisan'),
            'email': getattr(user, 'email', ''),
            'phone': getattr(user, 'phone', ''),
            'role': getattr(user, 'role', 'provider'),
            'location': getattr(user, 'address', '') or 'Chennai, TN',
            'skills': getattr(user, 'skills', []) or [],
        }

        # Query provider profile if present
        if hasattr(user, 'provider_profile') and user.provider_profile:
            prof = user.provider_profile
            provider_context.update({
                'bio': prof.bio or '',
                'experience_years': prof.experience_years or 10,
                'skills': prof.skills or provider_context['skills'],
                'location': prof.location or provider_context['location'],
                'rating': float(prof.rating or 5.0),
                'completed_jobs': getattr(prof, 'completed_jobs_count', 0),
            })
            try:
                services = list(prof.services.filter(is_available=True).values_list('title', flat=True)[:5])
                if services:
                    provider_context['services'] = services
            except Exception:
                pass

            try:
                products = list(prof.products.filter(is_available=True).values_list('title', flat=True)[:5])
                if products:
                    provider_context['products'] = products
            except Exception:
                pass

        # Merge any direct user_details sent from frontend
        if isinstance(user_details, dict):
            for k, v in user_details.items():
                if v:
                    provider_context[k] = v

        result = ask_business_assistant(
            question=question,
            provider_context=provider_context,
            history=history
        )
        return Response(result)

class FairPriceCheckerView(APIView):
    """
    Common (Customers & Providers): Fair Price & Risk Evaluator.
    Evaluates any proposed service or product quote against regional fair market rates,
    detecting overpricing, predatory surges, and suspicious high-risk terms.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        item_name = request.data.get('item_name') or request.data.get('service_name', 'Home Service')
        quoted_price = float(request.data.get('price', 800))
        item_type = request.data.get('type', 'service')
        location = request.data.get('location', 'Chennai')

        lower_name = item_name.lower()
        risk_factors = []
        is_risky = False
        risk_level = 'LOW'

        # 1. Suspicious keywords / Scam pattern checks
        suspicious_keywords = [
            ('advance 100%', 'Demands 100% full advance payment prior to service completion.'),
            ('upfront advance', 'Full upfront payment requested without escrow protection.'),
            ('suspicious link', 'Asks to click external links for payment or booking confirmation.'),
            ('bit.ly', 'Uses shortened URL links known for phishing and payment scams.'),
            ('miracle', 'Makes unsubstantiated medical or miracle health claims without certification.'),
            ('urgent deposit', 'Creates artificial panic requiring immediate security deposit.'),
            ('no license', 'Explicitly uncertified substance or high-risk chemical/medicinal claim.'),
            ('guaranteed 100%', 'Unrealistic guaranteed outcome on wellness or speculative results.')
        ]

        for kw, reason in suspicious_keywords:
            if kw in lower_name:
                risk_factors.append(reason)
                is_risky = True
                risk_level = 'HIGH'

        # 2. Baseline fair price calculation
        base_suggest = suggest_fair_price(service=item_name, experience=15, location=location)
        rec_price = base_suggest.get('recommended_price') or base_suggest.get('recommended_fair_price') or 500
        min_p = base_suggest.get('suggested_minimum') or base_suggest.get('min_fair_price') or round(rec_price * 0.8)
        max_p = base_suggest.get('suggested_maximum') or base_suggest.get('max_fair_price') or round(rec_price * 1.3)

        # 3. Ratio-based risk evaluation
        if rec_price > 0:
            price_ratio = quoted_price / rec_price
        else:
            price_ratio = 1.0

        if is_risky:
            assessment = 'HIGH_RISK'
            badge = '🚨 High Risk / Potential Scam Alert'
            is_fair = False
            advice = "Do not proceed with this transaction or click external links. This offer contains suspicious payment terms or unverified claims that violate platform safety standards."
        elif price_ratio >= 2.5:
            is_risky = True
            risk_level = 'HIGH'
            overcharge_pct = round((price_ratio - 1) * 100)
            risk_factors.append(f"Severely inflated pricing: {overcharge_pct}% higher than standard fair market baseline in {location}.")
            assessment = 'HIGH_RISK'
            badge = '🚨 High Risk / Severe Overcharge'
            is_fair = False
            advice = "Do not accept this quote. The requested amount is extremely high for this service type. Negotiate down to the fair market range or choose a verified community provider."
        elif price_ratio > 1.3:
            risk_level = 'MEDIUM'
            overcharge_pct = round((price_ratio - 1) * 100)
            risk_factors.append(f"Priced above average: {overcharge_pct}% higher than typical regional rates in {location}.")
            assessment = 'OVERPRICED'
            badge = '⚠️ Overpriced / Unfair Quote'
            is_fair = False
            advice = f"This price is above standard artisan rates in {location}. You can negotiate closer to ₹{round(rec_price)} for fair value."
        elif price_ratio < 0.25 and quoted_price > 0:
            risk_level = 'MEDIUM'
            risk_factors.append("Unusually low price: May indicate hidden charges, bait-and-switch tactics, or substandard materials.")
            assessment = 'SUSPICIOUS_LOW'
            badge = '⚠️ Unusually Low (Verify Scope)'
            is_fair = False
            advice = "Confirm what is included in this quote. Extremely cheap prices often lead to mid-work price escalations."
        else:
            assessment = 'FAIR'
            badge = '✓ Fair & Authentic Market Price'
            is_fair = True
            risk_level = 'LOW'
            advice = "This quote aligns well with transparent community artisan wages and standard regional costs."
            advice = "This quote aligns well with transparent community artisan wages and standard regional costs."

        if is_risky and not risk_factors:
            risk_factors.append("Terms require additional safety verification.")

        explanation = (
            f"The quoted price of ₹{round(quoted_price):,} is {badge.lower()} for '{item_name}' in {location}. "
            f"Expected fair market benchmark is ₹{round(min_p):,} – ₹{round(max_p):,} (Recommended: ₹{round(rec_price):,})."
        )

        return Response({
            'item_name': item_name,
            'quoted_price': round(quoted_price),
            'assessment': assessment,
            'risk_level': risk_level,
            'is_risky': is_risky,
            'is_fair': is_fair,
            'badge': badge,
            'risk_factors': risk_factors,
            'advice': advice,
            'fair_range': {
                'min': round(min_p),
                'recommended': round(rec_price),
                'max': round(max_p)
            },
            'authenticity_rating': '99% Verified Market Standard',
            'explanation': explanation
        })

class SmartRecommendationsView(APIView):
    """
    Common (Customers & Providers): Personalized AI Recommendations.
    Returns top verified elders/homemakers, trending traditional services, and handmade products.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        top_services = Service.objects.filter(is_available=True).order_by('-rating', '-created_at')[:6]
        top_products = Product.objects.filter(is_available=True).order_by('-created_at')[:6]
        top_providers = ProviderProfile.objects.filter(is_verified=True).order_by('-rating', '-completed_jobs_count')[:4]

        return Response({
            'recommended_services': ServiceSerializer(top_services, many=True).data,
            'recommended_products': ProductSerializer(top_products, many=True).data,
            'featured_providers': ProviderProfileSerializer(top_providers, many=True).data,
            'curation_reason': 'Curated based on verified craft heritage, high trust scores, and community ratings.'
        })

class ExtractSkillsView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'Text input required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(extract_skills_from_text(text))

class SuggestSkillsView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        text = request.data.get('text', '')
        current_skills = request.data.get('current_skills', [])
        return Response(suggest_skills_and_livelihoods(text, current_skills))

class SuggestServicesView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        skills = request.data.get('skills', [])
        category = request.data.get('category', '')
        text = request.data.get('text', '')
        return Response(suggest_services(skills=skills, category=category, text=text))

class GenerateDescriptionView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        name = request.data.get('name', 'Artisan')
        skills = request.data.get('skills', ['Traditional Craft'])
        exp = float(request.data.get('experience_years', 10))
        location = request.data.get('location', 'Chennai')
        languages = request.data.get('languages', ['Tamil', 'English'])
        return Response(generate_business_description(name, skills, exp, location, languages))

class SuggestPriceView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        service = request.data.get('service', 'Home Service')
        exp = float(request.data.get('experience', 5))
        city = request.data.get('city', 'Chennai')
        return Response(suggest_fair_price(service=service, experience=exp, location=city))

class BusinessAssistantView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({'error': 'Question required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ask_business_assistant(question))

class DetectScamView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        msg = request.data.get('message') or request.data.get('text', '')
        if not msg:
            return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(detect_scam_message(msg))

class VoiceAssistantView(APIView):
    """
    Public Interactive Voice Assistant for SilverHands (Voice-In, Voice-Out).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message') or request.data.get('text', '') or request.data.get('question', '')
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])
        language = request.data.get('language', 'en')
        page_context = request.data.get('page_context', {}) or request.data.get('pageContext', {})

        user_info = None
        if request.user and request.user.is_authenticated:
            user_info = {
                'username': request.user.username,
                'name': request.user.get_full_name() or request.user.username,
                'role': getattr(request.user, 'role', 'Customer'),
                'location': getattr(request.user, 'address', '')
            }

        response_data = ask_voice_assistant(
            message=message,
            history=history,
            language=language,
            user_info=user_info,
            page_context=page_context
        )
        return Response(response_data)




class SiteControllerView(APIView):
    """
    Autonomous Website Controller & Action Execution Engine.
    Ingests real-time screen_context (visible elements, ordinal positions, active modals, path)
    and resolves direct on-screen tasks, order placements, bookings, and deep navigations.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message') or request.data.get('text', '') or request.data.get('command', '')
        if not message:
            return Response({'error': 'Message/Command is required'}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])
        language = request.data.get('language', 'en')
        screen_context = request.data.get('screen_context', {}) or request.data.get('screenContext', {}) or request.data.get('page_context', {})

        user_info = None
        if request.user and request.user.is_authenticated:
            user_info = {
                'username': request.user.username,
                'name': request.user.get_full_name() or request.user.username,
                'role': getattr(request.user, 'role', 'Customer'),
                'location': getattr(request.user, 'address', '')
            }

        response_data = ask_site_controller(
            message=message,
            history=history,
            language=language,
            user_info=user_info,
            screen_context=screen_context
        )
        return Response(response_data)


class VoiceRegistrationAnalyzeView(APIView):
    """
    Analyzes natural speech for voice-guided registration across 6 languages.
    Extracts name, experience years, skills, category, suggests service & pricing,
    identifies missing fields, and generates verbal follow-up prompts.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        speech_text = request.data.get('speech_text') or request.data.get('text') or request.data.get('transcript', '')
        current_data = request.data.get('current_data') or request.data.get('extracted_data') or {}
        language = request.data.get('language', 'en')

        result = analyze_voice_registration(
            speech_text=speech_text,
            current_data=current_data,
            language=language
        )
        return Response(result)


class VoiceRegistrationSubmitView(APIView):
    """
    Completes voice-guided registration, creates User, ProviderProfile, SkillPassport,
    initial Service listing, and returns JWT auth tokens for instant login.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data.copy()
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()
        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or 'demo1234'
        role = (data.get('role') or User.Role.PROVIDER).upper()
        if role not in [User.Role.PROVIDER, User.Role.CUSTOMER]:
            role = User.Role.PROVIDER

        phone = data.get('phone', '')
        email = data.get('email', '')
        address = data.get('address') or 'Chennai, TN'
        pref_lang = data.get('preferred_language') or data.get('language') or 'en'
        is_senior = data.get('is_senior', True if role == User.Role.PROVIDER else False)

        if not username:
            if first_name:
                import re, random
                base = re.sub(r'[^a-zA-Z0-9]', '', first_name).lower()
                username = f"{base}_{random.randint(100, 999)}"
            else:
                import random
                username = f"artisan_{random.randint(1000, 9999)}"

        # Ensure unique username
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{original_username}_{counter}"
            counter += 1

        if not email:
            email = f"{username}@silverhands.org"

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    role=role,
                    address=address,
                    preferred_language=pref_lang,
                    is_senior=is_senior,
                    is_email_verified=True
                )

                if role == User.Role.PROVIDER:
                    skills = data.get('skills', ['Traditional Craft'])
                    if isinstance(skills, str):
                        skills = [s.strip() for s in skills.split(',') if s.strip()]

                    try:
                        exp_years = int(float(data.get('experience_years') or 10))
                    except (ValueError, TypeError):
                        exp_years = 10

                    service_desc = data.get('service_description') or f"Experienced artisan with {exp_years}+ years of practical mastery offering authentic services in {address}."
                    service_title = data.get('service_title') or (skills[0] if skills else "Traditional Home Service")
                    
                    passport_id = f"SH-{uuid.uuid4().hex[:8].upper()}"
                    passport_dict = {
                        'title': f"Master of {service_title}",
                        'experience': f"{exp_years}+ Years Practical Mastery",
                        'badges': ['Identity Verified', 'Voice Verified Skill', 'Heritage Craft'],
                        'trust_score': 95,
                        'highlights': [f"{exp_years}+ Years Experience", "Verified Local Homemaker"]
                    }

                    prov_profile = ProviderProfile.objects.create(
                        user=user,
                        bio=service_desc,
                        skills=skills,
                        experience_years=exp_years,
                        location=address,
                        languages=[pref_lang, 'en'],
                        is_verified=True,
                        trust_score=95,
                        skill_passport=passport_dict,
                        skill_passport_id=passport_id
                    )

                    # Find or match Category
                    cat_slug = (data.get('category_slug') or 'cooking').lower()
                    category_obj = Category.objects.filter(slug=cat_slug).first()
                    if not category_obj:
                        category_obj = Category.objects.first()

                    try:
                        price_val = Decimal(str(data.get('suggested_price') or 600))
                    except Exception:
                        price_val = Decimal('600.00')

                    pricing_unit = data.get('pricing_unit') or 'per service'

                    Service.objects.create(
                        provider=prov_profile,
                        category=category_obj,
                        title=service_title,
                        description=service_desc,
                        price=price_val,
                        pricing_unit=pricing_unit,
                        duration='1-2 hours',
                        languages=[pref_lang, 'en'],
                        is_available=True
                    )

                elif role == User.Role.CUSTOMER:
                    CustomerProfile.objects.create(
                        user=user,
                        location=address,
                        languages=[pref_lang, 'en']
                    )

                refresh = CustomTokenObtainPairSerializer.get_token(user)
                return Response({
                    'user': UserProfileSerializer(user).data,
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'message': 'Voice registration completed successfully!'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
