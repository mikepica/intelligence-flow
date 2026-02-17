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
      "name": "Riddle Enterprises",
      "org_level": "Enterprise",
      "description": "Creative intelligence organization...",
      "owner": "Mike Pica",
      "status": "Active",
      "children": [
        {
          "id": 2,
          "name": "Riddle Workshop",
          "org_level": "Department",
          "description": "Collaborative riddle creation...",
          "owner": "Mike Pica",
          "status": "Active",
          "children": [
            {
              "id": 3,
              "name": "The Riddler",
              "org_level": "Individual",
              "description": "Creates basic riddles from prompts",
              "owner": "The Riddler",
              "status": "Active",
              "children": []
            },
            {
              "id": 4,
              "name": "The Sphinx",
              "org_level": "Individual",
              "description": "Deepens riddles into three-layer enigmas",
              "owner": "The Sphinx",
              "status": "Active",
              "children": []
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
      "name": "Riddle Enterprises",
      "org_level": "Enterprise"
    },
    "goals": [
      {
        "id": 1,
        "goal_level": "Pillar",
        "name": "Creative Intelligence",
        "description": "Drive creative output...",
        "owner": "Mike Pica",
        "status": "Active",
        "org_unit_name": "Riddle Enterprises",
        "weight": 1.00,
        "children": [
          {
            "id": 2,
            "goal_level": "Category",
            "name": "Riddle Mastery",
            "children": [
              {
                "id": 3,
                "goal_level": "Goal",
                "name": "Generate 10 quality riddles by end of Q1 2026",
                "children": [
                  {
                    "id": 4,
                    "goal_level": "Program",
                    "name": "Riddlemethis"
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
        "child_goal_id": 4,
        "child_goal_name": "Riddlemethis",
        "parent_goal_id": 3,
        "parent_goal_name": "Generate 10 quality riddles by end of Q1 2026",
        "alignment_type": "primary",
        "alignment_strength": 1.00,
        "notes": "Riddlemethis program directly advances the Q1 riddle generation goal"
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
      "person_name": "The Riddler",
      "skill_name": "Riddle Maker",
      "skill_type": "personal",
      "description": "Takes a prompt or topic and creates a semi-basic riddle...",
      "input_spec": {
        "type": "object",
        "properties": {
          "topic": { "type": "string", "description": "The subject or prompt..." }
        },
        "required": ["topic"]
      },
      "output_spec": {
        "type": "object",
        "properties": {
          "topic": { "type": "string" },
          "riddle": { "type": "string" },
          "answer": { "type": "string" },
          "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] }
        },
        "required": ["topic", "riddle", "answer", "difficulty"]
      },
      "metadata": {
        "skill_file": "skills/riddle-maker/SKILL.md",
        "chain_next": "The Sphinx"
      },
      "output_count": 3
    },
    {
      "id": 2,
      "person_name": "The Sphinx",
      "skill_name": "Riddle Deepener",
      "skill_type": "personal",
      "description": "Takes a basic riddle and transforms it into a three-layer deep riddle...",
      "input_spec": { "..." : "..." },
      "output_spec": { "..." : "..." },
      "metadata": {
        "skill_file": "skills/riddle-deepener/SKILL.md",
        "chain_prev": "The Riddler"
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
      "skill_name": "Riddle Maker",
      "person_name": "The Riddler",
      "goal_name": "Generate 10 quality riddles by end of Q1 2026",
      "output_data": {
        "topic": "time",
        "riddle": "I fly without wings...",
        "answer": "A cloud",
        "difficulty": "medium"
      },
      "output_summary": "Medium-difficulty riddle about time",
      "status": "completed",
      "created_at": "2026-02-16T10:00:00Z",
      "feedback_requests": [
        {
          "id": 1,
          "requested_from": "The Sphinx",
          "status": "completed",
          "response_text": "Good foundation for deepening..."
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
      "requested_by": "The Riddler",
      "requested_from": "The Sphinx",
      "request_message": "Please review and deepen this riddle with 3 layers",
      "status": "completed",
      "response_text": "Excellent foundation. I have created a three-layer version...",
      "responded_at": "2026-02-16T12:00:00Z",
      "created_at": "2026-02-16T10:05:00Z",
      "skill_output": {
        "id": 1,
        "person_name": "The Riddler",
        "goal_name": "Generate 10 quality riddles by end of Q1 2026",
        "output_summary": "Medium-difficulty riddle about time",
        "output_data": { "..." : "..." }
      },
      "skill": {
        "id": 1,
        "skill_name": "Riddle Maker",
        "skill_type": "personal"
      }
    }
  ]
}
```

### DB Tables Queried

`feedback_requests`, `skill_outputs`, `skills`

### SQL Approach

Uses the `v_pending_feedback` view for pending/in_review, or a direct join for all statuses.

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
      "program_id": 4,
      "program_name": "Riddlemethis",
      "org_unit": "Riddle Workshop",
      "org_level": "Department",
      "objectives": {
        "Q1": {
          "objective_text": "Generate 10 riddles using the riddle-maker and riddle-deepener skill pipeline",
          "target_value": 10.00,
          "target_unit": "riddles",
          "status": "Active"
        },
        "Q2": {
          "objective_text": "Refine riddle quality based on Q1 learnings and expand to new topics",
          "target_value": 15.00,
          "target_unit": "riddles",
          "status": "Active"
        },
        "Q3": null,
        "Q4": null
      },
      "progress": {
        "percent_complete": 0.00,
        "rag_status": "Not Started",
        "last_updated": "2026-02-16T00:00:00Z",
        "update_text": "Program initiated. Riddle Maker and Riddle Deepener skills registered...",
        "metrics": {
          "riddles_created": 0,
          "riddles_deepened": 0,
          "target": 10,
          "pipeline_status": "ready"
        },
        "version": 1,
        "author": "Mike Pica"
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
      "id": 4,
      "name": "Riddlemethis",
      "org_unit": "Riddle Workshop"
    },
    "updates": [
      {
        "id": 1,
        "version": 1,
        "update_text": "Program initiated. Riddle Maker and Riddle Deepener skills registered...",
        "percent_complete": 0.00,
        "rag_status": "Not Started",
        "metrics": {
          "riddles_created": 0,
          "riddles_deepened": 0,
          "target": 10,
          "pipeline_status": "ready"
        },
        "author": "Mike Pica",
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
