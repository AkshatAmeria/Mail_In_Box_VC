"use client"

import { Email } from "@/types/email"
import { Star } from "lucide-react"

export default function EmailTable({
  emails,
  onSelect
}:{
  emails: Email[],
  onSelect: (email: Email) => void
}){

  if(!emails.length){
    return <p className="text-gray-400">No emails found</p>
  }

  return(

    <div className="bg-white rounded-lg border">

      {emails.map((email)=> (

        <div
          key={email.id}
          onClick={()=>onSelect(email)}
          className="flex items-center justify-between px-6 py-4 border-b hover:bg-gray-50 cursor-pointer"
        >

         

          <div className="flex items-center gap-3 text-sm w-full">

            <span className="text-gray-800 font-medium whitespace-nowrap">
              To: {email.to}
            </span>

            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
              {email.status}
            </span>

            <span className="font-medium text-gray-900">
              {email.subject}
            </span>

            <span className="text-gray-400 truncate max-w-[400px]">
              - {email.body}
            </span>

          </div>

         

          <Star
            size={18}
            className="text-gray-300 hover:text-yellow-400"
          />

        </div>

      ))}

    </div>

  )
}