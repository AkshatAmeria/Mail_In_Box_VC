import { Worker } from "bullmq";
import { config } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { allowSend, msUntilNextHour } from "./rateLimiter.js";
import { createTransport } from "../email/smtp.js";

export const worker = new Worker(
  "emailQueue",
  async (job) => {

    console.log("Worker picked job:", job.id);

    const { emailId } = job.data;

    const email = await prisma.$transaction(async (tx) => {

      const e = await tx.email.findUnique({
        where: { id: emailId },
      });

      if (!e || e.status === "SENT") return null;

      return tx.email.update({
        where: { id: emailId },
        data: { status: "PROCESSING" },
      });

    });

    if (!email) return;

    const allowed = await allowSend(email.senderId);

    if (!allowed) {

      console.log("Rate limit reached. Rescheduling job:", job.id);

      const delay = msUntilNextHour();

      await job.moveToDelayed(Date.now() + delay);

      await prisma.email.update({
        where: { id: email.id },
        data: { status: "SCHEDULED" },
      });

      return;
    }

    console.log("Sending email:", email.id);

    const sender = await prisma.sender.findUnique({
      where: { id: email.senderId },
    });

    if (!sender) {
      throw new Error("Sender not found");
    }

    const transporter = createTransport(sender);

    let info;

    try {

      info = await transporter.sendMail({
        from: sender.smtpUser,
        to: email.to,
        subject: email.subject,
        text: email.body,
      });

    } catch (error) {

      console.error("Error sending email:", error);

      await prisma.email.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });

      throw error;
    }

    console.log("Email sent:", info.messageId);

    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId: info.messageId,
      },
    });

  },
  {
    //@ts-expect-error
    connection: {
      url: config.redisUrl,
    },

    concurrency: config.workerConcurrency,

    limiter: {
      max: 1,
      duration: config.minDelayMs,
    },
  }
);
