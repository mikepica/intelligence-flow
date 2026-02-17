import { Router } from "express";
import { prisma } from "../prisma";
import { buildTree } from "../utils";

export const orgTreeRouter = Router();

orgTreeRouter.get("/org-tree", async (_req, res) => {
  try {
    const units = await prisma.org_units.findMany({
      where: { status: "Active" },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      select: {
        id: true,
        parent_id: true,
        name: true,
        org_level: true,
        description: true,
        owner: true,
        status: true,
      },
    });

    const tree = buildTree(units);
    res.json({ data: tree });
  } catch (err) {
    console.error("GET /api/org-tree error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch org tree" },
    });
  }
});
