"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {

  const {data:session} = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if(session) {
      router.push("/dashboard");
    }
  } , [session]);

  return (
    <div className="h-screen flex items-center justify-center">

      <div className="bg-white p-10 rounded-xl shadow w-96">

        <h1 className="text-2xl font-semibold text-center mb-6">
          Login
        </h1>

        <button
          onClick={() => signIn("google")}
          className="w-full bg-green-500 text-white py-2 rounded-lg"
        >
          Login with Google
        </button>

      </div>

    </div>
  )
}