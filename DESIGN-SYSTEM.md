# SchoolHub Design System

> Generated from UI/UX Pro Max analysis — education SaaS dashboard for Myanmar Basic Education.

---

## 1. Design Identity

| Attribute | Value |
|-----------|-------|
| **Product** | School Information System (SaaS) |
| **Industry** | Education / EdTech |
| **Style** | Claymorphism — soft 3D, chunky, playful, bubbly |
| **Pattern** | Feature-Rich Showcase with Hero → Features → CTA |
| **Stack** | React 19 + Vite + Tailwind CSS 4 |
| **Dark Mode** | Class-based (`.dark` on `<html>`) |

### Style Rationale

Claymorphism fits education because it's approachable, friendly, and visually warm — exactly what students, teachers, and parents expect. The soft 3D effect with thick borders (3-4px) and double shadows creates a tactile, toy-like feel that reduces intimidation in complex admin dashboards.

---

## 2. Color System

### Primary Palette

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Primary** | `#2563EB` | `blue-600` | Primary actions, active states, links |
| **Primary Dark** | `#1D4ED8` | `blue-700` | Hover states, pressed |
| **Primary Light** | `#3B82F6` | `blue-500` | Secondary elements, icons |
| **Primary 50** | `#EFF6FF` | `blue-50` | Light backgrounds, tags |
| **Secondary** | `#60A5FA` | `blue-400` | Accents, decorative |
| **CTA** | `#F97316` | `orange-500` | Call-to-action buttons, badges |
| **CTA Dark** | `#EA580C` | `orange-600` | CTA hover |

### Neutral Palette

| Role | Light Mode | Dark Mode |
|------|------------|-----------|
| **Background** | `#F8FAFC` (slate-50) | `#0F172A` (slate-900) |
| **Surface** | `#FFFFFF` | `#1E293B` (slate-800) |
| **Surface Elevated** | `#FFFFFF` + shadow | `#334155` (slate-700) |
| **Text** | `#1E293B` (slate-800) | `#F1F5F9` (slate-100) |
| **Text Muted** | `#475569` (slate-600) | `#94A3B8` (slate-400) |
| **Text Subtle** | `#64748B` (slate-500) | `#CBD5E1` (slate-300) |
| **Border** | `#E2E8F0` (slate-200) | `#334155` (slate-700) |
| **Border Light** | `#F1F5F9` (slate-100) | `#1E293B` (slate-800) |

### Semantic Colors

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| **Success** | `green-50` / `green-900/40` | `green-700` / `green-300` | Active, completed, online |
| **Warning** | `amber-50` / `amber-900/40` | `amber-700` / `amber-300` | Incomplete, pending review |
| **Error** | `red-50` / `red-900/40` | `red-700` / `red-300` | Critical, failed, at-risk |
| **Info** | `blue-50` / `blue-900/40` | `blue-700` / `blue-300` | Informational, new |

### Anti-Patterns

- ❌ Never use `purple-*` for primary actions — use `blue-*` only
- ❌ Never use `text-slate-400` for body text in light mode (too light, fails 4.5:1)
- ❌ Never use `border-white/10` in light mode (invisible)
- ❌ Never mix status colors — green = success, red = error, amber = warning, blue = info

---

## 3. Typography

### Font Stack

```css
/* Headings: Poppins — geometric, modern, friendly */
/* Body: Open Sans — humanist, readable, accessible */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  heading: ['Poppins', 'sans-serif'],
  body: ['Open Sans', 'MyanmarSabae', 'Pyidaungsu', 'Noto Sans Myanmar', 'system-ui', 'sans-serif'],
}
```

### Type Scale

| Element | Class | Size | Weight | Line Height |
|---------|-------|------|--------|-------------|
| Hero Title | `text-4xl lg:text-6xl` | 36-60px | 800 (extrabold) | 1.1 |
| Page Title | `text-3xl` | 30px | 800 (extrabold) | 1.2 |
| Section Title | `text-2xl` | 24px | 700 (bold) | 1.3 |
| Card Title | `text-xl` | 20px | 700 (bold) | 1.4 |
| Subtitle | `text-lg` | 18px | 400 (normal) | 1.5 |
| Body | `text-base` | 16px | 400 | 1.5-1.75 |
| Small | `text-sm` | 14px | 500 (medium) | 1.5 |
| Caption | `text-xs` | 12px | 500 | 1.4 |
| Badge/Tag | `text-xs` | 12px | 600 (semibold) | 1.0 |

### Rules

- Body text: **minimum 16px** on mobile (`text-base`)
- Line length: **65-75 characters** max per line
- Heading font (`Poppins`) for titles only — not body text
- Myanmar text uses `MyanmarSabae` as first fallback

