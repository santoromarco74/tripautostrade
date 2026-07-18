// Edge Function: elimina definitivamente l'account dell'utente che la chiama
// e tutti i suoi dati (requisito Google Play per le app con registrazione).
//
// Va chiamata dall'app con supabase.functions.invoke('delete-account'):
// il JWT dell'utente autenticato viaggia nell'header Authorization e identifica
// chi eliminare — non accetta parametri, quindi un utente può cancellare solo
// se stesso.
//
// Deploy:  supabase functions deploy delete-account
// (SENZA --no-verify-jwt: a chiamarla è l'utente loggato, il gateway verifica il token)

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Identifica l'utente dal JWT della richiesta
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role: bypassa RLS per eliminare tutto ciò che appartiene all'utente
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Recensioni dell'utente: servono gli id (per like/segnalazioni ricevuti)
    // e le foto da rimuovere dallo storage
    const { data: reviews, error: reviewsError } = await admin
      .from('reviews')
      .select('id, image_url')
      .eq('user_id', user.id);
    if (reviewsError) throw new Error(reviewsError.message);

    const reviewIds = (reviews ?? []).map((r) => r.id);

    // Foto: dall'URL pubblico al path nel bucket review-photos
    const photoPaths = (reviews ?? [])
      .map((r) => r.image_url?.split('/review-photos/')[1])
      .filter((p): p is string => !!p);
    if (photoPaths.length > 0) {
      await admin.storage.from('review-photos').remove(photoPaths);
    }

    // Segnalazioni fatte dall'utente e ricevute sulle sue recensioni
    await admin.from('review_reports').delete().eq('reporter_id', user.id);
    if (reviewIds.length > 0) {
      await admin.from('review_reports').delete().in('review_id', reviewIds);
    }

    // Like dati dall'utente e ricevuti sulle sue recensioni
    // (il trigger update_user_points sistema i punti degli altri autori)
    await admin.from('review_likes').delete().eq('user_id', user.id);
    if (reviewIds.length > 0) {
      await admin.from('review_likes').delete().in('review_id', reviewIds);
    }

    // Recensioni, preferiti, profilo
    const { error: delReviewsError } = await admin
      .from('reviews').delete().eq('user_id', user.id);
    if (delReviewsError) throw new Error(delReviewsError.message);

    await admin.from('favorites').delete().eq('user_id', user.id);

    // Blocchi creati dall'utente e blocchi che lo riguardano
    await admin.from('blocked_users').delete().eq('blocker_id', user.id);
    await admin.from('blocked_users').delete().eq('blocked_id', user.id);

    const { error: delProfileError } = await admin
      .from('profiles').delete().eq('id', user.id);
    if (delProfileError) throw new Error(delProfileError.message);

    // Infine l'utente auth
    const { error: delUserError } = await admin.auth.admin.deleteUser(user.id);
    if (delUserError) throw new Error(delUserError.message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
