import Link from "next/link";

export function Socials() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="mailto:anubhavitis@gmail.com"
        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
      >
        mail-us
      </Link>
      <Link
        href="https://x.com/anubhavitis/"
        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
      >
        twitter
      </Link>
      <Link
        href="https://github.com/anubhavitis/siphl"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>github</span>
      </Link>
    </div>
  );
}
