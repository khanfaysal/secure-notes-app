import { useState } from "react";
import { api, saveSession } from "../api";

const parseInterests = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function AuthPanel({ onAuthenticated, onNotice }) {
  const [busy, setBusy] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        auth: false,
        body: { email: values.email, password: values.password },
      });
      saveSession(session);
      onAuthenticated(session);
      onNotice(`Signed in as ${session.user.name}.`);
      form.reset();
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function submitRegistration(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        auth: false,
        body: {
          name: values.name,
          email: values.email,
          password: values.password,
          interests: parseInterests(values.interests || ""),
        },
      });
      onNotice("Account created. Sign in to continue.");
      form.reset();
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <form className="space-y-3 rounded border bg-white p-4" onSubmit={submitLogin}>
        <h2 className="font-semibold">Sign in</h2>
        <label className="block text-sm">Email
          <input className="mt-1 w-full rounded border p-2" name="email" required type="email" />
        </label>
        <label className="block text-sm">Password
          <input className="mt-1 w-full rounded border p-2" name="password" required type="password" />
        </label>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy}>
          Sign in
        </button>
      </form>

      <form className="space-y-3 rounded border bg-white p-4" onSubmit={submitRegistration}>
        <h2 className="font-semibold">Register</h2>
        <label className="block text-sm">Name
          <input className="mt-1 w-full rounded border p-2" maxLength="100" name="name" required />
        </label>
        <label className="block text-sm">Email
          <input className="mt-1 w-full rounded border p-2" name="email" required type="email" />
        </label>
        <label className="block text-sm">Password
          <input className="mt-1 w-full rounded border p-2" maxLength="72" minLength="8" name="password" required type="password" />
        </label>
        <label className="block text-sm">Interests (comma-separated)
          <input className="mt-1 w-full rounded border p-2" name="interests" placeholder="reading, chess" />
        </label>
        <button className="rounded border px-4 py-2 text-sm disabled:opacity-50" disabled={busy}>
          Create account
        </button>
      </form>
    </section>
  );
}
