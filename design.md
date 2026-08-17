# NAMMA THANJAI — UNIVERSAL CITY-PLATFORM DESIGN SYSTEM (v2.0)

> **Version**: 2.0.0  
> **Concept**: Tactile High-Contrast Accent-Led Palette  
> **Target Ecosystem**: Mobile Web App (PWA), Android APK Onboarding, Desktop Website  
> **Compliance**: WCAG 2.2 AA

---

## 01. BRAND IDENTITY & STRATEGY

* **Brand Primary (Yellow `#FBBF24`)**: Represents Energy, Sunshine, and Community.
* **Accent-Led Strategy**: Yellow is used as a **Strategic Weapon**. It acts as the "lightbulb" that guides the user's eye directly to primary action buttons and active status states.
* **The Squint Test**: If you squint your eyes at the screen, only the **Register/CTA button** and current active tab should be glowing yellow. Everything else is clean White & Slate.
* **Typography**: **Red Hat Display** (Headings & Display UI) + **Red Hat Text** (Body Copy).

---

## 02. COLOR PALETTE SYSTEM

| Token | Hex | Role | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `#FBBF24` | **The Soul** | CTAs, Primary Buttons, Active Tabs, Key Highlights. |
| **Brand Deep** | `#D97706` | **The Anchor** | 3D Button bottom border, hover states, link highlights. |
| **Neutral-900** | `#0F172A` | **The Structure** | Headings, Primary UI Text, Icon Boxes, Footer. |
| **Neutral-500** | `#64748B` | **The Support** | Subtext, helper descriptions, inactive icons. |
| **Neutral-50** | `#F8FAFC` | **The Canvas** | Page background surface, subtle section breaks. |
| **Pure White** | `#FFFFFF` | **The Clarity** | Card backgrounds, Marquee pills, Form fields. |

---

## 03. TYPOGRAPHY SCALE (RED HAT DISPLAY)

| Token | Weight | Size | Tracking | Color | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **H1 / Display** | 900 (Black) | 48px – 64px | `-0.02em` | `#0F172A` | Hero Title ("NAMMA THANJAI.") |
| **H2 / H3** | 700 (Bold) | 24px – 32px | Normal | `#0F172A` | Section Headings & Card Titles |
| **Body (Main)** | 400 (Regular) / 500 (Medium) | 14px – 16px | Normal | `#64748B` | Card Paragraphs & Subtitles |
| **Labels / Tabs** | 600 (Semibold) | 12px – 14px | `0.05em` | UPPERCASE | Badges, Marquee Items |
| **Button Text** | 700 (Bold) | 14px – 16px | `0.05em` | `#0F172A` | Primary & Secondary CTAs |

---

## 04. COMPONENT LOGIC (v2.0 ACCENT-LED)

### 4.1 Tactile 3D Buttons
* **Primary CTA (`REGISTER` / `Download APK`)**:
  * Background: `#FBBF24` (Brand Primary Yellow)
  * Text: `#0F172A` (Deep Slate)
  * 3D Bottom Border: `border-b-[3px] border-[#D97706]`
  * Press Effect: `active:scale-[0.97]`
* **Secondary CTA (`EXPLORE`)**:
  * Background: `#FFFFFF` (Pure White)
  * Border: `2px solid #0F172A` (Deep Slate)
  * Text: `#0F172A` (Deep Slate)
  * Press Effect: `active:scale-[0.97]`

### 4.2 Anti-Overload Category Cards
* **Card Background**: `#FFFFFF` (Pure White).
* **Card Border**: `1px solid #E2E8F0` (Default) → `2px solid #0F172A` (Hover).
* **Icon Box**: Enclosed in a **48x48px Slate `#0F172A` box with Brand Yellow `#FBBF24` icon inside**.

### 4.3 Marquee Pills & Step Indicators
* **Marquee Pills**: White background (`#FFFFFF`) + 1px Slate border (`#E2E8F0`) + **small Yellow Dot (`#FBBF24`)** next to text.
* **Step Indicators**: Sleek Slate `#0F172A` circle with **Brand Yellow `#FBBF24` number inside**.

---

## 05. DUAL-RUNTIME ARCHITECTURE

### 5.1 Web App & Android APK View (< 768px)
* **Scope**: **First Fold ONLY** (`h-[calc(100dvh-3.5rem)]` with `overflow-hidden`).
* **Scroll**: **Zero Vertical Scrollbar**.
* **Role**: Primary Onboarding & Sign-In Screen.

### 5.2 Desktop Website View (≥ 768px)
* **Scope**: **Multi-Fold Landing Page** rendered via CSS `hidden md:block`.
* **Folds**:
  1. Fold 1: 3D Mascot Hero First Fold
  2. Fold 2: Core Platform Categories
  3. Fold 3: How Namma Thanjai Works
  4. Fold 3.5: Official Android App Banner (`StaticApkCard`)
  5. Fold 4: Call to Action & Footer Credits
