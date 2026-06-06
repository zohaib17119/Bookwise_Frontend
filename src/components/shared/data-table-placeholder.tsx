interface DataTablePlaceholderProps {
  title: string;
  description?: string;
  columns: string[];
}

export function DataTablePlaceholder({
  title,
  description,
  columns,
}: DataTablePlaceholderProps) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/60">
            <tr>
              {columns.map((column) => (
                <th className="px-6 py-3 font-medium text-muted-foreground" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((column) => (
                <td className="px-6 py-6 text-muted-foreground" key={column}>
                  Placeholder
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
