import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ================================================================
  // 1. ORG UNITS
  // ================================================================
  const az = await prisma.org_units.create({
    data: {
      org_level: "Enterprise",
      name: "AstraZeneca",
      description: "AstraZeneca PLC - Global biopharmaceutical company",
      status: "Active",
    },
  });

  const oncRD = await prisma.org_units.create({
    data: {
      parent_id: az.id,
      org_level: "Business_Unit",
      name: "Oncology R&D",
      description: "Oncology Research & Development",
      status: "Active",
    },
  });

  const clinDev = await prisma.org_units.create({
    data: {
      parent_id: az.id,
      org_level: "Business_Unit",
      name: "Clinical Development",
      description: "Clinical Development Operations",
      status: "Active",
    },
  });

  const oncDS = await prisma.org_units.create({
    data: {
      parent_id: oncRD.id,
      org_level: "Department",
      name: "Oncology Data Science",
      description: "Data science and computational biology for oncology",
      status: "Active",
    },
  });

  const transSci = await prisma.org_units.create({
    data: {
      parent_id: oncRD.id,
      org_level: "Department",
      name: "Translational Science",
      description: "Translational science and biomarker development",
      status: "Active",
    },
  });

  const clinOps = await prisma.org_units.create({
    data: {
      parent_id: clinDev.id,
      org_level: "Department",
      name: "Clinical Operations",
      description: "Clinical trial operations and feasibility",
      status: "Active",
    },
  });

  const sarah = await prisma.org_units.create({
    data: {
      parent_id: oncDS.id,
      org_level: "Individual",
      name: "Dr. Sarah Chen",
      owner: "Dr. Sarah Chen",
      description: "Lead Data Scientist - Oncology compound analysis",
      status: "Active",
    },
  });

  const james = await prisma.org_units.create({
    data: {
      parent_id: transSci.id,
      org_level: "Individual",
      name: "Dr. James Rivera",
      owner: "Dr. James Rivera",
      description: "Senior Translational Scientist - Biomarker development",
      status: "Active",
    },
  });

  const priya = await prisma.org_units.create({
    data: {
      parent_id: clinOps.id,
      org_level: "Individual",
      name: "Dr. Priya Sharma",
      owner: "Dr. Priya Sharma",
      description: "Clinical Development Lead - Trial feasibility",
      status: "Active",
    },
  });

  console.log("Org units created.");

  // ================================================================
  // 2. GOAL HIERARCHY
  // ================================================================
  const pillar = await prisma.goal_items.create({
    data: {
      org_unit_id: oncRD.id,
      goal_level: "Pillar",
      name: "Advance Novel Oncology Therapeutics",
      description:
        "Strategic pillar for advancing novel oncology therapeutic programs",
      status: "Active",
    },
  });

  const category = await prisma.goal_items.create({
    data: {
      parent_id: pillar.id,
      org_unit_id: oncRD.id,
      goal_level: "Category",
      name: "CDK4/6 Inhibitor Program",
      description: "Next-generation CDK4/6 inhibitor development program",
      status: "Active",
    },
  });

  const goalLead = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: oncDS.id,
      goal_level: "Goal",
      name: "Identify Lead Compound",
      description: "Identify and validate a lead CDK4/6 inhibitor compound",
      owner: "Dr. Sarah Chen",
      status: "Active",
    },
  });

  const goalBiomarker = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: transSci.id,
      goal_level: "Goal",
      name: "Validate Predictive Biomarkers",
      description:
        "Identify and validate predictive biomarkers for patient selection",
      owner: "Dr. James Rivera",
      status: "Active",
    },
  });

  const goalFeasibility = await prisma.goal_items.create({
    data: {
      parent_id: category.id,
      org_unit_id: clinOps.id,
      goal_level: "Goal",
      name: "Assess Clinical Feasibility",
      description: "Assess feasibility of Phase I/II clinical trial",
      owner: "Dr. Priya Sharma",
      status: "Active",
    },
  });

  // Programs for Sarah
  const progScreen = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "Screen candidate compound library",
      description:
        "High-throughput screening of CDK4/6 focused compound library",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-01-01"),
      end_date: new Date("2026-03-31"),
    },
  });

  const progEfficacy = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "In-vitro efficacy profiling",
      description:
        "In-vitro efficacy and selectivity profiling of screening hits",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-01-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  const progSelection = await prisma.goal_items.create({
    data: {
      parent_id: goalLead.id,
      org_unit_id: oncDS.id,
      goal_level: "Program",
      name: "Lead candidate selection",
      description:
        "Select lead candidate based on efficacy, selectivity, and ADMET profile",
      owner: "Dr. Sarah Chen",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  // Programs for James
  const progBiomarkerID = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Identify candidate biomarkers",
      description:
        "Identify candidate biomarker panel from literature and genomic data",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  const progRetro = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Retrospective patient sample analysis",
      description:
        "Retrospective analysis of archived patient samples for biomarker validation",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-04-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  const progCriteria = await prisma.goal_items.create({
    data: {
      parent_id: goalBiomarker.id,
      org_unit_id: transSci.id,
      goal_level: "Program",
      name: "Define patient selection criteria",
      description:
        "Establish patient selection criteria based on validated biomarkers",
      owner: "Dr. James Rivera",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  // Programs for Priya
  const progProtocol = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Trial protocol design",
      description: "Draft Phase I/II clinical trial protocol",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-09-30"),
    },
  });

  const progRecruitment = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Site and patient recruitment assessment",
      description:
        "Assess site feasibility and patient recruitment projections",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-07-01"),
      end_date: new Date("2026-12-31"),
    },
  });

  const progEndpoint = await prisma.goal_items.create({
    data: {
      parent_id: goalFeasibility.id,
      org_unit_id: clinOps.id,
      goal_level: "Program",
      name: "Endpoint definition and statistical design",
      description:
        "Finalize primary/secondary endpoints and statistical analysis plan",
      owner: "Dr. Priya Sharma",
      status: "Active",
      start_date: new Date("2026-10-01"),
      end_date: new Date("2026-12-31"),
    },
  });

  console.log("Goal hierarchy created.");

  // ================================================================
  // 3. PROGRAM OBJECTIVES
  // ================================================================
  const objectives = [
    {
      program_id: progScreen.id,
      quarter: "Q1" as const,
      objective_text:
        "Complete high-throughput screening of CDK4/6 focused compound library",
    },
    {
      program_id: progEfficacy.id,
      quarter: "Q1" as const,
      objective_text: "Initiate in-vitro assays for top screening hits",
    },
    {
      program_id: progEfficacy.id,
      quarter: "Q2" as const,
      objective_text:
        "Complete efficacy and selectivity profiling of lead candidates",
    },
    {
      program_id: progSelection.id,
      quarter: "Q2" as const,
      objective_text:
        "Select lead candidate based on efficacy, selectivity, and ADMET profile",
    },
    {
      program_id: progBiomarkerID.id,
      quarter: "Q2" as const,
      objective_text:
        "Identify candidate biomarker panel from literature and genomic data",
    },
    {
      program_id: progRetro.id,
      quarter: "Q2" as const,
      objective_text:
        "Begin retrospective analysis of archived patient samples",
    },
    {
      program_id: progRetro.id,
      quarter: "Q3" as const,
      objective_text:
        "Complete patient sample analysis and validate biomarker correlations",
    },
    {
      program_id: progCriteria.id,
      quarter: "Q3" as const,
      objective_text:
        "Establish patient selection criteria based on validated biomarkers",
    },
    {
      program_id: progProtocol.id,
      quarter: "Q3" as const,
      objective_text: "Draft Phase I/II clinical trial protocol",
    },
    {
      program_id: progRecruitment.id,
      quarter: "Q3" as const,
      objective_text: "Initiate site feasibility assessments",
    },
    {
      program_id: progRecruitment.id,
      quarter: "Q4" as const,
      objective_text: "Complete recruitment projections and site selection",
    },
    {
      program_id: progEndpoint.id,
      quarter: "Q4" as const,
      objective_text:
        "Finalize primary/secondary endpoints and statistical analysis plan",
    },
  ];

  for (const obj of objectives) {
    await prisma.program_objectives.create({
      data: {
        program_id: obj.program_id,
        quarter: obj.quarter,
        year: 2026,
        objective_text: obj.objective_text,
        status: "Active",
      },
    });
  }

  console.log("Program objectives created.");

  // ================================================================
  // 4. GOAL ALIGNMENTS
  // ================================================================
  const alignments = [
    // Cross-function dependencies
    {
      child_goal_id: progBiomarkerID.id,
      parent_goal_id: progSelection.id,
      alignment_type: "primary" as const,
    },
    {
      child_goal_id: progProtocol.id,
      parent_goal_id: progCriteria.id,
      alignment_type: "primary" as const,
    },
    {
      child_goal_id: progRecruitment.id,
      parent_goal_id: progCriteria.id,
      alignment_type: "secondary" as const,
    },
    // Structural alignments
    {
      child_goal_id: category.id,
      parent_goal_id: pillar.id,
      alignment_type: "primary" as const,
    },
    {
      child_goal_id: goalLead.id,
      parent_goal_id: category.id,
      alignment_type: "primary" as const,
    },
    {
      child_goal_id: goalBiomarker.id,
      parent_goal_id: category.id,
      alignment_type: "primary" as const,
    },
    {
      child_goal_id: goalFeasibility.id,
      parent_goal_id: category.id,
      alignment_type: "primary" as const,
    },
  ];

  for (const align of alignments) {
    await prisma.goal_alignments.create({
      data: {
        child_goal_id: align.child_goal_id,
        parent_goal_id: align.parent_goal_id,
        alignment_type: align.alignment_type,
        alignment_strength: 1.0,
      },
    });
  }

  console.log("Goal alignments created.");

  // ================================================================
  // 5. INITIAL PROGRESS UPDATE
  // ================================================================
  await prisma.progress_updates.create({
    data: {
      program_id: progScreen.id,
      version: 1,
      update_text:
        "Initiated screening of 2,847 compounds from CDK4/6 focused library. High-throughput assay validated and running.",
      percent_complete: 15,
      rag_status: "Green",
      author: "Dr. Sarah Chen",
      metrics: {
        compounds_screened: 427,
        total_compounds: 2847,
        hit_rate: 0.032,
        assay_z_prime: 0.78,
      } as any,
    },
  });

  console.log("Initial progress update created.");

  // ================================================================
  // 6. PRE-REGISTERED SKILLS (in the collaboration tables)
  // ================================================================
  await prisma.skills.create({
    data: {
      person_name: "Dr. Sarah Chen",
      skill_name: "Compound Efficacy Analysis",
      skill_type: "personal",
      description:
        "High-throughput screening and efficacy profiling of candidate compounds. Analyzes compound libraries against target profiles, ranks candidates by efficacy scores, and provides selectivity data for lead selection.",
      input_spec: {
        required: ["compound_library", "target_profile"],
        optional: ["selectivity_panel", "admet_criteria"],
        description:
          "Compound library dataset and CDK4/6 target binding profile",
      } as any,
      output_spec: {
        produces: ["ranked_candidates", "efficacy_scores", "selectivity_data"],
        format: "JSON with compound IDs, scores, and selectivity ratios",
        description:
          "Ranked candidate compounds with efficacy scores and selectivity data",
      } as any,
    },
  });

  await prisma.skills.create({
    data: {
      person_name: "Dr. James Rivera",
      skill_name: "Biomarker Identification & Validation",
      skill_type: "personal",
      description:
        "Identification and validation of predictive biomarkers from genomic data and patient samples. Produces validated biomarker panels and patient selection criteria for clinical development.",
      input_spec: {
        required: ["lead_compounds", "patient_sample_data"],
        optional: ["genomic_database", "literature_references"],
        description:
          "Lead compound data from efficacy analysis and archived patient sample data",
      } as any,
      output_spec: {
        produces: [
          "validated_biomarker_panel",
          "patient_selection_criteria",
          "correlation_data",
        ],
        format:
          "JSON with biomarker IDs, validation statistics, and selection thresholds",
        description:
          "Validated biomarker panel with patient selection criteria",
      } as any,
    },
  });

  await prisma.skills.create({
    data: {
      person_name: "Dr. Priya Sharma",
      skill_name: "Clinical Trial Feasibility Assessment",
      skill_type: "team",
      description:
        "End-to-end clinical trial feasibility assessment including protocol design, site selection, patient recruitment projections, and endpoint definition. Requires inputs from compound and biomarker teams.",
      input_spec: {
        required: ["biomarker_criteria", "compound_data", "target_indication"],
        optional: ["site_database", "historical_enrollment_data"],
        description:
          "Biomarker selection criteria, lead compound profile, and target indication details",
      } as any,
      output_spec: {
        produces: [
          "feasibility_report",
          "protocol_recommendations",
          "recruitment_projections",
        ],
        format:
          "JSON with feasibility scores, protocol outline, and projected timelines",
        description:
          "Comprehensive feasibility report with protocol recommendations and recruitment projections",
      } as any,
    },
  });

  console.log("Skills pre-registered.");
  console.log("\nSeed data inserted successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
