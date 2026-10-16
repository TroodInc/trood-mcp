// Generated from api/src/catalog/packs.ts by mcp/scripts/sync-packs.mjs. Do not edit: change the API file and run the sync.
/**
 * Industry packs: what the door can offer straight away, per industry. A
 * paragraph that matches a pack gets its fixed questions, its "What do you run
 * on?" slots and priced options, with no model call. Anything unmatched goes to
 * Claude (src/ai/scope.ts).
 *
 * This file has no imports on purpose: the Trood MCP keeps a generated copy
 * (mcp/src/packs.generated.ts, written by mcp/scripts/sync-packs.mjs) and its
 * check fails when the two differ. Edit it here, then run the sync.
 *
 * How to add a pack: trood-brain products/trood-platform-screens.md, "Industry packs".
 */
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface Option {
  /** Unique across all packs: prefixed with the pack (rst_orders). Hotels keep their first, unprefixed ids. */
  id: string;
  /** What they get, in their words, under 70 characters. */
  title: string;
  /** One or two sentences on what changes for them. */
  description: string;
  /** Where it runs: slot labels. */
  uses: string[];
  /** Engine's sizes (src/ai/scope.ts SIZE_DEFINITIONS); the price comes from the rate card. */
  size: Size;
  /** Words in what they wrote that point at this option. */
  signals: RegExp;
  /** Slot ids it relies on: the reason reads "You use <their tools>". */
  relies: string[];
  /** The problems it answers, for a provider's brief (Trood MCP). */
  answers?: string[];
}

export interface Slot {
  id: string;
  label: string;
  choices: string[];
  multiple: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  choices: string[];
}

export interface Industry {
  id: string;
  /** How a provider sees it in the picker. */
  label: string;
  /** Words that say what the business is. Packs are checked in order: specific ones first. */
  matches: RegExp;
  /** Weaker words, checked only after no pack matched. */
  fallback?: RegExp;
  slots: Slot[];
  questions: Question[];
  options: Option[];
}

type PackOption = Omit<Option, 'uses'> & { uses?: string[] };

/** Fills each option's uses from the labels of the slots it relies on. */
function pack(p: Omit<Industry, 'options'> & { options: PackOption[] }): Industry {
  const label = (id: string) => p.slots.find((s) => s.id === id)?.label ?? id;
  return { ...p, options: p.options.map((o) => ({ ...o, uses: o.uses ?? o.relies.map(label) })) };
}

const REVIEWS = /\breviews?\b|\bgoogle (maps|rating)\b/i;

export const RECRUITMENT = pack({
  id: 'recruitment',
  label: 'Recruitment agencies',
  matches: /\b(recruitment (agency|agencies|firm|company|business|consultan\w*)|recruiters?|staffing (agency|agencies|company|firm)|headhunt\w*|talent agenc(y|ies)|executive search|candidates?|job placements?|placement agenc(y|ies))\b/i,
  slots: [
    { id: 'ats', label: 'Applicant tracking', choices: ['Bullhorn', 'Recruit CRM', 'Manatal', 'JobAdder'], multiple: false },
    { id: 'boards', label: 'Job boards', choices: ['LinkedIn', 'Indeed', 'JobStreet'], multiple: true },
  ],
  questions: [
    { id: 'roles', prompt: 'How many open roles right now?', choices: ['Under 10', '10 to 50', 'Over 50'] },
    { id: 'cvs', prompt: 'How many CVs come in per role?', choices: ['Under 20', '20 to 100', 'Over 100'] },
  ],
  options: [
    { id: 'rec_screen', title: 'CVs screened and a shortlist ready each morning', description: 'Every new CV is read against the role and scored. You start the day with a shortlist and the reasons for each name.', relies: ['ats', 'boards'], size: 'M', signals: /\b(cvs?|resumes?|screen\w*|shortlist\w*|applicants?|applications?)\b/i },
    { id: 'rec_int', title: 'Interviews scheduled without the email chain', description: 'Candidates pick a time that suits the client from a link. The invite and reminder go out on their own.', relies: ['ats'], size: 'S', signals: /\b(interviews?|schedul\w*|calendars?)\b/i },
    { id: 'rec_update', title: 'Every candidate kept up to date', description: 'When a candidate moves stage in your system, they get a short note. Nobody is left waiting without an answer.', relies: ['ats'], size: 'S', signals: /\b(updates?|ghost\w*|follow[- ]?ups?|feedback)\b/i },
    { id: 'rec_post', title: 'One job post on every board', description: 'Write the role once and it goes to LinkedIn, Indeed and JobStreet. Applicants come back into one list.', relies: ['boards', 'ats'], size: 'M', signals: /\b(job (posts?|ads?|boards?)|post(ing)? (roles|jobs)|linkedin|indeed|jobstreet)\b/i },
  ],
});

