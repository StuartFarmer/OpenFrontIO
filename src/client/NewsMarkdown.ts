import { html, type TemplateResult } from "lit";

const GITHUB_PR_URL_REGEX =
  /(?<!\()\bhttps:\/\/github\.com\/openfrontio\/OpenFrontIO\/pull\/(\d+)\b/g;
const GITHUB_COMPARE_URL_REGEX =
  /(?<!\()\bhttps:\/\/github\.com\/openfrontio\/OpenFrontIO\/compare\/([\w.-]+)\b/g;
const GITHUB_MENTION_REGEX =
  /(^|[^\w/[`])@([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)(?![\w-])/gim;

export function normalizeNewsMarkdown(markdown: string): string {
  return (
    markdown
      // Convert bold header lines (e.g. "**Title**") into real Markdown headers.
      // Exclude lines starting with - or * to avoid converting bullet points.
      .replace(/^([^\-*\s].*?) \*\*(.+?)\*\*$/gm, "## $1 $2")
      .replace(
        GITHUB_PR_URL_REGEX,
        (_match, prNumber) =>
          `[#${prNumber}](https://github.com/openfrontio/OpenFrontIO/pull/${prNumber})`,
      )
      .replace(
        GITHUB_COMPARE_URL_REGEX,
        (_match, comparison) =>
          `[${comparison}](https://github.com/openfrontio/OpenFrontIO/compare/${comparison})`,
      )
      .replace(
        GITHUB_MENTION_REGEX,
        (_match, prefix, username) =>
          `${prefix}[@${username}](https://github.com/${username})`,
      )
  );
}

type MarkdownNode = string | TemplateResult;

interface MarkdownRenderOptions {
  includeImages?: boolean;
}

const INLINE_MARKDOWN_REGEX =
  /(!?)\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

function safeMarkdownUrl(url: string): string {
  if (url.startsWith("#") || url.startsWith("/")) return url;

  try {
    const parsed = new URL(url, "http://localhost");
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    ) {
      return url;
    }
  } catch {
    // Fall through to inert link.
  }

  return "#";
}

export function renderMarkdownInline(
  markdown: string,
  options: MarkdownRenderOptions = {},
): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of markdown.matchAll(INLINE_MARKDOWN_REGEX)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(markdown.slice(cursor, index));
    }

    const [, imageMarker, linkText, linkUrl, boldText, codeText] = match;

    if (linkText !== undefined && linkUrl !== undefined) {
      const href = safeMarkdownUrl(linkUrl);
      if (imageMarker === "!") {
        if (options.includeImages) {
          nodes.push(html`<img src=${href} alt=${linkText} loading="lazy" />`);
        } else {
          nodes.push(linkText);
        }
      } else {
        nodes.push(
          html`<a href=${href} target="_blank" rel="noopener noreferrer"
            >${linkText}</a
          >`,
        );
      }
    } else if (boldText !== undefined) {
      nodes.push(html`<strong>${boldText}</strong>`);
    } else if (codeText !== undefined) {
      nodes.push(html`<code>${codeText}</code>`);
    }

    cursor = index + match[0].length;
  }

  if (cursor < markdown.length) {
    nodes.push(markdown.slice(cursor));
  }

  return nodes;
}

export function renderMarkdown(
  markdown: string,
  options: MarkdownRenderOptions = {},
): TemplateResult[] {
  const blocks: TemplateResult[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading !== null) {
      const [, marks, text] = heading;
      if (marks.length === 1) {
        blocks.push(html`<h1>${renderMarkdownInline(text, options)}</h1>`);
      } else if (marks.length === 2) {
        blocks.push(html`<h2>${renderMarkdownInline(text, options)}</h2>`);
      } else {
        blocks.push(html`<h3>${renderMarkdownInline(text, options)}</h3>`);
      }
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem !== null) {
      const items: string[] = [listItem[1]];
      while (i + 1 < lines.length) {
        const next = /^[-*]\s+(.+)$/.exec(lines[i + 1].trim());
        if (next === null) break;
        items.push(next[1]);
        i++;
      }

      blocks.push(
        html`<ul>
          ${items.map(
            (item) => html`<li>${renderMarkdownInline(item, options)}</li>`,
          )}
        </ul>`,
      );
      continue;
    }

    const paragraphLines = [line];
    while (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (
        next.length === 0 ||
        /^(#{1,3})\s+/.test(next) ||
        /^[-*]\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i++;
    }

    blocks.push(
      html`<p>${renderMarkdownInline(paragraphLines.join(" "), options)}</p>`,
    );
  }

  return blocks;
}
