-- ══════════════════════════════════════════════════════════════════════
-- Vantage Biopharma Seed Data
-- Seeds the full hierarchy: org_units → goal_items → alignments →
-- program_objectives → progress_updates → skills
--
-- Run: psql $DATABASE_URL -f seeds/vantage-biopharma-seed.sql
-- ══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    -- Org unit IDs (18 total)
    v_enterprise_id           INT;
    v_oncology_bu_id          INT;
    v_rnd_bu_id               INT;
    v_med_affairs_fn_id       INT;
    v_commercial_fn_id        INT;
    v_clinical_dev_fn_id      INT;
    v_field_medical_dept_id   INT;
    v_med_ops_dept_id         INT;
    v_launch_strategy_dept_id INT;
    v_site_ops_dept_id        INT;
    v_patient_safety_dept_id  INT;
    v_clinical_lead_dept_id   INT;
    v_vasquez_id              INT;
    v_chen_id                 INT;
    v_okonkwo_id              INT;
    v_park_id                 INT;
    v_osei_id                 INT;
    v_stein_id                INT;

    -- Goal item IDs (21 total)
    v_pillar_pipeline_id      INT;
    v_pillar_outcomes_id      INT;
    v_pillar_people_id        INT;
    v_cat_clinical_exc_id     INT;
    v_cat_pipeline_prog_id    INT;
    v_cat_rwe_id              INT;
    v_cat_patient_access_id   INT;
    v_cat_talent_dev_id       INT;
    v_cat_cross_fn_id         INT;
    v_goal_patient_safety_id  INT;
    v_goal_site_compliance_id INT;
    v_goal_vbp142_phase2_id   INT;
    v_goal_kol_insights_id    INT;
    v_goal_launch_pos_id      INT;
    v_goal_payer_engage_id    INT;
    v_goal_competency_id      INT;
    v_goal_handoff_id         INT;
    v_prog_ae_sentinel_id     INT;
    v_prog_vbp142_id          INT;
    v_prog_kol_insights_id    INT;
    v_prog_launch_ready_id    INT;

    -- Skill IDs (6 total)
    v_skill_msl_reporter_id   INT;
    v_skill_aggregator_id     INT;
    v_skill_strategist_id     INT;
    v_skill_cra_monitor_id    INT;
    v_skill_safety_eval_id    INT;
    v_skill_med_director_id   INT;
BEGIN

-- ── 1. ORG UNITS ──────────────────────────────────────────────────
-- Enterprise → 2 BUs → 3 Functions → 6 Departments → 6 Individuals

INSERT INTO org_units (org_level, name, description, owner, status, tags)
VALUES ('Enterprise', 'Vantage Biopharma', 'Global biopharma enterprise advancing oncology therapeutics through clinical excellence and commercial strategy', 'Mike Pica', 'Active', ARRAY['biopharma', 'oncology'])
RETURNING id INTO v_enterprise_id;

-- Business Units
INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_enterprise_id, 'Business Unit', 'Oncology BU', 'Oncology business unit driving pipeline advancement and patient outcomes', 'Dr. Richard Stein', 'Active', ARRAY['oncology', 'bu'])
RETURNING id INTO v_oncology_bu_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_enterprise_id, 'Business Unit', 'R&D', 'Research and development business unit - placeholder, no active programs', 'Mike Pica', 'Active', ARRAY['rnd', 'bu'])
RETURNING id INTO v_rnd_bu_id;

-- Functions (under Oncology BU)
INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_oncology_bu_id, 'Function', 'Medical Affairs', 'Medical affairs function managing field medical operations and evidence generation', 'Dr. Elena Vasquez', 'Active', ARRAY['medical-affairs', 'function'])
RETURNING id INTO v_med_affairs_fn_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_oncology_bu_id, 'Function', 'Commercial', 'Commercial function driving launch strategy and market access', 'Sarah Okonkwo', 'Active', ARRAY['commercial', 'function'])
RETURNING id INTO v_commercial_fn_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_oncology_bu_id, 'Function', 'Clinical Development', 'Clinical development function overseeing trial operations, patient safety, and clinical leadership', 'Dr. Richard Stein', 'Active', ARRAY['clinical-dev', 'function'])
RETURNING id INTO v_clinical_dev_fn_id;

