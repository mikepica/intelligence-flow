# Vantage Biopharma Dashboard -- Design Specification

## Overview

A 6-panel dark-themed dashboard demonstrating the Scorecard + Skills system using the Vantage Biopharma demo data. The dashboard tells the story: a fictional large pharma organization (Vantage Biopharma) has goals (3 Pillars cascading down to 4 Programs), six skilled personas whose skills form two chains (Chain A: KOL Insights, Chain B: AE Escalation), tracked by a scorecard with RAG status and a timeline of activity.

The landing page is the **CEO Goal View** (`goals.html`) -- a three-column pillar layout with role-based filtering. The **Program Dashboard** (`demo.html`) provides the 6-panel operational command-center view.

The visual language extends the existing site's purple/indigo/amber palette into a fully dark environment -- shifting from the light-background presentation pages into an operational command-center aesthetic.

---

## 1. Color Palette

### Base Surface Colors (Dark Theme)

| Token               | Tailwind Class          | Hex       | Usage                                  |
|----------------------|-------------------------|-----------|----------------------------------------|
| Page background      | `bg-slate-950`          | `#020617` | `<body>` background                    |
| Panel background     | `bg-slate-900`          | `#0f172a` | Dashboard card surfaces                |
| Panel elevated       | `bg-slate-800/50`       | `#1e293b` | Hover states, nested containers        |
| Panel border         | `border-slate-700/50`   | `#334155` | Card borders, dividers                 |
| Subtle divider       | `border-slate-800`      | `#1e293b` | Internal panel dividers                |

### Text Colors

| Token               | Tailwind Class          | Usage                                  |
|----------------------|-------------------------|----------------------------------------|
| Heading primary      | `text-white`            | Panel titles, primary data             |
| Heading secondary    | `text-slate-200`        | Sub-headings, important labels         |
| Body text            | `text-slate-300`        | Descriptions, body content             |
| Muted text           | `text-slate-400`        | Timestamps, metadata, captions         |
| Disabled text        | `text-slate-500`        | Inactive items, placeholders           |

### Accent Colors (Inherited from Existing Site)

| Token               | Tailwind Class          | Hex       | Usage                                  |
|----------------------|-------------------------|-----------|----------------------------------------|
| Primary purple       | `text-purple-400`       | `#c084fc` | Links, active states, primary accent   |
| Primary purple bg    | `bg-purple-500/10`      | --        | Subtle purple backgrounds              |
| Primary purple border| `border-purple-500/30`  | --        | Purple-accented borders                |
| Amber/Gold           | `text-amber-400`        | `#fbbf24` | Scorecard DB, alignment connections    |
| Amber bg             | `bg-amber-500/10`       | --        | Scorecard-related backgrounds          |
| Indigo               | `text-indigo-400`       | `#818cf8` | Secondary accent, AI layer             |

### RAG Status Colors

| Status       | Badge BG                        | Badge Text                | Glow Class                           |
|--------------|---------------------------------|---------------------------|--------------------------------------|
| Green        | `bg-emerald-500/15`             | `text-emerald-400`        | `shadow-emerald-500/20`              |
| Amber        | `bg-amber-500/15`               | `text-amber-400`          | `shadow-amber-500/20`                |
| Red          | `bg-red-500/15`                 | `text-red-400`            | `shadow-red-500/20`                  |
| Not Started  | `bg-slate-500/15`               | `text-slate-400`          | none                                 |
| Complete     | `bg-purple-500/15`              | `text-purple-400`         | `shadow-purple-500/20`               |

RAG badge markup pattern:
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
  Green
