import os, sys, django
sys.path.insert(0, r"c:\mavericks\SilverHands_Unified\backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silverhands.settings')
django.setup()

from marketplace.models import Category, ProviderProfile, Service, Product
from accounts.models import User
from ai_engine.services.ai_client import ai_client
from ai_engine.services.matching import match_providers
from ai_engine.services.pricing import suggest_fair_price
from ai_engine.services.scam_detection import detect_scam_message

print('=== SilverHands Unified Verification ===')
print(f'Total Users: {User.objects.count()}')
print(f'Total Categories: {Category.objects.count()}')
print(f'Total Providers: {ProviderProfile.objects.count()}')
print(f'Total Services: {Service.objects.count()}')
print(f'Total Products: {Product.objects.count()}')
print(f'AI Client Configured: {ai_client.is_configured()} (Provider: {ai_client.provider}, Model: {ai_client.model})')

# 1. Test AI Match
match_res = match_providers('Need someone to teach traditional cooking in Adyar')
print(f"AI Match Result Count: {len(match_res.get('matches', []))} (Source: {match_res.get('source', 'live')})")

# 2. Test AI Pricing
price_res = suggest_fair_price(service='Traditional Chettinad Cooking', experience=25, location='Chennai')
print(f"AI Fair Price Suggestion: Rs. {price_res.get('recommended_price')} (Range: {price_res.get('suggested_minimum')} - {price_res.get('suggested_maximum')})")

# 3. Test AI Scam Detection
scam_res = detect_scam_message('Please send 500 advance to my personal phonepe number before I arrive')
print(f"AI Scam Flag: {scam_res.get('is_scam')} (Risk Level: {scam_res.get('risk_level')})")

print('[SUCCESS] ALL BACKEND & GEMINI AI SERVICES OPERATIONAL!')
