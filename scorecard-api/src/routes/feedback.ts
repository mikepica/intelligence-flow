import { Router } from "express";
import { prisma } from "../prisma";

export const feedbackRouter = Router();

feedbackRouter.get("/feedback", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const requestedFrom = req.query.requested_from as string | undefined;
    const requestedBy = req.query.requested_by as string | undefined;

    const feedback = await prisma.feedback_requests.findMany({
      where: {
        ...(status && { status }),
        ...(requestedFrom && { requested_from: requestedFrom }),
        ...(requestedBy && { requested_by: requestedBy }),
      },
      include: {
        skill_outputs: {
          include: {
            skills: {
              select: { id: true, skill_name: true, skill_type: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const data = feedback.map((f) => ({
      id: f.id,
      requested_by: f.requested_by,
      requested_from: f.requested_from,
      request_message: f.request_message,
      status: f.status,
      response_text: f.response_text,
      responded_at: f.responded_at,
      created_at: f.created_at,
      skill_output: {
        id: f.skill_outputs.id,
        person_name: f.skill_outputs.person_name,
        goal_name: f.skill_outputs.goal_name,
        output_summary: f.skill_outputs.output_summary,
        output_data: f.skill_outputs.output_data,
      },
      skill: f.skill_outputs.skills,
    }));

    res.json({ data });
  } catch (err) {
    console.error("GET /api/feedback error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch feedback" },
    });
  }
});
