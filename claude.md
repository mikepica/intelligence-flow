Don't read the archive folder files, its outdated material.
# currentDate
Today's date is 2026-02-17.

# Vantage Biopharma Demo

Fictional large pharma demo showcasing the Scorecard + Skills coordination layer.

**Company**: Vantage Biopharma
**3 Pillars**: Advance Pipeline, Improve Patient Outcomes, Develop Our People
**Org**: 18 org_units (Enterprise > BUs > Functions > Departments > Individuals)
**Goals**: 21 goal_items (3 Pillars, 5 Categories, 7 Goals, 4 Programs, 2 standalone goals)
**Programs**: AE-SENTINEL, VBP-142 Phase II Readiness, KOL-INSIGHTS, LAUNCH-READY
**Skills**: 6 skills across 6 personas
**Chains**: Chain A (KOL Insights): Elena > Marcus > Sarah | Chain B (AE Escalation): James > Amara > Richard

## Key Files

- `seeds/vantage-biopharma-seed.sql` -- seed data for the full hierarchy
- `skills/` -- 6 skill definitions (msl-insight-reporter, med-affairs-aggregator, commercial-strategist, cra-site-monitor, patient-safety-evaluator, medical-director-reviewer)
- `goals.html` + `goals.js` -- CEO Goal View (three-column pillar layout with role-based filtering)
- `demo.html` + `demo.js` -- 6-panel Program Dashboard (org tree, goal cascade, scorecard, skills registry, skill chain, timeline)
- `scorecard-api/` -- Express.js API server (7 existing + 2 new routes)
