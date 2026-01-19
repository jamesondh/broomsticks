---
name: ui-design-system
description: Maintains retro early 2000s styling with light purple backgrounds, sharp borders, no gradients
---

# Broomsticks UI Design System

A retro early 2000s design system for the Broomsticks web application.

## Design Principles

- **Flat colors** - No gradients, shadows, or transitions
- **Sharp corners** - No border-radius (always 0)
- **High contrast** - Dark borders on light backgrounds
- **Simple typography** - System fonts at readable sizes

## Color Tokens

### Backgrounds
- `--color-bg-page`: `#aaaacc` - Light purple page background
- `--color-bg-card`: `#e5e5e5` - Light gray card/section background
- `--color-bg-dark`: `#1a1a1a` - Dark background (game screen only)

### Text
- `--color-text-primary`: `#000000` - Primary text (black)
- `--color-text-secondary`: `#555555` - Secondary/muted text
- `--color-text-inverse`: `#ffffff` - Text on dark backgrounds

### Links
- `--color-link`: `#0000cc` - Link color (bright blue)

### Borders
- `--color-border`: `#444444` - Standard border color

### Team Colors
- `--color-team-red`: `#cc3333` - Red team
- `--color-team-black`: `#333333` - Black team

### Difficulty Colors
- `--color-difficulty-easy`: `#44aa99`
- `--color-difficulty-medium`: `#4499aa`
- `--color-difficulty-hard`: `#aa9944`
- `--color-difficulty-expert`: `#aa4499`

### Button Colors
- `--color-btn-primary`: `#4a90d9` - Primary action
- `--color-btn-secondary`: `#555555` - Secondary action
- `--color-btn-danger`: `#d94a4a` - Destructive action

## Typography

- **Font family**: `Helvetica, Arial, sans-serif`
- **Base size**: 13px
- **Line height**: 1.4

### Font Sizes
- `--font-size-xs`: 11px
- `--font-size-sm`: 12px
- `--font-size-base`: 13px
- `--font-size-md`: 14px
- `--font-size-lg`: 18px
- `--font-size-xl`: 24px
- `--font-size-2xl`: 36px
- `--font-size-3xl`: 48px

## Spacing Scale

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px

## Borders

- **Width**: 1px
- **Style**: solid
- **Color**: `var(--color-border)` (#444444)
- **Radius**: 0 (always)

```css
border: 1px solid var(--color-border);
border-radius: 0;
```

## Component Patterns

### Cards/Sections
```css
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  padding: var(--space-5);
}
```

### Buttons
```css
.button {
  background: var(--color-btn-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 0;
  padding: 10px 20px;
  font-weight: bold;
  cursor: pointer;
}
```

### Inputs
```css
.input {
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 10px 12px;
  font-family: inherit;
  font-size: var(--font-size-md);
}
```

### Links
```css
a {
  color: var(--color-link);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
```

## What NOT to Use

- `border-radius` (except 0)
- `box-shadow`
- `text-shadow`
- `linear-gradient` or `radial-gradient`
- `transition` or `animation`
- `transform` for visual effects
- Modern rounded toggle switches (use checkboxes)

## Files

- **Tokens**: `web/src/styles/tokens.css`
- **Base styles**: `web/src/index.css`
- **Guestbook**: `web/src/components/GuestbookSearch.css`
- **Generated pages**: `web/public/guestbook/guestbook-entry.css`
