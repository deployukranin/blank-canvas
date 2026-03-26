

## Plan: Slug Creation + VIP Navigation Tab + Currency Localization

### What needs to happen

1. **Add "Store Name / Slug" field to creator signup** (`src/pages/Auth.tsx`)
   - Add a new input field for the store name (which auto-generates a slug)
   - Slug is derived from the name: lowercase, spaces to hyphens, no special chars
   - Validate slug uniqueness against `stores` table before submitting
   - Validate against reserved routes list
   - On signup success, create a `stores` row with the slug, and link `store_admins` + `user_roles` (admin)

2. **Add VIP tab to bottom navigation** (`src/contexts/WhiteLabelContext.tsx`)
   - Add a VIP entry to `defaultNavigationTabs` array with path `/vip`, icon `Crown`, order 2

3. **Update VIP page with blurred preview for non-subscribers** (`src/pages/VIP.tsx`)
   - Show fake/blurred content cards as a teaser when user is not VIP
   - Display the actual plans from admin config (`/admin/vip-precos`) with proper pricing
   - Add currency localization: BRL when language is `pt-BR`, USD when `en`

4. **Currency formatting based on locale** (`src/pages/VIP.tsx` + `src/pages/admin/AdminVipPrecos.tsx`)
   - Use `useTranslation` to detect current language
   - When `pt-BR`: format as R$ (BRL)
   - When `en`: convert display to $ (USD) — same numeric value, different currency symbol

### Technical Details

**Auth.tsx changes:**
- New state: `storeName`, `storeSlug`
- Auto-generate slug from name with debounced uniqueness check via `supabase.from('stores').select('id').eq('slug', slug)`
- After successful `signUp()`, insert into `stores` table with `slug`, `name`, `created_by`, then insert `store_admins` and `user_roles` with admin role

**WhiteLabelContext.tsx:**
- Add to `defaultNavigationTabs` at index 2:
  ```
  { id: 'vip', label: 'VIP', path: '/vip', icon: { type: 'lucide', value: 'Crown' }, enabled: true, order: 2 }
  ```

**VIP.tsx blurred preview:**
- When user is not VIP, show 3-4 fake content cards with `blur-sm` and a lock overlay
- Plans section shows real plans from store config
- "Subscribe" CTA is prominent

**Currency localization:**
- Helper function checks `i18n.language` — if starts with `pt`, use BRL; otherwise USD
- Applied in VIP page plan display and purchase dialog

### Files to modify
- `src/pages/Auth.tsx` — add store name/slug field + store creation on signup
- `src/contexts/WhiteLabelContext.tsx` — add VIP to default nav tabs
- `src/pages/VIP.tsx` — blurred preview, currency localization
- `src/pages/admin/AdminVipPrecos.tsx` — currency-aware formatting