-- Departments (under Functions)
INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_med_affairs_fn_id, 'Department', 'Field Medical', 'Field medical team conducting KOL engagements and generating real-world evidence', 'Dr. Elena Vasquez', 'Active', ARRAY['field-medical', 'department'])
RETURNING id INTO v_field_medical_dept_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_med_affairs_fn_id, 'Department', 'Med Affairs Operations', 'Medical affairs operations coordinating insight aggregation and intelligence distribution', 'Marcus Chen', 'Active', ARRAY['med-ops', 'department'])
RETURNING id INTO v_med_ops_dept_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_commercial_fn_id, 'Department', 'Launch Strategy', 'Launch strategy department developing commercial positioning and market access plans', 'Sarah Okonkwo', 'Active', ARRAY['launch-strategy', 'department'])
RETURNING id INTO v_launch_strategy_dept_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_clinical_dev_fn_id, 'Department', 'Site Operations', 'Site operations department monitoring clinical trial sites and maintaining compliance', 'Dr. James Park', 'Active', ARRAY['site-ops', 'department'])
RETURNING id INTO v_site_ops_dept_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_clinical_dev_fn_id, 'Department', 'Patient Safety', 'Patient safety department evaluating adverse events and safety signals', 'Dr. Amara Osei', 'Active', ARRAY['patient-safety', 'department'])
RETURNING id INTO v_patient_safety_dept_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_clinical_dev_fn_id, 'Department', 'Clinical Leadership', 'Clinical leadership department directing protocol design and regulatory strategy', 'Dr. Richard Stein', 'Active', ARRAY['clinical-leadership', 'department'])
RETURNING id INTO v_clinical_lead_dept_id;

-- Individuals (under Departments)
INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_field_medical_dept_id, 'Individual', 'Dr. Elena Vasquez', 'MSL Field Rep - conducts KOL engagements and submits field insight reports', 'Dr. Elena Vasquez', 'Active', ARRAY['msl', 'individual'])
RETURNING id INTO v_vasquez_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_med_ops_dept_id, 'Individual', 'Marcus Chen', 'Ops Coordinator - aggregates MSL field insights and prepares intelligence packages', 'Marcus Chen', 'Active', ARRAY['ops-coordinator', 'individual'])
RETURNING id INTO v_chen_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_launch_strategy_dept_id, 'Individual', 'Sarah Okonkwo', 'Commercial Strategist - translates insights into launch positioning and competitive differentiation', 'Sarah Okonkwo', 'Active', ARRAY['strategist', 'individual'])
RETURNING id INTO v_okonkwo_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_site_ops_dept_id, 'Individual', 'Dr. James Park', 'CRA Site Monitor - monitors trial sites for adverse events and maintains compliance documentation', 'Dr. James Park', 'Active', ARRAY['cra', 'individual'])
RETURNING id INTO v_park_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_patient_safety_dept_id, 'Individual', 'Dr. Amara Osei', 'Patient Safety Officer - evaluates adverse events using Naranjo algorithm and detects safety signals', 'Dr. Amara Osei', 'Active', ARRAY['safety-officer', 'individual'])
RETURNING id INTO v_osei_id;

INSERT INTO org_units (parent_id, org_level, name, description, owner, status, tags)
VALUES (v_clinical_lead_dept_id, 'Individual', 'Dr. Richard Stein', 'Medical Director - reviews safety evaluations and makes final protocol amendment decisions', 'Dr. Richard Stein', 'Active', ARRAY['medical-director', 'individual'])
RETURNING id INTO v_stein_id;


-- ── 2. GOAL ITEMS ─────────────────────────────────────────────────
-- 3 Pillars → 6 Categories → 8 Goals → 4 Programs = 21 total

-- PILLAR 1: Advance Pipeline
INSERT INTO goal_items (org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_enterprise_id, 'Pillar', 'Advance Pipeline', 'Drive pipeline advancement through clinical excellence and regulatory readiness', 'Dr. Richard Stein', 'Active', 1, '2026-01-01', '2026-12-31', ARRAY['pipeline', 'pillar'])
RETURNING id INTO v_pillar_pipeline_id;

