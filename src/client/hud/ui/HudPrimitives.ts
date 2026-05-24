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

export const HUD_INPUT =
  "h-6 min-w-0 rounded-[2px] border border-white/20 bg-slate-950/50 px-1.5 text-white text-[10px] leading-none outline-none transition-colors focus:border-aquarius/70";

export const HUD_SELECT = `${HUD_INPUT} pr-5`;

export const HUD_RANGE = "h-1.5 w-full cursor-pointer accent-aquarius";

export const HUD_DUAL_RANGE = "relative h-6 w-full min-w-0";

export const HUD_DUAL_RANGE_TRACK =
  "absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/50";

export const HUD_DUAL_RANGE_FILL =
  "absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-aquarius";

export const HUD_DUAL_RANGE_INPUT =
  "dual-range-input absolute inset-0 h-6 w-full appearance-none bg-transparent";

export const HUD_FIELD_LABEL =
  "text-[10px] font-bold leading-none text-slate-300";

export const HUD_FORM_ROW =
  "grid grid-cols-[7ch_minmax(0,1fr)] items-center gap-2";

export const HUD_ICON_BUTTON = `${HUD_BUTTON} inline-grid place-items-center w-6 min-w-6 px-0`;

export const HUD_ICON_ATOM =
  "inline-grid aspect-square shrink-0 place-items-center overflow-hidden rounded-[2px] border border-white/20 bg-slate-950/35 leading-none";

export const HUD_ICON_SM = "h-4 w-4";

export const HUD_ICON_MD = "h-5 w-5";

export const HUD_ICON_LG = "h-6 w-6";

export const HUD_ICON_XL = "h-7 w-7";

export const HUD_LABEL_ATOM = `${HUD_FONT} min-w-0 text-[10px] leading-none`;

export const HUD_NUMERIC_LABEL = `${HUD_LABEL_ATOM} text-right whitespace-nowrap`;

export const HUD_ATTACK_QUANTITY_LABEL = `${HUD_LABEL_ATOM} w-[5ch] shrink-0 text-left whitespace-nowrap`;

export const HUD_TEXT_LABEL = `${HUD_LABEL_ATOM} truncate`;

export const HUD_METER =
  "relative h-6 w-full overflow-hidden rounded-[2px] border border-white/20 bg-gray-900/60";

export const HUD_METER_STACK = "flex h-full";

export const HUD_METER_FILL = "h-full transition-[width] duration-200";

export const HUD_METER_TEXT =
  "absolute inset-0 flex items-center font-bold leading-none pointer-events-none";

export const HUD_MINI_METER =
  "relative inline-block h-[18px] w-36 overflow-hidden rounded-[2px] border border-white/20 bg-gray-900/60 align-middle";
