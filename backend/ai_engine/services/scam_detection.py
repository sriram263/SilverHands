import re
from typing import Any, Dict, List
from .ai_client import ai_client


def detect_scam_message(message: str) -> Dict[str, Any]:
    """
    Analyzes messages, job offers, or payment requests for potential scams, advance-fee fraud,
    phishing, or unsafe off-platform transactions.
    Supports English, Tamil, and Hindi text.
    """
    cleaned_msg = (message or "").strip()
    if not cleaned_msg:
        return {
            "risk_level": "LOW",
            "is_suspicious": False,
            "reasons": [],
            "recommended_action": "No message content provided.",
            "disclaimer": "This is an automated safety-assistance feature and does not guarantee complete fraud prevention."
        }

    fallback = _detect_scam_rule_based(cleaned_msg)

    system_instruction = (
        "You are the SilverHands Fraud & Scam Detection Safety Engine. "
        "Analyze customer/provider chat messages in English, Tamil, or Hindi to identify deceptive patterns, "
        "advance fee scams, off-platform payment coercion, phishing for OTPs/passwords, or suspicious lottery/gift claims.\n"
        "RISK LEVELS:\n"
        "- 'LOW': Normal communication about bookings, timing, directions, standard pricing.\n"
        "- 'MEDIUM': Urgency tactics, requests to switch to unverified channels, vague job offers.\n"
        "- 'HIGH': Advance registration/joining fees, demands for OTP/passwords, threats, promises of unrealistic winnings.\n"
        "OUTPUT FORMAT (Strictly valid JSON):\n"
        "{\n"
        "  \"risk_level\": \"LOW\" | \"MEDIUM\" | \"HIGH\",\n"
        "  \"is_suspicious\": true | false,\n"
        "  \"reasons\": [\"Reason 1\", \"Reason 2\"],\n"
        "  \"recommended_action\": \"Actionable safety advice\"\n"
        "}\n"
        "CRITICAL:\n"
        "- Do not claim 100% infallible fraud detection. Present as a safety-assistance advisory."
    )

    prompt = f"Analyze the safety of this message:\n\n\"{cleaned_msg}\""

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        risk = str(result.get("risk_level", "LOW")).upper()
        if risk not in ("LOW", "MEDIUM", "HIGH"):
            risk = fallback["risk_level"]

        is_suspicious = bool(result.get("is_suspicious", risk in ("MEDIUM", "HIGH")))
        reasons = result.get("reasons", [])
        if not isinstance(reasons, list):
            reasons = [str(reasons)] if reasons else []

        action = str(result.get("recommended_action", "")).strip()

        return {
            "risk_level": risk,
            "is_suspicious": is_suspicious,
            "reasons": [str(r).strip() for r in reasons if str(r).strip()] or fallback["reasons"],
            "recommended_action": action if action else fallback["recommended_action"],
            "disclaimer": "This is an automated safety-assistance feature and does not guarantee complete fraud prevention. Always follow secure platform guidelines."
        }
    except Exception:
        return fallback


def _detect_scam_rule_based(message: str) -> Dict[str, Any]:
    """Pattern matching fallback for scam detection."""
    msg_lower = message.lower()
    reasons = []
    risk_level = "LOW"
    action = "Message appears safe for normal service communication."

    # High risk indicators
    high_patterns = [
        (r'(?:registration|joining|security|deposit|processing|advance)\s*(?:fee|money|charge|amount|ரூபாய்|பணம்|फीस|पैसे)', "Requests upfront registration or processing fee before confirming work"),
        (r'(?:otp|password|pin|cvv|bank details|upi pin|கடவுச்சொல்|ओटीपी)', "Requests sensitive authentication details or OTP"),
        (r'(?:won|lottery|prize|gift card|congratulations.*claim|பரிசு|इनाम)', "Unrealistic lottery or unexpected prize claim"),
        (r'(?:pay|send|transfer)\s*(?:₹|rs\.?|inr)?\s*\d{3,}\s*(?:first|before|now|advance)', "Demands immediate upfront money transfer before work commences"),
    ]

    for pattern, reason_text in high_patterns:
        if re.search(pattern, msg_lower):
            reasons.append(reason_text)
            risk_level = "HIGH"
            action = "Do not send money or share personal details, and report this user immediately."

    # Medium risk indicators
    if risk_level != "HIGH":
        medium_patterns = [
            (r'(?:whatsapp|telegram|outside the app|personal number|off platform|தனிப்பட்ட எண்|व्हाट्सएप)', "Attempts to conduct transaction outside trusted platform safeguards"),
            (r'(?:urgent|immediately|within 5 minutes|hurry|சீக்கிரம்|जल्दी)', "Uses high urgency or pressure tactics"),
        ]
        for pattern, reason_text in medium_patterns:
            if re.search(pattern, msg_lower):
                reasons.append(reason_text)
                risk_level = "MEDIUM"
                action = "Exercise caution. Keep all communications and payments within SilverHands."

    is_suspicious = risk_level in ("MEDIUM", "HIGH")

    return {
        "risk_level": risk_level,
        "is_suspicious": is_suspicious,
        "reasons": reasons if reasons else ["No suspicious scam indicators detected in message"],
        "recommended_action": action,
        "disclaimer": "This is an automated safety-assistance feature and does not guarantee complete fraud prevention. Always follow secure platform guidelines."
    }
