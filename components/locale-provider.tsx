"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { resolveLocale, translate, type Locale, type Translate } from "@/lib/i18n"

const LocaleContext = createContext<{ locale: Locale; t: Translate }>({
  locale: "en",
  t: (message) => translate("en", message),
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Match server HTML on the first render. The page already waits for hydration.
  const [locale, setLocale] = useState<Locale>("en")
  useEffect(() => {
    const update = () => {
      const next = resolveLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
      setLocale(next)
      document.documentElement.lang = next
    }
    update()
    window.addEventListener("languagechange", update)
    return () => window.removeEventListener("languagechange", update)
  }, [])
  const value = useMemo(() => ({ locale, t: (message: Parameters<Translate>[0]) => translate(locale, message) }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}
