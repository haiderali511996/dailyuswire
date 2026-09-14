/** Static legal/marketing page shell so About, Privacy, Terms all match. */
export function Prose({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell py-10">
      <div className="mx-auto max-w-prose">
        <h1 className="font-serif text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-ink-faint">Last updated: {updated}</p>}
        <div className="article-body mt-8">{children}</div>
      </div>
    </div>
  );
}