-- PILLAR 2: Improve Patient Outcomes
INSERT INTO goal_items (org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_enterprise_id, 'Pillar', 'Improve Patient Outcomes', 'Generate real-world evidence and develop patient-centered commercial strategies', 'Dr. Elena Vasquez', 'Active', 2, '2026-01-01', '2026-12-31', ARRAY['patient-outcomes', 'pillar'])
RETURNING id INTO v_pillar_outcomes_id;

-- PILLAR 3: Develop Our People
INSERT INTO goal_items (org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_enterprise_id, 'Pillar', 'Develop Our People', 'Invest in talent development and cross-functional collaboration across the enterprise', 'Mike Pica', 'Active', 3, '2026-01-01', '2026-12-31', ARRAY['people', 'pillar'])
RETURNING id INTO v_pillar_people_id;

-- CATEGORIES under Pillar 1: Advance Pipeline
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_pipeline_id, v_clinical_dev_fn_id, 'Category', 'Clinical Excellence', 'Maintain rigorous clinical standards across trial operations and patient safety', 'Dr. Richard Stein', 'Active', 1, '2026-01-01', '2026-12-31', ARRAY['clinical-excellence', 'category'])
RETURNING id INTO v_cat_clinical_exc_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_pipeline_id, v_oncology_bu_id, 'Category', 'Pipeline Progression', 'Advance key therapeutic candidates through clinical development milestones', 'Dr. Richard Stein', 'Active', 2, '2026-01-01', '2026-12-31', ARRAY['pipeline-progression', 'category'])
RETURNING id INTO v_cat_pipeline_prog_id;

-- CATEGORIES under Pillar 2: Improve Patient Outcomes
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_outcomes_id, v_med_affairs_fn_id, 'Category', 'Real-World Evidence', 'Generate actionable real-world evidence through systematic KOL engagement and field intelligence', 'Dr. Elena Vasquez', 'Active', 1, '2026-01-01', '2026-12-31', ARRAY['rwe', 'category'])
RETURNING id INTO v_cat_rwe_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_outcomes_id, v_commercial_fn_id, 'Category', 'Patient Access', 'Develop strategies to ensure broad patient access to VBP-142', 'Sarah Okonkwo', 'Active', 2, '2026-01-01', '2026-12-31', ARRAY['patient-access', 'category'])
RETURNING id INTO v_cat_patient_access_id;

-- CATEGORIES under Pillar 3: Develop Our People
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_people_id, v_enterprise_id, 'Category', 'Talent Development', 'Build organizational capabilities through structured competency development', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-12-31', ARRAY['talent', 'category'])
RETURNING id INTO v_cat_talent_dev_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_pillar_people_id, v_enterprise_id, 'Category', 'Cross-Functional Collaboration', 'Improve coordination and handoff efficiency between functional teams', 'Mike Pica', 'Active', 2, '2026-01-01', '2026-12-31', ARRAY['collaboration', 'category'])
RETURNING id INTO v_cat_cross_fn_id;

-- GOALS under Clinical Excellence
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_clinical_exc_id, v_patient_safety_dept_id, 'Goal', 'Ensure patient safety across all active trials', 'Maintain comprehensive adverse event monitoring and rapid escalation protocols across all VBP-142 trial sites', 'Dr. Amara Osei', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['patient-safety', 'goal'])
RETURNING id INTO v_goal_patient_safety_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_clinical_exc_id, v_site_ops_dept_id, 'Goal', 'Maintain 95% site compliance rate', 'Achieve and sustain 95% compliance rate across all active clinical trial sites through rigorous monitoring', 'Dr. James Park', 'Active', 2, '2026-01-01', '2026-06-30', ARRAY['site-compliance', 'goal'])
RETURNING id INTO v_goal_site_compliance_id;

