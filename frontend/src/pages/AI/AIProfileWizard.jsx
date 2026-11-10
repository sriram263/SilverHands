import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, Sparkles, ShoppingCart, Calendar, CheckCircle2, Wand2, Edit3, ArrowRight, 
  ShieldCheck, Star, DollarSign, TrendingUp, Compass, Layers, 
  Check, Package, HelpCircle, Send, Scale, ThumbsUp, Lock, RefreshCw,
  AlertTriangle, AlertOctagon, ShieldAlert, XCircle, Info, Plus
} from 'lucide-react';
import { 
  aiProfileWizard, aiConfirmService, aiGenerateProduct, 
  aiConfirmProduct, aiGrowthAdvisor, aiExtractSkills, 
  aiCheckFairPrice, aiGetRecommendations, getBookings, getOrders,
  updateProviderMe
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { VoiceListeningModal } from '../../components/voice/VoiceListeningModal';

const WIZARD_SERVICE_TEMPLATES = [
  {
    label: '🍲 Chettinad Catering',
    story: 'My name is Lakshmi. I have 30 years of experience cooking authentic Chettinad feasts, vegetarian lunches, sambar, rasam, and traditional sweets using heirloom family recipes in Chennai.'
  },
  {
    label: '👗 Bridal Aari Work',
    story: 'I am Meena, a skilled artisan with 22 years of experience in bespoke tailoring, bridal blouse Aari needlework, zardosi embroidery, and saree fall pico fitting.'
  },
  {
    label: '🌱 Organic Gardening',
    story: 'I have 15 years of experience in setting up terrace vegetable gardens, homemade organic composting, and natural herbal pest management.'
  },
  {
    label: '🎶 Carnatic Lessons',
    story: 'I am a retired teacher with 25 years of experience teaching Carnatic vocal music, devotional stotras, and harmonium to kids and beginners.'
  },
  {
    label: '👵🏽 Senior Care',
    story: 'I offer caring senior companionship, reading vernacular newspapers, accompaniment for neighborhood temple visits, and light domestic errands.'
  }
];

const WIZARD_PRODUCT_TEMPLATES = [
  {
    label: '🥨 Coconut Murukku',
    idea: 'Crispy South Indian Coconut Murukku made from freshly ground rice flour, pure coconut milk, butter, and cumin seeds (250g pack).'
  },
  {
    label: '🌶️ Garlic Idli Podi',
    idea: 'Aromatic homemade Garlic Idli Milagai Podi hand-roasted with heritage lentils, dried red chillies, and organic garlic (200g jar).'
  },
  {
    label: '🥭 Raw Mango Pickle',
    idea: 'Traditional grated raw mango thokku pickle slow-cooked in pure wood-pressed gingelly sesame oil with whole mustard seeds (500g).'
  },
  {
    label: '🧶 Woolen Sweater',
    idea: 'Hand-knitted soft warm woolen winter sweater with classic diamond stitch patterns for daily wear (Unisex).'
  },
  {
    label: '🌿 Herbal Hair Oil',
    idea: 'Ayurvedic cold-pressed coconut hair oil infused with fresh curry leaves, amla, bhringraj, and hibiscus flowers (200ml bottle).'
  },
  {
    label: '🌱 Vermicompost 5kg',
    idea: '100% natural organic vermicompost fertilizer enriched with beneficial soil microbes for potted terrace plants (5kg bag).'
  }
];

const SKILL_STORY_TEMPLATES = [
  {
    label: '🍲 Master South Indian Cook',
    story: 'I have 25 years of experience preparing authentic Chettinad dishes, vegetarian lunches, Mysore Pak, traditional sambar powder, and catering wedding feasts.'
  },
  {
    label: '👗 Tailoring & Aari Artisan',
    story: 'I have 18 years of experience in bespoke blouse stitching, intricate Aari needlework, zardosi embroidery, saree fall pico, and custom dress alterations.'
  },
  {
    label: '🌱 Terrace Gardening & Bio-Compost',
    story: '12 years of hands-on expertise in rooftop vegetable garden setup, organic vermicomposting, drip irrigation maintenance, and natural herbal pest sprays.'
  },
  {
    label: '🎶 Carnatic Music Tutor',
    story: '20 years of classical Carnatic vocal music teaching, harmonium lessons, Sanskrit stotra chanting, and devotional bhajan classes for all ages.'
  }
];

const MARKET_AUDIT_ITEMS = [
  // 🟢 Fair & Verified
  {
    id: 'fair-1',
    title: 'Traditional Chettinad Feast Catering (10 Pax)',
    price: 3200,
    category: 'cooking',
    location: 'Chennai, Adyar',
    status: 'FAIR',
    label: 'Chettinad Feast 10 Pax',
    tag: '✓ Fair Price (Adyar)',
    tagClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'fair-2',
    title: 'Cotton & Silk Saree Fall, Hemming & Pico',
    price: 250,
    category: 'tailoring',
    location: 'Chennai, T. Nagar',
    status: 'FAIR',
    label: 'Saree Fall & Pico',
    tag: '✓ Fair Price (T. Nagar)',
    tagClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'fair-3',
    title: 'Homemade Coconut Murukku Snack (250g)',
    price: 160,
    category: 'cooking',
    location: 'Chennai',
    status: 'FAIR',
    label: 'Coconut Murukku 250g',
    tag: '✓ Fair Price (Marketplace)',
    tagClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'fair-4',
    title: 'Organic Balcony Garden Potting Soil & Pruning Visit',
    price: 650,
    category: 'gardening',
    location: 'Chennai, Mylapore',
    status: 'FAIR',
    label: 'Garden Pruning Visit',
    tag: '✓ Fair Price (Mylapore)',
    tagClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  // 🟡 Unfair / Overpriced
  {
    id: 'unfair-1',
    title: 'Simple 1-Hour Kitchen Counter Dusting',
    price: 8500,
    category: 'cleaning',
    location: 'Chennai, Velachery',
    status: 'OVERPRICED',
    label: '1-Hr Kitchen Dusting (₹8,500)',
    tag: '⚠️ 8x Overpriced Surge',
    tagClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'unfair-2',
    title: 'Handmade Guntur Red Chili Powder (100g)',
    price: 1600,
    category: 'cooking',
    location: 'Chennai',
    status: 'OVERPRICED',
    label: 'Chili Powder 100g (₹1,600)',
    tag: '⚠️ 10x Inflated Cost',
    tagClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'unfair-3',
    title: 'Basic Organic Turmeric Powder (100g Plastic Pack)',
    price: 1450,
    category: 'cooking',
    location: 'Chennai',
    status: 'OVERPRICED',
    label: 'Turmeric 100g (₹1,450)',
    tag: '⚠️ 12x Market Overcharge',
    tagClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'unfair-4',
    title: 'Single Hand-Stitched Cotton Handkerchief',
    price: 950,
    category: 'tailoring',
    location: 'Chennai',
    status: 'OVERPRICED',
    label: 'Cotton Handkerchief (₹950)',
    tag: '⚠️ Unfair Item Markup',
    tagClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'unfair-5',
    title: 'Pure Wood-Pressed Sesame Gingelly Oil (200ml Bottle)',
    price: 1800,
    category: 'cooking',
    location: 'Chennai',
    status: 'OVERPRICED',
    label: 'Gingelly Oil 200ml (₹1,800)',
    tag: '⚠️ 6x Inflated Price',
    tagClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  // 🔴 High Risk / Potential Scam
  {
    id: 'risky-1',
    title: 'Wedding Feast Catering: 100% Upfront Advance Payment via bit.ly/advance-pay',
    price: 45000,
    category: 'cooking',
    location: 'Chennai',
    status: 'HIGH_RISK',
    label: '100% Upfront Advance via bit.ly Link',
    tag: '🚨 Phishing Link / Scam Risk',
    tagClass: 'bg-red-100 text-red-900 border-red-300'
  },
  {
    id: 'risky-2',
    title: 'Guaranteed 100% Miracle Hair Regrowth Herbal Tonic (No License/Ingredients)',
    price: 14999,
    category: 'wellness',
    location: 'Chennai',
    status: 'HIGH_RISK',
    label: 'Miracle Cure Tonic (No License)',
    tag: '🚨 Unverified Medical Claim',
    tagClass: 'bg-red-100 text-red-900 border-red-300'
  },
  {
    id: 'risky-3',
    title: 'Festival Deep Cleaning & AC Gas Refill (Advance 100% via QR code link bit.ly/clean-pay)',
    price: 12000,
    category: 'cleaning',
    location: 'Chennai',
    status: 'HIGH_RISK',
    label: 'Deep Clean via QR Phishing Link',
    tag: '🚨 Advance QR Phishing Risk',
    tagClass: 'bg-red-100 text-red-900 border-red-300'
  },
  {
    id: 'risky-4',
    title: 'Emergency Plumbing Pipe Repair: Non-Negotiable Midnight Urgent Security Deposit',
    price: 18500,
    category: 'repair',
    location: 'Chennai',
    status: 'HIGH_RISK',
    label: 'Urgent Midnight Pipe Deposit',
    tag: '🚨 Predatory Surge Extortion',
    tagClass: 'bg-red-100 text-red-900 border-red-300'
  },
  {
    id: 'risky-5',
    title: 'Private Home Tuition with Mandatory Full Year Advance Payment in Cash',
    price: 75000,
    category: 'tutoring',
    location: 'Chennai',
    status: 'HIGH_RISK',
    label: '1-Yr Cash Advance Tuition',
    tag: '🚨 Non-Refundable Cash Escrow Breach',
    tagClass: 'bg-red-100 text-red-900 border-red-300'
  }
];

export const AIProfileWizard = () => {
  const { user, isAuthenticated, isProvider, isAdmin, isCustomer } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(isCustomer ? 'fair_price' : 'service_card');

  // --- Voice Modal State ---
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceModalTarget, setVoiceModalTarget] = useState(null);
  const [voiceModalTitle, setVoiceModalTitle] = useState('Listening to Your Voice...');

  const [inputStory, setInputStory] = useState('');
  const [generatingService, setGeneratingService] = useState(false);
  const [publishingService, setPublishingService] = useState(false);
  const [aiServiceResult, setAiServiceResult] = useState(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [serviceData, setServiceData] = useState(null);

  const [productIdea, setProductIdea] = useState('');
  const [generatingProduct, setGeneratingProduct] = useState(false);
  const [publishingProduct, setPublishingProduct] = useState(false);
  const [productData, setProductData] = useState(null);

  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [askingAdvisor, setAskingAdvisor] = useState(false);
  const [advisorHistory, setAdvisorHistory] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your Growth & Business Advisor. Ask me anything about pricing festive orders, recipe preservation, WhatsApp marketing, or packaging tips for your handmade goods.'
    }
  ]);

  const [skillInputText, setSkillInputText] = useState('');
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedSkillResult, setExtractedSkillResult] = useState(null);
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [profileSkills, setProfileSkills] = useState(user?.skills || ['Traditional Craft']);

  const handleToggleSkillSelection = (skillName) => {
    setSelectedSkillsToAdd((prev) => 
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  };

  const handleAddSingleSkillToProfile = async (skillName) => {
    const updated = Array.from(new Set([...profileSkills, skillName]));
    setProfileSkills(updated);
    try {
      await updateProviderMe({ skills: updated });
      showToast(`✓ Added "${skillName}" to your live Provider Profile!`, 'success');
    } catch {
      showToast('Failed to update provider profile', 'error');
    }
  };

  const handleSaveAllSkillsToProfile = async () => {
    const extractedList = extractedSkillResult?.skills || extractedSkillResult?.primary_skills || selectedSkillsToAdd;
    const updated = Array.from(new Set([...profileSkills, ...extractedList, ...selectedSkillsToAdd]));
    setSavingSkills(true);
    try {
      await updateProviderMe({ skills: updated });
      setProfileSkills(updated);
      showToast(`✓ Successfully saved ${extractedList.length} skills to your live Provider Profile & Skill Passport!`, 'success');
    } catch {
      showToast('Failed to save skills to profile', 'error');
    } finally {
      setSavingSkills(false);
    }
  };

  const [fairCheckItem, setFairCheckItem] = useState('');
  const [fairCheckPrice, setFairCheckPrice] = useState('');
  const [fairCheckLocation, setFairCheckLocation] = useState(user?.address || 'Chennai');
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [fairPriceResult, setFairPriceResult] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [myHistoryBookings, setMyHistoryBookings] = useState([]);
  const [myHistoryOrders, setMyHistoryOrders] = useState([]);

  const handleAnalyzeAuditItem = async (item) => {
    setSelectedAuditId(item.id);
    setFairCheckItem(item.title);
    setFairCheckPrice(item.price.toString());
    setFairCheckLocation(item.location || 'Chennai');
    setCheckingPrice(true);
    try {
      const res = await aiCheckFairPrice({
        item_name: item.title,
        price: parseFloat(item.price),
        location: item.location || 'Chennai'
      });
      setFairPriceResult(res.data);
      showToast(`Analyzed quote: ${item.label || item.title}`, 'info');
    } catch {
      showToast('Fair price check failed', 'error');
    } finally {
      setCheckingPrice(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getBookings({ view: 'my_requests' }).then((res) => setMyHistoryBookings(res.data || [])).catch(() => {});
      getOrders({ view: 'my_purchases' }).then((res) => setMyHistoryOrders(res.data || [])).catch(() => {});
    }
  }, [isAuthenticated]);

  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (activeTab === 'recommendations' && !recommendations) {
      setLoadingRecs(true);
      aiGetRecommendations().then((res) => {
        setRecommendations(res.data);
      }).catch(() => {}).finally(() => setLoadingRecs(false));
    }
  }, [activeTab]);

  const openVoicePopup = (target, title) => {
    setVoiceModalTarget(target);
    setVoiceModalTitle(title);
    setIsVoiceModalOpen(true);
  };

  const handleVoiceDataReceived = (spokenText) => {
    if (!spokenText) return;
    if (voiceModalTarget === 'service') {
      setInputStory((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'product') {
      setProductIdea((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'advisor') {
      setAdvisorQuestion(spokenText);
    } else if (voiceModalTarget === 'skill') {
      setSkillInputText((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'fair_item') {
      setFairCheckItem(spokenText);
    }
  };

  const handleGenerateService = async () => {
    if (!inputStory.trim()) {
      showToast('Please type or speak your craft story first', 'error');
      return;
    }
    setGeneratingService(true);
    try {
      const res = await aiProfileWizard(inputStory);
      setAiServiceResult(res.data);
      const services = res.data.suggested_services || [];
      const initialService = services[0] || {
        title: 'Authentic Traditional Home Service',
        category_slug: res.data.category_slug || 'cooking',
        price: 800,
        pricing_unit: 'per session',
        duration: '2 hours',
        description: res.data.bio || 'High quality traditional service.',
        languages: ['Tamil', 'English']
      };
      setSelectedServiceIndex(0);
      setServiceData(initialService);
      showToast('Service packages formulated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Generation failed. Please try again.', 'error');
    } finally {
      setGeneratingService(false);
    }
  };

  const handleConfirmPublishService = async () => {
    if (!serviceData) return;
    setPublishingService(true);
    try {
      const payload = {
        title: serviceData.title,
        category_slug: serviceData.category_slug,
        price: serviceData.price,
        pricing_unit: serviceData.pricing_unit,
        duration: serviceData.duration,
        description: serviceData.description,
        languages: serviceData.languages || ['Tamil', 'English'],
        bio: aiServiceResult?.bio,
        skills: aiServiceResult?.skills,
        skill_passport: aiServiceResult?.skill_passport,
        experience_years: aiServiceResult?.experience_years || 15
      };
      const res = await aiConfirmService(payload);
      showToast('Service Card published to live marketplace!', 'success');
      navigate(`/services/${res.data.service.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish service', 'error');
    } finally {
      setPublishingService(false);
    }
  };

  const handleGenerateProduct = async () => {
    if (!productIdea.trim()) {
      showToast('Please describe your product idea first', 'error');
      return;
    }
    setGeneratingProduct(true);
    try {
      const res = await aiGenerateProduct(productIdea);
      setProductData(res.data);
      showToast('Product card drafted by AI!', 'success');
    } catch {
      showToast('Failed to generate product card', 'error');
    } finally {
      setGeneratingProduct(false);
    }
  };

  const handleConfirmPublishProduct = async () => {
    if (!productData) return;
    setPublishingProduct(true);
    try {
      const res = await aiConfirmProduct(productData);
      showToast('Product published to marketplace store!', 'success');
      navigate(`/products/${res.data.product.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish product', 'error');
    } finally {
      setPublishingProduct(false);
    }
  };

  const handleAskAdvisor = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const q = (customPrompt || advisorQuestion || '').trim();
    if (!q) return;

    const userMessage = { 
      sender: 'user', 
      text: q, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    // Format previous turns for multi-turn conversational tracking
    const historyPayload = advisorHistory.map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    setAdvisorHistory((prev) => [...prev, userMessage]);
    setAdvisorQuestion('');
    setAskingAdvisor(true);

    const userDetails = {
      name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Artisan',
      skills: profileSkills || user?.skills || [],
      location: user?.address || 'Chennai, TN',
      bio: user?.bio || '',
      role: user?.role || 'provider'
    };

    try {
      const res = await aiGrowthAdvisor(q, historyPayload, userDetails);
      const replyText = res.data.reply || res.data.response || res.data.answer || 'Here is my business guidance.';
      const tipsList = res.data.actionable_tips || [];
      
      setAdvisorHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: replyText,
          tips: tipsList,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setAdvisorHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Namaste ${userDetails.name}! To grow your ${userDetails.skills?.join(', ') || 'craft'} business, focus on clear communication, authentic photos of your work, and timely deliveries.`,
          tips: [
            'Create festive combo packages for local events.',
            'Encourage happy clients to leave 5-star ratings.',
            'Ensure airtight packaging for long-distance orders.'
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAskingAdvisor(false);
    }
  };

  const handleResetAdvisorChat = () => {
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Artisan';
    const userSkills = profileSkills?.join(', ') || user?.skills?.join(', ') || 'Traditional Crafts';
    setAdvisorHistory([
      {
        sender: 'ai',
        text: `Namaste ${userName}! I am your AI Business & Growth Advisor. I have your profile details (${userSkills}) on file. Ask me anything about pricing, packaging, festive promotions, WhatsApp marketing, or handling client inquiries!`,
        tips: [
          'Ask: "How do I price my festive orders?"',
          'Ask: "What packaging is best for liquid/oil items?"',
          'Ask: "How do I get repeat bookings from neighbors?"'
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    showToast('Advisor conversation reset for new topic', 'info');
  };

  const handleExtractSkills = async () => {
    if (!skillInputText.trim()) return;
    setExtractingSkills(true);
    try {
      const res = await aiExtractSkills(skillInputText);
      setExtractedSkillResult(res.data);
      const skillsList = res.data.skills || res.data.primary_skills || [];
      setSelectedSkillsToAdd(skillsList);
      showToast(`Extracted ${skillsList.length} practical skills! You can now add them to your profile.`, 'success');
    } catch {
      showToast('Skill extraction failed', 'error');
    } finally {
      setExtractingSkills(false);
    }
  };

  const handleCheckFairPrice = async (e) => {
    e.preventDefault();
    if (!fairCheckItem || !fairCheckPrice) return;
    setCheckingPrice(true);
    try {
      const res = await aiCheckFairPrice({
        item_name: fairCheckItem,
        price: parseFloat(fairCheckPrice),
        location: fairCheckLocation
      });
      setFairPriceResult(res.data);
      showToast('Fair price evaluation complete!', 'success');
    } catch {
      showToast('Fair price check failed', 'error');
    } finally {
      setCheckingPrice(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <span className="badge-tag bg-saffron text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Artisan & Marketplace Wizard
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-warmgray-900">
          Smart AI Toolkit for Artisans, Homemakers & Customers
        </h1>
        <p className="text-sm text-warmgray-600 max-w-2xl mx-auto">
          Generate live service & product cards, consult the Growth Advisor, extract verified skills, and verify fair market pricing.
        </p>
      </div>

      {isCustomer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>You are logged in as a <strong>Customer</strong>. You can use the <strong>Fair Price Checker</strong> and <strong>Smart Recommendations</strong> below. Service/Product card creation is reserved for verified Providers.</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        {!isCustomer && (
          <>
            <button
              onClick={() => setActiveTab('service_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'service_card' ? 'bg-saffron text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Generate Service Card
            </button>

            <button
              onClick={() => setActiveTab('product_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'product_card' ? 'bg-sage text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Generate Product Card
            </button>

            <button
              onClick={() => setActiveTab('growth_advisor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'growth_advisor' ? 'bg-purple-700 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Growth Advisor
            </button>

            <button
              onClick={() => setActiveTab('skill_extractor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'skill_extractor' ? 'bg-blue-600 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Skill Extractor
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('fair_price')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'fair_price' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Fair Price Checker (Common)
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'recommendations' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Smart Recommendations
        </button>
      </div>

      {/* 1. SERVICE CARD TAB */}
      {activeTab === 'service_card' && !isCustomer && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-saffron/30">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">
              Describe Your Traditional Craft or Experience
            </h3>

            {/* Quick Example Story Chips */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-warmgray-500 mb-1.5">
                ⚡ Click Example Craft Ideas to Auto-Fill Prompt:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WIZARD_SERVICE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputStory(tpl.story);
                      showToast(`Loaded ${tpl.label}! Click Generate below.`, 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cream-100 hover:bg-saffron-100 text-warmgray-700 hover:text-saffron-900 border border-warmgray-200 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-warmgray-600">Your craft story or background:</span>
              <button
                type="button"
                onClick={() => openVoicePopup('service', 'Speak Your Craft Experience & Background')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-saffron-50 text-saffron-700 border border-saffron-200 hover:bg-saffron-100 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-saffron" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={inputStory}
              onChange={(e) => setInputStory(e.target.value)}
              placeholder="e.g. My name is Kamala. I have 25 years of experience cooking authentic Chettinad feasts, vegetarian lunches, and homemade spice powders in Chennai..."
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />

            <button
              onClick={handleGenerateService}
              disabled={generatingService}
              className="w-full btn-primary text-sm font-bold !py-3 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>{generatingService ? 'Formulating Service Card Packages...' : 'Generate Service Card & Bio'}</span>
            </button>
          </div>

          {aiServiceResult && serviceData && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(aiServiceResult.suggested_services || []).map((pkg, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedServiceIndex(idx);
                      setServiceData(pkg);
                    }}
                    className={`card-surface p-4 cursor-pointer border-2 ${
                      selectedServiceIndex === idx ? 'border-saffron bg-saffron-50/20' : 'border-warmgray-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-saffron uppercase block mb-1">{pkg.tier || `Option ${idx+1}`}</span>
                    <h4 className="font-heading font-bold text-sm text-warmgray-900 line-clamp-2">{pkg.title}</h4>
                    <p className="font-heading text-xl font-black text-saffron-dark mt-2">₹{Math.round(pkg.price)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-cream-100 p-4 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={serviceData.title}
                    onChange={(e) => setServiceData({ ...serviceData, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Confirmed Price (₹)</label>
                  <input
                    type="number"
                    value={serviceData.price}
                    onChange={(e) => setServiceData({ ...serviceData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold text-saffron-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={serviceData.duration}
                    onChange={(e) => setServiceData({ ...serviceData, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleConfirmPublishService}
                  disabled={publishingService}
                  className="btn-primary text-sm font-bold !py-3.5 !px-8 shadow-warm-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{publishingService ? 'Publishing...' : '✓ Confirm & Publish Service Card'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRODUCT CARD TAB */}
      {activeTab === 'product_card' && !isCustomer && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-sage-200">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                Describe Your Handmade Delicacy (Speak or Type)
              </h3>
              <button
                type="button"
                onClick={() => openVoicePopup('product', 'Speak Your Handmade Product / Recipe Idea')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-sage-50 text-sage-dark border border-sage-200 hover:bg-sage-100 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-sage" />
                <span>Voice Input</span>
              </button>
            </div>

            {/* Quick Example Product Chips */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-warmgray-500 mb-1.5">
                ⚡ Click Example Product Ideas to Auto-Fill Prompt:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WIZARD_PRODUCT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setProductIdea(tpl.idea);
                      showToast(`Loaded ${tpl.label}! Click Generate below.`, 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cream-100 hover:bg-sage-100 text-warmgray-700 hover:text-sage-900 border border-warmgray-200 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={productIdea}
              onChange={(e) => setProductIdea(e.target.value)}
              placeholder="e.g. Traditional Sun-Dried Mango Pickle with gingelly oil and fenugreek, 500g glass jar..."
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
            <button
              onClick={handleGenerateProduct}
              disabled={generatingProduct}
              className="w-full btn-secondary text-sm font-bold !py-3 flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>{generatingProduct ? 'Drafting Product Card...' : 'Generate Product Card'}</span>
            </button>
          </div>

          {productData && (
            <div className="card-surface p-6 space-y-4 border-2 border-sage animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <span className="badge-tag bg-sage text-white font-bold">{productData.category_slug}</span>
                  <h3 className="font-heading text-xl font-bold text-warmgray-900 mt-1">{productData.title}</h3>
                  <p className="text-xs text-warmgray-600 mt-1">{productData.description}</p>
                </div>
                <span className="font-heading text-3xl font-black text-sage-dark">₹{Math.round(productData.price)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-cream-50 p-3 rounded-xl">
                <div><strong>Shelf Life:</strong> {productData.shelf_life || '60 days'}</div>
                <div><strong>Stock:</strong> {productData.quantity || 10} units</div>
              </div>

              <button
                onClick={handleConfirmPublishProduct}
                disabled={publishingProduct}
                className="w-full btn-secondary text-sm font-bold !py-3 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{publishingProduct ? 'Publishing...' : '✓ Confirm & Publish Product to Store'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. GROWTH ADVISOR MULTI-TURN CHATBOT TAB */}
      {activeTab === 'growth_advisor' && !isCustomer && (
        <div className="card-surface p-5 sm:p-7 space-y-4 border border-purple-200 shadow-sm">
          {/* Header with Profile Context & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-warmgray-900 flex items-center gap-2">
                  <span>AI Business & Growth Advisor</span>
                  <span className="badge-tag bg-purple-100 text-purple-800 text-[10px] font-bold">
                    Multi-Turn Chat
                  </span>
                </h3>
                <p className="text-xs text-warmgray-500">
                  Personalized for <strong>{user?.first_name || 'Artisan'}</strong> • {profileSkills?.join(', ') || 'Traditional Crafts'} • {user?.address || 'Chennai'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAdvisorChat}
              className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Reset conversation and start a new topic"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Topic</span>
            </button>
          </div>

          {/* Quick Icebreaker / Suggested Prompts */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-warmgray-500 block mb-1.5">
              💡 Suggested Questions (Click to Ask):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '💰 Price Festival Sweets', q: 'How should I price my homemade festival sweets and snack boxes for Diwali and Pongal?' },
                { label: '📦 Leakproof Pickle Packaging', q: 'What is the best food-grade, leakproof packaging for glass jar pickles and gingelly oils?' },
                { label: '📱 WhatsApp Marketing', q: 'What are the best WhatsApp broadcast and status marketing templates for neighborhood customers?' },
                { label: '🔄 Repeat Tailoring Bookings', q: 'How can I get repeat customers for bridal blouse tailoring and alterations?' },
                { label: '⚡ Managing Festival Rush', q: 'How do I manage high volume festive orders without delaying delivery or lowering quality?' }
              ].map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskAdvisor(null, sug.q)}
                  disabled={askingAdvisor}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cream-100 hover:bg-purple-100 text-warmgray-700 hover:text-purple-900 border border-warmgray-200 transition-colors"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Turn Chat Stream */}
          <div className="h-[420px] overflow-y-auto p-4 bg-cream-50/70 rounded-3xl border border-warmgray-200 space-y-4">
            {advisorHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.sender !== 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-3xl text-xs max-w-xl leading-relaxed space-y-2 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-purple-700 text-white font-medium rounded-tr-sm'
                      : 'bg-white text-warmgray-800 border border-purple-100 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs font-normal leading-relaxed">{msg.text}</p>

                  {/* Actionable Tips checklist if present in AI message */}
                  {msg.tips && msg.tips.length > 0 && (
                    <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-1.5 mt-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-700" />
                        Actionable Next Steps:
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-purple-950 font-medium">
                        {msg.tips.map((t, tidx) => (
                          <li key={tidx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={`text-[9px] font-bold text-right pt-0.5 ${msg.sender === 'user' ? 'text-purple-200' : 'text-warmgray-400'}`}>
                    {msg.timestamp || 'Just now'}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-saffron text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            ))}

            {askingAdvisor && (
              <div className="flex gap-2.5 justify-start animate-fade-in">
                <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3.5 bg-white border border-purple-100 rounded-3xl rounded-tl-sm text-xs text-purple-900 flex items-center gap-2 shadow-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                  <span className="font-semibold">Advisor is preparing personalized guidance...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Toolbar */}
          <form onSubmit={handleAskAdvisor} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={advisorQuestion}
                onChange={(e) => setAdvisorQuestion(e.target.value)}
                placeholder="Ask about pricing, packaging, festive orders, repeat clients..."
                disabled={askingAdvisor}
                className="w-full px-4 py-3 pr-10 rounded-2xl border border-warmgray-300 text-xs bg-cream-50 font-medium focus:ring-2 focus:ring-purple-600 shadow-inner"
              />
              <button
                type="button"
                onClick={() => openVoicePopup('advisor', 'Speak Your Growth & Business Question')}
                className="absolute right-2.5 top-2.5 p-1 rounded-lg text-warmgray-400 hover:text-purple-700 transition-colors"
                title="Speak question"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={askingAdvisor || !advisorQuestion.trim()}
              className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. SKILL EXTRACTOR & PROFILE SYNCER TAB */}
      {activeTab === 'skill_extractor' && !isCustomer && (
        <div className="card-surface p-6 sm:p-8 space-y-6 border border-blue-200 shadow-sm">
          <div>
            <span className="badge-tag bg-blue-50 text-blue-800 font-bold mb-1">
              Digital Skill Passport Formulator
            </span>
            <h3 className="font-heading text-2xl font-bold text-warmgray-900">
              AI Skill Extraction & Profile Livelihood Syncer
            </h3>
            <p className="text-xs text-warmgray-600 mt-1">
              Describe your domestic vocational background or select an example craft story below. The AI will extract verified practical skills that you can directly add to your live Master Artisan Profile & Skill Passport.
            </p>
          </div>

          {/* Quick Skill Story Chips */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-warmgray-500 mb-1.5">
              ⚡ Click Example Artisan Stories to Auto-Fill:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_STORY_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSkillInputText(tpl.story);
                    showToast(`Loaded ${tpl.label}! Click Extract Skills below.`, 'info');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cream-100 hover:bg-blue-100 text-warmgray-700 hover:text-blue-900 border border-warmgray-200 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-warmgray-700">Your craft story or vocational experience:</span>
              <button
                type="button"
                onClick={() => openVoicePopup('skill', 'Speak Your Skills & Experience')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={skillInputText}
              onChange={(e) => setSkillInputText(e.target.value)}
              placeholder="Paste your past experience, recipes, tailoring expertise, or domestic craft background..."
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleExtractSkills}
              disabled={extractingSkills}
              className="w-full btn-primary text-xs font-bold !py-3 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{extractingSkills ? 'Extracting & Verifying Practical Skills...' : 'Extract Verified Practical Skills'}</span>
            </button>
          </div>

          {/* Extracted Skills Interactive Manager */}
          {extractedSkillResult && (
            <div className="p-5 bg-gradient-to-r from-blue-50/50 via-white to-cream-50 rounded-3xl border-2 border-blue-200 space-y-4 animate-fade-in">
              <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-blue-100">
                <div>
                  <span className="badge-tag bg-blue-600 text-white font-bold text-[10px]">
                    Extracted Skills & Passport Assets
                  </span>
                  <h4 className="font-heading font-extrabold text-base text-warmgray-900 mt-1">
                    Select Skills to Add to Your Live Profile
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllSkillsToProfile}
                  disabled={savingSkills}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingSkills ? 'Saving to Profile...' : '✓ Save All Extracted Skills to Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(extractedSkillResult.skills || extractedSkillResult.primary_skills || ['Culinary Arts', 'Traditional Craft']).map((s, i) => {
                  const isAlreadyInProfile = profileSkills.includes(s);
                  const isSelected = selectedSkillsToAdd.includes(s);
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                        isAlreadyInProfile
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : isSelected
                          ? 'bg-blue-50/60 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-warmgray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-sm">★</span>
                        <span className="font-bold text-xs text-warmgray-900">{s}</span>
                      </div>

                      {isAlreadyInProfile ? (
                        <span className="badge-tag bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                          ✓ On Live Profile
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddSingleSkillToProfile(s)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Profile</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current Live Profile Skills Summary */}
              <div className="pt-3 border-t border-warmgray-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmgray-500 block mb-1.5">
                  Your Current Live Profile Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profileSkills.map((sk, idx) => (
                    <span key={idx} className="badge-tag bg-white text-warmgray-800 border border-warmgray-300 font-bold text-[10px]">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <SkillPassportBadge trustScore={96} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. FAIR PRICE & RISK EVALUATOR TAB (Common) */}
      {activeTab === 'fair_price' && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-2 border border-warmgray-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="badge-tag bg-sage-50 text-sage-dark font-bold mb-1">Marketplace Transparency & Scam Shield</span>
                <h3 className="font-heading text-2xl font-bold text-warmgray-900">
                  Fair Price & Risk Valuation Engine
                </h3>
              </div>
              <span className="badge-tag bg-cream-100 text-warmgray-700 font-semibold text-xs border border-warmgray-200">
                Audits: Fair, Overpriced & Risky Quotes
              </span>
            </div>
            <p className="text-xs text-warmgray-600">
              Select any past booking or sample market quote on the side column to instantly analyze fair pricing, detect predatory surges, or uncover high-risk scam conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE COLUMN: Booked Quotes & Audit Cases */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card-surface p-4 sm:p-5 space-y-3 border border-warmgray-200 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-warmgray-100">
                  <h4 className="font-heading font-bold text-sm text-warmgray-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-saffron" />
                    <span>Booked Quotes & Cases</span>
                  </h4>
                  <span className="text-[10px] font-extrabold text-warmgray-400">Click to Inspect</span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1 pb-1">
                  {[
                    { id: 'ALL', label: 'All Cases' },
                    { id: 'FAIR', label: '🟢 Fair' },
                    { id: 'OVERPRICED', label: '🟡 Overpriced' },
                    { id: 'HIGH_RISK', label: '🔴 High Risk' }
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setAuditFilter(flt.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        auditFilter === flt.id
                          ? 'bg-warmgray-900 text-white shadow-sm'
                          : 'bg-cream-100 text-warmgray-600 hover:bg-cream-200'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {/* Placed User Bookings & Orders (if any) */}
                {(myHistoryBookings.length > 0 || myHistoryOrders.length > 0) && (
                  <div className="space-y-2 pt-1 border-t border-warmgray-100">
                    <span className="text-[10px] font-extrabold text-warmgray-500 uppercase tracking-wider block">
                      Your Placed Requests:
                    </span>
                    {myHistoryBookings.map((b) => (
                      <div
                        key={`my-bk-${b.id}`}
                        onClick={() => handleAnalyzeAuditItem({
                          id: `my-bk-${b.id}`,
                          title: b.service_title,
                          price: b.total_price,
                          location: b.location || 'Chennai',
                          label: b.service_title,
                          status: 'USER_BOOKING'
                        })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAuditId === `my-bk-${b.id}`
                            ? 'border-saffron bg-saffron-50/40 shadow-sm ring-2 ring-saffron/40'
                            : 'border-warmgray-200 bg-white hover:border-saffron/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="badge-tag bg-saffron-50 text-saffron-dark text-[9px] font-bold">Your Service Booking</span>
                            <h5 className="font-bold text-xs text-warmgray-900 mt-0.5 line-clamp-1">{b.service_title}</h5>
                          </div>
                          <span className="font-heading font-black text-xs text-warmgray-900">₹{Math.round(b.total_price)}</span>
                        </div>
                      </div>
                    ))}
                    {myHistoryOrders.map((o) => (
                      <div
                        key={`my-ord-${o.id}`}
                        onClick={() => handleAnalyzeAuditItem({
                          id: `my-ord-${o.id}`,
                          title: o.product_title,
                          price: o.total_price,
                          location: 'Chennai',
                          label: o.product_title,
                          status: 'USER_ORDER'
                        })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAuditId === `my-ord-${o.id}`
                            ? 'border-sage bg-sage-50/40 shadow-sm ring-2 ring-sage/40'
                            : 'border-warmgray-200 bg-white hover:border-sage/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="badge-tag bg-sage-50 text-sage-dark text-[9px] font-bold">Your Store Order</span>
                            <h5 className="font-bold text-xs text-warmgray-900 mt-0.5 line-clamp-1">{o.product_title}</h5>
                          </div>
                          <span className="font-heading font-black text-xs text-warmgray-900">₹{Math.round(o.total_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seeded Audit Cards */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-warmgray-500 uppercase tracking-wider block">
                    Benchmark Audit Cases:
                  </span>
                  {MARKET_AUDIT_ITEMS
                    .filter((item) => auditFilter === 'ALL' || item.status === auditFilter)
                    .map((item) => {
                      const isSelected = selectedAuditId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAnalyzeAuditItem(item)}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-warmgray-900 bg-cream-50 shadow-md ring-2 ring-warmgray-900/30'
                              : `${item.tagClass} hover:opacity-95`
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                {item.status === 'FAIR' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                {item.status === 'OVERPRICED' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                {item.status === 'HIGH_RISK' && <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                <span className="font-extrabold text-[10px] uppercase tracking-wider">{item.tag}</span>
                              </div>
                              <h5 className="font-bold text-xs text-warmgray-900 leading-snug line-clamp-2">{item.title}</h5>
                              <span className="text-[10px] text-warmgray-500 mt-1 block">📍 {item.location}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-heading text-sm font-black text-warmgray-900 block">₹{item.price.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-saffron underline mt-1 block">Inspect →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* RIGHT MAIN COLUMN: Valuation Engine & AI Risk Breakdown */}
            <div className="lg:col-span-7 space-y-4">
              <div className="card-surface p-5 sm:p-6 space-y-4 border border-warmgray-200 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-warmgray-100">
                  <h4 className="font-heading font-bold text-sm text-warmgray-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-sage-dark" />
                    <span>Evaluate Any Custom Quote</span>
                  </h4>
                  <span className="text-[10px] font-bold text-warmgray-500">Live AI Benchmark</span>
                </div>

                <form onSubmit={handleCheckFairPrice} className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-warmgray-700">Service / Product Name</label>
                      <button
                        type="button"
                        onClick={() => openVoicePopup('fair_item', 'Speak Item or Service Name')}
                        className="text-[10px] font-bold flex items-center gap-0.5 text-sage-dark hover:underline"
                      >
                        <Mic className="w-3 h-3" /> Voice
                      </button>
                    </div>
                    <input
                      type="text"
                      value={fairCheckItem}
                      onChange={(e) => setFairCheckItem(e.target.value)}
                      placeholder="e.g. Traditional Chettinad Feast (10 Pax) or Kitchen Cleaning"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-warmgray-700 mb-1">Quoted Price (₹)</label>
                      <input
                        type="number"
                        value={fairCheckPrice}
                        onChange={(e) => setFairCheckPrice(e.target.value)}
                        placeholder="e.g. 3200"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warmgray-700 mb-1">City / Neighborhood</label>
                      <input
                        type="text"
                        value={fairCheckLocation}
                        onChange={(e) => setFairCheckLocation(e.target.value)}
                        placeholder="Chennai"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkingPrice}
                    className="w-full btn-primary text-xs font-bold !py-3 flex items-center justify-center gap-1.5 shadow-warm"
                  >
                    <Scale className="w-4 h-4" />
                    {checkingPrice ? 'Evaluating Market Rates & Risk Patterns...' : 'Evaluate Price Fairness & Risk'}
                  </button>
                </form>
              </div>

              {/* AI REPORT RESULT CARD */}
              {fairPriceResult && (
                <div className={`p-6 rounded-3xl border-2 space-y-4 animate-fade-in ${
                  fairPriceResult.risk_level === 'HIGH' || fairPriceResult.assessment === 'HIGH_RISK'
                    ? 'bg-red-50/40 border-red-300'
                    : fairPriceResult.assessment === 'OVERPRICED'
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-emerald-50/40 border-emerald-300'
                }`}>
                  
                  {/* Status Banner */}
                  <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-warmgray-200">
                    <div>
                      <span className={`badge-tag text-xs font-black px-3 py-1 ${
                        fairPriceResult.risk_level === 'HIGH' || fairPriceResult.assessment === 'HIGH_RISK'
                          ? 'bg-red-600 text-white'
                          : fairPriceResult.assessment === 'OVERPRICED'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-700 text-white'
                      }`}>
                        {fairPriceResult.badge || (fairPriceResult.is_fair ? '✓ Fair & Authentic' : '⚠️ Price Alert')}
                      </span>
                      <h4 className="font-heading font-extrabold text-lg text-warmgray-900 mt-1.5">
                        {fairPriceResult.item_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-warmgray-500 font-bold block">Quoted Price</span>
                      <span className="font-heading text-2xl font-black text-warmgray-900">
                        ₹{fairPriceResult.quoted_price?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 3-Tile Price Benchmark Gauge */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmgray-500 block mb-1.5">
                      Fair Regional Benchmark Range:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-warmgray-200">
                        <span className="text-[10px] text-warmgray-500 font-bold block">Min Fair Price</span>
                        <span className="font-heading text-xs sm:text-sm font-bold text-warmgray-700">₹{fairPriceResult.fair_range?.min?.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border-2 border-emerald-500 shadow-sm">
                        <span className="text-[10px] text-emerald-700 font-bold block">Honest Standard</span>
                        <span className="font-heading text-sm sm:text-base font-black text-emerald-800">₹{fairPriceResult.fair_range?.recommended?.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-warmgray-200">
                        <span className="text-[10px] text-warmgray-500 font-bold block">Max Fair Price</span>
                        <span className="font-heading text-xs sm:text-sm font-bold text-warmgray-700">₹{fairPriceResult.fair_range?.max?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Red Flags & Risk Factors Alert Box */}
                  {(fairPriceResult.risk_factors?.length > 0 || fairPriceResult.is_risky) && (
                    <div className="p-4 bg-red-100/70 border border-red-300 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                        <span>Security & Overpricing Red Flags:</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-xs text-red-800 font-medium">
                        {(fairPriceResult.risk_factors || []).map((rf, idx) => (
                          <li key={idx}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Advice & Negotiation Box */}
                  {fairPriceResult.advice && (
                    <div className="p-4 bg-white rounded-2xl border border-warmgray-200 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-warmgray-900 font-bold text-xs">
                        <Info className="w-4 h-4 text-saffron shrink-0" />
                        <span>AI Negotiation & Safety Guidance:</span>
                      </div>
                      <p className="text-xs text-warmgray-700 leading-relaxed pl-5">
                        {fairPriceResult.advice}
                      </p>
                    </div>
                  )}

                  {/* Regional Explanation */}
                  <p className="text-xs text-warmgray-600 leading-relaxed bg-white/70 p-3 rounded-xl border border-warmgray-200/60">
                    {fairPriceResult.explanation}
                  </p>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 6. SMART RECOMMENDATIONS TAB (Common) */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-warmgray-900">Curated Verified Recommendations</h3>
            <p className="text-xs text-warmgray-500">Handpicked top-rated traditional services and homemade goods.</p>
          </div>

          {loadingRecs ? (
            <div className="text-center py-10 font-bold text-saffron">Loading curated recommendations...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-base font-bold text-warmgray-900 mb-3">Top Verified Services</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_services || []).map((s) => (
                    <div key={s.id} className="card-surface p-4 space-y-2">
                      <span className="badge-tag bg-saffron-50 text-saffron-dark">{s.category_name}</span>
                      <h5 className="font-bold text-sm text-warmgray-900">{s.title}</h5>
                      <p className="text-xs text-warmgray-500">By {s.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                        <span className="font-bold text-sm text-saffron-dark">₹{Math.round(s.price)}</span>
                        <Link to={`/services/${s.id}`} className="text-xs font-bold text-warmgray-700 hover:text-saffron">
                          Book →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-warmgray-200">
                <h4 className="font-heading text-base font-bold text-warmgray-900 mb-3">Handmade Marketplace Delicacies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_products || []).map((p) => (
                    <div key={p.id} className="card-surface p-4 space-y-2">
                      <span className="badge-tag bg-sage-50 text-sage-dark">{p.category_name}</span>
                      <h5 className="font-bold text-sm text-warmgray-900">{p.title}</h5>
                      <p className="text-xs text-warmgray-500">By {p.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                        <span className="font-bold text-sm text-sage-dark">₹{Math.round(p.price)}</span>
                        <Link to={`/products/${p.id}`} className="text-xs font-bold text-warmgray-700 hover:text-sage">
                          Order →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Listening Popup Modal with 20s Silence Timeout */}
      <VoiceListeningModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceCaptured={handleVoiceDataReceived}
        title={voiceModalTitle}
      />
    </div>
  );
};
