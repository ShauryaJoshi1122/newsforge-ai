import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ThemeConfig = {
  siteName: string;
  language: "en" | "gu" | "hi";
  templateId: string;
  templateName: string;
  branding: { primaryColor: string };
  features: string[];
  categories: string[];
  homepage: { headline: string; description: string; tickerText: string };
};

const featureIds = new Set(["breaking-ticker", "live-tv", "ad-slots", "social-links"]);
const cleanText = (value: unknown, max: number, fallback = "") =>
  typeof value === "string" ? value.trim().slice(0, max) : fallback;

function validateConfig(value: unknown): ThemeConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const branding = input.branding && typeof input.branding === "object" ? input.branding as Record<string, unknown> : {};
  const homepage = input.homepage && typeof input.homepage === "object" ? input.homepage as Record<string, unknown> : {};
  const siteName = cleanText(input.siteName, 80);
  const color = cleanText(branding.primaryColor, 7, "#16845b");
  const language = input.language;
  if (!siteName || !/^#[0-9a-fA-F]{6}$/.test(color) || !["en", "gu", "hi"].includes(String(language))) return null;
  const categories = Array.isArray(input.categories)
    ? input.categories.filter((item): item is string => typeof item === "string").map(item => item.trim().replace(/\s+/g, " ").slice(0, 24)).filter(Boolean).slice(0, 12)
    : [];
  const features = Array.isArray(input.features)
    ? input.features.filter((item): item is string => typeof item === "string" && featureIds.has(item))
    : [];
  return {
    siteName,
    language: language as ThemeConfig["language"],
    templateId: cleanText(input.templateId, 80),
    templateName: cleanText(input.templateName, 100, "NewsForge News"),
    branding: { primaryColor: color },
    features: [...new Set(features)],
    categories: categories.length ? [...new Set(categories)] : ["Latest", "Local", "India", "World"],
    homepage: {
      headline: cleanText(homepage.headline, 160, "The latest stories that matter to your community"),
      description: cleanText(homepage.description, 240, "News and updates for your community."),
      tickerText: cleanText(homepage.tickerText, 180, "Latest updates from our newsroom")
    }
  };
}

