import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { NewsItem } from "../../core/ApiSchemas";
import { getNews } from "../Api";
import { renderMarkdownInline } from "../NewsMarkdown";
import { translateText } from "../Utils";
import "./ui";

export type { NewsItem };

const DISMISSED_NEWS_KEY = "dismissedNewsItems";
const CYCLE_INTERVAL_MS = 5000;

function getDismissedIds(): Set<string> {
  const raw = localStorage.getItem(DISMISSED_NEWS_KEY);
  if (raw) return new Set(JSON.parse(raw));
  return new Set();
}

function saveDismissedIds(ids: Set<string>): void {
  localStorage.setItem(DISMISSED_NEWS_KEY, JSON.stringify([...ids]));
}

export function getVisibleNewsItems(items: NewsItem[]): NewsItem[] {
  const dismissed = getDismissedIds();
  return items.filter((item) => !dismissed.has(item.id));
}

const typeLabelKeys: Record<string, string> = {
  tournament: "news_box.tournament",
  tutorial: "news_box.tutorial",
  announcement: "news_box.news",
  warning: "news_box.warning",
};

const typeLabelTones: Record<
  string,
  "gold" | "primary" | "success" | "danger"
> = {
  tournament: "gold",
  tutorial: "primary",
  announcement: "success",
  warning: "danger",
};

@customElement("news-box")
export class NewsBox extends LitElement {
  @state() private items: NewsItem[] = [];
  @state() private activeIndex = 0;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadNews();
  }

  private async loadNews() {
    try {
      const allItems = await getNews();
      // Reset stale dismissed list when all items would be hidden
      const visible = getVisibleNewsItems(allItems);
      if (visible.length === 0 && allItems.length > 0) {
        localStorage.removeItem(DISMISSED_NEWS_KEY);
        this.items = allItems;
      } else {
        this.items = visible;
      }
      this.startCycle();
    } catch (e) {
      console.error(e);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCycle();
  }

  private startCycle() {
    this.stopCycle();
    if (this.items.length > 1) {
      this.cycleTimer = setInterval(() => {
        this.activeIndex = (this.activeIndex + 1) % this.items.length;
      }, CYCLE_INTERVAL_MS);
    }
  }

  private stopCycle() {
    if (this.cycleTimer !== null) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  private dismiss(id: string) {
    const dismissed = getDismissedIds();
    dismissed.add(id);
    saveDismissedIds(dismissed);
    this.items = this.items.filter((item) => item.id !== id);
    if (this.activeIndex >= this.items.length) {
      this.activeIndex = 0;
    }
    this.startCycle();
  }

  private goTo(index: number) {
    this.activeIndex = index;
    this.startCycle();
  }

  render() {
    if (this.items.length === 0) return nothing;

    const item = this.items[this.activeIndex];

    return html`
      <ui-surface
        class="block"
        style="--ui-radius: 12px; --ui-surface-shadow: none; --ui-surface-bg: rgba(15, 23, 42, 0.72); --ui-surface-border: rgba(255, 255, 255, 0.1);"
      >
        <ui-surface-body style="--ui-surface-body-padding: 0.5rem 0.75rem;">
          <div class="flex items-center gap-3">
            <ui-pill
              class="shrink-0"
              tone=${typeLabelTones[item.type] ??
              typeLabelTones["announcement"]}
              style="--ui-pill-font-size: 10px; --ui-pill-padding: 0.125rem 0.5rem;"
              >${translateText(
                typeLabelKeys[item.type] ?? typeLabelKeys["announcement"],
              )}</ui-pill
            >
            <div class="flex-1 min-w-0">
              ${item.url
                ? html`<a
                    href="${item.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm font-medium text-white hover:text-blue-300 transition-colors truncate block"
                    >${item.title}</a
                  >`
                : html`<span
                    class="text-sm font-medium text-white truncate block"
                    >${item.title}</span
                  >`}
              <span
                class="text-xs text-white/50 block [&_a]:text-blue-300 [&_a:hover]:text-blue-200"
                >${renderMarkdownInline(
                  item.descriptionTranslationKey
                    ? translateText(item.descriptionTranslationKey)
                    : (item.description ?? ""),
                )}</span
              >
            </div>
            ${this.items.length > 1
              ? html`
                  <div class="flex gap-1 shrink-0">
                    ${this.items.map(
                      (_, i) => html`
                        <button
                          @click=${() => this.goTo(i)}
                          class="w-1.5 h-1.5 rounded-full transition-colors ${i ===
                          this.activeIndex
                            ? "bg-white/60"
                            : "bg-white/20 hover:bg-white/40"}"
                          aria-label="${translateText("news_box.go_to_item", {
                            num: i + 1,
                          })}"
                        ></button>
                      `,
                    )}
                  </div>
                `
              : nothing}
            <ui-icon-button
              size="xs"
              variant="ghost"
              label=${translateText("news_box.dismiss")}
              @click=${() => this.dismiss(item.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-3.5 h-3.5"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </ui-icon-button>
          </div>
        </ui-surface-body>
      </ui-surface>
    `;
  }
}
