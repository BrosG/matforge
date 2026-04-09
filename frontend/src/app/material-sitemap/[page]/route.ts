const SITE_URL = "https://matcraft.ai";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Material {
  id: string;
  updated_at?: string;
}

interface MaterialsResponse {
  items: Material[];
}

function buildSitemapXml(materials: Material[]): string {
  const urls = materials
    .map((m) => {
      const lastmod = m.updated_at
        ? `\n    <lastmod>${new Date(m.updated_at).toISOString()}</lastmod>`
        : "";
      return `  <url>\n    <loc>${SITE_URL}/materials/${m.id}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET(
  _request: Request,
  { params }: { params: { page: string } },
) {
  const page = parseInt(params.page, 10);

  if (isNaN(page) || page < 1) {
    return new Response(buildSitemapXml([]), {
      status: 400,
      headers: { "Content-Type": "application/xml" },
    });
  }

  try {
    const res = await fetch(
      `${API_BASE}/materials?page=${page}&limit=50000`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return new Response(buildSitemapXml([]), {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const data: MaterialsResponse = await res.json();
    const xml = buildSitemapXml(data.items ?? []);

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch {
    return new Response(buildSitemapXml([]), {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
