export function ReferenceGroup({
  title,
  items
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="reference-group">
      <h3>{title}</h3>
      <ul className="reference-list">
        {items.map((item) => (
          <li key={item}>
            <code>{item}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