function phpString(value: string): string {
  return "'" + value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\u0000/g, "") + "'";
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files: Array<{ name: string; content: string }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.content, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const config = validateConfig(body.config);
  if (!config) return NextResponse.json({ error: "Generate a valid website configuration before exporting a WordPress theme." }, { status: 400 });

  const slug = config.siteName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "newsforge-news";
  const configPhp = "<?php\nreturn " + [
    "array(",
    "  'site_name' => " + phpString(config.siteName) + ",",
    "  'primary_color' => " + phpString(config.branding.primaryColor) + ",",
    "  'language' => " + phpString(config.language) + ",",
    "  'headline' => " + phpString(config.homepage.headline) + ",",
    "  'description' => " + phpString(config.homepage.description) + ",",
    "  'ticker_text' => " + phpString(config.homepage.tickerText) + ",",
    "  'categories' => array(" + config.categories.map(phpString).join(", ") + "),",
    "  'features' => array(" + config.features.map(phpString).join(", ") + "),",
    ")"
  ].join("\n") + ";\n";

  const files = [
    { name: slug + "/style.css", content: "/*\nTheme Name: " + config.siteName.replace(/[\r\n*]/g, " ").slice(0, 70) + "\nDescription: A NewsForge-generated responsive news theme.\nVersion: 1.0.0\nRequires at least: 6.0\nRequires PHP: 8.0\nLicense: GPL-2.0-or-later\nText Domain: " + slug + "\n*/\n:root{--nf-accent:" + config.branding.primaryColor + ";--nf-ink:#15202b;--nf-muted:#667085;--nf-line:#e6eaf0;--nf-paper:#fff;--nf-soft:#f4f7fa}*{box-sizing:border-box}body{margin:0;background:var(--nf-paper);color:var(--nf-ink);font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}a{color:var(--nf-accent);text-decoration:none}a:hover{text-decoration:underline}.nf-wrap{width:min(1120px,calc(100% - 32px));margin:auto}.nf-top{background:var(--nf-ink);color:#fff;font-size:13px;padding:7px 0}.nf-masthead{padding:22px 0;border-bottom:1px solid var(--nf-line)}.nf-brand{font-size:clamp(25px,4vw,38px);font-weight:850;line-height:1.2;color:var(--nf-ink);letter-spacing:-.04em}.nf-brand span{color:var(--nf-accent)}.nf-tagline{color:var(--nf-muted);font-size:13px;margin-top:4px}.nf-nav{display:flex;gap:22px;flex-wrap:wrap;padding:12px 0;border-bottom:3px solid var(--nf-accent);font-weight:650;font-size:14px}.nf-nav a{color:var(--nf-ink)}.nf-ticker{display:flex;gap:12px;align-items:center;background:#fff5f5;border-bottom:1px solid #ffdede;padding:10px 14px;margin:18px 0;color:#8a1c1c}.nf-ticker strong{background:#c62828;color:white;padding:3px 8px;font-size:11px;letter-spacing:.08em}.nf-hero{padding:34px 0 24px}.nf-eyebrow{text-transform:uppercase;letter-spacing:.12em;color:var(--nf-accent);font-size:11px;font-weight:800}.nf-hero h1{font-size:clamp(30px,5vw,54px);line-height:1.13;letter-spacing:-.04em;margin:10px 0 12px;max-width:850px}.nf-hero p{font-size:18px;color:var(--nf-muted);max-width:760px;margin:0}.nf-section-title{font-size:22px;border-left:4px solid var(--nf-accent);padding-left:12px;margin:32px 0 18px}.nf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:40px}.nf-card{border:1px solid var(--nf-line);border-radius:12px;padding:20px;background:#fff;min-height:150px}.nf-card h2{font-size:19px;line-height:1.35;margin:8px 0}.nf-card p{color:var(--nf-muted);margin:0}.nf-pill{display:inline-block;color:var(--nf-accent);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.nf-footer{margin-top:40px;padding:28px 0;background:#f4f7fa;border-top:1px solid var(--nf-line);color:var(--nf-muted);font-size:13px}.nf-article{max-width:820px;padding:36px 0}.nf-article h1{font-size:clamp(30px,5vw,48px);line-height:1.15}.nf-content{overflow-wrap:anywhere}.nf-content img{max-width:100%;height:auto}@media(max-width:720px){.nf-grid{grid-template-columns:1fr}.nf-nav{gap:12px;font-size:13px}.nf-hero{padding-top:24px}}\n" },
    { name: slug + "/functions.php", content: "<?php\nif (!defined('ABSPATH')) { exit; }\nfunction " + "nf_" + slug.replace(/-/g, "_") + "_setup() { add_theme_support('title-tag'); add_theme_support('post-thumbnails'); add_theme_support('responsive-embeds'); register_nav_menus(array('primary' => __('Primary Menu', '" + slug + "'))); }\nadd_action('after_setup_theme', '" + "nf_" + slug.replace(/-/g, "_") + "_setup');\nfunction " + "nf_" + slug.replace(/-/g, "_") + "_assets() { wp_enqueue_style('" + slug + "-style', get_stylesheet_uri(), array(), '1.0.0'); }\nadd_action('wp_enqueue_scripts', '" + "nf_" + slug.replace(/-/g, "_") + "_assets');\nfunction " + "nf_" + slug.replace(/-/g, "_") + "_config() { static $config = null; if ($config === null) { $config = require get_template_directory() . '/theme-config.php'; } return $config; }\n" },
    { name: slug + "/theme-config.php", content: configPhp },
    { name: slug + "/header.php", content: "<?php if (!defined('ABSPATH')) { exit; } $nf = " + "nf_" + slug.replace(/-/g, "_") + "_config(); ?><!doctype html><html <?php language_attributes(); ?>><head><meta charset=\"<?php bloginfo('charset'); ?>\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><?php wp_head(); ?></head><body <?php body_class(); ?>><div class=\"nf-top\"><div class=\"nf-wrap\"><?php echo esc_html(get_bloginfo('description')); ?></div></div><header class=\"nf-masthead\"><div class=\"nf-wrap\"><a class=\"nf-brand\" href=\"<?php echo esc_url(home_url('/')); ?>\"><?php echo esc_html($nf['site_name']); ?><span>.</span></a><div class=\"nf-tagline\"><?php echo esc_html($nf['description']); ?></div></div></header><div class=\"nf-wrap\"><nav class=\"nf-nav\" aria-label=\"Primary navigation\"><?php if (has_nav_menu('primary')) { wp_nav_menu(array('theme_location'=>'primary','container'=>false,'items_wrap'=>'%3$s')); } else { foreach ($nf['categories'] as $cat) { echo '<a href=\"' . esc_url(home_url('/?s=' . rawurlencode($cat))) . '\">' . esc_html($cat) . '</a>'; } } ?></nav><?php if (in_array('breaking-ticker', $nf['features'], true)) : ?><div class=\"nf-ticker\"><strong><?php esc_html_e('BREAKING', '" + slug + "'); ?></strong><span><?php echo esc_html($nf['ticker_text']); ?></span></div><?php endif; ?></div>" },
    { name: slug + "/footer.php", content: "<footer class=\"nf-footer\"><div class=\"nf-wrap\"><?php echo esc_html(get_bloginfo('name')); ?> · <?php echo esc_html(wp_date('Y')); ?> · <?php esc_html_e('Powered by WordPress', '" + slug + "'); ?></div></footer><?php wp_footer(); ?></body></html>" },
    { name: slug + "/front-page.php", content: "<?php get_header(); $nf = " + "nf_" + slug.replace(/-/g, "_") + "_config(); ?><main class=\"nf-wrap\"><section class=\"nf-hero\"><span class=\"nf-eyebrow\"><?php esc_html_e('Newsroom', '" + slug + "'); ?></span><h1><?php echo esc_html($nf['headline']); ?></h1><p><?php echo esc_html($nf['description']); ?></p></section><h2 class=\"nf-section-title\"><?php esc_html_e('Latest stories', '" + slug + "'); ?></h2><div class=\"nf-grid\"><?php if (have_posts()) : while (have_posts()) : the_post(); ?><article class=\"nf-card\"><span class=\"nf-pill\"><?php echo esc_html(get_the_date()); ?></span><h2><a href=\"<?php the_permalink(); ?>\"><?php the_title(); ?></a></h2><p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 24)); ?></p></article><?php endwhile; else : ?><article class=\"nf-card\"><span class=\"nf-pill\"><?php esc_html_e('Ready for your stories', '" + slug + "'); ?></span><h2><?php esc_html_e('Your first article will appear here', '" + slug + "'); ?></h2><p><?php esc_html_e('Publish a post in WordPress to populate this section. No sample news is included.', '" + slug + "'); ?></p></article><?php endif; ?></div></main><?php get_footer(); ?>" },
    { name: slug + "/index.php", content: "<?php get_header(); ?><main class=\"nf-wrap\"><h1 class=\"nf-section-title\"><?php echo esc_html(is_home() ? get_bloginfo('name') : get_the_archive_title()); ?></h1><div class=\"nf-grid\"><?php if (have_posts()) : while (have_posts()) : the_post(); ?><article class=\"nf-card\"><?php if (has_post_thumbnail()) { the_post_thumbnail('medium_large', array('loading'=>'lazy')); } ?><span class=\"nf-pill\"><?php echo esc_html(get_the_date()); ?></span><h2><a href=\"<?php the_permalink(); ?>\"><?php the_title(); ?></a></h2><p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 24)); ?></p></article><?php endwhile; the_posts_pagination(); else : ?><p><?php esc_html_e('No published posts yet.', '" + slug + "'); ?></p><?php endif; ?></div></main><?php get_footer(); ?>" },
    { name: slug + "/single.php", content: "<?php get_header(); ?><main class=\"nf-wrap nf-article\"><?php while (have_posts()) : the_post(); ?><article class=\"nf-content\"><span class=\"nf-pill\"><?php echo esc_html(get_the_date()); ?> · <?php the_category(', '); ?></span><h1><?php the_title(); ?></h1><p><?php echo esc_html(get_the_author()); ?></p><?php if (has_post_thumbnail()) { the_post_thumbnail('large'); } ?><div class=\"nf-content\"><?php the_content(); ?></div><?php the_post_navigation(); ?></article><?php endwhile; ?></main><?php get_footer(); ?>" },
    { name: slug + "/page.php", content: "<?php get_header(); ?><main class=\"nf-wrap nf-article\"><?php while (have_posts()) : the_post(); ?><article class=\"nf-content\"><h1><?php the_title(); ?></h1><?php the_content(); ?></article><?php endwhile; ?></main><?php get_footer(); ?>" },
    { name: slug + "/archive.php", content: "<?php get_header(); ?><main class=\"nf-wrap\"><h1 class=\"nf-section-title\"><?php the_archive_title(); ?></h1><div class=\"nf-grid\"><?php if (have_posts()) : while (have_posts()) : the_post(); ?><article class=\"nf-card\"><span class=\"nf-pill\"><?php echo esc_html(get_the_date()); ?></span><h2><a href=\"<?php the_permalink(); ?>\"><?php the_title(); ?></a></h2><p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 24)); ?></p></article><?php endwhile; the_posts_pagination(); endif; ?></div></main><?php get_footer(); ?>" },
    { name: slug + "/README.txt", content: config.siteName + " - NewsForge WordPress Theme\n\nInstallation\n1. In WordPress, go to Appearance > Themes > Add New Theme > Upload Theme.\n2. Upload this ZIP file and choose Install Now, then Activate.\n3. Review Appearance > Menus and create/assign your Primary Menu if needed.\n4. Publish your own WordPress posts; this theme intentionally includes no fabricated news stories.\n\nGenerated layout: " + config.templateName + "\nPrimary color: " + config.branding.primaryColor + "\nLanguage preference: " + config.language + "\n\nThis is a starter theme generated from your NewsForge design configuration. Review it on a staging site before production use. Hosting and WordPress installation are not included.\n" }
  ];
  const zip = makeZip(files);
  return new Response(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="' + slug + '-wordpress-theme.zip"',
      "Cache-Control": "no-store",
      "Content-Length": String(zip.length)
    }
  });
}
