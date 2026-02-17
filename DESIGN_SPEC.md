# Riddle Enterprises Dashboard -- Design Specification

## Overview

A 6-panel dark-themed dashboard demonstrating the Scorecard + Skills system using the Riddle Enterprises demo data. The dashboard tells the story: an organization (Riddle Enterprises) has goals (Creative Intelligence pillar cascading down to the Riddlemethis program), two skilled individuals (The Riddler and The Sphinx) whose skills chain together, tracked by a scorecard with RAG status and a timeline of activity.

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

### Character Colors

| Character    | Primary              | Background              | Border                     | Icon BG                   |
|--------------|----------------------|-------------------------|----------------------------|---------------------------|
| The Riddler  | `text-green-400`     | `bg-green-500/10`       | `border-green-500/30`      | `bg-green-500/20`         |
| The Sphinx   | `text-amber-400`     | `bg-amber-500/10`       | `border-amber-500/30`      | `bg-amber-500/20`         |

These character colors give each persona a distinct identity throughout the dashboard -- The Riddler is green (creation, freshness), The Sphinx is amber/gold (wisdom, depth).

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

**Header:** Building icon + "Organization" + badge "4 units"

**Content:** Indented tree with vertical connector lines.

```html
<div class="space-y-1">
  <!-- Enterprise level -->
  <div class="flex items-center gap-2 py-1.5">
    <span class="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
      <svg class="w-3 h-3 text-purple-400"><!-- building icon --></svg>
    </span>
    <span class="text-sm font-medium text-white">Riddle Enterprises</span>
    <span class="text-xs text-slate-500 ml-auto">Enterprise</span>
  </div>

  <!-- Department level (indented) -->
  <div class="ml-4 pl-4 border-l border-slate-700/50">
    <div class="flex items-center gap-2 py-1.5">
      <span class="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-indigo-400"><!-- folder icon --></svg>
      </span>
      <span class="text-sm font-medium text-slate-200">Riddle Workshop</span>
      <span class="text-xs text-slate-500 ml-auto">Department</span>
    </div>

    <!-- Individual level (indented further) -->
    <div class="ml-4 pl-4 border-l border-slate-700/50 space-y-1">
      <!-- The Riddler -->
      <div class="flex items-center gap-2 py-1.5">
        <span class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <span class="text-[10px]">?</span>
        </span>
        <span class="text-sm text-green-400 font-medium">The Riddler</span>
        <span class="text-xs text-slate-500 ml-auto">Individual</span>
      </div>
      <!-- The Sphinx -->
      <div class="flex items-center gap-2 py-1.5">
        <span class="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <span class="text-[10px]">&#x25B2;</span>
        </span>
        <span class="text-sm text-amber-400 font-medium">The Sphinx</span>
        <span class="text-xs text-slate-500 ml-auto">Individual</span>
      </div>
    </div>
  </div>
</div>
```

Key design decisions:
- Vertical `border-l` lines show hierarchy
- Each level indents by `ml-4 pl-4`
- Icons are color-coded: purple for enterprise, indigo for department, character colors for individuals
- Level label is right-aligned in muted text

---

### 4.2 Goal Cascade Panel

**Header:** Target icon + "Goal Cascade" + badge "4 levels"

**Content:** Vertical flow from Pillar down to Program, with alignment arrows and strength labels between each level.

```html
<div class="space-y-0">

  <!-- Pillar -->
  <div class="bg-purple-500/5 border border-purple-500/20 rounded-lg px-4 py-3">
    <p class="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-1">Pillar</p>
    <p class="text-sm font-medium text-white">Creative Intelligence</p>
  </div>

  <!-- Alignment connector -->
  <div class="flex items-center justify-center py-1.5">
    <div class="flex flex-col items-center">
      <div class="w-px h-3 bg-slate-600"></div>
      <svg class="w-3 h-3 text-slate-500"><path d="M6 0L12 8H0z" fill="currentColor"/></svg>
      <span class="text-[9px] text-slate-500 mt-0.5">primary 0.80</span>
    </div>
  </div>

  <!-- Category -->
  <div class="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-4 py-3">
    <p class="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-1">Category</p>
    <p class="text-sm font-medium text-white">Riddle Mastery</p>
  </div>

  <!-- Alignment connector -->
  <div class="flex items-center justify-center py-1.5">
    <div class="flex flex-col items-center">
      <div class="w-px h-3 bg-slate-600"></div>
      <svg class="w-3 h-3 text-slate-500"><path d="M6 0L12 8H0z" fill="currentColor"/></svg>
      <span class="text-[9px] text-slate-500 mt-0.5">primary 1.00</span>
    </div>
  </div>

  <!-- Goal -->
  <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
    <p class="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">Goal</p>
    <p class="text-sm font-medium text-white">Generate 10 quality riddles by end of Q1 2026</p>
  </div>

  <!-- Alignment connector -->
  <div class="flex items-center justify-center py-1.5">
    <div class="flex flex-col items-center">
      <div class="w-px h-3 bg-slate-600"></div>
      <svg class="w-3 h-3 text-slate-500"><path d="M6 0L12 8H0z" fill="currentColor"/></svg>
      <span class="text-[9px] text-slate-500 mt-0.5">primary 1.00</span>
    </div>
  </div>

  <!-- Program (highlighted) -->
  <div class="bg-emerald-500/5 border border-emerald-500/30 rounded-lg px-4 py-3 ring-1 ring-emerald-500/10">
    <p class="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">Program</p>
    <p class="text-sm font-medium text-white">Riddlemethis</p>
    <p class="text-xs text-slate-400 mt-1">Q1 2026 -- 10 riddles target</p>
  </div>
</div>
```

