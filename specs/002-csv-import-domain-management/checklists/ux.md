# UX & Visual Integrity Requirements Quality Checklist: Phase 2 — CSV Import & Domain Management

**Purpose**: Validate the quality, completeness, clarity, and consistency of UX interaction state requirements and visual integrity requirements across the Phase 2 feature specification
**Created**: 2026-05-22
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests REQUIREMENTS QUALITY — whether the spec defines clear, complete, and consistent UX and visual rules. It does NOT test implementation correctness.

---

## Mutation & List Refresh Requirements

- [ ] CHK001 - Are the exact refresh/invalidation requirements defined for the domain list after a delete operation? Does the spec specify whether the list must reflect the deletion within the current page or after navigation? [Clarity, Spec §US4 Scenario 1-2]
- [ ] CHK002 - Are requirements defined for how the domain list behaves after deleting the last domain on a paginated page (e.g., should it auto-navigate to the previous page)? [Edge Case, Gap]
- [ ] CHK003 - Are requirements specified for the domain list update behavior when a bulk delete partially succeeds (some domains fail to delete)? [Exception Flow, Gap]
- [ ] CHK004 - Is the "list updates to exclude it" requirement from US4 quantified with a specific timing threshold for user-visible refresh? [Clarity, Spec §US4 Scenario 1]
- [ ] CHK005 - Are concurrent mutation requirements defined? (e.g., user deletes domains in one tab while viewing list in another tab) [Coverage, Gap, Spec §Edge Cases: "two users same account"]
- [ ] CHK006 - Does the spec define what the user sees during the delete operation — is there a loading indicator, disabled state, or optimistic removal with rollback on error? [Completeness, Gap]
- [ ] CHK007 - Are cache/staleness requirements explicitly stated for the domain list after navigating back from the detail page after an edit? [Coverage, Spec §US3 Scenario 1]
- [ ] CHK008 - Is the "the domain appears with the 'Sold' status on the list page" requirement sufficiently clear about HOW the update propagates — instant optimistic update, page reload, or manual refresh? [Clarity, Spec §US3 Scenario 1]

---

## Form & Dropdown Visual Layering Requirements

- [ ] CHK009 - Are z-index or stacking context requirements defined for dropdown menus (Status Select, TLD filter Select) relative to adjacent form fields and page content? [Gap]
- [ ] CHK010 - Is the visual relationship between the Status dropdown overlay and the "Purchase Price ($)" field defined — specifically, must the dropdown render above subsequent form fields? [Clarity, Gap]
- [ ] CHK011 - Are background opacity/transparency requirements specified for Select dropdown menus in both dark and light themes? [Completeness, Spec §Theme Requirements]
- [ ] CHK012 - Are dropdown menu border, shadow, and backdrop blur requirements defined to ensure visual separation from underlying content? [Gap]
- [ ] CHK013 - Does the spec define whether form field placeholders, labels, and values remain visible when a dropdown is expanded over them? [Coverage, Gap]
- [ ] CHK014 - Are minimum dropdown row height and text contrast requirements defined for selectable items within the Status dropdown? [Completeness, Gap]
- [ ] CHK015 - Are requirements defined for dropdown scroll behavior when the list of options exceeds the viewport height? [Edge Case, Gap]

---

## Dialog & Modal Interaction Requirements

- [ ] CHK016 - Does the spec define what happens to the underlying page content when the delete confirmation dialog is open — must the background be dimmed, inert, or scrollable? [Clarity, Spec §FR-023]
- [ ] CHK017 - Are keyboard interaction requirements specified for the delete confirmation dialog (Escape to cancel, Enter to confirm, focus trapping)? [Coverage, Gap]
- [ ] CHK018 - Is the dialog dismissal behavior defined for clicking outside the dialog vs clicking Cancel vs pressing Escape? [Consistency, Spec §US4 Scenario 3]
- [ ] CHK019 - Are loading state requirements defined for the Delete button within the confirmation dialog (e.g., disabled + spinner while the delete API call is in-flight)? [Completeness, Gap]

