# AZ Intelligence Flow

## What It Is

AZ Intelligence Flow is an organizational coordination system designed for Vantage Biopharma that demonstrates how a **single shared database** can serve as the backbone for AI-native enterprise collaboration. It connects organizational goals, individual skills, and AI agents into a unified coordination layer where everything feeds back in.

## The Problem It Solves

Large pharmaceutical organizations like Vantage Biopharma operate across dozens of teams, therapeutic areas, and functions. Today:

- **Goals live in silos** -- each team tracks objectives in their own tools (spreadsheets, Jira, SharePoint). No single source of truth connects R&D targets to clinical development milestones to commercial readiness.
- **Collaboration is manual** -- when a field MSL captures a critical KOL insight, getting that insight to the commercial strategy team requires emails, meetings, and weeks of lag. The handoff is invisible to the organization.
- **Skills are invisible** -- the organization doesn't know what its people can do. An MSL's unique expertise in KOL engagement isn't captured anywhere that an AI system (or another team) could discover and leverage.
- **AI agents operate blind** -- without access to organizational context (goals, progress, dependencies), AI assistants can help individuals but can't coordinate across teams or optimize the collaboration itself.

## The Solution: One Database, One Truth

AZ Intelligence Flow puts **everything** in a single Neon PostgreSQL database -- scorecard data AND collaboration data. There is no separate layer. The database that tracks goals is the same database that tracks skills, outputs, and feedback requests. This is the coordination mechanism.

### Scorecard Data (Organizational Record)

- **Organizational hierarchy** -- from Enterprise down to Individual contributors (18 org units)
- **Goal hierarchy** -- from strategic Pillars down to executable Programs (21 goal items across 3 Pillars, 5 Categories, 7 Goals, 4 Programs, 2 standalone goals)
- **Cross-org alignment** -- how goals from different teams connect (primary, secondary, cross-cutting)
- **Quarterly objectives** -- what each program aims to achieve per quarter
- **Progress updates** -- versioned, RAG-status-tagged updates with metrics
- **Views** -- pre-built queries for scorecards, alignment maps, progress summaries

### Collaboration Data (Where Work Happens)

In the same database, alongside the scorecard tables:

- **Skills** -- each person's domain expertise is registered as a named, composable capability with defined inputs and outputs (6 skills across 6 personas)
- **Skill outputs** -- when an agent runs a skill, the output is captured with a link to which scorecard goal it advances
- **Feedback requests** -- after one person's agent produces output, it can request feedback from another person's agent. The database manages these handoffs.

No separate system. No ephemeral store. One database holds everything.

## Skills as Markdown (SKILL.md Pattern)

Each persona's skill is defined as a **markdown file** that any agent can read and execute. The pattern follows the Claude Agent Skills structure but is deliberately agent-agnostic -- any MCP-compatible agent (Claude, GPT, or otherwise) can pick up a SKILL.md and know exactly what to do.

### SKILL.md Structure

Each skill file contains:

- **YAML frontmatter** -- name, description, version, author
- **Role** -- what persona this skill belongs to and what they do
- **Workflow steps** -- numbered, step-by-step instructions the agent follows
- **MCP tools table** -- which MCP tools to call at each step (skills reference MCP tools, not direct database calls)
- **Example output** -- what the finished product looks like

### Why Markdown

Skills are plain text. They live in a `skills/` directory. Any agent that can read a file and call MCP tools can execute a skill. There is no SDK, no plugin system, no proprietary format. The skill tells the agent: here is your role, here are the steps, here are the tools. Go.

This means the same skill definition works whether the agent is Claude Code running locally, a Claude API call from a server, or a future agent platform that speaks MCP.

## How It Works: The Vantage Biopharma Story

Six people at Vantage Biopharma (fictional large pharma) collaborate across two skill chains that span Medical Affairs, Commercial, Clinical Development, and Patient Safety:

### The People

| Person | Team | Skill | Role |
|--------|------|-------|------|
| **Dr. Elena Vasquez** | Field Medical (Medical Affairs) | MSL Insight Reporter | Captures and structures KOL interaction insights |
| **Marcus Chen** | Medical Operations (Medical Affairs) | Med Affairs Aggregator | Aggregates field insights into regional trend reports |
| **Sarah Okonkwo** | Launch Strategy (Commercial) | Commercial Strategist | Translates medical insights into commercial launch strategies |
| **Dr. James Park** | Site Operations (Clinical Development) | CRA Site Monitor | Monitors clinical sites and flags adverse event signals |
| **Dr. Amara Osei** | Patient Safety (Clinical Development) | Patient Safety Evaluator | Evaluates AE signals and produces safety assessments |
| **Dr. Richard Stein** | Clinical Leadership (Clinical Development) | Medical Director Reviewer | Reviews safety escalations and issues medical directives |

