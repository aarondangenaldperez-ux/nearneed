import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MAX_QUERY_LENGTH = 80;
const MAX_LOCATION_LENGTH = 100;
const RESULT_LIMIT = 48;

function cleanSearchTerm(value: string | null, maxLength: number): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanSlug(value: string | null): string {
  const slug = (value ?? "").trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "";
}

function json(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return json({ source: "demo", categories: [], listings: [], hasMore: false });
  }

  try {
    const params = request.nextUrl.searchParams;
    const query = cleanSearchTerm(params.get("q"), MAX_QUERY_LENGTH);
    const city = cleanSearchTerm(params.get("city"), MAX_LOCATION_LENGTH);
    const province = cleanSearchTerm(params.get("province"), MAX_LOCATION_LENGTH);
    const categorySlug = cleanSlug(params.get("category"));

    const supabase = await createClient();
    const [categoriesResult, providersResult] = await Promise.all([
      supabase
        .from("service_categories")
        .select("id,name,slug")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(100),
      supabase
        .from("provider_profiles")
        .select("user_id,public_name,business_name")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (categoriesResult.error || providersResult.error) {
      return json({ error: "Discovery is temporarily unavailable." }, 503);
    }

    const categories = categoriesResult.data ?? [];
    const providers = providersResult.data ?? [];
    const category = categorySlug
      ? categories.find((item) => item.slug === categorySlug)
      : undefined;

    const responseCategories = categories.map(({ name, slug }) => ({ name, slug }));

    if (categorySlug && !category) {
      return json({ source: "live", categories: responseCategories, listings: [], hasMore: false });
    }

    if (providers.length === 0) {
      return json({ source: "live", categories: responseCategories, listings: [], hasMore: false });
    }

    let servicesQuery = supabase
      .from("provider_services")
      .select("id,provider_id,category_id,title,description,city,province,service_mode,price_from,pricing_note,created_at")
      .eq("is_active", true)
      .in("provider_id", providers.map((provider) => provider.user_id))
      .order("created_at", { ascending: false })
      .limit(RESULT_LIMIT + 1);

    if (category) servicesQuery = servicesQuery.eq("category_id", category.id);
    if (city) servicesQuery = servicesQuery.ilike("city", city);
    if (province) servicesQuery = servicesQuery.ilike("province", province);
    if (query) {
      servicesQuery = servicesQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    const servicesResult = await servicesQuery;

    if (servicesResult.error) {
      return json({ error: "Discovery is temporarily unavailable." }, 503);
    }

    const categoryById = new Map(categories.map((item) => [item.id, item]));
    const providerById = new Map(providers.map((provider) => [provider.user_id, provider]));
    const rows = servicesResult.data ?? [];
    const hasMore = rows.length > RESULT_LIMIT;

    const listings = rows.slice(0, RESULT_LIMIT).flatMap((service) => {
      const provider = providerById.get(service.provider_id);
      const serviceCategory = categoryById.get(service.category_id);

      // Never render a listing unless its public provider and active category
      // were returned by the corresponding published/active queries.
      if (!provider || !serviceCategory) return [];

      return [{
        id: service.id,
        title: service.title,
        description: service.description,
        category: serviceCategory.name,
        categorySlug: serviceCategory.slug,
        providerName: provider.business_name || provider.public_name || "Local provider",
        city: service.city,
        province: service.province,
        serviceMode: service.service_mode,
        priceFrom: service.price_from,
        pricingNote: service.pricing_note,
      }];
    });

    return json({
      source: "live",
      categories: responseCategories,
      listings,
      hasMore,
    });
  } catch {
    return json({ error: "Discovery is temporarily unavailable." }, 503);
  }
}
