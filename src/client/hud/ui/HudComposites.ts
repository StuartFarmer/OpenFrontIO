import { HUD_PILL, HUD_PILL_BLUE } from "./HudMolecules";
import { HUD_SURFACE } from "./HudPrimitives";

export const HUD_ATTACK_ROW =
  "flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-[3px] border border-white/10 bg-gray-800/88 px-1 py-0.5 text-white backdrop-blur-sm";

export const HUD_ATTACK_MAIN =
  "grid min-w-0 flex-1 grid-cols-[auto_auto_5ch_minmax(0,1fr)] items-center gap-1 border-0 bg-transparent p-0 text-left";

export const HUD_ATTACK_ACTION =
  "ml-auto inline-grid h-5 w-5 aspect-square shrink-0 place-items-center rounded-[2px] border border-white/20 bg-slate-950/35 p-0 text-[10px] font-semibold leading-none transition-colors hover:bg-white/10";

export const HUD_ATTACK_RATIO_PILL = `${HUD_PILL} ${HUD_PILL_BLUE} shrink-0 w-[8rem]`;

export const HUD_ATTACK_RATIO_COMPACT =
  "flex flex-col items-center shrink-0 gap-0.5 w-8";

export const HUD_TOOLBAR = `${HUD_SURFACE} flex w-fit flex-row items-center gap-2 px-2 py-1`;

export const HUD_TIMER_LABEL =
  "min-w-10 text-center text-xs font-semibold tabular-nums";
