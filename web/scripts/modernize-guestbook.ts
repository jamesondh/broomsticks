import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const INPUT_DIR = "../archive/guestbook";
const OUTPUT_DIR = "./public/guestbook";
const JSON_OUTPUT_PATH = "./public/guestbook/data/entries.json";

interface SearchableEntry {
  id: string;
  sourceFile: string;
  name: string;
  from: string;
  date: string;
  comments: string;
  response: string;
  hasResponse: boolean;
}

interface GuestEntry {
  name: string;
  email: string;
  homepage: string;
  homepageUrl: string;
  from: string;
  date: string;
  comments: string;
  response: string;
  id: string;
  wasCommented: boolean;
}

function generateId(date: string, name: string, index: number): string {
  // Create a simple ID from date components and sanitized name
  const dateMatch = date.match(/(\w+)\s+(\w+)\s+(\d+)/);
  if (dateMatch) {
    const [, , month, day] = dateMatch;
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10);
    return `${month.toLowerCase()}${day}-${safeName || "anon"}-${index}`;
  }
  return `entry-${index}`;
}

function parseEntry(tableHtml: string, index: number): GuestEntry | null {
  // Extract the inner content - handle various HTML structures
  // Try to find content with <font> tag first
  let fontMatch = tableHtml.match(/<font[^>]*>([\s\S]*?)<\/font>/i);
  if (!fontMatch) {
    // Try: <ul><font>...content...</ul> (missing </font>)
    fontMatch = tableHtml.match(/<ul><font[^>]*>([\s\S]*?)<\/ul>/i);
  }
  if (!fontMatch) {
    // Fallback: just grab the td content
    fontMatch = tableHtml.match(/<td bgcolor=#e5e5e5>([\s\S]*?)<\/td>/i);
  }
  if (!fontMatch) return null;

  const content = fontMatch[1];

  // Extract name and email
  const nameMatch = content.match(/<li>Name:\s*<a href="mailto:([^"]*)"[^>]*>([^<]*)<\/a>/i);
  const name = nameMatch ? nameMatch[2].trim() : "";
  const email = nameMatch ? nameMatch[1].trim() : "";

  // Extract homepage
  const homepageMatch = content.match(/<li>Homepage:\s*<a href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
  const homepageUrl = homepageMatch ? homepageMatch[1].trim() : "";
  const homepage = homepageMatch ? homepageMatch[2].trim() : "";

  // Extract from
  const fromMatch = content.match(/<li>From:\s*([^<\n]*)/i);
  const from = fromMatch ? fromMatch[1].trim() : "";

  // Extract date
  const dateMatch = content.match(/<li>Date:\s*([^<\n]*)/i);
  const date = dateMatch ? dateMatch[1].trim() : "";

  // Extract comments - everything after "Comments:" up to <em> or end of content
  // First try to get comments that end before a response
  let commentsMatch = content.match(/<li>Comments:\s*([\s\S]*?)(?=<P>\s*<em>)/i);
  if (!commentsMatch) {
    // No response, get comments to end of content (before </font>, </ul>, or end)
    commentsMatch = content.match(/<li>Comments:\s*([\s\S]*?)(?=<\/font>|<\/ul>|$)/i);
  }
  let comments = commentsMatch ? commentsMatch[1].trim() : "";

  // Clean up comments - only <P> and <br> tags should create line breaks
  // Raw newlines in source should be collapsed (like browsers do)
  comments = comments
    .replace(/<P>/gi, "{{PARA}}")
    .replace(/<br\s*\/?>/gi, "{{BR}}")
    // Preserve HTML comments as muted text (before tag stripping)
    .replace(/<!--([\s\S]*?)-->/g, "{{HIDDEN:$1}}")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/\{\{PARA\}\}/g, "\n\n")
    .replace(/\{\{BR\}\}/g, "\n")
    .trim();

  // Extract response (in <em> tags)
  const responseMatch = content.match(/<em>([\s\S]*?)<\/em>/i);
  let response = responseMatch ? responseMatch[1].trim() : "";

  // Preserve links in response, collapse whitespace like browser
  response = response
    .replace(/<P>/gi, "{{PARA}}")
    .replace(/<br\s*\/?>/gi, "{{BR}}")
    .replace(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/\{\{PARA\}\}/g, "\n\n")
    .replace(/\{\{BR\}\}/g, "\n")
    .trim();

  // Normalize image paths to use /images/*.gif
  response = response
    .replace(/\(images\/players\.gif\)/g, "(/images/players.gif)")
    .replace(/\(broomsticksAdvanced\/images\/items\.gif\)/g, "(/images/items.gif)");

  const id = generateId(date, name, index);

  return { name, email, homepage, homepageUrl, from, date, comments, response, id, wasCommented: false };
}

