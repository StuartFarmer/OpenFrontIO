import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { invalidateUserMe } from "../../Api";
import {
  type ClanInfo,
  type ClanMember,
  fetchClanMembers,
  transferLeadership,
} from "../../ClanApi";
import "../../hud/ui";
import { translateText } from "../../Utils";
import "../ConfirmDialog";
import "../CopyButton";
import {
  filterMembersBySearch,
  renderLoadingSpinner,
  renderMemberSearchInput,
  renderRoleIcon,
  renderServerPagination,
  showToast,
  translateClanRole,
} from "./ClanShared";

@customElement("clan-transfer-view")
export class ClanTransferView extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() clanTag = "";
  @property({ type: Object }) selectedClan: ClanInfo | null = null;

  @state() private transferTarget: string | null = null;
  @state() private actionPending = false;
  @state() private members: ClanMember[] = [];
  @state() private membersTotal = 0;
  @state() private memberPage = 1;
  @state() private membersPerPage = 10;
  @state() private loading = false;
  @state() private errorMsg = "";
  @state() private confirmAction: "transfer" | null = null;
  private memberSearch = "";
  private memberSearchDebounce: ReturnType<typeof setTimeout> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadMembers(1);
  }

  disconnectedCallback() {
    if (this.memberSearchDebounce) clearTimeout(this.memberSearchDebounce);
    super.disconnectedCallback();
  }

  private async loadMembers(page: number) {
    if (page === 1) this.loading = true;
    const res = await fetchClanMembers(this.clanTag, page, this.membersPerPage);
    if (!res) {
      this.loading = false;
      return;
    }
    if (res.results.length === 0 && page > 1) {
      await this.loadMembers(1);
      return;
    }
    this.members = res.results;
    this.membersTotal = res.total;
    this.memberPage = res.page;
    this.transferTarget = null;
    this.loading = false;
  }

  private async handleTransfer() {
    if (!this.transferTarget || this.actionPending) return;
    this.actionPending = true;
    this.errorMsg = "";
    try {
      const result = await transferLeadership(
        this.clanTag,
        this.transferTarget,
      );
      if (result !== true) {
        showToast(translateText(result.error), "red");
        this.errorMsg = translateText(result.error);
        return;
      }
      invalidateUserMe();
      this.dispatchEvent(
        new CustomEvent("leadership-transferred", {
          detail: { tag: this.clanTag },
          bubbles: true,
          composed: true,
        }),
      );
      showToast(translateText("clan_modal.leadership_transferred"), "green");
    } finally {
      this.actionPending = false;
    }
  }

  private onSearchInput(e: Event) {
    if (this.memberSearchDebounce) clearTimeout(this.memberSearchDebounce);
    this.memberSearchDebounce = setTimeout(() => {
      this.memberSearch = (e.target as HTMLInputElement).value;
      this.requestUpdate();
    }, 200);
  }

  render() {
    if (this.loading) return renderLoadingSpinner();

    const nonLeaders = this.members.filter(
      (m: ClanMember) => m.role !== "leader",
    );
    const totalMemberPages = Math.ceil(this.membersTotal / this.membersPerPage);

    return html`
      ${this.renderContent(nonLeaders, totalMemberPages)}
      ${this.renderConfirmOverlay()}
    `;
  }

  private renderConfirmOverlay() {
    if (this.confirmAction !== "transfer" || !this.transferTarget) return "";
    return html`<confirm-dialog
      .message=${translateText("clan_modal.confirm_transfer", {
        name: this.transferTarget,
      })}
      variant="warning"
      ?disabled=${this.actionPending}
      @confirm=${() => {
        this.confirmAction = null;
        this.handleTransfer();
      }}
      @cancel=${() => {
        this.confirmAction = null;
      }}
    ></confirm-dialog>`;
  }

  private renderContent(nonLeaders: ClanMember[], totalMemberPages: number) {
    return html`
      <div class="space-y-6">
        ${this.errorMsg
          ? html`<p class="text-red-400 text-sm">${this.errorMsg}</p>`
          : ""}

        <div class="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4">
          <p class="text-amber-400/80 text-sm">
            ${translateText("clan_modal.transfer_warning")}
          </p>
        </div>

        ${renderMemberSearchInput((e) => this.onSearchInput(e))}

        <div class="space-y-2">
          ${filterMembersBySearch(nonLeaders, this.memberSearch).map(
            (m) => html`
              <hud-list-row
                interactive
                ?selected=${this.transferTarget === m.publicId}
                @click=${() => (this.transferTarget = m.publicId)}
                aria-selected=${this.transferTarget === m.publicId}
                style="grid-template-columns: auto minmax(0, 1fr) auto auto; min-height: 44px; border-radius: 12px; border: 1px solid ${this
                  .transferTarget === m.publicId
                  ? "rgba(245,158,11,0.2)"
                  : "rgba(255,255,255,0.1)"}; background: ${this
                  .transferTarget === m.publicId
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(255,255,255,0.05)"};"
              >
                <div
                  slot="leading"
                  class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold shrink-0"
                >
                  ${renderRoleIcon(m.role)}
                </div>
                <div class="flex-1 min-w-0">
                  <copy-button
                    compact
                    .copyText=${m.publicId}
                    .displayText=${m.publicId}
                    .showVisibilityToggle=${false}
                    .showCopyIcon=${false}
                  ></copy-button>
                </div>
                <span
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0
                        ${m.role === "officer"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/10 text-white/40 border border-white/10"}"
                >
                  ${translateClanRole(m.role)}
                </span>
                ${this.transferTarget === m.publicId
                  ? html`<svg
                      slot="actions"
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-5 h-5 text-amber-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>`
                  : ""}
              </hud-list-row>
            `,
          )}
        </div>

        ${totalMemberPages > 1
          ? renderServerPagination(this.memberPage, totalMemberPages, (p) =>
              this.loadMembers(p),
            )
          : ""}

        <hud-button
          @click=${() => (this.confirmAction = "transfer")}
          variant=${this.transferTarget && !this.actionPending
            ? "active"
            : "default"}
          style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 12px 24px; --hud-button-radius: 12px; --hud-button-background: ${this
            .transferTarget && !this.actionPending
            ? "linear-gradient(90deg, rgb(217,119,6), rgb(180,83,9))"
            : "rgba(255,255,255,0.05)"}; --hud-button-hover-background: ${this
            .transferTarget && !this.actionPending
            ? "linear-gradient(90deg, rgb(245,158,11), rgb(217,119,6))"
            : "rgba(255,255,255,0.05)"}; --hud-button-border-color: ${this
            .transferTarget && !this.actionPending
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.1)"}; --hud-button-color: ${this
            .transferTarget && !this.actionPending
            ? "#fff"
            : "rgba(255,255,255,0.3)"};"
          ?disabled=${!this.transferTarget || this.actionPending}
        >
          ${this.transferTarget
            ? translateText("clan_modal.confirm_transfer", {
                name: this.transferTarget,
              })
            : translateText("clan_modal.select_new_leader")}
        </hud-button>
      </div>
    `;
  }
}