-- GOAL under Pipeline Progression
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_pipeline_prog_id, v_clinical_lead_dept_id, 'Goal', 'Advance VBP-142 through Phase II readiness', 'Complete all protocol amendments and secure IRB approvals to transition VBP-142 into Phase II expansion', 'Dr. Richard Stein', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['vbp-142', 'phase-2', 'goal'])
RETURNING id INTO v_goal_vbp142_phase2_id;

-- GOALS under Real-World Evidence
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_rwe_id, v_field_medical_dept_id, 'Goal', 'Generate actionable KOL insights for VBP-142 launch', 'Conduct systematic KOL engagement sessions to generate actionable competitive intelligence and unmet needs data for VBP-142 launch positioning', 'Dr. Elena Vasquez', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['kol', 'insights', 'goal'])
RETURNING id INTO v_goal_kol_insights_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_rwe_id, v_launch_strategy_dept_id, 'Goal', 'Develop evidence-based launch positioning', 'Create data-driven launch positioning strategy informed by KOL insights and competitive landscape analysis', 'Sarah Okonkwo', 'Active', 2, '2026-01-01', '2026-06-30', ARRAY['launch-positioning', 'goal'])
RETURNING id INTO v_goal_launch_pos_id;

-- GOAL under Patient Access
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_patient_access_id, v_commercial_fn_id, 'Goal', 'Build payer engagement strategy for VBP-142', 'Develop comprehensive payer engagement and reimbursement strategy for VBP-142 market access', 'Sarah Okonkwo', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['payer-engagement', 'goal'])
RETURNING id INTO v_goal_payer_engage_id;

-- GOALS under Talent Development
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_talent_dev_id, v_enterprise_id, 'Goal', 'Complete annual competency assessments', 'Conduct comprehensive competency assessments for all team members to identify development opportunities', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['competency', 'goal'])
RETURNING id INTO v_goal_competency_id;

-- GOAL under Cross-Functional Collaboration
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_cat_cross_fn_id, v_enterprise_id, 'Goal', 'Improve cross-functional handoff cycle time by 20%', 'Reduce cross-functional handoff cycle time by 20% through standardized processes and improved coordination tools', 'Mike Pica', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['handoff', 'cycle-time', 'goal'])
RETURNING id INTO v_goal_handoff_id;

-- PROGRAMS (4 total)
INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_goal_patient_safety_id, v_patient_safety_dept_id, 'Program', 'AE-SENTINEL', 'Adverse Event Escalation program: systematic monitoring, causality assessment, and rapid escalation of adverse events across all VBP-142 trial sites', 'Dr. Amara Osei', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['ae-sentinel', 'safety', 'program'])
RETURNING id INTO v_prog_ae_sentinel_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_goal_vbp142_phase2_id, v_clinical_lead_dept_id, 'Program', 'VBP-142 Phase II Readiness', 'Phase II readiness program: protocol amendments, IRB approvals, and site activation for VBP-142 clinical expansion', 'Dr. Richard Stein', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['vbp-142', 'phase-2', 'program'])
RETURNING id INTO v_prog_vbp142_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_goal_kol_insights_id, v_field_medical_dept_id, 'Program', 'KOL-INSIGHTS', 'KOL engagement program: systematic field intelligence gathering through structured MSL interactions with academic oncologists', 'Dr. Elena Vasquez', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['kol-insights', 'msl', 'program'])
RETURNING id INTO v_prog_kol_insights_id;

INSERT INTO goal_items (parent_id, org_unit_id, goal_level, name, description, owner, status, priority, start_date, end_date, tags)
VALUES (v_goal_launch_pos_id, v_launch_strategy_dept_id, 'Program', 'LAUNCH-READY', 'Commercial launch readiness program: competitive landscape analysis, target segmentation, and positioning strategy for VBP-142', 'Sarah Okonkwo', 'Active', 1, '2026-01-01', '2026-06-30', ARRAY['launch-ready', 'commercial', 'program'])
RETURNING id INTO v_prog_launch_ready_id;


-- ── 3. GOAL ALIGNMENTS ────────────────────────────────────────────
-- Standard primary alignments (Program → Goal → Category → Pillar)

