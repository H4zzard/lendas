type ModeCardProps = {
  title: string;
  subtitle: string;
  available?: boolean;
};

export function ModeCard({ title, subtitle, available = false }: ModeCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 ${
        available
          ? "border-field/40 bg-field text-paper"
          : "border-charcoal/10 bg-paper text-charcoal"
      }`}
    >
      <span
        className={`self-start rounded-full px-2 py-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-[0.18em] ${
          available
            ? "bg-gold text-charcoal"
            : "bg-charcoal/10 text-muted-foreground"
        }`}
      >
        {available ? "Disponível" : "Em breve"}
      </span>

      <div className="mt-6">
        <h3 className="font-heading text-2xl leading-none tracking-wide">
          {title}
        </h3>
        <p
          className={`mt-1 font-sans text-xs ${
            available ? "text-paper/80" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
