import type { UploadedFile, ChatSession, Message, Lead, CreditUsage, Subscription } from "./api";

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
      createdAt: "",
    },
    {
      id: "m2",
      role: "user",
      content: "Show me 3BHK apartments in Bandra West under ₹6 Cr.",
      createdAt: "",
    },
    {
      id: "m3",
      role: "assistant",
      content:
        "I found 7 matching listings from your portfolio. The top 3 by price-to-area ratio are: Rustomjee Seasons (₹5.4 Cr, 1,420 sqft), Oberoi Sky City (₹5.9 Cr, 1,580 sqft), and Lodha Maison (₹5.7 Cr, 1,510 sqft). Want me to draft an intro message for the lead?",
      createdAt: "",
    },
    { id: "m4", role: "user", content: "Yes, draft a WhatsApp message.", createdAt: "" },
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

export const mockSubscription: Subscription = {
  plan: "growth",
  creditsLeft: 6420,
  renewsAt: "2026-06-15",
};
