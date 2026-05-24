import { svg } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { IconNode } from "lucide";

export function renderLucideIcon(icon: IconNode, className = "h-4 w-4") {
  const children = icon
    .map(([tag, attrs]) => {
      const attrText = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      return `<${tag} ${attrText}></${tag}>`;
    })
    .join("");

  return svg`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class=${className}
      aria-hidden="true"
    >
      ${unsafeSVG(children)}
    </svg>
  `;
}