-- AE-SENTINEL chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_ae_sentinel_id, v_goal_patient_safety_id, 'primary', 1.00, 'AE-SENTINEL program directly advances patient safety monitoring goal');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_patient_safety_id, v_cat_clinical_exc_id, 'primary', 1.00, 'Patient safety goal is core to clinical excellence');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_clinical_exc_id, v_pillar_pipeline_id, 'primary', 0.80, 'Clinical excellence drives pipeline advancement');

-- VBP-142 Phase II chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_vbp142_id, v_goal_vbp142_phase2_id, 'primary', 1.00, 'VBP-142 Phase II Readiness program directly advances Phase II readiness goal');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_vbp142_phase2_id, v_cat_pipeline_prog_id, 'primary', 1.00, 'VBP-142 Phase II readiness is core to pipeline progression');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_pipeline_prog_id, v_pillar_pipeline_id, 'primary', 0.80, 'Pipeline progression drives pipeline advancement');

-- KOL-INSIGHTS chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_kol_insights_id, v_goal_kol_insights_id, 'primary', 1.00, 'KOL-INSIGHTS program directly advances KOL insight generation goal');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_kol_insights_id, v_cat_rwe_id, 'primary', 1.00, 'KOL insights goal is core to real-world evidence generation');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_rwe_id, v_pillar_outcomes_id, 'primary', 0.80, 'Real-world evidence drives patient outcomes improvement');

-- LAUNCH-READY chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_launch_ready_id, v_goal_launch_pos_id, 'primary', 1.00, 'LAUNCH-READY program directly advances launch positioning goal');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_launch_pos_id, v_cat_rwe_id, 'primary', 1.00, 'Evidence-based launch positioning builds on real-world evidence');

-- Site compliance chain (Goal → Category already covered)
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_site_compliance_id, v_cat_clinical_exc_id, 'primary', 1.00, 'Site compliance is fundamental to clinical excellence');

-- Patient Access chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_patient_access_id, v_pillar_outcomes_id, 'primary', 0.80, 'Patient access strategies improve patient outcomes');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_payer_engage_id, v_cat_patient_access_id, 'primary', 1.00, 'Payer engagement strategy drives patient access');

-- Talent Development chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_talent_dev_id, v_pillar_people_id, 'primary', 0.80, 'Talent development drives people pillar');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_competency_id, v_cat_talent_dev_id, 'primary', 1.00, 'Competency assessments advance talent development');

-- Cross-Functional Collaboration chain
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_cat_cross_fn_id, v_pillar_people_id, 'primary', 0.80, 'Cross-functional collaboration develops our people');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_goal_handoff_id, v_cat_cross_fn_id, 'primary', 1.00, 'Handoff cycle time improvement drives cross-functional collaboration');

-- Cross-cutting alignments
INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_kol_insights_id, v_prog_launch_ready_id, 'cross-cutting', 0.70, 'MSL field insights directly inform commercial launch positioning');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_ae_sentinel_id, v_prog_vbp142_id, 'cross-cutting', 0.90, 'Safety signals from AE monitoring directly impact protocol design');

INSERT INTO goal_alignments (child_goal_id, parent_goal_id, alignment_type, alignment_strength, notes)
VALUES (v_prog_launch_ready_id, v_pillar_pipeline_id, 'secondary', 0.60, 'Commercial readiness validates pipeline investment decisions');


-- ── 4. PROGRAM OBJECTIVES (Quarterly) ─────────────────────────────

-- AE-SENTINEL objectives
INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_ae_sentinel_id, 'Q1', 2026, 'Establish adverse event monitoring baseline across 5 active trial sites', 5.00, 'sites', 'Active');

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_ae_sentinel_id, 'Q2', 2026, 'Achieve <24hr median AE reporting time across all sites', 24.00, 'hours', 'Active');

-- VBP-142 Phase II Readiness objectives
INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_vbp142_id, 'Q1', 2026, 'Complete protocol amendments for Phase II expansion', 3.00, 'amendments', 'Active');

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_vbp142_id, 'Q2', 2026, 'Secure IRB approval for 8 new sites', 8.00, 'sites', 'Active');