export const CLINICS = pack({
  id: 'clinics',
  label: 'Clinics and dental',
  matches: /\b(clinics?|dental|dentists?|dentistry|orthodont\w*|physio\w*|patients|medical (cent(re|er)s?|practices?)|dermatolog\w*|vets?|veterinar\w*)\b/i,
  slots: [
    { id: 'appointments', label: 'Appointments', choices: ['Cliniko', 'Dentally', 'Jane', 'Google Calendar'], multiple: false },
    { id: 'messaging', label: 'Patient messaging', choices: ['WhatsApp', 'SMS', 'Email', 'Instagram'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many appointments a week?', choices: ['Under 50', '50 to 200', 'Over 200'] },
    { id: 'noshows', prompt: 'How often do patients miss appointments?', choices: ['Rarely', 'A few a week', 'Most days'] },
  ],
  options: [
    { id: 'cln_remind', title: 'Reminders that cut missed appointments', description: 'Patients get a reminder before each visit and can confirm or move it with one reply. The empty slot shows up in your calendar straight away.', relies: ['appointments', 'messaging'], size: 'S', signals: /\b(no[- ]?shows?|miss\w*|forget\w*|remind\w*|cancel\w*)\b/i },
    { id: 'cln_book', title: 'Patients book and move appointments on WhatsApp', description: 'Patients write as they do today and get a free time, booked into your calendar. Anything medical goes to your team with the conversation attached.', relies: ['messaging', 'appointments'], size: 'M', signals: /\b(book\w*|reschedul\w*|appointments?|whatsapp|phone|calls?|messages?)\b/i },
    { id: 'cln_forms', title: 'Patient forms filled in before the visit', description: 'New patients fill in their details and history from a link before they arrive. It lands in their record, not on a clipboard.', relies: ['appointments'], size: 'S', signals: /\b(forms?|paperwork|intake|history|registration|clipboard)\b/i },
    { id: 'cln_recall', title: 'Patients reminded when a checkup is due', description: 'Patients due for a checkup or cleaning get a message with a link to book. It runs every week without anyone keeping a list.', relies: ['appointments', 'messaging'], size: 'S', signals: /\b(recalls?|check-?ups?|cleanings?|come back|return visits?|due)\b/i },
    { id: 'cln_rev', title: 'Reviews answered in your voice', description: 'Every Google review gets a reply drafted for you to approve. Happy patients are asked for a review after their visit.', uses: ['Reviews'], relies: [], size: 'S', signals: REVIEWS },
  ],
});

export const TRAVEL = pack({
  id: 'travel',
  label: 'Tour operators and travel agencies',
  matches: /\b(tour (operators?|compan(y|ies)|agenc(y|ies)|business(es)?|packages?)|travel (agenc(y|ies)|agents?|compan(y|ies))|itinerar(y|ies)|dmcs?|safaris?|dive (cent(re|er)s?|shops?)|surf camps?)\b/i,
  slots: [
    { id: 'bookings', label: 'Booking system', choices: ['FareHarbor', 'Rezdy', 'Bókun', 'Google Sheets'], multiple: false },
    { id: 'resellers', label: 'Resellers', choices: ['Viator', 'GetYourGuide', 'Klook', 'Tripadvisor'], multiple: true },
    { id: 'messaging', label: 'Guest messaging', choices: ['WhatsApp', 'Instagram', 'Email'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many bookings a week?', choices: ['Under 20', '20 to 100', 'Over 100'] },
    { id: 'who', prompt: 'Who answers enquiries?', choices: ['The owner', 'A sales team', 'Guides between tours', 'Nobody at night'] },
  ],
  options: [
    { id: 'trv_inq', title: 'Enquiries answered with live availability and prices', description: 'Questions on WhatsApp and Instagram get an answer with real dates and prices straight away. Anything unusual goes to your team with the conversation attached.', relies: ['messaging', 'bookings'], size: 'M', signals: /\b(enquir\w*|inquir\w*|answer\w*|repl(y|ies)|respond\w*|messages?|whatsapp|instagram|night)\b/i },
    { id: 'trv_list', title: 'Bookings from Viator, GetYourGuide and Klook in one list', description: 'Bookings from every reseller and your website land in one list, tomorrow first. No more copying them across by hand.', relies: ['resellers', 'bookings'], size: 'M', signals: /\b(one (place|list)|viator|getyourguide|klook|resellers?|channels?|ota\w*|scattered)\b/i },
    { id: 'trv_brief', title: 'Pickup time and what to bring, sent the day before', description: 'Every guest gets their pickup time, meeting point and what to bring the day before. Replies come back to you.', relies: ['bookings', 'messaging'], size: 'S', signals: /\b(pick-?ups?|meeting points?|day before|what to bring|transfers?|briefings?)\b/i },
    { id: 'trv_itin', title: 'Custom trip requests turned into a draft itinerary', description: 'A request for a private trip becomes a draft day by day plan with prices from your own list. You check it and send it.', relies: ['messaging'], size: 'M', signals: /\b(custom|private|tailor[- ]?made|bespoke|itinerar\w*|quotes?|proposals?)\b/i },
    { id: 'trv_rev', title: 'Reviews answered in your voice', description: 'Tripadvisor, Google and reseller reviews get a reply drafted for you to approve. Guests are asked for a review after the trip.', relies: ['resellers'], size: 'S', signals: REVIEWS },
  ],
});

export const REAL_ESTATE = pack({
  id: 'realestate',
  label: 'Real estate agencies',
  matches: /\b(real estate|realtors?|estate agen(ts?|cy|cies)|property agen(ts?|cy|cies)|property brokerages?|off-?plan|property (listings?|portals?)|property ?finder|bayut|rumah123)\b/i,
  slots: [
    { id: 'crm', label: 'CRM', choices: ['HubSpot', 'Pipedrive', 'Zoho CRM', 'Bitrix24'], multiple: false },
    { id: 'portals', label: 'Property portals', choices: ['Property Finder', 'Bayut', 'Rumah123', 'Lamudi'], multiple: true },
    { id: 'messaging', label: 'Client messaging', choices: ['WhatsApp', 'Email', 'Instagram'], multiple: true },
  ],
  questions: [
    { id: 'leads', prompt: 'How many leads a month?', choices: ['Under 50', '50 to 300', 'Over 300'] },
    { id: 'speed', prompt: 'How fast does a new lead hear back?', choices: ['Within an hour', 'Same day', 'Next day or later'] },
  ],
  options: [
    { id: 're_leads', title: 'Leads from every portal land in your CRM', description: 'Every lead from the portals, your website and WhatsApp lands in your CRM with its source. Each one goes to the right agent.', relies: ['portals', 'crm'], size: 'M', signals: /\b(leads?|portals?|crm|scattered|one (place|list)|property ?finder|bayut|rumah123|lamudi)\b/i },
    { id: 're_reply', title: 'New leads get a reply and matching listings in minutes', description: 'A new lead gets a first reply with listings that fit their budget and area, day or night. Your agent picks up a warm conversation.', relies: ['messaging', 'crm'], size: 'M', signals: /\b(repl(y|ies)|respond\w*|answer\w*|minutes|night|fast(er)?|slow)\b/i },
    { id: 're_follow', title: 'Follow-ups that never slip', description: 'Leads that go quiet get a follow-up on a schedule you set. Agents see who is due today.', relies: ['crm'], size: 'S', signals: /\b(follow[- ]?ups?|quiet|forgot\w*|lost|cold)\b/i },
    { id: 're_view', title: 'Viewings booked and confirmed without the back and forth', description: 'Clients pick a viewing time from a link. The agent, the owner and the client get the confirmation and a reminder.', relies: ['crm', 'messaging'], size: 'S', signals: /\b(viewings?|showings?|visits?|appointments?)\b/i },
    { id: 're_post', title: 'One listing posted to every portal', description: 'Enter a property once and it goes to every portal you use and your website. A price or status change updates everywhere.', relies: ['portals', 'crm'], size: 'L', signals: /\b(listings?|post\w*|upload\w*|every portal|all portals)\b/i },
  ],
});

export const PROPERTY = pack({
  id: 'property',
  label: 'Property management',
  matches: /\b(property manag\w*|tenants?|landlords|rent collection|maintenance requests?|strata|hoa)\b/i,
  slots: [
    { id: 'software', label: 'Property software', choices: ['Buildium', 'AppFolio', 'Yardi', 'Google Sheets'], multiple: false },
    { id: 'messaging', label: 'Tenant messaging', choices: ['WhatsApp', 'Email', 'SMS'], multiple: true },
    { id: 'accounting', label: 'Accounting', choices: ['Xero', 'QuickBooks'], multiple: false },
  ],
  questions: [
    { id: 'units', prompt: 'How many units do you manage?', choices: ['Under 50', '50 to 300', 'Over 300'] },
    { id: 'report', prompt: 'How do tenants report problems?', choices: ['WhatsApp', 'Phone', 'Email', 'A portal'] },
  ],
  options: [
    { id: 'pm_fix', title: 'Repair requests logged, assigned and tracked to done', description: 'A tenant sends a message and a photo, and it becomes a job for the right contractor. The tenant hears when it is booked and done.', relies: ['messaging', 'software'], size: 'M', signals: /\b(repairs?|maintenance|fix\w*|broken|leaks?|contractors?|requests?)\b/i },
    { id: 'pm_rent', title: 'Rent reminders and late payments chased', description: 'Tenants get a reminder before rent is due and a polite chase when it is late. You see who has paid without checking the bank.', relies: ['accounting', 'messaging'], size: 'S', signals: /\b(rent|late|arrears|overdue|payments?|chas\w*)\b/i },
    { id: 'pm_owner', title: "Owners get a monthly statement you don't have to build", description: 'Each owner gets a statement of rent, costs and repairs every month, from your own records. No spreadsheet work at month end.', relies: ['accounting', 'software'], size: 'M', signals: /\b(owners?|statements?|reports?|month[- ]end|monthly)\b/i },
    { id: 'pm_ask', title: 'Tenant questions answered day and night', description: 'Common tenant questions get an answer straight away from your own rules and documents. Anything else goes to your team.', relies: ['messaging'], size: 'M', signals: /\b(questions?|answer\w*|night|weekends?|calls?|messages?)\b/i },
  ],
});

export const HOTELS = pack({
  id: 'hotels',
  label: 'Hotels, villas and retreats',
  matches: /\b(hotels?|villas?|retreats?|resorts?|guest ?houses?|homestays?|hostels?|bungalows?|glamping|b&b|bed and breakfast|lodges?|accommodation|airbnb|guest rooms?)\b/i,
  fallback: /\b(guests?|check-?in)\b/i,
  slots: [
    { id: 'booking_engine', label: 'Booking engine', choices: ['Cloudbeds', 'SiteMinder', 'Little Hotelier'], multiple: false },
    { id: 'messaging', label: 'Guest messaging', choices: ['WhatsApp', 'Instagram', 'Email', 'Website chat'], multiple: true },
    { id: 'channels', label: 'Sales channels', choices: ['Booking.com', 'Agoda', 'Expedia', 'Airbnb'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many guest messages a day?', choices: ['Under 20', '20 to 100', 'Over 100'] },
    { id: 'who', prompt: 'Who answers them today?', choices: ['The front desk, in shifts', 'The owner', 'An agency', 'Nobody at night'] },
  ],
  options: [
    { id: 'inq', title: 'Inquiries answered with your prices and dates', description: 'Common questions on WhatsApp and Instagram answered straight away. Anything that needs a person goes to the front desk with the conversation attached.', uses: ['Guest messaging', 'Booking engine'], relies: ['messaging', 'booking_engine'], size: 'M', signals: /\b(answer|repl(y|ies)|respond|messag|whatsapp|instagram|inquir|enquir|questions?|night|minutes)\w*/i, answers: ['Guests wait too long for replies', 'Same questions answered all day'] },
    { id: 'pre', title: 'Pre-arrival details collected ahead', description: 'A short form before arrival. Answers become tasks for the right person.', uses: ['Guest messaging', 'Booking engine'], relies: ['booking_engine'], size: 'S', signals: /\b(pre-?arrival|arrival|check-?in|transfers?|airport|forms?|before (they|guests) arrive)\b/i, answers: ['Pre-arrival details chased by message'] },
    { id: 'list', title: 'One list of bookings from every channel', description: "Website, Booking.com and Agoda bookings in one list, tomorrow's arrivals first.", uses: ['Booking engine', 'Sales channels'], relies: ['channels', 'booking_engine'], size: 'M', signals: /\b(one (place|list)|every booking|all (the )?bookings|channels?|booking\.com|agoda|expedia|scattered)\b/i, answers: ['Bookings scattered across channels'] },
    { id: 'rev', title: 'Reviews answered in your voice', description: 'Google, Tripadvisor and Booking.com reviews get a reply drafted for you to approve.', uses: ['Reviews', 'Sales channels'], relies: ['channels'], size: 'S', signals: /\breviews?\b/i, answers: ['Reviews left without an answer'] },
  ],
});

export const COWORKING = pack({
  id: 'coworking',
  label: 'Coworking spaces',
  matches: /\b(co-?working|hot ?desks?|shared offices?|serviced offices?|flex(ible)? (office|work)? ?spaces?)\b/i,
  slots: [
    { id: 'space', label: 'Space software', choices: ['Nexudus', 'OfficeRnD', 'Optix', 'Cobot'], multiple: false },
    { id: 'billing', label: 'Billing', choices: ['Stripe', 'Xero', 'QuickBooks'], multiple: false },
  ],
  questions: [
    { id: 'members', prompt: 'How many members?', choices: ['Under 50', '50 to 200', 'Over 200'] },
    { id: 'source', prompt: 'How do people find you?', choices: ['Google Maps', 'Instagram', 'Coworker.com', 'Walk-ins'] },
  ],
  options: [
    { id: 'cow_tour', title: 'Tour requests answered and booked within the hour', description: 'Anyone who asks about a desk gets prices and a tour time straight away. Your community team sees the tour in their calendar.', relies: ['space'], size: 'M', signals: /\b(tours?|enquir\w*|inquir\w*|leads?|visitors?|prices?|answer\w*)\b/i },
    { id: 'cow_rooms', title: 'Meeting rooms booked and billed without the front desk', description: 'Members book rooms themselves and the hours go onto their next invoice. No double bookings, no chasing.', relies: ['space', 'billing'], size: 'S', signals: /\b(meeting rooms?|rooms?|bookings?|double[- ]book\w*)\b/i },
    { id: 'cow_bill', title: 'Invoices sent and late payments chased', description: 'Invoices go out on the same day each month and late payers get a polite reminder. You see who owes what on one page.', relies: ['billing'], size: 'S', signals: /\b(invoic\w*|billing|late|overdue|payments?|chas\w*)\b/i },
    { id: 'cow_join', title: 'New members set up in one step', description: 'A new member signs, pays and gets their access and welcome in one flow. Nobody types their details twice.', relies: ['space', 'billing'], size: 'M', signals: /\b(onboard\w*|new members?|sign[- ]?ups?|contracts?|access|welcome)\b/i },
  ],
});

export const SALONS = pack({
  id: 'salons',
  label: 'Salons and spas',
  matches: /\b(salons?|barbers?|barbershops?|spas?|nail (salons?|studios?|bars?)|manicures?|pedicures?|lash (extensions?|studios?)|brow (bars?|studios?)|beauty (salons?|studios?|parlou?rs?)|massages?|hair ?dressers?|hair ?stylists?)\b/i,
  slots: [
    { id: 'booking', label: 'Booking app', choices: ['Fresha', 'Booksy', 'Vagaro', 'Square Appointments'], multiple: false },
    { id: 'messaging', label: 'Client messaging', choices: ['WhatsApp', 'Instagram', 'Facebook Messenger'], multiple: true },
  ],
  questions: [
    { id: 'how', prompt: 'How do clients book today?', choices: ['Instagram messages', 'WhatsApp', 'Online booking', 'Walk-ins'] },
    { id: 'volume', prompt: 'How many bookings a week?', choices: ['Under 50', '50 to 200', 'Over 200'] },
  ],
  options: [
    { id: 'sal_dm', title: 'Instagram and WhatsApp messages turned into bookings', description: 'Clients ask for a time in a message and get a free slot from your calendar straight away. It is booked without anyone picking up the phone.', relies: ['messaging', 'booking'], size: 'M', signals: /\b(dms?|instagram|whatsapp|messages?|repl(y|ies)|answer\w*|book\w*)\b/i },
    { id: 'sal_remind', title: 'Reminders and deposits that stop no-shows', description: 'Clients get a reminder before their visit, and a deposit is taken for longer treatments. Missed slots drop.', relies: ['booking'], size: 'S', signals: /\b(no[- ]?shows?|miss\w*|cancel\w*|deposits?|remind\w*)\b/i },
    { id: 'sal_due', title: 'Clients asked back when they are due', description: 'When a client is due for their next cut or treatment, they get a message with a link to book. Quiet weeks fill up.', relies: ['booking', 'messaging'], size: 'S', signals: /\b(rebook\w*|come back|regulars?|repeat|quiet|empty|due)\b/i },
    { id: 'sal_rev', title: 'Reviews answered in your voice', description: 'Every Google review gets a reply drafted for you to approve. Happy clients are asked for a review after their visit.', uses: ['Reviews'], relies: [], size: 'S', signals: REVIEWS },
  ],
});

export const FITNESS = pack({
  id: 'fitness',
  label: 'Gyms and fitness studios',
  matches: /\b(gyms?|fitness|yoga|pilates|crossfit|boxing|martial arts|personal train(er|ers|ing)|bootcamps?)\b/i,
  slots: [
    { id: 'members', label: 'Member software', choices: ['Mindbody', 'Glofox', 'Momence', 'Wodify'], multiple: false },
    { id: 'messaging', label: 'Member messaging', choices: ['WhatsApp', 'Instagram', 'Email'], multiple: true },
    { id: 'payments', label: 'Payments', choices: ['Stripe', 'GoCardless', 'Square'], multiple: false },
  ],
  questions: [
    { id: 'members', prompt: 'How many active members?', choices: ['Under 100', '100 to 500', 'Over 500'] },
    { id: 'source', prompt: 'Where do new members come from?', choices: ['Instagram', 'Walk-ins', 'Referrals', 'Google'] },
  ],
  options: [
    { id: 'fit_trial', title: 'Trial class leads followed up until they join', description: 'Everyone who books a trial gets a welcome, a reminder and a follow-up with an offer. Your team sees who is close to joining.', relies: ['members', 'messaging'], size: 'M', signals: /\b(trials?|leads?|new members?|sign[- ]?ups?|convert\w*|follow[- ]?ups?)\b/i },
    { id: 'fit_lapse', title: 'Members who stop coming get a personal nudge', description: 'When a member misses two weeks, they get a short personal message. Your coaches see who is drifting.', relies: ['members', 'messaging'], size: 'S', signals: /\b(churn\w*|stop coming|drop(ping)? off|retention|lapsed?|quit\w*|cancel\w*)\b/i },
    { id: 'fit_pay', title: 'Failed payments and renewals chased for you', description: 'A failed card or an ending membership gets a reminder with a link to pay. You stop chasing people at the desk.', relies: ['payments', 'members'], size: 'S', signals: /\b(failed|payments?|renewals?|expir\w*|cards?|overdue|chas\w*)\b/i },
    { id: 'fit_wait', title: 'Waitlists that fill cancelled spots', description: 'When someone cancels, the next person on the waitlist is offered the spot by message. Full classes stay full.', relies: ['members'], size: 'S', signals: /\b(waitlists?|waiting lists?|full|spots?|cancel\w*|classes)\b/i },
    { id: 'fit_dash', title: 'Members, classes and revenue on one page', description: 'One page shows members, attendance, revenue and who is at risk of leaving, updated every day. No more pulling reports by hand.', relies: ['members', 'payments'], size: 'L', signals: /\b(dashboards?|reports?|numbers|revenue|one page|overview)\b/i },
  ],
});

export const RESTAURANTS = pack({
  id: 'restaurants',
  label: 'Restaurants and cafes',
  matches: /\b(restaurants?|caf(e|é)s?|coffee shops?|bistros?|bakery|bakeries|eater(y|ies)|beach clubs?|warungs?|diners|grabfood|gofood)(?=\W|$)/i,
  slots: [
    { id: 'pos', label: 'Point of sale', choices: ['Square', 'Toast', 'Lightspeed', 'Moka'], multiple: false },
    { id: 'delivery', label: 'Delivery apps', choices: ['GrabFood', 'GoFood', 'Uber Eats', 'Talabat', 'Deliveroo'], multiple: true },
    { id: 'reservations', label: 'Reservations', choices: ['SevenRooms', 'OpenTable', 'Chope'], multiple: false },
  ],
  questions: [
    { id: 'covers', prompt: 'How many covers a day?', choices: ['Under 100', '100 to 300', 'Over 300'] },
    { id: 'orders', prompt: 'Where do most orders come from?', choices: ['Dine-in', 'Delivery apps', 'WhatsApp', 'Takeaway'] },
  ],
  options: [
    { id: 'rst_orders', title: 'Orders from every delivery app on one screen', description: 'GrabFood, GoFood and other app orders arrive on one screen in the kitchen. No more juggling tablets.', relies: ['delivery', 'pos'], size: 'M', signals: /\b(delivery|grabfood|gofood|uber ?eats|talabat|deliveroo|tablets?|orders?|apps?)\b/i },
    { id: 'rst_book', title: 'Table bookings taken on WhatsApp and Instagram', description: 'Guests ask for a table in a message and get a confirmed booking straight away. Big groups and special requests go to your manager.', relies: ['reservations'], size: 'M', signals: /\b(tables?|reservations?|book\w*|whatsapp|instagram|messages?|calls?)\b/i },
    { id: 'rst_day', title: "Yesterday's sales and stock in one morning report", description: 'Each morning you get sales by dish and channel, and what is running low. Read it in two minutes.', relies: ['pos', 'delivery'], size: 'M', signals: /\b(sales|stock|inventory|reports?|numbers|waste|margins?|costs?)\b/i },
    { id: 'rst_menu', title: 'Menu and prices changed once, updated everywhere', description: 'Change a dish or a price once and it updates in your till and every delivery app. Sold out items come off everywhere.', relies: ['pos', 'delivery'], size: 'S', signals: /\b(menus?|prices?|sold out|items?|dishes)\b/i },
    { id: 'rst_rev', title: 'Reviews answered in your voice', description: 'Google and delivery app reviews get a reply drafted for you to approve. Nothing sits unanswered.', relies: ['delivery'], size: 'S', signals: REVIEWS },
  ],
});

export const EVENTS = pack({
  id: 'events',
  label: 'Events and venues',
  matches: /\b(event (agenc(y|ies)|planners?|planning|compan(y|ies)|organi[sz]ers?|venues?)|events (agency|company|business)|venues?|weddings?|wedding planners?|conference (cent(re|er)|organi[sz]er|venue)s?|catering|caterers?|festivals?|corporate events)\b/i,
  slots: [
    { id: 'tickets', label: 'Tickets and registration', choices: ['Eventbrite', 'Ticket Tailor', 'Luma'], multiple: false },
    { id: 'planning', label: 'Planning', choices: ['Google Sheets', 'Notion', 'HoneyBook'], multiple: false },
    { id: 'messaging', label: 'Client messaging', choices: ['WhatsApp', 'Email', 'Instagram'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many events a month?', choices: ['1 or 2', '3 to 10', 'Over 10'] },
    { id: 'time', prompt: 'What takes the most time?', choices: ['Quotes', 'Guest lists', 'Suppliers', 'Payments'] },
  ],
  options: [
    { id: 'evt_quote', title: 'Event enquiries answered with a quote the same day', description: 'An enquiry with a date, a headcount and a budget gets a draft quote from your own packages. You check it and send it.', relies: ['messaging', 'planning'], size: 'M', signals: /\b(quotes?|quotations?|enquir\w*|inquir\w*|proposals?|packages?|budgets?)\b/i },
    { id: 'evt_guests', title: 'Guest lists, RSVPs and reminders handled', description: 'Guests register or RSVP from one link and get reminders before the day. You see the live list.', relies: ['tickets'], size: 'S', signals: /\b(guest ?lists?|rsvps?|registrations?|tickets?|attendees?|invit\w*)\b/i },
    { id: 'evt_supp', title: 'Every supplier confirmed and on schedule', description: 'Each event has one checklist of suppliers, times and payments. Suppliers get their brief and confirm it, and you see what is still open.', relies: ['planning', 'messaging'], size: 'M', signals: /\b(suppliers?|vendors?|checklists?|run ?sheets?|schedules?|timelines?)\b/i },
    { id: 'evt_after', title: 'Thank-yous, photos and feedback sent after the event', description: 'The day after, guests and clients get a thank-you, the photos and a short feedback form. Good answers become reviews.', relies: ['messaging'], size: 'S', signals: /\b(feedback|photos?|thank[- ]?yous?|after the event|reviews?|testimonials?)\b/i },
  ],
});

export const SCHOOLS = pack({
  id: 'schools',
  label: 'Schools and tutoring',
  matches: /\b(schools?|tutor(s|ing)?|tuition|academ(y|ies)|kindergartens?|preschools?|students|language (school|centre|center)s?|learning cent(re|er)s?)\b/i,
  slots: [
    { id: 'classes', label: 'Where classes run', choices: ['Google Classroom', 'Zoom', 'Teachable', 'Google Meet'], multiple: true },
    { id: 'messaging', label: 'Parent messaging', choices: ['WhatsApp', 'Email', 'Telegram'], multiple: true },
    { id: 'payments', label: 'Payments', choices: ['Stripe', 'PayPal', 'Xendit'], multiple: false },
  ],
  questions: [
    { id: 'students', prompt: 'How many students?', choices: ['Under 50', '50 to 300', 'Over 300'] },
    { id: 'parents', prompt: 'Who keeps parents updated?', choices: ['Teachers', 'The office', 'The owner', 'Nobody regularly'] },
  ],
  options: [
    { id: 'edu_enrol', title: 'Enquiries turned into trial lessons and enrolments', description: 'Parents who ask get answers, prices and a trial lesson time straight away. Your office sees every enquiry until it enrols.', relies: ['messaging'], size: 'M', signals: /\b(enquir\w*|inquir\w*|enrol\w*|trials?|new students|leads?|sign[- ]?ups?)\b/i },
    { id: 'edu_fees', title: 'Fee reminders sent and payments tracked', description: 'Parents get a reminder before fees are due, with a link to pay. You see who has paid on one page.', relies: ['payments', 'messaging'], size: 'S', signals: /\b(fees?|payments?|invoic\w*|late|overdue|chas\w*)\b/i },
    { id: 'edu_report', title: 'Parents get a short progress note every week', description: 'Teachers jot a few words after class and parents get a short, clear note each week. Teachers spend minutes, not evenings.', relies: ['messaging', 'classes'], size: 'M', signals: /\b(progress|reports?|parents?|updates?|feedback)\b/i },
    { id: 'edu_sched', title: 'Timetable changes sent to everyone affected', description: 'When a class moves or a teacher is off, every student and parent affected gets a message. No group chat chaos.', relies: ['classes', 'messaging'], size: 'S', signals: /\b(timetables?|schedul\w*|cancel\w*|reschedul\w*|group chats?|changes?)\b/i },
  ],
});

export const CAR_REPAIR = pack({
  id: 'carrepair',
  label: 'Car repair and service',
  matches: /\b((car|auto|vehicle) (repairs?|service|servicing|workshops?)|mechanics?|garages?|body ?shops?|panel beat\w*|tyres?|tires|car detailing|detailing studios?)\b/i,
  slots: [
    { id: 'workshop', label: 'Workshop software', choices: ['Tekmetric', 'Shopmonkey', 'AutoLeap', 'Mitchell 1'], multiple: false },
    { id: 'messaging', label: 'Customer messaging', choices: ['WhatsApp', 'SMS', 'Email'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many cars a week?', choices: ['Under 20', '20 to 100', 'Over 100'] },
    { id: 'updates', prompt: 'How do customers get updates?', choices: ['We call them', 'WhatsApp', 'They come and ask'] },
  ],
  options: [
    { id: 'car_quote', title: 'Repair estimates approved by customers on WhatsApp', description: 'The estimate goes to the customer with photos of the problem, and they approve it with one tap. Work starts without phone tag.', relies: ['workshop', 'messaging'], size: 'M', signals: /\b(estimates?|quotes?|approv\w*|photos?|phone tag|calls?)\b/i },
    { id: 'car_ready', title: 'Customers told when their car is ready', description: 'When the job is marked done, the customer gets a message with the total and a link to pay. Fewer calls to the desk.', relies: ['workshop', 'messaging'], size: 'S', signals: /\b(ready|status|updates?|calls?|pick ?up|collect\w*)\b/i },
    { id: 'car_due', title: 'Service reminders when a car is due', description: 'Customers get a reminder when their next service is due, with a link to book. Your bays stay busy.', relies: ['workshop', 'messaging'], size: 'S', signals: /\b(service reminders?|due|come back|repeat|regulars?|quiet)\b/i },
    { id: 'car_rev', title: 'Reviews answered in your voice', description: 'Every Google review gets a reply drafted for you to approve. Happy customers are asked for a review when they collect.', uses: ['Reviews'], relies: [], size: 'S', signals: REVIEWS },
  ],
});

export const RENTAL = pack({
  id: 'rental',
  label: 'Car and scooter rental',
  matches: /\b((car|scooter|motorbike|motorcycle|bike|vehicle) (rentals?|hire)|rent[- ]a[- ]car|rent(ing)? (out )?(cars|scooters|motorbikes|bikes))\b/i,
  slots: [
    { id: 'rental', label: 'Rental software', choices: ['HQ Rental Software', 'Rentsyst', 'Google Sheets'], multiple: false },
    { id: 'channels', label: 'Where bookings come from', choices: ['WhatsApp', 'Discover Cars', 'Rentalcars.com', 'Getaround'], multiple: true },
  ],
  questions: [
    { id: 'fleet', prompt: 'How many vehicles?', choices: ['Under 20', '20 to 100', 'Over 100'] },
    { id: 'confirm', prompt: 'How are bookings confirmed?', choices: ['WhatsApp', 'Phone', 'Online', 'In person'] },
  ],
  options: [
    { id: 'rnt_book', title: 'Rental requests answered with what is free and the price', description: 'A request for dates gets the vehicles that are free and the price straight away, in WhatsApp. Your team confirms the booking.', relies: ['channels', 'rental'], size: 'M', signals: /\b(requests?|enquir\w*|inquir\w*|availab\w*|whatsapp|messages?|answer\w*|repl(y|ies))\b/i },
    { id: 'rnt_hand', title: 'Pickup and return checklists with photos', description: 'Staff walk round the vehicle with a phone checklist and photos at pickup and return. Damage disputes come with proof.', relies: ['rental'], size: 'S', signals: /\b(damage\w*|photos?|checklists?|pick-?ups?|returns?|handovers?|disputes?)\b/i },
    { id: 'rnt_cal', title: 'One calendar for every vehicle and channel', description: 'Bookings from every site and WhatsApp land in one calendar per vehicle. No more double bookings.', relies: ['channels', 'rental'], size: 'M', signals: /\b(calendars?|double[- ]book\w*|one (place|list)|channels?|scattered|overbook\w*)\b/i },
    { id: 'rnt_dep', title: 'Deposits and damage charges tracked', description: 'Every deposit taken and returned is recorded against the booking. Charges for damage or late return are sent with the photos.', relies: ['rental'], size: 'S', signals: /\b(deposits?|charges?|refunds?|late returns?|fines?)\b/i },
  ],
});

export const ECOMMERCE = pack({
  id: 'ecommerce',
  label: 'Online shops',
  matches: /\b(online (shops?|stores?|business)|e-?commerce|shopify|woocommerce|etsy|amazon sellers?|sell(ing)? on (marketplaces|amazon|shopee|tokopedia|lazada)|d2c|dtc)\b/i,
  slots: [
    { id: 'store', label: 'Store', choices: ['Shopify', 'WooCommerce', 'Shopee', 'Tokopedia', 'Amazon'], multiple: true },
    { id: 'support', label: 'Customer messaging', choices: ['WhatsApp', 'Instagram', 'Email'], multiple: true },
    { id: 'shipping', label: 'Shipping', choices: ['ShipStation', 'Shippo', 'Easyship'], multiple: false },
  ],
  questions: [
    { id: 'orders', prompt: 'How many orders a day?', choices: ['Under 20', '20 to 200', 'Over 200'] },
    { id: 'question', prompt: 'What do customers ask most?', choices: ['Where is my order', 'Sizes and stock', 'Returns', 'Payment'] },
  ],
  options: [
    { id: 'ecm_wismo', title: 'Where is my order answered without your team', description: 'Customers asking about an order get its real status and tracking link straight away. Your team handles only the unusual ones.', relies: ['support', 'shipping'], size: 'M', signals: /\b(where is my order|tracking|shipping|deliver\w*|support|questions?|messages?)\b/i },
    { id: 'ecm_stock', title: 'Stock kept in step across your shop and marketplaces', description: 'A sale anywhere updates stock everywhere. No more selling what you no longer have.', relies: ['store'], size: 'M', signals: /\b(stock|inventory|oversell\w*|sold out|marketplaces?|shopee|tokopedia|amazon|sync\w*)\b/i },
    { id: 'ecm_cart', title: 'Abandoned carts followed up on WhatsApp and email', description: 'Shoppers who leave items in their cart get a short reminder. Some of them come back and buy.', relies: ['store', 'support'], size: 'S', signals: /\b(abandon\w*|carts?|checkouts?|conversion)\b/i },
    { id: 'ecm_ret', title: 'Returns and exchanges handled in one flow', description: 'Customers start a return from a link, get the label and know when the refund is made. You see every return in one list.', relies: ['store', 'shipping'], size: 'M', signals: /\b(returns?|exchanges?|refunds?)\b/i },
    { id: 'ecm_rev', title: 'Reviews answered in your voice', description: 'Store and marketplace reviews get a reply drafted for you to approve. Happy customers are asked for a review after delivery.', relies: ['store'], size: 'S', signals: REVIEWS },
  ],
});

export const MANUFACTURING = pack({
  id: 'manufacturing',
  label: 'Manufacturing workshops',
  matches: /\b(factor(y|ies)|manufacturing|we manufacture|manufacturer of|fabricat\w*|production lines?|cnc|joinery)\b/i,
  slots: [
    { id: 'production', label: 'Production software', choices: ['Odoo', 'Katana', 'MRPeasy', 'Excel'], multiple: false },
    { id: 'accounting', label: 'Accounting', choices: ['Xero', 'QuickBooks'], multiple: false },
  ],
  questions: [
    { id: 'orders', prompt: 'How many orders in production at once?', choices: ['Under 10', '10 to 50', 'Over 50'] },
    { id: 'status', prompt: 'How do customers check on their order?', choices: ['They call', 'Email', 'WhatsApp', "They don't"] },
  ],
  options: [
    { id: 'mfg_status', title: 'Customers see where their order is without calling', description: 'Customers get a message as their order moves through production, and a page with its status. Fewer calls asking where it is.', relies: ['production'], size: 'M', signals: /\b(status|where (is|it is)|updates?|calls?|chas\w*|deadlines?|late)\b/i },
    { id: 'mfg_plan', title: 'Production schedule built from confirmed orders', description: 'Confirmed orders become a weekly schedule by machine and team, with dates you can promise. Changes move everything else along.', relies: ['production', 'accounting'], size: 'L', signals: /\b(schedul\w*|planning|capacity|machines?|shifts?|lead times?)\b/i },
    { id: 'mfg_mat', title: 'Materials reordered before they run out', description: 'When a material drops below its level, a purchase order is drafted for the usual supplier. Production stops waiting for stock.', relies: ['production'], size: 'S', signals: /\b(materials?|stock|inventory|run(ning)? out|suppliers?|purchas\w*|reorder\w*)\b/i },
    { id: 'mfg_quote', title: 'Quote requests turned into a priced draft', description: 'A request with specs or a drawing becomes a draft quote from your own costs and margins. You check it and send it.', relies: ['production', 'accounting'], size: 'M', signals: /\b(quotes?|quotations?|pric\w*|specs?|drawings?|rfqs?|estimates?)\b/i },
  ],
});

export const LOGISTICS = pack({
  id: 'logistics',
  label: 'Logistics and delivery',
  matches: /\b(logistics|courier (compan(y|ies)|services?|business(es)?)|freight|forwarders?|forwarding|fleets? of (vans|trucks|lorries)|delivery fleets?|last[- ]mile|dispatchers|3pl|(delivery|trucking|haulage) (compan(y|ies)|services?|business(es)?))\b/i,
  slots: [
    { id: 'dispatch', label: 'Dispatch', choices: ['Onfleet', 'Tookan', 'Shipday', 'Excel'], multiple: false },
    { id: 'updates', label: 'Customer updates', choices: ['WhatsApp', 'SMS', 'Email'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many deliveries a day?', choices: ['Under 50', '50 to 500', 'Over 500'] },
    { id: 'drivers', prompt: 'How do drivers get their jobs?', choices: ['WhatsApp group', 'Dispatch app', 'Phone calls', 'Paper'] },
  ],
  options: [
    { id: 'lgs_track', title: 'Customers told where their delivery is without calling', description: 'Customers get a message when the driver sets off and a link to follow it. Calls to the office drop.', relies: ['updates', 'dispatch'], size: 'M', signals: /\b(tracking|where is|calls?|updates?|eta|customers? ask\w*)\b/i },
    { id: 'lgs_pod', title: 'Proof of delivery photos saved to each order', description: 'Drivers take a photo and a signature at the door and it is saved to the order. Disputes are settled with proof.', relies: ['dispatch'], size: 'S', signals: /\b(proof|pod|photos?|signatures?|disputes?|claims?)\b/i },
    { id: 'lgs_board', title: 'Jobs given to drivers from one board', description: 'Orders land on one board, you assign them to drivers, and each driver gets their route on the phone. No more WhatsApp group lists.', relies: ['dispatch'], size: 'M', signals: /\b(drivers?|dispatch\w*|routes?|assign\w*|whatsapp groups?|manual\w*|orders?)\b/i },
    { id: 'lgs_quote', title: 'Freight quote requests answered from email', description: 'A quote request by email becomes a draft price from your own rates. You check it and send it the same hour.', relies: ['updates'], size: 'M', signals: /\b(quotes?|quotations?|rates?|pric\w*|rfqs?)\b/i },
  ],
});

export const WHOLESALE = pack({
  id: 'wholesale',
  label: 'Wholesale and distribution',
  matches: /\b(wholesalers?|wholesale (business(es)?|compan(y|ies)|distribut\w*|suppliers? of)|distributors? (of|for)|(we are|we're) (a |an )?(wholesale|distribution)\b|distribution (compan(y|ies)|business(es)?)|trade customers?|b2b (orders?|sales|customers?))\b/i,
  slots: [
    { id: 'erp', label: 'Accounting or ERP', choices: ['Xero', 'QuickBooks', 'Odoo', 'SAP Business One'], multiple: false },
    { id: 'orders', label: 'Where orders arrive', choices: ['WhatsApp', 'Email', 'Shopify B2B'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many orders a day?', choices: ['Under 20', '20 to 100', 'Over 100'] },
    { id: 'who', prompt: 'Who types orders in?', choices: ['Sales team', 'Office admin', 'The owner', 'Customers themselves'] },
  ],
  options: [
    { id: 'whl_orders', title: 'WhatsApp and email orders entered for you', description: 'An order sent by message or email is read and entered as a draft in your system. Your team checks it instead of typing it.', relies: ['orders', 'erp'], size: 'M', signals: /\b(orders?|typ(e|ing)|manual\w*|whatsapp|emails?|entry|mistakes?|errors?)\b/i },
    { id: 'whl_portal', title: 'Trade customers reorder from their own page', description: 'Each customer gets a page with their prices and past orders and can reorder in a minute. Orders go straight into your system.', relies: ['erp'], size: 'L', signals: /\b(portal|reorder\w*|self[- ]serv\w*|catalogu?e|price lists?)\b/i },
    { id: 'whl_stock', title: 'Sales see real stock before they promise', description: 'Your sales team checks live stock from their phone before they confirm. No more promising what is not there.', relies: ['erp'], size: 'S', signals: /\b(stock|inventory|availab\w*|promis\w*|backorders?)\b/i },
    { id: 'whl_chase', title: 'Overdue invoices chased on time', description: 'Overdue invoices get a polite reminder on a schedule you set. You see who owes what each Monday.', relies: ['erp'], size: 'S', signals: /\b(invoic\w*|overdue|late|payments?|cash ?flow|chas\w*|receivables?)\b/i },
  ],
});

export const TRADES = pack({
  id: 'trades',
  label: 'Construction and trades',
  matches: /\b(construction (compan(y|ies)|business(es)?|firms?)|(building|general|electrical|plumbing|hvac) contractors?|builders|renovation (compan(y|ies)|business(es)?|firms?)|plumbers|plumbing (compan(y|ies)|business(es)?)|electricians|hvac|air ?con (service|repair|cleaning)|roofers|roofing (compan(y|ies)|business(es)?)|carpenters|painters|landscapers|landscaping (compan(y|ies)|business(es)?)|pool (cleaning|maintenance) (compan(y|ies)|business(es)?)|handyman|fit-?out (compan(y|ies)|business(es)?))\b/i,
  slots: [
    { id: 'jobs', label: 'Job software', choices: ['Jobber', 'ServiceM8', 'Tradify', 'Procore'], multiple: false },
    { id: 'accounting', label: 'Accounting', choices: ['Xero', 'QuickBooks'], multiple: false },
    { id: 'messaging', label: 'Client messaging', choices: ['WhatsApp', 'Email', 'SMS'], multiple: true },
  ],
  questions: [
    { id: 'volume', prompt: 'How many jobs a week?', choices: ['Under 10', '10 to 50', 'Over 50'] },
    { id: 'quote', prompt: 'How long does a quote take?', choices: ['Same day', 'A few days', 'Over a week'] },
  ],
  options: [
    { id: 'bld_quote', title: 'Quotes sent the same day as the site visit', description: 'Notes and photos from the site visit become a draft quote from your own prices. You check it and send it before the end of the day.', relies: ['jobs', 'messaging'], size: 'M', signals: /\b(quotes?|quotations?|estimates?|site visits?|pric\w*)\b/i },
    { id: 'bld_sched', title: 'Jobs scheduled and the team told each morning', description: 'Each person gets their jobs, addresses and notes on their phone every morning. Changes reach them straight away.', relies: ['jobs'], size: 'S', signals: /\b(schedul\w*|teams?|crews?|calendars?|jobs?|whatsapp groups?)\b/i },
    { id: 'bld_update', title: 'Clients get photo updates as the work moves', description: 'Photos from site go to the client with a short note at each step. Fewer calls asking how it is going.', relies: ['jobs', 'messaging'], size: 'M', signals: /\b(updates?|photos?|progress|clients? (call|ask)\w*)\b/i },
    { id: 'bld_inv', title: 'Invoices sent when the job is done, then chased', description: 'Marking a job done sends the invoice, and late payers get a polite reminder. You stop doing invoices at night.', relies: ['jobs', 'accounting'], size: 'S', signals: /\b(invoic\w*|payments?|late|overdue|chas\w*|paperwork)\b/i },
  ],
});

export const PROFESSIONAL = pack({
  id: 'professional',
  label: 'Law and accounting firms',
  matches: /\b(law (firm|office|practice)s?|lawyers|solicitors?|attorneys?|notar(y|ies)|legal (services|practice|firm)|accounting (firm|practice|office)s?|we are accountants|bookkeeping (firm|service|business|practice)s?|tax (advis\w*|consultan\w*) (firm|practice|office)s?|audit firms?)\b/i,
  slots: [
    { id: 'practice', label: 'Practice software', choices: ['Clio', 'Karbon', 'TaxDome', 'Xero Practice Manager'], multiple: false },
    { id: 'documents', label: 'Documents', choices: ['Google Drive', 'Dropbox', 'SharePoint'], multiple: false },
  ],
  questions: [
    { id: 'clients', prompt: 'How many active clients?', choices: ['Under 50', '50 to 300', 'Over 300'] },
    { id: 'chasing', prompt: 'What takes the most chasing?', choices: ['Documents', 'Signatures', 'Payments', 'Deadlines'] },
  ],
  options: [
    { id: 'pro_intake', title: 'New clients onboarded with one form', description: 'A new client fills in one form, signs the engagement letter and uploads their documents. A file is opened in your system.', relies: ['practice', 'documents'], size: 'M', signals: /\b(onboard\w*|new clients?|intake|engagement letters?|kyc|forms?)\b/i },
    { id: 'pro_docs', title: 'Documents chased from clients until they arrive', description: 'Clients get a list of what is missing and a reminder until it is uploaded. You stop writing the same email.', relies: ['documents'], size: 'S', signals: /\b(documents?|paperwork|chas\w*|missing|uploads?|receipts?)\b/i },
    { id: 'pro_dead', title: 'Deadlines tracked, with reminders to you and the client', description: 'Every filing and court date is on one calendar, with reminders to your team and the client in time. Nothing is left to memory.', relies: ['practice'], size: 'S', signals: /\b(deadlines?|filings?|due dates?|court dates?|tax dates?)\b/i },
    { id: 'pro_inq', title: 'New enquiries sorted and answered the same day', description: 'Each new enquiry is sorted by type and gets a first answer with your fees and next step. The right person picks it up.', relies: ['practice'], size: 'M', signals: /\b(enquir\w*|inquir\w*|leads?|new matters?|answer\w*|calls?)\b/i },
    { id: 'pro_draft', title: 'First drafts of routine letters from your templates', description: 'Routine letters and documents are drafted from your own templates and the client file. A person always checks and signs.', relies: ['documents', 'practice'], size: 'M', signals: /\b(draft\w*|letters?|contracts?|templates?|routine)\b/i },
  ],
});

/** Checked in this order: specific packs first, broad ones last. */
export const PACKS: Industry[] = [
  RECRUITMENT,
  // Packs whose customers are other businesses come early: a wholesaler
  // "supplying cafes and hotels" is a wholesaler, not a hotel.
  WHOLESALE,
  MANUFACTURING,
  LOGISTICS,
  ECOMMERCE,
  TRADES,
  CLINICS,
  COWORKING,
  TRAVEL,
  REAL_ESTATE,
  PROPERTY,
  HOTELS,
  SALONS,
  FITNESS,
  RESTAURANTS,
  EVENTS,
  SCHOOLS,
  CAR_REPAIR,
  RENTAL,
  // Last: "our accountant" turns up in everyone's paragraph.
  PROFESSIONAL,
];

/** The pack for what they wrote, or null for Claude. */
export function detectPack(paragraph: string): Industry | null {
  return PACKS.find((p) => p.matches.test(paragraph)) ?? PACKS.find((p) => p.fallback?.test(paragraph)) ?? null;
}

export function packById(id: unknown): Industry | null {
  return PACKS.find((p) => p.id === id) ?? null;
}

/** The pack an option belongs to. */
export function packOfOption(optionId: string): Industry | null {
  return PACKS.find((p) => p.options.some((o) => o.id === optionId)) ?? null;
}
