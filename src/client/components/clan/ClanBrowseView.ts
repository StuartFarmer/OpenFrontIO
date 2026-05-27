import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { type ClanBrowseResponse, fetchClans } from "../../ClanApi";
import { translateText } from "../../Utils";
import "../ui";
import "./ClanCard";
import { type ClanRole, renderLoadingSpinner } from "./ClanShared";

export interface BrowseState {
  data: ClanBrowseResponse | null;
  page: number;
  query: string;
}

@customElement("clan-browse-view")
export class ClanBrowseView extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Object }) myClanRoles: Map<string, ClanRole> = new Map();
  @property({ type: Array }) myPendingRequests: { tag: string }[] = [];
  @property({ type: Object }) cachedState: BrowseState | null = null;

  @state() private searchQuery = "";
  @state() private browseData: ClanBrowseResponse | null = null;
  @state() private browsePage = 1;
  @state() private loading = false;
  @state() private errorMsg = "";
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private asyncGeneration = 0;

  private emitState() {
    this.dispatchEvent(
      new CustomEvent("browse-updated", {
        detail: {
          data: this.browseData,
          page: this.browsePage,
          query: this.searchQuery,
        } satisfies BrowseState,
        bubbles: true,
        composed: true,
      }),
    );
  }

  async loadBrowse() {
    const gen = ++this.asyncGeneration;
    this.loading = true;
    this.errorMsg = "";
    try {
      const data = await fetchClans(
        this.searchQuery || undefined,
        this.browsePage,
      );
      if (gen !== this.asyncGeneration) return;
      if (data === false) throw new Error("fetch failed");
      this.browseData = data;
      this.emitState();
    } catch {
      if (gen !== this.asyncGeneration) return;
      this.errorMsg = translateText("clan_modal.error_loading");
    } finally {
      if (gen === this.asyncGeneration) this.loading = false;
    }
  }

  private onSearchInput(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.browsePage = 1;
      this.loadBrowse();
    }, 400);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.cachedState?.data) {
      this.browseData = this.cachedState.data;
      this.browsePage = this.cachedState.page;
      this.searchQuery = this.cachedState.query;
    } else {
      this.loadBrowse();
    }
  }

  disconnectedCallback() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    super.disconnectedCallback();
  }

  render() {
    if (this.loading && !this.browseData) return renderLoadingSpinner();

    const totalPages = this.browseData
      ? Math.ceil(this.browseData.total / this.browseData.limit)
      : 0;
    const pendingTags = new Set(this.myPendingRequests.map((r) => r.tag));
    const filtered = (this.browseData?.results ?? []).filter(
      (clan) => !this.myClanRoles.has(clan.tag),
    );

    return html`
      <div class="space-y-4">
        <div class="relative">
          <ui-input
            type="text"
            .value=${this.searchQuery}
            @input=${(e: Event) => this.onSearchInput(e)}
            style="--ui-input-radius: 12px"
            placeholder=${translateText("clan_modal.search_placeholder")}
          ></ui-input>
        </div>

        ${this.errorMsg
          ? html`<p class="text-red-400 text-sm text-center py-4">
              ${this.errorMsg}
            </p>`
          : ""}

        <div class="space-y-3">
          ${filtered.length === 0 && this.browseData
            ? html`<ui-empty-state>
                <span slot="label"
                  >${translateText("clan_modal.no_results")}</span
                >
              </ui-empty-state>`
            : filtered.map(
                (clan) =>
                  html`<clan-card
                    .clan=${clan}
                    ?pending=${pendingTags.has(clan.tag)}
                  ></clan-card>`,
              )}
        </div>

        ${totalPages > 1
          ? html`
              <div class="flex items-center justify-center gap-2 pt-2">
                <button
                  @click=${() => {
                    this.browsePage = Math.max(1, this.browsePage - 1);
                    this.loadBrowse();
                  }}
                  ?disabled=${this.browsePage <= 1}
                  class="px-2 py-1 text-xs font-bold rounded-lg transition-all ${this
                    .browsePage <= 1
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/60 hover:text-white hover:bg-white/10"}"
                >
                  &lt;
                </button>
                <span class="text-xs text-white/50 font-medium">
                  ${this.browsePage} / ${totalPages}
                </span>
                <button
                  @click=${() => {
                    this.browsePage = Math.min(totalPages, this.browsePage + 1);
                    this.loadBrowse();
                  }}
                  ?disabled=${this.browsePage >= totalPages}
                  class="px-2 py-1 text-xs font-bold rounded-lg transition-all ${this
                    .browsePage >= totalPages
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/60 hover:text-white hover:bg-white/10"}"
                >
                  &gt;
                </button>
              </div>
            `
          : ""}
      </div>
    `;
  }
}
