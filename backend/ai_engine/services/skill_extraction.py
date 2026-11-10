import re
from typing import Any, Dict, List
from .ai_client import ai_client, AIServiceException


def extract_skills_from_text(text: str) -> Dict[str, Any]:
    """
    Extracts professional skills, years of experience, and potential marketable services
    from freeform text in English, Tamil, or Hindi using the live AI model.
    """
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        return {
            "skills": [],
            "experience_years": 0,
            "potential_services": []
        }

    system_instruction = (
        "You are the SilverHands Skill Extraction Engine. Analyze the user's professional background.\n"
        "Input may be in English, Tamil (தமிழ்), or Hindi (हिंदी).\n"
        "Extract:\n"
        "1. 'skills': list of concise practical skill titles (e.g. ['Tailoring', 'Embroidery', 'Blouse Designing'])\n"
        "2. 'experience_years': numeric years of experience mentioned in text (integer or float). If not mentioned, return 0.\n"
        "3. 'potential_services': list of realistic service offerings they can sell (e.g. ['Custom Blouse Stitching', 'Garment Alterations'])\n"
        "CRITICAL RULES:\n"
        "- Do NOT invent unmentioned experience or fabricate unmentioned capabilities.\n"
        "- Respond in valid JSON matching keys: 'skills', 'experience_years', 'potential_services'."
    )

    prompt = f"Extract skills, experience, and potential services from this profile text:\n\n\"{cleaned_text}\""

    fallback = _extract_skills_rule_based(cleaned_text)

    # Call AI Client
    result = ai_client.generate_json(
        prompt=prompt,
        system_instruction=system_instruction,
        default_fallback=fallback
    )
    
    # Process structured AI result
    skills = result.get("skills", [])
    if not isinstance(skills, list):
        skills = [str(skills)] if skills else []

    experience = result.get("experience_years", 0)
    try:
        experience = float(experience) if experience is not None else 0
        if experience.is_integer():
            experience = int(experience)
    except (ValueError, TypeError):
        experience = 0

    potential_services = result.get("potential_services", [])
    if not isinstance(potential_services, list):
        potential_services = [str(potential_services)] if potential_services else []

    return {
        "skills": [str(s).strip() for s in skills if str(s).strip()],
        "experience_years": experience,
        "potential_services": [str(p).strip() for p in potential_services if str(p).strip()]
    }


def _extract_skills_rule_based(text: str) -> Dict[str, Any]:
    """Offline rule-based fallback when no API key is provided."""
    lower = text.lower()
    
    years = 0
    match = re.search(r'(\d+)\s*(?:years?|yrs?|வருட[^\s]*|வருஷ[^\s]*|ஆண்டுக[^\s]*|साल[^\s]*|वर्ष[^\s]*)', lower)
    if match:
        try:
            years = int(match.group(1))
        except ValueError:
            years = 0

    skills = []
    services = []

    keywords = [
        (["stitch", "tailor", "sewing", "தையல்", "துணி", "सिलाई", "दर्जी", "blouse", "saree"], "Tailoring & Blouse Stitching", "Custom Blouse & Dress Stitching"),
        (["cook", "baking", "catering", "snacks", "தின்பண்ட", "சமையல்", "உணவு", "खाना", "रसोई"], "Traditional Cooking & Catering", "Homemade Snacks & Catering"),
        (["teach", "tutor", "math", "english", "tamil", "science", "பாடம்", "ஆசிரியர்", "ट्यूशन", "गणित", "पढ़ाना"], "Academic Tutoring", "One-on-One Tutoring"),
        (["clean", "housekeeping", "maid", "வீட்டு வேலை", "சுத்தம்", "सफाई"], "Housekeeping", "Residential Cleaning"),
        (["plumb", "pipe", "குழாய்", "प्लम्बर"], "Plumbing", "Plumbing Repair"),
        (["electr", "wiring", "fan", "மின்சாரம்", "बिजली"], "Electrical Work", "Electrical Maintenance"),
        (["carpenter", "wood", "மரவேலை", "बढ़ई"], "Carpentry", "Furniture Repair"),
    ]

    for patterns, skill_name, service_name in keywords:
        if any(p in lower for p in patterns):
            skills.append(skill_name)
            services.append(service_name)

    return {
        "skills": list(dict.fromkeys(skills)),
        "experience_years": years,
        "potential_services": list(dict.fromkeys(services))
    }
