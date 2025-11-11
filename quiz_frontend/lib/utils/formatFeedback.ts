const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatFeedbackToHtml = (feedback: string): string => {
  if (!feedback) return '';

  const escaped = escapeHtml(feedback);

  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const withLineBreaks = withBold.replace(/\n+/g, '<br />');

  return withLineBreaks;
};

