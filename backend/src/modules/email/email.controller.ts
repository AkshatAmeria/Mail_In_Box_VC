import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { emailQueue } from "./email.queue.js";
import { EmailStatus } from "@prisma/client";

export async function scheduleEmail(req: Request, res: Response) {
  const { to, subject, body, senderId, scheduledAt } = req.body;

  console.log("Incoming schedule request:", req.body);

  const email = await prisma.email.create({
    data: {
      to,
      subject,
      body,
      senderId,
      scheduledAt: new Date(scheduledAt),
      status: "SCHEDULED",
    },
  });

  const delay = new Date(scheduledAt).getTime() - Date.now();

  console.log("Calculated delay:", delay);

  const job = await emailQueue.add(
    "sendEmail",
    { emailId: email.id },
    {
      delay,
      jobId: email.id,

      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 5000,
      },

      removeOnComplete: false,
      removeOnFail: false,
    }
  );

  await prisma.email.update({
    where: { id: email.id },
    //@ts-ignore
    data: {
      jobId: job.id,
    },
  });

  console.log("Job added to BullMQ:", job.id);

  res.json(email);
}

export async function getEmails(req: Request, res: Response) {
  const status = req.query.status as EmailStatus | undefined;

  const emails = await prisma.email.findMany({
    where: status ? { status } : {},
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(emails);
}