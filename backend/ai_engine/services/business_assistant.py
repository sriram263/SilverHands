from typing import Any, Dict, List, Optional
from .ai_client import ai_client


def ask_business_assistant(
    question: str,
    provider_context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    language: str = "English"
) -> Dict[str, Any]:
    """
    Answers business growth, profile optimization, and client management queries
    for SilverHands providers with full multi-turn conversational memory and rich user profile context.
    Never exposes internal system secrets or sensitive database details.
    """
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "reply": "Please ask a question about your services, pricing, packaging, or customer growth.",
            "actionable_tips": [
                "Ask how to optimize your service descriptions.",
                "Ask what festival or seasonal offers to launch.",
                "Ask how to price your handmade goods competitively."
            ]
        }

    ctx = provider_context or {}
    sanitized_context = {
        "name": ctx.get("name") or "Artisan / Homemaker",
        "role": ctx.get("role", "provider"),
        "skills": ctx.get("skills", []),
        "experience_years": ctx.get("experience_years", 0),
        "location": ctx.get("location") or ctx.get("location_city") or "Chennai, TN",
        "bio": ctx.get("bio", ""),
        "services": ctx.get("services", []),
        "products": ctx.get("products", []),
        "rating": ctx.get("rating", 5.0),
        "completed_jobs": ctx.get("completed_jobs", 0),
    }

    fallback = _business_assistant_fallback(q_clean, sanitized_context)

    # Format previous multi-turn conversation history
    history_formatted = ""
    if history and isinstance(history, list) and len(history) > 0:
        history_lines = []
        for turn in history[-8:]:  # keep last 8 turns for context window efficiency
            sender = str(turn.get("sender") or turn.get("role") or "user").lower()
            text = str(turn.get("text") or turn.get("content") or "").strip()
            if not text:
                continue
            if sender in ["user", "human"]:
                history_lines.append(f"Artisan: {text}")
            else:
                history_lines.append(f"Growth Advisor: {text}")
        if history_lines:
            history_formatted = "\n--- PREVIOUS CONVERSATION TURNS ---\n" + "\n".join(history_lines) + "\n--- END OF PREVIOUS TURNS ---\n"

    system_instruction = (
        "You are the dedicated SilverHands AI Business & Growth Advisor for senior artisans, homemakers, and micro-entrepreneurs.\n"
        "Your mission is to provide warm, encouraging, respectful, practical, and highly actionable business guidance.\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Contextual Awareness: You know the user's name, craft skills, years of experience, active listings, and city. Reference these naturally.\n"
        "2. Multi-turn Continuity: Track the previous conversation turns. If the user follows up on earlier advice, acknowledge the past context seamlessly.\n"
        "3. Focus Areas: Pricing strategies, packaging materials (e.g. food preservation, glass jars, eco-pouches), WhatsApp marketing, handling seasonal spikes (Diwali, Pongal), repeat client retention, and polite negotiation.\n"
        "4. Output Requirement: Return strictly valid JSON matching this schema:\n"
        "{\n"
        "  \"reply\": \"Warm, comprehensive conversational answer addressing the question directly (2-3 paragraphs)...\",\n"
        "  \"actionable_tips\": [\n"
        "    \"Specific immediate action step 1\",\n"
        "    \"Specific immediate action step 2\",\n"
        "    \"Specific immediate action step 3\"\n"
        "  ]\n"
        "}"
    )

    prompt = (
        f"Artisan Profile Details:\n"
        f"- Name: {sanitized_context['name']}\n"
        f"- Skills: {', '.join(sanitized_context['skills']) if sanitized_context['skills'] else 'Traditional Crafts'}\n"
        f"- Experience: {sanitized_context['experience_years']} years\n"
        f"- Location: {sanitized_context['location']}\n"
        f"- Active Services: {', '.join(sanitized_context['services']) if sanitized_context['services'] else 'Home services'}\n"
        f"- Active Products: {', '.join(sanitized_context['products']) if sanitized_context['products'] else 'Handmade items'}\n"
        f"- Bio: {sanitized_context['bio'] or 'Dedicated community artisan'}\n\n"
        f"{history_formatted}\n"
        f"Current Artisan Message: \"{q_clean}\"\n"
        f"Preferred Language: {language}\n\n"
        "Please provide warm, actionable, and context-aware business advice in valid JSON format."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        reply = str(result.get("reply", "")).strip()
        tips = result.get("actionable_tips", [])
        if not isinstance(tips, list):
            tips = [str(tips)] if tips else []

        return {
            "reply": reply if reply else fallback["reply"],
            "actionable_tips": [str(t).strip() for t in tips if str(t).strip()] or fallback["actionable_tips"]
        }
    except Exception:
        return fallback


def _business_assistant_fallback(question: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based fallback for business assistant."""
    q_lower = question.lower()
    name = context.get("name") or "Artisan"
    skills = ", ".join(context.get("skills", ["your core craft skills"]))

    if any(k in q_lower for k in ["more customer", "more client", "get customer", "reach customer", "வாடிக்கையாளர்", "ग्राहक"]):
        return {
            "reply": (
                f"Namaste {name}! To attract more customers in your area for {skills}, focus on keeping your profile detailed, "
                "showcasing photos of your past work, and maintaining quick response times to customer inquiries. "
                "Satisfied clients are also your best source of word-of-mouth recommendations!"
            ),
            "actionable_tips": [
                "Add clear, specific titles to your service listings (e.g. 'Handmade Silk Blouse Stitching').",
                "Encourage happy customers to leave a 5-star review.",
                "Offer a small introductory discount or combo package for first-time bookings."
            ]
        }
    elif any(k in q_lower for k in ["pack", "package", "packaging", "glass jar", "pouch", "bottle", "leak"]):
        return {
            "reply": (
                f"For handmade goods in {skills}, presentation and freshness protection are crucial. "
                "For food items like pickles and powders, food-grade glass jars with induction seals or airtight stand-up zipper kraft pouches preserve aroma and prevent oil leaks during transit."
            ),
            "actionable_tips": [
                "Use airtight glass jars or triple-layer food grade pouches.",
                "Apply a clean printed sticker label with preparation date, ingredients, and shelf life.",
                "Add a handwritten 'Thank You' card to delight local customers."
            ]
        }
    elif any(k in q_lower for k in ["price", "pricing", "cost", "charge", "rate", "விலை", "कीमत"]):
        return {
            "reply": (
                f"When pricing your {skills} offerings, remember to factor in material costs, labor hours, and your {context.get('experience_years', 10)}+ years of expertise. "
                "Avoid underpricing yourself, as customers value authentic homemade quality and artisanal effort."
            ),
            "actionable_tips": [
                "Calculate raw material cost + packaging + ₹300–₹400/hour for skilled labor.",
                "Offer bundle pricing for larger orders (e.g. 5kg bulk sweet orders).",
                "Use our Fair Price Checker to benchmark against Chennai standard rates."
            ]
        }
    else:
        return {
            "reply": (
                f"Namaste {name}! SilverHands is designed to celebrate and elevate your skills in {skills}. "
                "Focus on clear communication, prompt service, and building lasting customer relationships in your neighborhood."
            ),
            "actionable_tips": [
                "Keep your availability status up to date.",
                "Clearly list what each service package includes.",
                "Respond promptly to initial inquiries to build customer confidence."
            ]
        }
