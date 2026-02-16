# Balanced Scorecard Database — Setup & Seed Prompt

Paste everything below the line into a new Claude Code conversation.

---

## Prompt Start

I need you to set up and populate my AstraZeneca Balanced Scorecard PostgreSQL database on Neon.

### Connection

Read the Neon connection string from the `.env` file at:

```
/Users/mikepica/Personal_Projects/az-intelligence-flow/.env
```

Use the `DATABASE_URL` value from that file to connect via `psql`.

### Step 1: Create the Schema

Run the schema file against the database:

```bash
psql "$DATABASE_URL" -f /Users/mikepica/Personal_Projects/az-intelligence-flow/schema.sql
```

If the tables already exist, that's fine — skip this step.

### Step 2: Insert Seed Data

After the schema is confirmed, run the following SQL to populate the database with seed data. Use `psql` to execute it.

**IMPORTANT:** Run this as a single transaction. If any insert fails, roll back everything.

```sql
BEGIN;

-- ══════════════════════════════════════════════════════════════════════
-- ORGANIZATIONAL HIERARCHY
-- Enterprise → Business Unit → Function → Dept → Sub-Dept → Individual
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO org_units (id, parent_id, org_level, name, description, owner, status) VALUES
(1, NULL, 'Enterprise',      'AstraZeneca',           'Global biopharmaceutical company',                        'Owner A',  'Active'),
(2, 1,    'Business Unit',   'Oncology',              'Oncology business unit — largest AZ growth driver',       'Owner B',  'Active'),
(3, 2,    'Function',        'Research & Development', 'Oncology R&D — discovery through registration',          'Owner C',  'Active'),
(4, 3,    'Department',      'Clinical Development',  'Planning and execution of clinical trials',               'Owner D',  'Active'),
(5, 4,    'Sub-Department',  'Early Phase Trials',    'Phase I and first-in-human studies',                      'Owner E',  'Active'),
(6, 5,    'Individual',      'Person F',              'Senior Clinical Scientist — early phase oncology trials', 'Owner F',  'Active');

-- Reset the sequence to avoid ID conflicts on future inserts
SELECT setval('org_units_id_seq', (SELECT MAX(id) FROM org_units));


-- ══════════════════════════════════════════════════════════════════════
-- GOAL HIERARCHIES
-- Each org level gets: 1 Pillar → 1 Category → 1 Goal → 1 Program
-- Different pillar per level to reflect distinct strategic focus
-- ══════════════════════════════════════════════════════════════════════

-- ── Enterprise: AstraZeneca ─────────────────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(1,  NULL, 1, 'Pillar',   'Pipeline Innovation',              'Drive industry-leading pipeline depth and diversity across all therapeutic areas',  'Owner A',            1.00),
(2,  1,    1, 'Category', 'Drug Portfolio Expansion',          'Expand portfolio through new molecular entities and lifecycle management',          'EVP Strategy',       1.00),
(3,  2,    1, 'Goal',     'Achieve 15 Phase III starts by end of 2026', 'Transition 15 compounds into Phase III registrational studies',            'EVP R&D',            1.00),
(4,  3,    1, 'Program',  'Next-Gen Molecule Advancement Initiative',   'Cross-BU program tracking all Phase II-to-III transitions',                'VP Pipeline Ops',    1.00);

-- ── Business Unit: Oncology ─────────────────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(5,  NULL, 2, 'Pillar',   'Oncology Market Leadership',       'Maintain and grow #1 position in oncology globally',                               'Owner B',            1.00),
(6,  5,    2, 'Category', 'Tumor Portfolio Diversification',   'Expand approved indications across solid and hematologic tumors',                  'VP Oncology Strategy', 1.00),
(7,  6,    2, 'Goal',     'Launch 3 new tumor-type indications in 2026', 'Regulatory submissions and approvals for 3 new indications',              'VP Regulatory',      1.00),
(8,  7,    2, 'Program',  'Solid Tumor Expansion Study',       'Multi-arm basket trial for AZD-series compounds in 3 new solid tumor types',      'Sr Dir Clinical',    1.00);

-- ── Function: Research & Development ────────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(9,  NULL, 3, 'Pillar',   'R&D Productivity',                 'Maximize output per R&D dollar through process and science innovation',            'Owner C',            1.00),
(10, 9,    3, 'Category', 'Discovery-to-Clinic Efficiency',    'Reduce time and cost from target identification to IND filing',                    'VP Discovery',       1.00),
(11, 10,   3, 'Goal',     'Reduce IND filing timeline by 20%', 'Compress average IND timeline from 18 to 14.4 months',                            'Dir Regulatory Ops', 1.00),
(12, 11,   3, 'Program',  'Accelerated IND Pathway Redesign',  'Re-engineer IND preparation workflow with parallel workstreams',                   'Program Lead IND',   1.00);

-- ── Department: Clinical Development ────────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(13, NULL, 4, 'Pillar',   'Clinical Trial Excellence',         'Execute high-quality trials that deliver reliable data on time',                   'Owner D',            1.00),
(14, 13,   4, 'Category', 'Trial Execution Quality',           'Ensure protocol compliance, data integrity, and patient safety',                   'Sr Dir Quality',     1.00),
(15, 14,   4, 'Goal',     'Achieve 95% protocol compliance across active trials', 'Monitor and enforce protocol adherence in all active studies',  'Dir Compliance',     1.00),
(16, 15,   4, 'Program',  'Protocol Compliance Monitoring System', 'Implement real-time compliance dashboards for all active protocols',           'Program Mgr',        1.00);

-- ── Sub-Department: Early Phase Trials ──────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(17, NULL, 5, 'Pillar',   'Phase I Acceleration',              'Get first-in-human data faster to inform go/no-go decisions',                     'Owner E',            1.00),
(18, 17,   5, 'Category', 'First-in-Human Trial Speed',        'Reduce cycle time from CTA approval to first patient dosed',                      'Assoc Dir Trials',   1.00),
(19, 18,   5, 'Goal',     'Reduce first-patient-in timeline to under 90 days', 'From CTA approval to first patient dosed in < 90 days',          'Clinical Ops Lead',  1.00),
(20, 19,   5, 'Program',  'Rapid Site Activation Framework',   'Pre-qualify and fast-track site activation for Phase I studies',                   'Site Ops Lead',      1.00);

-- ── Individual: Person F ────────────────────────────────────────────
INSERT INTO goal_items (id, parent_id, org_unit_id, goal_level, name, description, owner, weight) VALUES
(21, NULL, 6, 'Pillar',   'Scientific Contribution',           'Deliver meaningful clinical science output and professional growth',               'Owner F',            1.00),
(22, 21,   6, 'Category', 'Clinical Research Output',          'Lead and complete early-phase clinical studies',                                   'Owner F',            1.00),
(23, 22,   6, 'Goal',     'Lead 2 first-in-human studies to completion', 'Complete dosing and primary endpoint readout for 2 FIH studies',         'Owner F',            1.00),
(24, 23,   6, 'Program',  'AZD-9574 Phase I Dose Escalation Study', 'Single-agent dose escalation in advanced solid tumors — FIH study',          'Owner F',            1.00);

-- Reset the sequence
SELECT setval('goal_items_id_seq', (SELECT MAX(id) FROM goal_items));


-- ══════════════════════════════════════════════════════════════════════
-- GOAL ALIGNMENTS
-- Chain from Individual → Sub-Dept → Dept → Function → BU → Enterprise
-- Primary alignments at the Goal level (most meaningful rollup point)
-- Secondary alignment: Individual Program → Enterprise Goal (direct line of sight)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes) VALUES
-- Goal-level chain (primary): Individual → Sub-Dept → Dept → Function → BU → Enterprise
(23, 19, 'primary',   1.00, 'Individual FIH studies contribute to Sub-Dept first-patient-in speed'),
(19, 15, 'primary',   0.80, 'Fast site activation supports protocol compliance through streamlined processes'),
(15, 11, 'primary',   0.70, 'Clinical compliance rigor contributes to IND timeline reduction'),
(11, 7,  'primary',   0.75, 'Faster IND filings enable new indication launches'),
(7,  3,  'primary',   0.90, 'New oncology indications are a subset of enterprise Phase III starts'),

-- Direct line-of-sight: Individual Program → Enterprise Goal (secondary)
(24, 3,  'secondary', 0.50, 'Individual Phase I study is one step in the enterprise pipeline funnel'),

-- Cross-cutting: Sub-Dept Program → BU Goal (secondary)
(20, 7,  'secondary', 0.60, 'Rapid site activation indirectly supports new indication launches');


-- ══════════════════════════════════════════════════════════════════════
-- PROGRAM OBJECTIVES (Quarterly — 2026)
-- For Individual's AZD-9574 Program (id=24)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit) VALUES
(24, 'Q1', 2026, 'Complete dose escalation cohorts 1-3, establish preliminary safety profile',    3.00, 'cohorts'),
(24, 'Q2', 2026, 'Initiate expansion cohort, begin PK/PD analysis from escalation phase',        1.00, 'cohorts'),
(24, 'Q3', 2026, 'Enroll 80% of expansion cohort target, interim safety data review',           80.00, 'percent'),
(24, 'Q4', 2026, 'Complete enrollment, preliminary efficacy signal assessment, prepare Phase II decision memo', 100.00, 'percent');

-- Also add quarterly objectives for the Enterprise Program (id=4)
INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit) VALUES
(4, 'Q1', 2026, 'Identify and prioritize 18 Phase II candidates for potential Phase III transition', 18.00, 'candidates'),
(4, 'Q2', 2026, 'Complete go/no-go reviews for top 15 candidates',                                  15.00, 'reviews'),
(4, 'Q3', 2026, 'Initiate Phase III protocols for first 8 compounds',                                8.00, 'protocols'),
(4, 'Q4', 2026, 'Achieve 15 total Phase III starts, close out remaining transitions',               15.00, 'starts');


-- ══════════════════════════════════════════════════════════════════════
-- PROGRESS UPDATES (Versioned)
-- Initial progress updates for the Individual's program
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author) VALUES
(24, 1,
 'AZD-9574 Phase I initiated. Cohort 1 dosing underway at 2 sites. First patient dosed on Jan 15, 2026. No DLTs observed at starting dose. Site 3 activation pending — regulatory delay in Germany. On track for Q1 cohort targets despite site delay.',
 8.00,
 'Green',
 '{"sites_active": 2, "sites_planned": 3, "patients_dosed": 4, "patients_target": 12, "dlts_observed": 0, "cohorts_complete": 0, "cohorts_target": 3}'::jsonb,
 'Owner F'
),
(24, 2,
 'Cohort 1 complete — 4 patients dosed, no DLTs. Cohort 2 dosing initiated at escalated dose. Germany site now activated (3/3 sites active). Enrollment pace ahead of schedule. PK samples collected for all Cohort 1 patients.',
 22.00,
 'Green',
 '{"sites_active": 3, "sites_planned": 3, "patients_dosed": 7, "patients_target": 12, "dlts_observed": 0, "cohorts_complete": 1, "cohorts_target": 3}'::jsonb,
 'Owner F'
);

-- Progress update for Enterprise program
INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author) VALUES
(4, 1,
 'Pipeline review initiated across all BUs. 22 compounds identified in late Phase II. Initial prioritization framework applied — 18 candidates shortlisted for deep-dive review. Oncology contributing 8 candidates, BioPharmaceuticals 6, Rare Disease 4.',
 12.00,
 'Green',
 '{"candidates_identified": 22, "candidates_shortlisted": 18, "phase3_started": 0, "phase3_target": 15, "bus_contributing": 3}'::jsonb,
 'VP Pipeline Ops'
);


COMMIT;
```