-- KOL-INSIGHTS objectives
INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_kol_insights_id, 'Q1', 2026, 'Conduct 15 KOL engagement sessions for VBP-142 positioning', 15.00, 'sessions', 'Active');

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_kol_insights_id, 'Q2', 2026, 'Deliver integrated KOL insight report to commercial team', 1.00, 'reports', 'Active');

-- LAUNCH-READY objectives
INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_launch_ready_id, 'Q1', 2026, 'Complete competitive landscape analysis for VBP-142', 1.00, 'analyses', 'Active');

INSERT INTO program_objectives (program_id, quarter, year, objective_text, target_value, target_unit, status)
VALUES (v_prog_launch_ready_id, 'Q2', 2026, 'Develop preliminary launch positioning deck', 1.00, 'decks', 'Active');


-- ── 5. PROGRESS UPDATES ───────────────────────────────────────────

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author)
VALUES (v_prog_ae_sentinel_id, 1,
    'AE-SENTINEL program initiated. Monitoring framework designed for 5 trial sites. Causality assessment protocols aligned with ICH E2B guidelines. Integration with CRA site monitoring workflow established. 0 of 5 sites onboarded.',
    0.00, 'Not Started',
    '{"sites_onboarded": 0, "aes_reported": 0, "median_reporting_hours": null, "target_sites": 5, "decisions": []}',
    'Dr. Amara Osei');

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author)
VALUES (v_prog_vbp142_id, 1,
    'VBP-142 Phase II readiness program established. Protocol amendment team assembled. Phase I safety data review scheduled. Statistical analysis plan draft initiated. 0 of 3 amendments completed.',
    0.00, 'Not Started',
    '{"amendments_completed": 0, "sites_approved": 0, "target_amendments": 3, "decisions": []}',
    'Dr. Richard Stein');

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author)
VALUES (v_prog_kol_insights_id, 1,
    'KOL-INSIGHTS program initiated. Target KOL list of 20 academic oncologists compiled. Field engagement schedule drafted for Q1. MSL reporting template standardized. 0 of 15 sessions completed.',
    0.00, 'Not Started',
    '{"sessions_completed": 0, "insights_submitted": 0, "kols_engaged": 0, "target_sessions": 15, "decisions": []}',
    'Dr. Elena Vasquez');

INSERT INTO progress_updates (program_id, version, update_text, percent_complete, rag_status, metrics, author)
VALUES (v_prog_launch_ready_id, 1,
    'LAUNCH-READY program established. Commercial strategy framework aligned with Medical Affairs insights pipeline. Competitive intelligence sources identified. Payer landscape mapping initiated. 0 of 1 analyses completed.',
    0.00, 'Not Started',
    '{"analyses_completed": 0, "positioning_drafts": 0, "target_analyses": 1, "decisions": []}',
    'Sarah Okonkwo');


