import Image from "next/image";

export function Logo({
  size = 40,
  rounded = "rounded-xl",
  className = "",
}: {
  size?: number;
  rounded?: string;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="RB Social Branding"
      width={size}
      height={size}
      priority
      className={`shrink-0 bg-white object-contain p-1 ring-1 ring-black/10 ${rounded} ${className}`}
    />
  );
}
