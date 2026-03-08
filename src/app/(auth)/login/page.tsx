"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md px-4"><div className="h-96 animate-pulse rounded-2xl bg-gray-100" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    const result = await signIn("credentials", {
      username: data.username,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError(
        result.error === "CredentialsSignin"
          ? "Invalid username or password."
          : result.error
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
            <LockKeyhole className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            ProjectVault
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Error message */}
        {serverError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                errors.username
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your username"
              {...register("username")}
            />
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`block w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                  errors.password
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter your password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-gray-400">
        BGERP &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
