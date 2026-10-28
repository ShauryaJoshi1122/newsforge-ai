import Link from "next/link";
import { headers } from "next/headers";
import { getProjectByDomain, getProjectBySlug } from "@/lib/projects";

type SiteConfig = {
  siteName?: string;
  language?: string;
  templateName?: string;
  branding?: { primaryColor?: string };
  features?: string[];
  categories?: string[];
  homepage?: { headline?: string; description?: string; tickerText?: string };
};

function decodeSite(encoded: string | undefined): SiteConfig | null {
  if (!encoded || encoded.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SiteConfig;
    if (!value || typeof value !== "object" || typeof value.siteName !== "string") return null;
    return {
      siteName: value.siteName.slice(0, 80),
      language: ["en", "gu", "hi"].includes(value.language || "") ? value.language : "en",
      templateName: typeof value.templateName === "string" ? value.templateName.slice(0, 80) : "News layout",
      branding: { primaryColor: /^#[0-9a-fA-F]{6}$/.test(value.branding?.primaryColor || "") ? value.branding!.primaryColor : "#16845b" },
      features: Array.isArray(value.features) ? value.features.filter((x): x is string => typeof x === "string").slice(0, 4) : [],
      categories: Array.isArray(value.categories) ? value.categories.filter((x): x is string => typeof x === "string").map(x => x.slice(0, 24)).slice(0, 12) : [],
      homepage: {
        headline: typeof value.homepage?.headline === "string" ? value.homepage.headline.slice(0, 160) : "",
        description: typeof value.homepage?.description === "string" ? value.homepage.description.slice(0, 240) : "",
        tickerText: typeof value.homepage?.tickerText === "string" ? value.homepage.tickerText.slice(0, 180) : ""
      }
    };
  } catch { return null; }
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ site?: string; page?: string }> }) {
  const params = await searchParams;
  const site = decodeSite(params.site);
  if (!site) {
    return <main className="full-preview-error"><div className="full-preview-error-card"><span className="full-preview-kicker">NEWSFORGE AI</span><h1>Preview link unavailable</h1><p>This link is missing its website configuration or it is invalid. Open Studio, generate your configuration, and create a new preview link.</p><Link href="/studio">Return to Studio →</Link></div></main>;
  }
  const categories = site.categories?.length ? site.categories : ["Latest", "Local", "India", "World"];
  const activePage = params.page || "home";
  const category = categories.find(item => "category-" + slug(item) === activePage);
  const accent = site.branding?.primaryColor || "#16845b";
  const isArticle = activePage === "article";
  const isAbout = activePage === "about";
  const isContact = activePage === "contact";
  const isPrivacy = activePage === "privacy";
  const pageTitle = category || (isArticle ? "Article template" : isAbout ? "About us" : isContact ? "Contact" : isPrivacy ? "Privacy policy" : site.siteName);
  const projectQuery = projectSlug ? "project=" + encodeURIComponent(projectSlug)
    : domain ? "domain=" + encodeURIComponent(domain)
    : "site=" + encodeURIComponent(params.site || "");
  const hrefFor = (page: string) => "/preview?" + projectQuery + "&page=" + encodeURIComponent(page);
  return <main className="full-preview" style={{ "--preview-accent": accent } as React.CSSProperties}>
    <div className="full-preview-banner"><span><b>PREVIEW MODE</b> · {site.templateName} · This is not a published news website.</span><Link href="/studio">← Back to Studio</Link></div>
    <header className="full-news-header">
      <Link className="full-news-brand" href={hrefFor("home")}><span className="full-news-mark">N</span><span>{site.siteName}<small>{site.language === "gu" ? "તમારા સમાચાર, તમારી ભાષામાં" : site.language === "hi" ? "आपकी खबर, आपकी आवाज़" : "YOUR NEWS. YOUR VOICE."}</small></span></Link>
      <div className="full-news-date">NEWSROOM <span>●</span> DIGITAL EDITION</div>
    </header>
    <nav className="full-news-nav" aria-label="News categories">
      <Link className={activePage === "home" ? "selected" : ""} href={hrefFor("home")}>HOME</Link>
      {categories.map(item => <Link key={item} className={category === item ? "selected" : ""} href={hrefFor("category-" + slug(item))}>{item.toUpperCase()}</Link>)}
      <Link className={isArticle ? "selected" : ""} href={hrefFor("article")}>ARTICLE PAGE</Link>
    </nav>
    {site.features?.includes("breaking-ticker") && <div className="full-news-ticker"><b>BREAKING</b><span>{site.homepage?.tickerText || "Your breaking-news ticker message"}</span></div>}
    <section className="full-news-content">
      {activePage === "home" ? <>
        <div className="full-news-eyebrow"><span/> YOUR NEWSROOM · HOMEPAGE</div>
        <h1>{site.homepage?.headline || "Your lead headline goes here"}</h1>
        <p className="full-news-intro">{site.homepage?.description || "Add a short introduction to your publication in Studio."}</p>
        <div className="full-news-layout">
          <article className="full-lead-placeholder"><div className="placeholder-image"><span>LEAD STORY IMAGE</span></div><div className="full-placeholder-copy"><small>LEAD STORY · EMPTY CONTENT SLOT</small><h2>Your first news story will appear here</h2><p>Connect WordPress and publish a real article to replace this empty layout slot. NewsForge does not invent current news.</p><Link href={hrefFor("article")}>Preview article layout →</Link></div></article>
          <aside className="full-news-side"><div className="full-side-heading">LATEST UPDATES <span>01</span></div><div className="full-empty-story"><b>No articles connected yet</b><p>Real headlines and images will appear here after you connect a publishing source.</p></div><div className="full-side-heading">BROWSE SECTIONS</div>{categories.slice(0, 6).map(item => <Link key={item} href={hrefFor("category-" + slug(item))} className="full-section-link">{item}<span>→</span></Link>)}</aside>
        </div>
        {site.features?.includes("live-tv") && <section className="full-feature-strip"><b>LIVE TV</b><span>Connect a real stream URL in your publishing setup to enable playback.</span></section>}
        {site.features?.includes("ad-slots") && <section className="full-ad-slot">ADVERTISEMENT SLOT <small>Ad network not connected</small></section>}
      </> : category ? <>
        <div className="full-news-eyebrow"><span/> NEWS SECTION</div><h1>{category}</h1><p className="full-news-intro">Latest articles published under {category} will appear on this page.</p>
        <div className="full-empty-page"><div className="full-empty-icon">▤</div><h2>No articles in this section yet</h2><p>This is the category-page layout. Connect WordPress or add real articles to populate it.</p><Link href="/studio">Configure your newsroom →</Link></div>
      </> : isArticle ? <>
        <div className="full-news-eyebrow"><span/> ARTICLE DETAIL TEMPLATE</div><h1>Article page layout</h1><p className="full-news-intro">A dedicated reading page for each published news story.</p>
        <article className="full-article-template"><div className="full-article-image">FEATURE IMAGE SLOT</div><div className="full-article-body"><small>SECTION · PUBLICATION DATE · AUTHOR</small><h2>Your article headline will appear here</h2><p className="article-deck">A short summary or standfirst for the full story.</p><hr/><p>Full article text will be supplied by your newsroom when you publish a real story. This preview deliberately uses empty content slots instead of fabricated news.</p><p>Connect a WordPress site to manage real articles, categories, authors and publishing dates.</p></div></article>
      </> : isAbout || isContact || isPrivacy ? <>
        <div className="full-news-eyebrow"><span/> STANDARD WEBSITE PAGE</div><h1>{pageTitle}</h1><div className="full-static-page"><p>{isAbout ? "Introduce your newsroom, editorial mission, team and coverage area here." : isContact ? "Add your newsroom email address, phone number, office address and verified social links here." : "Add your reviewed privacy policy here before launching the website publicly."}</p><p>This page is a content structure preview. Replace the guidance text with your publication’s approved information before launch.</p></div>
      </> : <><h1>Page not found</h1><p className="full-news-intro">Choose a page from the navigation above.</p></>}
    </section>
    <footer className="full-news-footer"><div><b>{site.siteName}</b><p>A news website preview built with NewsForge AI.</p></div><nav><Link href={hrefFor("about")}>About</Link><Link href={hrefFor("contact")}>Contact</Link><Link href={hrefFor("privacy")}>Privacy policy</Link></nav><small>Preview link · Not yet published</small></footer>
  </main>;
}
