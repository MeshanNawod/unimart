/* UniMart – settings.
   1. Paste your Firebase web app keys below (Firebase console → Project settings → Your apps).
      These keys are NOT secret; the security comes from firestore.rules.
   2. Leave apiKey empty to run in DEMO mode (everything is saved only in this browser).
   See SETUP.md for the full step-by-step guide. */
window.UM_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  },

  /* Only allow sign-up with these email endings, e.g. ["ac.lk", "sliit.lk"].
     Empty = anyone. (Checked in the app; for hard enforcement also edit firestore.rules.) */
  allowedEmailDomains: [],

  /* Password for the admin page in DEMO mode only. With Firebase, admins are set in the
     Firebase console (collection "admins"), see ADMINS section in SETUP.md. */
  demoAdminPassword: "demo",

  siteName: "UniMart",
  currency: "Rs"
};
