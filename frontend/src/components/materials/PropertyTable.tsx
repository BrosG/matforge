import { cn } from "@/lib/utils";

interface PropertyTableProps {
  properties: Record<string, number | null>;
  units?: Record<string, string>;
}

/** Convert snake_case or camelCase key to Title Case. */
function toTitleCase(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a number to 4 significant figures. */
function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(4)).toString();
}

export function PropertyTable({ properties, units }: PropertyTableProps) {
  // Only show rows that have actual values — never show dashes for missing data
  const entries = Object.entries(properties).filter(
    ([, v]) => v !== null && v !== undefined
  );

  if (entries.length === 0) {
    return null; // Don't render empty tables
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
              Property
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-gray-700">
              Value
            </th>
            {units && (
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                Unit
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value], idx) => (
            <tr
              key={key}
              className={cn(
                "border-b last:border-b-0 transition-colors",
                idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"
              )}
            >
              <td className="px-4 py-2.5 text-gray-600">
                {toTitleCase(key)}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-gray-900">
                {value === null || value === undefined
                  ? <span className="text-gray-400">&mdash;</span>
                  : formatValue(value)}
              </td>
              {units && (
                <td className="px-4 py-2.5 text-gray-500 text-xs">
                  {units[key] ?? ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
