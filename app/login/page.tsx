import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

// AuthForm reads ?modo= with useSearchParams, so it renders on the client inside
// <Suspense>; the fallback is an empty card that reserves the form's height.
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm />
    </Suspense>
  );
}

function AuthFormFallback() {
  return (
    <div className="av-auth-wrap">
      <div className="auth-card min-h-[628px]" aria-hidden="true"></div>
    </div>
  );
}
