/* Client Portal settings. Edit this file, nothing else is needed for setup.
   The anon key below is PUBLIC by design (it is protected by the database rules in schema.sql).
   NEVER put the "service_role" key here. */
window.PORTAL_CONFIG = {
  // 'demo'     = sample data in the browser, no backend (for previewing the portal)
  // 'supabase' = real logins and data (set the two values below first)
  MODE: 'demo',
  SUPABASE_URL: 'https://YOUR-PROJECT-ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',

  CURRENCY: 'KES',
  BUSINESS: {
    name: 'Pinchez Media 254',
    owner: 'Peter Baraka Philip',
    email: 'sirpeterbaraka@gmail.com',
    phone: '+254 115 865 866',
    whatsapp: '254115865866',
    site: 'pinchezmedia254.netlify.app',
    location: 'Thika, Kenya'
  },
  // Shown to clients under "How to pay". Replace the [brackets].
  PAYMENT: {
    mpesa: '[M-Pesa Paybill / Till number and account]',
    bank: '[Bank, branch, account name and number]',
    paypal: '[PayPal email or link]'
  },
  VAT_RATE: 0.16,
  OFFER_DISCOUNT: 0.05,
  // Rate card (used in the admin invoice builder and the "Request a service" panel)
  SERVICES: [
    { name: 'Logo Design', cat: 'Design Services', price: 200 },
    { name: 'Business Card Design', cat: 'Design Services', price: 200 },
    { name: 'Brochure Design', cat: 'Design Services', price: 300 },
    { name: 'Website Design', cat: 'Design Services', price: 1000 },
    { name: 'Website Development', cat: 'E-commerce Development Services', price: 25000 },
    { name: 'Point-of-Sale Development', cat: 'E-commerce Development Services', price: 10000 },
    { name: 'PC App Development', cat: 'E-commerce Development Services', price: 10000 },
    { name: 'Social Media Management', cat: 'Marketing Services', price: 2000 },
    { name: 'SEO Services', cat: 'Marketing Services', price: 500 },
    { name: 'Content Creation', cat: 'Marketing Services', price: 1000 },
    { name: 'Google Business Profile Setup', cat: 'Marketing Services', price: 500 },
    { name: 'Frontend Website', cat: 'Website Development', price: 10000 },
    { name: 'Responsive 3D Frontend', cat: 'Website Development', price: 15000 },
    { name: 'Full Stack Website + Hosting', cat: 'Website Development', price: 25000 }
  ]
};
