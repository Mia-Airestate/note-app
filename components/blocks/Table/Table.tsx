import { BlockComponentProps } from '../registry';
import './Table.css';

export function TableBlock({ block }: BlockComponentProps) {
  const headers = block.props?.headers || [];
  const rows = block.content.split('\n').filter(Boolean);
  const dataRows = rows.map((row) => row.split('|').map((cell) => cell.trim()));

  return (
    <table className="block-table">
      <thead>
        <tr>
          {headers.map((headerIndex, index) => (
            <th
              key={index}
              className={headers.includes(index) ? 'block-table-header' : ''}
            >
              Column {index + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell || 'Cell'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

