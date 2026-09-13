"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginForm } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  async function onSubmit(values: LoginForm) {
    setSubmitting(true);
    try {
      await login(values);
      toast.success("Login realizado com sucesso");
      router.push("/");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Email ou senha inválidos"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-xl font-bold">Biblioteca UERN</h1>
        </div>
        <h2 className="text-lg font-semibold">Entrar</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Use suas credenciais para acessar o sistema.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="voce@email.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <Input
              type="password"
              placeholder="••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/books" className="text-zinc-600 underline dark:text-zinc-300">
            Ver catálogo público
          </Link>
        </div>
      </Card>
    </div>
  );
}
