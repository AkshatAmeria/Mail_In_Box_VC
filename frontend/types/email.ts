export interface Email {
  id: string
  to: string
  subject: string
  body: string
  scheduledAt: string
  sentAt?: string
  status: "PENDING" | "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED"
}