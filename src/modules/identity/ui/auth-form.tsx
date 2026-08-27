"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

export function AuthForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = mode === "login" ? { email: form.get("email"), password: form.get("password") } : { name: form.get("name"), email: form.get("email"), phone: form.get("phone") || undefined, password: form.get("password") };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "No pudimos continuar");
      const next = search.get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/mi-cuenta"); router.refresh();
    } catch (caught) { setError((caught as Error).message); setBusy(false); }
  }
  return <div className="auth-card"><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Ingresar</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Crear cuenta</button></div><p className="eyebrow">{mode === "login" ? "Qué bueno verte" : "Únete a ArtPrint"}</p><h1>{mode === "login" ? "Tus ideas te esperan" : "Crea, aprueba y sigue"}</h1><p className="auth-copy">{mode === "login" ? "Consulta tus pedidos y aprobaciones desde un solo lugar." : "Tu cuenta guarda diseños, pedidos y estados de producción."}</p><form onSubmit={submit}>{mode === "register" && <><label>Nombre completo<input name="name" required minLength={2} autoComplete="name" /></label><label>Teléfono <small>(opcional)</small><input name="phone" inputMode="tel" autoComplete="tel" /></label></>}<label>Correo electrónico<input name="email" type="email" required autoComplete="email" /></label><label>Contraseña<div className="password-input"><input name="password" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 10 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{mode === "register" && <p className="password-help">Mínimo 10 caracteres, mayúscula, minúscula y número.</p>}{error && <p className="inline-alert" role="alert">{error}</p>}<button className="button button-gradient button-block" disabled={busy}>{busy ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear mi cuenta"}<ArrowRight size={17} /></button></form><div className="auth-trust"><ShieldCheck size={18} /><span>Sesión segura mediante cookie HttpOnly. Nunca guardamos datos de tarjeta.</span></div></div>;
}
