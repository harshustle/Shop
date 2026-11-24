import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'freshcart_route_scroll_positions';

const readPositions = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
};

const writePosition = (key, value) => {
  try {
    const positions = readPositions();
    positions[key] = value;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {}
};

const jumpTo = (top) => {
  const root = document.documentElement;
  const body = document.body;
  const rootBehavior = root.style.getPropertyValue('scroll-behavior');
  const rootPriority = root.style.getPropertyPriority('scroll-behavior');
  const bodyBehavior = body.style.getPropertyValue('scroll-behavior');
  const bodyPriority = body.style.getPropertyPriority('scroll-behavior');
  root.style.setProperty('scroll-behavior', 'auto', 'important');
  body.style.setProperty('scroll-behavior', 'auto', 'important');
  window.scrollTo(0, top);
  if (rootBehavior) root.style.setProperty('scroll-behavior', rootBehavior, rootPriority);
  else root.style.removeProperty('scroll-behavior');
  if (bodyBehavior) body.style.setProperty('scroll-behavior', bodyBehavior, bodyPriority);
  else body.style.removeProperty('scroll-behavior');
};

const ScrollStateManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const key = location.key || `${location.pathname}${location.search}`;
    const savedY = Number(readPositions()[key] || 0);
    const timers = [];

    if (navigationType === 'POP') {
      [0, 100, 400, 900, 1600].forEach((delay) => {
        timers.push(window.setTimeout(() => jumpTo(savedY), delay));
      });
    } else {
      jumpTo(0);
    }

    let frame = null;
    let lastKnownY = window.scrollY;
    let pendingNavigationY = null;
    let pendingNavigationTimer = null;
    const remember = () => {
      if (pendingNavigationY !== null) return;
      lastKnownY = window.scrollY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        writePosition(key, lastKnownY);
        frame = null;
      });
    };
    const rememberBeforeNavigation = () => {
      lastKnownY = window.scrollY;
      pendingNavigationY = lastKnownY;
      writePosition(key, lastKnownY);
      window.clearTimeout(pendingNavigationTimer);
      pendingNavigationTimer = window.setTimeout(() => {
        pendingNavigationY = null;
        lastKnownY = window.scrollY;
      }, 750);
    };
    window.addEventListener('scroll', remember, { passive: true });
    document.addEventListener('pointerdown', rememberBeforeNavigation, true);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('scroll', remember);
      document.removeEventListener('pointerdown', rememberBeforeNavigation, true);
      window.clearTimeout(pendingNavigationTimer);
      if (frame) window.cancelAnimationFrame(frame);
      writePosition(key, pendingNavigationY ?? lastKnownY);
    };
  }, [location.key, location.pathname, location.search, navigationType]);

  return null;
};

export default ScrollStateManager;
