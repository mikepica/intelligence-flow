import { Router } from "express";
import { prisma } from "../prisma";

export const skillsRouter = Router();

skillsRouter.get("/skills", async (req, res) => {
  try {
    const personName = req.query.person_name as string | undefined;

    const skills = await prisma.skills.findMany({
      where: personName ? { person_name: personName } : undefined,
      include: {
        _count: {
          select: { skill_outputs: true },
        },
      },
      orderBy: [{ person_name: "asc" }, { skill_name: "asc" }],
    });

    const data = skills.map((s) => ({
      id: s.id,
      person_name: s.person_name,
      skill_name: s.skill_name,
      skill_type: s.skill_type,
      description: s.description,
      input_spec: s.input_spec,
      output_spec: s.output_spec,
      metadata: s.metadata,
      output_count: s._count.skill_outputs,
    }));

    res.json({ data });
  } catch (err) {
    console.error("GET /api/skills error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch skills" },
    });
  }
});