### The Collaboration Flow

All six agents coordinate through the **shared Neon database**. Each persona on a different machine -- they all connect to the same database instance.

**Chain A -- KOL Insights** (field insight to commercial strategy):
```
Elena's Agent                    Marcus's Agent                  Sarah's Agent
(Machine A)                      (Machine B)                     (Machine C)
     |                                |                               |
     +- Reads SKILL.md               |                               |
     +- Queries her goals            |                               |
     +- Captures KOL insight         |                               |
     +- Submits output to DB ------->|                               |
     +- Requests Marcus's review     |                               |
     +- Updates scorecard            |                               |
     |                                +- Reads SKILL.md              |
     |                                +- Sees pending review in DB   |
     |                                +- Reviews Elena's insight     |
     |                                +- Submits feedback            |
     |                                +- Aggregates regional trends  |
     |                                +- Submits output to DB ------>|
     |                                +- Requests Sarah's review     |
     |                                +- Updates scorecard           |
     |                                |                               +- Reads SKILL.md
     |                                |                               +- Gets upstream outputs from DB
     |                                |                               +- Reviews insight + trend data
     |                                |                               +- Produces launch strategy
     |                                |                               +- Submits output to DB
     |                                |                               +- Updates scorecard
```

**Chain B -- AE Escalation** (safety signal to medical directive):
```
James's Agent                    Amara's Agent                   Richard's Agent
(Machine D)                      (Machine E)                     (Machine F)
     |                                |                               |
     +- Reads SKILL.md               |                               |
     +- Monitors site data           |                               |
     +- Flags AE signal              |                               |
     +- Submits output to DB ------->|                               |
     +- Requests Amara's review      |                               |
     +- Updates scorecard            |                               |
     |                                +- Reads SKILL.md              |
     |                                +- Evaluates AE signal         |
     |                                +- Produces safety assessment  |
     |                                +- Submits output to DB ------>|
     |                                +- Requests Richard's review   |
     |                                +- Updates scorecard           |
     |                                |                               +- Reads SKILL.md
     |                                |                               +- Reviews escalation
     |                                |                               +- Issues medical directive
     |                                |                               +- Submits output to DB
     |                                |                               +- Updates scorecard
```

**Key insight:** The agents never talk to each other directly. They coordinate through the shared database -- goals, progress, skill outputs, and feedback requests all live in the same Neon instance. The database IS the coordination mechanism.

### The Skill Chains

**Chain A -- KOL Insights:**
```
MSL Insight Reporter (Elena)
    Output: Structured KOL insight, engagement summary
        |
        v feeds into
Med Affairs Aggregator (Marcus)
    Output: Regional trend report, aggregated insights
        |
        v feeds into
Commercial Strategist (Sarah)
    Output: Launch positioning strategy, market recommendations
```

**Chain B -- AE Escalation:**
```
CRA Site Monitor (James)
    Output: AE signal report, site compliance data
        |
        v feeds into
Patient Safety Evaluator (Amara)
    Output: Safety assessment, risk classification
        |
        v feeds into
Medical Director Reviewer (Richard)
    Output: Medical directive, regulatory recommendation
```

Each skill has defined **inputs** and **outputs**. When the outputs of one skill match the inputs of another, and their goals are aligned in the scorecard, the system knows the chain exists.

## Two-Page Architecture

The demo has two web pages that visualize the coordination layer:

### CEO Goal View (`goals.html`)
- Three-column pillar layout showing all 3 strategic pillars side by side
- Goals cascade from Pillars > Categories > Goals > Programs
- Role-based filtering lets users view goals by persona or department
- Landing page for the demo

### Program Dashboard (`demo.html`)
- 6-panel dark-themed dashboard for program-level detail
- Panels: Org Tree, Goal Cascade, Scorecard, Skills Registry (3x2 grid), Skill Chain (Chain A/B toggle), Activity Timeline
- Powered by the Scorecard API (`scorecard-api/`)

## Technical Architecture

