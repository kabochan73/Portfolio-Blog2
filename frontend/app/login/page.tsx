"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { login } from "@/lib/admin/auth";
import { ApiError } from "@/lib/http";

const schema = z.object({
  email: z.string().min(1, "Please enter your email address").email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password);
      router.push("/admin");
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (e.errors?.email?.[0] ?? e.message)
          : "Failed to login";
      setError("email", { message });
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-800 bg-white p-8 shadow-[6px_6px_0_0_#18181b]">
        <h1 className="mt-4 text-center text-2xl font-bold text-zinc-900">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-zinc-700">
              Mail
            </label>
            <TextInput
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
              className="mt-1 w-full"
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-zinc-700">
              Password
            </label>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 w-full"
            />
            {errors.password ? (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
