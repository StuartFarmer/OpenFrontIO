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

export const HUD_PILL_MASK_ICON =
  "inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]";

export const HUD_PILL_VALUE = "tabular-nums";

export const HUD_PILL_BLUE = "border-aquarius/70 bg-aquarius/25 text-sky-100";

export const HUD_PILL_GREEN =
  "border-green-400/70 bg-green-500/20 text-green-300";

export const HUD_PILL_GOLD =
  "border-yellow-400/70 bg-yellow-500/20 text-yellow-200";

export const HUD_PILL_RED = "border-red-400/70 bg-red-500/20 text-red-300";

export const HUD_NOTIFICATION_PILL = `${HUD_PILL} ${HUD_PILL_RED} min-w-5 justify-center px-1.5`;

export const HUD_EVENT_ROW =
  "grid grid-cols-[7ch_minmax(0,1fr)_auto] items-center gap-1 border-b border-white/10 px-2 py-1 text-[10px] leading-[1.2]";

export const HUD_EVENT_META = "text-slate-400 tabular-nums";

export const HUD_EVENT_TEXT = "min-w-0 truncate text-left";

export const HUD_BUILD_STRIP =
  "grid w-fit grid-flow-col grid-rows-1 auto-cols-max gap-0.5";

export const HUD_BUILD_ITEM =
  "grid cursor-pointer grid-cols-[auto_auto_3ch] items-center gap-0.5 rounded-[2px] border border-slate-500 px-1 py-0.5 text-white hover:bg-gray-800";

export const HUD_BUILD_ITEM_ACTIVE = "bg-slate-400/20 hover:bg-gray-400/10";

export const HUD_BUILD_ITEM_DISABLED = "opacity-40";

export const HUD_BUILD_HOTKEY =
  "self-start text-[10px] leading-none text-gray-400";

export const HUD_BUILD_ICON =
  "inline-flex aspect-square h-5 shrink-0 items-center justify-center text-sm font-extrabold leading-none";

export const HUD_BUILD_COUNT =
  "w-[3ch] text-left text-xs leading-none tabular-nums";

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
