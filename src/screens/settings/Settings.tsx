import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppNav } from '@/app/AppNav';
import { useData } from '@/app/data-context';
import { MeanderDivider, Plaque, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import { getDensity, applyDensity, type Density } from '@/app/density';
import { useSettings } from './useSettings';
import { useNotifications } from './useNotifications';
import { useInstallPrompt } from './useInstallPrompt';

/**
 * Settings (PRD 6). Two plaques: the profile (display name, timezone, evening threshold
 * that drives at-risk alerts) and notifications (per-device web push, email channel,
 * quiet hours). Everything writes through the DAL via `useSettings`; the push
 * subscription itself is owned by `useNotifications`.
 */
export function Settings() {
  const s = useSettings();
  const push = useNotifications();

  return (
    <div className="min-h-full">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-8">
        <header>
          <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">Your rule</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Settings</h1>
        </header>
        <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

        {s.loading ? (
          <p className="font-serif text-lg text-ink/50">Loading.</p>
        ) : s.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {s.error instanceof Error ? s.error.message : 'Something went wrong.'}
          </p>
        ) : !s.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link to="/auth/sign-in" className="text-pompeian-red hover:underline">
              Sign in
            </Link>{' '}
            to manage your settings.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            <ProfileSection
              displayName={s.profile?.displayName ?? ''}
              timezone={s.profile?.timezone ?? 'UTC'}
              evening={s.profile?.eveningThresholdLocal ?? '20:00'}
              saving={s.savingProfile}
              onSave={(patch) => s.saveProfile(patch)}
            />
            <NotificationsSection
              push={push}
              pushEnabled={s.prefs?.pushEnabled ?? true}
              emailEnabled={s.prefs?.emailEnabled ?? false}
              quietStart={s.prefs?.quietStartLocal ?? ''}
              quietEnd={s.prefs?.quietEndLocal ?? ''}
              saving={s.savingPrefs}
              onSave={(patch) => s.savePrefs(patch)}
            />
            {s.saveError ? (
              <p role="alert" className="font-sans text-sm text-pompeian-red">
                Could not save. Check your connection and try again.
              </p>
            ) : null}
            <DataSection />
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileSection({
  displayName,
  timezone,
  evening,
  saving,
  onSave,
}: {
  displayName: string;
  timezone: string;
  evening: string;
  saving: boolean;
  onSave: (patch: { displayName: string | null; timezone: string; eveningThresholdLocal: string }) => void;
}) {
  const [name, setName] = useState(displayName);
  const [tz, setTz] = useState(timezone);
  const [threshold, setThreshold] = useState(evening);
  useEffect(() => setName(displayName), [displayName]);
  useEffect(() => setTz(timezone), [timezone]);
  useEffect(() => setThreshold(evening), [evening]);

  return (
    <Plaque as="section" className="p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Profile</h2>
      <p className="mt-1 font-serif text-ink/60">
        Your evening threshold is when Cursus checks whether the day is still at risk.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Display name">
          <input
            className={controlClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            maxLength={80}
          />
        </Field>
        <Field label="Evening threshold">
          <input
            type="time"
            className={controlClass}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </Field>
        <Field label="Timezone" hint="IANA name, e.g. Africa/Nairobi">
          <div className="flex gap-2">
            <input
              className={controlClass}
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)}
              className="whitespace-nowrap rounded-plaque border border-ink/25 px-3 font-sans text-xs uppercase tracking-[0.12em] text-ink/70 hover:bg-ink/5"
            >
              Detect
            </button>
          </div>
        </Field>
      </div>
      <div className="mt-6">
        <SealButton
          variant="seal"
          disabled={saving}
          onClick={() =>
            onSave({
              displayName: name.trim() ? name.trim() : null,
              timezone: tz.trim() || 'UTC',
              eveningThresholdLocal: threshold,
            })
          }
        >
          {saving ? 'Saving' : 'Save profile'}
        </SealButton>
      </div>
    </Plaque>
  );
}

function NotificationsSection({
  push,
  pushEnabled,
  emailEnabled,
  quietStart,
  quietEnd,
  saving,
  onSave,
}: {
  push: ReturnType<typeof useNotifications>;
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  saving: boolean;
  onSave: (patch: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    quietStartLocal: string | null;
    quietEndLocal: string | null;
  }) => void;
}) {
  const [pushPref, setPushPref] = useState(pushEnabled);
  const [emailPref, setEmailPref] = useState(emailEnabled);
  const [qStart, setQStart] = useState(quietStart);
  const [qEnd, setQEnd] = useState(quietEnd);
  useEffect(() => setPushPref(pushEnabled), [pushEnabled]);
  useEffect(() => setEmailPref(emailEnabled), [emailEnabled]);
  useEffect(() => setQStart(quietStart), [quietStart]);
  useEffect(() => setQEnd(quietEnd), [quietEnd]);

  return (
    <Plaque as="section" className="p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Notifications</h2>
      <p className="mt-1 font-serif text-ink/60">
        A quiet nudge when the day is still open, and a mark when you reach a milestone.
      </p>

      <div className="mt-6">
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
          Web push on this device
        </p>
        <div className="mt-2">
          <PushControl push={push} />
        </div>
      </div>

      <MeanderDivider tone="text-ochre/40" height={12} className="my-6 max-w-sm" />

      <div className="flex flex-col gap-4">
        <Toggle
          label="Send me alerts"
          hint="Master switch the server honors, across all devices."
          checked={pushPref}
          onChange={setPushPref}
        />
        <Toggle
          label="Also email me"
          hint="A backup nudge if push does not reach you."
          checked={emailPref}
          onChange={setEmailPref}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Quiet hours start">
          <input type="time" className={controlClass} value={qStart} onChange={(e) => setQStart(e.target.value)} />
        </Field>
        <Field label="Quiet hours end">
          <input type="time" className={controlClass} value={qEnd} onChange={(e) => setQEnd(e.target.value)} />
        </Field>
      </div>
      <p className="mt-2 font-serif text-sm text-ink/50">
        No alerts are sent between these times. Leave both blank for none.
      </p>

      <div className="mt-6">
        <SealButton
          variant="seal"
          disabled={saving}
          onClick={() =>
            onSave({
              pushEnabled: pushPref,
              emailEnabled: emailPref,
              quietStartLocal: qStart || null,
              quietEndLocal: qEnd || null,
            })
          }
        >
          {saving ? 'Saving' : 'Save notifications'}
        </SealButton>
      </div>
    </Plaque>
  );
}

function PushControl({ push }: { push: ReturnType<typeof useNotifications> }) {
  if (push.state === 'unsupported') {
    return <p className="font-serif text-ink/60">This browser does not support web push.</p>;
  }
  if (push.state === 'unconfigured') {
    return (
      <p className="font-serif text-ink/60">
        Push is not configured in this build (no VAPID key).
      </p>
    );
  }
  if (push.state === 'denied') {
    return (
      <p className="font-serif text-pompeian-red">
        Notifications are blocked in your browser settings for this site.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {push.state === 'subscribed' ? (
        <>
          <span className="font-sans text-sm text-verdigris">Enabled on this device.</span>
          <SealButton variant="ghost" size="sm" disabled={push.busy} onClick={() => void push.unsubscribe()}>
            {push.busy ? 'Working' : 'Turn off here'}
          </SealButton>
        </>
      ) : (
        <SealButton variant="ochre" size="sm" disabled={push.busy} onClick={() => void push.subscribe()}>
          {push.busy ? 'Working' : 'Enable on this device'}
        </SealButton>
      )}
      {push.error ? <span className="font-sans text-sm text-pompeian-red">{push.error}</span> : null}
    </div>
  );
}

function DensityControl() {
  const [density, setDensity] = useState<Density>(getDensity());
  const choose = (d: Density) => {
    applyDensity(d);
    setDensity(d);
  };
  const opts: { value: Density; label: string }[] = [
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'compact', label: 'Compact' },
  ];
  return (
    <div className="mt-2 inline-flex overflow-hidden rounded-plaque border border-ink/25" role="group" aria-label="Density">
      {opts.map((o) => {
        const active = density === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => choose(o.value)}
            className={cx(
              'px-4 py-1.5 font-sans text-xs uppercase tracking-[0.12em] transition-colors',
              active ? 'bg-ink text-plaster' : 'text-ink/70 hover:bg-ink/5',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function DataSection() {
  const data = useData();
  const install = useInstallPrompt();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      const dump = await data.exportAllData();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cursus-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Plaque as="section" className="p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Your data and app</h2>
      <p className="mt-1 font-serif text-ink/60">
        Everything you have recorded is yours. Take it with you or install Cursus as an app.
      </p>

      <div className="mt-6">
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">Density</p>
        <DensityControl />
      </div>

      <MeanderDivider tone="text-ochre/40" height={12} className="my-6 max-w-sm" />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SealButton variant="egyptian" size="sm" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? 'Preparing' : 'Export my data (JSON)'}
        </SealButton>
        {install.canInstall ? (
          <SealButton variant="ochre" size="sm" onClick={() => void install.promptInstall()}>
            Install Cursus
          </SealButton>
        ) : install.installed ? (
          <span className="font-sans text-sm text-verdigris">Installed as an app.</span>
        ) : null}
        <SealButton variant="ghost" size="sm" onClick={() => void data.signOut()}>
          Sign out
        </SealButton>
      </div>
      {exportError ? (
        <p role="alert" className="mt-3 font-sans text-sm text-pompeian-red">
          Could not build the export. Try again.
        </p>
      ) : null}
    </Plaque>
  );
}

const controlClass =
  'w-full rounded-plaque border border-ink/20 bg-plaster px-3 py-2 font-serif text-ink ' +
  'focus:border-egyptian focus:outline-none focus:ring-1 focus:ring-egyptian';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block font-serif text-xs text-ink/45">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
          checked ? 'border-pompeian-red bg-pompeian-red' : 'border-ink/30 bg-ink/10',
        )}
      >
        <span
          className={cx(
            'block h-5 w-5 rounded-full bg-plaster transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
      <span>
        <span className="font-sans text-sm text-ink">{label}</span>
        {hint ? <span className="block font-serif text-xs text-ink/50">{hint}</span> : null}
      </span>
    </label>
  );
}
