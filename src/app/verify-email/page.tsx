"use client";
import { Suspense } from "react";
import { VerifyEmailHandler } from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-600">Verifying your email...</div>}>
      <VerifyEmailHandler />
    </Suspense>
  );
}
