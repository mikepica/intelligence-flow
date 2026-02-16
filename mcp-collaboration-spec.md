# AZ Intelligence Flow -- MCP Server Build Guide

> **Purpose**: This document is a complete build specification for the single MCP server that powers the AZ Intelligence Flow prototype. A Claude Code agent should be able to read this file and build the entire server from scratch with no additional context.

> **Date**: 2026-02-16

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Project Structure](#3-project-structure)
4. [Environment and Configuration](#4-environment-and-configuration)
5. [Database Schema](#5-database-schema)
6. [MCP Server Implementation](#6-mcp-server-implementation)
7. [MCP Tools -- Complete Specifications](#7-mcp-tools----complete-specifications)
8. [SKILL.md Pattern](#8-skillmd-pattern)
9. [Skill Definitions](#9-skill-definitions)
10. [Seed Data](#10-seed-data)
11. [Demo Walkthrough](#11-demo-walkthrough)
12. [Implementation Checklist](#12-implementation-checklist)
13. [Appendices](#13-appendices)

---

## 1. System Overview

This is the collaboration layer of the AZ Intelligence Flow prototype -- an organizational coordination system for AstraZeneca. The system has one MCP server and one database:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **MCP Server** | TypeScript (stdio transport) | Single server exposing scorecard + collaboration tools |
| **Database** | Neon PostgreSQL (shared) | All data: org hierarchy, goals, progress, skills, outputs, feedback |
| **Skills** | SKILL.md markdown files | Agent-agnostic workflow definitions for each persona |

There is **one MCP server** (`scorecard-mcp/`) that handles everything. There is **no SQLite**, **no Docker**, and **no second server**. All collaboration tables (skills, skill_outputs, feedback_requests) live in the same Neon Postgres database alongside the scorecard tables.

Multiple collaborators on different machines connect to the **same Neon Postgres instance** via a shared `DATABASE_URL` environment variable. The `.env` file holds the connection string and is gitignored. A `.env.example` template is committed to the repository.

Each persona's workflow is defined as a **SKILL.md** markdown file following the Claude Agent Skills pattern (YAML frontmatter + step-by-step instructions referencing MCP tools). These are agent-agnostic -- any MCP-compatible agent can execute them.

---

## 2. Architecture Diagram

```
Claude Code Instance (Persona: Dr. Sarah Chen)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Neon PostgreSQL
                       (scorecard-mcp/)           (all tables)

Claude Code Instance (Persona: Dr. James Rivera)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Same Neon PostgreSQL

Claude Code Instance (Persona: Dr. Priya Sharma)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Same Neon PostgreSQL
```

All three Claude instances share the same Neon database. Each instance launches its own MCP server process via stdio, but all processes connect to the same Neon Postgres via `DATABASE_URL`.

---

## 3. Project Structure

```
az-intelligence-flow/
├── .claude/
│   └── mcp.json                         # MCP server config (committed to git)
├── .env.example                          # Template: DATABASE_URL=postgresql://...
├── .env                                  # Actual credentials (gitignored)
├── schema.sql                            # Original scorecard schema (v1.0)
├── migrations/
│   └── 002-collaboration-tables.sql      # Adds skills, skill_outputs, feedback_requests
│
├── skills/                               # Agent-agnostic SKILL.md definitions
│   ├── compound-analysis/
│   │   └── SKILL.md                      # Dr. Sarah Chen's skill
│   ├── biomarker-validation/
│   │   └── SKILL.md                      # Dr. James Rivera's skill
│   ├── trial-feasibility/
│   │   └── SKILL.md                      # Dr. Priya Sharma's skill
│   └── scorecard-overview/
│       └── SKILL.md                      # Anyone: query the full scorecard
│
├── scorecard-mcp/                        # SINGLE MCP server (scorecard + collaboration)
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma                 # Generated via `prisma db pull`
│   └── src/
│       ├── index.ts                      # MCP server entry (stdio transport)
│       └── tools/
│           ├── goals.ts                  # Goal hierarchy queries
│           ├── progress.ts               # Progress update management
│           ├── alignment.ts              # Cross-org alignment queries
│           ├── scorecard.ts              # Aggregated dashboard views
│           ├── skills.ts                 # Skill registration + listing
│           ├── outputs.ts                # Skill output submission + querying
│           └── feedback.ts               # Feedback request/response workflow
│
├── seed.ts                               # Seed data for demo scenario
├── mcp-collaboration-spec.md             # This file
├── app-overview.md                       # System overview
├── README.md                             # Setup + collaboration instructions
└── package.json                          # Root package.json
```

---

## 4. Environment and Configuration

### 4.1 Environment Variables

Create `.env.example` (committed to git):

```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

Create `.env` (gitignored -- each collaborator fills in the real credentials):

```
DATABASE_URL=postgresql://actual-user:actual-password@actual-host.neon.tech/actual-db?sslmode=require
```

The `.env` file MUST be listed in `.gitignore`. The `.env.example` file IS committed.

### 4.2 Claude Code MCP Configuration

Create `.claude/mcp.json` (committed to git):

```json
{
  "mcpServers": {
    "scorecard": {
      "command": "npx",
      "args": ["tsx", "scorecard-mcp/src/index.ts"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

The `${DATABASE_URL}` reference pulls the value from the environment. Each collaborator sets `DATABASE_URL` in their `.env` file or exports it in their shell.

### 4.3 TypeScript Configuration

`scorecard-mcp/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.4 Package Configuration

`scorecard-mcp/package.json`:

```json
{
  "name": "scorecard-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "db:pull": "prisma db pull",
    "db:generate": "prisma generate",
    "seed": "tsx ../seed.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "@prisma/client": "^6.4.1",
    "prisma": "^6.4.1",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}
```

Install with:
```bash
cd scorecard-mcp && npm install
```

### 4.5 Prisma Setup

Create `scorecard-mcp/prisma/schema.prisma` as a minimal starting point:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then introspect the existing Neon database (which includes both scorecard and collaboration tables after the migration is run):

```bash
cd scorecard-mcp
npx prisma db pull
npx prisma generate
```

This populates `prisma/schema.prisma` with models matching all deployed tables (including `skills`, `skill_outputs`, `feedback_requests`). The Prisma client then has typed access to everything.

**IMPORTANT**: The scorecard schema is already deployed. The collaboration tables are added via the migration in `migrations/002-collaboration-tables.sql`. After running that migration against Neon, use `prisma db pull` to introspect. Do NOT use `prisma db push` or `prisma migrate`.

---

## 5. Database Schema

### 5.1 Existing Scorecard Tables (from schema.sql)

These are already deployed to Neon:

| Table | Purpose |
|-------|---------|
| `org_units` | Self-referencing org hierarchy (Enterprise to Individual) |
| `goal_items` | Self-referencing goal hierarchy (Pillar to Program) |
| `goal_alignments` | Many-to-many alignment between goals |
| `program_objectives` | Quarterly objectives per program |
| `progress_updates` | Versioned progress updates per program |

Key views:

| View | Purpose |
|------|---------|
| `v_latest_progress` | Latest progress update per program |
| `v_org_hierarchy` | Full org hierarchy with paths |
| `v_program_scorecard` | Programs with quarterly objectives and progress |
| `v_alignment_map` | Cross-org alignment relationships |

Key enums:

| Enum | Values |
|------|--------|
| `org_level_enum` | Enterprise, Business Unit, Function, Department, Sub-Department, Individual |
| `goal_level_enum` | Pillar, Category, Goal, Program |
| `status_enum` | Active, Inactive, Archived |
| `alignment_type_enum` | primary, secondary, cross-cutting |
| `quarter_enum` | Q1, Q2, Q3, Q4 |
| `rag_status_enum` | Red, Amber, Green, Not Started, Complete |

### 5.2 Collaboration Tables (added via migration)

File: `migrations/002-collaboration-tables.sql`

Run this migration against the Neon database to add the collaboration tables:

```sql
-- Skills registry
CREATE TABLE skills (
    id              SERIAL PRIMARY KEY,
    person_name     TEXT NOT NULL,
    skill_name      TEXT NOT NULL,
    skill_type      TEXT NOT NULL CHECK(skill_type IN ('personal', 'team')),
    description     TEXT,
    input_spec      JSONB DEFAULT '{}',
    output_spec     JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(person_name, skill_name)
);

-- Skill execution outputs
CREATE TABLE skill_outputs (
    id              SERIAL PRIMARY KEY,
    skill_id        INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    person_name     TEXT NOT NULL,
    goal_name       TEXT NOT NULL,
    output_data     JSONB NOT NULL,
    output_summary  TEXT,
    status          TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('in_progress', 'completed', 'superseded')),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback request queue
CREATE TABLE feedback_requests (
    id                  SERIAL PRIMARY KEY,
    skill_output_id     INT NOT NULL REFERENCES skill_outputs(id) ON DELETE CASCADE,
    requested_by        TEXT NOT NULL,
    requested_from      TEXT NOT NULL,
    request_message     TEXT,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'completed', 'cancelled')),
    response_text       TEXT,
    responded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_skills_person ON skills(person_name);
CREATE INDEX idx_outputs_person ON skill_outputs(person_name);
CREATE INDEX idx_outputs_goal ON skill_outputs(goal_name);
CREATE INDEX idx_outputs_skill ON skill_outputs(skill_id);
CREATE INDEX idx_feedback_from ON feedback_requests(requested_from, status);
CREATE INDEX idx_feedback_output ON feedback_requests(skill_output_id);
```

After running this migration, re-run `prisma db pull` and `prisma generate` in `scorecard-mcp/` to pick up the new tables.

---

## 6. MCP Server Implementation

### 6.1 Entry Point: `scorecard-mcp/src/index.ts`

This file:
1. Creates an MCP `Server` instance with name `"scorecard-mcp"` and version `"1.0.0"`
2. Instantiates a `PrismaClient`
3. Registers all tool handlers (scorecard tools + collaboration tools)
4. Connects via `StdioServerTransport`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";

// Scorecard tool registrations
import { registerGoalTools } from "./tools/goals.js";
import { registerProgressTools } from "./tools/progress.js";
import { registerAlignmentTools } from "./tools/alignment.js";
import { registerScorecardTools } from "./tools/scorecard.js";

// Collaboration tool registrations
import { registerSkillTools } from "./tools/skills.js";
import { registerOutputTools } from "./tools/outputs.js";
import { registerFeedbackTools } from "./tools/feedback.js";

const prisma = new PrismaClient();
const server = new McpServer({
  name: "scorecard-mcp",
  version: "1.0.0",
});

// Register scorecard tools
registerGoalTools(server, prisma);
registerProgressTools(server, prisma);
registerAlignmentTools(server, prisma);
registerScorecardTools(server, prisma);

// Register collaboration tools
registerSkillTools(server, prisma);
registerOutputTools(server, prisma);
registerFeedbackTools(server, prisma);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6.2 Tool Registration Pattern

Each tool file exports a function that takes the `McpServer` instance and a `PrismaClient`, then registers tools using `server.tool()`.

The MCP SDK `server.tool()` method signature:

```typescript
server.tool(
  toolName: string,
  description: string,
  inputSchema: ZodObject,        // Zod schema for input validation
  handler: (params) => Promise<{ content: Array<{ type: "text", text: string }> }>
);
```

Use `zod` for input validation (import from `zod`).

**Example registration pattern**:

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PrismaClient } from "@prisma/client";

export function registerGoalTools(server: McpServer, prisma: PrismaClient) {
  server.tool(
    "get_goal_tree",
    "Get the goal hierarchy for an org unit",
    {
      org_unit_id: z.number().describe("The org unit ID to get goals for"),
      goal_level: z.enum(["Pillar", "Category", "Goal", "Program"]).optional()
        .describe("Filter to specific goal level"),
    },
    async ({ org_unit_id, goal_level }) => {
      const results = await prisma.$queryRaw`...`;
      return {
        content: [{ type: "text" as const, text: serializeResult(results) }],
      };
    }
  );
}
```

### 6.3 BigInt Serialization Helper

Prisma returns `BigInt` for some ID fields from `$queryRaw`. Use this serializer in all tool handlers that use raw queries:

```typescript
function serializeResult(data: unknown): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === "bigint" ? Number(value) : value
  , 2);
}
```

Use `serializeResult(result)` instead of `JSON.stringify(result, null, 2)` in all tool return values.

### 6.4 Error Handling Pattern

All tool handlers should follow this pattern:

```typescript
async ({ param1, param2 }) => {
  try {
    // ... query logic ...
    return {
      content: [{ type: "text" as const, text: serializeResult(result) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
}
```

### 6.5 Raw Query Notes

For queries that use database views or recursive CTEs, use `prisma.$queryRaw` or `prisma.$queryRawUnsafe`. The `$queryRaw` tagged template is preferred because it auto-parameterizes:

```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM v_latest_progress WHERE program_id = ${programId}
`;
```

For dynamic WHERE clauses (optional filters), use Prisma's `Prisma.sql` helper for composable tagged templates:

```typescript
import { Prisma } from "@prisma/client";

const where = org_unit_id
  ? Prisma.sql`WHERE org_unit = (SELECT name FROM org_units WHERE id = ${org_unit_id})`
  : Prisma.empty;

const results = await prisma.$queryRaw`
  SELECT * FROM v_program_scorecard ${where} ORDER BY program_name
`;
```

---

## 7. MCP Tools -- Complete Specifications

The single MCP server exposes 18 tools total: 10 scorecard tools and 8 collaboration tools.

### Scorecard Tools

#### Tool 1: `get_org_tree`

| Field | Value |
|-------|-------|
| **Name** | `get_org_tree` |
| **Description** | Get the organizational hierarchy tree. Returns nested org units from a root node to a specified depth. |
| **File** | `src/tools/goals.ts` |

**Input Schema (Zod)**:
```typescript
{
  root_id: z.number().optional().describe("Root org unit ID. Omit for entire tree."),
  depth: z.number().optional().describe("Max depth to traverse. Omit for full depth."),
}
```

**Query** (use `prisma.$queryRaw`):
```sql
WITH RECURSIVE org_tree AS (
    SELECT id, parent_id, org_level, name, description, owner, status, 0 AS depth
    FROM org_units
    WHERE parent_id IS NULL  -- or WHERE id = ${root_id} if provided
    UNION ALL
    SELECT ou.id, ou.parent_id, ou.org_level, ou.name, ou.description, ou.owner, ou.status, ot.depth + 1
    FROM org_units ou
    JOIN org_tree ot ON ou.parent_id = ot.id
    WHERE (${depth}::int IS NULL OR ot.depth < ${depth})
)
SELECT * FROM org_tree ORDER BY depth, name;
```

**Implementation note**: Build the query dynamically based on whether `root_id` is provided. If `root_id` is given, the base case of the CTE should be `WHERE id = ${root_id}`. If omitted, use `WHERE parent_id IS NULL`.

**Returns**: Array of org unit objects with depth field.

---

#### Tool 2: `get_goal_tree`

| Field | Value |
|-------|-------|
| **Name** | `get_goal_tree` |
| **Description** | Get the goal hierarchy for an org unit. Returns goals from Pillar down to Program level. |
| **File** | `src/tools/goals.ts` |

**Input Schema (Zod)**:
```typescript
{
  org_unit_id: z.number().describe("The org unit ID to get goals for"),
  goal_level: z.enum(["Pillar", "Category", "Goal", "Program"]).optional()
    .describe("Filter to a specific goal level"),
}
```

**Query**:
```sql
WITH RECURSIVE goal_tree AS (
    SELECT id, parent_id, org_unit_id, goal_level, name, description, owner, status, weight, 0 AS depth
    FROM goal_items
    WHERE org_unit_id = ${org_unit_id}
      AND parent_id IS NULL
    UNION ALL
    SELECT gi.id, gi.parent_id, gi.org_unit_id, gi.goal_level, gi.name, gi.description, gi.owner, gi.status, gi.weight, gt.depth + 1
    FROM goal_items gi
    JOIN goal_tree gt ON gi.parent_id = gt.id
)
SELECT * FROM goal_tree
WHERE (${goal_level}::text IS NULL OR goal_level::text = ${goal_level})
ORDER BY depth, name;
```

**Implementation note**: Since goals can span multiple org units, the initial query finds root goals (parent_id IS NULL) belonging to the given org_unit_id, then recursively finds all children regardless of their org_unit_id.

**Returns**: Array of goal objects with depth field.

---

#### Tool 3: `get_goals_for_person`

| Field | Value |
|-------|-------|
| **Name** | `get_goals_for_person` |
| **Description** | Get all goals owned by a specific person. |
| **File** | `src/tools/goals.ts` |

**Input Schema (Zod)**:
```typescript
{
  person_name: z.string().describe("The person's name (e.g., 'Dr. Sarah Chen')"),
}
```

**Query**:
```typescript
const goals = await prisma.goal_items.findMany({
  where: { owner: person_name },
  include: {
    org_units: true,
  },
  orderBy: [
    { goal_level: 'asc' },
    { name: 'asc' },
  ],
});
```

**Note**: Prisma relation names depend on what `prisma db pull` generates. Adjust the include/relation names to match the introspected schema. The key query is: `goal_items WHERE owner = person_name`.

**Returns**: Array of goal objects with their org unit info.

---

#### Tool 4: `get_goal_details`

| Field | Value |
|-------|-------|
| **Name** | `get_goal_details` |
| **Description** | Get detailed information about a specific goal, including its children, alignments, and latest progress. |
| **File** | `src/tools/goals.ts` |

**Input Schema (Zod)**:
```typescript
{
  goal_id: z.number().describe("The goal item ID"),
}
```

**Logic**:
1. Fetch the goal itself: `prisma.goal_items.findUnique({ where: { id: goal_id } })`
2. Fetch children: `prisma.goal_items.findMany({ where: { parent_id: goal_id } })`
3. Fetch alignments (both directions):
   - As child: `prisma.goal_alignments.findMany({ where: { child_goal_id: goal_id } })`
   - As parent: `prisma.goal_alignments.findMany({ where: { parent_goal_id: goal_id } })`
4. If the goal is a Program, fetch latest progress: query `v_latest_progress` view via `prisma.$queryRaw`

**Returns**: Single goal object with nested children, alignments, and latest progress.

---

#### Tool 5: `update_goal_status`

| Field | Value |
|-------|-------|
| **Name** | `update_goal_status` |
| **Description** | Update the status of a goal. |
| **File** | `src/tools/goals.ts` |

**Input Schema (Zod)**:
```typescript
{
  goal_id: z.number().describe("The goal item ID to update"),
  status: z.enum(["Active", "Inactive", "Archived"]).describe("New status"),
}
```

**Query**:
```typescript
const updated = await prisma.goal_items.update({
  where: { id: goal_id },
  data: { status },
});
```

**Returns**: The updated goal object.

---

#### Tool 6: `add_progress_update`

| Field | Value |
|-------|-------|
| **Name** | `add_progress_update` |
| **Description** | Add a versioned progress update to a program. Auto-increments the version number. |
| **File** | `src/tools/progress.ts` |

**Input Schema (Zod)**:
```typescript
{
  program_id: z.number().describe("The program (goal_items) ID"),
  update_text: z.string().describe("Progress update narrative"),
  percent_complete: z.number().min(0).max(100).optional().describe("Completion percentage"),
  rag_status: z.enum(["Red", "Amber", "Green", "Not Started", "Complete"]).optional()
    .describe("RAG status indicator"),
  author: z.string().describe("Name of the person authoring this update"),
  metrics: z.record(z.unknown()).optional().describe("Optional JSON metrics object"),
}
```

**Logic**:
1. Get the current max version for this program:
   ```sql
   SELECT COALESCE(MAX(version), 0) AS max_version
   FROM progress_updates
   WHERE program_id = ${program_id}
   ```
2. Insert with version = max_version + 1:
   ```typescript
   const result = await prisma.progress_updates.create({
     data: {
       program_id,
       version: maxVersion + 1,
       update_text,
       percent_complete,
       rag_status,
       author,
       metrics: metrics ?? {},
     },
   });
   ```

**Returns**: The created progress update record.

---

#### Tool 7: `get_scorecard`

| Field | Value |
|-------|-------|
| **Name** | `get_scorecard` |
| **Description** | Get the program scorecard view showing all programs with their quarterly objectives, progress, and RAG status. |
| **File** | `src/tools/scorecard.ts` |

**Input Schema (Zod)**:
```typescript
{
  org_unit_id: z.number().optional().describe("Filter to a specific org unit"),
  year: z.number().optional().describe("Filter to a specific year (default: 2026)"),
}
```

**Query** (use the `v_program_scorecard` view):
```sql
SELECT * FROM v_program_scorecard
WHERE (${org_unit_id}::int IS NULL OR org_unit = (SELECT name FROM org_units WHERE id = ${org_unit_id}))
ORDER BY program_name;
```

**Implementation note**: The `v_program_scorecard` view is already defined in the database. Query it directly.

**Returns**: Array of program scorecard rows.

---

#### Tool 8: `get_alignments`

| Field | Value |
|-------|-------|
| **Name** | `get_alignments` |
| **Description** | Get the cross-organizational alignment map showing how goals align across org units. |
| **File** | `src/tools/alignment.ts` |

**Input Schema (Zod)**:
```typescript
{
  goal_id: z.number().optional().describe("Filter alignments involving this goal"),
  alignment_type: z.enum(["primary", "secondary", "cross-cutting"]).optional()
    .describe("Filter by alignment type"),
}
```

**Query** (use the `v_alignment_map` view):
```sql
SELECT * FROM v_alignment_map
WHERE (${goal_id}::int IS NULL OR child_goal = (SELECT name FROM goal_items WHERE id = ${goal_id}) OR parent_goal = (SELECT name FROM goal_items WHERE id = ${goal_id}))
  AND (${alignment_type}::text IS NULL OR alignment_type::text = ${alignment_type})
ORDER BY parent_goal, child_goal;
```

**Returns**: Array of alignment map rows.

---

#### Tool 9: `get_quarterly_objectives`

| Field | Value |
|-------|-------|
| **Name** | `get_quarterly_objectives` |
| **Description** | Get the quarterly objectives for a specific program. |
| **File** | `src/tools/scorecard.ts` |

**Input Schema (Zod)**:
```typescript
{
  program_id: z.number().describe("The program (goal_items) ID"),
  year: z.number().optional().describe("Filter to a specific year (default: current year)"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional().describe("Filter to a specific quarter"),
}
```

**Query**:
```typescript
const objectives = await prisma.program_objectives.findMany({
  where: {
    program_id,
    ...(year && { year }),
    ...(quarter && { quarter }),
  },
  orderBy: [
    { year: 'asc' },
    { quarter: 'asc' },
  ],
});
```

**Returns**: Array of program objective records.

---

#### Tool 10: `get_latest_progress`

| Field | Value |
|-------|-------|
| **Name** | `get_latest_progress` |
| **Description** | Get the latest versioned progress update for a program. |
| **File** | `src/tools/progress.ts` |

**Input Schema (Zod)**:
```typescript
{
  program_id: z.number().describe("The program (goal_items) ID"),
}
```

**Query** (use the `v_latest_progress` view):
```sql
SELECT * FROM v_latest_progress WHERE program_id = ${program_id};
```

**Returns**: Single latest progress record or null.

---

### Collaboration Tools

#### Tool 11: `register_skill`

| Field | Value |
|-------|-------|
| **Name** | `register_skill` |
| **Description** | Register a new skill for a person. Skills represent capabilities that can produce work outputs. |
| **File** | `src/tools/skills.ts` |

**Input Schema (Zod)**:
```typescript
{
  person_name: z.string().describe("The person's name"),
  skill_name: z.string().describe("Name of the skill"),
  skill_type: z.enum(["personal", "team"]).describe("Whether this is an individual or team skill"),
  description: z.string().describe("Description of what this skill does"),
  input_spec: z.record(z.unknown()).optional().describe("JSON spec of what inputs the skill consumes"),
  output_spec: z.record(z.unknown()).optional().describe("JSON spec of what outputs the skill produces"),
  metadata: z.record(z.unknown()).optional().describe("Optional metadata"),
}
```

**Logic**:
```typescript
const skill = await prisma.skills.create({
  data: {
    person_name,
    skill_name,
    skill_type,
    description,
    input_spec: input_spec ?? {},
    output_spec: output_spec ?? {},
    metadata: metadata ?? {},
  },
});
```

**Returns**: The created skill record.

---

#### Tool 12: `list_skills`

| Field | Value |
|-------|-------|
| **Name** | `list_skills` |
| **Description** | List all registered skills, optionally filtered by person. |
| **File** | `src/tools/skills.ts` |

**Input Schema (Zod)**:
```typescript
{
  person_name: z.string().optional().describe("Filter skills by person name"),
}
```

**Logic**:
```typescript
const skills = await prisma.skills.findMany({
  where: person_name ? { person_name } : undefined,
  orderBy: { person_name: 'asc' },
});
```

**Returns**: Array of skill records.

---

#### Tool 13: `submit_skill_output`

| Field | Value |
|-------|-------|
| **Name** | `submit_skill_output` |
| **Description** | Submit the output of executing a skill. Links the output to a specific scorecard goal by name. |
| **File** | `src/tools/outputs.ts` |

**Input Schema (Zod)**:
```typescript
{
  skill_id: z.number().describe("ID of the skill that produced this output"),
  person_name: z.string().describe("Name of the person who produced the output"),
  goal_name: z.string().describe("Name of the scorecard goal this output advances"),
  output_data: z.record(z.unknown()).describe("The actual output data as JSON"),
  output_summary: z.string().describe("Human-readable summary of the output"),
  metadata: z.record(z.unknown()).optional().describe("Optional metadata"),
}
```

**Logic**:
```typescript
const output = await prisma.skill_outputs.create({
  data: {
    skill_id,
    person_name,
    goal_name,
    output_data,
    output_summary,
    status: "completed",
    metadata: metadata ?? {},
  },
});
```

**Returns**: The created skill output record.

---

#### Tool 14: `get_skill_outputs`

| Field | Value |
|-------|-------|
| **Name** | `get_skill_outputs` |
| **Description** | Query skill outputs, optionally filtered by person or goal name. |
| **File** | `src/tools/outputs.ts` |

**Input Schema (Zod)**:
```typescript
{
  person_name: z.string().optional().describe("Filter by person name"),
  goal_name: z.string().optional().describe("Filter by scorecard goal name"),
}
```

**Logic**:
```typescript
const outputs = await prisma.skill_outputs.findMany({
  where: {
    ...(person_name && { person_name }),
    ...(goal_name && { goal_name }),
  },
  include: {
    skills: true,
  },
  orderBy: { created_at: 'desc' },
});
```

**Note**: Adjust the `include` relation name to match what `prisma db pull` generates.

**Returns**: Array of skill output records with skill info joined.

---

#### Tool 15: `request_feedback`

| Field | Value |
|-------|-------|
| **Name** | `request_feedback` |
| **Description** | Request feedback from another person on a skill output. Creates a pending feedback request. |
| **File** | `src/tools/feedback.ts` |

**Input Schema (Zod)**:
```typescript
{
  skill_output_id: z.number().describe("ID of the skill output to review"),
  requested_by: z.string().describe("Person requesting the feedback"),
  requested_from: z.string().describe("Person who should provide feedback"),
  request_message: z.string().describe("Description of what feedback is needed"),
}
```

**Logic**:
```typescript
const request = await prisma.feedback_requests.create({
  data: {
    skill_output_id,
    requested_by,
    requested_from,
    request_message,
    status: "pending",
  },
});
```

**Returns**: The created feedback request record.

---

#### Tool 16: `get_pending_reviews`

| Field | Value |
|-------|-------|
| **Name** | `get_pending_reviews` |
| **Description** | Get all pending feedback requests assigned to a specific person. Includes the associated skill output and skill details. |
| **File** | `src/tools/feedback.ts` |

**Input Schema (Zod)**:
```typescript
{
  person_name: z.string().describe("Person to check for pending reviews"),
}
```

**Logic**:
```typescript
const reviews = await prisma.feedback_requests.findMany({
  where: {
    requested_from: person_name,
    status: "pending",
  },
  include: {
    skill_outputs: {
      include: {
        skills: true,
      },
    },
  },
  orderBy: { created_at: 'asc' },
});
```

**Note**: Adjust include/relation names to match the introspected schema. The goal is to return feedback requests with their associated skill outputs and skill definitions.

**Returns**: Array of pending feedback requests with output and skill details.

---

#### Tool 17: `submit_feedback`

| Field | Value |
|-------|-------|
| **Name** | `submit_feedback` |
| **Description** | Submit a feedback response to a pending review request. |
| **File** | `src/tools/feedback.ts` |

**Input Schema (Zod)**:
```typescript
{
  feedback_request_id: z.number().describe("ID of the feedback request to respond to"),
  response_text: z.string().describe("The feedback response text"),
}
```

**Logic**:
```typescript
const updated = await prisma.feedback_requests.update({
  where: { id: feedback_request_id },
  data: {
    status: "completed",
    response_text,
    responded_at: new Date(),
  },
});
```

**Returns**: The updated feedback request record.

---

#### Tool 18: `get_upstream_outputs`

| Field | Value |
|-------|-------|
| **Name** | `get_upstream_outputs` |
| **Description** | Get skill outputs from goals that feed into (are upstream of) the specified goal. Uses goal alignment relationships in the database to find upstream dependencies. |
| **File** | `src/tools/outputs.ts` |

**Input Schema (Zod)**:
```typescript
{
  goal_name: z.string().describe("The goal name to find upstream outputs for"),
}
```

**Logic**:

Since all data (alignments AND outputs) now lives in the same Postgres database, this tool can properly query the goal alignment graph:

```typescript
// Find the goal ID for the given goal name
const goal = await prisma.goal_items.findFirst({
  where: { name: goal_name },
});

if (!goal) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Goal not found" }) }] };
}

// Find upstream goals via alignments (goals that this goal depends on)
// The child_goal_id is the dependent goal, parent_goal_id is the upstream goal
const alignments = await prisma.goal_alignments.findMany({
  where: { child_goal_id: goal.id },
  include: {
    goal_items_goal_alignments_parent_goal_idTogoal_items: true,
  },
});

// Get the names of upstream goals
const upstreamGoalNames = alignments.map(
  a => a.goal_items_goal_alignments_parent_goal_idTogoal_items.name
);

// Also look for outputs from parent goals in the hierarchy
const parentGoal = goal.parent_id
  ? await prisma.goal_items.findUnique({ where: { id: goal.parent_id } })
  : null;

// Query all skill outputs for upstream goals
const allUpstreamNames = [...upstreamGoalNames];
if (parentGoal) {
  // Get sibling programs' outputs that might feed into this one
  const siblingPrograms = await prisma.goal_items.findMany({
    where: { parent_id: parentGoal.id, id: { not: goal.id } },
  });
  allUpstreamNames.push(...siblingPrograms.map(p => p.name));
}

const upstreamOutputs = await prisma.skill_outputs.findMany({
  where: {
    goal_name: { in: allUpstreamNames },
    status: "completed",
  },
  include: {
    skills: true,
  },
  orderBy: { created_at: 'asc' },
});
```

**Note**: Adjust Prisma relation names to match the introspected schema. The key concept: find goals that the target goal depends on (via `goal_alignments` where `child_goal_id` matches), then return any skill outputs for those upstream goals.

**Simpler fallback**: If the alignment-based query is too complex for the initial build, use the simpler approach of returning all completed outputs for goals OTHER than the specified goal:

```typescript
const upstreamOutputs = await prisma.skill_outputs.findMany({
  where: {
    goal_name: { not: goal_name },
    status: "completed",
  },
  include: { skills: true },
  orderBy: { created_at: 'asc' },
});
```

**Returns**: Array of upstream skill outputs with skill details.

---

## 8. SKILL.md Pattern

Each persona's workflow is defined as a SKILL.md markdown file following the Claude Agent Skills structure. These files have YAML frontmatter (name + description) and step-by-step workflow instructions that reference MCP tools by name.

The skills are **agent-agnostic** -- any MCP-compatible agent can load them and follow the workflow. They live in the `skills/` directory at the project root.

### Template

```markdown
---
name: skill-name-here
description: >
  What this skill does and when to use it. Mentions the persona,
  the domain, and the MCP tools involved.
---

# Skill Name

## Role
You are acting as **[Persona Name]**, [title] in [team] at AstraZeneca.

## Workflow

### Step 1: Check your goals
- Call `get_goals_for_person` with `person_name: "[name]"`
- Review assigned goals and identify the current priority

### Step 2: Check upstream inputs
- Call `get_upstream_outputs` with the relevant goal name
- Review outputs from upstream collaborators

### Step 3: Execute the skill
[Domain-specific work instructions]

### Step 4: Submit your output
- Call `submit_skill_output` with:
  - `skill_id`: Your skill's ID
  - `person_name`: Your name
  - `goal_name`: The goal this advances
  - `output_data`: Your results as JSON
  - `output_summary`: A human-readable summary

### Step 5: Request downstream review
- Call `request_feedback` targeting the next person in the chain

### Step 6: Update the scorecard
- Call `add_progress_update` with progress details

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_goals_for_person` | Check assigned goals |
| `get_upstream_outputs` | Review upstream data |
| `submit_skill_output` | Submit work results |
| `request_feedback` | Request peer review |
| `add_progress_update` | Update scorecard |

## Example Output

```json
{
  "key": "value"
}
```
```

---

## 9. Skill Definitions

### 9.1 Compound Analysis (Dr. Sarah Chen)

File: `skills/compound-analysis/SKILL.md`

```markdown
---
name: compound-analysis
description: >
  Compound efficacy analysis skill for Dr. Sarah Chen, Oncology Data Scientist.
  Screens compound libraries, ranks candidates by efficacy, and produces
  selectivity data for lead selection. Uses scorecard and collaboration MCP tools.
---

# Compound Efficacy Analysis

## Role
You are acting as **Dr. Sarah Chen**, Lead Data Scientist in Oncology Data Science at AstraZeneca. Your expertise is high-throughput compound screening and efficacy profiling for CDK4/6 inhibitor candidates.

## Workflow

### Step 1: Check your goals
- Call `get_goals_for_person` with `person_name: "Dr. Sarah Chen"`
- Review your assigned goals and identify the current priority program

### Step 2: Check for any existing outputs
- Call `get_skill_outputs` with `person_name: "Dr. Sarah Chen"` to see prior work
- Check if any upstream data is available

### Step 3: Execute compound analysis
- Review the target profile (CDK4/6 selectivity over CDK2)
- Screen the compound library against binding affinity, selectivity ratio, and ADMET properties
- Rank candidates by efficacy score (composite of binding affinity and selectivity)
- Identify top 3-5 candidates with rationale

### Step 4: Submit your output
- Call `submit_skill_output` with:
  - `skill_id`: Your "Compound Efficacy Analysis" skill ID
  - `person_name`: "Dr. Sarah Chen"
  - `goal_name`: "Screen candidate compound library"
  - `output_data`: JSON with candidates array, top_compound, total_screened, hit_rate
  - `output_summary`: Brief summary of screening results and lead candidate

### Step 5: Request downstream review
- Call `request_feedback` with:
  - `skill_output_id`: The output ID from Step 4
  - `requested_by`: "Dr. Sarah Chen"
  - `requested_from`: "Dr. James Rivera"
  - `request_message`: Request review of lead candidates for biomarker validation suitability

### Step 6: Update the scorecard
- Call `add_progress_update` with the program ID, completion status, and metrics

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_goals_for_person` | Check Sarah's assigned goals |
| `get_skill_outputs` | Review prior work |
| `submit_skill_output` | Submit screening results |
| `request_feedback` | Request James's review |
| `add_progress_update` | Update scorecard progress |

## Example Output

```json
{
  "candidates": [
    { "compound_id": "AZD-4891", "efficacy_score": 0.94, "selectivity_cdk46": 47.2 },
    { "compound_id": "AZD-5023", "efficacy_score": 0.87, "selectivity_cdk46": 38.1 },
    { "compound_id": "AZD-3177", "efficacy_score": 0.82, "selectivity_cdk46": 41.5 }
  ],
  "top_compound": "AZD-4891",
  "total_screened": 2847,
  "hit_rate": 0.032
}
```
```

### 9.2 Biomarker Validation (Dr. James Rivera)

File: `skills/biomarker-validation/SKILL.md`

```markdown
---
name: biomarker-validation
description: >
  Biomarker identification and validation skill for Dr. James Rivera,
  Translational Scientist. Identifies predictive biomarkers from compound
  data and patient samples, produces validated biomarker panels and patient
  selection criteria. Uses scorecard and collaboration MCP tools.
---

# Biomarker Identification & Validation

## Role
You are acting as **Dr. James Rivera**, Senior Translational Scientist in Translational Science at AstraZeneca. Your expertise is predictive biomarker development for oncology therapeutics.

## Workflow

### Step 1: Check pending reviews
- Call `get_pending_reviews` with `person_name: "Dr. James Rivera"`
- Review any feedback requests from upstream collaborators (e.g., Dr. Sarah Chen)

### Step 2: Review upstream data
- Call `get_upstream_outputs` with `goal_name: "Identify candidate biomarkers"`
- Review compound data from Sarah's analysis

### Step 3: Submit feedback on upstream work
- If there are pending reviews, call `submit_feedback` with your assessment
- Provide scientific evaluation of compound suitability for biomarker development

### Step 4: Execute biomarker identification
- Analyze compound target profile for biomarker candidates
- Cross-reference with genomic databases and literature
- Validate candidate markers against patient sample data
- Produce ranked biomarker panel with predictive values

### Step 5: Submit your output
- Call `submit_skill_output` with:
  - `skill_id`: Your "Biomarker Identification & Validation" skill ID
  - `person_name`: "Dr. James Rivera"
  - `goal_name`: "Identify candidate biomarkers"
  - `output_data`: JSON with biomarker_panel, recommended_patient_criteria, sample_size_analyzed
  - `output_summary`: Summary of biomarker panel and patient criteria

### Step 6: Request downstream review
- Call `request_feedback` with:
  - `skill_output_id`: The output ID from Step 5
  - `requested_by`: "Dr. James Rivera"
  - `requested_from`: "Dr. Priya Sharma"
  - `request_message`: Request review of biomarker panel and patient criteria for clinical feasibility

### Step 7: Update the scorecard
- Call `add_progress_update` with the program ID, completion status, and metrics

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_pending_reviews` | Check for feedback requests |
| `get_upstream_outputs` | Review compound data from Sarah |
| `submit_feedback` | Respond to Sarah's feedback request |
| `submit_skill_output` | Submit biomarker panel results |
| `request_feedback` | Request Priya's review |
| `add_progress_update` | Update scorecard progress |

## Example Output

```json
{
  "biomarker_panel": [
    { "marker": "CCND1 amplification", "type": "genomic", "predictive_value": 0.89 },
    { "marker": "RB1 wild-type status", "type": "genomic", "predictive_value": 0.91 },
    { "marker": "p16 loss", "type": "protein", "predictive_value": 0.78 },
    { "marker": "CDK4 expression level", "type": "protein", "predictive_value": 0.72 }
  ],
  "recommended_patient_criteria": "CCND1-amplified, RB1-wt, with p16 loss",
  "sample_size_analyzed": 342
}
```
```

### 9.3 Trial Feasibility (Dr. Priya Sharma)

File: `skills/trial-feasibility/SKILL.md`

```markdown
---
name: trial-feasibility
description: >
  Clinical trial feasibility assessment skill for Dr. Priya Sharma,
  Clinical Development Lead. Assesses trial feasibility including protocol
  design, site selection, recruitment projections, and endpoint definition.
  Uses scorecard and collaboration MCP tools.
---

# Clinical Trial Feasibility Assessment

## Role
You are acting as **Dr. Priya Sharma**, Clinical Development Lead in Clinical Operations at AstraZeneca. Your expertise is clinical trial design and feasibility assessment for oncology programs.

## Workflow

### Step 1: Get upstream outputs
- Call `get_upstream_outputs` with `goal_name: "Trial protocol design"`
- Review compound data from Sarah and biomarker criteria from James

### Step 2: Check pending reviews
- Call `get_pending_reviews` with `person_name: "Dr. Priya Sharma"`
- Review any feedback requests from upstream collaborators (e.g., Dr. James Rivera)

### Step 3: Submit feedback on upstream work
- If there are pending reviews, call `submit_feedback` with your assessment
- Evaluate biomarker criteria for clinical feasibility and recruitment viability

### Step 4: Execute feasibility assessment
- Assess target patient population size based on biomarker criteria
- Evaluate site feasibility across regions
- Project recruitment timelines and enrollment velocity
- Design adaptive protocol with appropriate endpoints
- Produce comprehensive feasibility report

### Step 5: Submit your output
- Call `submit_skill_output` with:
  - `skill_id`: Your "Clinical Trial Feasibility Assessment" skill ID
  - `person_name`: "Dr. Priya Sharma"
  - `goal_name`: "Trial protocol design"
  - `output_data`: JSON with feasibility_score, protocol_type, enrollment details, endpoints
  - `output_summary`: Summary of feasibility assessment and key recommendations

### Step 6: Update the scorecard
- Call `add_progress_update` with the program ID, completion status, and metrics

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_upstream_outputs` | Review compound and biomarker data |
| `get_pending_reviews` | Check for feedback requests |
| `submit_feedback` | Respond to James's feedback request |
| `submit_skill_output` | Submit feasibility report |
| `add_progress_update` | Update scorecard progress |

## Example Output

```json
{
  "feasibility_score": 0.82,
  "protocol_type": "Phase I/II adaptive",
  "estimated_enrollment": 120,
  "enrollment_timeline_months": 14,
  "recommended_sites": 18,
  "regions": ["North America", "Western Europe"],
  "primary_endpoint": "ORR by RECIST 1.1",
  "secondary_endpoints": ["PFS", "DOR", "CBR", "Safety/tolerability"],
  "inclusion_biomarkers": ["CCND1 amplification", "RB1 wild-type", "p16 loss"],
  "compound": "AZD-4891"
}
```
```

### 9.4 Scorecard Overview (Anyone)

File: `skills/scorecard-overview/SKILL.md`

```markdown
---
name: scorecard-overview
description: >
  General-purpose scorecard overview skill. Any persona can use this to
  query the full organizational scorecard, check program status, review
  alignments, and get a high-level view of progress across all teams.
---

# Scorecard Overview

## Role
You are reviewing the AstraZeneca organizational scorecard to understand the current state of all programs, goals, and cross-functional alignments.

## Workflow

### Step 1: View the organization
- Call `get_org_tree` to see the full organizational hierarchy

### Step 2: View the scorecard
- Call `get_scorecard` to see all programs with progress and RAG status

### Step 3: Check alignments
- Call `get_alignments` to see cross-org dependencies and alignment relationships

### Step 4: Drill into specific programs
- Call `get_goal_details` for any program of interest
- Call `get_latest_progress` for the most recent update on a specific program
- Call `get_quarterly_objectives` for milestone details

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_org_tree` | View org hierarchy |
| `get_scorecard` | Full program dashboard |
| `get_alignments` | Cross-org dependencies |
| `get_goal_details` | Drill into a specific goal |
| `get_latest_progress` | Latest progress for a program |
| `get_quarterly_objectives` | Quarterly milestones |
```

---

## 10. Seed Data

### 10.1 Overview

The seed script (`seed.ts` at the project root) populates the Neon PostgreSQL database with:

1. Org hierarchy (AZ -> Oncology R&D -> Sarah, James; Clinical Dev -> Priya)
2. Goal hierarchy (Pillar -> Category -> Goal -> Program for CDK4/6 inhibitor)
3. Goal alignments (cross-team dependencies)
4. Quarterly objectives (2026 Q1-Q4)
5. Initial progress update for Sarah's first program
6. Pre-registered skills for all 3 personas

**IMPORTANT**: Run this script only once. It inserts all demo data.

### 10.2 The 3 Personas

**Dr. Sarah Chen** -- Oncology Data Scientist (Oncology R&D)
- Skill: "Compound Efficacy Analysis" (personal)
- Input: Compound library, target profile
- Output: Ranked candidates with efficacy scores, selectivity data

**Dr. James Rivera** -- Translational Scientist (Oncology R&D)
- Skill: "Biomarker Identification & Validation" (personal)
- Input: Lead compounds, patient sample data
- Output: Validated biomarker panel, patient selection criteria

**Dr. Priya Sharma** -- Clinical Development Lead (Clinical Development)
- Skill: "Clinical Trial Feasibility Assessment" (team)
- Input: Biomarker criteria, compound data, target indication
- Output: Feasibility report, protocol recommendations, recruitment projections

### 10.3 Data Tables

#### Org Units

| Name | Level | Parent | Owner |
|------|-------|--------|-------|
| AstraZeneca | Enterprise | -- | -- |
| Oncology R&D | Business Unit | AstraZeneca | -- |
| Clinical Development | Business Unit | AstraZeneca | -- |
| Oncology Data Science | Department | Oncology R&D | -- |
| Translational Science | Department | Oncology R&D | -- |
| Clinical Operations | Department | Clinical Development | -- |
| Dr. Sarah Chen | Individual | Oncology Data Science | Dr. Sarah Chen |
| Dr. James Rivera | Individual | Translational Science | Dr. James Rivera |
| Dr. Priya Sharma | Individual | Clinical Operations | Dr. Priya Sharma |

#### Goal Items

| Name | Level | Org Unit | Owner | Parent Goal |
|------|-------|----------|-------|-------------|
| Advance Novel Oncology Therapeutics | Pillar | Oncology R&D | -- | -- |
| CDK4/6 Inhibitor Program | Category | Oncology R&D | -- | Pillar above |
| Identify Lead Compound | Goal | Oncology Data Science | Dr. Sarah Chen | Category above |
| Validate Predictive Biomarkers | Goal | Translational Science | Dr. James Rivera | Category above |
| Assess Clinical Feasibility | Goal | Clinical Operations | Dr. Priya Sharma | Category above |
| Screen candidate compound library | Program | Oncology Data Science | Dr. Sarah Chen | Identify Lead Compound |
| In-vitro efficacy profiling | Program | Oncology Data Science | Dr. Sarah Chen | Identify Lead Compound |
| Lead candidate selection | Program | Oncology Data Science | Dr. Sarah Chen | Identify Lead Compound |
| Identify candidate biomarkers | Program | Translational Science | Dr. James Rivera | Validate Predictive Biomarkers |
| Retrospective patient sample analysis | Program | Translational Science | Dr. James Rivera | Validate Predictive Biomarkers |
| Define patient selection criteria | Program | Translational Science | Dr. James Rivera | Validate Predictive Biomarkers |
| Trial protocol design | Program | Clinical Operations | Dr. Priya Sharma | Assess Clinical Feasibility |
| Site and patient recruitment assessment | Program | Clinical Operations | Dr. Priya Sharma | Assess Clinical Feasibility |
| Endpoint definition and statistical design | Program | Clinical Operations | Dr. Priya Sharma | Assess Clinical Feasibility |

#### Program Objectives (Quarterly)

| Program | Quarter | Objective |
|---------|---------|-----------|
| Screen candidate compound library | Q1 | Complete high-throughput screening of CDK4/6 focused compound library |
| In-vitro efficacy profiling | Q1 | Initiate in-vitro assays for top screening hits |
| In-vitro efficacy profiling | Q2 | Complete efficacy and selectivity profiling of lead candidates |
| Lead candidate selection | Q2 | Select lead candidate based on efficacy, selectivity, and ADMET profile |
| Identify candidate biomarkers | Q2 | Identify candidate biomarker panel from literature and genomic data |
| Retrospective patient sample analysis | Q2 | Begin retrospective analysis of archived patient samples |
| Retrospective patient sample analysis | Q3 | Complete patient sample analysis and validate biomarker correlations |
| Define patient selection criteria | Q3 | Establish patient selection criteria based on validated biomarkers |
| Trial protocol design | Q3 | Draft Phase I/II clinical trial protocol |
| Site and patient recruitment assessment | Q3 | Initiate site feasibility assessments |
| Site and patient recruitment assessment | Q4 | Complete recruitment projections and site selection |
| Endpoint definition and statistical design | Q4 | Finalize primary/secondary endpoints and statistical analysis plan |

#### Goal Alignments

| Child Goal | Parent Goal | Type |
|-----------|-------------|------|
| Identify candidate biomarkers | Lead candidate selection | primary |
| Trial protocol design | Define patient selection criteria | primary |
| Site and patient recruitment assessment | Define patient selection criteria | secondary |
| CDK4/6 Inhibitor Program | Advance Novel Oncology Therapeutics | primary |
| Identify Lead Compound | CDK4/6 Inhibitor Program | primary |
| Validate Predictive Biomarkers | CDK4/6 Inhibitor Program | primary |
| Assess Clinical Feasibility | CDK4/6 Inhibitor Program | primary |

#### Initial Progress Update

| Program | Version | Percent | RAG | Author | Text |
|---------|---------|---------|-----|--------|------|
| Screen candidate compound library | 1 | 15 | Green | Dr. Sarah Chen | Initiated screening of 2,847 compounds from CDK4/6 focused library. High-throughput assay validated and running. |

#### Pre-Registered Skills

| Person | Skill Name | Type | Description |
|--------|-----------|------|-------------|
| Dr. Sarah Chen | Compound Efficacy Analysis | personal | High-throughput screening and efficacy profiling of candidate compounds |
| Dr. James Rivera | Biomarker Identification & Validation | personal | Identification and validation of predictive biomarkers from genomic data and patient samples |
| Dr. Priya Sharma | Clinical Trial Feasibility Assessment | team | End-to-end clinical trial feasibility assessment including protocol design, site selection, recruitment projections |

### 10.4 Seed Script Implementation

File: `seed.ts` (project root)

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ================================================================
  // 1. ORG UNITS
  // ================================================================
  const az = await prisma.org_units.create({
    data: {
      org_level: "Enterprise",
      name: "AstraZeneca",
      description: "AstraZeneca PLC - Global biopharmaceutical company",
      status: "Active",
    },
  });

  const oncRD = await prisma.org_units.create({
    data: {
      parent_id: az.id,
      org_level: "Business Unit",
      name: "Oncology R&D",
      description: "Oncology Research & Development",
      status: "Active",
    },
  });

  const clinDev = await prisma.org_units.create({
    data: {
      parent_id: az.id,
      org_level: "Business Unit",
      name: "Clinical Development",
      description: "Clinical Development Operations",
      status: "Active",
    },
  });

  const oncDS = await prisma.org_units.create({
    data: {
      parent_id: oncRD.id,
      org_level: "Department",
      name: "Oncology Data Science",
      description: "Data science and computational biology for oncology",
      status: "Active",
    },
  });

  const transSci = await prisma.org_units.create({
    data: {
      parent_id: oncRD.id,
      org_level: "Department",
      name: "Translational Science",
      description: "Translational science and biomarker development",
      status: "Active",
    },
  });

  const clinOps = await prisma.org_units.create({
    data: {
      parent_id: clinDev.id,
      org_level: "Department",
      name: "Clinical Operations",
      description: "Clinical trial operations and feasibility",
      status: "Active",
    },
  });

  const sarah = await prisma.org_units.create({
    data: {
      parent_id: oncDS.id,
      org_level: "Individual",
      name: "Dr. Sarah Chen",
      owner: "Dr. Sarah Chen",
      description: "Lead Data Scientist - Oncology compound analysis",
      status: "Active",
    },
  });

  const james = await prisma.org_units.create({
    data: {
      parent_id: transSci.id,
      org_level: "Individual",
      name: "Dr. James Rivera",
      owner: "Dr. James Rivera",
      description: "Senior Translational Scientist - Biomarker development",
      status: "Active",
    },
  });

  const priya = await prisma.org_units.create({
    data: {
      parent_id: clinOps.id,
      org_level: "Individual",
      name: "Dr. Priya Sharma",
      owner: "Dr. Priya Sharma",
      description: "Clinical Development Lead - Trial feasibility",
      status: "Active",
    },
  });

  console.log("Org units created.");

  // ================================================================
  // 2. GOAL HIERARCHY
  // ================================================================
  const pillar = await prisma.goal_items.create({
    data: {
      org_unit_id: oncRD.id,
      goal_level: "Pillar",
      name: "Advance Novel Oncology Therapeutics",
      description: "Strategic pillar for advancing novel oncology therapeutic programs",
      status: "Active",
    },
  });

  const category = await prisma.goal_items.create({
    data: {
      parent_id: pillar.id,
      org_unit_id: oncRD.id,
      goal_level: "Category",
      name: "CDK4/6 Inhibitor Program",
      description: "Next-generation CDK4/6 inhibitor development program",
      status: "Active",
    },
  });

  const goalLead = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: oncDS.id,
      goal_level: "Goal",
      name: "Identify Lead Compound",
      description: "Identify and validate a lead CDK4/6 inhibitor compound",
      owner: "Dr. Sarah Chen",
      status: "Active",
    },
  });

  const goalBiomarker = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: transSci.id,
      goal_level: "Goal",
      name: "Validate Predictive Biomarkers",
      description: "Identify and validate predictive biomarkers for patient selection",
      owner: "Dr. James Rivera",
      status: "Active",
    },
  });

  const goalFeasibility = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: clinOps.id,
      goal_level: "Goal",
      name: "Assess Clinical Feasibility",
      description: "Assess feasibility of Phase I/II clinical trial",
      owner: "Dr. Priya Sharma",
      status: "Active",
    },
  });

  // Programs for Sarah
  const progScreen = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "Screen candidate compound library",
      description: "High-throughput screening of CDK4/6 focused compound library",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-01-01"),
      end_date: new Date("2026-03-31"),
    },
  });

  const progEfficacy = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "In-vitro efficacy profiling",
      description: "In-vitro efficacy and selectivity profiling of screening hits",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-01-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  const progSelection = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "Lead candidate selection",
      description: "Select lead candidate based on efficacy, selectivity, and ADMET profile",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  // Programs for James
  const progBiomarkerID = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Identify candidate biomarkers",
      description: "Identify candidate biomarker panel from literature and genomic data",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  const progRetro = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Retrospective patient sample analysis",
      description: "Retrospective analysis of archived patient samples for biomarker validation",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  const progCriteria = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Define patient selection criteria",
      description: "Establish patient selection criteria based on validated biomarkers",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  // Programs for Priya
  const progProtocol = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Trial protocol design",
      description: "Draft Phase I/II clinical trial protocol",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  const progRecruitment = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Site and patient recruitment assessment",
      description: "Assess site feasibility and patient recruitment projections",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-12-31"),
    },
  });

  const progEndpoint = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Endpoint definition and statistical design",
      description: "Finalize primary/secondary endpoints and statistical analysis plan",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-10-01"),
      end_date: new Date("2026-12-31"),
    },
  });

  console.log("Goal hierarchy created.");

  // ================================================================
  // 3. PROGRAM OBJECTIVES
  // ================================================================
  const objectives = [
    { program_id: progScreen.id, quarter: "Q1", objective_text: "Complete high-throughput screening of CDK4/6 focused compound library" },
    { program_id: progEfficacy.id, quarter: "Q1", objective_text: "Initiate in-vitro assays for top screening hits" },
    { program_id: progEfficacy.id, quarter: "Q2", objective_text: "Complete efficacy and selectivity profiling of lead candidates" },
    { program_id: progSelection.id, quarter: "Q2", objective_text: "Select lead candidate based on efficacy, selectivity, and ADMET profile" },
    { program_id: progBiomarkerID.id, quarter: "Q2", objective_text: "Identify candidate biomarker panel from literature and genomic data" },
    { program_id: progRetro.id, quarter: "Q2", objective_text: "Begin retrospective analysis of archived patient samples" },
    { program_id: progRetro.id, quarter: "Q3", objective_text: "Complete patient sample analysis and validate biomarker correlations" },
    { program_id: progCriteria.id, quarter: "Q3", objective_text: "Establish patient selection criteria based on validated biomarkers" },
    { program_id: progProtocol.id, quarter: "Q3", objective_text: "Draft Phase I/II clinical trial protocol" },
    { program_id: progRecruitment.id, quarter: "Q3", objective_text: "Initiate site feasibility assessments" },
    { program_id: progRecruitment.id, quarter: "Q4", objective_text: "Complete recruitment projections and site selection" },
    { program_id: progEndpoint.id, quarter: "Q4", objective_text: "Finalize primary/secondary endpoints and statistical analysis plan" },
  ];

  for (const obj of objectives) {
    await prisma.program_objectives.create({
      data: {
        program_id: obj.program_id,
        quarter: obj.quarter as any,
        year: 2026,
        objective_text: obj.objective_text,
        status: "Active",
      },
    });
  }

  console.log("Program objectives created.");

  // ================================================================
  // 4. GOAL ALIGNMENTS
  // ================================================================
  const alignments = [
    // Cross-function dependencies
    { child_goal_id: progBiomarkerID.id, parent_goal_id: progSelection.id, alignment_type: "primary" },
    { child_goal_id: progProtocol.id, parent_goal_id: progCriteria.id, alignment_type: "primary" },
    { child_goal_id: progRecruitment.id, parent_goal_id: progCriteria.id, alignment_type: "secondary" },
    // Structural alignments
    { child_goal_id: category.id, parent_goal_id: pillar.id, alignment_type: "primary" },
    { child_goal_id: goalLead.id, parent_goal_id: category.id, alignment_type: "primary" },
    { child_goal_id: goalBiomarker.id, parent_goal_id: category.id, alignment_type: "primary" },
    { child_goal_id: goalFeasibility.id, parent_goal_id: category.id, alignment_type: "primary" },
  ];

  for (const align of alignments) {
    await prisma.goal_alignments.create({
      data: {
        child_goal_id: align.child_goal_id,
        parent_goal_id: align.parent_goal_id,
        alignment_type: align.alignment_type as any,
        alignment_strength: 1.0,
      },
    });
  }

  console.log("Goal alignments created.");

  // ================================================================
  // 5. INITIAL PROGRESS UPDATE
  // ================================================================
  await prisma.progress_updates.create({
    data: {
      program_id: progScreen.id,
      version: 1,
      update_text: "Initiated screening of 2,847 compounds from CDK4/6 focused library. High-throughput assay validated and running.",
      percent_complete: 15,
      rag_status: "Green",
      author: "Dr. Sarah Chen",
      metrics: {
        compounds_screened: 427,
        total_compounds: 2847,
        hit_rate: 0.032,
        assay_z_prime: 0.78,
      },
    },
  });

  console.log("Initial progress update created.");

  // ================================================================
  // 6. PRE-REGISTERED SKILLS (in the collaboration tables)
  // ================================================================
  await prisma.skills.create({
    data: {
      person_name: "Dr. Sarah Chen",
      skill_name: "Compound Efficacy Analysis",
      skill_type: "personal",
      description: "High-throughput screening and efficacy profiling of candidate compounds. Analyzes compound libraries against target profiles, ranks candidates by efficacy scores, and provides selectivity data for lead selection.",
      input_spec: {
        required: ["compound_library", "target_profile"],
        optional: ["selectivity_panel", "admet_criteria"],
        description: "Compound library dataset and CDK4/6 target binding profile",
      },
      output_spec: {
        produces: ["ranked_candidates", "efficacy_scores", "selectivity_data"],
        format: "JSON with compound IDs, scores, and selectivity ratios",
        description: "Ranked candidate compounds with efficacy scores and selectivity data",
      },
    },
  });

  await prisma.skills.create({
    data: {
      person_name: "Dr. James Rivera",
      skill_name: "Biomarker Identification & Validation",
      skill_type: "personal",
      description: "Identification and validation of predictive biomarkers from genomic data and patient samples. Produces validated biomarker panels and patient selection criteria for clinical development.",
      input_spec: {
        required: ["lead_compounds", "patient_sample_data"],
        optional: ["genomic_database", "literature_references"],
        description: "Lead compound data from efficacy analysis and archived patient sample data",
      },
      output_spec: {
        produces: ["validated_biomarker_panel", "patient_selection_criteria", "correlation_data"],
        format: "JSON with biomarker IDs, validation statistics, and selection thresholds",
        description: "Validated biomarker panel with patient selection criteria",
      },
    },
  });

  await prisma.skills.create({
    data: {
      person_name: "Dr. Priya Sharma",
      skill_name: "Clinical Trial Feasibility Assessment",
      skill_type: "team",
      description: "End-to-end clinical trial feasibility assessment including protocol design, site selection, patient recruitment projections, and endpoint definition. Requires inputs from compound and biomarker teams.",
      input_spec: {
        required: ["biomarker_criteria", "compound_data", "target_indication"],
        optional: ["site_database", "historical_enrollment_data"],
        description: "Biomarker selection criteria, lead compound profile, and target indication details",
      },
      output_spec: {
        produces: ["feasibility_report", "protocol_recommendations", "recruitment_projections"],
        format: "JSON with feasibility scores, protocol outline, and projected timelines",
        description: "Comprehensive feasibility report with protocol recommendations and recruitment projections",
      },
    },
  });

  console.log("Skills pre-registered.");
  console.log("\nSeed data inserted successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 11. Demo Walkthrough

The prototype demonstrates a collaboration scenario across AstraZeneca's oncology R&D. Three Claude instances, each representing a different persona, use the MCP tools to advance a CDK4/6 inhibitor program.

### ACT 1 -- Dr. Sarah Chen (Oncology Data Scientist)

**Step 1**: Query her goals
```
Tool: get_goals_for_person({ person_name: "Dr. Sarah Chen" })
Expected: Returns 3 Goals + 3 Programs she owns
```

**Step 2**: List her skills
```
Tool: list_skills({ person_name: "Dr. Sarah Chen" })
Expected: Returns "Compound Efficacy Analysis" skill
```

**Step 3**: (Agent performs compound analysis work using the skill SKILL.md as guidance)

**Step 4**: Submit her output
```
Tool: submit_skill_output({
  skill_id: 1,
  person_name: "Dr. Sarah Chen",
  goal_name: "Screen candidate compound library",
  output_data: {
    candidates: [
      { compound_id: "AZD-4891", efficacy_score: 0.94, selectivity_cdk46: 47.2 },
      { compound_id: "AZD-5023", efficacy_score: 0.87, selectivity_cdk46: 38.1 },
      { compound_id: "AZD-3177", efficacy_score: 0.82, selectivity_cdk46: 41.5 }
    ],
    top_compound: "AZD-4891",
    total_screened: 2847,
    hit_rate: 0.032
  },
  output_summary: "Screened 2,847 compounds from CDK4/6 focused library. Top candidate AZD-4891 shows 94% efficacy with 47x CDK4/6 selectivity over CDK2."
})
```

**Step 5**: Request James's review
```
Tool: request_feedback({
  skill_output_id: 1,
  requested_by: "Dr. Sarah Chen",
  requested_from: "Dr. James Rivera",
  request_message: "Review lead candidates for biomarker validation suitability. Specifically interested in whether AZD-4891's target profile is amenable to predictive biomarker development."
})
```

**Step 6**: Update scorecard progress
```
Tool: add_progress_update({
  program_id: <screen_program_id>,
  update_text: "Completed screening of full compound library. Lead candidate AZD-4891 identified with 94% efficacy and 47x CDK4/6 selectivity. Ready for biomarker team handoff.",
  percent_complete: 100,
  rag_status: "Complete",
  author: "Dr. Sarah Chen",
  metrics: {
    compounds_screened: 2847,
    hits_identified: 91,
    top_candidate: "AZD-4891",
    efficacy_score: 0.94,
    selectivity_ratio: 47.2
  }
})
```

### ACT 2 -- Dr. James Rivera (Translational Scientist)

**Step 1**: Check pending reviews
```
Tool: get_pending_reviews({ person_name: "Dr. James Rivera" })
Expected: Returns Sarah's feedback request with her compound screening output
```

**Step 2**: Review and submit feedback
```
Tool: submit_feedback({
  feedback_request_id: 1,
  response_text: "AZD-4891 shows promising CDK4/6 selectivity (47x over CDK2). The high selectivity ratio suggests CCND1 amplification and RB1 status will be strong predictive biomarkers. Recommend proceeding with this compound for biomarker panel development. Will incorporate AZD-4891 target profile into biomarker identification workflow."
})
```

**Step 3**: (Agent performs biomarker identification work)

**Step 4**: Submit biomarker output
```
Tool: submit_skill_output({
  skill_id: 2,
  person_name: "Dr. James Rivera",
  goal_name: "Identify candidate biomarkers",
  output_data: {
    biomarker_panel: [
      { marker: "CCND1 amplification", type: "genomic", predictive_value: 0.89 },
      { marker: "RB1 wild-type status", type: "genomic", predictive_value: 0.91 },
      { marker: "p16 loss", type: "protein", predictive_value: 0.78 },
      { marker: "CDK4 expression level", type: "protein", predictive_value: 0.72 }
    ],
    recommended_patient_criteria: "CCND1-amplified, RB1-wt, with p16 loss",
    sample_size_analyzed: 342
  },
  output_summary: "Identified 4-marker biomarker panel. CCND1 amplification (89% predictive) and RB1 wild-type (91% predictive) are primary markers. Recommend patient selection: CCND1-amplified, RB1-wt with p16 loss."
})
```

**Step 5**: Request Priya's review
```
Tool: request_feedback({
  skill_output_id: 2,
  requested_by: "Dr. James Rivera",
  requested_from: "Dr. Priya Sharma",
  request_message: "Please review the biomarker panel and patient selection criteria for clinical trial feasibility. Key question: Is the CCND1-amplified/RB1-wt/p16-loss population large enough for recruitment?"
})
```

**Step 6**: Update scorecard
```
Tool: add_progress_update({
  program_id: <biomarker_program_id>,
  update_text: "Biomarker panel identified: CCND1 amplification and RB1 wild-type status as primary predictive markers. Panel validated against 342 archived samples.",
  percent_complete: 100,
  rag_status: "Complete",
  author: "Dr. James Rivera"
})
```

### ACT 3 -- Dr. Priya Sharma (Clinical Development Lead)

**Step 1**: Get upstream outputs
```
Tool: get_upstream_outputs({ goal_name: "Trial protocol design" })
Expected: Returns Sarah's compound data and James's biomarker criteria
```

**Step 2**: Check pending reviews
```
Tool: get_pending_reviews({ person_name: "Dr. Priya Sharma" })
Expected: Returns James's feedback request
```

**Step 3**: Submit feedback
```
Tool: submit_feedback({
  feedback_request_id: 2,
  response_text: "The CCND1-amplified/RB1-wt/p16-loss triple-positive population represents approximately 18-22% of HR+ breast cancer patients. This is a feasible recruitment target for a Phase I/II study. Recommend 15-20 sites across North America and Europe for adequate enrollment velocity. Protocol design will incorporate these criteria as mandatory inclusion markers."
})
```

**Step 4**: (Agent performs trial feasibility assessment)

**Step 5**: Submit feasibility output
```
Tool: submit_skill_output({
  skill_id: 3,
  person_name: "Dr. Priya Sharma",
  goal_name: "Trial protocol design",
  output_data: {
    feasibility_score: 0.82,
    protocol_type: "Phase I/II adaptive",
    estimated_enrollment: 120,
    enrollment_timeline_months: 14,
    recommended_sites: 18,
    regions: ["North America", "Western Europe"],
    primary_endpoint: "ORR by RECIST 1.1",
    secondary_endpoints: ["PFS", "DOR", "CBR", "Safety/tolerability"],
    inclusion_biomarkers: ["CCND1 amplification", "RB1 wild-type", "p16 loss"],
    compound: "AZD-4891"
  },
  output_summary: "Phase I/II adaptive design feasible. 82% feasibility score. Target 120 patients across 18 sites in NA/EU. 14-month enrollment projection. AZD-4891 in CCND1-amp/RB1-wt/p16-loss HR+ breast cancer. Primary endpoint: ORR by RECIST 1.1."
})
```

**Step 6**: Update scorecard
```
Tool: add_progress_update({
  program_id: <protocol_program_id>,
  update_text: "Phase I/II adaptive protocol drafted. Feasibility score 82%. AZD-4891 targeting CCND1-amplified/RB1-wt/p16-loss population. 18 sites, 120 patients, 14-month enrollment projected.",
  percent_complete: 100,
  rag_status: "Complete",
  author: "Dr. Priya Sharma"
})
```

### FINALE -- Check the Scorecard

```
Tool: get_scorecard()
Expected: Shows all 9 programs with updated RAG statuses:
  - Sarah's 3 programs: Screen (Complete), Efficacy (Active/Green), Selection (Active/Not Started)
  - James's 3 programs: Biomarkers (Complete), Retro (Active/Green), Criteria (Active/Not Started)
  - Priya's 3 programs: Protocol (Complete), Recruitment (Active/Green), Endpoints (Active/Not Started)
```

The scorecard shows the cascading progress: Sarah's compound work enabled James's biomarker validation, which enabled Priya's clinical feasibility assessment. The entire CDK4/6 program advances through cross-functional collaboration.

---

## 12. Implementation Checklist

Use this checklist to track build progress:

### Phase 1: Environment Setup

- [ ] Create `.env.example` with `DATABASE_URL` template
- [ ] Create `.env` with actual Neon credentials (gitignored)
- [ ] Verify `.env` is in `.gitignore`

### Phase 2: Database Migration

- [ ] Create `migrations/002-collaboration-tables.sql` with the collaboration schema
- [ ] Run the migration against Neon (`psql` or Neon console)
- [ ] Verify tables `skills`, `skill_outputs`, `feedback_requests` exist in Neon

### Phase 3: MCP Server Setup

- [ ] Create `scorecard-mcp/` directory structure
- [ ] Create `scorecard-mcp/package.json` and install dependencies (`npm install`)
- [ ] Create `scorecard-mcp/tsconfig.json`
- [ ] Create `scorecard-mcp/prisma/schema.prisma` with datasource config
- [ ] Run `prisma db pull` to introspect Neon database (includes collaboration tables)
- [ ] Run `prisma generate` to create Prisma client
- [ ] Implement `src/index.ts` (single MCP server entry point with stdio transport)

### Phase 4: Scorecard Tools

- [ ] Implement `src/tools/goals.ts` (get_org_tree, get_goal_tree, get_goals_for_person, get_goal_details, update_goal_status)
- [ ] Implement `src/tools/progress.ts` (add_progress_update, get_latest_progress)
- [ ] Implement `src/tools/alignment.ts` (get_alignments)
- [ ] Implement `src/tools/scorecard.ts` (get_scorecard, get_quarterly_objectives)

### Phase 5: Collaboration Tools

- [ ] Implement `src/tools/skills.ts` (register_skill, list_skills)
- [ ] Implement `src/tools/outputs.ts` (submit_skill_output, get_skill_outputs, get_upstream_outputs)
- [ ] Implement `src/tools/feedback.ts` (request_feedback, get_pending_reviews, submit_feedback)

### Phase 6: SKILL.md Files

- [ ] Create `skills/compound-analysis/SKILL.md`
- [ ] Create `skills/biomarker-validation/SKILL.md`
- [ ] Create `skills/trial-feasibility/SKILL.md`
- [ ] Create `skills/scorecard-overview/SKILL.md`

### Phase 7: Seed Data

- [ ] Create `seed.ts` at project root
- [ ] Run seed script: `cd scorecard-mcp && npx tsx ../seed.ts`
- [ ] Verify org units, goals, objectives, alignments, progress, and skills in database

### Phase 8: MCP Configuration

- [ ] Create `.claude/mcp.json` with single server config
- [ ] Test: Restart Claude Code and verify server connects
- [ ] Test: Call `get_org_tree()` to verify scorecard tools work
- [ ] Test: Call `list_skills()` to verify collaboration tools work
- [ ] Verify all 18 tools are registered

### Phase 9: Demo Validation

- [ ] Run through ACT 1 of the demo walkthrough (Sarah)
- [ ] Run through ACT 2 of the demo walkthrough (James)
- [ ] Run through ACT 3 of the demo walkthrough (Priya)
- [ ] Run finale scorecard check

---

## 13. Appendices

### Appendix A: Implementation Notes

- **Single MCP server** uses stdio transport. Claude Code launches it as a child process.
- **Prisma**: Run `prisma db pull` to introspect Neon, then `prisma generate` to create the client. Do NOT use `prisma db push` or `prisma migrate`.
- **Environment variable** `DATABASE_URL` must be set before starting the server.
- **TypeScript execution**: Use `tsx` for direct TypeScript execution (no build step needed).
- **Dependencies**: `@modelcontextprotocol/sdk`, `prisma`, `@prisma/client`, `tsx`, `typescript`, `zod`
- **No Docker** required. No local Postgres required. Everything connects to Neon.
- **No SQLite**. All data lives in the shared Neon Postgres instance.
- **JSONB columns**: The collaboration tables use JSONB for `input_spec`, `output_spec`, `output_data`, and `metadata`. Prisma handles JSONB natively -- no manual JSON.stringify/parse needed.

### Appendix B: Prisma Relation Name Caveats

When `prisma db pull` introspects the database, it generates relation names based on foreign key constraint names. The exact relation names in generated code may differ from the examples in this spec. Common adjustments:

- `skill_outputs.skills` might be named `skill_outputs_skill_idToskills` or similar
- `feedback_requests.skill_outputs` might be named differently
- `goal_alignments` relations will have long names like `goal_items_goal_alignments_parent_goal_idTogoal_items`

After running `prisma db pull`, check `prisma/schema.prisma` for the actual generated relation names and adjust the tool implementations accordingly.

### Appendix C: Troubleshooting

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` not found | Ensure `.env` file exists or variable is exported in shell |
| Prisma client not generated | Run `cd scorecard-mcp && npx prisma generate` |
| Missing collaboration tables | Run `migrations/002-collaboration-tables.sql` against Neon |
| BigInt serialization error | Use `serializeResult()` helper for raw query results |
| MCP server won't start | Check that `scorecard-mcp/node_modules` exists (`npm install`) |
| Tool not found in Claude Code | Restart Claude Code after updating `.claude/mcp.json` |
