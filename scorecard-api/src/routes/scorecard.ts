import { Router } from "express";
import { prisma } from "../prisma";

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
