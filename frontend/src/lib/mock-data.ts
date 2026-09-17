import type {
  UploadedFile,
  ChatSession,
  Message,
  Lead,
  CreditUsage,
  Subscription,
  Settings,
  Company,
  User,
} from "./api";

export const mockCompany: Company = {
  id: "demo-agency-101",
  name: "Apex Luxury Realty",
  email: "contact@apexrealty.demo",
  phone: "+91 98200 55443",
};

export const mockUser: User = {
  id: "demo-user-1",
  name: "Sarah Jenkins",
  email: "sarah@apexrealty.demo",
  companyId: "demo-agency-101",
  role: "admin",
};

export const mockSubscription: Subscription = {
  plan: "growth",
  creditsLeft: 6420,
  renewsAt: "2026-06-15",
};

export const mockSettings: Settings = {
  company: mockCompany,
  user: mockUser,
  subscription: mockSubscription,
  hasOpenAIKey: true,
  systemPrompt:
    "You are the AI property assistant for Apex Luxury Realty. Answer buyer questions accurately, check listing availability, qualify buyer budget, and draft follow-up messages in English and Arabic.",
  widgetConfig: {
    color: "#6366f1",
    name: "Apex Property Advisor",
    greeting: "Welcome to Apex Luxury Realty! How can I assist with your property search today?",
    theme: "light",
    position: "right",
  },
  channels: {
    whatsapp: {
      connected: true,
      phoneId: "1098234789",
      businessId: "biz_892348",
      verifyToken: "demo_wa_token",
    },
    messenger: {
      connected: true,
      pageId: "page_98234",
      verifyToken: "demo_ms_token",
    },
    instagram: {
      connected: true,
      accountId: "apex_luxury_realty",
      verifyToken: "demo_ig_token",
    },
    tiktok: {
      connected: false,
      appId: "",
      accountId: "",
      verifyToken: "",
    },
  },
};

export const mockFiles: UploadedFile[] = [
  {
    id: "f1",
    name: "Q4-listings-mumbai.pdf",
    size: 2_450_000,
    type: "application/pdf",
    status: "ready",
    uploadedAt: "2026-05-20T10:24:00Z",
  },
  {
    id: "f2",
    name: "leads-export-april.csv",
    size: 184_000,
    type: "text/csv",
    status: "ready",
    uploadedAt: "2026-05-18T08:12:00Z",
  },
  {
    id: "f3",
    name: "premium-villa-portfolio.xlsx",
    size: 612_000,
    type: "application/vnd.ms-excel",
    status: "processing",
    uploadedAt: "2026-05-26T15:02:00Z",
  },
  {
    id: "f4",
    name: "bandra-projects-brochure.pdf",
    size: 4_120_000,
    type: "application/pdf",
    status: "ready",
    uploadedAt: "2026-05-12T11:48:00Z",
  },
];

export const mockSessions: ChatSession[] = [
  { id: "s1", title: "3BHK Bandra West inquiry", updatedAt: "2026-05-27T09:14:00Z" },
  { id: "s2", title: "Investor — Pune commercial", updatedAt: "2026-05-26T18:32:00Z" },
  { id: "s3", title: "First-time buyer Thane", updatedAt: "2026-05-25T13:05:00Z" },
];

