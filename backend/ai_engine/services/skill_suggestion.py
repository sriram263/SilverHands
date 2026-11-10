from typing import Any, Dict, List
from .ai_client import ai_client


def suggest_skills_and_livelihoods(text: str, current_skills: List[str] = None, experience_years: int = None) -> Dict[str, Any]:
    """
    Based on provider experience and existing skills, suggests realistic additional
    livelihood opportunities and skill expansions.
    Supports English, Tamil, and Hindi input.
    """
    cleaned_text = (text or "").strip()
    skills_list = current_skills or []
    
    fallback = _suggest_skills_rule_based(cleaned_text, skills_list)

    system_instruction = (
        "You are the SilverHands Livelihood Expansion Advisor. "
        "Based on the provider's skills, experience, and background (in English, Tamil, or Hindi), "
        "suggest 4 to 6 realistic, practical, and culturally relevant livelihood opportunities.\n"
        "EXAMPLES for Traditional Cooking/Snacks (e.g. 25 yrs):\n"
        "- Homemade snacks\n"
        "- Cooking classes\n"
        "- Recipe mentoring\n"
        "- Festival food preparation\n"
        "- Traditional cooking consultation\n"
        "EXAMPLES for Tailoring:\n"
        "- Custom blouse designing\n"
        "- Clothing alterations & repairs\n"
        "- Tailoring workshops\n"
        "- Bulk uniform stitching\n"
        "CRITICAL:\n"
        "- Suggestions must be realistic, safe, and practical for micro-entrepreneurs and senior providers.\n"
        "- Return strictly JSON with format: {\"suggestions\": [\"...\", \"...\"]}"
    )

    prompt = (
        f"Provider background: \"{cleaned_text}\"\n"
        f"Existing skills: {skills_list}\n"
        f"Years of experience: {experience_years or 'Not specified'}\n\n"
        "Suggest realistic livelihood opportunities and related practical services."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        suggestions = result.get("suggestions", [])
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)] if suggestions else []

        clean_suggestions = [str(s).strip() for s in suggestions if str(s).strip()]
        return {
            "suggestions": clean_suggestions if clean_suggestions else fallback["suggestions"]
        }
    except Exception:
        return fallback


def _suggest_skills_rule_based(text: str, current_skills: List[str]) -> Dict[str, Any]:
    """Rule-based suggestion fallback."""
    combined = (text + " " + " ".join(current_skills)).lower()

    if any(k in combined for k in ["snack", "cook", "food", "catering", "சமையல்", "खाना"]):
        return {
            "suggestions": [
                "Homemade snacks & savories",
                "Cooking classes & workshops",
                "Recipe mentoring",
                "Festival food preparation",
                "Traditional cooking consultation"
            ]
        }
    elif any(k in combined for k in ["stitch", "tailor", "sew", "தையல்", "सिलाई"]):
        return {
            "suggestions": [
                "Custom blouse & dress stitching",
                "Clothing alterations & repairs",
                "Tailoring lessons & mentoring",
                "Boutique bridal embroidery",
                "Festive wear customization"
            ]
        }
    elif any(k in combined for k in ["teach", "tutor", "math", "tamil", "english", "ஆசிரியர்", "ट्यूशन"]):
        return {
            "suggestions": [
                "One-on-one academic tutoring",
                "Language conversational practice",
                "Exam preparation coaching",
                "Homework assistance",
                "Adult literacy mentoring"
            ]
        }
    elif any(k in combined for k in ["clean", "maid", "housekeeping", "சுத்தம்", "सफाई"]):
        return {
            "suggestions": [
                "Deep home cleaning",
                "Kitchen organization assistance",
                "Move-in/Move-out cleaning",
                "Festival home preparation",
                "Regular housekeeping management"
            ]
        }
    else:
        return {
            "suggestions": [
                "Specialized consulting in core skill",
                "Hands-on mentoring and tutoring",
                "Custom order fulfillment",
                "Weekend service packages",
                "Festival & seasonal services"
            ]
        }
