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

export const HUD_TEXT_LABEL = `${HUD_LABEL_ATOM} truncate`;

export const HUD_ATTACK_ROW =
  "flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-[3px] border border-white/10 bg-gray-800/88 px-1 py-0.5 text-white backdrop-blur-sm";

export const HUD_ATTACK_MAIN =
  "grid min-w-0 flex-1 grid-cols-[auto_auto_minmax(3.75rem,auto)_minmax(0,1fr)] items-center gap-1 border-0 bg-transparent p-0 text-left";

export const HUD_ATTACK_ACTION =
  "ml-auto inline-grid h-5 w-5 aspect-square shrink-0 place-items-center rounded-[2px] border border-white/20 bg-slate-950/35 p-0 text-[10px] font-semibold leading-none transition-colors hover:bg-white/10";

export const HUD_METER =
  "relative h-6 w-full overflow-hidden rounded-[2px] border border-white/20 bg-gray-900/60";

export const HUD_METER_STACK = "flex h-full";

export const HUD_METER_FILL = "h-full transition-[width] duration-200";

export const HUD_METER_TEXT =
  "absolute inset-0 flex items-center font-bold leading-none pointer-events-none";

export const HUD_MINI_METER =
  "relative inline-block h-[18px] w-36 overflow-hidden rounded-[2px] border border-white/20 bg-gray-900/60 align-middle";

export const HUD_BLEND_CONTROL = "relative h-6 flex-1";

export const HUD_BLEND_ROW = "flex items-center gap-2";

export const HUD_BLEND_LABEL = "shrink-0 font-bold text-slate-200 leading-none";

export const HUD_BLEND_BAR =
  "absolute left-0 right-0 top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-[2px] border border-white/20 bg-gray-900/70";

export const HUD_BLEND_SEGMENT =
  "flex h-full items-center justify-center overflow-hidden";

export const HUD_BLEND_HANDLE =
  "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-white bg-gray-900 shadow-md cursor-grab active:cursor-grabbing";

export const HUD_SEGMENTED =
  "inline-grid grid-flow-col auto-cols-fr min-w-0 overflow-hidden border border-white/25 rounded-[2px] bg-slate-950/30";

export const HUD_SEGMENT =
  "min-h-[22px] min-w-0 px-2 py-0 border-0 border-l border-white/10 first:border-l-0 rounded-none bg-transparent text-slate-300/70 text-[10px] font-semibold leading-none hover:bg-white/10";

export const HUD_SEGMENT_ACTIVE =
  "bg-malibu-blue/30 text-white hover:bg-malibu-blue/35";

export const HUD_SEGMENT_ICON = `${HUD_SEGMENT} w-6 px-0`;

export const HUD_SEGMENT_CONTENT =
  "flex min-w-0 items-center justify-between gap-1";

export const HUD_SEGMENT_MAIN = "flex min-w-0 items-center gap-1";

export const HUD_SEGMENT_LABEL = "truncate";

export const HUD_SEGMENT_VALUE = "min-w-0 truncate tabular-nums";

export const HUD_CONTROL_ROW = "flex items-center gap-1.5";

export const HUD_PILL =
  "inline-flex min-h-[18px] items-center gap-1 px-[7px] py-0 rounded-full border text-[10px] font-bold whitespace-nowrap";

export const HUD_PILL_ICON = "shrink-0";

export const HUD_PILL_VALUE = "tabular-nums";

export const HUD_PILL_BLUE = "border-aquarius/70 bg-aquarius/25 text-sky-100";

export const HUD_PILL_GREEN =
  "border-green-400/70 bg-green-500/20 text-green-300";

export const HUD_PILL_GOLD =
  "border-yellow-400/70 bg-yellow-500/20 text-yellow-200";

export const HUD_PILL_RED = "border-red-400/70 bg-red-500/20 text-red-300";

export const HUD_ATTACK_RATIO_PILL = `${HUD_PILL} ${HUD_PILL_BLUE} shrink-0 w-[8rem]`;

export const HUD_ATTACK_RATIO_COMPACT =
  "flex flex-col items-center shrink-0 gap-0.5 w-8";

export const HUD_TOOLBAR = `${HUD_SURFACE} flex w-fit flex-row items-center gap-2 px-2 py-1`;

export const HUD_TIMER_LABEL =
  "min-w-10 text-center text-xs font-semibold tabular-nums";

export const HUD_EVENT_ROW =
  "grid grid-cols-[7ch_minmax(0,1fr)_auto] items-center gap-1 border-b border-white/10 px-2 py-1 text-[10px] leading-[1.2]";

export const HUD_EVENT_META = "text-slate-400 tabular-nums";

export const HUD_EVENT_TEXT = "min-w-0 truncate text-left";

export const HUD_NOTIFICATION_PILL = `${HUD_PILL} ${HUD_PILL_RED} min-w-5 justify-center px-1.5`;

export const HUD_BUILD_STRIP =
  "grid w-fit grid-flow-col grid-rows-1 auto-cols-max gap-0.5";

export const HUD_BUILD_ITEM =
  "flex cursor-pointer items-center gap-0.5 rounded-[2px] border border-slate-500 px-0.5 pb-0.5 text-white hover:bg-gray-800";

export const HUD_BUILD_ITEM_ACTIVE = "bg-slate-400/20 hover:bg-gray-400/10";

export const HUD_BUILD_ITEM_DISABLED = "opacity-40";

export const HUD_BUILD_HOTKEY =
  "relative -top-1 ml-0.5 text-[10px] text-gray-400";

export const HUD_BUILD_ICON =
  "inline-flex size-5 items-center justify-center text-sm font-extrabold leading-none";

export const HUD_TOOLTIP =
  "w-max rounded-[2px] bg-gray-800/90 p-1 text-center text-xs text-gray-200 shadow-lg backdrop-blur-xs";

export const HUD_TOOLTIP_TITLE = "mb-1 text-sm font-bold";

export const HUD_IDENTITY_ROW = "flex min-w-0 items-center gap-2";

export const HUD_IDENTITY_NAME =
  "flex min-w-0 flex-1 items-center gap-2 text-xs font-bold";

export const HUD_ICON_CLUSTER = "ml-1 flex shrink-0 items-center gap-1";

export const HUD_STAT_GRID = "grid grid-cols-4 gap-2 text-[11px] leading-tight";

export const HUD_STAT_LABEL = "text-slate-400";

export const HUD_STAT_VALUE = "tabular-nums";
