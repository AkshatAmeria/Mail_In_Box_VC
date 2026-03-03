"use client"

import { Email } from "@/types/email"
import { ArrowLeft, Star, Trash2, Copy } from "lucide-react"

export default function MailViewer({
  email,
  onClose
}:{
  email: Email | null
  onClose: () => void
}) {

  if (!email) return null

  const senderName = email.to.split("@")[0]

  const formattedDate = email.sentAt
    ? new Date(email.sentAt).toLocaleString()
    : new Date(email.scheduledAt).toLocaleString()

  return (

    <div className="fixed inset-0 bg-white z-50 overflow-auto">


      <div className="flex items-center justify-between p-6 border-b">

        <div className="flex items-center gap-4">

          <ArrowLeft
            size={20}
            className="cursor-pointer"
            onClick={onClose}
          />

          <h1 className="text-lg font-semibold">
            {email.subject}
          </h1>

        </div>

        <div className="flex items-center gap-4 text-gray-500">

          <Star size={18} className="cursor-pointer"/>
          <Copy size={18} className="cursor-pointer"/>
          <Trash2 size={18} className="cursor-pointer"/>

        </div>

      </div>

     

      <div className="max-w-3xl mx-auto p-10">

       

        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-4">

            <div className="bg-green-500 text-white w-8 h-8 flex items-center justify-center rounded-full">
              {senderName.charAt(0).toUpperCase()}
            </div>

            <div>

              <p className="font-medium">
                {senderName}
              </p>

              <p className="text-sm text-gray-500">
                {email.to}
              </p>

            </div>

          </div>

          <p className="text-sm text-gray-400">
            {formattedDate}
          </p>

        </div>

      

        <div className="text-sm text-gray-700 whitespace-pre-line">

          {email.body}

        </div>

      </div>

    </div>

  )
}