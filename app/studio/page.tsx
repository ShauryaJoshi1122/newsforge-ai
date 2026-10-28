"use client";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, ExternalLink, Globe2, Layers3, LayoutTemplate, LoaderCircle, MonitorSmartphone, Palette, Plus, Radio, Search, ShieldCheck, Sparkles, WandSparkles, Zap } from "lucide-react";
import { templates } from "@/lib/templates";

type Config = { siteName: string; language: string; templateId: string; templateName: string; branding: { primaryColor: string }; features: string[]; pages: string[]; categories: string[]; homepage: { headline: string; description: string; tickerText: string }; generatedAt: string };
const languageNames: Record<string,string> = { en: "English", gu: "ગુજરાતી", hi: "हिन्दी" };
const features = [{id:"breaking-ticker",label:"Breaking news ticker"},{id:"live-tv",label:"Live TV section"},{id:"ad-slots",label:"Advertisement slots"},{id:"social-links",label:"Social media links"}];

export default function Home() {
  const [siteName,setSiteName] = useState("Gujarat News 24");
  const [language,setLanguage] = useState("gu");
  const [templateId,setTemplateId] = useState("regional-connect");
  const [templateQuery,setTemplateQuery] = useState("");
  const [primaryColor,setPrimaryColor] = useState("#16845b");
  const [enabled,setEnabled] = useState<string[]>(["breaking-ticker","live-tv","ad-slots"]);
  const [categories,setCategories] = useState<string[]>(["Latest","Gujarat","India","World","Politics","Sports"]);
  const [categoryDraft,setCategoryDraft] = useState("");
  const [heroHeadline,setHeroHeadline] = useState("ગુજરાત અને દેશના તાજા સમાચાર એક જ જગ્યાએ");
  const [heroDescription,setHeroDescription] = useState("તમારી બ્રાન્ડ, તમારી ભાષા અને તમારા વાચકો માટે બનાવેલી ન્યૂઝ વેબસાઇટ.");
  const [tickerText,setTickerText] = useState("તાજા સમાચાર માટે તમારી વેબસાઇટ તૈયાર છે");
  const [config,setConfig] = useState<Config|null>(null);
  const [generating,setGenerating] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [wpOpen,setWpOpen] = useState(false);
  const [wpUrl,setWpUrl] = useState("");
  const [wpUser,setWpUser] = useState("");
  const [wpPassword,setWpPassword] = useState("");
  const [wpBusy,setWpBusy] = useState(false);
  const [wpPublishBusy,setWpPublishBusy] = useState(false);
  const [wpResult,setWpResult] = useState("");
  const selected = useMemo(()=>templates.find(t=>t.id===templateId) ?? templates[0],[templateId]);
  const visibleTemplates = useMemo(()=>templates.filter(t=>`${t.name} ${t.category} ${t.tags.join(" ")}`.toLowerCase().includes(templateQuery.trim().toLowerCase())),[templateQuery]);

  function addCategory() {
    const next = categoryDraft.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!next || categories.some(item => item.toLowerCase() === next.toLowerCase()) || categories.length >= 12) return;
    setCategories(old => [...old, next]); setCategoryDraft("");
  }
  async function generate() {
    setGenerating(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteName,language,templateId,primaryColor,features:enabled,categories,homepage:{headline:heroHeadline,description:heroDescription,tickerText}})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate configuration.");
      setConfig(data.config); setNotice("Your website configuration is ready. Preview it, then export the setup file.");
    } catch(e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setGenerating(false); }
  }
  async function downloadConfig() {
    setError("");
    try {
      // Rebuild from the current form state so edits made after generation are never exported stale.
      const response = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteName,language,templateId,primaryColor,features:enabled,categories})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not refresh the website configuration.");
      const freshConfig = data.config as Config;
      setConfig(freshConfig);
      const blob = new Blob([JSON.stringify(freshConfig,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href=url; a.download=(siteName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "newsforge-site")+"-config.json";
      a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Exported the latest configuration using your current brand, layout, language and features.");
    } catch(e) {
      setError(e instanceof Error ? e.message : "Could not export the configuration.");
    }
  }
  async function testWordPress() {
    setWpBusy(true); setWpResult(""); setError("");
    try {
      const response = await fetch("/api/wordpress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteUrl:wpUrl,username:wpUser,appPassword:wpPassword})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Connection failed.");
      setWpResult("Connected successfully as " + (data.user?.name || data.user?.slug || wpUser) + ". No content was changed.");
    } catch(e) { setWpResult(e instanceof Error ? e.message : "Connection failed."); }
    finally { setWpBusy(false); }
  }
  async function publishWordPress() {
    if (!config) { setWpResult("Generate your website configuration first."); return; }
    if (!window.confirm("Create missing starter categories and publish About, Contact, and Privacy Policy pages on " + wpUrl + "? Existing pages with the same slugs will be left unchanged.")) return;
    setWpPublishBusy(true); setWpResult(""); setError("");
    try {
      const response = await fetch("/api/wordpress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"publish",siteUrl:wpUrl,username:wpUser,appPassword:wpPassword,siteName:config.siteName})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 207) throw new Error(data.error || "Could not publish starter content.");
      const result = data.results;
      if (!result) throw new Error(data.error || "WordPress returned an unexpected response.");
      const summary = "WordPress setup " + (data.ok ? "completed" : "partially completed") + ": " +
        result.categoriesCreated.length + " categories and " + result.pagesCreated.length + " pages created; " +
        result.categoriesExisting.length + " categories and " + result.pagesExisting.length + " pages already existed.";
      setWpResult(summary + (data.failures?.length ? " Issues: " + data.failures.join(" | ") : " Review the starter pages before launch."));
      setWpPassword("");
    } catch(e) { setWpResult(e instanceof Error ? e.message : "Could not publish starter content."); }
    finally { setWpPublishBusy(false); }
  }
  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="NewsForge AI home"><span className="brand-mark"><Layers3 size={21}/></span><span>newsforge<span className="brand-ai">.ai</span><small>NEWSROOM WEBSITE STUDIO</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <button className="side-link active"><LayoutTemplate size={18}/> Website generator <span className="side-count">01</span></button>
      <button className="side-link" onClick={()=>document.getElementById("template-library")?.scrollIntoView({behavior:"smooth"})}><Layers3 size={18}/> Template library</button>
      <button className="side-link" onClick={()=>setWpOpen(!wpOpen)}><Globe2 size={18}/> WordPress connection</button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><strong>Need a hand?</strong><p>Build your first news site in a few simple steps.</p><button onClick={()=>document.getElementById("how-it-works")?.scrollIntoView({behavior:"smooth"})}>Quick guide <ArrowRight size={14}/></button></div><div className="profile"><div className="avatar">NF</div><div><strong>NewsForge Studio</strong><span>Starter workspace</span></div><ChevronDown size={16}/></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Website generator</b></div><div className="top-actions"><span className="status-dot"></span><span className="status-text">Workspace ready</span><button className="icon-button" aria-label="Help"><CircleHelp size={18}/></button><div className="avatar small-avatar">NF</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> AI-POWERED WEBSITE FACTORY</div><h1>Your next newsroom starts here.</h1><p>Build a polished, branded news website from a template — without starting from scratch.</p></div><div className="heading-badge"><Zap size={16}/><span>Template-first<br/><b>Fast by design</b></span></div></div>
        <div className="steps"><div className="step current"><span>1</span><div><b>Customize</b><small>Brand & layout</small></div></div><div className="step-line"/><div className={"step "+(config?"current":"")}><span>2</span><div><b>Preview</b><small>Review your site</small></div></div><div className="step-line"/><div className="step"><span>3</span><div><b>Connect</b><small>WordPress setup</small></div></div></div>
        <div className="builder-grid">
          <div className="builder-column">
            <section className="panel">
              <div className="panel-heading"><div className="panel-icon purple"><WandSparkles size={18}/></div><div><h2>Brand your website</h2><p>Start with the essentials. You can refine them later.</p></div><span className="required-tag">REQUIRED</span></div>
              <label className="field-label" htmlFor="siteName">News brand name</label><input id="siteName" className="text-input" maxLength={80} value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="e.g. Gujarat News 24"/>
              <div className="two-fields"><div><label className="field-label" htmlFor="language">Primary language</label><div className="select-wrap"><select id="language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="gu">ગુજરાતી (Gujarati)</option><option value="hi">हिन्दी (Hindi)</option><option value="en">English</option></select><ChevronDown size={16}/></div></div><div><label className="field-label" htmlFor="color">Brand color</label><div className="color-field"><input id="color" type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)}/><span>{primaryColor.toUpperCase()}</span><Palette size={16}/></div></div></div>
              <div className="divider"/>
              <div className="subheading"><div><h3>News navigation</h3><p>Add the sections your readers will browse.</p></div><span className="optional">{categories.length}/12</span></div>
              <div className="category-editor"><div className="category-chips">{categories.map(category=><span className="category-chip" key={category}>{category}<button type="button" aria-label={"Remove "+category} onClick={()=>setCategories(old=>old.filter(item=>item!==category))}>×</button></span>)}</div><div className="category-add"><input aria-label="New news category" value={categoryDraft} maxLength={24} onChange={e=>setCategoryDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCategory();}}} placeholder="Add a category, e.g. Education"/><button type="button" onClick={addCategory} disabled={!categoryDraft.trim()||categories.length>=12||categories.some(item=>item.toLowerCase()===categoryDraft.trim().toLowerCase())}>Add</button></div><small>Up to 12 unique categories. Changes appear in the preview and exported setup.</small></div>
              <div className="divider"/>
              <div className="subheading"><div><h3>Homepage content</h3><p>Write the lead headline, short intro and ticker message.</p></div><span className="optional">OPTIONAL</span></div>
              <div className="content-editor">
                <label className="field-label" htmlFor="heroHeadline">Lead headline</label><input id="heroHeadline" className="text-input" maxLength={160} value={heroHeadline} onChange={e=>setHeroHeadline(e.target.value)} placeholder="Your main homepage headline"/><small>{heroHeadline.length}/160 characters</small>
                <label className="field-label" htmlFor="heroDescription">Homepage introduction</label><textarea id="heroDescription" className="text-input content-textarea" maxLength={240} value={heroDescription} onChange={e=>setHeroDescription(e.target.value)} placeholder="A short introduction to your newsroom"/><small>{heroDescription.length}/240 characters</small>
                <label className="field-label" htmlFor="tickerText">Breaking ticker message</label><input id="tickerText" className="text-input" maxLength={180} value={tickerText} onChange={e=>setTickerText(e.target.value)} placeholder="Enter a ticker message"/><small>{tickerText.length}/180 characters. Used when the ticker feature is enabled.</small>
              </div>
              <div className="divider"/>
              <div className="subheading"><div><h3>Website features</h3><p>Choose what your readers should see.</p></div><span className="optional">OPTIONAL</span></div>
              <div className="feature-list">{features.map(f=><label key={f.id} className="feature-option"><input type="checkbox" checked={enabled.includes(f.id)} onChange={e=>setEnabled(old=>e.target.checked?[...old,f.id]:old.filter(x=>x!==f.id))}/><span className="custom-check"><Check size={12}/></span><span>{f.label}</span></label>)}</div>
            </section>
            <section className="panel" id="template-library">
              <div className="panel-heading"><div className="panel-icon orange"><LayoutTemplate size={18}/></div><div><h2>Choose a news layout</h2><p>Nine starting layouts for regional, TV, newspaper and lightweight news publishers.</p></div></div>
              <label className="template-search"><Search size={16}/><input aria-label="Search news layouts" value={templateQuery} onChange={e=>setTemplateQuery(e.target.value)} placeholder="Search layouts, e.g. regional or magazine"/>{templateQuery&&<button type="button" aria-label="Clear template search" onClick={()=>setTemplateQuery("")}>Clear</button>}</label><div className="template-results-count">{visibleTemplates.length} of {templates.length} layouts</div><div className="template-list">{visibleTemplates.map(t=><button key={t.id} className={"template-option "+(templateId===t.id?"selected":"")} onClick={()=>{setTemplateId(t.id);if(primaryColor===selected.accent)setPrimaryColor(t.accent)}}><span className={"template-mini "+t.style} style={{"--accent":t.accent} as React.CSSProperties}><i/><i/><i/><b/><em/></span><span className="template-copy"><b>{t.name}</b><small>{t.category} · {t.tags[0]}</small></span><span className="radio-mark">{templateId===t.id&&<span/>}</span></button>)}{visibleTemplates.length===0&&<div className="template-empty">No layouts match “{templateQuery}”. Try “regional”, “business” or “magazine”.</div>}</div>
            </section>
            <button className="generate-button" onClick={generate} disabled={generating||!siteName.trim()}>{generating?<LoaderCircle className="spin" size={18}/>:<Sparkles size={18}/>} {generating?"Generating configuration…":"Generate my website"} <ArrowRight size={18}/></button>
            <p className="secure-note"><ShieldCheck size={14}/> No AI key required for template setup. Your choices stay in this session.</p>
            {error&&<div className="notice error">{error}</div>}{notice&&<div className="notice success"><Check size={16}/>{notice}</div>}
          </div>
          <div className="preview-column">
            <div className="preview-header"><div><span className="live-indicator"/> LIVE LAYOUT PREVIEW</div><span className="preview-size"><MonitorSmartphone size={14}/> Responsive layout</span></div>
            <div className="browser-frame"><div className="browser-top"><div className="traffic"><i/><i/><i/></div><div className="browser-address"><ShieldCheck size={11}/> preview.newsforge.ai/{siteName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"your-news"}</div><ExternalLink size={13}/></div>
              <div className={"site-preview template-"+selected.style} style={{"--accent":primaryColor} as React.CSSProperties}>
                <div className="preview-masthead"><div className="preview-logo"><span className="preview-logo-mark"><Radio size={17}/></span><span>{siteName||"Your News Brand"}<small>{language==="gu"?"તમારા સમાચાર, તમારી ભાષામાં":language==="hi"?"आपकी खबर, आपकी आवाज़":"YOUR NEWS. YOUR VOICE."}</small></span></div><div className="preview-date">LIVE UPDATES <span>●</span></div></div>
                <nav className="preview-nav">{categories.slice(0, 6).map((x,i)=><span key={x} className={i===0?"nav-active":""}>{x}</span>)}</nav>
                {enabled.includes("breaking-ticker")&&<div className="ticker"><b>BREAKING</b><span>{tickerText || "Add your breaking news message in Homepage content"}</span></div>}
                <div className="preview-body"><div className="preview-kicker"><span/> PREVIEW COPY · REPLACE WITH YOUR STORIES</div><div className="preview-headline">{heroHeadline || "Add your main headline in Homepage content"}</div><p className="preview-description">{heroDescription || "Add a short introduction in Homepage content."}</p><div className="preview-meta">NEWS DESK <span>•</span> 5 MIN READ</div><div className="preview-image"><div className="image-sun"/><div className="image-hill hill-one"/><div className="image-hill hill-two"/><div className="image-caption"><span>FEATURED STORY</span><b>{selected.name}</b></div></div><div className="preview-cards"><div><span>LOCAL NEWS</span><b>Stories from your region</b></div><div><span>TOP STORIES</span><b>What readers need to know</b></div></div></div>
                {enabled.includes("live-tv")&&<div className="live-strip"><Radio size={13}/> LIVE TV SECTION <span>Connect your stream in WordPress</span></div>}{enabled.includes("ad-slots")&&<div className="ad-slot-preview">ADVERTISEMENT SLOT <span>Ad provider not connected</span></div>}{enabled.includes("social-links")&&<div className="social-preview"><b>FOLLOW OUR NEWSROOM</b><span>Facebook</span><span>YouTube</span><span>Instagram</span><small>Add your real profile URLs in WordPress</small></div>}
              </div>
            </div>
            <div className="preview-footer"><span><span className="tiny-dot"/> Updating as you customize</span><button onClick={generate} disabled={generating}><Sparkles size={14}/> Refresh preview</button></div>
            {config&&<div className="generated-card"><div className="generated-icon"><Check size={19}/></div><div className="generated-copy"><b>Configuration generated</b><span>{config.templateName} · {languageNames[config.language]||config.language}</span><small>This is a setup configuration, not a published WordPress site yet.</small></div><button className="download-button" onClick={downloadConfig}><ArrowDownToLine size={16}/> Export JSON</button></div>}
            <section className={"wordpress-card "+(wpOpen?"expanded":"")}><div className="wordpress-top"><div className="wp-icon">W</div><div><h3>Connect your WordPress</h3><p>Connect a real site, then create starter categories and pages when you are ready.</p></div><button className="wp-expand" onClick={()=>setWpOpen(!wpOpen)} aria-label="Toggle WordPress connection"><Plus size={18}/></button></div>
              {wpOpen&&<div className="wp-form"><label className="field-label" htmlFor="wp-url">WordPress site URL (HTTPS)</label><input id="wp-url" className="text-input" value={wpUrl} onChange={e=>setWpUrl(e.target.value)} placeholder="https://yournewswebsite.com"/><label className="field-label" htmlFor="wp-user">WordPress username</label><input id="wp-user" className="text-input" autoComplete="username" value={wpUser} onChange={e=>setWpUser(e.target.value)} placeholder="WordPress username"/><label className="field-label" htmlFor="wp-password">Application Password</label><input id="wp-password" className="text-input" type="password" autoComplete="current-password" value={wpPassword} onChange={e=>setWpPassword(e.target.value)} placeholder="Use a revocable Application Password"/><div className="wp-actions"><button className="wp-test" onClick={testWordPress} disabled={wpBusy||wpPublishBusy||!wpUrl||!wpUser||!wpPassword}>{wpBusy?<LoaderCircle size={15} className="spin"/>:<ShieldCheck size={15}/>} Test connection</button><button className="wp-publish" onClick={publishWordPress} disabled={wpBusy||wpPublishBusy||!wpUrl||!wpUser||!wpPassword||!config}>{wpPublishBusy?<LoaderCircle size={15} className="spin"/>:<ArrowRight size={15}/>} Create starter pages</button></div>{wpResult&&<p className={"wp-result "+(wpResult.startsWith("Connected")||wpResult.startsWith("WordPress setup completed")?"ok":"bad")}>{wpResult}</p>}<small className="wp-warning">Use a dedicated WordPress account and a revocable Application Password, not your main account password. This early MVP does not save credentials.</small></div>}
            </section>
          </div>
        </div>
        <section className="how-section" id="how-it-works"><div><span className="eyebrow">SIMPLE BY DESIGN</span><h2>From idea to newsroom, in three steps.</h2></div><div className="how-cards"><article><span>01</span><h3>Choose your style</h3><p>Start with a reusable layout made for news publishers.</p></article><article><span>02</span><h3>Make it yours</h3><p>Set your brand, language, color and key website features.</p></article><article><span>03</span><h3>Prepare to publish</h3><p>Connect WordPress and create starter categories and pages. Hosting automation is a later milestone.</p></article></div></section>
        <footer className="footer"><span>© 2026 NewsForge AI</span><span>Built for Indian and independent newsrooms <span className="footer-heart">●</span></span><span>Early access · MVP</span></footer>
      </div>
    </section>
  </main>;
}