Key design decisions:
- Each goal level gets a unique subtle color tint
- Alignment connectors use thin vertical lines with small arrow triangles
- Alignment strength is displayed as a tiny label between levels
- The active Program node is emphasized with `ring-1` glow
- Colors progress: purple (strategic) -> indigo -> amber -> emerald (execution)

---

### 4.3 Scorecard Panel

**Header:** Chart icon + "Scorecard" + RAG badge for overall status

**Content:** Table-like format showing program objectives with progress bars and RAG status.

```html
<div class="space-y-4">

  <!-- Program header -->
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-white">Riddlemethis</p>
      <p class="text-xs text-slate-400">Q1 2026 -- 10 riddles target</p>
    </div>
    <!-- RAG Badge -->
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-400 rag-pulse"></span>
      Not Started
    </span>
  </div>

  <!-- Progress bar -->
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-slate-400">Progress</span>
      <span class="text-xs font-medium text-white">0 / 10</span>
    </div>
    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div class="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out progress-fill"
           style="width: 0%"></div>
    </div>
  </div>

  <!-- Objective details -->
  <div class="bg-slate-800/50 rounded-lg p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs text-slate-300">Q1 Objective</span>
      <span class="text-xs text-slate-500">Jan -- Mar 2026</span>
    </div>
    <p class="text-xs text-slate-400">Generate 10 riddles using the riddle-maker and riddle-deepener skill pipeline</p>
    <div class="flex items-center gap-4 pt-1">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-green-400/60"></span>
        <span class="text-[10px] text-slate-400">Riddler: 0 created</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-amber-400/60"></span>
        <span class="text-[10px] text-slate-400">Sphinx: 0 deepened</span>
      </div>
    </div>
  </div>

  <!-- Latest update -->
  <div class="border-t border-slate-800 pt-3">
    <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Latest Update (v1)</p>
    <p class="text-xs text-slate-400 leading-relaxed">
      Program initiated. Pipeline established. Ready to begin.
    </p>
  </div>
</div>
```

Key design decisions:
- Progress bar uses `bg-slate-800` track with `bg-purple-500` fill
- RAG badge is prominent in the header area
- Nested objective details in a slightly darker container
- Character-specific metrics use their persona colors
- Version-numbered update section at the bottom

---

### 4.4 Skills Panel

**Header:** Code icon + "Skills Registry" + badge "2 skills"

**Content:** Two side-by-side skill cards, one for each persona.

