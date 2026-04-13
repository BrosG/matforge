export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape </script> sequences to prevent XSS via JSON-LD injection
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
