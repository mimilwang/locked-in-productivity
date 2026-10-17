import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { GoalUnit, League } from "../lib/types";
import { saveLeague, uniqueInviteCode } from "../lib/leagueStore";

type FormValues = {
  name: string;
  goal: string;
  weeklyTarget: string;
  goalUnit: GoalUnit;
  durationWeeks: string;
  maxMembers: string;
  reward: string;
  punishment: string;
};

type Errors = Partial<Record<keyof FormValues | "photo", string>>;

const initialValues: FormValues = {
  name: "",
  goal: "",
  weeklyTarget: "3",
  goalUnit: "times",
  durationWeeks: "4",
  maxMembers: "10",
  reward: "",
  punishment: "",
};

const MAX_PHOTO_BYTES = 1_000_000; // 1 MB keeps localStorage from filling up

function validate(v: FormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Give your league a name.";
  else if (v.name.trim().length > 40) e.name = "Keep the name under 40 characters.";
  if (!v.goal.trim()) e.goal = "What is everyone working on?";
  const target = Number(v.weeklyTarget);
  if (!Number.isInteger(target) || target < 1) e.weeklyTarget = "Enter a whole number of 1 or more.";
  const members = Number(v.maxMembers);
  if (!Number.isInteger(members) || members < 4 || members > 15)
    e.maxMembers = "Leagues have 4 to 15 members.";
  if (!v.reward.trim()) e.reward = "What does the MVP win?";
  if (!v.punishment.trim()) e.punishment = "What does the Chud have to do?";
  return e;
}

// onCreated is optional: pass it later to navigate to the new league's dashboard.
export default function CreateLeague({ onCreated }: { onCreated?: (league: League) => void }) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [created, setCreated] = useState<League | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handlePhoto(file: File | undefined) {
    setErrors((prev) => ({ ...prev, photo: undefined }));
    if (!file) return setPhotoUrl(undefined);
    if (!file.type.startsWith("image/")) {
      return setErrors((prev) => ({ ...prev, photo: "Choose an image file." }));
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return setErrors((prev) => ({ ...prev, photo: "Choose an image under 1 MB." }));
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(values);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      // Move focus to the first field with a problem.
      const order = ["name", "maxMembers", "goal", "weeklyTarget", "reward", "punishment"];
      const first = order.find((k) => found[k as keyof Errors]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    const league: League = {
      id: crypto.randomUUID(),
      name: values.name.trim(),
      goal: values.goal.trim(),
      weeklyTarget: Number(values.weeklyTarget),
      goalUnit: values.goalUnit,
      durationWeeks: Number(values.durationWeeks),
      startDate: new Date().toISOString().slice(0, 10),
      reward: values.reward.trim(),
      punishment: values.punishment.trim(),
      inviteCode: uniqueInviteCode(),
      photoUrl,
      maxMembers: Number(values.maxMembers),
      createdAt: new Date().toISOString(),
    };

    try {
      saveLeague(league);
      setCreated(league);
    } catch {
      setErrors({ name: "Couldn't save the league. Try a smaller photo or clear old data." });
    }
  }

  if (created) return <SuccessScreen league={created} onContinue={onCreated} />;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Create a league</h1>
      <p className="mt-1 text-neutral-500">Set the goal, the stakes, and invite your crew.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-8">
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Basics</legend>

          <Field id="name" label="League name" error={errors.name}>
            <input
              id="name"
              type="text"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Library Rats"
              maxLength={40}
              {...errorProps("name", errors.name)}
              className={inputClass(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="durationWeeks" label="Duration">
              <select
                id="durationWeeks"
                value={values.durationWeeks}
                onChange={(e) => update("durationWeeks", e.target.value)}
                className={inputClass()}
              >
                <option value="2">2 weeks</option>
                <option value="4">4 weeks</option>
                <option value="8">8 weeks</option>
                <option value="12">12 weeks</option>
              </select>
            </Field>

            <Field id="maxMembers" label="Max members" hint="4 to 15" error={errors.maxMembers}>
              <input
                id="maxMembers"
                type="number"
                min={4}
                max={15}
                value={values.maxMembers}
                onChange={(e) => update("maxMembers", e.target.value)}
                {...errorProps("maxMembers", errors.maxMembers)}
                className={inputClass(errors.maxMembers)}
              />
            </Field>
          </div>

          <Field id="photo" label="League photo" hint="Optional, under 1 MB" error={errors.photo}>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="League photo preview" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-2xl dark:bg-neutral-800">
                  🏆
                </div>
              )}
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhoto(e.target.files?.[0])}
                {...errorProps("photo", errors.photo)}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-2 file:font-medium dark:file:bg-neutral-800"
              />
            </div>
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Group goal</legend>
          <p className="text-sm text-neutral-500">Everyone in the league works toward this same goal each week.</p>

          <Field id="goal" label="Goal" error={errors.goal}>
            <input
              id="goal"
              type="text"
              value={values.goal}
              onChange={(e) => update("goal", e.target.value)}
              placeholder="Study, go to the gym, read…"
              {...errorProps("goal", errors.goal)}
              className={inputClass(errors.goal)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="weeklyTarget" label="Weekly target" error={errors.weeklyTarget}>
              <input
                id="weeklyTarget"
                type="number"
                min={1}
                value={values.weeklyTarget}
                onChange={(e) => update("weeklyTarget", e.target.value)}
                {...errorProps("weeklyTarget", errors.weeklyTarget)}
                className={inputClass(errors.weeklyTarget)}
              />
            </Field>
            <Field id="goalUnit" label="Unit">
              <select
                id="goalUnit"
                value={values.goalUnit}
                onChange={(e) => update("goalUnit", e.target.value as GoalUnit)}
                className={inputClass()}
              >
                <option value="times">times per week</option>
                <option value="minutes">minutes per week</option>
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">The stakes</legend>

          <Field id="reward" label="🥇 MVP reward (1st place)" error={errors.reward}>
            <input
              id="reward"
              type="text"
              value={values.reward}
              onChange={(e) => update("reward", e.target.value)}
              placeholder="Everyone covers their dinner"
              {...errorProps("reward", errors.reward)}
              className={inputClass(errors.reward)}
            />
          </Field>

          <Field id="punishment" label="🫠 Chud punishment (last place)" error={errors.punishment}>
            <input
              id="punishment"
              type="text"
              value={values.punishment}
              onChange={(e) => update("punishment", e.target.value)}
              placeholder="Spins the dare wheel"
              {...errorProps("punishment", errors.punishment)}
              className={inputClass(errors.punishment)}
            />
          </Field>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Create league
        </button>
      </form>
    </main>
  );
}

