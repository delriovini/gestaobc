import Link from "next/link";

function Logo() {
  return (
    <Link href="/login" className="flex justify-center">
      <img
        src="https://i.imgur.com/7mWUZKi.png"
        alt="Gestão BC"
        className="h-48 w-48 rounded-xl object-contain"
      />
    </Link>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
