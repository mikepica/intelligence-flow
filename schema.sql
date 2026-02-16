-- ══════════════════════════════════════════════════════════════════════
-- AstraZeneca Balanced Scorecard Database
-- PostgreSQL Schema v1.0
-- Created: 2026-02-16
-- ══════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════════
-- 1. ORGANIZATIONAL HIERARCHY
-- Self-referencing table: Enterprise → BU → Function → Dept → Sub-Dept → Individual
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE org_level_enum AS ENUM (
    'Enterprise',
    'Business Unit',
    'Function',
    'Department',
    'Sub-Department',
    'Individual'
);

CREATE TYPE status_enum AS ENUM (
    'Active',
    'Inactive',
    'Archived'
);

CREATE TABLE org_units (
    id              SERIAL PRIMARY KEY,
    parent_id       INT REFERENCES org_units(id) ON DELETE SET NULL,
    org_level       org_level_enum NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    owner           TEXT,
    status          status_enum NOT NULL DEFAULT 'Active',
    priority        INT DEFAULT 0,
    start_date      DATE,
    end_date        DATE,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for org_units
CREATE INDEX idx_org_units_parent ON org_units(parent_id);
CREATE INDEX idx_org_units_level ON org_units(org_level);
CREATE INDEX idx_org_units_status ON org_units(status);
CREATE INDEX idx_org_units_tags ON org_units USING GIN(tags);
CREATE INDEX idx_org_units_metadata ON org_units USING GIN(metadata);


-- ══════════════════════════════════════════════════════════════════════
-- 2. GOAL HIERARCHY
-- Self-referencing: Pillar → Category → Goal → Program
-- Each goal_item belongs to one org_unit
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE goal_level_enum AS ENUM (
    'Pillar',
    'Category',
    'Goal',
    'Program'
);

CREATE TABLE goal_items (
    id              SERIAL PRIMARY KEY,
    parent_id       INT REFERENCES goal_items(id) ON DELETE SET NULL,
    org_unit_id     INT NOT NULL REFERENCES org_units(id) ON DELETE CASCADE,
    goal_level      goal_level_enum NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    owner           TEXT,
    status          status_enum NOT NULL DEFAULT 'Active',
    weight          DECIMAL(5,2) DEFAULT 1.00,
    priority        INT DEFAULT 0,
    start_date      DATE,
    end_date        DATE,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for goal_items
CREATE INDEX idx_goal_items_parent ON goal_items(parent_id);
CREATE INDEX idx_goal_items_org_unit ON goal_items(org_unit_id);
CREATE INDEX idx_goal_items_level ON goal_items(goal_level);
CREATE INDEX idx_goal_items_status ON goal_items(status);
CREATE INDEX idx_goal_items_tags ON goal_items USING GIN(tags);
CREATE INDEX idx_goal_items_metadata ON goal_items USING GIN(metadata);
CREATE INDEX idx_goal_items_org_level ON goal_items(org_unit_id, goal_level);


-- ══════════════════════════════════════════════════════════════════════
-- 3. GOAL ALIGNMENTS
-- Flexible mapping between goal items across org levels
-- Supports many-to-many: one program can align to multiple higher goals
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE alignment_type_enum AS ENUM (
    'primary',
    'secondary',
    'cross-cutting'
);

CREATE TABLE goal_alignments (
    id                  SERIAL PRIMARY KEY,
    child_goal_id       INT NOT NULL REFERENCES goal_items(id) ON DELETE CASCADE,
    parent_goal_id      INT NOT NULL REFERENCES goal_items(id) ON DELETE CASCADE,
    alignment_type      alignment_type_enum NOT NULL DEFAULT 'primary',
    alignment_strength  DECIMAL(3,2) DEFAULT 1.00,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(child_goal_id, parent_goal_id)
);

-- Indexes for goal_alignments
CREATE INDEX idx_alignments_child ON goal_alignments(child_goal_id);
CREATE INDEX idx_alignments_parent ON goal_alignments(parent_goal_id);
CREATE INDEX idx_alignments_type ON goal_alignments(alignment_type);


-- ══════════════════════════════════════════════════════════════════════
-- 4. PROGRAM OBJECTIVES (Quarterly)
-- Row-per-quarter design: scales to any year
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE quarter_enum AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

CREATE TABLE program_objectives (
    id              SERIAL PRIMARY KEY,
    program_id      INT NOT NULL REFERENCES goal_items(id) ON DELETE CASCADE,
    quarter         quarter_enum NOT NULL,
    year            INT NOT NULL DEFAULT 2026,
    objective_text  TEXT NOT NULL,
    target_value    DECIMAL(12,2),
    target_unit     TEXT,
    status          status_enum NOT NULL DEFAULT 'Active',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(program_id, quarter, year)
);

-- Indexes for program_objectives
CREATE INDEX idx_objectives_program ON program_objectives(program_id);
CREATE INDEX idx_objectives_quarter_year ON program_objectives(year, quarter);


-- ══════════════════════════════════════════════════════════════════════
-- 5. PROGRESS UPDATES (Versioned)
-- Multiple versions per program, each timestamped
-- RAG status auto-populated by external skill/workflow
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE rag_status_enum AS ENUM ('Red', 'Amber', 'Green', 'Not Started', 'Complete');

CREATE TABLE progress_updates (
    id                  SERIAL PRIMARY KEY,
    program_id          INT NOT NULL REFERENCES goal_items(id) ON DELETE CASCADE,
    version             INT NOT NULL,
    update_text         TEXT NOT NULL,
    percent_complete    DECIMAL(5,2) CHECK (percent_complete >= 0 AND percent_complete <= 100),
    rag_status          rag_status_enum,
    metrics             JSONB DEFAULT '{}',
    author              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(program_id, version)
);

-- Indexes for progress_updates
CREATE INDEX idx_progress_program ON progress_updates(program_id);
CREATE INDEX idx_progress_created ON progress_updates(created_at DESC);
CREATE INDEX idx_progress_rag ON progress_updates(rag_status);
CREATE INDEX idx_progress_metrics ON progress_updates USING GIN(metrics);


-- ══════════════════════════════════════════════════════════════════════
-- 6. HELPER VIEWS
-- Pre-built queries for common access patterns
-- ══════════════════════════════════════════════════════════════════════

-- View: Latest progress update per program
CREATE VIEW v_latest_progress AS
SELECT DISTINCT ON (program_id)
    pu.program_id,
    gi.name AS program_name,
    ou.name AS org_unit_name,
    ou.org_level,
    pu.version,
    pu.update_text,
    pu.percent_complete,
    pu.rag_status,
    pu.metrics,
    pu.author,
    pu.created_at AS last_updated
FROM progress_updates pu
JOIN goal_items gi ON gi.id = pu.program_id
JOIN org_units ou ON ou.id = gi.org_unit_id
ORDER BY program_id, version DESC;

-- View: Full org hierarchy path (for reporting)
CREATE VIEW v_org_hierarchy AS
WITH RECURSIVE org_tree AS (
    SELECT id, name, org_level, parent_id,
           name::TEXT AS full_path,
           0 AS depth
    FROM org_units
    WHERE parent_id IS NULL
    UNION ALL
    SELECT ou.id, ou.name, ou.org_level, ou.parent_id,
           ot.full_path || ' > ' || ou.name,
           ot.depth + 1
    FROM org_units ou
    JOIN org_tree ot ON ou.parent_id = ot.id
)
SELECT * FROM org_tree;

-- View: Programs with their quarterly objectives (pivoted)
CREATE VIEW v_program_scorecard AS
SELECT
    gi.id AS program_id,
    gi.name AS program_name,
    ou.name AS org_unit,
    ou.org_level,
    MAX(CASE WHEN po.quarter = 'Q1' THEN po.objective_text END) AS q1_objective,
    MAX(CASE WHEN po.quarter = 'Q2' THEN po.objective_text END) AS q2_objective,
    MAX(CASE WHEN po.quarter = 'Q3' THEN po.objective_text END) AS q3_objective,
    MAX(CASE WHEN po.quarter = 'Q4' THEN po.objective_text END) AS q4_objective,
    lp.percent_complete,
    lp.rag_status,
    lp.last_updated
FROM goal_items gi
JOIN org_units ou ON ou.id = gi.org_unit_id
LEFT JOIN program_objectives po ON po.program_id = gi.id AND po.year = 2026
LEFT JOIN v_latest_progress lp ON lp.program_id = gi.id
WHERE gi.goal_level = 'Program'
GROUP BY gi.id, gi.name, ou.name, ou.org_level,
         lp.percent_complete, lp.rag_status, lp.last_updated;

-- View: Cross-org alignment map (who aligns to what)
CREATE VIEW v_alignment_map AS
SELECT
    child_gi.name AS child_goal,
    child_gi.goal_level AS child_level,
    child_ou.name AS child_org_unit,
    child_ou.org_level AS child_org_level,
    ga.alignment_type,
    ga.alignment_strength,
    parent_gi.name AS parent_goal,
    parent_gi.goal_level AS parent_level,
    parent_ou.name AS parent_org_unit,
    parent_ou.org_level AS parent_org_level
FROM goal_alignments ga
JOIN goal_items child_gi ON child_gi.id = ga.child_goal_id
JOIN org_units child_ou ON child_ou.id = child_gi.org_unit_id
JOIN goal_items parent_gi ON parent_gi.id = ga.parent_goal_id
JOIN org_units parent_ou ON parent_ou.id = parent_gi.org_unit_id;


-- ══════════════════════════════════════════════════════════════════════
-- 7. AUTO-UPDATE TRIGGER
-- Keeps updated_at current on modifications
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_units_updated
    BEFORE UPDATE ON org_units
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_goal_items_updated
    BEFORE UPDATE ON goal_items
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_program_objectives_updated
    BEFORE UPDATE ON program_objectives
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