---

## Loading & Empty State Requirements

- [ ] CHK020 - Are distinct loading state requirements defined for each data-dependent view: domain list (initial load), domain list (filter change), domain detail (page load), import history (initial load)? [Completeness, Spec §FR-015, FR-024]
- [ ] CHK021 - Is the empty state for "No domains" clearly defined to include a CTA that directs users to the Import page, with the CTA text and behavior specified? [Clarity, Spec §US2 Scenario 5]
- [ ] CHK022 - Are empty state requirements defined for filtered results that return zero matches (distinct from "no domains at all")? [Coverage, Spec §Edge Cases]
- [ ] CHK023 - Are the skeleton loader visual requirements defined — number of skeleton rows, animation type (pulse/shimmer), and whether they match the dimensions of the target content? [Clarity, Plan §Constitution Check]

---

## Error & Feedback Requirements

- [ ] CHK024 - Are toast notification positioning, duration, and dismissal behavior requirements defined for all async operation results (import, save, delete)? [Clarity, Spec §FR-010, FR-019, FR-020]
- [ ] CHK025 - Does the spec define the error message content and format when a delete operation fails — must it include the reason for failure? [Completeness, Gap]
- [ ] CHK026 - Are requirements defined for inline validation error display positioning relative to form fields — must errors appear below the field, above it, or as tooltip overlays? [Clarity, Spec §FR-020]
- [ ] CHK027 - Are connectivity loss scenarios addressed in UX requirements — what must the user see when saving edits or deleting during a network interruption? [Coverage, Spec §Edge Cases: "browser loses connectivity"]
- [ ] CHK028 - Are requirements specified for the import progress indicator's refresh rate or granularity (should it update per row, per 10 rows, per percentage point)? [Clarity, Spec §US1]

---

## Visual Consistency & Theme Requirements

- [ ] CHK029 - Are specific color token requirements defined for the Select dropdown background, text, hover state, and selected state in both dark and light themes? [Completeness, Constitution §Design System Colors]
- [ ] CHK030 - Are the domain table column alignment requirements specified (numeric columns right-aligned, text columns left-aligned, badges centered)? [Clarity, Gap]
- [ ] CHK031 - Is the responsive table-to-card transition requirement clearly defined at the 480px breakpoint — must cards stack vertically with a specific maximum width? [Clarity, Plan §Constitution: domain table per breakpoints]
- [ ] CHK032 - Are checkbox selection visual requirements defined in both themes — checked state color, unchecked state border, disabled state when no domains exist? [Completeness, Gap]
- [ ] CHK033 - Are the expiry badge color thresholds and labels exactly as defined in the constitution, with no ambiguity in the 30/90/180 day boundaries? [Consistency, Plan §Design System Colors vs Spec §US2]

---

## Responsive & Mobile Requirements

- [ ] CHK034 - Are the Status dropdown and other Select controls specified to work correctly at mobile breakpoints (<480px) where full-width inputs may push content off-screen? [Coverage, Gap]
- [ ] CHK035 - Are touch target size requirements defined for interactive elements in the mobile card layout (View/Delete buttons, checkboxes)? [Completeness, Gap]
- [ ] CHK036 - Does the spec define how the search bar, filter dropdowns, and sort controls collapse or reflow on narrow viewports? [Clarity, Spec §US2]
- [ ] CHK037 - Are requirements specified for the bulk delete action bar on mobile — must it be sticky, fixed to bottom, or inline within the card list? [Coverage, Plan §Constitution: domain table per breakpoints]

---

## Accessibility Requirements