---

## 4. Spacing & Layout

### Spacing Scale

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| xs | `p-1` / `gap-1` | 4px | Tight inline spacing |
| sm | `p-2` / `gap-2` | 8px | Icon gaps, tag padding |
| md | `p-3` / `gap-3` | 12px | Card inner padding |
| lg | `p-4` / `gap-4` | 16px | Standard card padding |
| xl | `p-6` / `gap-6` | 24px | Section padding |
| 2xl | `p-8` / `gap-8` | 32px | Page section spacing |

### Layout Grid

| Breakpoint | Width | Columns | Gutters |
|------------|-------|---------|---------|
| Mobile | 375px | 1 | 16px |
| Tablet | 768px | 2-3 | 24px |
| Desktop | 1024px | 3-4 | 24px |
| Wide | 1440px | 4-6 | 24px |

### Container

```html
<!-- Standard page container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### Page Section Spacing

```html
<section class="py-24"> <!-- 96px vertical padding -->
```

---

## 5. Components

### 5.1 Cards (Claymorphism)

```html
<!-- Base card -->
<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6
            border border-slate-200 dark:border-slate-700
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

<!-- Interactive card (cursor-pointer required) -->
<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6
            border-2 border-slate-200 dark:border-slate-700
            hover:border-blue-300 hover:shadow-xl hover:-translate-y-1
            transition-all duration-200 cursor-pointer">
```

**Rules:**
- Always use `rounded-2xl` (1rem) for cards
- Always use `cursor-pointer` on clickable cards
- Hover: `hover:shadow-xl hover:-translate-y-1` (1px lift max)
- Border: `border border-slate-200` in light, `dark:border-slate-700` in dark

### 5.2 Buttons

```html
<!-- Primary CTA -->
<button class="bg-blue-600 hover:bg-blue-700 text-white
               px-6 py-3 rounded-xl font-semibold
               shadow-md shadow-blue-600/25
               hover:shadow-lg hover:-translate-y-0.5
               transition-all duration-200 cursor-pointer
               disabled:opacity-50 disabled:cursor-not-allowed
               disabled:hover:translate-y-0 disabled:hover:shadow-md">

<!-- Secondary / Ghost -->
<button class="bg-white dark:bg-slate-800
               border-2 border-slate-200 dark:border-slate-600
               hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700
               text-slate-700 dark:text-slate-200
               px-6 py-3 rounded-xl font-semibold
               transition-all duration-200 cursor-pointer">

<!-- Danger -->
<button class="bg-red-600 hover:bg-red-700 text-white
               px-6 py-3 rounded-xl font-semibold
               shadow-md shadow-red-600/25
               transition-all duration-200 cursor-pointer">
```

**Button Sizes:**

| Size | Padding | Text | Radius |
|------|---------|------|--------|
| sm | `px-3 py-1.5` | `text-sm` | `rounded-lg` |
| md | `px-5 py-2.5` | `text-sm` | `rounded-xl` |
| lg | `px-6 py-3` | `text-base` | `rounded-xl` |
| xl | `px-8 py-4` | `text-lg` | `rounded-2xl` |

### 5.3 Form Inputs

```html
<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
  Field Name
</label>
<input
  type="text"
  class="w-full px-4 py-2.5 rounded-xl
         bg-white dark:bg-slate-800
         border-2 border-slate-200 dark:border-slate-600
         text-slate-900 dark:text-slate-100
         placeholder-slate-400 dark:placeholder-slate-500
         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
         transition-all duration-200
         disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter value..."
/>
```

**Rules:**
- Always pair `<input>` with a `<label>` (accessibility)
- Focus ring: `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`
- Border: `border-2` (thick, claymorphism style)
- Never use `border` (1px) — always `border-2` for inputs

### 5.4 Badges / Tags

```html
<!-- Status badge -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
             bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
  Active
</span>

<!-- Count badge -->
<span class="inline-flex items-center justify-center w-5 h-5 rounded-full
             bg-blue-600 text-white text-xs font-bold">
  12
</span>
```

### 5.5 Stat Cards

```html
<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5
            border border-slate-200 dark:border-slate-700">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40
                flex items-center justify-center">
      <!-- SVG icon, w-5 h-5 text-blue-600 -->
    </div>
    <div>
      <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">128</p>
      <p class="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
    </div>
  </div>
</div>
```

### 5.6 Loading Skeletons

```html
<div class="animate-pulse">
  <div class="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
  <div class="grid grid-cols-4 gap-4 mb-8">
    <div class="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
    <div class="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
    <div class="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
    <div class="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
  </div>
