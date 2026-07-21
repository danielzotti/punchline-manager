export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function cleanPunchlineText(text: string): string {
  if (!text) return text;
  return text
    .replace(/<p(\s+[^>]*)?>/gi, "<div>")
    .replace(/<\/p>/gi, "</div>");
}