</span>
```

### Persona Colors

| Persona              | Primary              | Background              | Border                     | Icon BG                   |
|----------------------|----------------------|-------------------------|----------------------------|---------------------------|
| Dr. Elena Vasquez    | `text-rose-400`      | `bg-rose-500/10`        | `border-rose-500/30`       | `bg-rose-500/20`          |
| Marcus Chen          | `text-sky-400`       | `bg-sky-500/10`         | `border-sky-500/30`        | `bg-sky-500/20`           |
| Sarah Okonkwo        | `text-amber-400`     | `bg-amber-500/10`       | `border-amber-500/30`      | `bg-amber-500/20`         |
| Dr. James Park       | `text-green-400`     | `bg-green-500/10`       | `border-green-500/30`      | `bg-green-500/20`         |
| Dr. Amara Osei       | `text-violet-400`    | `bg-violet-500/10`      | `border-violet-500/30`     | `bg-violet-500/20`        |
| Dr. Richard Stein    | `text-orange-400`    | `bg-orange-500/10`      | `border-orange-500/30`     | `bg-orange-500/20`        |

These persona colors give each individual a distinct identity throughout the dashboard.

---

## 2. Grid Layout

### Desktop Layout (3 Columns)

```
+------------------+------------------+------------------+
|  Org Tree        |  Goal Cascade    |  Scorecard       |
|  (1 col)         |  (1 col)         |  (1 col)         |
+------------------+------------------+------------------+
|  Skills          |  Skill Chain     |  Timeline        |
|  (1 col)         |  (1 col)         |  (1 col)         |
+------------------+------------------+------------------+
```

### Tailwind Grid Classes

```html
<!-- Dashboard container -->
<div class="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">

  <!-- Dashboard header -->
  <header class="mb-6 md:mb-8">
    <!-- Title + subtitle -->
  </header>

  <!-- 6-panel grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
    <!-- Panel 1: Org Tree -->
    <div class="dashboard-panel">...</div>

    <!-- Panel 2: Goal Cascade -->
    <div class="dashboard-panel">...</div>

    <!-- Panel 3: Scorecard -->
    <div class="dashboard-panel">...</div>

    <!-- Panel 4: Skills -->
    <div class="dashboard-panel">...</div>

    <!-- Panel 5: Skill Chain -->
    <div class="dashboard-panel">...</div>

    <!-- Panel 6: Timeline -->
    <div class="dashboard-panel">...</div>
  </div>
</div>
```

### Responsive Breakpoints

| Breakpoint | Columns | Gap   | Padding |
|------------|---------|-------|---------|
| Mobile     | 1       | 16px  | 16px    |
| md (768px) | 2       | 20px  | 24px    |
| lg (1024px)| 3       | 24px  | 32px    |

### Panel Stacking Order (Mobile)

1. Org Tree
2. Goal Cascade
3. Scorecard
4. Skills
5. Skill Chain
6. Timeline

---

## 3. Panel Card Component

### Base Card Structure

```html
<div class="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden
            transition-all duration-300 hover:border-slate-600/50">

  <!-- Card Header -->
  <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800">
    <div class="flex items-center gap-3">
      <!-- Icon -->
      <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-purple-400">...</svg>
      </div>
      <!-- Title -->
      <h3 class="text-sm font-semibold text-white tracking-wide">Panel Title</h3>
    </div>
    <!-- Optional badge -->
    <span class="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Badge</span>
  </div>

  <!-- Card Content -->
  <div class="p-5">
    <!-- Panel-specific content -->
  </div>