function findHiddenRanges(html: string): Array<{start: number, end: number}> {
  const ranges: Array<{start: number, end: number}> = [];
  const openPattern = /<!--/g;
  const closePattern = /-->/g;

  // Find all comment opens and closes
  const opens: number[] = [];
  const closes: number[] = [];

  let match;
  while ((match = openPattern.exec(html)) !== null) {
    opens.push(match.index);
  }
  while ((match = closePattern.exec(html)) !== null) {
    closes.push(match.index + 3); // Include the --> in the range
  }

  // Match opens with closes (browser behavior)
  let closeIdx = 0;
  for (const open of opens) {
    // Find next close that comes after this open
    while (closeIdx < closes.length && closes[closeIdx] <= open) {
      closeIdx++;
    }

    if (closeIdx < closes.length) {
      ranges.push({ start: open, end: closes[closeIdx] });
      closeIdx++;
    } else {
      // Unclosed comment - extends to end of file
      ranges.push({ start: open, end: html.length });
    }
  }

  return ranges;
}

function isInHiddenRange(position: number, ranges: Array<{start: number, end: number}>): boolean {
  return ranges.some(r => position >= r.start && position < r.end);
}

function extractEntries(html: string): GuestEntry[] {
  const entries: GuestEntry[] = [];
  const hiddenRanges = findHiddenRanges(html);

  // Match each entry table (the outer table with bgcolor=#444444)
  const tablePattern = /<table border=0 cellpadding=0 cellspacing=0><tr><td bgcolor=#444444><table[^>]*>[\s\S]*?<\/table><\/td><\/tr><\/table>/gi;

  let match;
  let index = 0;
  while ((match = tablePattern.exec(html)) !== null) {
    const wasCommented = isInHiddenRange(match.index, hiddenRanges);

    const entry = parseEntry(match[0], index);
    if (entry && (entry.name || entry.comments)) {
      entry.wasCommented = wasCommented;
      entries.push(entry);
      index++;
    }
  }

  return entries;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatComments(text: string): string {
  let formatted = escapeHtml(text);
  // Convert markdown-style links back to HTML
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Convert hidden content placeholder to muted span
  formatted = formatted.replace(/\{\{HIDDEN:([^}]*)\}\}/g, '<span class="inline-hidden">$1</span>');
  // Convert newlines to paragraphs
  formatted = formatted
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return formatted || "<p></p>";
}

