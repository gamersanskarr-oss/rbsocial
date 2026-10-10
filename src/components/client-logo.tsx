import Image from "next/image";

export function ClientLogo({
  url,
  name,
  size = 48,
  rounded = "rounded-xl",
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
  rounded?: string;
}) {
  if (!url) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.32 }}
        className={`flex shrink-0 items-center justify-center bg-panel font-bold text-ink ring-1 ring-line ${rounded}`}
      >
        {name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 bg-elevated object-contain ring-1 ring-line ${rounded}`}
    />
  );
}
