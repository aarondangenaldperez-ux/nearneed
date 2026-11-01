"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string, maxLength: number): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim().slice(0, maxLength) : "";
}

function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function signedInUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?error=sign-in-required");
  }

  return { supabase, user: data.user };
}

export async function signUp(formData: FormData) {
  const displayName = value(formData, "displayName", 60);
  const email = value(formData, "email", 254).toLowerCase();
  const password = value(formData, "password", 128);
  const inviteCode = value(formData, "inviteCode", 256);
  const expectedCode = process.env.NEED_PILOT_INVITE_CODE;
  const inviteBytes = Buffer.from(inviteCode);
  const expectedBytes = Buffer.from(expectedCode ?? "");
  const validInvite = Boolean(
    expectedCode &&
    inviteBytes.length > 0 &&
    inviteBytes.length === expectedBytes.length &&
    timingSafeEqual(inviteBytes, expectedBytes)
  );

  if (displayName.length < 2 || !emailLooksValid(email) || password.length < 10 || !validInvite) {
    redirect("/login?error=invalid-registration");
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: { display_name: displayName },
    },
  });

  if (error) {
    redirect("/login?error=registration-failed");
  }

  if (!data.session) {
    redirect("/login?message=check-email");
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email", 254).toLowerCase();
  const password = value(formData, "password", 128);

  if (!emailLooksValid(email) || !password) {
    redirect("/login?error=invalid-login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=login-failed");
  }

  redirect("/dashboard");
}

export async function signOut() {
  const { supabase } = await signedInUser();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createRequest(formData: FormData) {
  const { supabase, user } = await signedInUser();

  const title = value(formData, "title", 120);
  const description = value(formData, "description", 2000);
  const city = value(formData, "city", 100);
  const province = value(formData, "province", 100);
  const categoryId = value(formData, "categoryId", 80);
  const budgetMinRaw = value(formData, "budgetMin", 30);
  const budgetMaxRaw = value(formData, "budgetMax", 30);

  const budgetMin = budgetMinRaw ? Number(budgetMinRaw) : null;
  const budgetMax = budgetMaxRaw ? Number(budgetMaxRaw) : null;

  if (
    title.length < 8 ||
    description.length < 20 ||
    city.length < 2 ||
    province.length < 2 ||
    (budgetMin !== null && (!Number.isFinite(budgetMin) || budgetMin < 0)) ||
    (budgetMax !== null && (!Number.isFinite(budgetMax) || budgetMax < 0)) ||
    (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax)
  ) {
    redirect("/dashboard?error=invalid-request");
  }

  const { error } = await supabase.from("need_requests").insert({
    customer_id: user.id,
    category_id: categoryId || null,
    title,
    description,
    city,
    province,
    budget_min: budgetMin,
    budget_max: budgetMax,
  });

  if (error) {
    redirect("/dashboard?error=request-failed");
  }

  redirect("/dashboard?message=request-created");
}

export async function saveProviderProfile(formData: FormData) {
  const { supabase, user } = await signedInUser();

  const publicName = value(formData, "publicName", 60);
  const businessName = value(formData, "businessName", 100);
  const about = value(formData, "about", 700);
  const city = value(formData, "providerCity", 100);
  const province = value(formData, "providerProvince", 100);

  if (publicName.length < 2 || city.length < 2 || province.length < 2) {
    redirect("/dashboard?error=invalid-provider");
  }

  const { error } = await supabase.from("provider_profiles").upsert(
    {
      user_id: user.id,
      public_name: publicName,
      business_name: businessName || null,
      about: about || null,
      city,
      province,
      is_published: true,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    redirect("/dashboard?error=provider-profile-failed");
  }

  redirect("/dashboard?message=provider-profile-saved");
}

export async function addProviderService(formData: FormData) {
  const { supabase, user } = await signedInUser();

  const categoryId = value(formData, "categoryId", 80);
  const title = value(formData, "serviceTitle", 100);
  const description = value(formData, "serviceDescription", 1200);
  const city = value(formData, "serviceCity", 100);
  const province = value(formData, "serviceProvince", 100);
  const mode = value(formData, "serviceMode", 20);
  const allowedModes = new Set(["online", "in_person", "hybrid"]);

  if (
    !categoryId ||
    title.length < 4 ||
    description.length < 20 ||
    city.length < 2 ||
    province.length < 2 ||
    !allowedModes.has(mode)
  ) {
    redirect("/dashboard?error=invalid-service");
  }

  const { error } = await supabase.from("provider_services").insert({
    provider_id: user.id,
    category_id: categoryId,
    title,
    description,
    city,
    province,
    service_mode: mode,
    is_active: true,
  });

  if (error) {
    redirect("/dashboard?error=service-failed");
  }

  redirect("/dashboard?message=service-added");
}

export async function submitQuote(formData: FormData) {
  const { supabase, user } = await signedInUser();

  const requestId = value(formData, "requestId", 80);
  const message = value(formData, "quoteMessage", 1500);
  const priceRaw = value(formData, "priceAmount", 30);
  const pricingNote = value(formData, "pricingNote", 200);
  const daysRaw = value(formData, "estimatedDays", 10);

  const priceAmount = priceRaw ? Number(priceRaw) : null;
  const estimatedDays = daysRaw ? Number(daysRaw) : null;

  if (
    !requestId ||
    message.length < 20 ||
    (priceAmount !== null && (!Number.isFinite(priceAmount) || priceAmount < 0)) ||
    (estimatedDays !== null && (!Number.isInteger(estimatedDays) || estimatedDays < 0 || estimatedDays > 365))
  ) {
    redirect("/dashboard?error=invalid-quote");
  }

  const { error } = await supabase.from("quotes").insert({
    request_id: requestId,
    provider_id: user.id,
    message,
    price_amount: priceAmount,
    pricing_note: pricingNote || null,
    estimated_days: estimatedDays,
  });

  if (error) {
    redirect("/dashboard?error=quote-failed");
  }

  redirect("/dashboard?message=quote-sent");
}

export async function decideQuote(formData: FormData) {
  const { supabase } = await signedInUser();
  const quoteId = value(formData, "quoteId", 80);
  const decision = value(formData, "decision", 20);

  if (!quoteId || !["accepted", "declined"].includes(decision)) {
    redirect("/dashboard?error=invalid-decision");
  }

  const { error } = await supabase
    .from("quotes")
    .update({ status: decision })
    .eq("id", quoteId);

  if (error) {
    redirect("/dashboard?error=decision-failed");
  }

  redirect("/dashboard?message=offer-updated");
}

export async function closeRequest(formData: FormData) {
  const { supabase } = await signedInUser();
  const requestId = value(formData, "requestId", 80);

  if (!requestId) {
    redirect("/dashboard?error=invalid-request");
  }

  const { error } = await supabase
    .from("need_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) {
    redirect("/dashboard?error=request-close-failed");
  }

  redirect("/dashboard?message=request-closed");
}
