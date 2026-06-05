"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Punto } from "@/components/ui/punto";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function withTimeout<T>(promise: Promise<T>, ms = 8000) {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await withTimeout(
        signIn("credentials", {
          email: fd.get("email"),
          password: fd.get("password"),
          redirect: false,
        }),
      );

      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sessionResponse.json();

      if (res?.ok && session?.user) {
        router.push("/dashboard");
        return;
      }

      setError(res?.error === "Configuration" ? "Falta configurar la conexión a la base de datos." : "Credenciales incorrectas");
    } catch (err) {
      if (err instanceof Error && err.message === "timeout") {
        setError("El ingreso está tardando demasiado. Falta revisar la conexión a la base de datos.");
        return;
      }
      setError("No fue posible validar el acceso. Revisa la configuración de la base de datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Franja imagen cocina (izquierda) */}
      <div
        className="hidden md:block md:w-[42%] lg:w-[45%] relative bg-formatto-grafito bg-cover bg-center"
        style={{ backgroundImage: "url('/login-kitchen.jpg')" }}
      >
        <div className="absolute inset-0 bg-formatto-grafito/35" />
        <div className="absolute bottom-0 left-0 p-10">
          <img src="/formatto-logo-white.svg" alt="Formatto" className="h-6 w-auto mb-4" />
          <p className="text-white/90 text-lg font-light max-w-xs leading-snug">
            Fabricación con estándar industrial y mirada de proyecto.
          </p>
        </div>
      </div>

      {/* Formulario (derecha) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo (visible solo en mobile, ya que la franja se oculta) */}
          <div className="md:hidden flex items-center mb-10">
            <img src="/formatto-logo.svg" alt="Formatto" className="h-7 w-auto" />
          </div>

          <p className="text-2xs font-semibold text-formatto-bark uppercase tracking-widest mb-2">
            — Acceso interno
          </p>
          <h1 className="text-3xl font-light text-formatto-grafito mb-8 leading-tight">
            Gestión de Instalaciones
            <Punto className="ml-1" />
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@formatto.cl"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-primary" role="alert" aria-live="polite">{error}</p>
            )}

            <Button type="submit" variant="default" size="lg" loading={loading} className="w-full">
              Ingresar
            </Button>
          </form>

          <p className="text-2xs text-formatto-bark mt-8">
            Solo acceso autorizado — uso interno Formatto
          </p>
        </div>
      </div>
    </div>
  );
}
