"use client";
import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-600">Verifying your email...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
