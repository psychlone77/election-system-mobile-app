# Style Guide — Election System Mobile App

## Palette

- Primary Purple: #6E49FF
- Purple 700: #5B3E8A
- Purple 900 (dark text): #2B0638
- Background: #F7F5FF
- Surface (card): #FFFFFF
- Neutral muted: #E9E6F7
- Accent (cta): #6E49FF
- Success: #2E7D32
- Danger: #E53935

## Typography

- Heading 1: 34px, 700
- Heading 2: 22px, 700
- Body: 16px, 400
- Label: 14px, 600

## Spacing

- Base unit: 8px
- Small: 4px
- Medium: 12px
- Large: 24px

## Components

- Card
  - background: surface, borderRadius: 12-16, padding: 16-24, shadow: subtle
  - usage: primary container for forms and actions

- Button (Primary)
  - background: Primary Purple (#6E49FF)
  - text: white, weight 700
  - height: 44px, borderRadius: 12

- Input
  - background: #FBFAFF
  - border: 1px solid #E9E6F7
  - borderRadius: 12
  - padding: 12px

## Accessibility

- Contrast: ensure text on primary purple has WCAG AA contrast - use white text on primary for CTAs.
- Touch targets: min 44x44

## Usage Examples

- Login Card
  - Card with title (Heading 2), subtitle, inputs stacked vertically, primary button at bottom.
  - Inputs are full-width with centered registration code input (letterSpacing: 3).

Tokens (for quick reference)

- color.primary = #6E49FF
- color.bg = #F7F5FF
- color.surface = #FFFFFF
- radius.card = 16
- spacing.base = 8

## Notes

- Keep consistent border radii across cards and inputs.
- Prefer subtle shadows (elevation 4-8) for depth.
- Keep UI minimal and centered on forms.

## How to use

- Import tokens into components and apply consistent paddings and font sizes.
- When requesting UI changes, refer to this file: e.g. "Use color.primary for CTAs and radius.card for panels."
