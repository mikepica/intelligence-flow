import { Router } from "express";
import { prisma } from "../prisma";

export const progressRouter = Router();

progressRouter.get("/progress/:programId", async (req, res) => {
  try {
    const programId = parseInt(req.params.programId, 10);
    if (isNaN(programId)) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "programId must be an integer",
        },
      });
    }

    const latest = req.query.latest === "true";

    const program = await prisma.goal_items.findUnique({
      where: { id: programId },
      include: { org_units: { select: { name: true } } },
    });

    if (!program) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Program with id ${programId} not found`,
        },
      });
    }

    const updates = await prisma.progress_updates.findMany({
      where: { program_id: programId },
      orderBy: { version: "desc" },
      ...(latest && { take: 1 }),
    });

    res.json({
      data: {
        program: {
          id: program.id,
          name: program.name,
          org_unit: program.org_units.name,
        },
        updates: updates.map((u) => ({
          id: u.id,
          version: u.version,
          update_text: u.update_text,
          percent_complete: u.percent_complete,
          rag_status: u.rag_status,
          metrics: u.metrics,
          author: u.author,
          created_at: u.created_at,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/progress/:programId error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch progress updates",
      },
    });
  }
});
