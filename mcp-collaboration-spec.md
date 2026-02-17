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
Claude Code Instance (Persona: Dr. Elena Vasquez -- Chain A)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Neon PostgreSQL
                       (scorecard-mcp/)           (all tables)

Claude Code Instance (Persona: Dr. James Park -- Chain B)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Same Neon PostgreSQL

Claude Code Instance (Persona: Marcus Chen -- Chain A)
    |
    |--- stdio ---> [Scorecard MCP Server]  ---> Same Neon PostgreSQL
```

All Claude instances share the same Neon database. Each instance launches its own MCP server process via stdio, but all processes connect to the same Neon Postgres via `DATABASE_URL`.

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
├── skills/                               # Agent-agnostic SKILL.md definitions (6 skills)
│   ├── msl-insight-reporter/
│   │   └── SKILL.md                      # Dr. Elena Vasquez's skill (Chain A)
│   ├── med-affairs-aggregator/
│   │   └── SKILL.md                      # Marcus Chen's skill (Chain A)
│   ├── commercial-strategist/
│   │   └── SKILL.md                      # Sarah Okonkwo's skill (Chain A)
│   ├── cra-site-monitor/
│   │   └── SKILL.md                      # Dr. James Park's skill (Chain B)
│   ├── patient-safety-evaluator/
│   │   └── SKILL.md                      # Dr. Amara Osei's skill (Chain B)
│   ├── medical-director-reviewer/
│   │   └── SKILL.md                      # Dr. Richard Stein's skill (Chain B)
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
├── seeds/
│   └── vantage-biopharma-seed.sql        # Vantage Biopharma demo seed data
├── scorecard-api/                        # REST API server (Express.js + Prisma)
├── goals.html + goals.js                 # CEO Goal View page
├── demo.html + demo.js                   # Program Dashboard page
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
  person_name: z.string().describe("The person's name (e.g., 'Dr. Elena Vasquez')"),
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

The Vantage Biopharma demo has 6 skills organized into two chains. Skill files live in `skills/<skill-name>/SKILL.md`. Each follows the same YAML frontmatter + workflow pattern described in Section 8.

### 9.1 MSL Insight Reporter (Dr. Elena Vasquez) -- Chain A, Step 1

File: `skills/msl-insight-reporter/SKILL.md`

Persona: Dr. Elena Vasquez, Senior MSL in Field Medical (Medical Affairs). Captures and structures KOL interaction insights from the field, submits them to the scorecard, and requests Marcus Chen's review.

**Chain position:** First in Chain A (KOL Insights). Outputs feed into Med Affairs Aggregator.

### 9.2 Med Affairs Aggregator (Marcus Chen) -- Chain A, Step 2

File: `skills/med-affairs-aggregator/SKILL.md`

Persona: Marcus Chen, Medical Operations Manager (Medical Affairs). Reviews Elena's field insights, aggregates them into regional trend reports, and requests Sarah Okonkwo's review.

**Chain position:** Second in Chain A. Receives Elena's insights, outputs feed into Commercial Strategist.

### 9.3 Commercial Strategist (Sarah Okonkwo) -- Chain A, Step 3

File: `skills/commercial-strategist/SKILL.md`

Persona: Sarah Okonkwo, Launch Strategy Director (Commercial). Translates aggregated medical insights into commercial launch positioning strategies.

**Chain position:** Third in Chain A. Receives Marcus's trend reports, produces final launch strategy output.

### 9.4 CRA Site Monitor (Dr. James Park) -- Chain B, Step 1

File: `skills/cra-site-monitor/SKILL.md`

Persona: Dr. James Park, Senior CRA in Site Operations (Clinical Development). Monitors clinical sites, flags adverse event signals, and requests Dr. Amara Osei's review.

**Chain position:** First in Chain B (AE Escalation). Outputs feed into Patient Safety Evaluator.

### 9.5 Patient Safety Evaluator (Dr. Amara Osei) -- Chain B, Step 2

File: `skills/patient-safety-evaluator/SKILL.md`

Persona: Dr. Amara Osei, Patient Safety Director (Clinical Development). Evaluates AE signals from site monitoring, produces safety assessments, and requests Dr. Richard Stein's review.

**Chain position:** Second in Chain B. Receives James's AE reports, outputs feed into Medical Director Reviewer.

### 9.6 Medical Director Reviewer (Dr. Richard Stein) -- Chain B, Step 3

File: `skills/medical-director-reviewer/SKILL.md`

Persona: Dr. Richard Stein, VP Clinical Development (Clinical Leadership). Reviews safety escalations and issues medical directives with regulatory recommendations.

**Chain position:** Third in Chain B. Receives Amara's safety assessments, produces final medical directive output.

### 9.7 Scorecard Overview (Anyone)

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

The seed data is provided as a SQL file (`seeds/vantage-biopharma-seed.sql`) that populates the Neon PostgreSQL database with the full Vantage Biopharma hierarchy:

1. Org hierarchy (18 org units: Vantage Biopharma > BUs > Functions > Departments > Individuals)
2. Goal hierarchy (21 goal items: 3 Pillars, 5 Categories, 7 Goals, 4 Programs, 2 standalone goals)
3. Goal alignments (cross-team dependencies)
4. Quarterly objectives (2026 Q1-Q4)
5. Initial progress updates for programs
6. Pre-registered skills for all 6 personas

**Run:** `psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql`

### 10.2 The 6 Personas

**Dr. Elena Vasquez** -- Senior MSL, Field Medical (Medical Affairs)
- Skill: "MSL Insight Reporter" (personal)
- Input: KOL interaction data, therapeutic area context
- Output: Structured insight report, engagement summary

**Marcus Chen** -- Medical Operations Manager (Medical Affairs)
- Skill: "Med Affairs Aggregator" (personal)
- Input: Field insights, regional data
- Output: Regional trend report, aggregated insights

**Sarah Okonkwo** -- Launch Strategy Director (Commercial)
- Skill: "Commercial Strategist" (personal)
- Input: Medical insights, market data
- Output: Launch positioning strategy, market recommendations

**Dr. James Park** -- Senior CRA, Site Operations (Clinical Development)
- Skill: "CRA Site Monitor" (personal)
- Input: Site data, clinical trial metrics
- Output: AE signal report, site compliance data

**Dr. Amara Osei** -- Patient Safety Director (Clinical Development)
- Skill: "Patient Safety Evaluator" (personal)
- Input: AE signals, safety data
- Output: Safety assessment, risk classification

**Dr. Richard Stein** -- VP Clinical Development (Clinical Leadership)
- Skill: "Medical Director Reviewer" (personal)
- Input: Safety assessments, escalation reports
- Output: Medical directive, regulatory recommendation

### 10.3 Data Summary

The full seed data is defined in `seeds/vantage-biopharma-seed.sql`. Key counts:

- **18 org units** across 6 levels (Enterprise, Business Unit, Function, Department, Individual)
- **21 goal items** across 4 levels (Pillar, Category, Goal, Program)
- **4 Programs**: AE-SENTINEL, VBP-142 Phase II Readiness, KOL-INSIGHTS, LAUNCH-READY
- **6 skills** mapped to 6 personas across 2 chains
- **3 Pillars**: Advance Pipeline, Improve Patient Outcomes, Develop Our People

#### Pre-Registered Skills

| Person | Skill Name | Type | Description |
|--------|-----------|------|-------------|
| Dr. Elena Vasquez | MSL Insight Reporter | personal | Captures and structures KOL interaction insights from the field |
| Marcus Chen | Med Affairs Aggregator | personal | Aggregates field insights into regional trend reports |
| Sarah Okonkwo | Commercial Strategist | personal | Translates medical insights into commercial launch strategies |
| Dr. James Park | CRA Site Monitor | personal | Monitors clinical sites and flags adverse event signals |
| Dr. Amara Osei | Patient Safety Evaluator | personal | Evaluates AE signals and produces safety assessments |
| Dr. Richard Stein | Medical Director Reviewer | personal | Reviews safety escalations and issues medical directives |

### 10.4 Seed Script

The seed data is now a SQL file rather than a TypeScript seed script. See `seeds/vantage-biopharma-seed.sql` for the complete implementation.

Run: `psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql`

---

## 11. Demo Walkthrough

The prototype demonstrates two collaboration chains across Vantage Biopharma. Each chain has 3 personas using MCP tools to advance their respective programs.

### Chain A -- KOL Insights (Field insight to commercial strategy)

**ACT 1 -- Dr. Elena Vasquez** (MSL Insight Reporter, Field Medical)
1. Queries her goals via `get_goals_for_person`
2. Reads her SKILL.md and captures a KOL interaction insight
3. Submits output via `submit_skill_output` (insight report linked to KOL-INSIGHTS program)
4. Requests Marcus's review via `request_feedback`
5. Updates scorecard via `add_progress_update`

**ACT 2 -- Marcus Chen** (Med Affairs Aggregator, Medical Operations)
1. Checks pending reviews via `get_pending_reviews` (sees Elena's insight)
2. Submits feedback on Elena's work via `submit_feedback`
3. Aggregates insights into regional trend report
4. Submits output via `submit_skill_output`
5. Requests Sarah's review via `request_feedback`
6. Updates scorecard

**ACT 3 -- Sarah Okonkwo** (Commercial Strategist, Launch Strategy)
1. Gets upstream outputs via `get_upstream_outputs` (sees Elena's insight + Marcus's trends)
2. Reviews Marcus's feedback request
3. Produces launch positioning strategy
4. Submits output and updates scorecard

### Chain B -- AE Escalation (Safety signal to medical directive)

**ACT 4 -- Dr. James Park** (CRA Site Monitor, Site Operations)
1. Queries his goals and monitors site data
2. Flags an adverse event signal from a clinical site
3. Submits AE report via `submit_skill_output` (linked to AE-SENTINEL program)
4. Requests Amara's review via `request_feedback`
5. Updates scorecard

**ACT 5 -- Dr. Amara Osei** (Patient Safety Evaluator)
1. Checks pending reviews (sees James's AE report)
2. Evaluates the AE signal and produces safety assessment
3. Submits output and requests Richard's review
4. Updates scorecard

**ACT 6 -- Dr. Richard Stein** (Medical Director Reviewer)
1. Gets upstream outputs (sees James's AE data + Amara's assessment)
2. Reviews the safety escalation
3. Issues medical directive with regulatory recommendation
4. Submits output and updates scorecard

### FINALE -- Check the Scorecard

```
Tool: get_scorecard()
Expected: Shows all 4 programs with updated RAG statuses:
  - AE-SENTINEL: progress updates from James > Amara > Richard chain
  - VBP-142 Phase II Readiness: independent program progress
  - KOL-INSIGHTS: progress updates from Elena > Marcus > Sarah chain
  - LAUNCH-READY: downstream of KOL-INSIGHTS insights
