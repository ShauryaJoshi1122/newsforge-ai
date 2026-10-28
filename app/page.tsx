"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Globe2, Layers3, Menu, Radio, ShieldCheck, Sparkles, WandSparkles, Zap } from "lucide-react";
import { useState } from "react";

const templates = [
  { name: "Regional Connect", tag: "Regional news", tone: "regional", accent: "#1d9668" },
  { name: "Broadcast Pro", tag: "TV newsroom", tone: "broadcast", accent: "#e23e45" },
  { name: "Premium Magazine", tag: "Editorial", tone: "magazine", accent: "#7757d8" },
  { name: "Indian Newspaper", tag: "Classic daily", tone: "newspaper", accent: "#bd8a31" },
];

const steps = [
  { number: "01", title: "Set your brand", body: "Choose your newsroom name, language and brand colour." },
  { number: "02", title: "Pick a layout", body: "Start from a design made for the way your readers consume news." },
  { number: "03", title: "Connect WordPress", body: "Test your site connection and publish starter pages when you're ready." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="NewsForge AI home">
          <span className="landing-brand-mark"><Layers3 size={21} /></span>
          <span>newsforge<span>.ai</span><small>NEWSROOM WEBSITE STUDIO</small></span>
        </Link>
        <button className="landing-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={21} /></button>
        <nav className={menuOpen ? "landing-links open" : "landing-links"}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#templates" onClick={() => setMenuOpen(false)}>Templates</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <Link href="/studio" className="landing-nav-cta">Open Studio <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span /> BUILT FOR MODERN NEWSROOMS</div>
          <h1>Your news brand.<br /><em>Your digital front page.</em></h1>
          <p className="landing-lede">Create a polished, branded news website with a template-first workflow — designed for regional publishers, digital news desks and independent media teams.</p>
          <div className="landing-actions">
            <Link href="/studio" className="landing-primary">Build your website <ArrowRight size={17} /></Link>
            <a href="#templates" className="landing-secondary">Explore layouts <ChevronRight size={16} /></a>
          </div>
          <div className="landing-proof"><span><Check size={14} /> 9 starter layouts</span><span><Check size={14} /> Gujarati, Hindi & English</span><span><Check size={14} /> WordPress connection</span></div>
        </div>
        <div className="landing-hero-art" aria-label="Illustration of a news website preview">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-window">
            <div className="hero-window-top"><span /><span /><span /><div>yournews.example</div><ShieldCheck size={13} /></div>
            <div className="hero-site-head"><div className="hero-site-logo"><span><Radio size={19} /></span><div>GUJARAT TODAY<small>NEWS THAT MATTERS</small></div></div><div className="hero-live">● LIVE UPDATES</div></div>
            <div className="hero-site-nav"><b>HOME</b><span>GUJARAT</span><span>INDIA</span><span>WORLD</span><span>SPORTS</span></div>
            <div className="hero-breaking"><b>BREAKING</b><span>Stay connected to the stories that matter</span></div>
            <div className="hero-story">
              <div className="hero-story-copy"><small>TOP STORY · NEWS DESK</small><h3>A fresh home for every important story.</h3><p>A clear, modern layout built around your newsroom identity.</p><span>READ THE STORY ↗</span></div>
              <div className="hero-landscape"><div className="landscape-sun" /><div className="landscape-hill one" /><div className="landscape-hill two" /><span>YOUR STORY IMAGE</span></div>
            </div>
            <div className="hero-story-bottom"><div><span /><b>Local headlines</b></div><div><span /><b>Latest updates</b></div><div><span /><b>Live coverage</b></div></div>
          </div>
          <div className="hero-float float-ready"><span><Check size={14} /></span><div><b>Brand preview</b><small>Updates as you customise</small></div></div>
          <div className="hero-float float-languages"><Globe2 size={17} /><div><b>Made for your audience</b><small>ગુજરાતી · हिन्दी · English</small></div></div>
        </div>
      </section>

      <section className="landing-stats" aria-label="NewsForge capabilities">
        <div><strong>09</strong><span>Starting layouts</span></div><div><strong>03</strong><span>Interface languages</span></div><div><strong>WP</strong><span>WordPress-ready setup</span></div><div><strong>01</strong><span>Focused workspace</span></div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-heading"><div><div className="landing-eyebrow">LESS SETUP. MORE STORYTELLING.</div><h2>The essentials for your<br /><em>next newsroom.</em></h2></div><p>Start with a strong foundation, shape the visual identity, then connect the publishing platform you already use.</p></div>
        <div className="landing-feature-grid">
          <article className="landing-feature feature-large"><div className="landing-feature-icon green"><WandSparkles size={21} /></div><span className="feature-number">01 / CUSTOMISE</span><h3>Make it yours</h3><p>Set your publication name, choose Gujarati, Hindi or English, and tune the brand colour to match your identity.</p><div className="mini-brand-preview"><span>G</span><div><b>Your News Brand</b><small>તમારા સમાચાર, તમારી ભાષામાં</small></div><i /></div></article>
          <article className="landing-feature"><div className="landing-feature-icon violet"><Layers3 size={21} /></div><span className="feature-number">02 / LAYOUTS</span><h3>Start with a structure</h3><p>Explore layouts for regional news, broadcast-style desks, business coverage and editorial magazines.</p><div className="mini-layouts"><i /><i /><i /><i /><i /><i /></div></article>
          <article className="landing-feature"><div className="landing-feature-icon amber"><Globe2 size={21} /></div><span className="feature-number">03 / WORDPRESS</span><h3>Connect your site</h3><p>Test a secure HTTPS connection and create starter categories and pages on your WordPress site.</p><div className="wordpress-chip"><span>W</span><b>WordPress connection</b><Check size={15} /></div></article>
          <article className="landing-feature"><div className="landing-feature-icon red"><Zap size={21} /></div><span className="feature-number">04 / EXPORT</span><h3>Keep your setup portable</h3><p>Generate and download your current website configuration as JSON to use as a setup reference.</p><div className="export-chip"><span>{'{ }'}</span><div><b>news-brand-config.json</b><small>Configuration export</small></div><Check size={15} /></div></article>
        </div>
      </section>

      <section className="landing-template-section" id="templates">
        <div className="landing-section-heading"><div><div className="landing-eyebrow">FIND YOUR EDITORIAL STYLE</div><h2>A starting point for<br /><em>every kind of newsroom.</em></h2></div><Link href="/studio" className="landing-text-link">View all layouts in Studio <ArrowRight size={16} /></Link></div>
        <div className="landing-template-grid">
          {templates.map((template) => <article className="landing-template-card" key={template.name}>
            <div className={'template-art ' + template.tone} style={{ '--template-accent': template.accent } as React.CSSProperties}>
              <div className="template-art-masthead"><i /> <span>{template.name.toUpperCase()}</span><b>● LIVE</b></div><div className="template-art-nav" />
              <div className="template-art-main"><div><i /><i /><i /><b /></div><span><i /><i /><i /></span></div><div className="template-art-footer"><i /><i /><i /></div>
            </div>
            <div className="landing-template-info"><div><h3>{template.name}</h3><span>{template.tag}</span></div><Link href="/studio" aria-label={'Choose ' + template.name}><ArrowRight size={17} /></Link></div>
          </article>)}
        </div>
        <div className="landing-template-note"><Sparkles size={16} /><span>More choices are available in the studio, with searchable layouts and a live preview.</span><Link href="/studio">Explore the library <ArrowRight size={14} /></Link></div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-eyebrow">A CLEAR PATH FROM IDEA TO SETUP</div><h2>Three steps to get<br /><em>your newsroom started.</em></h2>
        <div className="landing-steps">{steps.map(step => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div><ChevronRight size={19} /></article>)}</div>
        <div className="landing-disclaimer"><ShieldCheck size={17} /><p><b>Honest by design.</b> NewsForge currently generates a website configuration and can publish starter WordPress pages/categories. It does not yet provision hosting, install a theme, or automatically publish full news articles.</p></div>
      </section>

      <section className="landing-cta">
        <div className="cta-glow" /><div className="landing-eyebrow">YOUR NEXT STORY DESERVES A HOME</div><h2>Ready to shape your<br />digital newsroom?</h2><p>Open the studio, customise your brand and preview a layout for your publication.</p><Link href="/studio" className="landing-primary">Open NewsForge Studio <ArrowRight size={17} /></Link>
      </section>

      <footer className="landing-footer"><Link href="/" className="landing-brand"><span className="landing-brand-mark"><Layers3 size={19} /></span><span>newsforge<span>.ai</span><small>NEWSROOM WEBSITE STUDIO</small></span></Link><span>Built for the next generation of newsrooms.</span><div><a href="#features">Features</a><a href="#templates">Templates</a><Link href="/studio">Studio</Link></div><small>© {new Date().getFullYear()} NewsForge AI</small></footer>
    </main>
  );
}
