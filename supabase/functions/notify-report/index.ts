// Edge Function: avvisa l'admin quando arriva una segnalazione su una recensione.
//
// Va collegata a un Database Webhook su INSERT nella tabella review_reports
// (dashboard Supabase → Database → Webhooks). Il payload contiene la riga in
// `record`. Invia una notifica push all'admin (token letto da profiles).
//
// Deploy:  supabase functions deploy notify-report --no-verify-jwt
//
// Config (Supabase → Edge Functions → Secrets):
//   ADMIN_USER_ID        = id (uuid) del profilo admin a cui mandare la push
//   NOTIFY_REPORT_SECRET = stringa casuale (opzionale ma consigliata) — se
//                          impostata, il webhook deve inviare l'header
//                          x-webhook-secret con lo stesso valore, altrimenti 401.
//
// L'admin riceve la push solo se ha un push_token valido in profiles (cioè ha
// aperto l'app da una build ed è loggato). In ogni caso la segnalazione resta
// in review_reports e (a soglia) scatta l'auto-nascondi lato DB.

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Segreto condiviso col Database Webhook (se configurato)
    const secret = Deno.env.get('NOTIFY_REPORT_SECRET');
    if (secret && req.headers.get('x-webhook-secret') !== secret) {
      return new Response('unauthorized', { status: 401 });
    }

    const payload = await req.json();
    const report = payload.record as
      | { review_id: number; reporter_id: string; reason?: string; details?: string }
      | undefined;
    if (!report?.review_id) {
      return new Response('payload non valido', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const adminId = Deno.env.get('ADMIN_USER_ID');
    if (!adminId) return new Response('ADMIN_USER_ID non impostato');

    const { data: admin } = await supabase
      .from('profiles').select('push_token').eq('id', adminId).single();
    if (!admin?.push_token) return new Response('ok'); // admin senza token: niente push

    // Estratto della recensione segnalata
    const { data: review } = await supabase
      .from('reviews').select('comment').eq('id', report.review_id).single();
    const snippet = (review?.comment ?? '').slice(0, 80);

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: admin.push_token,
        title: '🚩 Nuova segnalazione',
        body: `Motivo: ${report.reason ?? 'n/d'}${snippet ? ` — "${snippet}"` : ''}`,
        sound: 'default',
      }),
    });

    return new Response(await res.text(), { status: res.status });
  } catch (err) {
    return new Response(`errore: ${err}`, { status: 500 });
  }
});
