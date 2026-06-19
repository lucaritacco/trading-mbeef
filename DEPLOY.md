# Cómo publicar DeCarnes en internet (Vercel)

Sí: el deploy se hace **desde GitHub**. Vercel se conecta a tu repo y cada vez
que subís cambios (`git push`), actualiza la web sola. Es gratis para empezar.

> ⚠️ Importante: el código de la app está en la **subcarpeta `decarnes/`** dentro
> del repo. En el paso 3 hay que decirle eso a Vercel (Root Directory).

## Paso a paso

1. Entrá a **https://vercel.com** y registrate con tu cuenta de **GitHub**
   (botón "Continue with GitHub").
2. **Add New… → Project**. Te muestra tus repos de GitHub. Elegí
   **`trading-mbeef`** → **Import**.
3. En la pantalla de configuración:
   - **Root Directory**: clic en **Edit** y poné **`decarnes`** (la subcarpeta).
     *(Esto es lo más fácil de olvidar.)*
   - **Framework Preset**: debería detectar **Next.js** solo.
4. Abrí **Environment Variables** y agregá estas tres (las mismas de tu
   `.env.local`, más la URL del sitio):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://krfknfgrdafipwyfvwwa.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key (la de `.env.local`) |
   | `NEXT_PUBLIC_SITE_URL` | la URL que te va a dar Vercel (ver nota abajo) |

   > Para `NEXT_PUBLIC_SITE_URL`: en el primer deploy todavía no sabés la URL.
   > Podés dejarla vacía la primera vez, y después de publicar Vercel te da una
   > dirección tipo `https://trading-mbeef.vercel.app`. Volvé a
   > **Settings → Environment Variables**, cargala, y hacé **Redeploy**.
   > (Sirve para que la preview de WhatsApp use la dirección correcta.)

5. Botón **Deploy**. En 1-2 minutos te da la web online. 🎉

## Después del primer deploy

- **Probá todo en la URL de Vercel**: landing, `/publicar`, `/panel/login`.
- **Login del panel en producción**: andá a Supabase → **Authentication → URL
  Configuration** y agregá tu dominio de Vercel en **Site URL** y en
  **Redirect URLs** (por las dudas). Con login por contraseña suele andar igual,
  pero es la práctica recomendada.
- Cada cambio que subas a `main` en GitHub se publica solo.

## Lo que NO se sube (y está bien)
- `.env.local` queda en tu compu (lo ignora git). Por eso las credenciales se
  cargan a mano en Vercel (paso 4). Eso es lo correcto y seguro.

## Recordá antes de mostrarlo al público
Ver `NOCHE.md` y el repaso de pendientes: notificación al equipo, datos reales
de MBEEF (fotos, CUIT, historia), y la redacción de la garantía de cobro.