function SuccessScreen({ league, onContinue }: { league: League; onContinue?: (league: League) => void }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const joinLink = `${window.location.origin}/join?code=${league.inviteCode}`;

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked; the code is still visible on screen.
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>🔒</p>
      <h1 className="mt-4 text-3xl font-bold">{league.name} is live</h1>
      <p className="mt-2 text-neutral-500">Share this code so your friends can join.</p>

      <p className="mt-8 font-mono text-5xl font-bold tracking-[0.3em]" aria-label={`Invite code ${league.inviteCode.split("").join(" ")}`}>
        {league.inviteCode}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button onClick={() => copy(league.inviteCode, "code")} className="rounded-lg border px-4 py-2 font-medium">
          Copy code
        </button>
        <button onClick={() => copy(joinLink, "link")} className="rounded-lg border px-4 py-2 font-medium">
          Copy invite link
        </button>
      </div>
      <p role="status" className="mt-3 h-5 text-sm text-green-600">
        {copied === "code" && "Code copied"}
        {copied === "link" && "Link copied"}
      </p>

      <dl className="mt-8 space-y-2 rounded-lg border p-4 text-left text-sm">
        <Row label="Goal" value={`${league.goal} · ${league.weeklyTarget} ${league.goalUnit}/week`} />
        <Row label="Duration" value={`${league.durationWeeks} weeks`} />
        <Row label="MVP gets" value={league.reward} />
        <Row label="Chud does" value={league.punishment} />
      </dl>

      {onContinue && (
        <button onClick={() => onContinue(league)} className="mt-8 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white dark:bg-white dark:text-black">
          Go to league
        </button>
      )}
    </main>
  );
}

// ---------- small helpers ----------

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {hint && <span className="ml-2 font-normal text-neutral-500">{hint}</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function errorProps(id: string, error?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-transparent px-3 py-2 focus:outline-none focus-visible:ring-2 ${
    error ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-300 focus-visible:ring-black dark:border-neutral-700 dark:focus-visible:ring-white"
  }`;
}
