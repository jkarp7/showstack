/**
 * Utility functions for formatting notes for PDF export
 * Server-side version (main process)
 */

/**
 * Formats note content as HTML string for PDF export
 * @param content - Raw note content with line breaks
 * @param format - Format type: 'plain', 'bullets', or 'numbered'
 * @returns HTML string
 */
export function formatNoteContentAsHTML(
  content: string,
  format: 'plain' | 'bullets' | 'numbered',
): string {
  if (!content || !content.trim()) {
    return '';
  }

  // Split content by line breaks and filter out empty lines
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return '';
  }

  switch (format) {
    case 'bullets':
      return `<ul style="margin-left: 20pt; margin-bottom: 8pt;">${lines.map((line) => `<li style="margin: 2pt 0;">${escapeHtml(line)}</li>`).join('')}</ul>`;

    case 'numbered':
      return `<ol style="margin-left: 20pt; margin-bottom: 8pt;">${lines.map((line) => `<li style="margin: 2pt 0;">${escapeHtml(line)}</li>`).join('')}</ol>`;

    case 'plain':
    default:
      return lines.map((line) => `<p style="margin: 2pt 0;">${escapeHtml(line)}</p>`).join('');
  }
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
