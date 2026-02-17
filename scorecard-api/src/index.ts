import path from "path";
import dotenv from "dotenv";

// Load .env from project root (parent of scorecard-api)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import { orgTreeRouter } from "./routes/org-tree";
import { goalTreeRouter } from "./routes/goal-tree";
import { skillsRouter } from "./routes/skills";
import { skillOutputsRouter } from "./routes/skill-outputs";
import { feedbackRouter } from "./routes/feedback";
import { scorecardRouter } from "./routes/scorecard";
import { progressRouter } from "./routes/progress";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", orgTreeRouter);
app.use("/api", goalTreeRouter);
app.use("/api", skillsRouter);
app.use("/api", skillOutputsRouter);
app.use("/api", feedbackRouter);
app.use("/api", scorecardRouter);
app.use("/api", progressRouter);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