-- ── 6. SKILLS REGISTRY ────────────────────────────────────────────

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Dr. Elena Vasquez',
    'MSL Insight Reporter',
    'personal',
    'Conducts KOL engagement sessions and submits structured field insight reports capturing sentiment, competitive intelligence, and unmet needs for VBP-142',
    '{"type": "object", "properties": {"kol_name": {"type": "string"}, "institution": {"type": "string"}, "therapeutic_area": {"type": "string"}, "engagement_type": {"type": "string", "enum": ["advisory_board", "1on1_meeting", "congress", "site_visit"]}}, "required": ["kol_name", "institution"]}',
    '{"type": "object", "properties": {"kol_name": {"type": "string"}, "institution": {"type": "string"}, "sentiment": {"type": "string", "enum": ["positive", "neutral", "cautious", "negative"]}, "key_insights": {"type": "array", "items": {"type": "string"}}, "competitive_intel": {"type": "string"}, "unmet_needs": {"type": "array", "items": {"type": "string"}}}, "required": ["kol_name", "sentiment", "key_insights"]}',
    '{"skill_file": "skills/msl-insight-reporter/SKILL.md", "chain_id": "chain-a", "chain_position": 1, "chain_next": "Marcus Chen"}'
)
RETURNING id INTO v_skill_msl_reporter_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Marcus Chen',
    'Med Affairs Aggregator',
    'personal',
    'Reviews and aggregates MSL field insight reports, identifies patterns across KOL engagements, and prepares synthesized intelligence packages for commercial strategy',
    '{"type": "object", "properties": {"insight_reports": {"type": "array", "items": {"type": "object"}}, "aggregation_period": {"type": "string"}}, "required": ["insight_reports"]}',
    '{"type": "object", "properties": {"total_interactions": {"type": "integer"}, "kol_sentiment_summary": {"type": "object"}, "top_unmet_needs": {"type": "array", "items": {"type": "string"}}, "competitive_landscape": {"type": "string"}, "recommendation_for_commercial": {"type": "string"}}, "required": ["total_interactions", "top_unmet_needs", "recommendation_for_commercial"]}',
    '{"skill_file": "skills/med-affairs-aggregator/SKILL.md", "chain_id": "chain-a", "chain_position": 2, "chain_prev": "Dr. Elena Vasquez", "chain_next": "Sarah Okonkwo"}'
)
RETURNING id INTO v_skill_aggregator_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Sarah Okonkwo',
    'Commercial Strategist',
    'personal',
    'Translates aggregated KOL insights and medical affairs intelligence into commercial launch positioning, target segments, and competitive differentiation for VBP-142',
    '{"type": "object", "properties": {"aggregated_insights": {"type": "object"}, "market_data": {"type": "object"}}, "required": ["aggregated_insights"]}',
    '{"type": "object", "properties": {"product_positioning": {"type": "string"}, "target_segments": {"type": "array", "items": {"type": "string"}}, "key_messages": {"type": "array", "items": {"type": "string"}}, "competitive_differentiation": {"type": "string"}}, "required": ["product_positioning", "target_segments", "key_messages"]}',
    '{"skill_file": "skills/commercial-strategist/SKILL.md", "chain_id": "chain-a", "chain_position": 3, "chain_prev": "Marcus Chen"}'
)
RETURNING id INTO v_skill_strategist_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Dr. James Park',
    'CRA Site Monitor',
    'personal',
    'Monitors clinical trial sites for adverse events, flags safety signals for escalation, and maintains site compliance documentation for VBP-142 trials',
    '{"type": "object", "properties": {"site_id": {"type": "string"}, "visit_type": {"type": "string", "enum": ["routine_monitoring", "triggered_visit", "close_out"]}, "ae_details": {"type": "object"}}, "required": ["site_id", "visit_type"]}',
    '{"type": "object", "properties": {"ae_id": {"type": "string"}, "event_term": {"type": "string"}, "severity_grade": {"type": "integer", "minimum": 1, "maximum": 5}, "study_drug_relationship": {"type": "string", "enum": ["unrelated", "unlikely", "possible", "probable", "definite"]}, "escalation_recommended": {"type": "boolean"}}, "required": ["ae_id", "event_term", "severity_grade", "escalation_recommended"]}',
    '{"skill_file": "skills/cra-site-monitor/SKILL.md", "chain_id": "chain-b", "chain_position": 1, "chain_next": "Dr. Amara Osei"}'
)
RETURNING id INTO v_skill_cra_monitor_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Dr. Amara Osei',
    'Patient Safety Evaluator',
    'personal',
    'Evaluates adverse event reports for causality assessment using Naranjo algorithm, detects safety signals, and determines need for protocol amendments',
    '{"type": "object", "properties": {"ae_report": {"type": "object"}, "historical_data": {"type": "object"}}, "required": ["ae_report"]}',
    '{"type": "object", "properties": {"causality_assessment": {"type": "string", "enum": ["definite", "probable", "possible", "unlikely", "unrelated"]}, "naranjo_score": {"type": "integer", "minimum": -4, "maximum": 13}, "signal_detected": {"type": "boolean"}, "requires_protocol_amendment": {"type": "boolean"}, "recommendation": {"type": "string"}}, "required": ["causality_assessment", "naranjo_score", "signal_detected", "requires_protocol_amendment"]}',
    '{"skill_file": "skills/patient-safety-evaluator/SKILL.md", "chain_id": "chain-b", "chain_position": 2, "chain_prev": "Dr. James Park", "chain_next": "Dr. Richard Stein"}'
)
RETURNING id INTO v_skill_safety_eval_id;

