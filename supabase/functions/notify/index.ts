// supabase/functions/notify/index.ts
//
// Cursus alert pipeline (PRD 6). Invoked hourly by pg_cron via pg_net. It asks the
// server-authoritative `notification_queue` SQL function who is due RIGHT NOW (evening
// threshold reached, not in quiet hours, a required daily rule still open, or a milestone
// day held), then fans out web push and email. All the "who and when" logic is in SQL;
// this function only delivers.
//
// Deploy (Supabase Dashboard -> Edge Functions -> new function "notify", paste this),
// then set these Function secrets:
//   CRON_SECRET            shared secret; must match the Bearer the cron sends
//   VAPID_PUBLIC_KEY       web-push VAPID public key
//   VAPID_PRIVATE_KEY      web-push VAPID private key
//   VAPID_SUBJECT          e.g. mailto:you@yourdomain (contact for push services)
//   RESEND_API_KEY         Resend API key (email channel)
//   RESEND_FROM            verified sender, e.g. "Cursus <alerts@yourdomain>"
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface QueueRow {
  user_id: string;
  email: string | null;
  kind: 'at_risk' | 'milestone';
  challenge_id: string;
  challenge_name: string;
  day_number: number;
  missing_count: number;
  push_enabled: boolean;
  email_enabled: boolean;
  endpoint: string | null;
  keys: { p256dh: string; auth: string } | null;
}

const env = (k: string) => Deno.env.get(k) ?? '';

function messageFor(row: QueueRow): { title: string; body: string; url: string } {
  if (row.kind === 'milestone') {
    return {
      title: `Day ${row.day_number} held`,
      body: `${row.challenge_name}: you reached day ${row.day_number}. A milestone.`,
      url: `/calendar/${row.challenge_id}`,
    };
  }
  const n = row.missing_count;
  return {
    title: 'The day is still open',
    body: `${row.challenge_name}: ${n} ${n === 1 ? 'rule' : 'rules'} left before midnight.`,
    url: '/',
  };
}

Deno.serve(async (req) => {
  // AuthN: only our cron may call this.
  const auth = req.headers.get('authorization') ?? '';
  const secret = env('CRON_SECRET');
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.rpc('notification_queue');
  if (error) {
    console.error('notification_queue failed', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows = (data ?? []) as QueueRow[];

  webpush.setVapidDetails(
    env('VAPID_SUBJECT') || 'mailto:alerts@example.com',
    env('VAPID_PUBLIC_KEY'),
    env('VAPID_PRIVATE_KEY'),
  );

  let pushSent = 0;
  let pushPruned = 0;
  const emailByUser = new Map<string, QueueRow>();

  for (const row of rows) {
    // Web push: one message per live subscription.
    if (row.push_enabled && row.endpoint && row.keys) {
      const msg = messageFor(row);
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: row.keys },
          JSON.stringify(msg),
        );
        pushSent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription is dead; prune it so we stop trying.
          await admin.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
          pushPruned++;
        } else {
          console.error('push failed', status, (err as Error).message);
        }
      }
    }
    // Email: at most one per user (first due row wins), if they opted in.
    if (row.email_enabled && row.email && !emailByUser.has(row.user_id)) {
      emailByUser.set(row.user_id, row);
    }
  }

  let emailSent = 0;
  const resendKey = env('RESEND_API_KEY');
  const resendFrom = env('RESEND_FROM');
  if (resendKey && resendFrom) {
    for (const row of emailByUser.values()) {
      const msg = messageFor(row);
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: resendFrom,
            to: row.email,
            subject: `Cursus - ${msg.title}`,
            html: `<p>${msg.body}</p><p style="color:#6b6b6b">Open Cursus to continue.</p>`,
          }),
        });
        if (res.ok) emailSent++;
        else console.error('resend failed', res.status, await res.text());
      } catch (err) {
        console.error('resend error', (err as Error).message);
      }
    }
  }

  const summary = { candidates: rows.length, pushSent, pushPruned, emailSent };
  console.log('notify run', JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
