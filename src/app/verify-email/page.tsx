import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Verification</h1>
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            No verification token provided. Please check your verification email and try again.
          </div>
        </div>
      </div>
    );
  }

  redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}
