import Link from "next/link";

// Marco visual para las pantallas de auth de usuarios de beta (coherente con la landing).
export default function AuthShell({
  kicker,
  title,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-[0.08em] text-hueso"
        >
          DECARNES
        </Link>
        <p className="mt-7 text-[11px] uppercase tracking-[0.3em] text-taupe">{kicker}</p>
        <h1 className="mt-2 mb-8 font-serif text-3xl font-medium text-hueso">{title}</h1>
        {children}
        {footer && <div className="mt-7 text-sm text-taupe">{footer}</div>}
      </div>
    </main>
  );
}
