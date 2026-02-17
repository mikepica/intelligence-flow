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

goalTreeRouter.get(
  "/goal-tree/:orgId/dashboard/:goalId",
  async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const goalId = parseInt(req.params.goalId, 10);

      if (isNaN(orgId) || isNaN(goalId)) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "orgId and goalId must be integers",
          },
        });
      }

      // Fetch the goal item with its org_unit
      const goal = await prisma.goal_items.findUnique({
        where: { id: goalId },
        include: {
          org_units: { select: { name: true, org_level: true } },
        },
      });

      if (!goal) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `Goal item with id ${goalId} not found`,
          },
        });
      }

      // Fetch child goals
      const children = await prisma.goal_items.findMany({
        where: { parent_id: goalId, status: "Active" },
        select: {
          id: true,
          name: true,
          goal_level: true,
          description: true,
          owner: true,
          status: true,
        },
        orderBy: [{ priority: "asc" }, { name: "asc" }],
      });

      // Fetch program_objectives if it's a Program
      let objectives: Record<string, any> = {};
      if (goal.goal_level === "Program") {
        const objs = await prisma.program_objectives.findMany({
          where: { program_id: goalId },
          orderBy: { quarter: "asc" },
        });
        for (const obj of objs) {
          objectives[obj.quarter] = {
            id: obj.id,
            objective_text: obj.objective_text,
            target_value: obj.target_value,
            target_unit: obj.target_unit,
            status: obj.status,
            year: obj.year,
          };
        }
      }

      // Fetch progress_updates ordered by version desc
      const progressUpdates = await prisma.progress_updates.findMany({
        where: { program_id: goalId },
        orderBy: { version: "desc" },
      });

      const progressHistory = progressUpdates.map((pu) => ({
        version: pu.version,
        percent_complete: pu.percent_complete
          ? Number(pu.percent_complete)
          : 0,
        rag_status: pu.rag_status,
        update_text: pu.update_text,
        metrics: pu.metrics,
        author: pu.author,
        created_at: pu.created_at,
      }));

      // Fetch alignments where this goal is child or parent
      const alignmentsAsChild = await prisma.goal_alignments.findMany({
        where: { child_goal_id: goalId },
        include: {
          goal_items_goal_alignments_parent_goal_idTogoal_items: {
            select: { id: true, name: true, goal_level: true },
          },
        },
      });

      const alignmentsAsParent = await prisma.goal_alignments.findMany({
        where: { parent_goal_id: goalId },
        include: {
          goal_items_goal_alignments_child_goal_idTogoal_items: {
            select: { id: true, name: true, goal_level: true },
          },
        },
      });

      // Shape alignments into upstream, downstream, cross_cutting
      const upstream: any[] = [];
      const downstream: any[] = [];
      const crossCutting: any[] = [];

      for (const a of alignmentsAsChild) {
        const target =
          a.goal_items_goal_alignments_parent_goal_idTogoal_items;
        const shaped = {
          alignment_id: a.id,
          goal_id: target.id,
          goal_name: target.name,
          goal_level: target.goal_level,
          alignment_type: a.alignment_type,
          alignment_strength: a.alignment_strength,
          notes: a.notes,
        };
        if (a.alignment_type === "cross_cutting") {
          crossCutting.push(shaped);
        } else {
          upstream.push(shaped);
        }
      }

      for (const a of alignmentsAsParent) {
        const target =
          a.goal_items_goal_alignments_child_goal_idTogoal_items;
        const shaped = {
          alignment_id: a.id,
          goal_id: target.id,
          goal_name: target.name,
          goal_level: target.goal_level,
          alignment_type: a.alignment_type,
          alignment_strength: a.alignment_strength,
          notes: a.notes,
        };
        if (a.alignment_type === "cross_cutting") {
          crossCutting.push(shaped);
        } else {
          downstream.push(shaped);
        }
      }

      res.json({
        data: {
          goal: {
            id: goal.id,
            name: goal.name,
            goal_level: goal.goal_level,
            description: goal.description,
            owner: goal.owner,
            org_unit: {
              name: goal.org_units.name,
              org_level: goal.org_units.org_level,
            },
            children,
            objectives,
            progress_history: progressHistory,
            alignments: {
              upstream,
              downstream,
              cross_cutting: crossCutting,
            },
          },
        },
      });
    } catch (err) {
      console.error(
        "GET /api/goal-tree/:orgId/dashboard/:goalId error:",
        err
      );
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch goal dashboard",
        },
      });
    }
  }
);
