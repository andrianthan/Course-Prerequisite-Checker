# Phase 3 UI-SPEC: Course Prerequisite Checker Web App

**Generated:** 2026-04-25
**Status:** Design contract for graded demo

## Brand & Visual System

- **Primary:** Indigo-600 (`#4F46E5`) — buttons, active states, brand accents
- **Neutrals:** Gray-50 bg, Gray-900 text, Gray-200 borders, Gray-500 muted
- **Success:** Green-600 (eligible)
- **Error:** Red-600 (not eligible, errors)
- **Warning:** Amber-500 (near-eligible)
- **Font:** Inter or system-ui sans-serif
- **Spacing scale:** Tailwind defaults (4px base)
- **Radius:** `rounded-lg` (8px) on cards/inputs, `rounded-md` on buttons
- **Shadow:** `shadow-sm` on cards, `shadow-lg` only on modals/dropdowns

## Layout

Single-page app with a top nav bar + main content area. No sidebar.

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] Course Prerequisite Checker      [Backend: ◉ OOP ○ FP]│ ← Top nav (sticky)
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Step 1: Upload your transcript                              │
│   ┌─────────────────────────────────────┐                     │
│   │  📄  Drop PDF or click to select    │                     │
│   └─────────────────────────────────────┘                     │
│                                                                │
│   Step 2: Confirm your courses                                │
│   ┌─────────────────────────────────────┐                     │
│   │ CS46A  B+   ✏     CS46B  A-   ✏    │                     │
│   │ MATH42 B    ✏    [+ Add course]     │                     │
│   └─────────────────────────────────────┘                     │
│                                                                │
│   Step 3: Pick a course                                       │
│   ┌─────────────────────────────────────┐                     │
│   │ 🔍 Search CS courses...   ▼         │                     │
│   └─────────────────────────────────────┘                     │
│                                                                │
│   ┌────────────────────┐  ┌─────────────────────────────────┐│
│   │ ✓ ELIGIBLE          │  │ Recommended Next               ││
│   │ CS151               │  │ Eligible (11)   Near (23)      ││
│   │ "Eligible: CS46A    │  │ • CS100W    • CS116B (CS116A)  ││
│   │  (B+), MATH42 (A)"  │  │ • CS123A    • CS122 (CS146)    ││
│   └────────────────────┘  └─────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

## Components

### Top Nav (sticky)
- Logo + title left, backend toggle right.
- Toggle: pill style, two segments OOP / FP. Selected = indigo bg + white text. Unselected = gray text. Click toggles + re-runs current API calls.
- Below nav: subtle bottom border.

### Upload Card
- Dashed border (indigo on drag), centered cloud/document icon, "Drop PDF or click to select" text, smaller "Max 5MB" hint.
- Loading: replace with spinner + "Parsing transcript…" text.
- Error: red border, error text below.

### Course List (post-upload)
- Table-like rows: course_id (mono font, indigo) + grade (badge) + edit icon.
- Add course button at end (dashed border, plus icon).
- Editable inline (click row → input swap).

### Course Picker
- Combobox: search input + dropdown of all SJSU CS courses.
- Auto-trigger eligibility check on select.

### Verdict Card
- Big icon + state header: ✓ ELIGIBLE (green) / ✗ NOT ELIGIBLE (red).
- Course ID + name below.
- Explanation in smaller text, monospace for course_ids.
- If not-eligible: "What's missing" highlighted.

### Recommendations Panel
- Two tabs: Eligible (green dot count) / Near-eligible (amber dot count).
- List items: course_id + name. Near-eligible adds missing prereq subline.
- Scrollable if long.
- Click item → populate course picker + show verdict.

## States

| State | Treatment |
|-------|-----------|
| Idle | Empty inputs, ghost text |
| Loading | Spinner overlay or replace content |
| Success (verdict eligible) | Green card |
| Failure (verdict not eligible) | Red card, missing prereqs highlighted |
| API error | Toast or inline error w/ retry |
| Empty (no transcript yet) | Show only Step 1 |

## Interactions

1. Land on app → only Step 1 visible
2. Upload PDF → loading → parsed courses displayed → Step 2 + 3 reveal
3. Pick course → instant API call → verdict appears + recommendations refresh
4. Toggle OOP/FP → all current API calls re-run, results update
5. Edit a course in transcript → recommendations + verdict refresh

## Frontend Stack

- React 18 + Vite
- Tailwind CSS (utility-first, no component lib)
- Native fetch (no axios)
- React state (useState/useContext) — no Redux
- File upload via FormData

## Screens

Single page. No routes.

## Polish Checklist (graded demo)

- [ ] Clean typography, consistent spacing
- [ ] Loading states everywhere async
- [ ] Error states (no silent failures)
- [ ] Disabled states (button while loading)
- [ ] Success states (verdict cards)
- [ ] Empty states (before upload)
- [ ] Backend toggle visible + working
- [ ] Eligible + near-eligible visible side-by-side
- [ ] Mobile-responsive baseline (stack columns < 768px)

## Out of Scope (UI)

- Dark mode
- i18n
- Animations beyond fade-in
- Advanced course filtering (by dept/level/etc.)
- Save/share session
