export const HUD_FONT = "font-mono tabular-nums";

export const HUD_SURFACE = `${HUD_FONT} text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px]`;

export const HUD_SURFACE_HEADER =
  "flex items-center justify-between gap-2 min-h-[26px] px-2 py-1 border-b border-white/10 bg-slate-900/50 font-semibold";

export const HUD_SURFACE_BODY = "p-2";

export const HUD_COMPACT_TABLE = `${HUD_FONT} w-full border-collapse text-[10px] leading-[1.2]`;

export const HUD_TH =
  "h-5 px-2 py-1 align-middle border-b border-white/10 whitespace-nowrap text-right text-slate-300/70 bg-slate-900/30 font-semibold";

export const HUD_TD =
  "h-5 px-2 py-1 align-middle border-b border-white/10 whitespace-nowrap text-right";

export const HUD_TD_LEFT = `${HUD_TD} text-left`;

export const HUD_BUTTON =
  "min-h-6 px-2 py-0.5 border border-white/25 rounded-[2px] bg-slate-950/35 text-white text-xs font-medium leading-none transition-colors hover:bg-white/10 hover:border-white/45";

export const HUD_ACTION_GROUP =
  "inline-flex items-center gap-1 whitespace-nowrap";

export const HUD_ICON_BUTTON = `${HUD_BUTTON} inline-grid place-items-center w-6 min-w-6 px-0`;

export const HUD_SEGMENTED =
  "inline-grid grid-flow-col auto-cols-fr min-w-0 overflow-hidden border border-white/25 rounded-[2px] bg-slate-950/30";

export const HUD_SEGMENT =
  "min-h-[22px] min-w-0 px-2 py-0 border-0 border-l border-white/10 first:border-l-0 rounded-none bg-transparent text-slate-300/70 text-[10px] font-semibold leading-none hover:bg-white/10";

export const HUD_SEGMENT_ACTIVE =
  "bg-malibu-blue/30 text-white hover:bg-malibu-blue/35";

export const HUD_SEGMENT_ICON = `${HUD_SEGMENT} w-6 px-0`;

export const HUD_PILL =
  "inline-flex min-h-[18px] items-center gap-1 px-[7px] py-0 rounded-full border text-[10px] font-bold whitespace-nowrap";

export const HUD_PILL_BLUE = "border-aquarius/70 bg-aquarius/25 text-sky-100";

export const HUD_PILL_GREEN =
  "border-green-400/70 bg-green-500/20 text-green-300";

export const HUD_PILL_GOLD =
  "border-yellow-400/70 bg-yellow-500/20 text-yellow-200";

export const HUD_PILL_RED = "border-red-400/70 bg-red-500/20 text-red-300";
