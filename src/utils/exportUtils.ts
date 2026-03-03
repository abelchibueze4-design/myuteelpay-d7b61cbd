
export const exportToCSV = (headers: string[], data: any[][], filename: string) => {
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            row.map(cell => {
                const text = String(cell ?? '');
                // Escape quotes and wrapp in quotes if contains comma, newline or quotes
                if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                    return `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printPDF = (title: string, headers: string[], data: any[][]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          h1 { color: #7C3AED; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; }
          tr:nth-child(even) { background-color: #f1f5f9; }
          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">UteelPay Admin Panel - Internal Report</div>
      </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
};
