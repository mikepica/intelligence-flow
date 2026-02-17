# Scorecard Dashboard API Specification

Base URL: `/api`
Runtime: Express.js + Prisma (PostgreSQL on Neon)
All responses return JSON. All endpoints are GET-only (read-only dashboard).

---

## 1. GET /api/org-tree

Returns the full organizational hierarchy as a nested tree.

### Request

No parameters.

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Vantage Biopharma",
      "org_level": "Enterprise",
      "description": "Vantage Biopharma - Global pharmaceutical company",
      "owner": null,
      "status": "Active",
      "children": [
        {
          "id": 2,
          "name": "Oncology Business Unit",
          "org_level": "Business Unit",
          "children": [
            {
              "id": 4,
              "name": "Medical Affairs",
              "org_level": "Function",
              "children": [
                {
                  "id": 7,
                  "name": "Field Medical",
                  "org_level": "Department",
                  "children": [
                    {
                      "id": 13,
                      "name": "Dr. Elena Vasquez",
                      "org_level": "Individual",
                      "owner": "Dr. Elena Vasquez",
                      "children": []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### DB Tables Queried

`org_units`

### SQL Approach

Fetch all `org_units` with `status = 'Active'`, ordered by `parent_id NULLS FIRST, priority, name`. Build the tree in application code by mapping `parent_id` relationships. Root nodes have `parent_id IS NULL`.

```sql
SELECT id, parent_id, org_level, name, description, owner, status, tags
FROM org_units
WHERE status = 'Active'
ORDER BY parent_id NULLS FIRST, priority, name;
```

Prisma:
```typescript
const units = await prisma.org_units.findMany({
  where: { status: 'Active' },
  orderBy: [{ priority: 'asc' }, { name: 'asc' }]
});
// Build tree in JS: group by parent_id, recursively nest
```

---

## 2. GET /api/goal-tree/:orgId

Returns the goal hierarchy (Pillar > Category > Goal > Program) for a given org unit and its descendants, including cross-org alignments.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | path int | yes | Root org_unit ID to scope the tree |

### Response

```json
{
  "data": {
    "org_unit": {
      "id": 1,
      "name": "Vantage Biopharma",
      "org_level": "Enterprise"
    },
    "goals": [
      {
        "id": 1,
        "goal_level": "Pillar",
        "name": "Advance Pipeline",
        "description": "Advance the clinical pipeline...",
        "owner": null,
        "status": "Active",
        "org_unit_name": "Vantage Biopharma",
        "weight": 1.00,
        "children": [
          {
            "id": 4,
            "goal_level": "Category",
            "name": "Clinical Excellence",
            "children": [
              {
                "id": 9,
                "goal_level": "Goal",
                "name": "Patient Safety Monitoring",
                "children": [
                  {
                    "id": 18,
                    "goal_level": "Program",
                    "name": "AE-SENTINEL"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "alignments": [
      {
        "child_goal_id": 18,
        "child_goal_name": "AE-SENTINEL",
        "parent_goal_id": 9,
        "parent_goal_name": "Patient Safety Monitoring",
        "alignment_type": "primary",
        "alignment_strength": 1.00
      }
    ]
  }
}
```

### DB Tables Queried

`goal_items`, `org_units`, `goal_alignments`

### SQL Approach

1. Find all org_unit IDs that are descendants of `:orgId` (recursive CTE on org_units).
2. Fetch all goal_items belonging to those org_units.
3. Fetch all goal_alignments where either child or parent goal is in the result set.
4. Build nested tree in application code using `parent_id`.

```sql
-- Step 1: Get descendant org IDs
WITH RECURSIVE org_descendants AS (
    SELECT id FROM org_units WHERE id = :orgId
    UNION ALL
    SELECT ou.id FROM org_units ou
    JOIN org_descendants od ON ou.parent_id = od.id
)
-- Step 2: Goals for those orgs
SELECT gi.*, ou.name AS org_unit_name
FROM goal_items gi
JOIN org_units ou ON ou.id = gi.org_unit_id
WHERE gi.org_unit_id IN (SELECT id FROM org_descendants)
  AND gi.status = 'Active'
ORDER BY gi.goal_level, gi.priority, gi.name;
```

Prisma:
```typescript
// Use prisma.$queryRaw for the recursive CTE, then standard findMany for alignments
const goals = await prisma.$queryRaw`...recursive CTE above...`;
const goalIds = goals.map(g => g.id);
const alignments = await prisma.goal_alignments.findMany({
  where: {
    OR: [
      { child_goal_id: { in: goalIds } },
      { parent_goal_id: { in: goalIds } }
    ]
  }
});
```

---

## 3. GET /api/skills

Returns all registered skills with their input/output specs and chain metadata.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `person_name` | query string | no | Filter by person |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "person_name": "Dr. Elena Vasquez",
      "skill_name": "MSL Insight Reporter",
      "skill_type": "personal",
      "description": "Captures and structures KOL interaction insights from the field...",
      "input_spec": { "..." : "..." },
      "output_spec": { "..." : "..." },
      "metadata": {
        "skill_file": "skills/msl-insight-reporter/SKILL.md",
        "chain": "A",
        "chain_next": "Marcus Chen"
      },
      "output_count": 3
    },
    {
      "id": 2,
      "person_name": "Marcus Chen",
      "skill_name": "Med Affairs Aggregator",
      "skill_type": "personal",
      "description": "Aggregates field insights into regional trend reports...",
      "input_spec": { "..." : "..." },
      "output_spec": { "..." : "..." },
      "metadata": {
        "skill_file": "skills/med-affairs-aggregator/SKILL.md",
        "chain": "A",
        "chain_prev": "Dr. Elena Vasquez",
        "chain_next": "Sarah Okonkwo"
      },
      "output_count": 2
    }
  ]
}
```

### DB Tables Queried

`skills`, `skill_outputs` (for count)

### SQL Approach

```sql
SELECT s.*,
       COUNT(so.id) AS output_count
FROM skills s
LEFT JOIN skill_outputs so ON so.skill_id = s.id AND so.status = 'completed'
GROUP BY s.id
ORDER BY s.person_name, s.skill_name;
```

Prisma:
```typescript
const skills = await prisma.skills.findMany({
  where: person_name ? { person_name } : undefined,
  include: { _count: { select: { skill_outputs: true } } },
  orderBy: [{ person_name: 'asc' }, { skill_name: 'asc' }]
});
```

---

## 4. GET /api/skill-outputs

Returns skill execution outputs, optionally filtered. Supports the output timeline and chain pipeline panels.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `skill_id` | query int | no | Filter by skill |
| `person_name` | query string | no | Filter by person |
| `goal_name` | query string | no | Filter by goal |
| `status` | query string | no | Filter by status (in_progress, completed, superseded) |
| `limit` | query int | no | Max results (default 50) |
| `offset` | query int | no | Pagination offset (default 0) |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "skill_id": 1,
      "skill_name": "MSL Insight Reporter",
      "person_name": "Dr. Elena Vasquez",
      "goal_name": "KOL Engagement Insights",
      "output_data": {
        "kol_name": "Dr. Thompson",
        "therapeutic_area": "oncology",
        "key_insights": ["..."],
        "engagement_type": "advisory board"
      },
      "output_summary": "Captured KOL insight from Dr. Thompson on VBP-142 positioning",
      "status": "completed",
      "created_at": "2026-02-16T10:00:00Z",
      "feedback_requests": [
        {
          "id": 1,
          "requested_from": "Marcus Chen",
          "status": "completed",
          "response_text": "Strong insight. Incorporating into regional trend analysis..."
        }
      ]
    }
  ],
  "pagination": {
    "total": 6,
    "limit": 50,
    "offset": 0
  }
}
```

### DB Tables Queried

`skill_outputs`, `skills`, `feedback_requests`

### SQL Approach

```sql
SELECT so.*, s.skill_name, s.skill_type
FROM skill_outputs so
JOIN skills s ON s.id = so.skill_id
WHERE ($1::int IS NULL OR so.skill_id = $1)
  AND ($2::text IS NULL OR so.person_name = $2)
  AND ($3::text IS NULL OR so.goal_name = $3)
  AND ($4::text IS NULL OR so.status = $4)
ORDER BY so.created_at DESC
LIMIT $5 OFFSET $6;
```

Prisma:
```typescript
const outputs = await prisma.skill_outputs.findMany({
  where: {
    ...(skill_id && { skill_id: Number(skill_id) }),
    ...(person_name && { person_name }),
    ...(goal_name && { goal_name }),
    ...(status && { status })
  },
  include: {
    skills: { select: { skill_name: true, skill_type: true } },
    feedback_requests: true
  },
  orderBy: { created_at: 'desc' },
  take: limit,
  skip: offset
});
```

---

## 5. GET /api/feedback

Returns feedback requests with full context (skill output, skill info). Supports the collaboration timeline.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | query string | no | Filter: pending, in_review, completed, cancelled |
| `requested_from` | query string | no | Filter by reviewer |
| `requested_by` | query string | no | Filter by requester |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "requested_by": "Dr. Elena Vasquez",
      "requested_from": "Marcus Chen",
      "request_message": "Please review this KOL insight and incorporate into regional trends",
      "status": "completed",
      "response_text": "Strong insight. Incorporating into regional trend analysis...",
      "responded_at": "2026-02-16T12:00:00Z",
      "created_at": "2026-02-16T10:05:00Z",
      "skill_output": {
        "id": 1,
        "person_name": "Dr. Elena Vasquez",
        "goal_name": "KOL Engagement Insights",
        "output_summary": "Captured KOL insight from Dr. Thompson on VBP-142 positioning"
      },
      "skill": {
        "id": 1,
        "skill_name": "MSL Insight Reporter",
        "skill_type": "personal"
      }
    }
  ]
}
```

### DB Tables Queried

`feedback_requests`, `skill_outputs`, `skills`

### SQL Approach

```sql
SELECT fr.*,
       so.person_name AS output_author,
       so.goal_name,
       so.output_summary,
       so.output_data,
       s.skill_name,
       s.skill_type
FROM feedback_requests fr
JOIN skill_outputs so ON so.id = fr.skill_output_id
JOIN skills s ON s.id = so.skill_id
WHERE ($1::text IS NULL OR fr.status = $1)
  AND ($2::text IS NULL OR fr.requested_from = $2)
  AND ($3::text IS NULL OR fr.requested_by = $3)
ORDER BY fr.created_at DESC;
```

Prisma:
```typescript
const feedback = await prisma.feedback_requests.findMany({
  where: {
    ...(status && { status }),
    ...(requested_from && { requested_from }),
    ...(requested_by && { requested_by })
  },
  include: {
    skill_outputs: {
      include: { skills: { select: { id: true, skill_name: true, skill_type: true } } }
    }
  },
  orderBy: { created_at: 'desc' }
});
```

---

## 6. GET /api/scorecard

Returns the program scorecard: each program with quarterly objectives, latest RAG status, and progress. Uses the `v_program_scorecard` view.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | query int | no | Filter year (default 2026) |

### Response

```json
{
  "data": [
    {
      "program_id": 18,
      "program_name": "AE-SENTINEL",
      "org_unit": "Patient Safety",
      "org_level": "Department",
      "objectives": {
        "Q1": {
          "objective_text": "Establish AE signal detection framework and baseline monitoring",
          "target_value": 1.00,
          "target_unit": "framework",
          "status": "Active"
        },
        "Q2": null,
        "Q3": null,
        "Q4": null
      },
      "progress": {
        "percent_complete": 0.00,
        "rag_status": "Not Started",
        "last_updated": "2026-02-16T00:00:00Z",
        "update_text": "Program initiated. AE monitoring framework being established...",
        "metrics": {},
        "version": 1,
        "author": "Dr. James Park"
      }
    }
  ]
}
```

### DB Tables/Views Queried

`v_program_scorecard` (view), `program_objectives`, `v_latest_progress` (view)

### SQL Approach

The `v_program_scorecard` view provides the pivoted quarterly view. For the full response shape, query objectives separately to include target_value and target_unit.

```sql
-- Use the scorecard view for overview
SELECT * FROM v_program_scorecard WHERE program_id = ANY($1::int[]);

-- Get detailed objectives
SELECT po.*, gi.name AS program_name
FROM program_objectives po
JOIN goal_items gi ON gi.id = po.program_id
WHERE po.year = $1
ORDER BY po.program_id, po.quarter;

-- Get latest progress per program
SELECT * FROM v_latest_progress;
```

Prisma:
```typescript
const programs = await prisma.goal_items.findMany({
  where: { goal_level: 'Program', status: 'Active' },
  include: {
    org_units: { select: { name: true, org_level: true } },
    program_objectives: {
      where: { year: year || 2026 },
      orderBy: { quarter: 'asc' }
    },
    progress_updates: {
      orderBy: { version: 'desc' },
      take: 1
    }
  }
});
// Shape into response format with Q1-Q4 objective map
```

---

## 7. GET /api/progress/:programId

Returns all progress updates for a program, ordered by version descending. Shows the full history.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `programId` | path int | yes | The program goal_item ID |
| `latest` | query boolean | no | If true, return only the latest version |

### Response

```json
{
  "data": {
    "program": {
      "id": 18,
      "name": "AE-SENTINEL",
      "org_unit": "Patient Safety"
    },
    "updates": [
      {
        "id": 1,
        "version": 1,
        "update_text": "Program initiated. AE monitoring framework being established...",
        "percent_complete": 0.00,
        "rag_status": "Not Started",
        "metrics": {},
        "author": "Dr. James Park",
        "created_at": "2026-02-16T00:00:00Z"
      }
    ]
  }
}
```

### DB Tables Queried

`progress_updates`, `goal_items`, `org_units`

### SQL Approach

```sql
SELECT pu.*, gi.name AS program_name, ou.name AS org_unit_name
FROM progress_updates pu
JOIN goal_items gi ON gi.id = pu.program_id
JOIN org_units ou ON ou.id = gi.org_unit_id
WHERE pu.program_id = :programId
ORDER BY pu.version DESC;
```

Prisma:
```typescript
const program = await prisma.goal_items.findUnique({
  where: { id: programId },
  include: { org_units: { select: { name: true } } }
});
const updates = await prisma.progress_updates.findMany({
  where: { program_id: programId },
  orderBy: { version: 'desc' },
  ...(latest && { take: 1 })
});
```

---

## 8. GET /api/scorecard/summary

Returns a high-level summary of all programs with aggregate counts. Used by the CEO Goal View page.

### Request

No parameters.

### Response

```json
{
  "data": {
    "total_programs": 4,
    "total_goals": 21,
    "total_org_units": 18,
    "total_skills": 6,
    "programs": [
      {
        "id": 18,
        "name": "AE-SENTINEL",
        "rag_status": "Not Started",
        "percent_complete": 0.00,
        "owner": "Dr. James Park"
      },
      {
        "id": 19,
        "name": "VBP-142 Phase II Readiness",
        "rag_status": "Green",
        "percent_complete": 15.00,
        "owner": "Dr. Amara Osei"
      },
      {
        "id": 20,
        "name": "KOL-INSIGHTS",
        "rag_status": "Not Started",
        "percent_complete": 0.00,
        "owner": "Dr. Elena Vasquez"
      },
      {
        "id": 21,
        "name": "LAUNCH-READY",
        "rag_status": "Not Started",
        "percent_complete": 0.00,
        "owner": "Sarah Okonkwo"
      }
    ],
    "rag_summary": {
      "Green": 1,
      "Amber": 0,
      "Red": 0,
      "Not Started": 3,
      "Complete": 0
    }
  }
}
```

### DB Tables/Views Queried

`goal_items`, `org_units`, `skills`, `v_latest_progress`

### SQL Approach

```sql
-- Aggregate counts
SELECT
  (SELECT COUNT(*) FROM goal_items WHERE goal_level = 'Program' AND status = 'Active') AS total_programs,
  (SELECT COUNT(*) FROM goal_items WHERE status = 'Active') AS total_goals,
  (SELECT COUNT(*) FROM org_units WHERE status = 'Active') AS total_org_units,
  (SELECT COUNT(*) FROM skills) AS total_skills;

-- Program summaries with latest progress
SELECT gi.id, gi.name, gi.owner,
       COALESCE(lp.rag_status, 'Not Started') AS rag_status,
       COALESCE(lp.percent_complete, 0) AS percent_complete
FROM goal_items gi
LEFT JOIN v_latest_progress lp ON lp.program_id = gi.id
WHERE gi.goal_level = 'Program' AND gi.status = 'Active'
ORDER BY gi.name;
```

---

## 9. GET /api/goal-tree/:orgId/dashboard/:goalId

Returns a focused goal tree scoped to a specific goal and its descendants, with full progress and alignment data. Used when navigating from the CEO Goal View into a specific program dashboard.

### Request

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | path int | yes | Root org_unit ID |
| `goalId` | path int | yes | The goal to focus on (typically a Program) |

### Response

```json
{
  "data": {
    "goal": {
      "id": 18,
      "name": "AE-SENTINEL",
      "goal_level": "Program",
      "owner": "Dr. James Park",
      "org_unit_name": "Patient Safety",
      "status": "Active"
    },
    "ancestors": [
      { "id": 1, "name": "Advance Pipeline", "goal_level": "Pillar" },
      { "id": 4, "name": "Clinical Excellence", "goal_level": "Category" },
      { "id": 9, "name": "Patient Safety Monitoring", "goal_level": "Goal" }
    ],
    "progress": {
      "percent_complete": 0.00,
      "rag_status": "Not Started",
      "version": 1,
      "update_text": "Program initiated..."
    },
    "objectives": [
      {
        "quarter": "Q1",
        "objective_text": "Establish AE signal detection framework",
        "target_value": 1.00,
        "target_unit": "framework"
      }
    ],
    "related_skills": [
      {
        "person_name": "Dr. James Park",
        "skill_name": "CRA Site Monitor",
        "output_count": 0
      }
    ],
    "alignments": []
  }
}
```

### DB Tables Queried

`goal_items`, `org_units`, `goal_alignments`, `progress_updates`, `program_objectives`, `skills`, `skill_outputs`

### SQL Approach

Walk up the goal hierarchy via `parent_id` to build ancestors. Then join with progress, objectives, and related skills.

---

## Implementation Notes

### Prisma Client Setup

The Prisma schema already exists at `scorecard-mcp/prisma/schema.prisma`. The API server should reuse this schema by symlinking or copying it. The `DATABASE_URL` env var connects to Neon PostgreSQL.

### Tree-Building Utility

Both `/api/org-tree` and `/api/goal-tree/:orgId` require building nested trees from flat arrays. Use a shared utility:

```typescript
function buildTree<T extends { id: number; parent_id: number | null }>(
  items: T[]
): (T & { children: T[] })[] {
  const map = new Map<number, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  items.forEach(item => map.set(item.id, { ...item, children: [] }));
  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

### CORS

Enable CORS for `*` in development. The dashboard will be served from a different origin or as a static file.

### Error Responses

All errors follow this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Program with id 999 not found"
  }
}
```

Standard HTTP codes: 200 success, 400 bad request, 404 not found, 500 server error.
