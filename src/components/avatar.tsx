import { cn } from "@/lib/utils";

// A round picture. With no avatarUrl it shows the person's initials in
// white on a green circle. The picture is a plain <img>: it is a tiny local
// file (or a web address someone put in the database), so next/image's
// resizing would add nothing.
export function Avatar({
  name,
  avatarUrl,
  size = 40,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-active font-semibold text-white",
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
