# AZ Intelligence Flow

A scorecard database prototype for AI-native organizational coordination at Vantage Biopharma.

## What This Is

An organizational coordination system where AI agents collaborate through a shared scorecard database. The demo uses **Vantage Biopharma**, a fictional large pharma company with 18 org units, 21 goals across 3 strategic pillars, 4 programs, and 6 skilled personas. Two skill chains demonstrate how insights flow across teams: **Chain A** (KOL Insights: Elena > Marcus > Sarah) and **Chain B** (AE Escalation: James > Amara > Richard). Agents interact with the scorecard via MCP (Model Context Protocol) servers. Skills are defined as markdown files that any MCP-compatible agent can execute.

## Architecture

```
SKILL.md files          MCP Server (TypeScript)          Neon PostgreSQL
(define persona       > (provides tools for agents    > (shared database: goals,
 capabilities)           to read/write the database)     progress, skills, outputs,
                                                         feedback)
```

| Component | What It Does |
|-----------|-------------|
| `skills/*.../SKILL.md` | Markdown files defining what each persona can do -- inputs, outputs, workflow steps |
| `scorecard-mcp/` | TypeScript MCP server exposing tools for agents to interact with the database |
| `scorecard-api/` | Express.js REST API powering the dashboard UI (goals.html + demo.html) |
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
cd scorecard-api && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env and paste the shared DATABASE_URL

# Seed the database (if starting fresh)
psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql

# Generate Prisma client
cd scorecard-mcp && npx prisma db pull && npx prisma generate && cd ..

# Start the API server (for the dashboard)
cd scorecard-api && npm run dev
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

The server runs via `tsx` directly -- no build step required.

## Available Skills

| Skill | File | Persona | What It Does |
|-------|------|---------|-------------|
| MSL Insight Reporter | `skills/msl-insight-reporter/SKILL.md` | Dr. Elena Vasquez | Captures and structures KOL interaction insights |
| Med Affairs Aggregator | `skills/med-affairs-aggregator/SKILL.md` | Marcus Chen | Aggregates field insights into regional trend reports |
| Commercial Strategist | `skills/commercial-strategist/SKILL.md` | Sarah Okonkwo | Translates medical insights into commercial launch strategies |
| CRA Site Monitor | `skills/cra-site-monitor/SKILL.md` | Dr. James Park | Monitors clinical sites and flags adverse event signals |
| Patient Safety Evaluator | `skills/patient-safety-evaluator/SKILL.md` | Dr. Amara Osei | Evaluates AE signals and produces safety assessments |
| Medical Director Reviewer | `skills/medical-director-reviewer/SKILL.md` | Dr. Richard Stein | Reviews safety escalations and issues medical directives |
| Scorecard Overview | `skills/scorecard-overview/SKILL.md` | Anyone | Queries the full project scorecard |

To use a skill, tell your agent: "Read the skill at `skills/msl-insight-reporter/SKILL.md` and follow the workflow." The agent reads the instructions and calls the MCP tools.

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
- `org_units` -- organizational hierarchy (Enterprise > Business Unit > Function > Department > Individual)
- `goal_items` -- goal hierarchy (Pillar > Category > Goal > Program)
- `goal_alignments` -- cross-org goal alignment relationships
- `program_objectives` -- quarterly objectives per program
- `progress_updates` -- versioned progress entries with RAG status

**Collaboration tables** (defined in `migrations/002-collaboration-tables.sql`):
- `skills` -- registered capabilities per person
- `skill_outputs` -- logged outputs from skill execution, linked to goals
- `feedback_requests` -- async feedback queue for cross-person review

### Setting up a new database (if needed)

```bash
# Run the base schema
psql $DATABASE_URL -f schema.sql

# Run the collaboration migration
psql $DATABASE_URL -f migrations/002-collaboration-tables.sql

# Seed the Vantage Biopharma demo data
psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql
```

For the shared prototype, the database is already deployed. You only need the `DATABASE_URL`.

## Demo Scenario

The prototype demonstrates a **Vantage Biopharma** coordination scenario with two skill chains across Medical Affairs, Commercial, Clinical Development, and Patient Safety:

**Chain A -- KOL Insights** (field insight to commercial strategy):
1. **Dr. Elena Vasquez** (MSL Insight Reporter): Captures KOL interaction insights from the field
2. **Marcus Chen** (Med Affairs Aggregator): Aggregates field insights into regional trend reports
3. **Sarah Okonkwo** (Commercial Strategist): Translates insights into commercial launch positioning

**Chain B -- AE Escalation** (safety signal to medical directive):
1. **Dr. James Park** (CRA Site Monitor): Monitors clinical sites and flags adverse event signals
2. **Dr. Amara Osei** (Patient Safety Evaluator): Evaluates AE signals and produces safety assessments
3. **Dr. Richard Stein** (Medical Director Reviewer): Reviews safety escalations and issues medical directives

Each agent reads its SKILL.md, calls MCP tools to interact with the shared database, and hands off to the next persona via feedback requests.

## Pages

| Page | URL | Description |
|------|-----|-------------|
| CEO Goal View | `goals.html` | Three-column pillar layout with role-based filtering -- the landing page |
| Program Dashboard | `demo.html` | 6-panel dark-themed dashboard showing org tree, goal cascade, scorecard, skills, skill chain, timeline |

## Project Structure

```
az-intelligence-flow/
+-- .claude/mcp.json              # MCP server configuration
+-- .env.example                  # Environment template
+-- schema.sql                    # Scorecard database schema
+-- migrations/                   # Database migrations
|   +-- 002-collaboration-tables.sql
+-- seeds/
|   +-- vantage-biopharma-seed.sql  # Vantage Biopharma demo data
+-- skills/                       # SKILL.md definitions (6 skills)
|   +-- msl-insight-reporter/
|   +-- med-affairs-aggregator/
|   +-- commercial-strategist/
|   +-- cra-site-monitor/
|   +-- patient-safety-evaluator/
|   +-- medical-director-reviewer/
|   +-- scorecard-overview/
+-- scorecard-mcp/                # MCP server (TypeScript)
+-- scorecard-api/                # REST API server (Express.js + Prisma)
+-- goals.html + goals.js         # CEO Goal View page
+-- demo.html + demo.js           # Program Dashboard page
+-- app-overview.md               # System overview document
+-- mcp-collaboration-spec.md     # MCP server build specification
+-- DESIGN_SPEC.md                # Dashboard design specification
+-- DASHBOARD_SPEC.md             # Dashboard data specification
+-- CLAUDE.md                     # Project instructions
+-- README.md                     # This file
```

## Contributing

This is a prototype. To add a new persona or skill, create a new `SKILL.md` in the `skills/` directory following the existing pattern. Each skill file defines the persona, inputs, outputs, and step-by-step workflow that an MCP-compatible agent can follow.

## License

Internal prototype -- Vantage Biopharma