export const mockMessages: Record<string, Message[]> = {
  s1: [
    {
      id: "m1",
      role: "assistant",
      content:
        "Hi! I can help you find listings, qualify leads, or pull data from your uploaded files. What would you like to do?",
      createdAt: "2026-05-27T09:10:00Z",
    },
    {
      id: "m2",
      role: "user",
      content: "Show me 3BHK apartments in Bandra West under ₹6 Cr.",
      createdAt: "2026-05-27T09:11:00Z",
    },
    {
      id: "m3",
      role: "assistant",
      content:
        "I found 7 matching listings from your portfolio. The top 3 by price-to-area ratio are:\n\n1. **Rustomjee Seasons** (BKC Annexe / Bandra)\n   - Price: ₹5.4 Cr\n   - Area: 1,420 sqft\n   - Ready to move, 3 Bed + Balcony\n\n2. **Oberoi Sky City** (Bandra West)\n   - Price: ₹5.9 Cr\n   - Area: 1,580 sqft\n   - Sea view, Clubhouse & 2 dedicated car parks\n\n3. **Lodha Maison** (Bandra)\n   - Price: ₹5.7 Cr\n   - Area: 1,510 sqft\n   - Low-density luxury block\n\nWould you like me to draft a WhatsApp intro message for the lead?",
      createdAt: "2026-05-27T09:12:00Z",
    },
    {
      id: "m4",
      role: "user",
      content: "Yes, draft a WhatsApp message for Rohan Mehta.",
      createdAt: "2026-05-27T09:13:00Z",
    },
    {
      id: "m5",
      role: "assistant",
      content:
        "Here is the customized WhatsApp message drafted for **Rohan Mehta**:\n\n---\n*Hi Rohan! 👋 Hope your week is going well. Based on our conversation regarding 3BHK apartments in Bandra West under ₹6 Cr, I shortlisted 3 exclusive units with sea views and ready-to-move status. You can check the digital brochures here: https://apexrealty.demo/p/bandra-3bhk*\n\n*Would Saturday afternoon around 3 PM work for a private walkthrough? Let me know!*\n---\n\nWould you like me to send this through the connected WhatsApp Business channel?",
      createdAt: "2026-05-27T09:14:00Z",
    },
  ],
  s2: [
    {
      id: "m201",
      role: "assistant",
      content: "Hello! How can I assist with your commercial property portfolio?",
      createdAt: "2026-05-26T18:30:00Z",
    },
    {
      id: "m202",
      role: "user",
      content: "What commercial properties in Pune have a rental yield above 8.5%?",
      createdAt: "2026-05-26T18:31:00Z",
    },
    {
      id: "m203",
      role: "assistant",
      content:
        "Based on your uploaded `premium-villa-portfolio.xlsx` and commercial listings:\n\n- **CyberCity IT Park (Magarpatta, Pune)**: 8,400 sqft leased to a global fintech tenant until 2030. Gross rental yield: **9.4%**. Asking price: ₹14.2 Cr.\n- **TechZone Tower B (Hinjawadi, Pune)**: 5,200 sqft Grade-A office space. Yield: **8.8%**. Asking price: ₹8.6 Cr.\n\nBoth listings include 3-year rent escalation clauses of 15%.",
      createdAt: "2026-05-26T18:32:00Z",
    },
  ],
  s3: [
    {
      id: "m301",
      role: "assistant",
      content: "Hi! Looking for residential or commercial options?",
      createdAt: "2026-05-25T13:00:00Z",
    },
    {
      id: "m302",
      role: "user",
      content: "Looking for 1BHK or 2BHK options in Thane under ₹90L.",
      createdAt: "2026-05-25T13:02:00Z",
    },
    {
      id: "m303",
      role: "assistant",
      content:
        "We have 4 matching properties in Thane:\n1. **Dosti West County (Balkum)**: 2 BHK, 680 sqft carpet, ₹82 Lakhs (all-inclusive).\n2. **Rustomjee Urbania (Majiwada)**: 2 BHK, 715 sqft, ₹88 Lakhs with stamp duty waiver.\n3. **Kalpataru Parkcity (Kolshet)**: 1 BHK, 490 sqft, ₹69 Lakhs.\n\nAll three are within 10 minutes of the upcoming Metro Line 4.",
      createdAt: "2026-05-25T13:05:00Z",
    },
  ],
};

export const mockLeads: Lead[] = [
  {
    id: "l1",
    name: "Rohan Mehta",
    phone: "+91 98200 11223",
    budget: 55000000,
    city: "Mumbai",
    propertyType: "3BHK Apartment",
    source: "WhatsApp",
    status: "qualified",
    score: 5,
    createdAt: "2026-05-26",
  },
  {
    id: "l2",
    name: "Anjali Sharma",
    phone: "+91 99102 88440",
    budget: 18000000,
    city: "Pune",
    propertyType: "2BHK Apartment",
    source: "Website",
    status: "new",
    score: 2,
    createdAt: "2026-05-27",
  },
  {
    id: "l3",
    name: "Karthik Iyer",
    phone: "+91 98765 12345",
    budget: 120000000,
    city: "Bangalore",
    propertyType: "Villa",
    source: "Referral",
    status: "contacted",
    score: 4,
    createdAt: "2026-05-24",
  },
  {
    id: "l4",
    name: "Priya Nair",
    phone: "+91 90909 77665",
    budget: 9000000,
    city: "Kochi",
    propertyType: "Plot",
    source: "Instagram",
    status: "won",
    score: 5,
    createdAt: "2026-05-15",
  },
  {
    id: "l5",
    name: "Vikram Singh",
    phone: "+91 88001 33445",
    budget: 32000000,
    city: "Gurgaon",
    propertyType: "Commercial",
    source: "MagicBricks",
    status: "lost",
    score: 1,
    createdAt: "2026-05-10",
  },
  {
    id: "l6",
    name: "Sneha Patel",
    phone: "+91 98244 65500",
    budget: 24000000,
    city: "Ahmedabad",
    propertyType: "3BHK Apartment",
    source: "WhatsApp",
    status: "new",
    score: 3,
    createdAt: "2026-05-27",
  },
];

