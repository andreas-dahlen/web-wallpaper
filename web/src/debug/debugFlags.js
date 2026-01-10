const rawDebug = import.meta.env?.VITE_DEBUG
const isDebug = rawDebug === true || rawDebug === 'true'

export const DEBUG = {
  // Master switch driven by Vite env; android build sets false, debug build sets true
  enabled: isDebug,

  drawDots: isDebug,

  lagTime: false,

  swipe: isDebug,

  dom: isDebug,

  input: isDebug,

  init: 'always'
}