INSERT INTO skills (person_name, skill_name, skill_type, description, input_spec, output_spec, metadata)
VALUES (
    'Dr. Richard Stein',
    'Medical Director Reviewer',
    'personal',
    'Reviews safety evaluations and makes final decisions on protocol amendments, risk-benefit assessments, and regulatory reporting for VBP-142 clinical program',
    '{"type": "object", "properties": {"safety_evaluation": {"type": "object"}, "protocol_context": {"type": "object"}}, "required": ["safety_evaluation"]}',
    '{"type": "object", "properties": {"decision": {"type": "string", "enum": ["approve_amendment", "reject_amendment", "request_more_data", "escalate_to_dsmb"]}, "rationale": {"type": "string"}, "amendment_type": {"type": "string"}, "protocol_changes": {"type": "array", "items": {"type": "string"}}, "risk_benefit_assessment": {"type": "string"}}, "required": ["decision", "rationale", "risk_benefit_assessment"]}',
    '{"skill_file": "skills/medical-director-reviewer/SKILL.md", "chain_id": "chain-b", "chain_position": 3, "chain_prev": "Dr. Amara Osei"}'
)
RETURNING id INTO v_skill_med_director_id;


-- ── Summary ───────────────────────────────────────────────────────
RAISE NOTICE '══════════════════════════════════════════════════════';
RAISE NOTICE 'Vantage Biopharma seed data inserted successfully!';
RAISE NOTICE '──────────────────────────────────────────────────────';
RAISE NOTICE 'Org Units (18):';
RAISE NOTICE '  Enterprise(%), Oncology BU(%), R&D(%)', v_enterprise_id, v_oncology_bu_id, v_rnd_bu_id;
RAISE NOTICE '  Med Affairs(%), Commercial(%), Clinical Dev(%)', v_med_affairs_fn_id, v_commercial_fn_id, v_clinical_dev_fn_id;
RAISE NOTICE '  Field Medical(%), Med Ops(%), Launch Strategy(%)', v_field_medical_dept_id, v_med_ops_dept_id, v_launch_strategy_dept_id;
RAISE NOTICE '  Site Ops(%), Patient Safety(%), Clinical Lead(%)', v_site_ops_dept_id, v_patient_safety_dept_id, v_clinical_lead_dept_id;
RAISE NOTICE '  Vasquez(%), Chen(%), Okonkwo(%)', v_vasquez_id, v_chen_id, v_okonkwo_id;
RAISE NOTICE '  Park(%), Osei(%), Stein(%)', v_park_id, v_osei_id, v_stein_id;
RAISE NOTICE '──────────────────────────────────────────────────────';
RAISE NOTICE 'Goal Items (21):';
RAISE NOTICE '  Pillars: Pipeline(%), Outcomes(%), People(%)', v_pillar_pipeline_id, v_pillar_outcomes_id, v_pillar_people_id;
RAISE NOTICE '  Programs: AE-SENTINEL(%), VBP-142(%), KOL-INSIGHTS(%), LAUNCH-READY(%)', v_prog_ae_sentinel_id, v_prog_vbp142_id, v_prog_kol_insights_id, v_prog_launch_ready_id;
RAISE NOTICE '──────────────────────────────────────────────────────';
RAISE NOTICE 'Skills (6): MSL Reporter(%), Aggregator(%), Strategist(%)', v_skill_msl_reporter_id, v_skill_aggregator_id, v_skill_strategist_id;
RAISE NOTICE '            CRA Monitor(%), Safety Eval(%), Med Director(%)', v_skill_cra_monitor_id, v_skill_safety_eval_id, v_skill_med_director_id;
RAISE NOTICE 'Objectives: Q1 + Q2 2026 for 4 programs (8 total)';
RAISE NOTICE 'Progress:   V1 - Not Started (0%%) for 4 programs';
RAISE NOTICE 'Alignments: 19 primary + 2 cross-cutting + 1 secondary';
RAISE NOTICE '══════════════════════════════════════════════════════';

END $$;
