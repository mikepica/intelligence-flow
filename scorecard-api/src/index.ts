import path from "path";
import dotenv from "dotenv";

// Load .env from project root (parent of scorecard-api)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import app from "./app";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