```html
<div class="grid grid-cols-2 gap-3">

  <!-- The Riddler's Skill -->
  <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-3.5">
    <div class="flex items-center gap-2 mb-2.5">
      <span class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] text-green-400 font-bold">?</span>
      <div>
        <p class="text-xs font-semibold text-green-400">The Riddler</p>
        <p class="text-[10px] text-slate-500">Creative Lead</p>
      </div>
    </div>
    <p class="text-sm font-medium text-white mb-2">Riddle Maker</p>
    <p class="text-xs text-slate-400 mb-3">Creates semi-basic riddles from prompts with answer and difficulty rating</p>

    <!-- I/O spec -->
    <div class="space-y-1.5">
      <div>
        <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Input</p>
        <code class="text-[10px] text-green-300/80 bg-slate-800/80 px-1.5 py-0.5 rounded">{ topic }</code>
      </div>
      <div>
        <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Output</p>
        <code class="text-[10px] text-green-300/80 bg-slate-800/80 px-1.5 py-0.5 rounded">{ riddle, answer, difficulty }</code>
      </div>
    </div>

    <div class="mt-3 pt-2 border-t border-green-500/10">
      <span class="text-[10px] text-slate-500">Type: </span>
      <span class="text-[10px] text-green-400">personal</span>
    </div>
  </div>

  <!-- The Sphinx's Skill -->
  <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3.5">
    <div class="flex items-center gap-2 mb-2.5">
      <span class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">&#x25B2;</span>
      <div>
        <p class="text-xs font-semibold text-amber-400">The Sphinx</p>
        <p class="text-[10px] text-slate-500">Sr. Enigmatologist</p>
      </div>
    </div>
    <p class="text-sm font-medium text-white mb-2">Riddle Deepener</p>
    <p class="text-xs text-slate-400 mb-3">Transforms basic riddles into three-layer deep enigmas with nested clues</p>

    <!-- I/O spec -->
    <div class="space-y-1.5">
      <div>
        <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Input</p>
        <code class="text-[10px] text-amber-300/80 bg-slate-800/80 px-1.5 py-0.5 rounded">{ riddle, answer }</code>
      </div>
      <div>
        <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Output</p>
        <code class="text-[10px] text-amber-300/80 bg-slate-800/80 px-1.5 py-0.5 rounded">{ layers[3], final_answer }</code>
      </div>
    </div>

    <div class="mt-3 pt-2 border-t border-amber-500/10">
      <span class="text-[10px] text-slate-500">Type: </span>
      <span class="text-[10px] text-amber-400">personal</span>
    </div>
  </div>
</div>
```

Key design decisions:
- Side-by-side layout gives equal visual weight
- Character color coding extends to card tint, border, text accents
- I/O specs displayed in monospace code blocks
- Persona avatar uses symbolic characters (? for Riddler, triangle for Sphinx)
- Compact but information-dense

---

### 4.5 Skill Chain Panel

**Header:** Arrow-right icon + "Skill Chain" + badge "2-step pipeline"

**Content:** Horizontal pipeline showing data flowing from Riddler's skill to Sphinx's skill, with a data preview in between.

```html
<div class="flex items-center gap-0">

  <!-- Step 1: Riddler node -->
  <div class="flex-1 min-w-0">
    <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
      <span class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-1.5 text-xs text-green-400 font-bold">?</span>
      <p class="text-xs font-semibold text-green-400 truncate">Riddle Maker</p>
      <p class="text-[10px] text-slate-500">The Riddler</p>
    </div>
  </div>

  <!-- Arrow connector with data preview -->
  <div class="flex flex-col items-center px-2 flex-shrink-0">
    <!-- Animated arrow line -->
    <div class="relative w-16 h-px">
      <div class="absolute inset-0 bg-slate-700"></div>
      <div class="absolute inset-0 chain-flow-line"></div>
      <!-- Arrow head -->
      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0
                  border-l-[6px] border-l-purple-400
                  border-y-[4px] border-y-transparent"></div>
    </div>
    <!-- Data label -->
    <div class="mt-1.5 bg-slate-800/80 rounded px-2 py-1 max-w-[120px]">
      <p class="text-[8px] text-slate-500 text-center">riddle + answer</p>
    </div>
  </div>

  <!-- Step 2: Sphinx node -->
  <div class="flex-1 min-w-0">
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-center">
      <span class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-1.5 text-xs text-amber-400 font-bold">&#x25B2;</span>
      <p class="text-xs font-semibold text-amber-400 truncate">Riddle Deepener</p>
      <p class="text-[10px] text-slate-500">The Sphinx</p>
    </div>
  </div>
</div>

<!-- Pipeline output preview -->
<div class="mt-4 bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
  <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Pipeline Output</p>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-green-400/60"></span>
      <span class="text-[10px] text-slate-400">Basic riddle</span>
    </div>
    <span class="text-slate-600">-></span>
    <div class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400/60"></span>
      <span class="text-[10px] text-slate-400">3-layer enigma</span>
    </div>
    <span class="text-slate-600">-></span>
    <div class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-purple-400/60"></span>
      <span class="text-[10px] text-slate-400">Scorecard</span>
    </div>
  </div>
</div>
```

Key design decisions:
- Horizontal layout shows clear left-to-right flow
- Animated connecting line between nodes (see Animation Specs)
- Data label shows what is passed between skills
- Pipeline output summary shows the full flow including scorecard destination
- Character colors maintained on each node

---

### 4.6 Timeline Panel

**Header:** Clock icon + "Activity Timeline" + badge with count

**Content:** Vertical timeline with timestamps, persona avatars, and output previews.