</div>
```

### Card Design Tokens

| Property         | Value                                                       |
|------------------|-------------------------------------------------------------|
| Border radius    | `rounded-xl` (12px)                                        |
| Background       | `bg-slate-900`                                              |
| Border           | `border border-slate-700/50`                                |
| Header padding   | `px-5 py-4`                                                 |
| Content padding  | `p-5`                                                       |
| Header separator | `border-b border-slate-800`                                 |
| Hover border     | `hover:border-slate-600/50`                                 |
| Shadow           | None by default; subtle on hover via `hover:shadow-lg hover:shadow-slate-900/50` |
| Transition       | `transition-all duration-300`                               |

### Icon Background Variants per Panel

| Panel        | Icon BG                | Icon Color          |
|--------------|------------------------|---------------------|
| Org Tree     | `bg-purple-500/10`     | `text-purple-400`   |
| Goal Cascade | `bg-indigo-500/10`     | `text-indigo-400`   |
| Scorecard    | `bg-amber-500/10`      | `text-amber-400`    |
| Skills       | `bg-green-500/10`      | `text-green-400`    |
| Skill Chain  | `bg-purple-500/10`     | `text-purple-400`   |
| Timeline     | `bg-slate-500/15`      | `text-slate-300`    |

---

## 4. Panel-Specific Designs

### 4.1 Org Tree Panel

**Header:** Building icon + "Organization" + badge "18 units"

**Content:** Indented tree with vertical connector lines. Shows the full Vantage Biopharma hierarchy: Enterprise > Business Units (Oncology, R&D) > Functions (Medical Affairs, Commercial, Clinical Development) > Departments > Individuals.

Key design decisions:
- Vertical `border-l` lines show hierarchy
- Each level indents by `ml-4 pl-4`
- Icons are color-coded: purple for enterprise, indigo for BU/function, persona colors for individuals
- Level label is right-aligned in muted text

---

### 4.2 Goal Cascade Panel

**Header:** Target icon + "Goal Cascade" + badge "21 goals"

**Content:** Vertical flow from Pillar down to Program, with alignment arrows and strength labels between each level. Shows the selected pillar's cascade from Pillar > Category > Goal > Program.

Key design decisions:
- Each goal level gets a unique subtle color tint
- Alignment connectors use thin vertical lines with small arrow triangles
- Alignment strength is displayed as a tiny label between levels
- The active Program node is emphasized with `ring-1` glow
- Colors progress: purple (strategic) -> indigo -> amber -> emerald (execution)

---

### 4.3 Scorecard Panel

**Header:** Chart icon + "Scorecard" + RAG badge for overall status

**Content:** Table-like format showing program objectives with progress bars and RAG status for the selected program (AE-SENTINEL, VBP-142 Phase II Readiness, KOL-INSIGHTS, or LAUNCH-READY).

Key design decisions:
- Progress bar uses `bg-slate-800` track with `bg-purple-500` fill
- RAG badge is prominent in the header area
- Nested objective details in a slightly darker container
- Persona-specific metrics use their persona colors
- Version-numbered update section at the bottom

---

### 4.4 Skills Panel

**Header:** Code icon + "Skills Registry" + badge "6 skills"

**Content:** 3x2 grid of skill cards, one for each persona. Each card shows the persona name with their color, skill name, description, and I/O spec.

Key design decisions:
- 3x2 grid layout gives all 6 skills equal visual weight
- Persona color coding extends to card tint, border, text accents
- I/O specs displayed in monospace code blocks
- Persona avatar uses initials with persona color background
- Compact but information-dense

---

### 4.5 Skill Chain Panel

**Header:** Arrow-right icon + "Skill Chain" + toggle "Chain A | Chain B"

**Content:** Horizontal pipeline showing data flowing through a 3-step chain. A toggle switches between:

- **Chain A (KOL Insights):** Elena (MSL Insight Reporter) > Marcus (Med Affairs Aggregator) > Sarah (Commercial Strategist)
- **Chain B (AE Escalation):** James (CRA Site Monitor) > Amara (Patient Safety Evaluator) > Richard (Medical Director Reviewer)

Key design decisions:
- Horizontal layout shows clear left-to-right flow
- Animated connecting lines between nodes (see Animation Specs)
- Data labels show what is passed between skills
- Pipeline output summary shows the full flow including scorecard destination
- Persona colors maintained on each node
- Toggle button switches between Chain A and Chain B

---

### 4.6 Timeline Panel

**Header:** Clock icon + "Activity Timeline" + badge with count

**Content:** Vertical timeline with timestamps, persona avatars, and output previews.

When activity data is available, entries follow this pattern with persona-colored avatar dots:
- **Elena entries:** Rose avatar dot
- **Marcus entries:** Sky avatar dot
- **Sarah entries:** Amber avatar dot
- **James entries:** Green avatar dot
- **Amara entries:** Violet avatar dot
- **Richard entries:** Orange avatar dot
- **System entries:** Purple avatar dot, neutral text

Key design decisions:
- Vertical left-aligned timeline with connector line
- Avatar dots on the line with color coding by persona
- Compact content blocks with `line-clamp` for previews
- Timestamps in muted slate
- Waiting/placeholder state for upcoming activity

---

## 5. CEO Goal View Page (`goals.html`)

A separate landing page that provides the executive-level view of all organizational goals.

### Layout
- Three-column layout, one column per strategic pillar:
  - **Advance Pipeline** (left)
  - **Improve Patient Outcomes** (center)
  - **Develop Our People** (right)
- Each column cascades from Pillar > Categories > Goals > Programs
- Role-based filter dropdown at top to view goals by persona or department
- Click a program to navigate to the Program Dashboard (`demo.html`) with that program pre-selected

### Design
- Same dark theme as the dashboard
- Pillar headers use distinct accent colors
- Goal cards show owner, status, and RAG indicator
- Programs are clickable links to the dashboard view

---

## 6. Animation Specs

### 6.1 Panel Entrance

Reuse the existing `reveal` pattern from the site, adapted for the dashboard.

```css
.panel-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.panel-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger each panel */
.panel-reveal:nth-child(1) { transition-delay: 0.05s; }
.panel-reveal:nth-child(2) { transition-delay: 0.10s; }
.panel-reveal:nth-child(3) { transition-delay: 0.15s; }
.panel-reveal:nth-child(4) { transition-delay: 0.20s; }
.panel-reveal:nth-child(5) { transition-delay: 0.25s; }
.panel-reveal:nth-child(6) { transition-delay: 0.30s; }
```

Uses the same `IntersectionObserver` pattern as the existing pages. Each panel fades in and slides up with a slight stagger so they cascade across the grid.

### 6.2 Skill Chain Data Flow

Animated dashes moving along the connector line between skill nodes.

```css
@keyframes chainFlow {
  0% { background-position: 0 0; }
  100% { background-position: 16px 0; }
}

