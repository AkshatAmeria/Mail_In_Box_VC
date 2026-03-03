"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, Clock } from "lucide-react"

export default function Sidebar() {

  const params = useSearchParams()
  const tab = params.get("tab")

  const isSent = tab === "sent"

  return (
    <div className="w-64 bg-white h-screen p-6 border-r">

      <h1 className="font-bold text-xl mb-6">ONB</h1>

      <div className="flex items-center gap-3 mb-6 border-4 border-gray-300 rounded-lg bg-gray-300">
        <img
          src="https://i.pravatar.cc/40"
          className="w-8 h-8 rounded-full"
        />

        <div>
          <p className="text-sm font-medium">Akshat Ameria</p>
          <p className="text-xs text-gray-500">120104.akshat@gmail.com</p>
        </div>
      </div>

      <Link href="/compose">
        <button className="compose-btn w-full py-2 rounded-full mb-8">
          Compose
        </button>
      </Link>

      <p className="text-xs text-gray-400 mb-2">CORE</p>

      <div className="space-y-2">

        <Link href="/dashboard">
          <div className={`flex items-center gap-3 p-2 rounded-xl
            ${!isSent ? "sidebar-active" : "hover:bg-gray-100"}`}>

            <Clock size={16} />
            Scheduled
            <span className="ml-auto text-xs">12</span>

          </div>
        </Link>

        <Link href="/dashboard?tab=sent">
          <div className={`flex items-center gap-3 p-2 rounded-xl
            ${isSent ? "sidebar-active-sent" : "hover:bg-gray-100"}`}>

            <Mail size={16} />
            Sent
            <span className="ml-auto text-xs text-gray-400">785</span>

          </div>
        </Link>

      </div>

    </div>
  )
}