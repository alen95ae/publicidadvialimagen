"use client";

import { Suspense } from "react";
import ResetPasswordInner from "./ResetPasswordInner";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}

