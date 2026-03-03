"use client"

import { useState } from "react"

export default function EmailChipsInput({
  emails,
  setEmails
}: {
  emails: string[]
  setEmails: (emails: string[]) => void
}) {

  const [input, setInput] = useState("")

  function addEmail(email: string) {
    const cleaned = email.trim()

    if (!cleaned) return

    if (!emails.includes(cleaned)) {
      setEmails([...emails, cleaned])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {

    if (e.key === "Enter" || e.key === ",") {

      e.preventDefault()

      addEmail(input)

      setInput("")
    }
  }

  function removeEmail(index: number) {

    setEmails(emails.filter((_, i) => i !== index))

  }

  const visible = emails.slice(0, 3)
  const remaining = emails.length - visible.length

  return (

    <div className="flex flex-wrap items-center gap-2 border rounded-md px-3 py-2">

      {visible.map((email, i) => (

        <span
          key={i}
          className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
        >
          {email}

          <button
            onClick={() => removeEmail(i)}
            className="text-green-700"
          >
            ×
          </button>

        </span>

      ))}

      {remaining > 0 && (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
          +{remaining}
        </span>
      )}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="recipient@example.com"
        className="flex-1 outline-none text-sm"
      />

    </div>

  )
}