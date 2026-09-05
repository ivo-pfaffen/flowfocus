import type { FocusEvent } from "./focus-tracking"

// Public measurement ID, not a credential. Owned by Flowfocus - personal portfolio.
export const MEASUREMENT_ID = "G-K16YW9ZKBM"
const PRODUCTION_HOST = "flowfocus.ivopfaffen.com"
let initialized = false

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return false
  const query = new URLSearchParams(window.location.search)
  try {
    if (query.get("analytics") === "off") localStorage.setItem("flowfocus-analytics-opt-out", "1")
    if (query.get("analytics") === "on") localStorage.removeItem("flowfocus-analytics-opt-out")
    if (localStorage.getItem("flowfocus-analytics-opt-out") === "1") return false
  } catch {}
  if (query.get("analytics") === "off") return false
  if (window.location.hostname !== PRODUCTION_HOST) return false
  if (initialized) return true
  initialized = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag("js", new Date())
  // Keep task names (which appear in document.title) and arbitrary URL data out.
  const location = new URL(window.location.origin + window.location.pathname)
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid"]) {
    const value = query.get(key)
    if (value) location.searchParams.set(key, value.slice(0, 200))
  }
  let referrer = ""
  try { referrer = new URL(document.referrer).origin } catch {}
  window.gtag("config", MEASUREMENT_ID, {
    page_title: "FlowFocus",
    page_location: location.href,
    page_referrer: referrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(query.get("analytics_debug") === "1" ? { debug_mode: true, traffic_type: "developer" } : {}),
  })
  return true
}

export function trackFocus(event: FocusEvent, parameters: Record<string, number | string>) {
  if (!initializeAnalytics()) return
  window.gtag?.("event", event, { ...parameters, page_title: "FlowFocus", send_to: MEASUREMENT_ID })
}
