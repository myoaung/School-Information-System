# i18n Localization Plan — EN + Myanmar

## Approach
- React Context + hook pattern (matching existing `AuthContext`)
- Translation files: `locales/en.js` and `locales/mm.js` — plain JS objects with dot-path keys
- Language persisted in `localStorage`, defaults to `mm` (Myanmar)
- No external i18n library — zero dependencies, same lightweight pattern as the rest of the app

## Files to create

| File | Purpose |
|------|---------|
| `client/src/context/LanguageContext.jsx` | Context provider + `useTranslation` hook |
| `client/src/locales/en.js` | English translations |
| `client/src/locales/mm.js` | Myanmar (မြန်မာ) translations |

## Files to modify

| File | Changes |
|------|---------|
| `client/index.html` | Add `lang` attribute (dynamic), add Myanmar font preload link |
| `client/src/index.css` | Add `@font-face` for MyanmarSabae, add `font-family` rule |
| `client/src/main.jsx` | Wrap `<App>` with `<LanguageProvider>` |
| `client/src/components/Navbar.jsx` | Add language toggle (🇲🇲/🇬🇧 button) — all static strings → `t()` |
| `client/src/pages/HomePage.jsx` | All strings → `t()` |
| `client/src/pages/LoginPage.jsx` | All strings → `t()` |
| `client/src/pages/RegisterPage.jsx` | All strings → `t()` |
| `client/src/pages/DashboardPage.jsx` | All strings → `t()` |
| `client/src/pages/AnnouncementsPage.jsx` | All strings → `t()` |
| `client/src/pages/AnnouncementDetailPage.jsx` | All strings → `t()` |
| `client/src/pages/ClassesPage.jsx` | All strings → `t()` |
| `client/src/pages/CurriculumPage.jsx` | All strings → `t()` |
| `client/src/pages/ContactPage.jsx` | All strings → `t()` |
| `client/src/components/Footer.jsx` | All strings → `t()` |
| `client/src/components/AnnouncementCard.jsx` | All strings → `t()` |
| `client/src/components/ProtectedRoute.jsx` | Error message → `t()` |

## Myanmar Font
- Font: **MyanmarSabae** from saturngod/myanmar-unicode-fonts
- Source: `https://raw.githubusercontent.com/saturngod/myanmar-unicode-fonts/master/MyanmarSabae/MyanmarSabae.ttf`
- Fallback: system default Myanmar fonts (`Pyidaungsu`, `Myanmar Text`, `Zawgyi-One`)
- Applied globally via CSS `font-family`

## Translation Strategy
- Keys use dot-notation: `"nav.announcements"`, `"home.hero.title"`, `"login.signIn"`
- `t(key)` returns the translated string for the current locale
- Dynamic values use template: `t('dashboard.welcome', { name: user.name })` → `"မင်္ဂလာပါ {name}!"`
- Dates formatted with `my-MM` or `en-US` locale based on current language

## Language Toggle
- Simple button in Navbar showing current flag (🇲🇲 / 🇬🇧)
- Click toggles, stores in localStorage
- All text re-renders instantly via React context
