interface Props {
  lines: any[];
  title: string;
}

export default function StatementRenderer({ lines, title }: Props) {
  return (
    <div className="bg-white shadow rounded p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <table className="min-w-full border">
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td className="border p-2 pl-4" style={{ paddingLeft: line.hierarchy_level * 16 }}>
                {line.account_name}
              </td>
              <td className="border p-2 text-right">
                {Number(line.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
