# AZ Intelligence Flow

A scorecard database prototype for AI-native organizational coordination at AstraZeneca.

## What This Is

An organizational coordination system where AI agents collaborate through a shared scorecard database. Three personas (oncology data scientist, translational scientist, clinical development lead) demonstrate how skills chain across teams to advance a CDK4/6 inhibitor from compound screening to clinical trial feasibility. Agents interact with the scorecard via MCP (Model Context Protocol) servers. Skills are defined as markdown files that any MCP-compatible agent can execute.

## Architecture

```
SKILL.md files          MCP Server (TypeScript)          Neon PostgreSQL
(define persona       → (provides tools for agents    → (shared database: goals,
 capabilities)           to read/write the database)     progress, skills, outputs,
                                                         feedback)
```

| Component | What It Does |
|-----------|-------------|
| `skills/*.../SKILL.md` | Markdown files defining what each persona can do — inputs, outputs, workflow steps |
| `scorecard-mcp/` | TypeScript MCP server exposing tools for agents to interact with the database |
| Neon PostgreSQL | Shared cloud database storing all goals, progress, alignments, skills, outputs, and feedback |
| `.claude/mcp.json` | Configuration that auto-connects Claude Code to the MCP server |

Everyone connects to the same Neon instance. No local database setup required.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Access to the shared Neon database (get `DATABASE_URL` from the project owner)
- Claude Code (or any MCP-compatible agent)

## Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd az-intelligence-flow

# Install dependencies
cd scorecard-mcp && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env and paste the shared DATABASE_URL

# Generate Prisma client
cd scorecard-mcp && npx prisma db pull && npx prisma generate && cd ..
```

## Connect Your Agent

### Claude Code (automatic)

The `.claude/mcp.json` file is already configured in the repo. When you open the project in Claude Code, the MCP server auto-connects. No manual setup needed.

### Other MCP-compatible agents

Add this stdio server configuration to your agent's MCP config:

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

The server runs via `tsx` directly — no build step required.

## Available Skills

| Skill | File | Persona | What It Does |
|-------|------|---------|-------------|
| Compound Efficacy Analysis | `skills/compound-analysis/SKILL.md` | Dr. Sarah Chen | Screens compound libraries, identifies lead candidates |
| Biomarker Validation | `skills/biomarker-validation/SKILL.md` | Dr. James Rivera | Validates predictive biomarkers for patient selection |
| Trial Feasibility Assessment | `skills/trial-feasibility/SKILL.md` | Dr. Priya Sharma | Assesses Phase 2 trial viability |
| Scorecard Overview | `skills/scorecard-overview/SKILL.md` | Anyone | Queries the full project scorecard |

To use a skill, tell your agent: "Read the skill at `skills/compound-analysis/SKILL.md` and follow the workflow." The agent reads the instructions and calls the MCP tools.

## Available MCP Tools

### Scorecard Tools

| Tool | Description |
|------|-------------|
| `get_org_tree` | Get the organizational hierarchy tree |
| `get_goal_tree` | Get the goal hierarchy for an org unit |
| `get_goals_for_person` | Get all goals owned by a specific person |
| `get_goal_details` | Get detailed info about a goal including children, alignments, and progress |
| `update_goal_status` | Update the status of a goal |
| `add_progress_update` | Add a versioned progress update to a program |
| `get_scorecard` | Get the program scorecard with quarterly objectives and RAG status |
| `get_alignments` | Get the cross-org alignment map |
| `get_quarterly_objectives` | Get quarterly objectives for a program |
| `get_latest_progress` | Get the latest progress update for a program |

### Collaboration Tools

| Tool | Description |
|------|-------------|
| `register_skill` | Register a new skill for a person |
| `list_skills` | List all registered skills, optionally filtered by person |
| `submit_skill_output` | Submit the output of executing a skill, linked to a scorecard goal |
| `get_skill_outputs` | Query skill outputs by person or goal name |
| `request_feedback` | Request feedback from another person on a skill output |
| `get_pending_reviews` | Get all pending feedback requests for a person |
| `submit_feedback` | Submit a feedback response to a pending review |
| `get_upstream_outputs` | Get skill outputs from upstream goals in the dependency chain |

Full schemas and implementation details are in `mcp-collaboration-spec.md`.

## Database Schema

The database has two sets of tables:

**Scorecard tables** (defined in `schema.sql`):
- `org_units` — organizational hierarchy (Enterprise > BU > Function > Department > Individual)
- `goal_items` — goal hierarchy (Pillar > Category > Goal > Program)
- `goal_alignments` — cross-org goal alignment relationships
- `program_objectives` — quarterly objectives per program
- `progress_updates` — versioned progress entries with RAG status

**Collaboration tables** (defined in `migrations/002-collaboration-tables.sql`):
- `skills` — registered capabilities per person
- `skill_outputs` — logged outputs from skill execution, linked to goals
- `feedback_requests` — async feedback queue for cross-person review

### Setting up a new database (if needed)

```bash
# Run the base schema
psql $DATABASE_URL -f schema.sql

# Run the collaboration migration
psql $DATABASE_URL -f migrations/002-collaboration-tables.sql

# Seed the demo data
npx tsx seed.ts
```

For the shared prototype, the database is already deployed. You only need the `DATABASE_URL`.

## Demo Scenario

The prototype demonstrates a 3-act collaboration on a novel CDK4/6 inhibitor for advanced breast cancer:

1. **Act 1 — Compound Screening (Dr. Sarah Chen)**: Screens 2,847 compounds, identifies lead candidate AZD-4891, submits output to the scorecard, and requests James's review.

2. **Act 2 — Biomarker Validation (Dr. James Rivera)**: Reviews Sarah's compound candidates, validates predictive biomarkers for patient selection, submits output, and requests Priya's review.

3. **Act 3 — Trial Feasibility (Dr. Priya Sharma)**: Reviews upstream compound and biomarker data, runs a Phase 2 trial feasibility assessment, and updates the scorecard with final results.

Each agent reads its SKILL.md, calls MCP tools to interact with the shared database, and hands off to the next persona via feedback requests.

## Project Structure

```
az-intelligence-flow/
├── .claude/mcp.json              # MCP server configuration
├── .env.example                  # Environment template
├── schema.sql                    # Scorecard database schema
├── migrations/                   # Database migrations
│   └── 002-collaboration-tables.sql
├── skills/                       # SKILL.md definitions
│   ├── compound-analysis/
│   ├── biomarker-validation/
│   ├── trial-feasibility/
│   └── scorecard-overview/
├── scorecard-mcp/                # MCP server (TypeScript)
├── seed.ts                       # Demo data seeder
├── app-overview.md               # System overview document
└── mcp-collaboration-spec.md     # MCP server build specification
```

## Contributing

This is a prototype. To add a new persona or skill, create a new `SKILL.md` in the `skills/` directory following the existing pattern. Each skill file defines the persona, inputs, outputs, and step-by-step workflow that an MCP-compatible agent can follow.

## License

Internal prototype — AstraZeneca
