from django.urls import path
from .views import (
    AIHealthCheckView, AIMatchView, AIProfileWizardView, ConfirmServiceCardView,
    GenerateProductCardView, ConfirmProductCardView, GrowthAdvisorView,
    FairPriceCheckerView, SmartRecommendationsView,
    ExtractSkillsView, SuggestSkillsView, SuggestServicesView,
    GenerateDescriptionView, SuggestPriceView, BusinessAssistantView, DetectScamView,
    VoiceAssistantView, SiteControllerView,
    VoiceRegistrationAnalyzeView, VoiceRegistrationSubmitView
)

urlpatterns = [
    path('health/', AIHealthCheckView.as_view(), name='ai-health'),
    path('voice-assistant/', VoiceAssistantView.as_view(), name='ai-voice-assistant'),
    path('site-controller/', SiteControllerView.as_view(), name='ai-site-controller'),
    path('voice-registration/analyze/', VoiceRegistrationAnalyzeView.as_view(), name='ai-voice-reg-analyze'),
    path('voice-registration/submit/', VoiceRegistrationSubmitView.as_view(), name='ai-voice-reg-submit'),
    path('match/', AIMatchView.as_view(), name='ai-match'),
    path('wizard/', AIProfileWizardView.as_view(), name='ai-wizard'),
    path('confirm-service/', ConfirmServiceCardView.as_view(), name='ai-confirm-service'),
    path('generate-product/', GenerateProductCardView.as_view(), name='ai-generate-product'),
    path('confirm-product/', ConfirmProductCardView.as_view(), name='ai-confirm-product'),
    path('growth-advisor/', GrowthAdvisorView.as_view(), name='ai-growth-advisor'),
    path('check-fair-price/', FairPriceCheckerView.as_view(), name='ai-check-fair-price'),
    path('recommendations/', SmartRecommendationsView.as_view(), name='ai-recommendations'),
    path('extract-skills/', ExtractSkillsView.as_view(), name='ai-extract-skills'),
    path('suggest-skills/', SuggestSkillsView.as_view(), name='ai-suggest-skills'),
    path('suggest-services/', SuggestServicesView.as_view(), name='ai-suggest-services'),
    path('generate-description/', GenerateDescriptionView.as_view(), name='ai-generate-description'),
    path('suggest-price/', SuggestPriceView.as_view(), name='ai-suggest-price'),
    path('business-assistant/', BusinessAssistantView.as_view(), name='ai-business-assistant'),
    path('detect-scam/', DetectScamView.as_view(), name='ai-detect-scam'),
]

