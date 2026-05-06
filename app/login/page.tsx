"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto w-full max-w-sm space-y-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-sm text-white/60">
            Sign in to access your dashboard.
          </p>
        </div>

        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/80">Username</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                className="ps-9"
                required
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/60">
                <User size={15} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={isVisible ? "text" : "password"}
                placeholder="Enter your password"
                className="ps-9 pe-9"
                required
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/60">
                <Lock size={15} />
              </div>
              <button
                type="button"
                onClick={() => setIsVisible((v) => !v)}
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label={isVisible ? "Hide password" : "Show password"}
              >
                {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}