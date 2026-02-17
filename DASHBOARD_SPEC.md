# Vantage Biopharma Dashboard Specification

A single-page dashboard (`demo.html`) demonstrating how Scorecards and Skills work together, powered by live data from the Neon PostgreSQL database via the Scorecard API. The **CEO Goal View** (`goals.html`) serves as the landing page with a three-column pillar layout.

---

## Layout

6-panel grid using CSS Grid. Desktop-first, single page, no scrolling on 1080p+.

```
+------------------------------+------------------------------+
|  1. Org Hierarchy            |  2. Goal Cascade             |
|     (tree view, 18 nodes)    |     (flow diagram, 21 goals) |
|                              |                              |
+------------------------------+------------------------------+
|  3. Skill Cards              |  4. Skill Chain Pipeline     |
|     (3x2 grid, 6 skills)    |     (Chain A/B toggle,       |
|                              |      3-step pipeline)        |
+------------------------------+------------------------------+
|  5. Live Scorecard           |  6. Output Timeline          |
|     (RAG, progress, qtrly)   |     (chronological outputs)  |
|                              |                              |
+------------------------------+------------------------------+
```

Grid definition:
```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 16px;
  padding: 16px;
  height: 100vh;
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: 'Inter', system-ui, sans-serif;
}
```

---

## Color System

| Purpose | Color | Usage |
|---------|-------|-------|
| Background | `#0a0a0f` | Page background |
| Panel bg | `#12121a` | Card backgrounds |
| Panel border | `#1e1e2e` | Card borders |
| Primary text | `#e0e0e0` | Body text |
| Secondary text | `#8888aa` | Labels, muted text |
| Accent | `#6366f1` | Headers, active states |
| RAG Green | `#22c55e` | On-track status |
| RAG Amber | `#f59e0b` | At-risk status |
| RAG Red | `#ef4444` | Off-track status |
| RAG Not Started | `#6b7280` | Not yet begun |
| Elena color | `#fb7185` | Dr. Elena Vasquez (rose) |
| Marcus color | `#38bdf8` | Marcus Chen (sky) |
| Sarah color | `#fbbf24` | Sarah Okonkwo (amber) |
| James color | `#4ade80` | Dr. James Park (green) |
| Amara color | `#a78bfa` | Dr. Amara Osei (violet) |
| Richard color | `#fb923c` | Dr. Richard Stein (orange) |

---

## Panel 1: Org Hierarchy

**Grid position:** Row 1, Column 1

**API endpoint:** `GET /api/org-tree`

**Visual elements:**
- Indented tree with connector lines (vertical + horizontal CSS borders)
- Each node shows: icon by org_level, name, owner badge
- Level icons: Enterprise = building, Business Unit = globe, Function = folder, Department = team, Individual = person
- Active node highlighted with left border accent color
- Node color: Enterprise = accent, BU/Function = muted accent, Individual = persona color based on name
- 18 total org units in the hierarchy

**Interactivity:**
- Click a node to select it
- Selected node filters Panel 2 (Goal Cascade) to that org scope
- Hover shows description tooltip
- Default: Enterprise node selected (shows full tree in Panel 2)

**Data mapping:**
```
org_units.org_level  -> icon + indent level
org_units.name       -> node label
org_units.owner      -> small badge
org_units.description -> tooltip
children[]           -> nested indent
```

---

## Panel 2: Goal Cascade

**Grid position:** Row 1, Column 2

**API endpoint:** `GET /api/goal-tree/:orgId`

**Visual elements:**
- Vertical flow diagram: Pillar at top, Program at bottom
- Each level is a horizontal row with cards
- Cards connected by vertical lines with alignment type labels
- Card contents: goal name, goal_level badge, owner, status indicator
- Alignment strength shown as line thickness (1.0 = solid, 0.8 = slightly thinner)
- Goal level badges: Pillar = indigo, Category = blue, Goal = teal, Program = green
- 21 total goal items across the hierarchy

