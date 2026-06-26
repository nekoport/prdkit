import { Suspense } from "react";
import { isGoogleEnabled } from "@/lib/auth";
import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        </div>
      }
    >
      <SignUpForm isGoogleEnabled={isGoogleEnabled} />
    </Suspense>
  );
}
