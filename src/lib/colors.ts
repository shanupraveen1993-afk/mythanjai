/**
 * Namma Thanjai Unified Design Tokens & Color Palette
 * 
 * 1. Primary Action (CTA): Warm Amber / Yellow (#f59e0b / #FBBF24)
 *    - Strictly for primary conversion actions (Post CTA, Call button, Submit)
 * 
 * 2. Brand Accent (Secondary): Royal Blue (#1d4ed8 / #2563eb)
 *    - For core logo identity, active navigation states, links, secondary buttons (My Listing)
 * 
 * 3. Contact Actions: Dark WhatsApp Green (#128C7E / #075e54)
 *    - Dedicated color for WhatsApp chat and Google Maps navigation CTAs
 * 
 * 4. Surface & Text Neutrals: Slate (#0f172a / #475569 / #f8fafc)
 *    - Dark Slate (#0f172a) for hero banners & dark footers
 *    - Slate (#475569) for readable body text
 *    - Canvas (#f8fafc) for main app background
 */

export const COLOR_TOKENS = {
  // Primary CTA Action
  primaryCTA: "#FBBF24",
  primaryCTAHover: "#F59E0B",
  primaryCTAText: "#0f172a",

  // Brand Identity Accent
  brandBlue: "#1d4ed8",
  brandBlueHover: "#1e40af",
  brandBlueLight: "rgba(29, 78, 216, 0.08)",

  // Contact Actions (WhatsApp & Navigation)
  whatsappGreen: "#128C7E",
  whatsappGreenHover: "#075e54",

  // Surfaces & Backgrounds
  darkSlate: "#0f172a",
  canvasBg: "#f8fafc",
  cardBg: "#ffffff",
  cardBorder: "rgba(226, 232, 240, 0.9)",

  // Typography
  titleText: "#0f172a",
  bodyText: "#475569",
  subtleText: "#64748b",
  mutedText: "#94a3b8",
} as const;