**Interactivity:**
- Click a Program card to select it, updating Panel 5 (Live Scorecard) and Panel 6 (Timeline)
- Hover on alignment lines shows alignment notes
- Default: full cascade visible from Pillar to Program

**Data mapping:**
```
goals[].goal_level   -> vertical position (row) + badge color
goals[].name         -> card title
goals[].owner        -> card subtitle
goals[].status       -> status dot (Active=green, Inactive=grey)
alignments[]         -> connector lines between cards
alignment_type       -> line style (primary=solid, secondary=dashed)
alignment_strength   -> line thickness
```

---

## Panel 3: Skill Cards

**Grid position:** Row 2, Column 1

**API endpoint:** `GET /api/skills`

**Visual elements:**
- 3x2 grid of skill cards (6 skills total): MSL Insight Reporter, Med Affairs Aggregator, Commercial Strategist, CRA Site Monitor, Patient Safety Evaluator, Medical Director Reviewer
- Each card shows:
  - Person name with colored avatar circle (persona colors defined above)
  - Skill name as heading
  - Skill type badge (personal)
  - Description text
  - Input spec rendered as labeled fields
  - Output spec rendered as labeled fields
  - Output count badge
  - Chain indicator: arrow showing chain membership (Chain A or Chain B)

**Interactivity:**
- Click a skill card to filter Panel 6 (Output Timeline) by that skill
- Hover on input/output spec fields shows full JSON schema tooltip
- Chain indicator links to Panel 4 (Skill Chain) and highlights the relevant chain

**Data mapping:**
```
skills.person_name   -> avatar + name
skills.skill_name    -> card heading
skills.skill_type    -> badge
skills.description   -> body text
skills.input_spec    -> input fields display
skills.output_spec   -> output fields display
skills.metadata      -> chain arrow (chain membership)
output_count         -> count badge
```

---

## Panel 4: Skill Chain Pipeline

**Grid position:** Row 2, Column 2

**API endpoints:**
- `GET /api/skill-outputs?person_name=<name>&limit=1` (latest output per persona)
- `GET /api/feedback?requested_by=<name>&status=completed`

**Visual elements:**
- Toggle button at top: **Chain A** (KOL Insights) | **Chain B** (AE Escalation)
- Horizontal pipeline visualization showing 3-step chain:
  - **Chain A:** Elena (MSL Insight Reporter) > Marcus (Med Affairs Aggregator) > Sarah (Commercial Strategist)
  - **Chain B:** James (CRA Site Monitor) > Amara (Patient Safety Evaluator) > Richard (Medical Director Reviewer)
- Three stages connected by animated arrows with data labels between nodes
- Pipeline shows the most recent completed chain output
- If no completed chain exists, show the pipeline skeleton with "awaiting data" placeholders

**Interactivity:**
- Toggle between Chain A and Chain B
- Click a node to expand the latest output for that persona
- Click feedback arrow to show feedback request/response detail
- Animated pulse on the "active" stage if there's an in-progress item

**Data mapping:**
```
Chain A:
  Elena output_data    -> step 1 card
  Marcus output_data   -> step 2 card
  Sarah output_data    -> step 3 card

Chain B:
  James output_data    -> step 1 card
  Amara output_data    -> step 2 card
  Richard output_data  -> step 3 card

feedback status        -> arrow badge color
feedback response_text -> arrow tooltip
```

---

## Panel 5: Live Scorecard

**Grid position:** Row 3, Column 1

**API endpoint:** `GET /api/scorecard`

**Visual elements:**
- Program header: name + org unit (one of 4 programs: AE-SENTINEL, VBP-142 Phase II Readiness, KOL-INSIGHTS, LAUNCH-READY)
- Large RAG status indicator: colored circle with status text (Red/Amber/Green/Not Started/Complete)
- Progress bar: horizontal bar filled to percent_complete, color matches RAG
- Quarterly objectives table:
  - 4 columns (Q1, Q2, Q3, Q4)
  - Each cell shows objective_text, target_value + target_unit
  - Current quarter highlighted with accent border
  - Empty quarters show "--"