```

The scorecard shows cascading progress across both chains. The database captures every handoff, feedback loop, and skill output as the work flows through the organization.

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

- [ ] Create `skills/msl-insight-reporter/SKILL.md` (Dr. Elena Vasquez, Chain A)
- [ ] Create `skills/med-affairs-aggregator/SKILL.md` (Marcus Chen, Chain A)
- [ ] Create `skills/commercial-strategist/SKILL.md` (Sarah Okonkwo, Chain A)
- [ ] Create `skills/cra-site-monitor/SKILL.md` (Dr. James Park, Chain B)
- [ ] Create `skills/patient-safety-evaluator/SKILL.md` (Dr. Amara Osei, Chain B)
- [ ] Create `skills/medical-director-reviewer/SKILL.md` (Dr. Richard Stein, Chain B)
- [ ] Create `skills/scorecard-overview/SKILL.md`

### Phase 7: Seed Data

- [ ] Run seed: `psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql`
- [ ] Verify 18 org units, 21 goals, objectives, alignments, progress, and 6 skills in database

### Phase 8: MCP Configuration

- [ ] Create `.claude/mcp.json` with single server config
- [ ] Test: Restart Claude Code and verify server connects
- [ ] Test: Call `get_org_tree()` to verify scorecard tools work
- [ ] Test: Call `list_skills()` to verify collaboration tools work
- [ ] Verify all 18 tools are registered

### Phase 9: Demo Validation

- [ ] Run through Chain A: Elena > Marcus > Sarah (KOL Insights)
- [ ] Run through Chain B: James > Amara > Richard (AE Escalation)
- [ ] Run finale scorecard check (all 4 programs)

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
