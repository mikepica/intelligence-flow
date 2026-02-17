import { Router } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

export const scorecardRouter = Router();

scorecardRouter.get("/scorecard", async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;

    const programs = await prisma.goal_items.findMany({
      where: { goal_level: "Program", status: "Active" },
      include: {
        org_units: { select: { name: true, org_level: true } },
        program_objectives: {
          where: { year },
          orderBy: { quarter: "asc" },
        },
        progress_updates: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    const data = programs.map((p) => {
      // Build Q1-Q4 objectives map
      const objectives: Record<string, any> = { Q1: null, Q2: null, Q3: null, Q4: null };
      for (const obj of p.program_objectives) {
        objectives[obj.quarter] = {
          objective_text: obj.objective_text,
          target_value: obj.target_value,
          target_unit: obj.target_unit,
          status: obj.status,
        };
      }

      const latestProgress = p.progress_updates[0] || null;

      return {
        program_id: p.id,
        program_name: p.name,
        org_unit: p.org_units.name,
        org_level: p.org_units.org_level,
        objectives,
        progress: latestProgress
          ? {
              percent_complete: latestProgress.percent_complete,
              rag_status: latestProgress.rag_status,
              last_updated: latestProgress.created_at,
              update_text: latestProgress.update_text,
              metrics: latestProgress.metrics,
              version: latestProgress.version,
              author: latestProgress.author,
            }
          : null,
      };
    });

    res.json({ data });
  } catch (err) {
    console.error("GET /api/scorecard error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch scorecard",
      },
    });
  }
});

scorecardRouter.get("/scorecard/summary", async (_req, res) => {
  try {
    // Fetch all programs with their latest progress update
    const programs = await prisma.goal_items.findMany({
      where: { goal_level: "Program", status: "Active" },
      include: {
        progress_updates: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    // For each program, walk up the parent chain to find the Pillar ancestor
    const pillarMap = new Map<
      number,
      { pillar_id: number; pillar_name: string; programs: typeof enriched }
    >();

    const enriched = programs.map((p) => {
      const latest = p.progress_updates[0] || null;
      return {
        program_id: p.id,
        program_name: p.name,
        parent_id: p.parent_id,
        rag_status: latest?.rag_status ?? "Not Started",
        percent_complete: latest
          ? Number(latest.percent_complete ?? 0)
          : 0,
      };
    });

    // Walk up the goal_items parent chain to find Pillar for each program
    for (const prog of enriched) {
      let currentId: number | null = prog.parent_id;
      let pillar: { id: number; name: string } | null = null;

      // Walk up at most 10 levels to avoid infinite loops
      for (let i = 0; i < 10 && currentId !== null; i++) {
        const parent = await prisma.goal_items.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, goal_level: true, parent_id: true },
        });
        if (!parent) break;
        if (parent.goal_level === "Pillar") {
          pillar = { id: parent.id, name: parent.name };
          break;
        }
        currentId = parent.parent_id;
      }

      if (pillar) {
        if (!pillarMap.has(pillar.id)) {
          pillarMap.set(pillar.id, {
            pillar_id: pillar.id,
            pillar_name: pillar.name,
            programs: [],
          });
        }
        pillarMap.get(pillar.id)!.programs.push(prog);
      }
    }

    // RAG priority for "worst wins": Red > Amber > Not Started > Green > Complete
    // Prisma serializes "Not Started" enum as "Not_Started" (underscore)
    const ragPriority: Record<string, number> = {
      Red: 5,
      Amber: 4,
      "Not Started": 3,
      "Not_Started": 3,
      Green: 2,
      Complete: 1,
    };

    const totals = { green: 0, amber: 0, red: 0, not_started: 0 };

    const pillars = Array.from(pillarMap.values()).map((entry) => {
      let worstRag = "Complete";
      let worstPriority = 0;

      const progs = entry.programs.map((p) => {
        const status = p.rag_status as string;

        // Count totals (Prisma may serialize as "Not_Started" with underscore)
        if (status === "Green") totals.green++;
        else if (status === "Amber") totals.amber++;
        else if (status === "Red") totals.red++;
        else if (status === "Not Started" || status === "Not_Started") totals.not_started++;

        // Track worst RAG
        const priority = ragPriority[status] ?? 0;
        if (priority > worstPriority) {
          worstPriority = priority;
          worstRag = status;
        }

        return {
          program_id: p.program_id,
          program_name: p.program_name,
          rag_status: status,
          percent_complete: p.percent_complete,
        };
      });

      return {
        pillar_id: entry.pillar_id,
        pillar_name: entry.pillar_name,
        overall_rag: worstRag,
        programs: progs,
      };
    });

    res.json({
      data: {
        pillars,
        totals,
      },
    });
  } catch (err) {
    console.error("GET /api/scorecard/summary error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch scorecard summary",
      },
    });
  }
});
