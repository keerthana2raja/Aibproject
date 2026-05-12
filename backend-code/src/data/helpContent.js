/**
 * Help Centre copy served via GET /v1/help (no client bundle hardcoding).
 * Edit here or move to CMS/DB later.
 */
module.exports = {
  subtitle:
    'Search uses the live registry API. Frequently asked topics and shortcuts are curated here.',
  resourceTiles: [
    { icon: 'book', title: 'Getting started', subtitle: 'Submit an accelerator, track pipeline reviews' },
    { icon: 'video', title: 'Walkthroughs', subtitle: 'Use Catalog + Family detail from live data' },
    {
      icon: 'terminal',
      title: 'API reference',
      subtitle: 'Open Swagger from your deployment',
      action: 'swagger',
    },
    { icon: 'message', title: 'Support', subtitle: 'Reach your InfoVision programme lead' },
  ],
  contact: {
    title: 'Contact',
    description:
      'Shortcuts below are illustrative until your programme wires a ticketing URL or mailbox.',
    buttons: [
      { icon: 'message', label: 'Chat', variant: 'secondary' },
      { icon: 'mail', label: 'Email', variant: 'primary' },
    ],
  },
  faqs: [
    {
      question: 'How do I submit a new accelerator?',
      answer:
        'Use Submit asset in the navigation. The record is stored via POST /v1/submissions and appears in the approval pipeline.',
    },
    {
      question: 'What does Request access do on an asset?',
      answer:
        'It posts an activity entry (POST /v1/activity) so operators can correlate access interest with Catalog usage.',
    },
    {
      question: 'Where does Catalog maturity come from?',
      answer:
        'Maturity values are loaded from GET /v1/catalog/masters (linked to SQLite catalog_master_* tables in local dev).',
    },
    {
      question: 'How long does approval take?',
      answer:
        'Timing depends on your governance queue. Pending counts come from dashboard API metrics tied to registrations.',
    },
  ],
};
