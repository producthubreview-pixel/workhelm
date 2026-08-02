import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const dimensions = { sm: { w: 120, h: 36 }, md: { w: 160, h: 48 }, lg: { w: 200, h: 60 } };
  const { w, h } = dimensions[size];

  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0">
        <Image src="/workhelm-logo.svg" alt="WorkHelm" width={w} height={h} priority />
      </Link>
    );
  }

  return <Image src="/workhelm-logo.svg" alt="WorkHelm" width={w} height={h} priority />;
}
