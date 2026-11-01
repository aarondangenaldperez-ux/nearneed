"use client";

import { useMemo, useState } from "react";

const categories = ["All", "Home services", "Tech help", "Learning", "Creative", "Events"];
const services = [
  { id: 1, category: "Home services", icon: "⌂", title: "Home repairs & maintenance", detail: "Find trusted local help for everyday fixes.", price: "Varies by request", tag: "Example category" },
  { id: 2, category: "Tech help", icon: "⌘", title: "Computer & phone support", detail: "Get help setting up, fixing, or learning your devices.", price: "Ask for a quote", tag: "Example category" },
  { id: 3, category: "Learning", icon: "✳", title: "Tutoring & lessons", detail: "Connect with people who can help you learn.", price: "Set by provider", tag: "Example category" },
  { id: 4, category: "Creative", icon: "✎", title: "Design, photo & video", detail: "Find creative support for your next project.", price: "Ask for a quote", tag: "Example category" },
  { id: 5, category: "Events", icon: "✺", title: "Events & celebrations", detail: "Discover local event services and suppliers.", price: "Varies by request", tag: "Example category" },
  { id: 6, category: "Home services", icon: "♧", title: "Cleaning & home care", detail: "Find help for a cleaner, more comfortable space.", price: "Ask for a quote", tag: "Example category" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [need, setNeed] = useState("");
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const filtered = useMemo(() => services.filter((service) =>
    (active === "All" || service.category === active) &&
    (service.title + " " + service.detail + " " + service.category).toLowerCase().includes(query.toLowerCase())
  ), [active, query]);

  function submitNeed(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!need.trim() || !location.trim() || !province.trim()) return;
    setSubmitted(true);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NearNeed home"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></a>
        <nav aria-label="Main navigation"><a href="#explore">Explore</a><a href="#how-it-works">How it works</a><a href="#for-providers">For providers</a></nav>
        <a className="nav-cta" href="#post-need">Preview a request <span>↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> GOOD THINGS HAPPEN LOCALLY</div>
          <h1>Whatever you need,<br /><em>start nearby.</em></h1>
          <p className="hero-lede">From a quick repair to a big idea, find people in your community who can help make it happen.</p>
          <div className="hero-actions"><a className="button button-dark" href="#post-need">Tell us what you need <span>↗</span></a><a className="text-link" href="#explore">Explore services <span>↓</span></a></div>
          <div className="hero-note"><span className="prototype-dot" aria-hidden="true">✳</span><span>Early prototype — no live listings yet</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a local community connecting">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-center"><span className="art-spark">✳</span><strong>near<br />need<span>.</span></strong><small>GOOD HELP, CLOSER</small></div>
          <div className="float-card card-one"><span className="float-icon peach">⌂</span><span><b>Home repair</b><small>Illustrative service example</small></span><span className="float-arrow">↗</span></div>
          <div className="float-card card-two"><span className="float-icon lilac">⌘</span><span><b>Tech support</b><small>Example provider need</small></span></div>
          <div className="float-card card-three"><span className="float-icon mint">✳</span><span><b>Creative projects</b><small>Make something happen</small></span></div>
          <span className="art-star star-a">✳</span><span className="art-star star-b">✦</span>
        </div>
        <div className="hero-bottom"><span>MADE FOR THE WAY WE LIVE LOCALLY</span><span>PHILIPPINES · COMMUNITY FIRST</span></div>
      </section>

      <section className="explore section-wrap" id="explore">
        <div className="section-heading"><div><div className="eyebrow">A GOOD PLACE TO BEGIN</div><h2>What can we help<br /><em>you find?</em></h2></div><p>These are example service categories, not live provider listings. The first pilot area and categories will be selected after customer and provider interviews.</p></div>
        <div className="search-bar"><span>⌕</span><input aria-label="Search services" placeholder="Try “laptop repair” or “event photographer” (demo search)" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>SEARCH</kbd></div>
        <div className="filters" aria-label="Filter service categories">{categories.map((category) => <button key={category} className={active === category ? "filter active" : "filter"} onClick={() => setActive(category)}>{category}</button>)}</div>
        <div className="service-grid">{filtered.map((service) => <article className="service-card" key={service.id}><div className="service-top"><span className="service-icon">{service.icon}</span><span className="service-tag">{service.tag}</span></div><div><div className="service-category">{service.category}</div><h3>{service.title}</h3><p>{service.detail}</p></div><div className="service-foot"><span>{service.price}</span><a href="#post-need" aria-label={"Ask for " + service.title}>↗</a></div></article>)}</div>
        {filtered.length === 0 && <p className="empty-state">No matches yet. Try another search or choose a different category.</p>}
      </section>

      <section className="need-section" id="post-need"><div className="need-inner"><div className="need-copy"><div className="eyebrow eyebrow-light">YOUR NEED IS THE STARTING POINT</div><h2>Got something<br />you <em>need done?</em></h2><p>Describe what you're looking for and where you are. This prototype shows how a request could begin on NearNeed.</p><div className="need-aside"><span>✳</span><p>No complicated search. Just start with what you need.</p></div></div><div className="need-form-card">{submitted ? <div className="success-state" role="status" aria-live="polite"><span className="success-icon">✓</span><h3>Your request preview</h3><div className="request-preview"><p><strong>Need:</strong> {need}</p><p><strong>City / municipality:</strong> {location}</p><p><strong>Province / region:</strong> {province}</p></div><p>This is a local-only demo. Nothing is uploaded, published, or saved. Never include an exact address or personal contact details.</p><button className="button button-dark" onClick={() => { setSubmitted(false); setNeed(""); setLocation(""); setProvince(""); }}>Create another request</button></div> : <form onSubmit={submitNeed}><div className="form-top"><span>01 / START A REQUEST</span><span className="form-spark">✳</span></div><label htmlFor="need">What do you need help with?</label><textarea id="need" placeholder="e.g. I need someone to help design a small business menu..." value={need} onChange={(e) => setNeed(e.target.value)} required rows={4} /><small className="field-hint">Do not include phone numbers, exact addresses, IDs, or other private information.</small><label htmlFor="location">Which city or municipality?</label><input id="location" placeholder="City or municipality" value={location} onChange={(e) => setLocation(e.target.value)} required /><label htmlFor="province">Which province or region?</label><input id="province" placeholder="e.g. Metro Manila (NCR)" value={province} onChange={(e) => setProvince(e.target.value)} required /><button className="button button-dark submit-button" type="submit">Preview my request <span>↗</span></button><small className="form-disclaimer">Preview only — your text is not submitted to a server.</small></form>}</div></div></section>

      <section className="how-section section-wrap" id="how-it-works"><div className="eyebrow">SIMPLE BY DESIGN</div><div className="section-heading how-heading"><h2>From “I need...”<br /><em>to “that's done.”</em></h2><p>A straightforward way to bring people with needs together with people who can help.</p></div><div className="steps"><article><span>01</span><div className="step-icon">✎</div><h3>Say what you need</h3><p>Describe the task, service, or help you're looking for.</p></article><article><span>02</span><div className="step-icon">⌕</div><h3>Find a local match</h3><p>Discover relevant providers and compare their details.</p></article><article><span>03</span><div className="step-icon">↗</div><h3>Connect with confidence</h3><p>Review the details, ask questions, and choose what works.</p></article></div></section>

      <section className="provider-band" id="for-providers"><div><div className="eyebrow">FOR LOCAL PROVIDERS</div><h2>Your skills deserve<br /><em>to be discovered.</em></h2></div><div><p>Are you an independent professional or small business? Provider registration is not open yet. We are validating the first service categories and launch area before inviting providers, so early listings are not mistaken for verified or available services.</p><span className="provider-status">PROVIDER PILOT NOT OPEN</span></div></section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">n</span>nearneed<span className="brand-period">.</span></a><p>Closer connections. Better possibilities.</p><span>EARLY PRODUCT PROTOTYPE · PHILIPPINES</span><span>© 2026 NEARNEED</span></footer>
    </main>
  );
}
