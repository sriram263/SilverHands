import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically resets the window and document scroll position to the very top (0, 0)
 * whenever a new route or page is opened.
 */
export const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable browser's default scroll restoration to ensure fresh view from top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // If there's an anchor hash (e.g. #section), attempt to scroll to that element
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Reset scroll positions across window and root document elements
    const resetScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    // Immediate synchronous reset
    resetScroll();

    // Frame and tick resets to handle asynchronous React component mount and layout renders
    const frameId = requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 20);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
