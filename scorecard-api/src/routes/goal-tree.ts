import { Router } from "express";
import { prisma } from "../prisma";
import { buildTree } from "../utils";
import { Prisma } from "@prisma/client";

export const goalTreeRouter = Router();

interface GoalRow {
  id: number;
  parent_id: number | null;
  org_unit_id: number;
  goal_level: string;
  name: string;
  description: string | null;
  owner: string | null;
  status: string;
  weight: Prisma.Decimal | null;
  priority: number | null;
  org_unit_name: string;
}

goalTreeRouter.get("/goal-tree/:orgId", async (req, res) => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    if (isNaN(orgId)) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "orgId must be an integer" },
      });
    }

    // Get the org unit info
    const orgUnit = await prisma.org_units.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, org_level: true },
    });

    if (!orgUnit) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Org unit with id ${orgId} not found`,
        },
      });
    }

    // Recursive CTE to get all descendant org IDs, then fetch goals
    const goals = await prisma.$queryRaw<GoalRow[]>`
      WITH RECURSIVE org_descendants AS (
        SELECT id FROM org_units WHERE id = ${orgId}
        UNION ALL
        SELECT ou.id FROM org_units ou
        JOIN org_descendants od ON ou.parent_id = od.id
      )
      SELECT gi.id, gi.parent_id, gi.org_unit_id, gi.goal_level::text,
             gi.name, gi.description, gi.owner, gi.status::text,
             gi.weight, gi.priority,
             ou.name AS org_unit_name
      FROM goal_items gi
      JOIN org_units ou ON ou.id = gi.org_unit_id
      WHERE gi.org_unit_id IN (SELECT id FROM org_descendants)
        AND gi.status = 'Active'
      ORDER BY gi.goal_level, gi.priority, gi.name
    `;

    const goalIds = goals.map((g) => g.id);

    // Fetch alignments for these goals
    const alignments =
      goalIds.length > 0
        ? await prisma.goal_alignments.findMany({
            where: {
              OR: [
                { child_goal_id: { in: goalIds } },
                { parent_goal_id: { in: goalIds } },
              ],
            },
          })
        : [];

    // Build the goal tree
    const goalTree = buildTree(goals);

    // Shape alignments with goal names
    const goalMap = new Map(goals.map((g) => [g.id, g.name]));
    const shapedAlignments = alignments.map((a) => ({
      child_goal_id: a.child_goal_id,
      child_goal_name: goalMap.get(a.child_goal_id) || null,
      parent_goal_id: a.parent_goal_id,
      parent_goal_name: goalMap.get(a.parent_goal_id) || null,
      alignment_type: a.alignment_type,
      alignment_strength: a.alignment_strength,
      notes: a.notes,
    }));

    res.json({
      data: {
        org_unit: orgUnit,
        goals: goalTree,
        alignments: shapedAlignments,
      },
    });
  } catch (err) {
    console.error("GET /api/goal-tree/:orgId error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch goal tree" },
    });
  }
});
