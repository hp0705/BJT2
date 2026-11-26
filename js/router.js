// Simple hash router
export function parseHash() {
  const raw = (window.location.hash || '#/home').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  return {
    route: parts[0] || 'home',
    param1: parts[1] || '',
    param2: parts[2] || ''
  };
}

export function navigate(hash) {
  window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
}
