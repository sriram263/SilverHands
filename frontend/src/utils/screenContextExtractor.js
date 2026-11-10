/**
 * Real-Time Screen Context Extractor for SilverHands Autonomous Controller AI
 * Extracts visible DOM elements, cards, products, services, modals, form inputs,
 * and assigns 1-indexed relative positions (#1, #2, #3...) for contextual resolution.
 */

export const extractScreenContext = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      path: '/',
      title: 'SilverHands',
      visible_items: [],
      active_modal: null,
      headings: [],
    };
  }

  const path = window.location.pathname;
  const search = window.location.search;
  const title = document.title || 'SilverHands Platform';

  // 1. Extract Headings
  const headings = Array.from(document.querySelectorAll('h1, h2'))
    .map((h) => h.innerText.trim())
    .filter(Boolean)
    .slice(0, 5);

  // 2. Extract Visible Interactive Cards / Elements
  const visible_items = [];

  // Scan Product Cards & Links
  const cards = document.querySelectorAll('a[href*="/products/"], a[href*="/services/"], a[href*="/providers/"], .card-surface');
  let itemCounter = 1;
  const seenKeys = new Set();

  cards.forEach((card) => {
    const productLink = card.tagName === 'A' && card.href.includes('/products/')
      ? card
      : card.querySelector?.('a[href*="/products/"]');

    const serviceLink = card.tagName === 'A' && card.href.includes('/services/')
      ? card
      : card.querySelector?.('a[href*="/services/"]');

    const providerLink = card.tagName === 'A' && card.href.includes('/providers/')
      ? card
      : card.querySelector?.('a[href*="/providers/"]');

    if (productLink) {
      const href = productLink.getAttribute('href') || '';
      const match = href.match(/\/products\/(\d+)/);
      const prodId = match ? parseInt(match[1], 10) : null;
      const titleElem = card.querySelector?.('h1, h2, h3, .font-heading') || productLink;
      const titleText = titleElem?.innerText?.trim() || 'Handmade Product';
      const priceElem = card.querySelector?.('.text-xl, .font-black, [class*="price"]');
      const priceText = priceElem?.innerText?.trim() || '';

      const key = `product-${prodId || titleText}`;
      if (!seenKeys.has(key) && titleText && prodId) {
        seenKeys.add(key);
        visible_items.push({
          index: itemCounter++,
          type: 'product',
          id: prodId,
          title: titleText,
          price: priceText,
          route: `/products/${prodId}`,
          has_order_btn: Boolean(card.querySelector?.('button, .btn-secondary, [class*="order"]')),
        });
      }
    } else if (serviceLink) {
      const href = serviceLink.getAttribute('href') || '';
      const match = href.match(/\/services\/(\d+)/);
      const servId = match ? parseInt(match[1], 10) : null;
      const titleElem = card.querySelector?.('h1, h2, h3, .font-heading') || serviceLink;
      const titleText = titleElem?.innerText?.trim() || 'Elder Service';
      const priceElem = card.querySelector?.('.text-xl, .font-black, [class*="price"]');
      const priceText = priceElem?.innerText?.trim() || '';

      const key = `service-${servId || titleText}`;
      if (!seenKeys.has(key) && titleText && servId) {
        seenKeys.add(key);
        visible_items.push({
          index: itemCounter++,
          type: 'service',
          id: servId,
          title: titleText,
          price: priceText,
          route: `/services/${servId}`,
          has_book_btn: Boolean(card.querySelector?.('button, .btn-primary, [class*="book"]')),
        });
      }
    } else if (providerLink) {
      const href = providerLink.getAttribute('href') || '';
      const match = href.match(/\/providers\/(\d+)/);
      const provId = match ? parseInt(match[1], 10) : null;
      const titleElem = card.querySelector?.('h1, h2, h3, .font-heading') || providerLink;
      const titleText = titleElem?.innerText?.trim() || 'Artisan Provider';

      const key = `provider-${provId || titleText}`;
      if (!seenKeys.has(key) && titleText && provId) {
        seenKeys.add(key);
        visible_items.push({
          index: itemCounter++,
          type: 'provider',
          id: provId,
          title: titleText,
          price: '',
          route: `/providers/${provId}`,
        });
      }
    } else if (card.hasAttribute('data-booking-id')) {
      const bookId = parseInt(card.getAttribute('data-booking-id'), 10);
      const title = card.getAttribute('data-item-title') || card.querySelector('h3')?.innerText?.trim() || 'Service Booking';
      const status = card.getAttribute('data-item-status') || '';
      const priceElem = card.querySelector('.font-black, [class*="price"]');
      const priceText = priceElem?.innerText?.trim() || '';

      const key = `booking-${bookId}`;
      if (!seenKeys.has(key) && bookId) {
        seenKeys.add(key);
        visible_items.push({
          index: itemCounter++,
          type: 'booking',
          id: bookId,
          title,
          status,
          price: priceText,
          route: '/bookings',
          can_cancel: status !== 'CANCELLED' && status !== 'COMPLETED',
          can_review: status === 'COMPLETED'
        });
      }
    } else if (card.hasAttribute('data-order-id')) {
      const ordId = parseInt(card.getAttribute('data-order-id'), 10);
      const title = card.getAttribute('data-item-title') || card.querySelector('h3')?.innerText?.trim() || 'Product Order';
      const status = card.getAttribute('data-item-status') || '';
      const priceElem = card.querySelector('.font-black, [class*="price"]');
      const priceText = priceElem?.innerText?.trim() || '';

      const key = `order-${ordId}`;
      if (!seenKeys.has(key) && ordId) {
        seenKeys.add(key);
        visible_items.push({
          index: itemCounter++,
          type: 'order',
          id: ordId,
          title,
          status,
          price: priceText,
          route: '/orders',
          can_cancel: status !== 'CANCELLED' && status !== 'DELIVERED',
          can_review: status !== 'CANCELLED'
        });
      }
    }
  });

  // Extract Reviews list from detail pages
  const reviewElements = Array.from(document.querySelectorAll('.p-4.bg-cream-50, [class*="review"]'))
    .slice(0, 5)
    .map((el) => {
      const author = el.querySelector('.font-bold')?.innerText?.trim();
      const text = el.querySelector('p')?.innerText?.trim();
      return author && text ? `${author}: "${text}"` : null;
    })
    .filter(Boolean);

  // If on a Product Detail Page (`/products/:id`)
  const productDetailMatch = path.match(/\/products\/(\d+)/);
  let activeProductDetail = null;
  if (productDetailMatch) {
    const prodId = parseInt(productDetailMatch[1], 10);
    const h1 = document.querySelector('h1')?.innerText?.trim() || '';
    const priceText = document.querySelector('.text-4xl, [class*="price"]')?.innerText?.trim() || '';
    const ratingText = document.querySelector('.bg-amber-50, [class*="rating"]')?.innerText?.trim() || '';
    activeProductDetail = {
      id: prodId,
      title: h1,
      price: priceText,
      rating: ratingText,
      reviews: reviewElements,
      is_detail_page: true,
    };
  }

  // If on a Service Detail Page (`/services/:id`)
  const serviceDetailMatch = path.match(/\/services\/(\d+)/);
  let activeServiceDetail = null;
  if (serviceDetailMatch) {
    const servId = parseInt(serviceDetailMatch[1], 10);
    const h1 = document.querySelector('h1')?.innerText?.trim() || '';
    const priceText = document.querySelector('.text-4xl, [class*="price"]')?.innerText?.trim() || '';
    const ratingText = document.querySelector('.bg-amber-50, [class*="rating"]')?.innerText?.trim() || '';
    activeServiceDetail = {
      id: servId,
      title: h1,
      price: priceText,
      rating: ratingText,
      reviews: reviewElements,
      is_detail_page: true,
    };
  }

  // 3. Detect Active Modal Context
  let active_modal = null;
  const modalElem = document.querySelector('.fixed.inset-0, [role="dialog"]');
  if (modalElem) {
    const modalHeading = modalElem.querySelector('h2, h3, .font-heading')?.innerText?.trim() || '';
    const isOrder = modalHeading.toLowerCase().includes('order') || modalElem.innerText.toLowerCase().includes('order');
    const isBooking = modalHeading.toLowerCase().includes('book') || modalElem.innerText.toLowerCase().includes('booking');
    const isReview = modalHeading.toLowerCase().includes('review') || modalElem.innerText.toLowerCase().includes('feedback');
    
    active_modal = {
      open: true,
      type: isReview ? 'REVIEW_MODAL' : isOrder ? 'ORDER_MODAL' : isBooking ? 'BOOKING_MODAL' : 'GENERIC_MODAL',
      title: modalHeading,
    };
  }

  // 4. Extract Key Buttons / Action Triggers
  const actionable_buttons = Array.from(document.querySelectorAll('button:not([disabled])'))
    .map((b) => b.innerText.trim())
    .filter((t) => t.length > 2 && t.length < 30)
    .slice(0, 10);

  return {
    path,
    search,
    title,
    headings,
    visible_items: visible_items.slice(0, 12),
    total_visible_items: visible_items.length,
    active_product_detail: activeProductDetail,
    active_service_detail: activeServiceDetail,
    active_modal,
    actionable_buttons,
    reviews: reviewElements,
    timestamp: Date.now(),
  };
};
