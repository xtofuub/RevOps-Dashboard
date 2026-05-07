"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";

import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute inset-0 bg-[rgba(88,64,38,0.28)] dark:bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,231,210,0.2)_0%,rgba(91,69,45,0.18)_42%,rgba(29,20,12,0.62)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.72)_100%)]" />

      <section className="relative z-10 w-full max-w-sm text-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/78">
            Sign in to access your dashboard.
          </p>
        </div>

        <form action={action} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  className="h-11 border-white/20 bg-white/10 ps-9 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md placeholder:text-white/45 focus-visible:border-white/45 focus-visible:ring-white/20"
                  autoComplete="username"
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-white/45">
                  <User size={15} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={isVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 border-white/20 bg-white/10 ps-9 pe-9 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md placeholder:text-white/45 focus-visible:border-white/45 focus-visible:ring-white/20"
                  autoComplete="current-password"
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-white/45">
                  <Lock size={15} />
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisible((value) => !value)}
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-white/55 transition-colors hover:text-white"
                  aria-label={isVisible ? "Hide password" : "Show password"}
                >
                  {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {state?.error ? (
              <div className="rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-sm text-red-100 backdrop-blur-md">
                {state.error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full border border-white/25 bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:border-white/40 hover:bg-white/22"
              disabled={pending}
            >
              {pending ? "Signing in..." : "Sign in"}
            </Button>
        </form>
      </section>

      <a
        href="https://github.com/xtofuub"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-[11px] tracking-[0.22em] text-white/34 transition hover:text-white/58"
      >
        Developed by @xtofuub
      </a>
    </div>
  );
}
