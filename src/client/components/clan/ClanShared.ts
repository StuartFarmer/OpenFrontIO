import { html, type TemplateResult } from "lit";
import type {
  ClanJoinRequest,
  ClanMember,
  ClanMemberOrder,
  ClanMemberSort,
  ClanMemberStats,
  ClanStats,
} from "../../ClanApi";
import { showToast, translateText } from "../../Utils";
import "../ui";
import "./ClanStatsBreakdown";
export { renderLoadingSpinner } from "../BaseModal";
export { showToast };

export type ClanRole = "leader" | "officer" | "member";

export function defaultOrderForSort(sort: ClanMemberSort): ClanMemberOrder {
  return sort === "default" ? "asc" : "desc";
}

const dateCache = new Map<string, string>();

export function formatClanDate(iso: string): string {
  let cached = dateCache.get(iso);
  if (!cached) {
    cached = new Date(iso).toLocaleDateString();
    dateCache.set(iso, cached);
  }
  return cached;
}

export function translateClanRole(role: string): string {
  return translateText(`clan_modal.role_${role}`);
}

export function renderRoleIcon(role: string): TemplateResult {
  if (role === "leader") {
    return html`<span class="text-sm">👑</span>`;
  }
  if (role === "officer") {
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 text-purple-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>`;
  }
  return html`<svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-4 h-4 text-white/40"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>`;
}

export function renderStat(label: string, value: string): TemplateResult {
  return html`<ui-stat style="--ui-stat-padding: 16px; --ui-stat-radius: 12px">
    <span slot="label">${label}</span>
    ${value}
  </ui-stat>`;
}

export function renderClanWL(stats: ClanStats): TemplateResult | string {
  if (stats.games === 0) return "";
  return html`
    <ui-surface
      tone="muted"
      style="--ui-radius: 12px; --ui-surface-shadow: none"
    >
      <ui-surface-body style="--ui-surface-body-padding: 20px">
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-white/60 uppercase tracking-wider">
            ${translateText("clan_modal.statistics")}
          </h3>
          <clan-stats-breakdown .stats=${stats.stats}></clan-stats-breakdown>
        </div>
      </ui-surface-body>
    </ui-surface>
  `;
}

function renderPaginationButtons(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
): TemplateResult {
  return html`
    <div class="flex items-center gap-1">
      <ui-button
        size="xs"
        variant="ghost"
        @click=${() => onPageChange(1)}
        ?disabled=${currentPage <= 1}
      >
        &lt;&lt;
      </ui-button>
      <ui-button
        size="xs"
        variant="ghost"
        @click=${() => onPageChange(Math.max(1, currentPage - 1))}
        ?disabled=${currentPage <= 1}
      >
        &lt;
      </ui-button>
      <span class="text-xs text-white/50 font-medium px-1">
        ${currentPage} / ${totalPages}
      </span>
      <ui-button
        size="xs"
        variant="ghost"
        @click=${() => onPageChange(Math.min(totalPages, currentPage + 1))}
        ?disabled=${currentPage >= totalPages}
      >
        &gt;
      </ui-button>
      <ui-button
        size="xs"
        variant="ghost"
        @click=${() => onPageChange(totalPages)}
        ?disabled=${currentPage >= totalPages}
      >
        &gt;&gt;
      </ui-button>
    </div>
  `;
}

export function renderServerPagination(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
): TemplateResult {
  return html`
    <div
      class="flex items-center justify-center gap-1 pt-4 border-t border-white/10"
    >
      ${renderPaginationButtons(currentPage, totalPages, onPageChange)}
    </div>
  `;
}

export function renderMemberSearchInput(
  onInput: (e: Event) => void,
  placeholderKey = "clan_modal.search_members_placeholder",
  trailing?: TemplateResult,
): TemplateResult {
  const input = html`
    <div class="relative w-full sm:flex-1 sm:min-w-0">
      <ui-input
        type="text"
        class="w-full"
        style="--ui-input-radius: 12px"
        @input=${onInput}
        placeholder=${translateText(placeholderKey)}
      ></ui-input>
    </div>
  `;
  if (!trailing) {
    return html`<div class="mb-3">${input}</div>`;
  }
  return html`
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
      ${input}${trailing}
    </div>
  `;
}

const sortOptions: { value: ClanMemberSort; labelKey: string }[] = [
  { value: "default", labelKey: "clan_modal.sort_default" },
  { value: "winsTotal", labelKey: "clan_modal.sort_total_wins" },
  { value: "lossesTotal", labelKey: "clan_modal.sort_total_losses" },
  { value: "winsFfa", labelKey: "clan_modal.sort_ffa_wins" },
  { value: "lossesFfa", labelKey: "clan_modal.sort_ffa_losses" },
  { value: "winsTeam", labelKey: "clan_modal.sort_team_wins" },
  { value: "lossesTeam", labelKey: "clan_modal.sort_team_losses" },
  { value: "winsHvn", labelKey: "clan_modal.sort_hvn_wins" },
  { value: "lossesHvn", labelKey: "clan_modal.sort_hvn_losses" },
  { value: "winsRanked", labelKey: "clan_modal.sort_ranked_wins" },
  { value: "lossesRanked", labelKey: "clan_modal.sort_ranked_losses" },
  { value: "wins1v1", labelKey: "clan_modal.sort_1v1_wins" },
  { value: "losses1v1", labelKey: "clan_modal.sort_1v1_losses" },
];

function renderOrderIcon(order: ClanMemberOrder): TemplateResult {
  // asc: bars grow downward (-, --, ---).  desc: bars shrink downward (---, --, -).
  const widths =
    order === "asc" ? ["w-1.5", "w-2.5", "w-3.5"] : ["w-3.5", "w-2.5", "w-1.5"];
  return html`
    <span
      class="flex flex-col items-start justify-center gap-[3px] w-4 h-4"
      aria-hidden="true"
    >
      ${widths.map(
        (w) => html`<span class="${w} h-[2px] bg-current rounded-sm"></span>`,
      )}
    </span>
  `;
}

export function renderMemberSortControl(
  sort: ClanMemberSort,
  order: ClanMemberOrder,
  onSortChange: (sort: ClanMemberSort) => void,
  onOrderToggle: () => void,
): TemplateResult {
  const orderLabel = translateText(
    order === "asc"
      ? "clan_modal.sort_order_asc"
      : "clan_modal.sort_order_desc",
  );
  return html`
    <div class="flex items-center gap-2 shrink-0">
      <label
        class="text-[10px] font-bold text-white/40 uppercase tracking-wider hidden sm:inline"
      >
        ${translateText("clan_modal.sort_by")}
      </label>
      <ui-select
        class="flex-1 sm:flex-none"
        style="min-width: 12rem; --ui-input-radius: 12px"
        label=${translateText("clan_modal.sort_by")}
        .value=${sort}
        .options=${sortOptions.map((opt) => ({
          value: opt.value,
          label: translateText(opt.labelKey),
        }))}
        @change=${(e: Event) =>
          onSortChange(
            (e.target as HTMLElement & { value: string })
              .value as ClanMemberSort,
          )}
      ></ui-select>
      <ui-button
        size="sm"
        variant="ghost"
        type="button"
        @click=${onOrderToggle}
        title=${orderLabel}
        aria-label=${orderLabel}
      >
        ${renderOrderIcon(order)}
      </ui-button>
    </div>
  `;
}

const perPageOptions = [10, 25, 50] as const;

export function renderMemberPagination(
  memberPage: number,
  totalMembers: number,
  membersPerPage: number,
  onPageChange: (page: number) => void,
  onPerPageChange: (perPage: number) => void,
): TemplateResult | string {
  const totalPages = Math.ceil(totalMembers / membersPerPage);
  if (totalMembers <= perPageOptions[0]) return "";

  return html`
    <div
      class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-[10px] font-bold text-white/40 uppercase tracking-wider"
        >
          ${translateText("clan_modal.per_page")}
        </span>
        ${perPageOptions.map(
          (opt) => html`
            <ui-button
              size="xs"
              variant=${membersPerPage === opt ? "primary" : "ghost"}
              @click=${() => onPerPageChange(opt)}
            >
              ${opt}
            </ui-button>
          `,
        )}
      </div>
      ${renderPaginationButtons(memberPage, totalPages, onPageChange)}
    </div>
  `;
}

export function renderWLBarRow(
  label: string,
  wins: number,
  losses: number,
): TemplateResult {
  const total = wins + losses;
  const hasGames = total > 0;
  const rate = hasGames ? Math.round((wins / total) * 100) : 0;
  const winPct = hasGames ? (wins / total) * 100 : 0;
  const lossPct = hasGames ? 100 - winPct : 0;
  const rateClass = !hasGames
    ? "text-white/25"
    : rate >= 50
      ? "text-green-400"
      : "text-red-400/90";
  return html`
    <div class="flex items-center gap-2">
      <span
        class="text-[10px] font-bold uppercase tracking-wider text-white/50 w-14 shrink-0 truncate"
        title=${label}
      >
        ${label}
      </span>
      <div
        class="relative flex-1 h-5 rounded-md overflow-hidden bg-white/5"
        role="img"
        aria-label="${wins} wins, ${losses} losses"
      >
        <div class="absolute inset-0 flex">
          ${wins > 0
            ? html`<div
                class="bg-malibu-blue h-full"
                style="width:${winPct}%"
              ></div>`
            : ""}
          ${losses > 0
            ? html`<div
                class="bg-red-500 h-full"
                style="width:${lossPct}%"
              ></div>`
            : ""}
        </div>
        <div
          class="absolute inset-0 flex items-center justify-between px-1.5 text-[11px] font-bold text-white tabular-nums whitespace-nowrap pointer-events-none"
        >
          <span>${wins > 0 ? `${wins}W` : ""}</span>
          <span>${losses > 0 ? `${losses}L` : ""}</span>
        </div>
      </div>
      <span
        class="text-xs font-bold shrink-0 tabular-nums w-9 text-right ${rateClass}"
      >
        ${hasGames ? `${rate}%` : "—"}
      </span>
    </div>
  `;
}

export function renderMemberStats(
  stats: ClanMemberStats | undefined,
): TemplateResult | string {
  if (!stats) return "";
  return html`
    <div class="mt-1.5">
      <clan-stats-breakdown .stats=${stats}></clan-stats-breakdown>
    </div>
  `;
}

export function renderMemberRow(
  member: ClanMember,
  myPublicId: string | null,
): TemplateResult {
  const isMe = member.publicId === myPublicId;
  return html`
    <ui-list-row
      class="flex flex-col rounded-xl border
        ${isMe
        ? "bg-malibu-blue/10 border-malibu-blue/20"
        : "bg-white/5 border-white/10"}"
      style="--ui-list-row-padding: 10px 12px; flex-direction: column; align-items: stretch"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${isMe
            ? "bg-malibu-blue/20 text-aquarius"
            : "bg-white/10 text-white/50"}"
        >
          ${renderRoleIcon(member.role)}
        </div>
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <copy-button
                compact
                .copyText=${member.publicId}
                .displayText=${member.publicId}
                .showVisibilityToggle=${false}
                .showCopyIcon=${false}
              ></copy-button>
            </div>
            <span
              class="text-white/30 text-[10px] shrink-0 text-right whitespace-nowrap"
              >${translateText("clan_modal.joined_date", {
                date: formatClanDate(member.joinedAt),
              })}</span
            >
          </div>
        </div>
      </div>
      ${renderMemberStats(member.stats)}
    </ui-list-row>
  `;
}

export function filterMembersBySearch(
  members: ClanMember[],
  search: string,
): ClanMember[] {
  if (!search) return members;
  const q = search.toLowerCase();
  return members.filter(
    (m) =>
      m.publicId.toLowerCase().includes(q) || m.role.toLowerCase().includes(q),
  );
}

export function filterRequestsBySearch(
  requests: ClanJoinRequest[],
  search: string,
): ClanJoinRequest[] {
  if (!search) return requests;
  const q = search.toLowerCase();
  return requests.filter((r) => r.publicId.toLowerCase().includes(q));
}
