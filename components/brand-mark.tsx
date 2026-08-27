import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-mark" aria-label="ArtPrint, ir al inicio">
      <span className="brand-orbit" aria-hidden="true"><span>AP</span></span>
      {!compact && <span className="brand-word">Art<span>Print</span></span>}
    </Link>
  );
}
