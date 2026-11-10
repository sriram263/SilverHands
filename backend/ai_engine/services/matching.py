import re
from typing import Any, Dict, List, Optional
from django.db.models import Q
from marketplace.models import ProviderProfile, Service, Product, Category, haversine_km
from marketplace.serializers import ProviderProfileSerializer, ServiceSerializer, ProductSerializer
from .ai_client import ai_client

CATEGORY_KEYWORDS = {
    'cooking': ['cook', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'diet', 'diabetic', 'feast', 'catering', 'recipe', 'kitchen', 'chettinad', 'sambar', 'rasam', 'pickle', 'sweets', 'bakery', 'snack', 'masala'],
    'tailoring': ['tailor', 'stitch', 'sew', 'blouse', 'saree', 'dress', 'alteration', 'embroidery', 'aari', 'garment', 'cloth', 'fabric', 'kurtis', 'salwar'],
    'tutoring': ['tutor', 'teach', 'teacher', 'math', 'science', 'tamil', 'english', 'hindi', 'class', 'lesson', 'student', 'school', 'exam', 'homework'],
    'gardening': ['garden', 'plant', 'organic', 'terrace', 'vegetable', 'fertilizer', 'soil', 'nursery', 'pot', 'landscape', 'pruning'],
    'childcare': ['child', 'baby', 'eldercare', 'care', 'nanny', 'babysitter', 'companion', 'caring'],
    'language': ['language', 'tamil', 'sanskrit', 'telugu', 'spoken', 'fluent', 'grammar', 'conversation'],
    'handicrafts': ['craft', 'handmade', 'art', 'decor', 'pottery', 'candle', 'knitting', 'crochet', 'painting', 'kolam', 'rangoli']
}

def match_providers(
    requirement_text: str,
    category: str = "",
    location: str = "",
    budget: Optional[float] = None,
    language: str = "",
    preferred_time: str = "",
    required_skills: Optional[List[str]] = None,
    limit: int = 6,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Strict Semantic & Keyword Matcher:
    ONLY returns services, products, and providers that genuinely match the query.
    """
    req_text = (requirement_text or "").strip()
    req_lower = req_text.lower()
    words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', req_lower) if w not in ['need', 'want', 'looking', 'some', 'someone', 'please', 'for', 'the', 'and', 'with', 'from']]

    # 1. Detect Intent Category
    detected_cat = category.lower() if category else ""
    if not detected_cat:
        for cat_name, kw_list in CATEGORY_KEYWORDS.items():
            if any(k in req_lower for k in kw_list):
                detected_cat = cat_name
                break

    # 2. Strict Service Matching
    service_q = Q(is_available=True)
    if detected_cat:
        service_q &= (Q(category__slug=detected_cat) | Q(category__name__icontains=detected_cat))
    
    if words:
        word_q = Q()
        for w in words:
            word_q |= Q(title__icontains=w) | Q(description__icontains=w) | Q(category__name__icontains=w)
        service_q &= word_q

    if budget:
        service_q &= Q(price__lte=budget * 1.3)

    matching_services = Service.objects.select_related('provider__user', 'category').filter(service_q).distinct()[:limit]

    # 3. Strict Product Matching
    prod_q = Q(is_available=True, quantity__gt=0)
    if detected_cat:
        prod_q &= (Q(category__slug=detected_cat) | Q(category__name__icontains=detected_cat))
    
    if words:
        word_q = Q()
        for w in words:
            word_q |= Q(title__icontains=w) | Q(description__icontains=w) | Q(category__name__icontains=w)
        prod_q &= word_q

    if budget:
        prod_q &= Q(price__lte=budget * 1.3)

    matching_products = Product.objects.select_related('provider__user', 'category').filter(prod_q).distinct()[:limit]

    # 4. Strict Provider Matching
    provider_q = Q()
    if detected_cat:
        provider_q |= Q(services__category__slug=detected_cat) | Q(skills__icontains=detected_cat)
    
    if words:
        for w in words:
            provider_q |= Q(skills__icontains=w) | Q(bio__icontains=w) | Q(services__title__icontains=w)

    providers_qs = ProviderProfile.objects.select_related('user').prefetch_related('services', 'products').filter(provider_q).distinct()

    scored_providers = []
    for p in providers_qs:
        score = 60 # Base score for having a verified matching skill/category
        reasons = []

        p_skills = [str(s).lower() for s in (p.skills or [])]
        matched_skills = [s for s in p_skills if any(w in s for w in words)]
        if matched_skills:
            score += 20
            reasons.append(f"Expertise in {', '.join([s.title() for s in matched_skills])}")

        p_services = [s for s in p.services.all() if s.is_available]
        matching_p_services = [s for s in p_services if any(w in s.title.lower() for w in words) or (detected_cat and s.category.slug == detected_cat)]
        if matching_p_services:
            score += 15
            reasons.append(f"Offers '{matching_p_services[0].title}'")

        if p.experience_years >= 10:
            score += 10
            reasons.append(f"{p.experience_years}+ years experience")

        if language and p.languages and any(language.lower() in str(l).lower() for l in p.languages):
            score += 10
            reasons.append(f"Fluent in {language.title()}")

        if location and location.lower() in str(p.location).lower():
            score += 10
            reasons.append(f"Located in {p.location}")

        scored_providers.append({
            "provider": ProviderProfileSerializer(p).data,
            "provider_id": p.id,
            "provider_name": p.display_name,
            "match_score": min(99, score),
            "reasons": reasons[:3] if reasons else ["Skills match your query"]
        })

    scored_providers.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "query": req_text,
        "detected_category": detected_cat or "general",
        "matches": scored_providers[:limit],
        "matching_services": ServiceSerializer(matching_services, many=True).data,
        "matching_products": ProductSerializer(matching_products, many=True).data,
        "total_matches": len(scored_providers) + len(matching_services) + len(matching_products)
    }
