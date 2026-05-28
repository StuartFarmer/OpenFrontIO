import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { invalidateUserMe } from "../../Api";
import {
  banClanMember,
  type ClanInfo,
  type ClanMember,
  type ClanMemberOrder,
  type ClanMemberSort,
  demoteMember,
  disbandClan,
  fetchClanMembers,
  kickMember,
  promoteMember,
  updateClan,
} from "../../ClanApi";
import "../../hud/ui";
import { translateText } from "../../Utils";
import "../ConfirmDialog";
import "../CopyButton";
import {
  type ClanRole,
  defaultOrderForSort,
  filterMembersBySearch,
  formatClanDate,
  renderLoadingSpinner,
  renderMemberPagination,
  renderMemberSearchInput,
  renderMemberSortControl,
  renderRoleIcon,
  showToast,
} from "./ClanShared";

@customElement("clan-manage-view")
export class ClanManageView extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() clanTag = "";
  @property({ type: Object }) selectedClan: ClanInfo | null = null;
  @property() myPublicId: string | null = null;
  @property() myRole: ClanRole | null = null;

  @state() private manageName = "";
  @state() private manageDescription = "";
  @state() private manageIsOpen = true;
  @state() private saving = false;
  @state() private members: ClanMember[] = [];
  @state() private membersTotal = 0;
  @state() private memberPage = 1;
  @state() private membersPerPage = 10;
  @state() private memberSort: ClanMemberSort = "default";
  @state() private memberOrder: ClanMemberOrder = "asc";
  @state() private memberActionPending = false;
  @state() private loading = false;
  @state() private confirmAction: "disband" | "kick" | "ban" | null = null;
  @state() private confirmTargetId: string | null = null;
  @state() private pendingRequestCount = 0;
  @state() private actionPending = false;
  private memberSearch = "";
  private memberSearchDebounce: ReturnType<typeof setTimeout> | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.selectedClan) {
      this.manageName = this.selectedClan.name;
      this.manageDescription = this.selectedClan.description ?? "";
      this.manageIsOpen = this.selectedClan.isOpen ?? true;
    }
    this.loadMembers(1);
  }

  disconnectedCallback() {
    if (this.memberSearchDebounce) clearTimeout(this.memberSearchDebounce);
    super.disconnectedCallback();
  }

  private async loadMembers(page: number) {
    if (this.members.length === 0) this.loading = true;
    const res = await fetchClanMembers(
      this.clanTag,
      page,
      this.membersPerPage,
      this.memberSort,
      this.memberOrder,
    );
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
    this.memberPage = page;
    this.pendingRequestCount = res.pendingRequests ?? 0;
    if (this.selectedClan && this.selectedClan.memberCount !== res.total) {
      this.dispatchEvent(
        new CustomEvent("clan-updated", {
          detail: { memberCount: res.total },
          bubbles: true,
          composed: true,
        }),
      );
    }
    this.loading = false;
  }

  private async handleSaveSettings() {
    const clan = this.selectedClan;
    if (!clan) return;
    const patch: { name?: string; description?: string; isOpen?: boolean } = {};
    if (this.manageName !== clan.name) patch.name = this.manageName;
    if ((this.manageDescription ?? "") !== (clan.description ?? ""))
      patch.description = this.manageDescription;
    if (this.manageIsOpen !== (clan.isOpen ?? true))
      patch.isOpen = this.manageIsOpen;
    if (Object.keys(patch).length === 0) return;

    this.saving = true;
    const result = await updateClan(this.clanTag, patch);
    if ("error" in result) {
      showToast(translateText(result.error), "red");
      this.saving = false;
      return;
    }
    this.dispatchEvent(
      new CustomEvent("clan-updated", {
        detail: {
          name: result.name,
          description: result.description,
          isOpen: result.isOpen,
        },
        bubbles: true,
        composed: true,
      }),
    );
    this.saving = false;
    showToast(translateText("clan_modal.settings_saved"), "green");
    this.dispatchEvent(
      new CustomEvent("navigate-detail", { bubbles: true, composed: true }),
    );
  }

  private async handlePromote(publicId: string) {
    if (this.memberActionPending) return;
    this.memberActionPending = true;
    try {
      const result = await promoteMember(this.clanTag, publicId);
      if (result !== true) {
        showToast(translateText(result.error), "red");
        return;
      }
      await this.loadMembers(this.memberPage);
      showToast(translateText("clan_modal.member_promoted"), "green");
    } finally {
      this.memberActionPending = false;
    }
  }

  private async handleDemote(publicId: string) {
    if (this.memberActionPending) return;
    this.memberActionPending = true;
    try {
      const result = await demoteMember(this.clanTag, publicId);
      if (result !== true) {
        showToast(translateText(result.error), "red");
        return;
      }
      await this.loadMembers(this.memberPage);
      showToast(translateText("clan_modal.member_demoted"), "green");
    } finally {
      this.memberActionPending = false;
    }
  }

  private async handleKick(publicId: string) {
    if (this.memberActionPending) return;
    this.memberActionPending = true;
    try {
      const result = await kickMember(this.clanTag, publicId);
      if (result !== true) {
        showToast(translateText(result.error), "red");
        return;
      }
      await this.loadMembers(this.memberPage);
      showToast(translateText("clan_modal.member_kicked"), "green");
    } finally {
      this.memberActionPending = false;
    }
  }

  private async handleBan(publicId: string, reason: string) {
    if (this.memberActionPending) return;
    this.memberActionPending = true;
    try {
      const result = await banClanMember(
        this.clanTag,
        publicId,
        reason.trim().slice(0, 200) || undefined,
      );
      if (result !== true) {
        showToast(translateText(result.error), "red");
        return;
      }
      await this.loadMembers(this.memberPage);
      showToast(translateText("clan_modal.member_banned"), "green");
    } finally {
      this.memberActionPending = false;
    }
  }

  private async handleDisband() {
    if (this.actionPending) return;
    this.actionPending = true;
    try {
      const result = await disbandClan(this.clanTag);
      if (result !== true) {
        showToast(translateText(result.error), "red");
        return;
      }
      invalidateUserMe();
      this.dispatchEvent(
        new CustomEvent("clan-disbanded", {
          detail: { tag: this.clanTag },
          bubbles: true,
          composed: true,
        }),
      );
      showToast(translateText("clan_modal.clan_disbanded"), "green");
    } finally {
      this.actionPending = false;
    }
  }

  private clearConfirm() {
    this.confirmAction = null;
    this.confirmTargetId = null;
  }

  private onSearchInput(e: Event) {
    if (this.memberSearchDebounce) clearTimeout(this.memberSearchDebounce);
    this.memberSearchDebounce = setTimeout(() => {
      this.memberSearch = (e.target as HTMLInputElement).value;
      this.requestUpdate();
    }, 200);
  }

  private onSortChange(sort: ClanMemberSort) {
    if (sort === this.memberSort) return;
    this.memberSort = sort;
    this.memberOrder = defaultOrderForSort(sort);
    this.loadMembers(1);
  }

  private onOrderToggle() {
    this.memberOrder = this.memberOrder === "asc" ? "desc" : "asc";
    this.loadMembers(1);
  }

  render() {
    if (this.loading) return renderLoadingSpinner();

    const clan = this.selectedClan;
    if (!clan) return "";

    return html`${this.renderManageContent(clan)}${this.renderConfirmOverlay()}`;
  }

  private renderConfirmOverlay() {
    if (!this.confirmAction) return "";

    if (this.confirmAction === "disband") {
      return html`<confirm-dialog
        .message=${translateText("clan_modal.confirm_disband", {
          tag: this.selectedClan?.tag ?? "",
          name: this.selectedClan?.name ?? "",
        })}
        variant="danger"
        ?disabled=${this.actionPending}
        @confirm=${() => {
          this.clearConfirm();
          this.handleDisband();
        }}
        @cancel=${() => this.clearConfirm()}
      ></confirm-dialog>`;
    }
    if (this.confirmAction === "kick" && this.confirmTargetId) {
      return html`<confirm-dialog
        .message=${translateText("clan_modal.confirm_kick")}
        variant="warning"
        ?disabled=${this.memberActionPending}
        @confirm=${() => {
          const id = this.confirmTargetId!;
          this.clearConfirm();
          this.handleKick(id);
        }}
        @cancel=${() => this.clearConfirm()}
      ></confirm-dialog>`;
    }
    if (this.confirmAction === "ban" && this.confirmTargetId) {
      return html`<confirm-dialog
        .message=${translateText("clan_modal.confirm_ban")}
        variant="warning"
        textareaPlaceholder=${translateText("clan_modal.ban_reason_prompt")}
        ?disabled=${this.memberActionPending}
        @confirm=${(e: CustomEvent<{ text: string }>) => {
          const id = this.confirmTargetId!;
          const reason = e.detail.text;
          this.clearConfirm();
          this.handleBan(id, reason);
        }}
        @cancel=${() => this.clearConfirm()}
      ></confirm-dialog>`;
    }
    return "";
  }

  private renderManageContent(clan: ClanInfo) {
    return html`
      <div class="space-y-6">
        <!-- Edit Settings -->
        <div
          class="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-5"
        >
          <h3 class="text-sm font-bold text-white/60 uppercase tracking-wider">
            ${translateText("clan_modal.clan_settings")}
          </h3>
          <div>
            <label
              class="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2"
              >${translateText("clan_modal.clan_name")}</label
            >
            <hud-input
              type="text"
              .value=${this.manageName}
              @input=${(e: Event) =>
                (this.manageName = (
                  e.target as HTMLElement & { value: string }
                ).value)}
              maxlength="35"
              style="--hud-input-radius: 12px"
              label=${translateText("clan_modal.clan_name")}
            ></hud-input>
          </div>
          <div>
            <label
              class="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2"
              >${translateText("clan_modal.description")}</label
            >
            <hud-textarea
              .value=${this.manageDescription}
              @input=${(e: Event) =>
                (this.manageDescription = (
                  e.target as HTMLElement & { value: string }
                ).value)}
              maxlength="200"
              rows="3"
              style="--hud-input-radius: 12px; --hud-textarea-min-height: 84px"
              label=${translateText("clan_modal.description")}
            ></hud-textarea>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white text-sm font-bold">
                ${translateText("clan_modal.open_clan")}
              </div>
              <div class="text-white/40 text-xs">
                ${translateText("clan_modal.open_clan_desc")}
              </div>
            </div>
            <hud-toggle
              label=${translateText("clan_modal.open_clan")}
              .checked=${this.manageIsOpen}
              @change=${(e: Event) =>
                (this.manageIsOpen = Boolean(
                  (e.target as HTMLElement & { checked?: boolean }).checked,
                ))}
            ></hud-toggle>
          </div>
          <hud-button
            @click=${() => this.handleSaveSettings()}
            ?disabled=${this.saving}
            variant="primary"
            style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 12px 24px; --hud-button-radius: 12px;"
          >
            ${this.saving
              ? translateText("clan_modal.saving")
              : translateText("clan_modal.save_changes")}
          </hud-button>
        </div>

        <!-- Member Management -->
        <div
          class="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4"
        >
          <h3 class="text-sm font-bold text-white/60 uppercase tracking-wider">
            ${translateText("clan_modal.members")} (${clan.memberCount ?? 0})
          </h3>
          ${renderMemberSearchInput(
            (e) => this.onSearchInput(e),
            undefined,
            renderMemberSortControl(
              this.memberSort,
              this.memberOrder,
              (s) => this.onSortChange(s),
              () => this.onOrderToggle(),
            ),
          )}
          ${(() => {
            const filtered = filterMembersBySearch(
              this.members,
              this.memberSearch,
            );
            return html`
              <div class="space-y-2">
                ${filtered.map((m) => this.renderManageMemberRow(m))}
              </div>
              ${renderMemberPagination(
                this.memberPage,
                this.membersTotal,
                this.membersPerPage,
                (p) => this.loadMembers(p),
                (pp) => {
                  this.membersPerPage = pp;
                  this.loadMembers(1);
                },
              )}
            `;
          })()}
        </div>

        <!-- Danger Zone -->
        <div
          class="bg-red-500/5 rounded-2xl border border-red-500/20 p-6 space-y-4"
        >
          <h3
            class="text-sm font-bold text-red-400/80 uppercase tracking-wider"
          >
            ${translateText("clan_modal.danger_zone")}
          </h3>
          <hud-button
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent("navigate-bans", {
                  bubbles: true,
                  composed: true,
                }),
              )}
            variant="danger"
            style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 12px 24px; --hud-button-radius: 12px; --hud-button-background: rgba(220,38,38,0.2); --hud-button-hover-background: rgba(220,38,38,0.3); --hud-button-border-color: rgba(239,68,68,0.3);"
          >
            ${translateText("clan_modal.banned_players")}
          </hud-button>
          ${this.myRole === "leader"
            ? html`
                <hud-button
                  @click=${() =>
                    this.dispatchEvent(
                      new CustomEvent("navigate-transfer", {
                        bubbles: true,
                        composed: true,
                      }),
                    )}
                  variant="active"
                  style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 12px 24px; --hud-button-radius: 12px; --hud-button-background: rgba(217,119,6,0.2); --hud-button-hover-background: rgba(217,119,6,0.3); --hud-button-border-color: rgba(245,158,11,0.3); --hud-button-color: #fbbf24;"
                >
                  ${translateText("clan_modal.transfer_leadership")}
                </hud-button>
                <hud-button
                  @click=${() => {
                    this.confirmAction = "disband";
                    this.confirmTargetId = null;
                  }}
                  ?disabled=${this.confirmAction === "disband"}
                  variant="danger"
                  style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 12px 24px; --hud-button-radius: 12px; --hud-button-background: rgba(220,38,38,0.2); --hud-button-hover-background: rgba(220,38,38,0.3); --hud-button-border-color: rgba(239,68,68,0.3);"
                >
                  ${translateText("clan_modal.disband_clan")}
                </hud-button>
              `
            : ""}
        </div>
      </div>
    `;
  }

  private renderManageMemberRow(member: ClanMember) {
    const isLeader = member.role === "leader";
    const isMe = member.publicId === this.myPublicId;
    const canModerate =
      !isMe &&
      !isLeader &&
      (this.myRole === "leader" ||
        (this.myRole === "officer" && member.role === "member"));
    const canPromote =
      !isMe && this.myRole === "leader" && member.role === "member";
    const canDemote =
      !isMe && this.myRole === "leader" && member.role === "officer";

    return html`
      <div
        class="flex flex-col py-2.5 px-3 rounded-xl border
        ${isMe
          ? "bg-malibu-blue/10 border-malibu-blue/20"
          : "bg-white/5 border-white/10"}"
      >
        <div class="flex items-center flex-wrap gap-1.5">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${isMe
              ? "bg-malibu-blue/20 text-aquarius"
              : "bg-white/10 text-white/50"}"
          >
            ${renderRoleIcon(member.role)}
          </div>
          <copy-button
            compact
            .copyText=${member.publicId}
            .displayText=${member.publicId}
            .showVisibilityToggle=${false}
            .showCopyIcon=${false}
          ></copy-button>
          <span class="text-white/30 text-[10px] whitespace-nowrap">
            ${translateText("clan_modal.joined_date", {
              date: formatClanDate(member.joinedAt),
            })}
          </span>
          <div class="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
            ${canPromote
              ? html`<hud-button
                  @click=${() => this.handlePromote(member.publicId)}
                  ?disabled=${this.memberActionPending}
                  variant="active"
                  style="--hud-button-padding: 2px 8px; --hud-button-radius: 9999px; --hud-button-background: rgba(168,85,247,0.1); --hud-button-hover-background: rgba(168,85,247,0.2); --hud-button-border-color: rgba(168,85,247,0.2); --hud-button-color: rgba(192,132,252,0.85);"
                >
                  ${translateText("clan_modal.promote")}
                </hud-button>`
              : ""}
            ${canDemote
              ? html`<hud-button
                  @click=${() => this.handleDemote(member.publicId)}
                  ?disabled=${this.memberActionPending}
                  style="--hud-button-padding: 2px 8px; --hud-button-radius: 9999px; --hud-button-background: rgba(255,255,255,0.05); --hud-button-hover-background: rgba(255,255,255,0.1); --hud-button-border-color: rgba(255,255,255,0.1); --hud-button-color: rgba(255,255,255,0.55);"
                >
                  ${translateText("clan_modal.demote")}
                </hud-button>`
              : ""}
            ${canModerate
              ? html`
                  <hud-button
                    @click=${() => {
                      this.confirmAction = "kick";
                      this.confirmTargetId = member.publicId;
                    }}
                    ?disabled=${this.memberActionPending ||
                    this.confirmAction !== null}
                    variant="danger"
                    style="--hud-button-padding: 2px 8px; --hud-button-radius: 9999px; --hud-button-background: rgba(239,68,68,0.1); --hud-button-hover-background: rgba(239,68,68,0.2); --hud-button-border-color: rgba(239,68,68,0.2); --hud-button-color: rgba(248,113,113,0.85);"
                  >
                    ${translateText("clan_modal.kick")}
                  </hud-button>
                  <hud-button
                    @click=${() => {
                      this.confirmAction = "ban";
                      this.confirmTargetId = member.publicId;
                    }}
                    ?disabled=${this.memberActionPending ||
                    this.confirmAction !== null}
                    variant="danger"
                    style="--hud-button-padding: 2px 8px; --hud-button-radius: 9999px; --hud-button-background: rgba(239,68,68,0.1); --hud-button-hover-background: rgba(239,68,68,0.2); --hud-button-border-color: rgba(239,68,68,0.2); --hud-button-color: rgba(248,113,113,0.85);"
                  >
                    ${translateText("clan_modal.ban")}
                  </hud-button>
                `
              : ""}
          </div>
        </div>
      </div>
    `;
  }
}
