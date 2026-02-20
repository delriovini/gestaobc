import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-slate-500">Página não encontrada</p>
      <Link href="/" className="text-cyan-500 hover:underline">Voltar ao início</Link>
    </div>
  );
}
