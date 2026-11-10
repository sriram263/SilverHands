from typing import Any, Dict, Optional
from .ai_client import ai_client


def suggest_fair_price(
    service: str,
    category: str = "",
    location: str = "",
    experience: float = 0.0,
    duration_hours: float = 1.0,
    existing_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes fair, realistic price boundaries and recommendation based on service complexity,
    duration, experience, and location benchmarks.
    Includes a clear disclaimer that results are advisory recommendations.
    """
    fallback = _calculate_pricing_baseline(service, category, location, experience, duration_hours, existing_price)

    system_instruction = (
        "You are the SilverHands Fair Price Advisory Engine for senior artisans and freelance providers.\n"
        "Given the service details, experience, duration, and location, calculate:\n"
        "1. 'suggested_minimum': fair lower threshold (INR integer)\n"
        "2. 'suggested_maximum': reasonable upper threshold (INR integer)\n"
        "3. 'recommended_price': fair competitive price (INR integer, between min and max)\n"
        "4. 'reasoning': concise, grounded explanation considering time, skill level, and materials\n"
        "5. 'disclaimer': mandatory note stating this is an AI-assisted recommendation and not a guaranteed market quote.\n"
        "CRITICAL:\n"
        "- Do NOT cite fabricated or fake statistical surveys as facts.\n"
        "- Keep prices realistic in Indian Rupees (INR) for local services (e.g. tailoring, home cooking, tutoring, repairs).\n"
        "- Return strictly JSON matching keys: suggested_minimum, suggested_maximum, recommended_price, reasoning, disclaimer."
    )

    prompt = (
        f"Service Name: {service}\n"
        f"Category: {category or 'General Service'}\n"
        f"Location: {location or 'Metro / Urban India'}\n"
        f"Provider Experience: {experience} years\n"
        f"Estimated Duration / Unit: {duration_hours} hour(s)\n"
        f"Existing Price: ₹{existing_price if existing_price else 'None'}\n\n"
        "Suggest realistic fair pricing bounds and reasoning."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        min_p = result.get("suggested_minimum", fallback["suggested_minimum"])
        max_p = result.get("suggested_maximum", fallback["suggested_maximum"])
        rec_p = result.get("recommended_price", fallback["recommended_price"])

        # Numerical cleanup and bound verification
        try:
            min_p = int(round(float(min_p)))
            max_p = int(round(float(max_p)))
            rec_p = int(round(float(rec_p)))
        except (ValueError, TypeError):
            min_p = fallback["suggested_minimum"]
            max_p = fallback["suggested_maximum"]
            rec_p = fallback["recommended_price"]

        if min_p > max_p:
            min_p, max_p = max_p, min_p
        if rec_p < min_p:
            rec_p = min_p
        if rec_p > max_p:
            rec_p = (min_p + max_p) // 2

        reasoning = str(result.get("reasoning", fallback["reasoning"])).strip()
        disclaimer = str(result.get("disclaimer", fallback["disclaimer"])).strip()

        return {
            "suggested_minimum": min_p,
            "suggested_maximum": max_p,
            "recommended_price": rec_p,
            "currency": "INR",
            "reasoning": reasoning or fallback["reasoning"],
            "disclaimer": disclaimer or fallback["disclaimer"]
        }
    except Exception:
        return fallback


def _calculate_pricing_baseline(
    service: str,
    category: str,
    location: str,
    experience: float,
    duration: float,
    existing: Optional[float]
) -> Dict[str, Any]:
    """Deterministic calculation of pricing benchmarks."""
    text = (str(service or "") + " " + str(category or "")).lower()
    
    # Base hourly rates in INR
    if any(k in text for k in ["tailor", "stitch", "sew", "தையல்", "सिलाई"]):
        base_rate = 350
    elif any(k in text for k in ["cook", "food", "snack", "catering", "சமையல்", "खाना"]):
        base_rate = 400
    elif any(k in text for k in ["tutor", "teach", "lesson", "பாடம்", "ट्यूशन"]):
        base_rate = 300
    elif any(k in text for k in ["clean", "maid", "housekeeping", "சுத்தம்"]):
        base_rate = 250
    elif any(k in text for k in ["plumb", "electr", "repair", "carpenter"]):
        base_rate = 350
    else:
        base_rate = 300

    # Adjust for experience (e.g. +5% per 5 years)
    exp_factor = 1.0 + min(0.4, (experience / 10.0) * 0.15)
    
    # Duration factor
    effective_duration = max(0.5, float(duration or 1.0))
    estimated_total = base_rate * exp_factor * effective_duration

    if existing and existing > 0:
        # Blend existing price
        estimated_total = (estimated_total + existing) / 2.0

    min_p = int(round(estimated_total * 0.75 / 50)) * 50
    max_p = int(round(estimated_total * 1.35 / 50)) * 50
    rec_p = int(round(estimated_total / 50)) * 50

    min_p = max(100, min_p)
    max_p = max(min_p + 100, max_p)
    rec_p = max(min_p, min(max_p, rec_p))

    return {
        "suggested_minimum": min_p,
        "suggested_maximum": max_p,
        "recommended_price": rec_p,
        "currency": "INR",
        "reasoning": (
            f"Based on {effective_duration} hour(s) of {service} with {int(experience)} years of experience, "
            f"factoring in typical regional artisanal standards and effort."
        ),
        "disclaimer": "This price suggestion is an advisory recommendation and not a guaranteed market quote. Providers may adjust pricing according to exact scope and material costs."
    }
