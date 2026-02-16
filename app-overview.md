# AZ Intelligence Flow

## What It Is

AZ Intelligence Flow is an organizational coordination system designed for AstraZeneca that demonstrates how a **single shared database** can serve as the backbone for AI-native enterprise collaboration. It connects organizational goals, individual skills, and AI agents into a unified coordination layer where everything feeds back in.

## The Problem It Solves

Large pharmaceutical organizations like AstraZeneca operate across dozens of teams, therapeutic areas, and functions. Today:

- **Goals live in silos** -- each team tracks objectives in their own tools (spreadsheets, Jira, SharePoint). No single source of truth connects R&D targets to clinical development milestones to commercial readiness.
- **Collaboration is manual** -- when an oncology data scientist discovers a promising compound, getting that insight to the translational scientist who validates biomarkers requires emails, meetings, and weeks of lag. The handoff is invisible to the organization.
- **Skills are invisible** -- the organization doesn't know what its people can do. A translational scientist's unique expertise in biomarker validation isn't captured anywhere that an AI system (or another team) could discover and leverage.
- **AI agents operate blind** -- without access to organizational context (goals, progress, dependencies), AI assistants can help individuals but can't coordinate across teams or optimize the collaboration itself.

## The Solution: One Database, One Truth

AZ Intelligence Flow puts **everything** in a single Neon PostgreSQL database -- scorecard data AND collaboration data. There is no separate layer. The database that tracks goals is the same database that tracks skills, outputs, and feedback requests. This is the coordination mechanism.

### Scorecard Data (Organizational Record)

- **Organizational hierarchy** -- from Enterprise down to Individual contributors
- **Goal hierarchy** -- from strategic Pillars down to executable Programs, each owned by specific org units
- **Cross-org alignment** -- how goals from different teams connect (primary, secondary, cross-cutting)
- **Quarterly objectives** -- what each program aims to achieve per quarter
- **Progress updates** -- versioned, RAG-status-tagged updates with metrics
- **Views** -- pre-built queries for scorecards, alignment maps, progress summaries

### Collaboration Data (Where Work Happens)

In the same database, alongside the scorecard tables:

- **Skills** -- each person's domain expertise is registered as a named, composable capability with defined inputs and outputs
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

## How It Works: The CDK4/6 Inhibitor Story

Three people at AstraZeneca are collaborating on evaluating a novel CDK4/6 inhibitor for advanced breast cancer:

### The People

| Person | Team | Skill | Role |
|--------|------|-------|------|
| **Dr. Sarah Chen** | Oncology Data Science (Oncology R&D) | Compound Efficacy Analysis | Screens compound libraries, identifies lead candidates |
| **Dr. James Rivera** | Translational Science (Oncology R&D) | Biomarker Identification & Validation | Validates predictive biomarkers for patient selection |
| **Dr. Priya Sharma** | Clinical Operations (Clinical Development) | Trial Feasibility Assessment | Assesses whether a Phase 2 trial is viable |

### The Collaboration Flow

All three agents coordinate through the **shared Neon database**. Sarah on Machine A, James on Machine B, Priya on Machine C -- they all connect to the same database instance.

```
Sarah's Agent                    James's Agent                   Priya's Agent
(Machine A)                      (Machine B)                     (Machine C)
     |                                |                               |
     +- Reads SKILL.md               |                               |
     +- Queries her goals            |                               |
     +- Screens 2,847 compounds      |                               |
     +- Identifies AZD-4891          |                               |
     +- Submits output to DB ------->|                               |
     +- Requests James's review      |                               |
     +- Updates scorecard (100%)     |                               |
     |                                +- Reads SKILL.md              |
     |                                +- Sees pending review in DB   |
     |                                +- Reviews Sarah's candidates  |
     |                                +- Submits feedback            |
     |                                +- Runs biomarker validation   |
     |                                +- Submits output to DB ------>|
     |                                +- Requests Priya's review     |
     |                                +- Updates scorecard           |
     |                                |                               +- Reads SKILL.md
     |                                |                               +- Gets upstream outputs from DB
     |                                |                               +- Reviews compound + biomarker data
     |                                |                               +- Runs feasibility assessment
     |                                |                               +- Submits output to DB
     |                                |                               +- Updates scorecard
```

**Key insight:** The agents never talk to each other directly. They coordinate through the shared database -- goals, progress, skill outputs, and feedback requests all live in the same Neon instance. The database IS the coordination mechanism.

### The Skill Chain

```
Compound Efficacy Analysis (Sarah)
    Output: Ranked candidates, efficacy scores, selectivity data
        |
        v feeds into
Biomarker Identification & Validation (James)
    Output: Validated biomarker panel, patient selection criteria
        |
        v feeds into
Trial Feasibility Assessment (Priya)
    Output: Feasibility report, protocol recommendations, recruitment projections
```

Each skill has defined **inputs** and **outputs**. When the outputs of one skill match the inputs of another, and their goals are aligned in the scorecard, the system knows the chain exists.

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
```

### Shared Collaboration

Everyone connects to the same Neon database. When Sarah submits output on Machine A, James sees it on Machine B. The database IS the coordination mechanism -- no message queues, no pub/sub, no separate collaboration server.

```
Machine A (Sarah)          Machine B (James)          Machine C (Priya)
     |                          |                          |
  Agent reads                Agent reads                Agent reads
  SKILL.md                   SKILL.md                   SKILL.md
     |                          |                          |
  MCP Server               MCP Server                 MCP Server
  (stdio)                  (stdio)                     (stdio)
     |                          |                          |
     +----------+---------------+--------------------------+
                |
                v
     +---------------------+
     |   NEON POSTGRES     |
     |   (single instance) |
     |                     |
     |  All scorecard and  |
     |  collaboration data |
     +---------------------+
```

Each machine runs its own MCP server process (stdio transport), but they all connect to the same Neon PostgreSQL instance. The MCP server is a thin layer -- it translates tool calls into Prisma queries against the shared database.

### Connection Patterns

The database supports multiple connection patterns for different teams:

- **MCP Server** -- Primary pattern for AI agents (R&D teams, Data & Digital)
- **REST API** -- For commercial teams and external applications (future)
- **Direct DB** -- For analytics and reporting (Operations, future)

### Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Database | PostgreSQL (Neon) -- single shared instance | Industry standard, hierarchical data support, powerful views, serverless scaling |
| ORM | Prisma | Type-safe queries, auto-generated from schema |
| Agent Interface | MCP Server (TypeScript + @modelcontextprotocol/sdk) | Standard protocol for connecting AI agents to tools |
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
- **Surface collaboration opportunities** -- "Sarah's compound analysis results could benefit the lung cancer program too"
- **Predict bottlenecks** -- "James's biomarker validation is on the critical path for 3 programs"
- **Suggest skill chains** -- "Combining these 4 skills in this sequence could address the new target"
- **Recommend goal modifications** -- "Based on Q1 results, the Q3 endpoint definition should account for..."

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
