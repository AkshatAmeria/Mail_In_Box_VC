
"use client"

import EmailChipsInput from "@/components/EmailChipsInput"
import { useState } from "react"
import {
  ChevronLeft,
  Paperclip,
  Clock
} from "lucide-react"
import { useRouter } from "next/navigation"

import FileUpload from "@/components/FileUpload"
import { api } from "@/lib/api"

export default function ComposePage() {

  const router = useRouter();

  const [emails, setEmails] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [showSchedule, setShowSchedule] = useState(false)

  async function scheduleEmails(sendNow = false) {

    if (emails.length === 0) {
      alert("Please add at least one email")
      return
    }

    const scheduleTime = sendNow
      ? new Date().toISOString()
      : scheduledAt

    for (const email of emails) {

      await api.post("/schedule-email", {
        to: email,
        subject,
        body,
        senderId: "e74bb1cf-c290-4777-acee-d6797f6c7404",
        scheduledAt: scheduleTime
      })

    }

    alert(`${emails.length} emails scheduled`)
  }

  return (

    <div className="w-full h-screen bg-gray-50 flex justify-center items-start p-6">

      <div className="w-full max-w-6xl bg-white rounded-xl border shadow-sm p-6">

        
        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-2 text-gray-700">
            <ChevronLeft size={18} onClick={()=>{router.push("/dashboard")}}/>
            <span className="font-medium">
              Compose New Email
            </span>
          </div>

          
          <div className="flex items-center gap-4">

            <Paperclip
              size={18}
              className="text-gray-500 cursor-pointer"
            />

            <Clock
              size={18}
              className="text-gray-500 cursor-pointer"
              onClick={() => setShowSchedule(!showSchedule)}
            />

            <button
              onClick={() => scheduleEmails(true)}
              className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium"
            >
              Send
            </button>

          </div>

        </div>

        
        <div className="space-y-4">

         
          <div className="flex items-center gap-4 text-sm">

            <span className="w-20 text-gray-500">From</span>

            <select className="border rounded-md px-3 py-2 text-sm">
              <option>
                yb53y3n67vlu7lg3@ethereal.email
              </option>
            </select>

          </div>

          
          <div className="flex items-start gap-4 text-sm">

            <span className="w-20 text-gray-500 mt-2">
              To
            </span>

            <EmailChipsInput
              emails={emails}
              setEmails={setEmails}
            />

          </div>

       
          <FileUpload onEmails={setEmails} />

          
          <div className="flex items-center gap-4 text-sm">

            <span className="w-20 text-gray-500">
              Subject
            </span>

            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2"
            />

          </div>

          
          <div className="flex items-center gap-6 text-sm">

            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                Delay between 2 emails
              </span>

              <input
                className="w-16 border rounded-md px-2 py-1 text-center"
                placeholder="00"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                Hourly Limit
              </span>

              <input
                className="w-16 border rounded-md px-2 py-1 text-center"
                placeholder="00"
              />
            </div>

          </div>

          
          <textarea
            placeholder="Type Your Reply..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-64 border rounded-md p-4 resize-none outline-none"
          />

        </div>

        
        {showSchedule && (

          <div className="absolute right-10 top-28 w-72 bg-white border rounded-lg shadow-lg p-4">

            <p className="text-sm font-medium mb-3">
              Send Later
            </p>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border rounded-md p-2 text-sm mb-4"
            />

            <div className="flex justify-between mt-4">

              <button
                onClick={() => setShowSchedule(false)}
                className="text-sm text-gray-500"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowSchedule(false)
                  scheduleEmails()
                }}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full"
              >
                Done
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}