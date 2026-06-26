import { Suspense } from "react";
import { isGoogleEnabled } from "@/lib/auth";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        </div>
      }
    >
      <SignInForm isGoogleEnabled={isGoogleEnabled} />
    </Suspense>
  );
}
