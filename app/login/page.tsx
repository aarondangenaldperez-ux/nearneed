import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, signUp } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; service?: string }>;
};

const messages: Record<string, string> = {
  "sign-in-required": "Sign in to continue.",
  "invalid-registration": "Check your name, email, and password. Use at least 10 characters for your password.",
  "registration-failed": "We couldn't create the account. Check the details or try another email.",
  "invalid-login": "Enter a valid email and password.",
  "login-failed": "We couldn't sign you in. Check your details and try again.",
  "confirmation-failed": "That confirmation link is missing or expired. Request a new one.",
  "pilot-closed": "New pilot accounts are currently closed. Registration is invite-only and managed by the project owner.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedServiceId = params.service ?? "";
  const serviceId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedServiceId)
    ? requestedServiceId
    : "";

  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <Link className="brand" href="/"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></Link>
          <span className="eyebrow">ACCOUNT SETUP</span>
          <h1>Authentication is not connected yet.</h1>
          <p>NearNeed&apos;s account flow is prepared, but it needs a Supabase project URL and publishable key before it can create or sign in to accounts.</p>
          <Link className="button button-dark" href="/">Back to NearNeed</Link>
          <p className="auth-footnote">Do not send database passwords or secret keys in chat. Only the public publishable key belongs in the NEXT_PUBLIC environment variable.</p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const registrationOpen = Boolean(process.env.NEED_PILOT_INVITE_CODE);

  if (user) {
    redirect(serviceId ? "/dashboard?service=" + encodeURIComponent(serviceId) : "/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></Link>
        <span className="eyebrow">EARLY PILOT ACCESS</span>
        <h1>Welcome to NearNeed.</h1>
        <p>Access is restricted to adults explicitly invited into a controlled pilot. Do not register if you are under 18.</p>
        {params.message === "check-email" && <p className="notice notice-success" role="status">Check your email for the confirmation link before signing in.</p>}
        {params.error && <p className="notice notice-error" role="alert">{messages[params.error] ?? "Something went wrong. Please try again."}</p>}
        <div className="auth-columns">
          <form action={signIn} className="auth-form">
            <h2>Sign in</h2>
            <input type="hidden" name="serviceId" value={serviceId} />
            <label htmlFor="signin-email">Email</label>
            <input id="signin-email" name="email" type="email" autoComplete="email" maxLength={254} required />
            <label htmlFor="signin-password">Password</label>
            <input id="signin-password" name="password" type="password" autoComplete="current-password" required />
            <button className="button button-dark" type="submit">Sign in <span>↗</span></button>
          </form>
          {registrationOpen ? <form action={signUp} className="auth-form">
            <h2>Create account</h2>
            <label htmlFor="signup-name">Display name</label>
            <input id="signup-name" name="displayName" autoComplete="name" minLength={2} maxLength={60} required />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required />
            <label htmlFor="signup-invite">Pilot invitation code</label>
            <input id="signup-invite" name="inviteCode" type="password" autoComplete="off" maxLength={256} required />
            <label htmlFor="signup-password">Password (10+ characters)</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
            <button className="button button-dark" type="submit">Create account <span>↗</span></button>
          </form> : <div className="auth-form"><h2>Registration closed</h2><p>New accounts are invite-only. The project owner must configure the private pilot invite before registration can open.</p></div>}
        </div>
        <p className="auth-footnote">Never add an exact home address, government ID, phone number, or payment details to a public request. Pilot accounts and provider listings are not endorsements or safety guarantees.</p>
        <Link className="text-link" href="/">← Back to homepage</Link>
      </section>
    </main>
  );
}
