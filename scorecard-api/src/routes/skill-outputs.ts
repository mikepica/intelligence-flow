import { Router } from "express";
import { prisma } from "../prisma";

export const skillOutputsRouter = Router();

skillOutputsRouter.get("/skill-outputs", async (req, res) => {
  try {
    const skillId = req.query.skill_id
      ? parseInt(req.query.skill_id as string, 10)
      : undefined;
    const personName = req.query.person_name as string | undefined;
    const goalName = req.query.goal_name as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    const where = {
      ...(skillId && { skill_id: skillId }),
      ...(personName && { person_name: personName }),
      ...(goalName && { goal_name: goalName }),
      ...(status && { status }),
    };

    const [outputs, total] = await Promise.all([
      prisma.skill_outputs.findMany({
        where,
        include: {
          skills: { select: { skill_name: true, skill_type: true } },
          feedback_requests: {
            select: {
              id: true,
              requested_from: true,
              status: true,
              response_text: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.skill_outputs.count({ where }),
    ]);

    const data = outputs.map((o) => ({
      id: o.id,
      skill_id: o.skill_id,
      skill_name: o.skills.skill_name,
      person_name: o.person_name,
      goal_name: o.goal_name,
      output_data: o.output_data,
      output_summary: o.output_summary,
      status: o.status,
      created_at: o.created_at,
      feedback_requests: o.feedback_requests,
    }));

    res.json({
      data,
      pagination: { total, limit, offset },
    });
  } catch (err) {
    console.error("GET /api/skill-outputs error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch skill outputs",
      },
    });
  }
});
