# Performance & Accessibility

- Fallbacks
  - `prefers-reduced-transparency: reduce`: decrease glass tint transparency and set blur radii to 0 to avoid GPU-heavy filters.
  - `prefers-contrast: more`: increase border/foreground contrast and text luminance.
  - `prefers-reduced-motion: reduce`: minimize all transitions/animations to 1ms.
- Contrast
  - Base text `--color-text` chosen for 4.5:1+ contrast against translucent panels.
  - Inputs and buttons maintain visible focus via 3px focus ring in accent color.
- Performance
  - Limit simultaneous backdrops; use layered gradients for background rather than multiple large images.
  - Keep blur radii reasonable (<=28px). Avoid animating blur continuously; only on hover/tap.
  - Prefer static gloss layer; avoid animated glossy sweeps.
- Devices
  - Background is attachment: fixed for parallax feel; gracefully degrades if not supported without breaking layout.
  - All controls have solid backgrounds in fallback state for low-end GPUs.
