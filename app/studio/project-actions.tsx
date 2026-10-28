"use client";

import { useState } from "react";
import { Check, Clock3, ExternalLink, Globe2, LoaderCircle, ShieldCheck, UploadCloud } from "lucide-react";

type ProjectConfig = {
  siteName: string; language: string; templateId: string; templateName: string;
  branding: { primaryColor: string }; features: string[]; categories: string[];
  pages: string[]; homepage: { headline: string; description: string; tickerText: string }; generatedAt: string;
};
type Project = { id: string; slug: string; previewUrl: string; createdAt: string; expiresAt: string | null };

export default function ProjectActions({ config }: { config: ProjectConfig }) {
  const [project, setProject] = useState<Project | null>(null);
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [domainDetails, setDomainDetails] = useState("");

  useEffect(() => {
    try {
      const savedProject = sessionStorage.getItem("newsforge-current-project");
      const savedToken = sessionStorage.getItem("newsforge-project-token");
      if (savedProject && savedToken) {
        setProject(JSON.parse(savedProject) as Project);
        setToken(savedToken);
      }
    } catch { /* Ignore stale browser session data. */ }
  }, []);

  async function saveProject() {
    setBusy("save"); setMessage(""); setDomainDetails("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save project.");
      setProject(data.project as Project);
      setToken(data.managementToken as string);
      sessionStorage.setItem("newsforge-current-project", JSON.stringify(data.project));
      sessionStorage.setItem("newsforge-project-token", data.managementToken);
      setMessage("Project saved. This preview expires in 24 hours unless you publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save project.");
    } finally { setBusy(""); }
  }

  async function publishPermanent() {
    if (!project || !token) return;
    if (!window.confirm("Publish this preview permanently? Its 24-hour expiry will be removed, and it will remain hosted on NewsForge until you remove it.")) return;
    setBusy("publish"); setMessage("");
    try {
      const response = await fetch("/api/projects/" + encodeURIComponent(project.slug) + "/publish", {
        method: "POST", headers: { Authorization: "Bearer " + token }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not publish project.");
      setProject({ ...project, expiresAt: null });
      sessionStorage.setItem("newsforge-current-project", JSON.stringify({ ...project, expiresAt: null }));
      setMessage("Published permanently on the NewsForge preview host. Connect a custom domain below if you want your own address.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not publish project."); }
    finally { setBusy(""); }
  }

  async function connectDomain(action: "connect" | "verify" = "connect") {
    if (!project || !token || !domain.trim()) return;
    setBusy("domain"); setMessage(""); setDomainDetails("");
    try {
      const response = await fetch("/api/projects/" + encodeURIComponent(project.slug) + "/domain", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ domain: domain.trim(), ...(action === "verify" ? { action: "verify" } : {}) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not connect custom domain.");
      const records = Array.isArray(data.dnsInstructions) ? data.dnsInstructions as Array<{ type?: string; domain?: string; value?: string; reason?: string }> : [];
      const recordText = records.length ? " DNS records: " + records.map(record => [record.type, record.domain, record.value, record.reason].filter(Boolean).join(" — ")).join("; ") : "";
      setDomainDetails(data.verified
        ? "Domain verified. DNS and HTTPS status may take a few minutes to settle."
        : "Domain added, but ownership verification is still required. Open your Vercel project → Settings → Domains and follow the exact DNS verification instructions there." + recordText);
      setMessage(data.message || "Domain request processed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not connect domain."); }
    finally { setBusy(""); }
  }

  return <section className="project-actions-card">
    <div className="project-actions-heading"><span><Globe2 size={18}/></span><div><h3>Save, preview & publish</h3><p>Save this configuration to a database, get a unique URL and manage its expiry.</p></div></div>
    {!project ? <button className="project-primary" onClick={saveProject} disabled={!!busy}>
      {busy === "save" ? <LoaderCircle size={16} className="spin"/> : <ShieldCheck size={16}/>} Save project & create preview
    </button> : <>
      <div className="project-url-row"><div><small>YOUR PREVIEW URL</small><a href={project.previewUrl} target="_blank" rel="noreferrer">{project.previewUrl}</a></div><a className="project-open" href={project.previewUrl} target="_blank" rel="noreferrer" aria-label="Open saved preview"><ExternalLink size={16}/></a></div>
      <div className="project-expiry"><Clock3 size={15}/>{project.expiresAt ? "Temporary preview · expires " + new Date(project.expiresAt).toLocaleString() : "Permanent NewsForge hosting · no expiry"}</div>
      {project.expiresAt && <button className="project-primary" onClick={publishPermanent} disabled={!!busy}>{busy === "publish" ? <LoaderCircle size={16} className="spin"/> : <UploadCloud size={16}/>} Publish permanently</button>}
      <div className="project-domain-form"><label htmlFor="project-domain">Connect your own domain</label><div><input id="project-domain" value={domain} onChange={event => setDomain(event.target.value)} placeholder="news.example.com"/><button onClick={() => connectDomain("connect")} disabled={!!busy || !domain.trim()}>{busy === "domain" ? <LoaderCircle size={15} className="spin"/> : <Globe2 size={15}/>} Connect</button></div><button className="project-verify-domain" onClick={() => connectDomain("verify")} disabled={!!busy || !domain.trim()}>{busy === "domain" ? <LoaderCircle size={14} className="spin"/> : <ShieldCheck size={14}/>} Verify domain after DNS setup</button><small>Requires Vercel domain API credentials and DNS verification. Your domain provider may need a DNS record.</small></div>
    </>}
    {message && <p className={"project-message " + (message.startsWith("Project saved") || message.startsWith("Published") ? "ok" : "info")}>{message.startsWith("Project saved") || message.startsWith("Published") ? <Check size={15}/> : <ShieldCheck size={15}/>} {message}</p>}
    {domainDetails && <p className="project-domain-note">{domainDetails}</p>}
  </section>;
}
