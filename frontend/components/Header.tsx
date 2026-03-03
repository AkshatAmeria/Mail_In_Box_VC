"use client"

import { Search } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

export default function Header(){

  const { data: session } = useSession()

 return(
  <div className="flex">

  <div className="flex items-center justify-center ml-6 p-3 mt-5  bg-gray-200  rounded-2xl w-200">

   <div className="flex items-center gap-3 w-full">

     <Search size={18} className="text-gray-400"/>

     <input
      placeholder="Search"
      className="w-full outline-none text-sm"
     />

   </div>

  </div>

        <div className="flex items-center gap-4 ml-6 mt-5">

        {session?.user?.image && (

          <img
            src={session.user.image}
            className="w-8 h-8 rounded-full"
          />

        )}

        <button
          onClick={()=>signOut({ callbackUrl: "/login" })}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
        >
          Sign Out
        </button>

      </div>

  </div>



 )
}