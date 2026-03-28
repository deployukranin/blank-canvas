

## Admin Onboarding Wizard — Plan

### Overview
Create a mandatory setup wizard that appears as a full-screen overlay the first time a creator accesses `/:slug/admin`. The wizard guides through 3 steps: **Profile**, **Visual Identity**, and **Platform Settings**. It cannot be dismissed until completed. Data is saved per step via the existing `save-app-config` edge function.

### Completion Tracking
- Add an `onboarding_completed` boolean column to the `stores` table (default `false`).
- When the wizard finishes, update `stores.onboarding_completed = true`.
- On admin load, check this flag — if `false`, show the wizard overlay.

### Steps

**Step 1 — Profile**
- Store name, description, avatar URL (pre-filled from YouTube if available)
- Updates the `stores` table directly

**Step 2 — Visual Identity**
- Color template selector (reuse existing dark/light templates from `AdminPersonalizacao`)
- Banner text configuration
- Saves via `save-app-config` (white_label_config)

**Step 3 — Platform Settings**
- Toggle features: VIP area, custom orders, community
- Welcome message for the storefront
- Saves via `save-app-config`

### Design
- Full-screen dark overlay (`bg-[#0a0a0a]`) with centered card
- Progress bar at top with gradient (magenta → purple)
- Step indicators (numbered circles)
- Smooth framer-motion transitions between steps
- "Next" button saves current step data before advancing
- No close/skip button until final step

### Files to Create/Edit

1. **Migration**: Add `onboarding_completed` column to `stores`
2. **`src/components/admin/AdminOnboardingWizard.tsx`** — New component with all 3 steps
3. **`src/pages/admin/AdminDashboard.tsx`** — Import and render the wizard overlay when `onboarding_completed` is false
4. **`src/i18n/locales/en.json`** + **`pt-BR.json`** — Add onboarding translation keys

### Technical Notes
- The wizard fetches `stores.onboarding_completed` on mount via the store ID already available in AdminDashboard
- Each step's "Next" button triggers an async save, shows a loading spinner, then advances
- Final step sets `onboarding_completed = true` on the `stores` table and dismisses the overlay
- Uses existing `updateColors`, `setConfig` from WhiteLabelContext for visual identity step

