"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Vallas Publicitarias en Bolivia</h1>
        <p className="text-lg mb-6">Conectamos tu marca con audiencias masivas a través de espacios publicitarios estratégicamente ubicados.</p>
        <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
          <Link href="/vallas-publicitarias">Explorar Vallas</Link>
        </Button>
      </div>
    </main>
  )
}