</div>
```

### 5.7 Modals

```html
<!-- Overlay -->
<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

  <!-- Modal content -->
  <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl
              max-w-lg w-full max-h-[90vh] overflow-y-auto
              border border-slate-200 dark:border-slate-700">
    <div class="p-6">
      <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Title</h3>
      <!-- Content -->
    </div>
    <div class="px-6 pb-6 flex justify-end gap-3">
      <button class="...">Cancel</button>
      <button class="bg-blue-600 ...">Confirm</button>
    </div>
  </div>
</div>
```

---

## 6. Icon System

### Rules

- **Always SVG** — never emojis for UI icons
- **Consistent sizing**: `w-5 h-5` (20px) for inline, `w-6 h-6` (24px) for standalone
- **Consistent stroke**: `strokeWidth="1.5"` or `strokeWidth="2"`
- **Source**: Heroicons (heroicons.com) or Lucide (lucide.dev)

### Status Icons (replace emojis)

| Status | Before (Emoji) | After (SVG) |
|--------|---------------|-------------|
| Draft | 📝 | `<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>` |
| Warning | ⚠️ | `<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>` |
| Success | ✅ | `<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>` |
| Active | 🟢 | `<circle cx="12" cy="12" r="4" fill="currentColor"/>` |

---

## 7. Animation & Motion

### Timing

| Duration | Usage |
|----------|-------|
| 150ms | Hover states, color transitions |
| 200ms | Button presses, focus rings |
| 300ms | Page transitions, modals |
| 500ms | Complex animations (hero gradient) |

### Easing

```css
/* Standard */
transition: all 150ms ease;

/* Spring-like (playful, claymorphism) */
transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Micro-Interactions

```css
/* Card hover — subtle lift */
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Button press — soft press */
button:active {
  transform: scale(0.98);
}
```

### Loading States

- Skeletons: `animate-pulse` with `bg-slate-200` → `bg-slate-300` gradient
- Buttons: Disable + show spinner during async ops
- Page: Show skeleton, never blank screen

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Shadows (Claymorphism)

### Shadow Scale

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `shadow-sm` | `0 1px 2px rgba(59,130,246,0.06), 0 1px 3px rgba(59,130,246,0.1)` | `0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)` |
| `shadow-md` | `0 4px 6px -1px rgba(59,130,246,0.1), 0 2px 4px -2px rgba(59,130,246,0.1)` | `0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.4)` |
| `shadow-lg` | `0 10px 15px -3px rgba(59,130,246,0.1), 0 4px 6px -4px rgba(59,130,246,0.1)` | `0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.4)` |
| `shadow-xl` | `0 20px 25px -5px rgba(59,130,246,0.1), 0 8px 10px -6px rgba(59,130,246,0.1)` | `0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.4)` |

### Claymorphism Double Shadow

```css
/* Inner glow + outer shadow = clay effect */
.clay-card {
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.6),
    0 4px 12px rgba(59, 130, 246, 0.15);
  border: 3px solid white;
  border-radius: 16px;
}
```

---

## 9. Charts & Data Visualization

### Recommended Libraries

| Library | Best For | Size |
|---------|----------|------|
| **Recharts** | Simple dashboards, bar/line/pie | ~40KB |
| **ApexCharts** | Complex analytics, real-time | ~120KB |
| **Chart.js** | Lightweight, canvas-based | ~60KB |

### Chart Colors

```js
const CHART_COLORS = {
  primary: '#3B82F6',    // blue-500
  secondary: '#60A5FA',  // blue-400
  success: '#22C55E',    // green-500
  warning: '#F97316',    // orange-500
  danger: '#EF4444',     // red-500
  neutral: '#94A3B8',    // slate-400
};
```

### Chart Type Guide

| Data Type | Chart | Example Use |
|-----------|-------|-------------|
| Trends over time | Line chart | Attendance trends, grade progression |
| Comparisons | Bar chart | Class performance, department budgets |
| Parts of whole | Donut/Pie | Risk distribution, expense breakdown |
| Single KPI | Stat card | Total students, revenue, attendance rate |
| Distribution | Histogram | Grade distribution, score ranges |

### Accessibility

- Always provide a **table alternative** below charts
- Use **text labels** on chart axes (not color alone)
- Minimum **4.5:1 contrast** for chart text

---

## 10. Accessibility Checklist

### Critical (Must Pass)

- [ ] **Color contrast**: 4.5:1 minimum for body text, 3:1 for large text
- [ ] **Focus rings**: Visible `outline: 2px solid blue-500` on all interactive elements
- [ ] **Form labels**: Every `<input>` has an associated `<label>` or `aria-label`
- [ ] **Alt text**: All meaningful images have descriptive `alt` attributes
- [ ] **Keyboard nav**: Tab order matches visual order, all actions keyboard-accessible
- [ ] **Touch targets**: Minimum 44x44px for all interactive elements

