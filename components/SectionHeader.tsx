type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  id?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: Props) {
  return (
    <div
      id={id}
      className={[
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        {eyebrow}
      </span>
      <h2 className="section-heading text-balance">{title}</h2>
      {description && (
        <p className="text-pretty text-[15.5px] leading-relaxed text-ink-300">
          {description}
        </p>
      )}
    </div>
  );
}