```html
<div class="relative">
  <!-- Vertical timeline line -->
  <div class="absolute left-3 top-0 bottom-0 w-px bg-slate-800"></div>

  <div class="space-y-4">

    <!-- Timeline entry -->
    <div class="relative flex gap-3 pl-0">
      <!-- Avatar dot on the line -->
      <div class="relative z-10 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center flex-shrink-0">
        <span class="w-2 h-2 rounded-full bg-purple-400"></span>
      </div>
      <!-- Content -->
      <div class="flex-1 min-w-0 pb-1">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-xs font-medium text-slate-200">Program Initiated</span>
          <span class="text-[10px] text-slate-500">v1</span>
        </div>
        <p class="text-[10px] text-slate-500 mb-1.5">Mike Pica</p>
        <div class="bg-slate-800/50 rounded px-2.5 py-1.5">
          <p class="text-xs text-slate-400 line-clamp-2">Pipeline established. Riddle Maker and Riddle Deepener skills registered. 0 of 10 target riddles completed.</p>
        </div>
        <p class="text-[10px] text-slate-600 mt-1">Jan 2026</p>
      </div>
    </div>

    <!-- Placeholder for future entries -->
    <div class="relative flex gap-3 pl-0">
      <div class="relative z-10 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center flex-shrink-0">
        <span class="w-2 h-2 rounded-full bg-slate-600"></span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-slate-600 italic">Awaiting first riddle creation...</p>
      </div>
    </div>
  </div>
</div>
```

When activity data is available (riddles created, deepened), entries follow this pattern:

- **Riddler entries:** Green avatar dot, green persona name, preview of riddle text
- **Sphinx entries:** Amber avatar dot, amber persona name, preview of layer summary
- **System entries:** Purple avatar dot, neutral text

Key design decisions:
- Vertical left-aligned timeline with connector line
- Avatar dots on the line with color coding by character
- Compact content blocks with `line-clamp` for previews
- Timestamps in muted slate
- Waiting/placeholder state for upcoming activity

---

## 5. Animation Specs

### 5.1 Panel Entrance

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

### 5.2 Skill Chain Data Flow

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

This creates purple dashed segments that scroll right, simulating data moving from Riddler to Sphinx.

### 5.3 Progress Bar Fill

Animated width expansion when data loads.

```css
.progress-fill {
  width: 0%;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Set the actual width via JS/inline style after the element enters the viewport. The `cubic-bezier` easing gives a satisfying deceleration.

### 5.4 RAG Status Glow/Pulse

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

### 5.5 Timeline Entry Reveal

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

### 5.6 Hover Glow on Panels

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

## 6. Typography

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
| Persona name (Riddler)  | `text-xs font-semibold text-green-400`               | 12px   | 600     |
| Persona name (Sphinx)   | `text-xs font-semibold text-amber-400`               | 12px   | 600     |
| RAG badge text          | `text-xs font-medium`                                | 12px   | 500     |

### Code/Data Display

```html
<code class="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-purple-300/80">
  { key: value }
</code>
```

Uses system monospace stack. Small size keeps the data dense but legible. Purple tint for code distinguishes it from prose.

---

## 7. Dashboard Header

Above the 6-panel grid, a compact header provides context.

```html
<header class="mb-6 md:mb-8">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl md:text-3xl font-bold text-white">Riddle Enterprises</h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 rag-pulse"></span>
          Not Started
        </span>
      </div>
      <p class="text-sm text-slate-400 font-light">
        Scorecard Dashboard -- Riddlemethis Program -- Q1 2026
      </p>
    </div>
    <a href="index.html" class="text-xs text-purple-400 hover:text-purple-300 transition-colors">
      Back to Overview
    </a>
  </div>
</header>
```

---

## 8. Full Page Structure Summary

```
bg-slate-950 (page)
  px-4/6/8, py-6/8
    header (title + RAG badge + back link)
    grid 1/2/3 cols, gap-4/5/6
      [1] Org Tree panel          -- purple icon
      [2] Goal Cascade panel      -- indigo icon
      [3] Scorecard panel         -- amber icon
      [4] Skills Registry panel   -- green icon
      [5] Skill Chain panel       -- purple icon
      [6] Activity Timeline panel -- slate icon
```

All panels share the same card component structure. Content is panel-specific as detailed in Section 4. Animations load progressively as detailed in Section 5. Typography follows the scale in Section 6.

The result is a dark, data-rich, premium dashboard that visually matches the existing site's design language while creating an operational command-center feel appropriate for monitoring scorecards and skill execution.