### High (Should Pass)

- [ ] **Color independence**: Status uses icon + text, not color alone
- [ ] **Loading states**: Skeleton or spinner for operations > 300ms
- [ ] **Error messages**: Clear, specific, near the problem field
- [ ] **Reduced motion**: Respect `prefers-reduced-motion`
- [ ] **Semantic HTML**: Use `<nav>`, `<main>`, `<header>`, `<footer>`

### Medium (Nice to Have)

- [ ] **Skip links**: "Skip to main content" for screen readers
- [ ] **ARIA landmarks**: Proper role attributes on sections
- [ ] **Live regions**: `aria-live="polite"` for dynamic content updates

---

## 11. Responsive Breakpoints

| Breakpoint | Prefix | Width | Layout |
|------------|--------|-------|--------|
| Mobile | (default) | < 640px | Single column, stacked |
| Tablet | `sm:` | 640px+ | 2 columns |
| Laptop | `md:` | 768px+ | 3 columns |
| Desktop | `lg:` | 1024px+ | 4 columns, sidebar |
| Wide | `xl:` | 1280px+ | Full layout |

### Mobile-First Rules

```html
<!-- Stack on mobile, grid on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Hide on mobile, show on desktop -->
<div class="hidden lg:block">

<!-- Show on mobile, hide on desktop -->
<div class="lg:hidden">
```

---

## 12. Dark Mode Implementation

### CSS Variables (already in index.css)

```css
:root {
  --color-bg: #F8FAFC;
  --color-text: #1E293B;
  --color-text-muted: #64748B;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
}

.dark {
  --color-bg: #0F172A;
  --color-text: #F1F5F9;
  --color-text-muted: #94A3B8;
  --color-surface: #1E293B;
  --color-border: #334155;
}
```

### Tailwind Dark Mode Classes

```html
<!-- Background -->
<div class="bg-white dark:bg-slate-800">

<!-- Text -->
<h1 class="text-slate-900 dark:text-slate-100">
<p class="text-slate-500 dark:text-slate-400">

<!-- Border -->
<div class="border-slate-200 dark:border-slate-700">

<!-- Shadows (auto via CSS vars) -->
<div class="shadow-md">
```

### Dark Mode Rules

- ❌ Never use `bg-gray-900` — use `dark:bg-slate-800`
- ❌ Never use `text-gray-400` for body text — use `dark:text-slate-400`
- ✅ All shadows auto-adjust via CSS variables
- ✅ Test both modes before delivery

---

## 13. Current Codebase Issues

### Issues Found

| File | Issue | Fix |
|------|-------|-----|
| `ClassesPage.jsx:14-31` | Emoji icons for status (📝 ⚠️ ✅ 🟢) | Replace with SVG icons |
| `HomePage.jsx:79` | Emoji in badge (`✨`) | Replace with SVG sparkle icon |
| `HomePage.jsx:150` | Emoji flag (`🇲🇲`) | Keep as-is (flag emoji is acceptable) |
| `AnalyticsPage.jsx:45-48` | `purple-*` color classes | Change to `blue-*` |
| `AnalyticsPage.jsx` (all) | `text-purple-900` headings | Change to `text-slate-900` |
| All pages | Inconsistent card borders | Standardize to `border border-slate-200 dark:border-slate-700` |

### Priority Fixes

1. **Replace emoji icons** with SVG in `ClassesPage.jsx` status config
2. **Standardize colors** — replace `purple-*` with `blue-*` or `slate-*` across all pages
3. **Add `cursor-pointer`** to all clickable cards and buttons
4. **Normalize border widths** — inputs use `border-2`, cards use `border`
5. **Consistent shadows** — use `shadow-md` for cards, `shadow-lg` on hover

---

## 14. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  SchoolHub Design System — Quick Reference                  │
├─────────────────────────────────────────────────────────────┤
│  Primary:     #2563EB (blue-600)                            │
│  CTA:         #F97316 (orange-500)                          │
│  Heading:     Poppins (extrabold/bold)                      │
│  Body:        Open Sans + MyanmarSabae                      │
│  Card:        rounded-2xl shadow-md border border-slate-200 │
│  Button:      rounded-xl font-semibold shadow-md            │
│  Input:       rounded-xl border-2 focus:border-blue-500     │
│  Badge:       rounded-full text-xs font-semibold            │
│  Hover:       -translate-y-1 shadow-xl transition-all 200ms │
│  Focus:       outline: 2px solid blue-500                   │
│  Icons:       SVG only (Heroicons/Lucide), w-5 h-5          │
│  Skeleton:    animate-pulse bg-slate-200 rounded-2xl         │
└─────────────────────────────────────────────────────────────┘
```
