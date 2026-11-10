from typing import Any, Dict, List
from .ai_client import ai_client


def suggest_services(
    skills: List[str],
    experience_years: float = 0,
    background_text: str = "",
    category: str = ""
) -> Dict[str, Any]:
    """
    Generates realistic, tailored service offerings for a provider.
    Returns:
      - title
      - short explanation
      - target customer
      - category
    """
    skills_clean = [str(s).strip() for s in (skills or []) if str(s).strip()]
    
    fallback = _suggest_services_rule_based(skills_clean, experience_years, category, background_text)

    system_instruction = (
        "You are the SilverHands Service Catalog Builder. "
        "Create 3 to 5 realistic, structured service listings that a skilled senior or micro-entrepreneur can offer.\n"
        "Each service item in the 'services' array MUST contain:\n"
        "- 'title': clear service name (e.g. 'Handmade Traditional Snacks Catering')\n"
        "- 'explanation': 1-2 sentence description of what the service includes\n"
        "- 'target_customer': who should book this service (e.g. 'Families hosting poojas and festivals')\n"
        "- 'category': service classification (e.g. 'Food & Catering', 'Tailoring', 'Education', 'Home Care')\n"
        "CRITICAL:\n"
        "- Suggestions must strictly be based on the provider's actual skills and experience.\n"
        "- Do not exaggerate or fabricate unrelated capabilities.\n"
        "- Output strictly JSON matching format: {\"services\": [{\"title\": \"...\", \"explanation\": \"...\", \"target_customer\": \"...\", \"category\": \"...\"}]}"
    )

    prompt = (
        f"Provider skills: {skills_clean}\n"
        f"Experience years: {experience_years}\n"
        f"Preferred category: {category or 'General'}\n"
        f"Background details: \"{background_text}\"\n\n"
        "Generate 3-5 realistic and marketable service offerings."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        services = result.get("services", [])
        if not isinstance(services, list):
            services = [services] if isinstance(services, dict) else []

        formatted_services = []
        for s in services:
            if isinstance(s, dict):
                formatted_services.append({
                    "title": str(s.get("title", "")).strip(),
                    "explanation": str(s.get("explanation", "")).strip(),
                    "target_customer": str(s.get("target_customer", "")).strip(),
                    "category": str(s.get("category", category or "General")).strip()
                })

        return {
            "services": formatted_services if formatted_services else fallback["services"]
        }
    except Exception:
        return fallback


def _suggest_services_rule_based(skills: List[str], experience: float, category: str, text: str) -> Dict[str, Any]:
    """Fallback generator for service suggestions."""
    primary_skill = skills[0] if skills else (category or "Craft & Service")
    combined = (primary_skill + " " + text + " " + category).lower()

    if any(k in combined for k in ["tailor", "stitch", "sew", "தையல்", "सिलाई"]):
        return {
            "services": [
                {
                    "title": "Custom Blouse & Dress Stitching",
                    "explanation": "Made-to-measure stitching with precise neck patterns and lining.",
                    "target_customer": "Women seeking personalized festive and everyday attire.",
                    "category": "Tailoring & Fashion"
                },
                {
                    "title": "Fast Garment Alterations & Repairs",
                    "explanation": "Hemming, resizing, zipper replacement, and fit adjustments.",
                    "target_customer": "Locals needing quick wardrobe fixes and size corrections.",
                    "category": "Tailoring & Fashion"
                },
                {
                    "title": "Boutique Embroidery & Border Work",
                    "explanation": "Hand embroidery, zari borders, and decorative needlework.",
                    "target_customer": "Bridal and festive wear customers.",
                    "category": "Tailoring & Fashion"
                }
            ]
        }
    elif any(k in combined for k in ["cook", "food", "snack", "catering", "சமையல்", "खाना"]):
        return {
            "services": [
                {
                    "title": "Traditional Homemade Snacks & Sweets",
                    "explanation": "Authentic regional snacks prepared fresh with traditional home recipes.",
                    "target_customer": "Households, festive hosts, and gift senders.",
                    "category": "Food & Catering"
                },
                {
                    "title": "Special Occasion Home Catering",
                    "explanation": "Small-batch authentic meals cooked for family gatherings and poojas.",
                    "target_customer": "Families hosting gatherings up to 30 people.",
                    "category": "Food & Catering"
                },
                {
                    "title": "Traditional Cooking Masterclass",
                    "explanation": "One-on-one mentorship on authentic ancestral spice blends and recipes.",
                    "target_customer": "Young adults and food enthusiasts wanting to learn authentic cooking.",
                    "category": "Food & Catering"
                }
            ]
        }
    else:
        return {
            "services": [
                {
                    "title": f"Professional {primary_skill} Consultation",
                    "explanation": f"Expert consultation and customized hands-on {primary_skill.lower()} work.",
                    "target_customer": "Individuals and households seeking verified experienced assistance.",
                    "category": category or "Professional Services"
                },
                {
                    "title": f"On-Demand {primary_skill} Service",
                    "explanation": f"Timely and high quality delivery of {primary_skill.lower()} tasks.",
                    "target_customer": "Local neighborhood residents requiring reliable support.",
                    "category": category or "Professional Services"
                }
            ]
        }