### Step 3: Verify

After the inserts, run these verification queries to confirm the data loaded correctly:

```sql
-- 1. Verify org hierarchy (should show 6 rows, one per level)
SELECT id, parent_id, org_level, name FROM org_units ORDER BY id;

-- 2. Verify goal items (should show 24 rows — 4 per org level x 6 levels)
SELECT gi.id, gi.goal_level, gi.name, ou.name AS org_unit
FROM goal_items gi JOIN org_units ou ON ou.id = gi.org_unit_id
ORDER BY gi.org_unit_id, gi.id;

-- 3. Verify alignment chain (should show 7 alignment records)
SELECT
    child_gi.name AS child_goal,
    child_ou.org_level AS child_org_level,
    ga.alignment_type,
    ga.alignment_strength,
    parent_gi.name AS parent_goal,
    parent_ou.org_level AS parent_org_level
FROM goal_alignments ga
JOIN goal_items child_gi ON child_gi.id = ga.child_goal_id
JOIN org_units child_ou ON child_ou.id = child_gi.org_unit_id
JOIN goal_items parent_gi ON parent_gi.id = ga.parent_goal_id
JOIN org_units parent_ou ON parent_ou.id = parent_gi.org_unit_id
ORDER BY child_ou.org_level DESC;

-- 4. Verify quarterly objectives (should show 8 rows)
SELECT po.quarter, po.year, po.objective_text, gi.name AS program
FROM program_objectives po
JOIN goal_items gi ON gi.id = po.program_id
ORDER BY gi.id, po.year, po.quarter;

-- 5. Verify progress updates (should show 3 rows)
SELECT pu.program_id, gi.name, pu.version, pu.percent_complete, pu.rag_status, pu.created_at
FROM progress_updates pu
JOIN goal_items gi ON gi.id = pu.program_id
ORDER BY pu.program_id, pu.version;

-- 6. Test the org hierarchy view
SELECT repeat('  ', depth) || name AS tree, org_level FROM v_org_hierarchy;

-- 7. Test the scorecard view
SELECT * FROM v_program_scorecard;
```

Report back the results of each verification query so I can confirm everything loaded correctly.
