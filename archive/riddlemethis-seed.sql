-- ══════════════════════════════════════════════════════════════════════
-- Riddlemethis Seed Data
-- Seeds the full hierarchy: org_units → goal_items → alignments →
-- program_objectives → progress_updates → skills
--
-- Run: psql $DATABASE_URL -f seeds/riddlemethis-seed.sql
-- ══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    -- Org unit IDs
    v_enterprise_id   INT;
    v_department_id   INT;
    v_riddler_id      INT;
    v_sphinx_id       INT;

    -- Goal item IDs
    v_pillar_id       INT;
    v_category_id     INT;
    v_goal_id         INT;
    v_program_id      INT;

    -- Skill IDs
    v_skill_maker_id  INT;
    v_skill_deeper_id INT;
BEGIN

-- ── 1. ORG UNITS ──────────────────────────────────────────────────
-- Enterprise → Department → 2 Individuals

INSERT INTO org_units (org_level, name, description, owner, status, tags)
VALUES ('Enterprise', 'Riddle Enterprises', 'Creative intelligence organization for riddle generation and deepening', 'Mike Pica', 'Active', ARRAY['riddle', 'demo'])
RETURNING id INTO v_enterprise_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_enterprise_id, 'Department', 'Riddle Workshop', 'Collaborative riddle creation and layering department', 'Mike Pica', 'Active', ARRAY['riddle', 'demo'])
RETURNING id INTO v_department_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_department_id, 'Individual', 'The Riddler', 'Creates basic riddles from prompts', 'The Riddler', 'Active', ARRAY['riddle', 'maker'])
RETURNING id INTO v_riddler_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_department_id, 'Individual', 'The Sphinx', 'Deepens riddles into three-layer enigmas', 'The Sphinx', 'Active', ARRAY['riddle', 'deepener'])
RETURNING id INTO v_sphinx_id;


-- ── 2. GOAL ITEMS ─────────────────────────────────────────────────
-- Pillar → Category → Goal → Program

INSERT INTO goal_items (org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_enterprise_id, 'Pillar', 'Creative Intelligence', 'Drive creative output through structured riddle generation and collaboration', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-12-31', ARRAY['riddle', 'creativity'])
RETURNING id INTO v_pillar_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_id, v_department_id, 'Category', 'Riddle Mastery', 'Build expertise in riddle construction, layering, and collaborative deepening', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['riddle', 'mastery'])
RETURNING id INTO v_category_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_category_id, v_department_id, 'Goal', 'Generate 10 quality riddles by end of Q1 2026', 'Produce 10 riddles using the maker→deepener pipeline, each with 3-layer depth', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-03-31', ARRAY['riddle', 'q1-target'])
RETURNING id INTO v_goal_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_goal_id, v_department_id, 'Program', 'Riddlemethis', 'Executable program: The Riddler creates basic riddles, The Sphinx deepens them into 3-layer enigmas. Target: 10 completed riddle pairs by end of Q1 2026.', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-03-31', ARRAY['riddle', 'riddlemethis'])
RETURNING id INTO v_program_id;


-- ── 3. GOAL ALIGNMENTS ────────────────────────────────────────────
-- Program → Goal → Category → Pillar

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_program_id, v_goal_id, 'primary', 1.00, 'Riddlemethis program directly advances the Q1 riddle generation goal');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_id, v_category_id, 'primary', 1.00, 'Q1 riddle goal builds toward Riddle Mastery category');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_category_id, v_pillar_id, 'primary', 0.80, 'Riddle Mastery contributes to Creative Intelligence pillar');


-- ── 4. PROGRAM OBJECTIVES (Quarterly) ─────────────────────────────

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_program_id, 'Q1', 2026, 'Generate 10 riddles using the riddle-maker and riddle-deepener skill pipeline', 10.00, 'riddles', 'Active');

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_program_id, 'Q2', 2026, 'Refine riddle quality based on Q1 learnings and expand to new topics', 15.00, 'riddles', 'Active');


-- ── 5. PROGRESS UPDATES ───────────────────────────────────────────

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author)
VALUES (v_program_id, 1,
    'Program initiated. Riddle Maker and Riddle Deepener skills registered. Pipeline established: The Riddler creates basic riddles, The Sphinx deepens them to 3 layers. Ready to begin generating riddles. 0 of 10 target riddles completed.',
    0.00, 'Not Started',
    '{"riddles_created": 0, "riddles_deepened": 0, "target": 10, "pipeline_status": "ready"}',
    'Mike Pica');


-- ── 6. SKILLS REGISTRY ────────────────────────────────────────────

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'The Riddler',
    'Riddle Maker',
    'personal',
    'Takes a prompt or topic and creates a semi-basic riddle with answer and difficulty rating',
    '{"type": "object", "properties": {"topic": {"type": "string", "description": "The subject or prompt to create a riddle about"}}, "required": ["topic"]}',
    '{"type": "object", "properties": {"topic": {"type": "string"}, "riddle": {"type": "string"}, "answer": {"type": "string"}, "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]}}, "required": ["topic", "riddle", "answer", "difficulty"]}',
    '{"skill_file": "skills/riddle-maker/SKILL.md", "chain_next": "The Sphinx"}'
)
RETURNING id INTO v_skill_maker_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'The Sphinx',
    'Riddle Deepener',
    'personal',
    'Takes a basic riddle and transforms it into a three-layer deep riddle with nested clues and hints',
    '{"type": "object", "properties": {"original_riddle": {"type": "string"}, "original_answer": {"type": "string"}, "topic": {"type": "string"}}, "required": ["original_riddle", "original_answer"]}',
    '{"type": "object", "properties": {"original_riddle": {"type": "string"}, "original_answer": {"type": "string"}, "layers": {"type": "array", "items": {"type": "object", "properties": {"level": {"type": "integer"}, "name": {"type": "string"}, "riddle": {"type": "string"}, "hint": {"type": "string"}}}}, "final_answer": {"type": "string"}, "difficulty": {"type": "string"}}, "required": ["layers", "final_answer"]}',
    '{"skill_file": "skills/riddle-deepener/SKILL.md", "chain_prev": "The Riddler"}'
)
RETURNING id INTO v_skill_deeper_id;


-- ── Summary ───────────────────────────────────────────────────────
RAISE NOTICE '══════════════════════════════════════════════════════';
RAISE NOTICE 'Riddlemethis seed data inserted successfully!';
RAISE NOTICE '──────────────────────────────────────────────────────';
RAISE NOTICE 'Org Units:    Enterprise(%), Dept(%), Riddler(%), Sphinx(%)', v_enterprise_id, v_department_id, v_riddler_id, v_sphinx_id;
RAISE NOTICE 'Goal Items:   Pillar(%), Category(%), Goal(%), Program(%)', v_pillar_id, v_category_id, v_goal_id, v_program_id;
RAISE NOTICE 'Skills:       Maker(%), Deepener(%)', v_skill_maker_id, v_skill_deeper_id;
RAISE NOTICE 'Objectives:   Q1 + Q2 2026';
RAISE NOTICE 'Progress:     V1 - Not Started (0%%)';
RAISE NOTICE '══════════════════════════════════════════════════════';

END $$;
