import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { crazyGamesSDK } from "src/client/CrazyGamesSDK";
import { PauseGameIntentEvent } from "src/client/Transport";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { UserSettings } from "../../../core/game/UserSettings";
import { Controller } from "../../Controller";
import { AlternateViewEvent, RefreshGraphicsEvent } from "../../InputHandler";
import {
  SetBackgroundMusicVolumeEvent,
  SetSoundEffectsVolumeEvent,
} from "../../sound/Sounds";
import { translateText } from "../../Utils";
import "../ui";
const structureIcon = assetUrl("images/CityIconWhite.svg");
const cursorPriceIcon = assetUrl("images/CursorPriceIconWhite.svg");
const darkModeIcon = assetUrl("images/DarkModeIconWhite.svg");
const emojiIcon = assetUrl("images/EmojiIconWhite.svg");
const exitIcon = assetUrl("images/ExitIconWhite.svg");
const explosionIcon = assetUrl("images/ExplosionIconWhite.svg");
const mouseIcon = assetUrl("images/MouseIconWhite.svg");
const ninjaIcon = assetUrl("images/NinjaIconWhite.svg");
const settingsIcon = assetUrl("images/SettingIconWhite.svg");
const sirenIcon = assetUrl("images/SirenIconWhite.svg");
const swordIcon = assetUrl("images/SwordIconWhite.svg");
const treeIcon = assetUrl("images/TreeIconWhite.svg");
const musicIcon = assetUrl("images/music.svg");

export class ShowSettingsModalEvent {
  constructor(
    public readonly isVisible: boolean = true,
    public readonly shouldPause: boolean = false,
    public readonly isPaused: boolean = false,
  ) {}
}

@customElement("settings-modal")
export class SettingsModal extends LitElement implements Controller {
  public eventBus: EventBus;
  public userSettings: UserSettings;

  @state()
  private isVisible: boolean = false;

  @state()
  private alternateView: boolean = false;

  @query(".modal-overlay")
  private modalOverlay!: HTMLElement;

  @property({ type: Boolean })
  shouldPause = false;

  @property({ type: Boolean })
  wasPausedWhenOpened = false;

  init() {
    this.eventBus.on(ShowSettingsModalEvent, (event) => {
      this.isVisible = event.isVisible;
      this.shouldPause = event.shouldPause;
      this.wasPausedWhenOpened = event.isPaused;
      this.pauseGame(true);
    });
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("click", this.handleOutsideClick, true);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  disconnectedCallback() {
    window.removeEventListener("click", this.handleOutsideClick, true);
    window.removeEventListener("keydown", this.handleKeyDown);
    super.disconnectedCallback();
  }

  private handleOutsideClick = (event: MouseEvent) => {
    if (
      this.isVisible &&
      this.modalOverlay &&
      event.target === this.modalOverlay
    ) {
      this.closeModal();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.isVisible && event.key === "Escape") {
      this.closeModal();
    }
  };

  public openModal() {
    this.isVisible = true;
    this.requestUpdate();
  }

  public closeModal() {
    this.isVisible = false;
    this.requestUpdate();
    this.pauseGame(false);
  }

  private pauseGame(pause: boolean) {
    if (this.shouldPause && !this.wasPausedWhenOpened) {
      if (pause) {
        crazyGamesSDK.gameplayStop();
      } else {
        crazyGamesSDK.gameplayStart();
      }
      this.eventBus.emit(new PauseGameIntentEvent(pause));
    }
  }

  private onTerrainButtonClick() {
    this.alternateView = !this.alternateView;
    this.eventBus.emit(new AlternateViewEvent(this.alternateView));
    this.requestUpdate();
  }

  private onToggleEmojisButtonClick() {
    this.userSettings.toggleEmojis();
    this.requestUpdate();
  }

  private onToggleStructureSpritesButtonClick() {
    this.userSettings.toggleStructureSprites();
    this.requestUpdate();
  }

  private onToggleSpecialEffectsButtonClick() {
    this.userSettings.toggleFxLayer();
    this.requestUpdate();
  }

  private onToggleAlertFrameButtonClick() {
    this.userSettings.toggleAlertFrame();
    this.requestUpdate();
  }

  private onToggleDarkModeButtonClick() {
    this.userSettings.toggleDarkMode();
    this.eventBus.emit(new RefreshGraphicsEvent());
    this.requestUpdate();
  }

  private onToggleRandomNameModeButtonClick() {
    this.userSettings.toggleRandomName();
    this.requestUpdate();
  }

  private onToggleLeftClickOpensMenu() {
    this.userSettings.toggleLeftClickOpenMenu();
    this.requestUpdate();
  }

  private onToggleCursorCostLabelButtonClick() {
    this.userSettings.toggleCursorCostLabel();
    this.requestUpdate();
  }

  private onToggleAttackingTroopsOverlayButtonClick() {
    this.userSettings.toggleAttackingTroopsOverlay();
    this.requestUpdate();
  }

  private onTogglePerformanceOverlayButtonClick() {
    this.userSettings.togglePerformanceOverlay();
    this.requestUpdate();
  }

  private onExitButtonClick() {
    // redirect to the home page
    window.location.href = "/";
  }

  private onVolumeChange(event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value) / 100;
    this.userSettings.setBackgroundMusicVolume(volume);
    this.eventBus.emit(new SetBackgroundMusicVolumeEvent(volume));
    this.requestUpdate();
  }

