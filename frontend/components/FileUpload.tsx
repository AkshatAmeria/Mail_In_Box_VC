"use client"

import Papa from "papaparse"
import { useState } from "react"

export default function FileUpload({ onEmails }: any) {

  const [count, setCount] = useState(0)

  function parseFile(file: File) {

    Papa.parse(file, {

      complete: (result : any) => {

        const emails = result.data
          .flat()
          .filter((e: any) => e.includes("@"))

        setCount(emails.length)

        onEmails(emails)
      }

    })
  }

  return (

    <div>

      <input
        type="file"
        accept=".csv,.txt"
        onChange={(e) => {

          if (!e.target.files) return

          parseFile(e.target.files[0])

        }}
      />

      <p className="text-sm text-gray-500">
        {count} emails detected
      </p>

    </div>

  )
}