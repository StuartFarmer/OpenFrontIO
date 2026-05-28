import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const COMPONENT_ROOT = path.join(process.cwd(), "src/client/components");

const LEGACY_ALLOWED_FILES = new Set([
  "ConfirmDialog.ts",
  "CopyButton.ts",
  "CosmeticButton.ts",
  "CosmeticInfo.ts",
  "FluentSlider.ts",
  "GameConfigSettings.ts",
  "IOSAddToHomeScreenBanner.ts",
  "LobbyPlayerView.ts",
  "MobileNavBar.ts",
  "NewsBox.ts",
  "NotLoggedInWarning.ts",
  "PurchaseButton.ts",
  "RankedModal.ts",
  "SubscriptionPanel.ts",
  "ToggleInputCard.ts",
  "baseComponents/Modal.ts",
  "baseComponents/ranking/PlayerRow.ts",
  "baseComponents/ranking/RankingHeader.ts",
  "baseComponents/setting/SettingKeybind.ts",
  "baseComponents/setting/SettingNumber.ts",
  "baseComponents/setting/SettingSelect.ts",
  "baseComponents/setting/SettingSlider.ts",
  "baseComponents/setting/SettingToggle.ts",
  "baseComponents/stats/GameList.ts",
  "baseComponents/stats/PlayerStatsTable.ts",
  "baseComponents/stats/PlayerStatsTree.ts",
  "clan/ClanBansView.ts",
  "clan/ClanBrowseView.ts",
  "clan/ClanCard.ts",
  "clan/ClanDetailView.ts",
  "clan/ClanManageView.ts",
  "clan/ClanMyRequestsView.ts",
  "clan/ClanRequestsView.ts",
  "clan/ClanShared.ts",
  "clan/ClanStatsBreakdown.ts",
  "clan/ClanTransferView.ts",
  "leaderboard/LeaderboardClanTable.ts",
  "leaderboard/LeaderboardPlayerList.ts",
  "map/MapDisplay.ts",
  "map/MapPicker.ts",
]);

const IGNORED_DIRS = new Set(["ui"]);

const DRIFT_PATTERNS = [
  { name: "raw button", pattern: /<button\b/ },
  { name: "raw input", pattern: /<input\b/ },
  { name: "raw select", pattern: /<select\b/ },
  { name: "raw textarea", pattern: /<textarea\b/ },
  { name: "raw range", pattern: /type=["']range["']/ },
  {
    name: "ad hoc surface styling",
    pattern: /class=["'][^"']*(bg-white\/5|bg-black\/20|rounded-xl|shadow-lg)/,
  },
];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) return [];
      return walk(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

function rel(filePath: string): string {
  return path.relative(COMPONENT_ROOT, filePath).split(path.sep).join("/");
}

describe("UI migration guard", () => {
  it("prevents new component files from adding ad hoc UI primitives", () => {
    const violations: string[] = [];

    for (const filePath of walk(COMPONENT_ROOT)) {
      const relativePath = rel(filePath);
      if (LEGACY_ALLOWED_FILES.has(relativePath)) continue;

      const source = fs.readFileSync(filePath, "utf8");
      const lines = source.split("\n");

      for (const { name, pattern } of DRIFT_PATTERNS) {
        const lineIndex = lines.findIndex((line) => pattern.test(line));
        if (lineIndex !== -1) {
          violations.push(`${relativePath}:${lineIndex + 1} ${name}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