```
+---------------------------------------------------------------------+
|                   ANY AGENT (Claude, GPT, etc.)                      |
|                                                                      |
|  Reads SKILL.md --> knows what to do --> calls MCP tools             |
+-----------------------------------+---------------------------------+
                                    |
                             MCP Server (stdio)
                                    |
                                    v
+---------------------------------------------------------------------+
|                   NEON POSTGRES (shared by all)                      |
|                                                                      |
|  Scorecard tables: org_units, goal_items, goal_alignments,          |
|    program_objectives, progress_updates                              |
|  Collaboration tables: skills, skill_outputs, feedback_requests     |
|                                                                      |
|  Everyone connects here. This IS the coordination layer.            |
+---------------------------------------------------------------------+
                                    ^
                                    |
                          Scorecard API (Express.js)
                                    |
                                    v
+---------------------------------------------------------------------+
|                   DASHBOARD UI (goals.html + demo.html)             |
|                                                                      |
|  goals.html: CEO Goal View (3-pillar layout, role filtering)        |
|  demo.html:  Program Dashboard (6-panel command center)             |
+---------------------------------------------------------------------+
```

### Shared Collaboration

Everyone connects to the same Neon database. When Elena submits an insight on Machine A, Marcus sees it on Machine B. The database IS the coordination mechanism -- no message queues, no pub/sub, no separate collaboration server.

### Connection Patterns

The database supports multiple connection patterns for different teams:

- **MCP Server** -- Primary pattern for AI agents (R&D teams, Data & Digital)
- **REST API** -- For the dashboard UI and external applications
- **Direct DB** -- For analytics and reporting (Operations, future)

### Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Database | PostgreSQL (Neon) -- single shared instance | Industry standard, hierarchical data support, powerful views, serverless scaling |
| ORM | Prisma | Type-safe queries, auto-generated from schema |
| Agent Interface | MCP Server (TypeScript + @modelcontextprotocol/sdk) | Standard protocol for connecting AI agents to tools |
| Dashboard API | Express.js + Prisma | Simple REST API for the dashboard UI |
| Skill Definitions | Markdown SKILL.md files (agent-agnostic) | Plain text, any MCP-compatible agent can read and execute |
| Agent Runtime | Any MCP-compatible agent (Claude Code, Claude API, etc.) | Not locked to one platform |

## The Vision: Where This Goes

The prototype demonstrates the core loop. The full vision extends to:

### Knowledge Graph Layer
As goals, progress, dependencies, and outcomes accumulate, the scorecard becomes a **living knowledge graph**. A graph database (Neo4j or similar) can be layered on top of PostgreSQL to enable:
- Traversal queries ("what goals depend on this person's work?")
- Pattern recognition ("which skill combinations produce the fastest outcomes?")
- Recommendation engine ("based on progress patterns, this goal is at risk")

### AI-Optimized Coordination
With enough data in the scorecard, AI can:
- **Surface collaboration opportunities** -- "Elena's KOL insight on VBP-142 could benefit the patient safety team too"
- **Predict bottlenecks** -- "Marcus's aggregation work is on the critical path for 3 programs"
- **Suggest skill chains** -- "Combining these 4 skills in this sequence could address the new target"
- **Recommend goal modifications** -- "Based on Q1 results, the Q3 launch timeline should account for..."

### Enterprise Applications
Products built on top of the coordination layer:
- **Human Skills Database** -- A talent marketplace where every person's skills are discoverable
- **Agent Operations** -- Operational backbone for deploying AI agents that understand organizational context
- **Composable Products** -- Context-aware products that plug into the scorecard for any team or function

## Key Design Principles

1. **One database, one truth** -- All scorecard data AND collaboration data (skills, outputs, feedback) live in the same Neon PostgreSQL instance. No separate ephemeral store. No second database. One place to look, one place to query, one place to secure.

2. **Skills are composable** -- By defining inputs and outputs, skills from different people and teams can chain together without those people needing to know each other.

3. **Skills are portable** -- SKILL.md files are plain markdown. Any MCP-compatible agent can read them and execute the workflow. No vendor lock-in, no proprietary plugin format.

4. **Everything feeds back in** -- Every skill execution, every feedback response, every agent interaction produces a progress update that flows back into the scorecard. The system gets smarter over time.

5. **Hierarchical alignment, not flat tracking** -- Goals cascade from Enterprise strategy to Individual programs. Cross-org alignment maps show how work in one team advances goals in another.

6. **The database is the coordination mechanism** -- Agents don't need direct communication channels. The shared database's goal hierarchy, dependency chain, and collaboration tables route information naturally.

---

*AZ Intelligence Flow -- The Coordination Layer for AI-Native Organizations*