- Metrics section: key-value display from progress.metrics JSON
- Last updated timestamp + author

**Interactivity:**
- RAG indicator pulses gently on hover, shows update_text as tooltip
- Click quarterly cell to see full objective detail
- Metrics auto-refresh (or show refresh button)
- Progress bar animates on load

**Data mapping:**
```
progress.rag_status          -> RAG circle color + label
progress.percent_complete    -> progress bar fill
progress.update_text         -> tooltip / expandable section
progress.metrics             -> metrics key-value display
progress.author              -> "Updated by" label
progress.last_updated        -> timestamp
objectives.Q1-Q4            -> quarterly table cells
objectives.target_value     -> target display
objectives.target_unit      -> unit label
```

---

## Panel 6: Output Timeline

**Grid position:** Row 3, Column 2

**API endpoint:** `GET /api/skill-outputs?limit=20`

**Visual elements:**
- Vertical timeline, newest at top
- Each entry is a card on the timeline with:
  - Timestamp (relative: "2 hours ago")
  - Person avatar (colored circle using persona colors)
  - Person name + skill name
  - Output summary text
  - Expandable output_data preview (first 2 lines)
  - Feedback badge if feedback_requests exist:
    - Pending = amber dot
    - Completed = green check
    - None = no badge
- Timeline line connects entries vertically
- Alternating slight background shade for readability
- Empty state: "No skill outputs yet. Run a skill to begin."

**Interactivity:**
- Click an entry to expand full output_data JSON (pretty-printed)
- Click feedback badge to see feedback request/response detail
- Filter by skill (driven by Panel 3 skill card selection)
- Scroll within panel if more than ~5 entries

**Data mapping:**
```
skill_outputs.created_at         -> timestamp
skill_outputs.person_name        -> avatar + name
skills.skill_name                -> skill label
skill_outputs.output_summary     -> summary text
skill_outputs.output_data        -> expandable preview
skill_outputs.status             -> status indicator
feedback_requests[].status       -> feedback badge
feedback_requests[].response_text -> feedback tooltip
```

---

## Cross-Panel Interactions

| Action | Source Panel | Target Panel | Effect |
|--------|-------------|--------------|--------|
| Click org node | 1. Org Hierarchy | 2. Goal Cascade | Filters goal tree to selected org scope |
| Click program card | 2. Goal Cascade | 5. Live Scorecard | Shows scorecard for selected program |
| Click skill card | 3. Skill Cards | 6. Output Timeline | Filters timeline to that skill's outputs |
| Click skill card | 3. Skill Cards | 4. Skill Chain | Highlights that skill's stage in pipeline |
| Toggle chain | 4. Skill Chain | 4. Skill Chain | Switches between Chain A and Chain B |

---

## Technical Requirements

- **Single HTML file** with inline CSS and JS (no build step)
- **Fetch API** for all data loading (no external JS libraries)
- **CSS Grid** for layout, **CSS custom properties** for theming
- **No framework** -- vanilla JS with DOM manipulation
- Data fetched on page load, panels render independently
- Loading states: skeleton placeholders with pulse animation
- Error states: muted error message within the panel, other panels unaffected
- API base URL configurable via a single constant at the top of the script

---

## Responsive Behavior

- **1920px+**: Full 2-column, 3-row grid as specified
- **1024-1919px**: Same grid, panels shrink proportionally
- **Below 1024px**: Stack to single column, 6 rows, scrollable

---

## Data Refresh

- Initial load: all 6 panels fetch in parallel on `DOMContentLoaded`
- No auto-refresh (static demo data)
- Optional: add a "Refresh" button in the page header that re-fetches all panels
