"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { initializeAnalytics, MEASUREMENT_ID } from "@/lib/analytics"

export function ProductAnalytics() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => { setEnabled(initializeAnalytics()) }, [])
  if (!enabled) return null
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" />
}