  private onSoundEffectsVolumeChange(event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value) / 100;
    this.userSettings.setSoundEffectsVolume(volume);
    this.eventBus.emit(new SetSoundEffectsVolumeEvent(volume));
    this.requestUpdate();
  }

  private renderIcon(src: string, label: string, tone = "muted") {
    return html`<hud-icon
      slot="leading"
      .src=${src}
      .label=${label}
      size="md"
      tone=${tone}
    ></hud-icon>`;
  }

  private renderSettingAction(options: {
    icon: string;
    iconLabel: string;
    title: string;
    description: string;
    value?: string;
    onClick: () => void;
    tone?: "default" | "danger";
  }) {
    return html`
      <hud-list-row
        interactive
        tone=${options.tone ?? "default"}
        style="--hud-list-row-padding: 10px 12px; grid-template-columns: auto minmax(0, 1fr) auto;"
        @click=${options.onClick}
      >
        ${this.renderIcon(
          options.icon,
          options.iconLabel,
          options.tone === "danger" ? "danger" : "muted",
        )}
        <span>
          <span class="block text-[13px] font-semibold text-white">
            ${options.title}
          </span>
          <span class="block text-[11px] text-slate-400">
            ${options.description}
          </span>
        </span>
        ${options.value
          ? html`<hud-label slot="meta" tone="muted">
              ${options.value}
            </hud-label>`
          : html``}
      </hud-list-row>
    `;
  }

  private renderVolumeSetting(options: {
    icon: string;
    iconLabel: string;
    title: string;
    value: number;
    onInput: (event: Event) => void;
  }) {
    const percent = Math.round(options.value * 100);
    return html`
      <hud-list-row
        style="--hud-list-row-padding: 10px 12px; grid-template-columns: auto minmax(0, 1fr) auto;"
      >
        ${this.renderIcon(options.icon, options.iconLabel)}
        <span>
          <span class="block text-[13px] font-semibold text-white">
            ${options.title}
          </span>
          <hud-range
            min="0"
            max="100"
            .value=${percent}
            @input=${options.onInput}
          ></hud-range>
        </span>
        <hud-label slot="meta" tone="muted">${percent}%</hud-label>
      </hud-list-row>
    `;
  }

  private onOff(value: boolean) {
    return value
      ? translateText("user_setting.on")
      : translateText("user_setting.off");
  }

  render() {
    if (!this.isVisible) {
      return null;
    }

    return html`
      <hud-modal-shell
        .open=${true}
        maxWidth="28rem"
        label=${translateText("user_setting.tab_basic")}
        @dismiss=${() => this.closeModal()}
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <hud-modal-header>
          <span class="flex items-center gap-2">
            <hud-icon
              .src=${settingsIcon}
              label="Settings"
              size="lg"
            ></hud-icon>
            ${translateText("user_setting.tab_basic")}
          </span>
        </hud-modal-header>
        <hud-modal-body style="--hud-surface-body-padding: 10px">
          <hud-scroll-area style="--hud-scroll-area-max-height: 68vh">
            ${this.renderVolumeSetting({
              icon: musicIcon,
              iconLabel: "Music",
              title: translateText("user_setting.background_music_volume"),
              value: this.userSettings.backgroundMusicVolume(),
              onInput: (event) => this.onVolumeChange(event),
            })}
            ${this.renderVolumeSetting({
              icon: musicIcon,
              iconLabel: "Sound effects",
              title: translateText("user_setting.sound_effects_volume"),
              value: this.userSettings.soundEffectsVolume(),
              onInput: (event) => this.onSoundEffectsVolumeChange(event),
            })}
            ${this.renderSettingAction({
              icon: treeIcon,
              iconLabel: "Terrain",
              title: translateText("user_setting.toggle_terrain"),
              description: translateText("user_setting.toggle_view_desc"),
              value: this.onOff(this.alternateView),
              onClick: () => this.onTerrainButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: emojiIcon,
              iconLabel: "Emojis",
              title: translateText("user_setting.emojis_label"),
              description: translateText("user_setting.emojis_desc"),
              value: this.onOff(this.userSettings.emojis()),
              onClick: () => this.onToggleEmojisButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: darkModeIcon,
              iconLabel: "Dark mode",
              title: translateText("user_setting.dark_mode_label"),
              description: translateText("user_setting.dark_mode_desc"),
              value: this.onOff(this.userSettings.darkMode()),
              onClick: () => this.onToggleDarkModeButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: explosionIcon,
              iconLabel: "Special effects",
              title: translateText("user_setting.special_effects_label"),
              description: translateText("user_setting.special_effects_desc"),
              value: this.onOff(this.userSettings.fxLayer()),
              onClick: () => this.onToggleSpecialEffectsButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: sirenIcon,
              iconLabel: "Alert frame",
              title: translateText("user_setting.alert_frame_label"),
              description: translateText("user_setting.alert_frame_desc"),
              value: this.onOff(this.userSettings.alertFrame()),
              onClick: () => this.onToggleAlertFrameButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: structureIcon,
              iconLabel: "Structure sprites",
              title: translateText("user_setting.structure_sprites_label"),
              description: translateText("user_setting.structure_sprites_desc"),
              value: this.onOff(this.userSettings.structureSprites()),
              onClick: () => this.onToggleStructureSpritesButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: swordIcon,
              iconLabel: "Attack overlay",
              title: translateText(
                "user_setting.attacking_troops_overlay_label",
              ),
              description: translateText(
                "user_setting.attacking_troops_overlay_desc",
              ),
              value: this.onOff(this.userSettings.attackingTroopsOverlay()),
              onClick: () => this.onToggleAttackingTroopsOverlayButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: cursorPriceIcon,
              iconLabel: "Cursor cost",
              title: translateText("user_setting.cursor_cost_label_label"),
              description: translateText("user_setting.cursor_cost_label_desc"),
              value: this.onOff(this.userSettings.cursorCostLabel()),
              onClick: () => this.onToggleCursorCostLabelButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: ninjaIcon,
              iconLabel: "Anonymous names",
              title: translateText("user_setting.anonymous_names_label"),
              description: translateText("user_setting.anonymous_names_desc"),
              value: this.onOff(this.userSettings.anonymousNames()),
              onClick: () => this.onToggleRandomNameModeButtonClick(),
            })}
            ${this.renderSettingAction({
              icon: mouseIcon,
              iconLabel: "Left click menu",
              title: translateText("user_setting.left_click_menu"),
              description: translateText("user_setting.left_click_desc"),
              value: this.onOff(this.userSettings.leftClickOpensMenu()),
              onClick: () => this.onToggleLeftClickOpensMenu(),
            })}
            ${this.renderSettingAction({
              icon: settingsIcon,
              iconLabel: "Performance overlay",
              title: translateText("user_setting.performance_overlay_label"),
              description: translateText(
                "user_setting.performance_overlay_desc",
              ),
              value: this.onOff(this.userSettings.performanceOverlay()),
              onClick: () => this.onTogglePerformanceOverlayButtonClick(),
            })}
            <hud-divider></hud-divider>
            ${this.renderSettingAction({
              icon: exitIcon,
              iconLabel: "Exit",
              title: translateText("user_setting.exit_game_label"),
              description: translateText("user_setting.exit_game_info"),
              onClick: () => this.onExitButtonClick(),
              tone: "danger",
            })}
          </hud-scroll-area>
        </hud-modal-body>
      </hud-modal-shell>
    `;
  }
}
