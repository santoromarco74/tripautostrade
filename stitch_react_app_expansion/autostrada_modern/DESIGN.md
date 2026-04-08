```markdown
# Design System Specification

## 1. Overview & Creative North Star: "The Modern Wayfarer"

This design system is built to transform the utility of highway travel into a premium, editorial experience. We are moving away from the "utility app" aesthetic and toward a "Digital Concierge" feel. 

**The Creative North Star: The Modern Wayfarer.**  
This system celebrates the journey through **Organic Brutalism**—combining the structural reliability of highway signage with the soft, sophisticated layering of high-end editorial magazines. We reject the rigid, boxed-in look of standard Material 3. Instead, we embrace intentional asymmetry, generous white space, and a depth model that feels like stacked sheets of frosted glass rather than flat pixels.

---

## 2. Colors

The palette is anchored by "Autostrada Green" for authority and "Amber" for community energy. To achieve a high-end feel, we rely on tonal transitions rather than stark lines.

### Primary & Secondary Tones
- **Primary:** `#004F45` (The Foundation) / **Primary Container:** `#00695C` (The Action)
- **Secondary (Amber):** `#785900` / **Secondary Container:** `#FDC003` (The Spark)
- **Tertiary (Deep Blue):** `#004290` (The Information)

### The "No-Line" Rule
**Explicit Instruction:** Junior designers are prohibited from using 1px solid borders to define sections. Boundaries must be created through background shifts. 
- Use `surface_container_low` (#ECF4FF) for the main body.
- Use `surface_container_lowest` (#FFFFFF) for cards nested within that body.
- The contrast between these two tones is the only "border" you need.

### The "Glass & Gradient" Rule
To add "soul" to the interface:
- **Hero Elements:** Use a subtle linear gradient from `primary` to `primary_container` (Top-Left to Bottom-Right).
- **Floating Overlays:** Use `surface` at 80% opacity with a `20px` backdrop blur. This ensures the community map or content "bleeds" through the UI, creating a sense of environmental integration.

---

## 3. Typography

This system utilizes a tri-font strategy to balance character, legibility, and technical precision.

| Role | Font Family | Character |
| :--- | :--- | :--- |
| **Display & Headline** | **Plus Jakarta Sans** | Geometric, wide, and premium. Used for "Hero" moments and section titles. |
| **Body & Titles** | **Inter** | Neutral and highly legible. The workhorse for reviews and descriptions. |
| **Labels & Metadata** | **Space Grotesk** | Technical and modern. Used for "highway-style" data (distances, timestamps, ratings). |

**Editorial Hierarchy:** Use extreme scale contrast. A `display-lg` headline should sit comfortably next to `body-sm` metadata to create a "magazine" layout effect rather than a repetitive list.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often a sign of "default" design. In this system, we use **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by stacking the surface-container tiers. 
    - *Level 0:* `surface_dim` (The base background).
    - *Level 1:* `surface_container` (Secondary content blocks).
    - *Level 2:* `surface_container_lowest` (Interactive cards/Active elements).
- **Ambient Shadows:** If a shadow is required for a Floating Action Button (FAB) or a Modal, it must be extra-diffused. 
    - **Blur:** 24px - 40px. 
    - **Opacity:** 4% - 6%. 
    - **Color:** Tint the shadow with `primary` or `on_surface` (never pure black).
- **The "Ghost Border":** If accessibility requires a border, use `outline_variant` (#BEC9C5) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons & FABs
- **Primary Button:** Pill-shaped (`full` roundedness). Use a subtle vertical gradient.
- **Secondary Button:** `surface_container_high` background with `on_surface` text. No border.
- **FAB:** The "Amber" moment. Use `secondary_container` (#FDC003) with high-elevation ambient shadows to ensure it stays "afloat" above the map.

### Chips (The Information Clusters)
- Use `md` (1.5rem) roundedness. 
- **Filter Chips:** Use `surface_container_highest` for unselected states. 
- **Action Chips:** Use `secondary_fixed` for a "highlight" effect that feels tactile.

### Cards & Lists
- **Forbid Dividers:** Do not use horizontal lines between list items. Use `16px` or `24px` of vertical whitespace to separate service area entries.
- **Asymmetric Cards:** Experiment with slightly different padding for top and bottom to create a custom, "hand-designed" feel.

### Input Fields
- **Search Bar:** Should be a "Floating Overlay." Use Glassmorphism (80% opacity + blur) with a `xl` (3rem) corner radius. This mimics a physical object resting on the glass of the device.

---

## 6. Do's and Don'ts

### Do
- **Do** use `plusJakartaSans` for large numbers (ratings, distances). It looks authoritative.
- **Do** allow content to run edge-to-edge in certain sections to break the "contained" mobile look.
- **Do** use the "Amber" color sparingly—only for high-priority interactions (Like, Review, Navigate).

### Don't
- **Don't** use 100% black text. Use `on_surface` (#141C25) to maintain a softer, premium contrast.
- **Don't** use standard Material 3 "elevated" cards with harsh shadows. Stick to the Tonal Layering model.
- **Don't** use sharp corners. Our tightest corner is `sm` (0.5rem); our standard is `DEFAULT` (1rem).

---

## 7. Signature Pattern: The "Service Detail" Overlay
When a user selects a highway service area, the information should slide up as a **Large Floating Sheet** (roundedness: `xl`). The header of this sheet should use a `primary_container` background with `surface_container_lowest` nested cards for specific amenities (EV Charging, Coffee, etc.). This "container-in-container" approach creates a sophisticated, organized depth hierarchy that guides the eye naturally.```