.chain-flow-line {
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 4px,
    #c084fc 4px,
    #c084fc 10px,
    transparent 10px,
    transparent 16px
  );
  animation: chainFlow 0.8s linear infinite;
}
```

This creates purple dashed segments that scroll right, simulating data moving through the skill chain.

### 6.3 Progress Bar Fill

Animated width expansion when data loads.

```css
.progress-fill {
  width: 0%;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Set the actual width via JS/inline style after the element enters the viewport. The `cubic-bezier` easing gives a satisfying deceleration.

### 6.4 RAG Status Glow/Pulse

A subtle pulse on the RAG badge dot to draw attention.

```css
@keyframes ragPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

.rag-pulse {
  animation: ragPulse 2.5s ease-in-out infinite;
}
```

Only applied to the small colored dot within the RAG badge, not the entire badge. Keeps it subtle.

### 6.5 Timeline Entry Reveal

New timeline entries fade and slide from the left.

```css
@keyframes timelineSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-entry {
  animation: timelineSlideIn 0.4s ease-out forwards;
}
```

### 6.6 Hover Glow on Panels

Subtle border brightening on hover.

```css
.dashboard-panel {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.dashboard-panel:hover {
  border-color: rgba(100, 116, 139, 0.5); /* slate-500/50 */
  box-shadow: 0 0 20px rgba(15, 23, 42, 0.5); /* very subtle depth */
}
```

---

## 7. Typography

### Font Stack

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

Same as existing site. Inter is already loaded via Google Fonts.

### Type Scale

| Role                    | Tailwind Classes                                    | Size   | Weight  |
|-------------------------|-----------------------------------------------------|--------|---------|
| Dashboard title         | `text-2xl md:text-3xl font-bold text-white`         | 24-30px| 700     |
| Dashboard subtitle      | `text-sm text-slate-400 font-light`                 | 14px   | 300     |
| Panel title             | `text-sm font-semibold text-white tracking-wide`    | 14px   | 600     |
| Panel badge             | `text-xs text-slate-400`                             | 12px   | 400     |
| Section label           | `text-[10px] uppercase tracking-wider font-semibold` | 10px  | 600     |
| Body text               | `text-sm text-slate-300`                             | 14px   | 400     |
| Small body              | `text-xs text-slate-400`                             | 12px   | 400     |
| Micro text              | `text-[10px] text-slate-500`                         | 10px   | 400     |
| Data/code               | `font-mono text-[10px]`                              | 10px   | 400     |
| Persona name            | `text-xs font-semibold` + persona color class        | 12px   | 600     |
| RAG badge text          | `text-xs font-medium`                                | 12px   | 500     |

### Code/Data Display

```html
<code class="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-purple-300/80">
  { key: value }
</code>
```

Uses system monospace stack. Small size keeps the data dense but legible. Purple tint for code distinguishes it from prose.

---

## 8. Dashboard Header

Above the 6-panel grid, a compact header provides context.

```html
<header class="mb-6 md:mb-8">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl md:text-3xl font-bold text-white">Vantage Biopharma</h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 rag-pulse"></span>
          Program Dashboard
        </span>
      </div>
      <p class="text-sm text-slate-400 font-light">
        Scorecard Dashboard -- 4 Programs -- 6 Skills -- 2 Chains
      </p>
    </div>
    <a href="goals.html" class="text-xs text-purple-400 hover:text-purple-300 transition-colors">
      Back to CEO Goal View
    </a>
  </div>
</header>
```

---

## 9. Full Page Structure Summary

```
bg-slate-950 (page)
  px-4/6/8, py-6/8
    header (title + badge + back link to goals.html)
    grid 1/2/3 cols, gap-4/5/6
      [1] Org Tree panel          -- purple icon, 18 units
      [2] Goal Cascade panel      -- indigo icon, 21 goals
      [3] Scorecard panel         -- amber icon
      [4] Skills Registry panel   -- green icon, 6 skills (3x2 grid)
      [5] Skill Chain panel       -- purple icon, Chain A/B toggle
      [6] Activity Timeline panel -- slate icon
```

All panels share the same card component structure. Content is panel-specific as detailed in Section 4. Animations load progressively as detailed in Section 6. Typography follows the scale in Section 7.

The result is a dark, data-rich, premium dashboard that visually matches the existing site's design language while creating an operational command-center feel appropriate for monitoring scorecards and skill execution.
