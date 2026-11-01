import Link from "next/link";
import { redirect } from "next/navigation";
import { addProviderService, closeRequest, createRequest, decideQuote, saveProviderProfile, setProviderServiceStatus, signOut, submitQuote } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type DashboardProps = {
  searchParams: Promise<{ error?: string; message?: string; service?: string }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const notices: Record<string, string> = {
  "request-created": "Your request was published to eligible providers.",
  "provider-profile-saved": "Your provider profile is published. This is self-published, not identity-verified.",
  "service-added": "Your service listing is active and may appear in matching requests.",
  "quote-sent": "Your offer was sent.",
  "offer-updated": "The offer decision was saved.",
  "request-closed": "Your request was closed.",
  "service-status-updated": "Your service listing status was updated.",
};

const errors: Record<string, string> = {
  "invalid-request": "Check the request fields and budget range.",
  "request-failed": "We couldn't publish that request. Check that your profile and database setup are ready.",
  "invalid-provider": "Add a public name and service area.",
  "provider-profile-failed": "We couldn't save the provider profile.",
  "invalid-service": "Check the service details and category.",
  "service-failed": "We couldn't publish the service. Save your provider profile first.",
  "service-status-failed": "We couldn't change that listing. Refresh and try again.",
  "invalid-quote": "Check the offer message, amount, and estimated days.",
  "quote-failed": "We couldn't send that offer. You may have already sent one, or this request may no longer be open.",
  "invalid-decision": "That offer decision is invalid.",
  "decision-failed": "We couldn't update the offer. It may already have changed.",
  "request-close-failed": "We couldn't close the request.",
};

function money(value: number | string | null): string {
  if (value === null || value === undefined || value === "") return "Not specified";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value));
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const requestedServiceId = typeof params.service === "string" && UUID_PATTERN.test(params.service)
    ? params.service
    : "";

  if (!isSupabaseConfigured()) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-shell">
          <Link className="brand" href="/"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></Link>
          <h1>Connect the database to open the dashboard.</h1>
          <p>The dashboard is prepared, but sign-in and live data are disabled until the Supabase project is configured.</p>
          <Link className="button button-dark" href="/login">Account setup</Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(requestedServiceId
      ? "/login?error=sign-in-required&service=" + encodeURIComponent(requestedServiceId)
      : "/login?error=sign-in-required");
  }

  const [
    categoriesResult,
    ownRequestsResult,
    providerProfileResult,
    providerServicesResult,
    selectedServiceResult,
  ] = await Promise.all([
    supabase.from("service_categories").select("id,name").eq("is_active", true).order("name"),
    supabase.from("need_requests").select("id,title,description,city,province,status,created_at,budget_min,budget_max,service_categories(name),quotes(id,status,message,price_amount,pricing_note,estimated_days,provider_profiles(public_name,business_name))").eq("customer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("provider_profiles").select("public_name,business_name,about,city,province,is_published").eq("user_id", user.id).maybeSingle(),
    supabase.from("provider_services").select("id,title,description,city,province,is_active,price_from,pricing_note,service_categories(name)").eq("provider_id", user.id).order("created_at", { ascending: false }),
    requestedServiceId
      ? supabase.from("provider_services").select("id,provider_id,title,category_id,city,province").eq("id", requestedServiceId).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const categories = categoriesResult.data ?? [];
  const ownRequests = ownRequestsResult.data ?? [];
  const providerProfile = providerProfileResult.data;
  const providerServices = providerServicesResult.data ?? [];
  const selectedServiceRow = selectedServiceResult.data;

  const selectedProviderResult = selectedServiceRow
    ? await supabase.from("provider_profiles").select("user_id").eq("user_id", selectedServiceRow.provider_id).eq("is_published", true).maybeSingle()
    : null;
  const selectedService = selectedServiceRow &&
    selectedProviderResult?.data &&
    categories.some((category) => category.id === selectedServiceRow.category_id)
      ? selectedServiceRow
      : null;

  const feedResult = providerProfile?.is_published
    ? await supabase.from("need_requests").select("id,title,description,city,province,budget_min,budget_max,created_at,service_categories(name)").eq("status", "open").neq("customer_id", user.id).order("created_at", { ascending: false }).limit(30)
    : { data: [], error: null };
  const feed = feedResult.data ?? [];

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <Link className="brand" href="/"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></Link>
        <div className="dashboard-user"><span>{user.email}</span><form action={signOut}><button className="text-button" type="submit">Sign out</button></form></div>
      </header>

      <div className="dashboard-shell">
        <div className="dashboard-heading">
          <div><span className="eyebrow">YOUR NEARNEED WORKSPACE</span><h1>Good to see you.</h1><p>Manage your requests and provider activity in one place.</p></div>
          <span className="pilot-chip">CONTROLLED PILOT</span>
        </div>

        {params.message && notices[params.message] && <p className="notice notice-success" role="status">{notices[params.message]}</p>}
        {params.error && <p className="notice notice-error" role="alert">{errors[params.error] ?? "Something went wrong. Check your details and try again."}</p>}

        <section className="dashboard-card">
          <div className="dashboard-section-heading"><div><span className="eyebrow">CUSTOMER</span><h2>Post a request</h2></div><p>Describe the task without sharing private contact details or an exact address.</p></div>
          {selectedService ? <p className="provider-notice" role="status"><strong>Starting from: {selectedService.title}</strong> · {selectedService.city}, {selectedService.province}. Your request will be visible to eligible providers matching this category and area. It does not message, reserve, or guarantee work from the selected provider.</p> : requestedServiceId ? <p className="notice notice-error" role="alert">That service is no longer published or available. You can still create a general request.</p> : null}
          <form action={createRequest} className="dashboard-form">
            <label htmlFor="request-title">What do you need?</label>
            <input id="request-title" name="title" minLength={8} maxLength={120} defaultValue={selectedService ? ("Help with: " + selectedService.title).slice(0, 120) : ""} placeholder="e.g. Design a simple menu for a small café" required />
            <label htmlFor="request-description">Describe the task</label>
            <textarea id="request-description" name="description" minLength={20} maxLength={2000} rows={4} placeholder={selectedService ? "Describe the specific work you need and any important details. Do not include personal contact details or an exact address." : "Include the work needed, useful context, and what a good result looks like. Do not include your phone number, precise address, IDs, or payment details."} required />
            <div className="form-grid">
              <div><label htmlFor="request-category">Category</label><select id="request-category" name="categoryId" defaultValue={selectedService?.category_id ?? ""}><option value="">Not sure yet</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
              <div><label htmlFor="request-city">City / municipality</label><input id="request-city" name="city" minLength={2} maxLength={100} defaultValue={selectedService?.city ?? ""} required /></div>
              <div><label htmlFor="request-province">Province / region</label><input id="request-province" name="province" minLength={2} maxLength={100} defaultValue={selectedService?.province ?? ""} required /></div>
              <div><label htmlFor="request-budget-min">Minimum budget (PHP)</label><input id="request-budget-min" name="budgetMin" type="number" min="0" step="0.01" inputMode="decimal" /></div>
              <div><label htmlFor="request-budget-max">Maximum budget (PHP)</label><input id="request-budget-max" name="budgetMax" type="number" min="0" step="0.01" inputMode="decimal" /></div>
            </div>
            <button className="button button-dark" type="submit">Publish request <span>↗</span></button>
            <small className="field-hint">Requests are visible only to you and eligible signed-in providers under the database access rules.</small>
          </form>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>Your requests and offers</h2></div><span className="count-chip">{ownRequests.length} requests</span></div>
          {ownRequests.length === 0 ? <p className="empty-dashboard">No requests yet. Publish your first request when you are ready.</p> : <div className="dashboard-list">
            {ownRequests.map((request) => <article className="request-item" key={request.id}>
              <div className="request-item-head"><div><span className="eyebrow">{request.city}, {request.province}</span><h3>{request.title}</h3></div><span className="status-chip">{request.status}</span></div>
              <p>{request.description}</p>
              <div className="request-meta"><span>Budget: {money(request.budget_min)} – {money(request.budget_max)}</span><span>{request.quotes?.length ?? 0} offers</span></div>
              {request.quotes?.length > 0 && <div className="quote-list">{request.quotes.map((quote) => <div className="quote-item" key={quote.id}>
                <div><strong>{quote.provider_profiles?.[0]?.business_name || quote.provider_profiles?.[0]?.public_name || "Local provider"}</strong><span className="status-chip">{quote.status}</span></div>
                <p>{quote.message}</p>
                <div className="request-meta"><span>{money(quote.price_amount)} {quote.pricing_note ? `· ${quote.pricing_note}` : ""}</span><span>{quote.estimated_days === null ? "Timing not stated" : `${quote.estimated_days} days estimate`}</span></div>
                {request.status === "open" && quote.status === "sent" && <form action={decideQuote} className="inline-actions"><input type="hidden" name="quoteId" value={quote.id} /><button className="small-button" name="decision" value="accepted" type="submit">Accept offer</button><button className="small-button secondary" name="decision" value="declined" type="submit">Decline</button></form>}
              </div>)}</div>}
              {request.status === "open" && <form action={closeRequest} className="inline-actions"><input type="hidden" name="requestId" value={request.id} /><button className="small-button secondary" type="submit">Close request</button></form>}
            </article>)}
          </div>}
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-heading"><div><span className="eyebrow">PROVIDER</span><h2>Your provider profile</h2></div><span className="status-chip">{providerProfile?.is_published ? "Published · self-declared" : "Not published"}</span></div>
          <p className="provider-notice">Publishing a profile does not mean NearNeed has verified your identity, qualifications, or service quality. Do not use false credentials or claim work you are not qualified to perform.</p>
          <form action={saveProviderProfile} className="dashboard-form">
            <label htmlFor="public-name">Public name</label><input id="public-name" name="publicName" minLength={2} maxLength={60} defaultValue={providerProfile?.public_name ?? ""} required />
            <label htmlFor="business-name">Business name (optional)</label><input id="business-name" name="businessName" maxLength={100} defaultValue={providerProfile?.business_name ?? ""} />
            <label htmlFor="provider-about">About your service (optional)</label><textarea id="provider-about" name="about" maxLength={700} rows={3} defaultValue={providerProfile?.about ?? ""} />
            <div className="form-grid">
              <div><label htmlFor="provider-city">Service city / municipality</label><input id="provider-city" name="providerCity" defaultValue={providerProfile?.city ?? ""} minLength={2} maxLength={100} required /></div>
              <div><label htmlFor="provider-province">Service province / region</label><input id="provider-province" name="providerProvince" defaultValue={providerProfile?.province ?? ""} minLength={2} maxLength={100} required /></div>
            </div>
            <button className="button button-dark" type="submit">Save and publish profile</button>
          </form>

          {providerProfile?.is_published && <div className="provider-services">
            <h3>Your service listings</h3>
            {providerServices.length > 0 ? <ul className="simple-list">{providerServices.map((service) => <li key={service.id}><span>{service.title} · {service.city}, {service.province}<small>{service.price_from === null ? "Price on request" : "From " + money(service.price_from)}{service.pricing_note ? " · " + service.pricing_note : ""}</small></span><form action={setProviderServiceStatus}><input type="hidden" name="serviceId" value={service.id} /><input type="hidden" name="status" value={service.is_active ? "paused" : "active"} /><button className="small-button secondary" type="submit">{service.is_active ? "Pause" : "Reactivate"}</button></form></li>)}</ul> : <p className="empty-dashboard">No service listings yet.</p>}
            <form action={addProviderService} className="dashboard-form">
              <h3>Add a service</h3>
              <label htmlFor="service-title">Service title</label><input id="service-title" name="serviceTitle" minLength={4} maxLength={100} required />
              <label htmlFor="service-description">Describe what you offer</label><textarea id="service-description" name="serviceDescription" minLength={20} maxLength={1200} rows={3} required />
              <div className="form-grid">
                <div><label htmlFor="service-category">Category</label><select id="service-category" name="categoryId" required defaultValue=""><option value="" disabled>Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                <div><label htmlFor="service-mode">How is it delivered?</label><select id="service-mode" name="serviceMode" defaultValue="in_person"><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Online and in person</option></select></div>
                <div><label htmlFor="service-price-from">Starting price (PHP, optional)</label><input id="service-price-from" name="servicePriceFrom" type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" /></div>
                <div><label htmlFor="service-pricing-note">Pricing note (optional)</label><input id="service-pricing-note" name="servicePricingNote" maxLength={120} placeholder="e.g. Depends on project scope" /></div>
                <div><label htmlFor="service-city">Service city / municipality</label><input id="service-city" name="serviceCity" minLength={2} maxLength={100} defaultValue={providerProfile.city} required /></div>
                <div><label htmlFor="service-province">Service province / region</label><input id="service-province" name="serviceProvince" minLength={2} maxLength={100} defaultValue={providerProfile.province} required /></div>
              </div>
              <button className="button button-dark" type="submit">Publish service <span>↗</span></button>
            </form>
          </div>}
        </section>

        {providerProfile?.is_published && <section className="dashboard-card">
          <div className="dashboard-section-heading"><div><span className="eyebrow">LOCAL OPPORTUNITIES</span><h2>Requests matching your service area</h2></div><span className="count-chip">{feed.length} open requests</span></div>
          {feed.length === 0 ? <p className="empty-dashboard">No matching open requests right now. Your feed is limited to the service area and categories you publish.</p> : <div className="dashboard-list">
            {feed.map((request) => <article className="request-item" key={request.id}>
              <div className="request-item-head"><div><span className="eyebrow">{request.city}, {request.province}</span><h3>{request.title}</h3></div></div>
              <p>{request.description}</p>
              <div className="request-meta"><span>Budget: {money(request.budget_min)} – {money(request.budget_max)}</span><span>{request.service_categories?.[0]?.name ?? "Uncategorised"}</span></div>
              <form action={submitQuote} className="dashboard-form quote-form">
                <input type="hidden" name="requestId" value={request.id} />
                <label htmlFor={`quote-message-${request.id}`}>Your offer</label><textarea id={`quote-message-${request.id}`} name="quoteMessage" minLength={20} maxLength={1500} rows={3} placeholder="Explain what you can deliver and any important limits." required />
                <div className="form-grid">
                  <div><label htmlFor={`quote-price-${request.id}`}>Offer amount (PHP)</label><input id={`quote-price-${request.id}`} name="priceAmount" type="number" min="0" step="0.01" /></div>
                  <div><label htmlFor={`quote-note-${request.id}`}>Pricing note</label><input id={`quote-note-${request.id}`} name="pricingNote" maxLength={200} placeholder="e.g. Materials billed separately" /></div>
                  <div><label htmlFor={`quote-days-${request.id}`}>Estimated days</label><input id={`quote-days-${request.id}`} name="estimatedDays" type="number" min="0" max="365" step="1" /></div>
                </div>
                <button className="button button-dark" type="submit">Send offer <span>↗</span></button>
              </form>
            </article>)}
          </div>}
        </section>}

        <p className="dashboard-footnote">NearNeed is an early matching platform, not a guarantee of provider identity, qualifications, safety, or job quality. Use responsible adult oversight for the controlled pilot. Do not arrange unsafe meetings or share private information through public listings.</p>
      </div>
    </main>
  );
}
