import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSeniorMode } from './SeniorModeContext';
import { useLanguage } from './LanguageContext';
import { useNotifications } from './NotificationContext';
import { createOrder, createBooking, cancelBooking, cancelOrder, createReview } from '../api/client';

const VoiceAgentContext = createContext();

export const VoiceAgentProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSeniorMode, toggleSeniorMode, setIsSeniorMode } = useSeniorMode();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useNotifications();

  const [agentMode, setAgentMode] = useState('controller'); // 'controller' | 'chatbot'
  const [activeActionInfo, setActiveActionInfo] = useState(null); // { type, description, timestamp }
  const [pendingAction, setPendingAction] = useState(null); // { type, target, params, prompt, onExecute }
  const pendingActionRef = React.useRef(pendingAction);
  const [highlightSelector, setHighlightSelector] = useState(null);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  // Auto-clear active action info banner after 4 seconds
  useEffect(() => {
    if (activeActionInfo) {
      const timer = setTimeout(() => {
        setActiveActionInfo(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeActionInfo]);

  // Execute an action issued by AI Voice Co-Pilot
  const executeAction = useCallback(async (actionPayload, customCallback = null) => {
    if (!actionPayload || !actionPayload.type || actionPayload.type === 'NONE') return;

    const { type, target, params = {}, requires_confirmation = false, confirmation_prompt = null } = actionPayload;

    // 1. Order Placement Action
    if (type === 'PLACE_ORDER') {
      const itemId = params.item_id || params.product_id || params.id || (target && target.match(/\/products\/(\d+)/)?.[1]);
      const itemTitle = params.title;

      // Guard against missing, undefined, or empty product context
      if (!itemId || !itemTitle || String(itemTitle).toLowerCase() === 'undefined' || String(itemTitle).toLowerCase() === 'null') {
        showToast('Please select a correct order/product first.', 'info');
        setActiveActionInfo({
          type: 'SELECT_REQUIRED',
          description: 'Please select a correct order or product first.',
        });
        navigate('/products');
        return;
      }

      const orderAction = async () => {
        try {
          await createOrder({
            product: parseInt(itemId, 10),
            quantity: params.quantity || 1,
            message: params.message || 'Ordered via SilverHands AI Co-Pilot',
          });
          showToast(`Order for "${itemTitle}" placed successfully!`, 'success');
          setActiveActionInfo({
            type: 'ORDER_SUCCESS',
            description: `Order placed for 1x ${itemTitle}`,
          });
          navigate('/orders');
        } catch (err) {
          const errDetail = err.response?.data?.error || err.response?.data?.detail || 'Unable to place order. Redirecting to product page...';
          showToast(errDetail, 'info');
          if (target) navigate(target);
        }
      };

      if (requires_confirmation) {
        setPendingAction({
          type: 'PLACE_ORDER',
          target,
          params,
          prompt: confirmation_prompt || `Confirm order for 1x ${itemTitle}? Say YES or click Confirm.`,
          onExecute: orderAction,
        });
        setActiveActionInfo({
          type: 'CONFIRM_REQUIRED',
          description: `Confirm order for: ${itemTitle}`,
        });
        return;
      } else {
        await orderAction();
        return;
      }
    }

    // 2. Service Booking Action
    if (type === 'BOOK_SERVICE') {
      const serviceId = params.item_id || params.service_id || params.id || (target && target.match(/\/services\/(\d+)/)?.[1]);
      const serviceTitle = params.title;

      // Guard against missing, undefined, or empty service context
      if (!serviceId || !serviceTitle || String(serviceTitle).toLowerCase() === 'undefined' || String(serviceTitle).toLowerCase() === 'null') {
        showToast('Please select a correct service first.', 'info');
        setActiveActionInfo({
          type: 'SELECT_REQUIRED',
          description: 'Please select a correct service first.',
        });
        navigate('/services');
        return;
      }
      const bookingAction = async () => {
        if (!serviceId) {
          if (target) navigate(target);
          return;
        }
        try {
          await createBooking({
            service: parseInt(serviceId, 10),
            booking_date: params.date || 'Tomorrow',
            booking_time: params.time || '10:00 AM',
            hours: params.hours || 2,
            notes: 'Booked via SilverHands AI Co-Pilot',
          });
          showToast(`Booking for "${serviceTitle}" requested successfully!`, 'success');
          setActiveActionInfo({
            type: 'BOOKING_SUCCESS',
            description: `Booking confirmed for ${serviceTitle}`,
          });
          navigate('/bookings');
        } catch (err) {
          const errDetail = err.response?.data?.error || 'Redirecting to booking details...';
          showToast(errDetail, 'info');
          if (target) navigate(target);
        }
      };

      if (requires_confirmation) {
        setPendingAction({
          type: 'BOOK_SERVICE',
          target,
          params,
          prompt: confirmation_prompt || `Confirm booking for ${serviceTitle}? Say YES or click Confirm.`,
          onExecute: bookingAction,
        });
        setActiveActionInfo({
          type: 'CONFIRM_REQUIRED',
          description: `Confirm booking for: ${serviceTitle}`,
        });
        return;
      } else {
        await bookingAction();
        return;
      }
    }

    // 3. Cancel Booking / Order Transaction
    if (type === 'CANCEL_TRANSACTION') {
      const itemId = params.item_id || params.booking_id || params.order_id || params.id;
      const tType = params.transaction_type || (params.booking_id || location.pathname.includes('/bookings') ? 'booking' : 'order');
      const itemTitle = params.title || (tType === 'booking' ? `Booking #${itemId}` : `Order #${itemId}`);
      
      const cancelExec = async () => {
        try {
          if (tType === 'booking') {
            await cancelBooking(itemId);
            showToast(`Booking #${itemId} (${itemTitle}) cancelled successfully.`, 'info');
          } else {
            await cancelOrder(itemId);
            showToast(`Order #${itemId} (${itemTitle}) cancelled and stock restocked.`, 'info');
          }
          window.dispatchEvent(new CustomEvent('sh-reload-data'));
          setActiveActionInfo({
            type: 'CANCELLED_SUCCESS',
            description: `Cancelled ${tType} #${itemId}`,
          });
        } catch (err) {
          const msg = err.response?.data?.error || err.response?.data?.detail || 'Cancellation could not be completed.';
          showToast(msg, 'error');
        }
      };

      if (requires_confirmation) {
        setPendingAction({
          type: 'CANCEL_TRANSACTION',
          target,
          params,
          prompt: confirmation_prompt || `Are you sure you want to cancel ${tType} #${itemId} (${itemTitle})? Say YES or click Confirm.`,
          onExecute: cancelExec,
        });
        setActiveActionInfo({
          type: 'CONFIRM_REQUIRED',
          description: `Confirm cancellation for ${itemTitle}`,
        });
        return;
      } else {
        await cancelExec();
        return;
      }
    }

    // 4. Submit Review Action
    if (type === 'SUBMIT_REVIEW') {
      const rating = params.rating || 5;
      const comment = params.comment || 'Reviewed via SilverHands Voice AI Co-Pilot';
      const itemTitle = params.title || 'Service / Product';

      const reviewExec = async () => {
        try {
          const payload = {
            rating,
            comment,
          };
          if (params.booking_id) payload.booking = parseInt(params.booking_id, 10);
          else if (params.item_type === 'booking' && params.item_id) payload.booking = parseInt(params.item_id, 10);

          if (params.order_id) payload.order = parseInt(params.order_id, 10);
          else if (params.item_type === 'order' && params.item_id) payload.order = parseInt(params.item_id, 10);

          if (params.service_id) payload.service = parseInt(params.service_id, 10);
          else if (params.item_type === 'service' && params.item_id) payload.service = parseInt(params.item_id, 10);

          if (params.product_id) payload.product = parseInt(params.product_id, 10);
          else if (params.item_type === 'product' && params.item_id) payload.product = parseInt(params.item_id, 10);

          if (params.provider_id) payload.provider = parseInt(params.provider_id, 10);

          await createReview(payload);
          window.dispatchEvent(new CustomEvent('sh-reload-data'));
          showToast(`Review submitted (${rating}★). Thank you for supporting our elders!`, 'success');
          setActiveActionInfo({
            type: 'REVIEW_SUCCESS',
            description: `Submitted ${rating}★ review for ${itemTitle}`,
          });
        } catch (err) {
          const msg = err.response?.data?.detail || err.response?.data?.error || 'Unable to submit review.';
          showToast(msg, 'error');
        }
      };

      if (requires_confirmation) {
        setPendingAction({
          type: 'SUBMIT_REVIEW',
          target,
          params,
          prompt: confirmation_prompt || `Confirm submitting ${rating}★ review for ${itemTitle}? Say YES or click Confirm.`,
          onExecute: reviewExec,
        });
        setActiveActionInfo({
          type: 'CONFIRM_REQUIRED',
          description: `Confirm ${rating}★ review for ${itemTitle}`,
        });
        return;
      } else {
        await reviewExec();
        return;
      }
    }

    // 5. Generic Guarded Actions requiring confirmation
    if (requires_confirmation) {
      setPendingAction({
        type,
        target,
        params,
        prompt: confirmation_prompt || 'Would you like me to confirm this action? Say YES or click Confirm.',
        onExecute: customCallback,
      });
      setActiveActionInfo({
        type: 'CONFIRM_REQUIRED',
        description: confirmation_prompt || 'Awaiting your confirmation to proceed.',
      });
      return;
    }

    // 6. Safe Autonomous Controller Actions
    switch (type) {
      case 'SELECT_ITEM': {
        const dest = target || params.route || (params.item_id ? `/products/${params.item_id}` : '/products');
        setActiveActionInfo({
          type: 'SELECT_ITEM',
          description: `Opening #${params.index || ''} ${params.title || ''}`,
        });
        navigate(dest);
        break;
      }

      case 'NAVIGATE': {
        const dest = target || params.route || '/';
        setActiveActionInfo({
          type: 'NAVIGATE',
          description: `Navigating to ${dest}`,
        });
        navigate(dest);
        break;
      }

      case 'SWITCH_TAB': {
        const targetPage = params.page || (location.pathname.includes('/orders') ? 'orders' : 'bookings');
        const tabName = (params.tab || 'ALL').toUpperCase();
        const dest = target || `/${targetPage}?tab=${tabName}`;
        setActiveActionInfo({
          type: 'SWITCH_TAB',
          description: `Switched to ${tabName} in ${targetPage}`,
        });
        navigate(dest);
        break;
      }

      case 'SEARCH':
      case 'FILTER': {
        const query = params.query || params.search || '';
        const cat = params.category || '';
        const minPrice = params.min_price || params.minPrice || '';
        const maxPrice = params.max_price || params.maxPrice || '';
        const ordering = params.ordering || '';

        // If target was already formatted with URL parameters, use target
        if (target && target.includes('?')) {
          setActiveActionInfo({
            type: 'FILTER',
            description: `Filtering ${query || cat || 'items'}`,
          });
          navigate(target);
          break;
        }

        // Determine base destination page
        let basePage = target || params.route;
        if (!basePage) {
          const lowerQuery = (query + ' ' + cat).toLowerCase();
          if (
            params.target_page === 'products' ||
            params.item_type === 'product' ||
            /pickle|murukku|snack|compost|biscuit|bag|sweet|food|product|item|good|delicacy|handmade/.test(lowerQuery)
          ) {
            basePage = '/products';
          } else if (
            params.target_page === 'providers' ||
            params.item_type === 'provider' ||
            /provider|artisan|homemaker|cook|elder|person|profile/.test(lowerQuery)
          ) {
            basePage = '/providers';
          } else if (location.pathname.includes('/products')) {
            basePage = '/products';
          } else if (location.pathname.includes('/providers')) {
            basePage = '/providers';
          } else {
            basePage = '/services';
          }
        }

        const sp = new URLSearchParams();
        if (query) sp.set('search', query);
        if (cat) sp.set('category', cat);
        if (minPrice) sp.set('min_price', minPrice);
        if (maxPrice) sp.set('max_price', maxPrice);
        if (ordering) sp.set('ordering', ordering);

        const dest = sp.toString() ? `${basePage}?${sp.toString()}` : basePage;
        const filterDescParts = [];
        if (query) filterDescParts.push(`"${query}"`);
        if (cat) filterDescParts.push(`category: ${cat}`);
        if (minPrice && maxPrice) filterDescParts.push(`₹${minPrice} - ₹${maxPrice}`);
        else if (minPrice) filterDescParts.push(`above ₹${minPrice}`);
        else if (maxPrice) filterDescParts.push(`under ₹${maxPrice}`);

        setActiveActionInfo({
          type: 'FILTER',
          description: `Filtered for ${filterDescParts.join(', ') || 'all items'}`,
        });
        navigate(dest);
        break;
      }

      case 'TOGGLE_SENIOR_MODE': {
        if (params.senior_mode !== undefined && params.senior_mode !== null) {
          if (setIsSeniorMode) setIsSeniorMode(Boolean(params.senior_mode));
        } else {
          toggleSeniorMode();
        }
        setActiveActionInfo({
          type: 'SENIOR_MODE',
          description: isSeniorMode ? 'Disabled Senior Accessibility Mode' : 'Enabled Senior Mode (Large Text & High Contrast)',
        });
        showToast(
          isSeniorMode ? 'Senior Mode deactivated' : 'Senior Accessibility Mode activated (Large Text)',
          'info'
        );
        break;
      }

      case 'SET_LANGUAGE': {
        const targetLang = params.language_code || 'en';
        setLanguage(targetLang);
        setActiveActionInfo({
          type: 'LANGUAGE',
          description: `Switched language to ${targetLang.toUpperCase()}`,
        });
        break;
      }

      case 'SCROLL_PAGE': {
        const dir = (params.scroll_direction || 'down').toLowerCase();
        if (dir === 'top' || dir === 'start' || dir === 'beginning') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (dir === 'bottom' || dir === 'end') {
          window.scrollTo({ top: document.body.scrollHeight || 10000, behavior: 'smooth' });
        } else {
          const delta = dir === 'up' ? -500 : 500;
          window.scrollBy({ top: delta, behavior: 'smooth' });
        }
        setActiveActionInfo({
          type: 'SCROLL',
          description: `Scrolled page ${dir}`,
        });
        break;
      }

      case 'CLICK_ELEMENT': {
        const selector = params.selector || target;
        if (selector) {
          const el = document.querySelector(selector);
          if (el) el.click();
        }
        break;
      }

      case 'CONFIRM_TRANSACTION': {
        if (pendingAction) {
          if (typeof pendingAction.onExecute === 'function') {
            await pendingAction.onExecute();
          }
          showToast('Voice confirmation received. Action executed!', 'success');
          setActiveActionInfo({
            type: 'SUCCESS',
            description: 'Confirmed and executed successfully.',
          });
          setPendingAction(null);
        }
        break;
      }

      case 'READ_SCREEN':
      case 'READ_PAGE': {
        setActiveActionInfo({
          type: 'READING',
          description: 'Summarizing active page items',
        });
        break;
      }

      case 'READ_REVIEWS': {
        setActiveActionInfo({
          type: 'READING_REVIEWS',
          description: `Reading ${params.count || ''} customer reviews aloud`,
        });
        break;
      }

      default:
        console.log('Unhandled Controller action:', actionPayload);
    }
  }, [navigate, location, isSeniorMode, toggleSeniorMode, setIsSeniorMode, setLanguage, showToast, pendingAction]);

  const confirmPendingAction = useCallback(async () => {
    const actionToExec = pendingActionRef.current || pendingAction;
    if (actionToExec) {
      if (typeof actionToExec.onExecute === 'function') {
        await actionToExec.onExecute();
      }
      showToast('Action confirmed and executed!', 'success');
      setActiveActionInfo({
        type: 'SUCCESS',
        description: 'Confirmed successfully.',
      });
      setPendingAction(null);
      pendingActionRef.current = null;
    }
  }, [pendingAction, showToast]);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
    pendingActionRef.current = null;
    setActiveActionInfo({
      type: 'CANCELLED',
      description: 'Action cancelled.',
    });
    showToast('Cancelled', 'info');
  }, [showToast]);

  return (
    <VoiceAgentContext.Provider
      value={{
        agentMode,
        setAgentMode,
        activeActionInfo,
        pendingAction,
        setPendingAction,
        executeAction,
        confirmPendingAction,
        cancelPendingAction,
        highlightSelector,
        setHighlightSelector,
      }}
    >
      {children}
    </VoiceAgentContext.Provider>
  );
};

export const useVoiceAgent = () => useContext(VoiceAgentContext);
