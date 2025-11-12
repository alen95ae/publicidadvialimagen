"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import InvitationsSection from "../components/InvitationsSection";

export default function InvitationsPage() {
  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de invitaciones</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Gestión de invitaciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvitationsSection />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
