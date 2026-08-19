import { NextResponse } from "next/server";
import { correrRecordatorios } from "@/lib/activacion";

// Recordatorios a los frigoríficos verificados que siguen sin publicar.
// Lo dispara Vercel Cron (ver vercel.json), que manda el CRON_SECRET en el
// Authorization. Sin secreto configurado la ruta queda cerrada.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }

  const [h24, h72] = [await correrRecordatorios("24h"), await correrRecordatorios("72h")];
  return NextResponse.json({ ok: true, "24h": h24, "72h": h72 });
}
