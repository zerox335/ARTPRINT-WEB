import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AuthForm } from "@/src/modules/identity/ui/auth-form";
export const metadata: Metadata = { title: "Ingresar", robots: { index: false, follow: false } };
export default function Page() { return <section className="auth-page"><div className="auth-visual"><Image src="/brand/artprint-studio.jpg" alt="Estudio ArtPrint" fill sizes="(max-width: 900px) 0px, 50vw" priority /><div><p>PERSONALIZA</p><h2>Del primer trazo<br />a tus manos.</h2></div></div><Suspense fallback={<div className="page-loader"><span /></div>}><AuthForm /></Suspense></section>; }
