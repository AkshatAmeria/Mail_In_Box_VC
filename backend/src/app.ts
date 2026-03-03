import express from "express";
import { scheduleEmail } from "./modules/email/email.controller.js";
import { getEmails } from "./modules/email/email.controller.js";
import { serverAdapter } from "./config/bullBoard.js";
import cors from "cors";



const app = express();

app.use(cors({
    origin: "http://localhost:3000"
}))
app.use(express.json());

app.post("/schedule-email", scheduleEmail);

app.get("/emails" , getEmails);

app.use("/admin/queues", serverAdapter.getRouter());

export default app;