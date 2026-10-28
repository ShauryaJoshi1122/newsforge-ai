export type Template = { id: string; name: string; description: string; category: string; accent: string; style: "broadcast" | "newspaper" | "magazine" | "regional"; tags: string[] };
export const templates: Template[] = [
{ id: "broadcast", name: "Broadcast Pro", description: "Bold TV-news identity, ticker, live coverage and strong headlines.", category: "TV News", accent: "#e23b45", style: "broadcast", tags: ["Breaking ticker", "Live TV", "High impact"] },
{ id: "daily-paper", name: "The Daily Paper", description: "Editorial grid, serif headlines and a classic newspaper feel.", category: "Newspaper", accent: "#1d4ed8", style: "newspaper", tags: ["Editorial", "Multi-column", "Print inspired"] },
{ id: "modern-magazine", name: "Modern Magazine", description: "Image-led stories and generous spacing for a premium publication.", category: "Magazine", accent: "#7c3aed", style: "magazine", tags: ["Feature stories", "Clean layout", "Premium"] },
{ id: "regional-connect", name: "Regional Connect", description: "Mobile-first local news with categories and community coverage.", category: "Regional", accent: "#16845b", style: "regional", tags: ["Local news", "Mobile first", "Gujarati ready"] },
{ id: "digital-first", name: "Digital First", description: "Fast-scanning cards and a compact layout for modern readers.", category: "Digital", accent: "#0e7490", style: "magazine", tags: ["Compact cards", "Trending", "SEO friendly"] },
{ id: "business-desk", name: "Business Desk", description: "A polished newsroom layout for business, markets and analysis.", category: "Business", accent: "#b7791f", style: "newspaper", tags: ["Markets", "Analysis", "Professional"] }
];
export const categories = ["Latest", "Gujarat", "India", "World", "Politics", "Business", "Sports", "Entertainment", "Technology"];
