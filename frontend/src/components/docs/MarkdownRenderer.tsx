import { CodeBlock } from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

interface ParsedBlock {
  type: "heading" | "paragraph" | "code" | "ul" | "ol" | "blockquote" | "hr";
  content: string;
  level?: number;
  language?: string;
  items?: string[];
}

function parseBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // Code block (fenced)
    const codeMatch = line.match(/^```(\w*)\s*$/);
    if (codeMatch) {
      const language = codeMatch[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
        language,
      });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("> ")) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", content: "", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", content: "", items });
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,4}\s/) &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^\s*[-*+]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/) &&
      !lines[i].trimStart().startsWith("> ") &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", content: paraLines.join(" ") });
  }

  return blocks;
}

function renderInline(text: string): string {
  let result = text;

  // Escape HTML entities
  result = result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Bold + italic
  result = result.replace(
    /\*\*\*(.+?)\*\*\*/g,
    '<strong><em>$1</em></strong>'
  );

  // Bold
  result = result.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-gray-900">$1</strong>'
  );

  // Italic
  result = result.replace(
    /\*(.+?)\*/g,
    "<em>$1</em>"
  );

  // Inline code
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-sm font-mono border border-gray-200">$1</code>'
  );

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">$1</a>'
  );

  // Em dashes
  result = result.replace(/--/g, "&mdash;");

  return result;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="prose prose-gray max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const id = slugify(block.content);
            const inlineHtml = renderInline(block.content);
            switch (block.level) {
              case 1:
                return (
                  <h1
                    key={i}
                    id={id}
                    className="text-3xl font-bold text-gray-900 mt-8 mb-4 scroll-mt-24"
                    dangerouslySetInnerHTML={{ __html: inlineHtml }}
                  />
                );
              case 2:
                return (
                  <h2
                    key={i}
                    id={id}
                    className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-100 scroll-mt-24"
                    dangerouslySetInnerHTML={{ __html: inlineHtml }}
                  />
                );
              case 3:
                return (
                  <h3
                    key={i}
                    id={id}
                    className="text-xl font-semibold text-gray-900 mt-8 mb-3 scroll-mt-24"
                    dangerouslySetInnerHTML={{ __html: inlineHtml }}
                  />
                );
              case 4:
                return (
                  <h4
                    key={i}
                    id={id}
                    className="text-lg font-semibold text-gray-900 mt-6 mb-2 scroll-mt-24"
                    dangerouslySetInnerHTML={{ __html: inlineHtml }}
                  />
                );
              default:
                return null;
            }
          }

          case "paragraph":
            return (
              <p
                key={i}
                className="text-gray-700 leading-7 mb-4"
                dangerouslySetInnerHTML={{ __html: renderInline(block.content) }}
              />
            );

          case "code":
            return (
              <CodeBlock
                key={i}
                code={block.content}
                language={block.language}
              />
            );

          case "ul":
            return (
              <ul key={i} className="list-disc list-outside pl-6 mb-4 space-y-1.5">
                {block.items?.map((item, j) => (
                  <li
                    key={j}
                    className="text-gray-700 leading-7"
                    dangerouslySetInnerHTML={{ __html: renderInline(item) }}
                  />
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={i} className="list-decimal list-outside pl-6 mb-4 space-y-1.5">
                {block.items?.map((item, j) => (
                  <li
                    key={j}
                    className="text-gray-700 leading-7"
                    dangerouslySetInnerHTML={{ __html: renderInline(item) }}
                  />
                ))}
              </ol>
            );

          case "blockquote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-blue-300 bg-blue-50/50 pl-4 py-3 pr-4 rounded-r-lg mb-4 text-gray-700 italic"
                dangerouslySetInnerHTML={{ __html: renderInline(block.content) }}
              />
            );

          case "hr":
            return (
              <hr key={i} className="my-8 border-gray-200" />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
