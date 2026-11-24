/* UniMart – settings.
   1. Paste your Firebase web app keys below (Firebase console → Project settings → Your apps).
      These keys are NOT secret; the security comes from firestore.rules.
   2. Leave apiKey empty to run in DEMO mode (everything is saved only in this browser).
   See SETUP.md for the full step-by-step guide. */
window.UM_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCw7HXpNn8JyFaMqlBPcem9tr1ogmA_SsU",
    authDomain: "unimart-77eca.firebaseapp.com",
    projectId: "unimart-77eca",
    appId: "1:438907826752:web:efbe39903705aa44afa5a5"
  },

  /* Only allow sign-up with these email endings, e.g. ["ac.lk", "sliit.lk"].
     Empty = anyone. (Checked in the app; for hard enforcement also edit firestore.rules.) */
  allowedEmailDomains: [],

  /* Password for the admin page in DEMO mode only. With Firebase, admins are set in the
     Firebase console (collection "admins"), see ADMINS section in SETUP.md. */
  demoAdminPassword: "demo",

  /* Payments. Cash and bank transfer always work (buyer pays the seller directly).
     Online card / eZ Cash / mCash / Genie payments go through PayHere (payhere.lk) and need the
     Cloud Function in functions/ deployed first; then set online: true. See PAYMENTS.md. */
  payments: {
    online: false,
    functionsRegion: "asia-south1"
  },

  siteName: "UniMart",
  currency: "Rs"
};
