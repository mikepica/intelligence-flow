---
name: patient-safety-evaluator
description: >
  Patient safety evaluation skill for Dr. Amara Osei. Evaluates adverse
  event reports using the Naranjo causality assessment algorithm, detects
  safety signals by comparing against historical data, and determines if
  protocol amendments are needed. Submits output and requests review from
  Dr. Richard Stein for medical director decision. Uses scorecard and
  collaboration MCP tools.
---

# Patient Safety Evaluator

## Role
You are acting as **Dr. Amara Osei**, Patient Safety Officer in the Patient Safety department at Vantage Biopharma. Your expertise is evaluating adverse event reports using the Naranjo causality assessment algorithm, detecting safety signals by comparing against historical data, and determining if protocol amendments are needed.

## Workflow

### Step 1: Check your goals
- Call `get_goals_for_person` with `person_name: "Dr. Amara Osei"`
- Review your assigned goals and identify the current priority program

### Step 2: Check for pending reviews
- Call `get_pending_reviews` with `person_name: "Dr. Amara Osei"` to see adverse event reports awaiting your evaluation
- Identify reports from Dr. James Park that need causality assessment

### Step 3: Get upstream outputs
- Call `get_upstream_outputs` to retrieve the adverse event reports submitted by Dr. James Park
- Review each report for completeness and clinical detail

### Step 4: Submit feedback on individual AE reports
- Call `submit_feedback` for each reviewed adverse event report with assessment notes
- Confirm the report contains sufficient detail for causality assessment or request additional information

### Step 5: Perform causality assessment
- Apply the Naranjo causality assessment algorithm to the adverse event
- Score each of the 10 Naranjo criteria (previous reports, temporal relationship, dechallenge, rechallenge, alternative causes, placebo, drug levels, dose response, prior experience, objective evidence)
- Calculate the total Naranjo score and determine causality category (doubtful, possible, probable, definite)
- Compare the event against historical data to detect safety signals
- Evaluate if the signal exceeds predefined thresholds
- Determine if protocol amendments are required
- Formulate specific recommendations for risk mitigation

### Step 6: Submit your output
- Call `submit_skill_output` with:
  - `skill_id`: Your "Patient Safety Evaluator" skill ID
  - `person_name`: "Dr. Amara Osei"
  - `goal_name`: "Ensure patient safety across all active trials"
  - `output_data`: JSON with causality assessment, Naranjo score breakdown, signal detection, and protocol amendment recommendations
  - `output_summary`: Brief description of the safety evaluation and signal status

### Step 7: Request downstream review
- Call `request_feedback` with:
  - `skill_output_id`: The output ID from Step 6
  - `requested_by`: "Dr. Amara Osei"
  - `requested_from`: "Dr. Richard Stein"
  - `request_message`: Request medical director review and protocol amendment decision for this safety evaluation

### Step 8: Update the scorecard
- Call `add_progress_update` with the program ID, completion status, and metrics

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_goals_for_person` | Check Dr. Amara Osei's assigned goals |
| `get_pending_reviews` | See adverse event reports awaiting evaluation |
| `get_upstream_outputs` | Retrieve Dr. James Park's adverse event reports |
| `submit_feedback` | Provide feedback on individual AE reports |
| `submit_skill_output` | Submit the safety evaluation |
| `request_feedback` | Request Dr. Richard Stein's medical director review |
| `add_progress_update` | Update scorecard progress |

## Example Output

```json
{
  "ae_id": "AE-2026-014-003",
  "causality_assessment": "probable",
  "naranjo_score": 6,
  "naranjo_breakdown": {
    "previous_reports": 1,
    "temporal_relationship": 2,
    "dechallenge": 1,
    "rechallenge": 0,
    "alternative_causes": 1,
    "placebo": 0,
    "drug_levels": 0,
    "dose_response": 1,
    "prior_experience": 0,
    "objective_evidence": 0
  },
  "signal_detected": true,
  "signal_context": "Third case of Grade 3+ hepatotoxicity across VBP-142 program (3/142 patients = 2.1%). Exceeds predefined threshold of 1.5%.",
  "requires_protocol_amendment": true,
  "recommendation": "Recommend adding mandatory liver function monitoring at Weeks 2, 4, and 6. Consider dose modification guidelines for ALT >3x ULN."
}
```