function generateModernHtml(entries: GuestEntry[], title: string, backLink: string): string {
  const entriesHtml = entries.map(entry => {
    // Name with optional mailto link
    const nameDisplay = entry.email && entry.email !== "submit" && !entry.email.includes("http")
      ? `<a href="mailto:${escapeHtml(entry.email)}">${escapeHtml(entry.name)}</a>`
      : escapeHtml(entry.name);

    // Homepage - always show, with link if valid URL
    const hasValidHomepage = entry.homepageUrl &&
      entry.homepageUrl !== "http://" &&
      entry.homepageUrl !== "";
    const homepageDisplay = hasValidHomepage
      ? `<a href="${escapeHtml(entry.homepageUrl)}" target="_blank">${escapeHtml(entry.homepage)}</a>`
      : escapeHtml(entry.homepage);

    const responseHtml = entry.response
      ? `<div class="entry-response">${formatComments(entry.response)}</div>`
      : "";

    const commentedIndicator = entry.wasCommented
      ? `<div class="was-commented-indicator">Originally hidden in source</div>`
      : "";

    const entryClass = entry.wasCommented ? "entry was-commented" : "entry";

    return `
    <article class="${entryClass}" id="${entry.id}">
      <a href="#${entry.id}" class="permalink" title="Link to this entry">#</a>
      ${commentedIndicator}
      <dl class="entry-meta">
        <dd><dt>Name:</dt> ${nameDisplay}</dd>
        <dd><dt>Homepage:</dt> ${homepageDisplay}</dd>
        <dd><dt>From:</dt> ${escapeHtml(entry.from)}</dd>
        <dd><dt>Date:</dt> ${escapeHtml(entry.date)}</dd>
      </dl>
      <div class="entry-comments">
        ${formatComments(entry.comments)}
      </div>
      ${responseHtml}
    </article>`.trim();
  }).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/guestbook/guestbook-entry.css">
</head>
<body>
  <div class="container">
    <header>
      <img src="/images/intro.gif" alt="Broomsticks by Paul Rajlich">
      <h1>Guestbook</h1>
    </header>

    <nav class="back-link">
      <a href="${backLink}">Back to top</a>
    </nav>

    <main>
${entriesHtml}
    </main>

    <nav class="back-link">
      <a href="${backLink}">Back to top</a>
    </nav>
  </div>
</body>
</html>`;
}

async function processFile(filename: string): Promise<SearchableEntry[]> {
  const inputPath = join(INPUT_DIR, filename);
  const outputPath = join(OUTPUT_DIR, filename);

  const html = await readFile(inputPath, "latin1");

  if (filename === "guestbook.html") {
    // Skip - the React app serves /guestbook now
    console.log(`Skipping ${filename} - served by React app`);
    return [];
  }

  const entries = extractEntries(html);

  if (entries.length === 0) {
    console.log(`Skipping ${filename} - no entries found`);
    return [];
  }

  // Extract title from filename
  const titleMatch = filename.match(/guests-(.+)\.html/);
  const titlePart = titleMatch ? titleMatch[1] : "Archive";
  const title = `Broomsticks Guestbook - ${titlePart}`;

  const modernHtml = generateModernHtml(entries, title, "/guestbook");
  await writeFile(outputPath, modernHtml);

  console.log(`Processed ${filename}: ${entries.length} entries`);

  // Convert to searchable entries
  return entries.map(entry => ({
    id: entry.id,
    sourceFile: filename,
    name: entry.name,
    from: entry.from,
    date: entry.date,
    comments: entry.comments,
    response: entry.response,
    hasResponse: !!entry.response,
  }));
}

async function main() {
  // Create output directories
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(join(OUTPUT_DIR, "data"), { recursive: true });

  // Get all HTML files
  const files = await readdir(INPUT_DIR);
  const htmlFiles = files.filter(f => f.endsWith(".html"));

  console.log(`Found ${htmlFiles.length} HTML files to process\n`);

  // Collect all searchable entries
  const allEntries: SearchableEntry[] = [];

  for (const file of htmlFiles) {
    const entries = await processFile(file);
    allEntries.push(...entries);
  }

  // Write JSON file for search
  await writeFile(JSON_OUTPUT_PATH, JSON.stringify(allEntries, null, 2));
  console.log(`\nWritten ${allEntries.length} entries to ${JSON_OUTPUT_PATH}`);

  console.log("\nDone! Output written to:", OUTPUT_DIR);
}

main().catch(console.error);
