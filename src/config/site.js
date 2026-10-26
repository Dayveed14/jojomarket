// Public site settings. Override per environment with VITE_* variables (see .env.example).
export const SITE = {
  name: 'Jojo Market',
  url: (import.meta.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  city: import.meta.env.VITE_SERVICE_CITY || 'Lagos',
  tagline: 'Your trusted market shopper',
  description:
    'Jojo Market buys foodstuff, fabric, plastics and household goods for you from Lagos markets like Mile 12, Balogun and Idumota — with honest estimates, itemised receipts and no surprise spending.',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'hello@jojomarket.ng',
  ogImage: '/brand/og-image.jpg',
};

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