export const mockUsage: CreditUsage[] = [
  { date: "May 21", credits: 184, chats: 32 },
  { date: "May 22", credits: 220, chats: 41 },
  { date: "May 23", credits: 168, chats: 28 },
  { date: "May 24", credits: 295, chats: 52 },
  { date: "May 25", credits: 312, chats: 60 },
  { date: "May 26", credits: 268, chats: 47 },
  { date: "May 27", credits: 340, chats: 64 },
];

// ── Interactive Local Storage Persistence for Demo Mode ──────────────────────
const STORAGE_PREFIX = "stratos_demo_";

export function getDemoLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}leads`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockLeads;
}

export function saveDemoLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}leads`, JSON.stringify(leads));
  } catch {}
}

export function getDemoFiles(): UploadedFile[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}files`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockFiles;
}

export function saveDemoFiles(files: UploadedFile[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}files`, JSON.stringify(files));
  } catch {}
}

export function getDemoSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}sessions`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockSessions;
}

export function saveDemoSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}sessions`, JSON.stringify(sessions));
  } catch {}
}

export function getDemoMessages(sessionId: string): Message[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}messages_${sessionId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockMessages[sessionId] || [
    {
      id: "init",
      role: "assistant",
      content: "Hello! I am your AI property assistant. How can I assist you with your real estate listings today?",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function saveDemoMessages(sessionId: string, messages: Message[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}messages_${sessionId}`, JSON.stringify(messages));
  } catch {}
}

export function getDemoSettings(): Settings {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockSettings;
}

export function saveDemoSettings(patch: Partial<Settings>): Settings {
  const current = getDemoSettings();
  const updated = { ...current, ...patch };
  try {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function generateRealEstateAIResponse(userPrompt: string): string {
  const lower = userPrompt.toLowerCase();

  if (lower.includes("3bhk") || lower.includes("bandra") || lower.includes("mumbai") || lower.includes("apartment")) {
    return (
      "I've searched your active Mumbai listing catalog. Here are the top 3 matching residences:\n\n" +
      "1. **Rustomjee Seasons (BKC Annexe)**: ₹5.4 Cr · 1,420 sqft · Ready to Move\n" +
      "2. **Oberoi Sky City (Bandra West)**: ₹5.9 Cr · 1,580 sqft · Sea View, 2 Parkings\n" +
      "3. **Lodha Solitaire (Worli)**: ₹6.2 Cr · 1,510 sqft · Ultra-luxury amenities\n\n" +
      "All units have verified clear titles and RERA approvals. Would you like me to prepare a WhatsApp sharing brochure?"
    );
  }

  if (lower.includes("villa") || lower.includes("luxury") || lower.includes("dubai") || lower.includes("private")) {
    return (
      "Here are our premier luxury villa opportunities:\n\n" +
      "- **The Palm Reserve (Private Gated Enclave)**: ₹12.5 Cr / $1.5M · 4 BHK with private infinity pool & landscaped deck (5,200 sqft plot).\n" +
      "- **Emerald Estates (North Coastal)**: ₹8.9 Cr · 4 BHK contemporary villa with 100% power backup and club access.\n\n" +
      "Both properties are eligible for foreign national investment and offer 8%+ projected capital appreciation."
    );
  }

  if (lower.includes("visit") || lower.includes("showing") || lower.includes("schedule") || lower.includes("view")) {
    return (
      "I've logged a site visit request! The buyer has been matched with our senior luxury property specialist. " +
      "An automated confirmation with the GPS location, gate pass, and broker contact has been generated. " +
      "Would you like me to sync this appointment to your Google Calendar?"
    );
  }

  if (lower.includes("whatsapp") || lower.includes("draft") || lower.includes("message")) {
    return (
      "Here is a customized WhatsApp message template ready to send:\n\n" +
      "> *Hi [Client Name]! 👋 Thank you for your inquiry regarding our exclusive residences. I've curated a personalized PDF lookbook matching your preferred configuration and price range. You can view the virtual tour here: https://apexrealty.demo/tour*\n\n" +
      "> *Would tomorrow afternoon at 4 PM suit you for a brief walkthrough?*\n\n" +
      "Click send to push directly to WhatsApp Business."
    );
  }

  return (
    "Thank you for your inquiry. I cross-referenced your request against our current indexed real estate database. " +
    "All pricing, carpet area metrics, and developer brochures have been verified. " +
    "Would you like me to generate a comparative market analysis (CMA), filter by specific amenities, or connect with a dedicated agent?"
  );
}
