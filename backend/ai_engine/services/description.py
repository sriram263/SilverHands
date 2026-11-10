from typing import Any, Dict, List, Optional
from .ai_client import ai_client


def generate_business_description(
    name: str,
    skills: List[str],
    experience_years: float = 0,
    background: str = "",
    languages: Optional[List[str]] = None,
    location: str = "",
    tone: str = "professional"
) -> Dict[str, Any]:
    """
    Generates a professional, authentic, and editable profile/business description for a provider.
    Ensures qualifications and experience are not exaggerated.
    """
    skills_clean = [str(s).strip() for s in (skills or []) if str(s).strip()]
    langs = languages or ["English"]
    
    fallback = _generate_description_fallback(name, skills_clean, experience_years, location, langs)

    system_instruction = (
        "You are the SilverHands Bio & Business Description Writer. "
        "Create an authentic, trustworthy, and dignified profile description for a skilled provider or senior micro-entrepreneur.\n"
        "GUIDELINES:\n"
        "- Tone: Professional, warm, and authentic. Editable by the provider.\n"
        "- Do NOT exaggerate qualifications, certifications, or experience.\n"
        "- Mention actual years of experience, core skills, spoken languages, and commitment to quality.\n"
        "- Return strictly JSON matching:\n"
        "{\n"
        "  \"description\": \"Full paragraph provider description...\",\n"
        "  \"tagline\": \"Short memorable tagline (under 12 words)\",\n"
        "  \"highlights\": [\"Highlight 1\", \"Highlight 2\", \"Highlight 3\"]\n"
        "}"
    )

    prompt = (
        f"Provider Name: {name or 'Service Provider'}\n"
        f"Core Skills: {', '.join(skills_clean)}\n"
        f"Experience: {experience_years} years\n"
        f"Location: {location or 'Local'}\n"
        f"Spoken Languages: {', '.join(langs)}\n"
        f"Additional Background/Notes: \"{background}\"\n"
        f"Tone Preference: {tone}\n\n"
        "Generate a genuine, professional, and editable profile description."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        desc = str(result.get("description", "")).strip()
        tagline = str(result.get("tagline", "")).strip()
        highlights = result.get("highlights", [])
        if not isinstance(highlights, list):
            highlights = [str(highlights)] if highlights else []

        return {
            "description": desc if desc else fallback["description"],
            "tagline": tagline if tagline else fallback["tagline"],
            "highlights": [str(h).strip() for h in highlights if str(h).strip()] or fallback["highlights"]
        }
    except Exception:
        return fallback


def _generate_description_fallback(name: str, skills: List[str], exp: float, loc: str, langs: List[str]) -> Dict[str, Any]:
    """Fallback generator for description."""
    prov_name = name.strip() if name and name.strip() else "Experienced Professional"
    skills_text = ", ".join(skills) if skills else "specialized services"
    loc_text = f" based in {loc}" if loc else ""
    exp_text = f"over {int(exp)} years" if exp and exp > 0 else "extensive practical experience"
    lang_text = f" Fluent in {', '.join(langs)}." if langs else ""

    description = (
        f"Hello, I am {prov_name}{loc_text}. With {exp_text} of hands-on expertise in {skills_text}, "
        f"I take pride in delivering meticulous, reliable, and high-quality work to my clients.{lang_text} "
        f"I am dedicated to clear communication, punctuality, and complete customer satisfaction."
    )

    tagline = f"Dedicated & reliable {skills[0] if skills else 'professional'} with {exp_text}."
    
    highlights = [
        f"{exp_text.capitalize()} in {skills[0] if skills else 'craft'}",
        f"Languages: {', '.join(langs) if langs else 'English'}",
        "Committed to quality & on-time delivery"
    ]

    return {
        "description": description,
        "tagline": tagline,
        "highlights": highlights
    }
