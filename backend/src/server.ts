import app from "./app.js";
import { config } from "./config/env.js";
import "./modules/email/email.worker.js";

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});