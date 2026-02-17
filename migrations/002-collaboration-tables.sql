-- ══════════════════════════════════════════════════════════════════════
-- Vantage Biopharma Balanced Scorecard Database
-- Migration: 002 — Collaboration Tables (Skills, Outputs, Feedback)
-- Created: 2026-02-16
-- Depends on: schema.sql (v1.0)
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1. SKILLS REGISTRY
-- What each person or team can do, with typed input/output specs
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE skills (
    id              SERIAL PRIMARY KEY,
    person_name     TEXT NOT NULL,
    skill_name      TEXT NOT NULL,
    skill_type      TEXT NOT NULL CHECK (skill_type IN ('personal', 'team')),
    description     TEXT,
    input_spec      JSONB DEFAULT '{}',
    output_spec     JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(person_name, skill_name)
);

-- Indexes for skills
CREATE INDEX idx_skills_person_name ON skills(person_name);
CREATE INDEX idx_skills_skill_type ON skills(skill_type);
CREATE INDEX idx_skills_metadata ON skills USING GIN(metadata);


-- ══════════════════════════════════════════════════════════════════════
-- 2. SKILL OUTPUTS
-- Log of every skill execution, linked to a skill and a goal
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE skill_outputs (
    id              SERIAL PRIMARY KEY,
    skill_id        INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    person_name     TEXT NOT NULL,
    goal_name       TEXT NOT NULL,
    output_data     JSONB NOT NULL,
    output_summary  TEXT,
    status          TEXT NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('in_progress', 'completed', 'superseded')),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for skill_outputs
CREATE INDEX idx_skill_outputs_skill ON skill_outputs(skill_id);
CREATE INDEX idx_skill_outputs_person_name ON skill_outputs(person_name);
CREATE INDEX idx_skill_outputs_goal_name ON skill_outputs(goal_name);
CREATE INDEX idx_skill_outputs_status ON skill_outputs(status);
CREATE INDEX idx_skill_outputs_created ON skill_outputs(created_at DESC);


-- ══════════════════════════════════════════════════════════════════════
-- 3. FEEDBACK REQUESTS
-- Async feedback queue for cross-person review and collaboration
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE feedback_requests (
    id                  SERIAL PRIMARY KEY,
    skill_output_id     INT NOT NULL REFERENCES skill_outputs(id) ON DELETE CASCADE,
    requested_by        TEXT NOT NULL,
    requested_from      TEXT NOT NULL,
    request_message     TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'in_review', 'completed', 'cancelled')),
    response_text       TEXT,
    responded_at        TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback_requests
CREATE INDEX idx_feedback_requests_skill_output ON feedback_requests(skill_output_id);
CREATE INDEX idx_feedback_requests_from_status ON feedback_requests(requested_from, status);
CREATE INDEX idx_feedback_requests_requested_by ON feedback_requests(requested_by);
CREATE INDEX idx_feedback_requests_status ON feedback_requests(status);


-- ══════════════════════════════════════════════════════════════════════
-- 4. AUTO-UPDATE TRIGGER
-- Reuse the existing update_timestamp() function from schema.sql
-- ══════════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_skills_updated
    BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ══════════════════════════════════════════════════════════════════════
-- 5. HELPER VIEWS
-- Pre-built queries for collaboration access patterns
-- ══════════════════════════════════════════════════════════════════════

-- View: Pending feedback requests with full context
CREATE VIEW v_pending_feedback AS
SELECT
    fr.id AS feedback_request_id,
    fr.requested_by,
    fr.requested_from,
    fr.request_message,
    fr.status AS feedback_status,
    fr.created_at AS requested_at,
    so.id AS skill_output_id,
    so.person_name AS output_author,
    so.goal_name,
    so.output_summary,
    so.output_data,
    so.created_at AS output_created_at,
    s.skill_name,
    s.skill_type,
    s.description AS skill_description
FROM feedback_requests fr
JOIN skill_outputs so ON so.id = fr.skill_output_id
JOIN skills s ON s.id = so.skill_id
WHERE fr.status IN ('pending', 'in_review')
ORDER BY fr.created_at ASC;

-- View: Skill chain showing outputs linked to feedback responses
CREATE VIEW v_skill_chain AS
SELECT
    so.id AS skill_output_id,
    s.skill_name,
    s.skill_type,
    so.person_name AS output_author,
    so.goal_name,
    so.output_summary,
    so.status AS output_status,
    so.created_at AS output_created_at,
    fr.id AS feedback_request_id,
    fr.requested_from AS reviewer,
    fr.status AS feedback_status,
    fr.response_text AS feedback_response,
    fr.responded_at AS feedback_responded_at
FROM skill_outputs so
JOIN skills s ON s.id = so.skill_id
LEFT JOIN feedback_requests fr ON fr.skill_output_id = so.id
ORDER BY so.created_at ASC, fr.created_at ASC;
