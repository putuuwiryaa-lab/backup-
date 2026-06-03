# CSS split map

`src/design-system.css` is the current legacy base file. It is intentionally left in place while styles are migrated gradually.

Active import order is controlled by `src/ui/design-system.css`.

Recommended migration order:

1. `base.css` - html/body/root/base typography only.
2. `layout.css` - app container, width, overflow, spacing shell.
3. `surfaces.css` - panels, cards, glass surfaces, borders.
4. `buttons-inputs.css` - buttons, inputs, focus states.
5. `dashboard.css` - dashboard cards, market grid, market chips.
6. `analysis.css` - analysis result cards, validation rows, digit chips.
7. `navigation.css` - bottom nav and route navigation.
8. `login.css` - login/trial/PIN screens.

Rule:

Do not delete rules from `src/design-system.css` until the same section has been moved and visually checked. During migration, split files may override legacy rules and should stay after the legacy import.

Font source of truth:

`../font-premium.css` owns final app font mapping:

- Body/UI: Outfit
- Display/title: Orbitron
- Mono/numeric: JetBrains Mono with DM Mono fallback
