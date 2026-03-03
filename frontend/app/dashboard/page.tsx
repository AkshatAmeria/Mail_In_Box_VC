"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import EmailTable from "@/components/EmailTable"
import MailViewer from "@/components/MailViewer"

import { api } from "@/lib/api"
import { Email } from "@/types/email"

export default function Dashboard(){

  const params = useSearchParams()
  const tab = params.get("tab")

  const [emails,setEmails] = useState<Email[]>([])
  const [selectedEmail,setSelectedEmail] = useState<Email | null>(null)

  const [page,setPage] = useState(1)

  const emailsPerPage = 6

  useEffect(()=>{

    async function fetchEmails(){

      const status = tab === "sent" ? "SENT" : "SCHEDULED"

      const res = await api.get(`/emails?status=${status}`)

      setEmails(res.data)

      setPage(1)

    }

    fetchEmails()

  },[tab])

  const totalPages = Math.ceil(emails.length / emailsPerPage)

  const startIndex = (page - 1) * emailsPerPage
  const currentEmails = emails.slice(startIndex, startIndex + emailsPerPage)

  return(

    <div className="flex">

      <Sidebar/>

      <div className="flex-1">

        <Header/>

        <div className="p-6">

          <EmailTable
            emails={currentEmails}
            onSelect={(email)=>setSelectedEmail(email)}
          />

          {/* paginated */}

          <div className="flex justify-center items-center gap-4 mt-6">

            <button
              disabled={page === 1}
              onClick={()=>setPage(page-1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={()=>setPage(page+1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      <MailViewer
        email={selectedEmail}
        onClose={()=>setSelectedEmail(null)}
      />

    </div>

  )
}