- [ ] CHK038 - Are keyboard navigation requirements defined for the domain table — Tab order, Arrow key navigation for sortable columns, Space to toggle checkboxes? [Coverage, Constitution §III]
- [ ] CHK039 - Are screen reader announcement requirements defined for: domain deletion completion, import summary counts, and form validation errors? [Gap]
- [ ] CHK040 - Are focus management requirements specified after closing the delete confirmation dialog — must focus return to the triggering button? [Completeness, Gap]
- [ ] CHK041 - Is the minimum contrast ratio for the transparent/dimmed background behind the delete dialog defined to ensure dialog content readability? [Clarity, Constitution §III: WCAG 2.1 AA]

---

## App Shell & Sidebar Layout Requirements

- [ ] CHK042 - Are z-index requirements defined for the fixed sidebar relative to the main content area, ensuring content never renders above the sidebar? [Gap, Spec §US3 - App Shell]
- [ ] CHK043 - Is sidebar background opacity explicitly specified to prevent content "bleed-through" when the main content area extends under the sidebar? [Clarity, Gap]
- [ ] CHK044 - Are sidebar width requirements specified for both expanded (full labels + icons) and collapsed (icons only) states? [Completeness, Gap]
- [ ] CHK045 - Are requirements defined for sidebar collapse/expand trigger mechanism — button toggle, keyboard shortcut, or breakpoint-based auto-collapse? [Gap]
- [ ] CHK046 - Is the sidebar pinned/unpinned state persistence requirement defined — must the preference survive page reloads (like theme)? [Coverage, Gap]
- [ ] CHK047 - Are hover-expand requirements specified for unpinned sidebar — timing delay before expand, timing delay before collapse on mouse leave? [Clarity, Gap]
- [ ] CHK048 - Does the spec define what happens to main content layout (margin/padding) when sidebar transitions between collapsed and expanded states? [Completeness, Gap]
- [ ] CHK049 - Are requirements defined for sidebar behavior on narrow viewports (768–1024px) where space is limited — does it auto-collapse, persist, or switch to bottom tab bar? [Coverage, Spec §US3 - Navigation]

## Sidebar Interaction State Requirements

- [ ] CHK050 - Are transition/animation requirements defined for sidebar width changes when collapsing/expanding? [Completeness, Gap]
- [ ] CHK051 - Is the visual state of the pin/unpin toggle button defined for both pinned and unpinned states? [Clarity, Gap]
- [ ] CHK052 - Are tooltip requirements defined for collapsed sidebar navigation icons (showing the route label on hover)? [Coverage, Gap]
- [ ] CHK053 - Are keyboard accessibility requirements specified for sidebar collapse/expand and navigation — Tab order, Escape to collapse, Enter to navigate? [Coverage, Constitution §III]
- [ ] CHK054 - Does the spec define sidebar behavior when the user is on a narrow laptop screen (1024px) — must it default to collapsed or expanded? [Edge Case, Gap]
- [ ] CHK055 - Are requirements defined for sidebar state after login — must it remember the last pinned/collapsed preference from a previous session? [Coverage, Gap]

## Updated Notes

- **Bug Signatures Detected**: Items CHK001-CHK008 target the stale-list-after-delete issue; items CHK009-CHK015 target the transparent dropdown layering issue; items CHK042-CHK048 target the sidebar z-index/content-overlap issue. These items represent requirements gaps that likely contributed to the implementation bugs.
- The spec implicitly expects list refresh after mutations (US2 "updates immediately", US4 "list updates to exclude it") but does not define the mechanism, timing, or error handling for stale-state scenarios.
- Visual layering of form elements (dropdown overlays vs adjacent fields) is entirely unaddressed in the current specification — this is a requirements gap, not an implementation oversight.
- Sidebar layout and interaction behavior (collapse/expand, pin/unpin, hover-open) has zero requirements coverage in the spec beyond "a collapsible sidebar lists all sections." The Phase 1 spec mention of "collapsible sidebar" has no corresponding functional requirement.
- Total: 55 checklist items across 10 categories.
