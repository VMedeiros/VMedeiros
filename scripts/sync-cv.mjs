// Fills the README sections that mirror the CV, so the profile never drifts
// from it. The CV (https://victor-medeiros-cv.web.app, repo curriculum-vitae)
// is the source: this reads it with the same function that builds its PDF and
// DOCX (collectCvBlocks), in English.
//
//   node scripts/sync-cv.mjs                  read the live CV
//   CV_SOURCE=../curriculum-vitae/src/index.html node scripts/sync-cv.mjs
//
// Only the blocks between <!-- cv:NAME --> and <!-- /cv:NAME --> change; the
// rest of the README (projects, stats, "Currently") is edited by hand.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const README = new URL("../README.md", import.meta.url);
const source = process.env.CV_SOURCE ?? "https://victor-medeiros-cv.web.app/";
const url = new URL(/^https?:/.test(source) ? source : pathToFileURL(path.resolve(source)).href);
url.searchParams.set("lang", "en");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url.href, { waitUntil: "networkidle" });
const blocks = await page.evaluate(() => collectCvBlocks());
await browser.close();

const plain = (segments = []) => segments.map((s) => s.text).join("");
const html = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const cell = (text) => text.replaceAll("|", String.raw`\|`);

// Bold and links become Markdown. Neighbouring segments with the same style are
// joined first (the CV's bold "9" and "+ years" are one bold run), and the
// spaces around a bold run stay outside the asterisks.
function markdown(segments) {
  const runs = [];
  for (const seg of segments) {
    const last = runs.at(-1);
    if (last && !last.bold === !seg.bold && last.link === seg.link) last.text += seg.text;
    else runs.push({ ...seg });
  }
  return runs
    .map((run) => {
      let text = run.text;
      const body = text.trim();
      if (run.bold && body) {
        const lead = text.slice(0, text.length - text.trimStart().length);
        const trail = text.slice(text.trimEnd().length);
        text = `${lead}**${body}**${trail}`;
      }
      return run.link ? `[${text}](${run.link})` : text;
    })
    .join("");
}

// "AWS (S3, CloudFront)" stays one item.
const items = (text) => text.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
const ofKind = (kind) => blocks.filter((b) => b.kind === kind);
const firstRole = blocks.findIndex((b) => b.kind === "role");

const sections = {
  header: () => {
    const name = plain(ofKind("name")[0].text);
    const headline = plain(ofKind("headline")[0].text);
    return `<h1 align="center">${html(name)}</h1>\n\n<p align="center">\n  <strong>${html(headline)}</strong>\n</p>`;
  },
  about: () => markdown(ofKind("summary")[0].text),
  achievements: () =>
    blocks
      .slice(0, firstRole)
      .filter((b) => b.kind === "bullet")
      .map((b) => `- ${markdown(b.text)}`)
      .join("\n"),
  stack: () =>
    [
      "<table>",
      ...ofKind("skill").map(
        (b) => `  <tr>\n    <td><strong>${html(plain(b.title))}</strong></td>\n    <td>${html(items(plain(b.list)).join(" · "))}</td>\n  </tr>`,
      ),
      "</table>",
    ].join("\n"),
  experience: () => {
    const rows = [];
    blocks.forEach((block, i) => {
      if (block.kind !== "role") return;
      const company = blocks.slice(i + 1).find((b) => b.kind === "company");
      const where = plain(company.location).replace(/^\|/, "").trim();
      rows.push(`| ${cell(plain(block.period))} | ${cell(plain(block.role))} | **${cell(company.company)}** · ${cell(where)} |`);
    });
    return ["| Period | Role | Company |", "| --- | --- | --- |", ...rows].join("\n");
  },
  languages: () => {
    const langs = ofKind("language");
    return [
      `| ${langs.map((l) => cell(plain(l.name))).join(" | ")} |`,
      `| ${langs.map(() => ":-:").join(" | ")} |`,
      `| ${langs.map((l) => cell(plain(l.level))).join(" | ")} |`,
    ].join("\n");
  },
  education: () =>
    blocks
      .map((b, i) => (b.kind === "degree" ? `- **${plain(b.text)}**, ${plain(blocks[i + 1]?.text ?? [])}` : null))
      .filter(Boolean)
      .join("\n"),
  certifications: () =>
    ofKind("certification")
      .map((b) => `- **${plain(b.title)}:** ${plain(b.list)}`)
      .join("\n"),
};

let readme = await readFile(README, "utf8");
for (const [name, render] of Object.entries(sections)) {
  const pattern = new RegExp(`(<!-- cv:${name} -->)[\\s\\S]*?(<!-- /cv:${name} -->)`);
  if (!pattern.test(readme)) throw new Error(`README.md has no <!-- cv:${name} --> block`);
  const content = render();
  if (!content.trim()) throw new Error(`The CV gave no content for "${name}"`);
  readme = readme.replace(pattern, (_, open, close) => `${open}\n${content}\n${close}`);
}
await writeFile(README, readme);
console.log(`README.md synced with ${url.href}`);
