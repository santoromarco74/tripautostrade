// Edge Function: invia una notifica push quando una recensione riceve un like.
//
// Va collegata a un Database Webhook su INSERT nella tabella review_likes
// (dashboard Supabase → Database → Webhooks). Il payload del webhook contiene
// la riga inserita in `record`.
//
// Deploy:  supabase functions deploy notify-like --no-verify-jwt
// (--no-verify-jwt perché a chiamarla è il webhook interno, non un utente)

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const like = payload.record as { review_id: string; user_id: string } | undefined;
    if (!like?.review_id) {
      return new Response('payload non valido', { status: 400 });
    }

    // Service role: bypassa RLS per leggere token e dati necessari
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Recensione → autore
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id, comment')
      .eq('id', like.review_id)
      .single();
    if (!review?.user_id) return new Response('ok');

    // Niente notifica se l'utente mette like alla propria recensione
    if (review.user_id === like.user_id) return new Response('ok');

    // Token push dell'autore
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', review.user_id)
      .single();
    if (!profile?.push_token) return new Response('ok');

    // Nome di chi ha messo like
    const { data: liker } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', like.user_id)
      .single();
    const nome = liker?.full_name ?? 'Un viaggiatore';

    // Invio tramite il servizio push di Expo
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.push_token,
        title: '❤️ Nuovo Mi Piace!',
        body: `${nome} ha trovato utile la tua recensione`,
        sound: 'default',
      }),
    });

    return new Response(await res.text(), { status: res.status });
  } catch (err) {
    return new Response(`errore: ${err}`, { status: 500 });
  }
});
