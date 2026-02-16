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
