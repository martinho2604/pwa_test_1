export interface OnlineStatus {
  label: string;
  className: string;
}

export function escapeHtml(text: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, character => entities[character]);
}

export function getOnlineStatus(isOnline: boolean): OnlineStatus {
  return isOnline
    ? {
        label: '連線中',
        className: 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800'
      }
    : {
        label: '離線模式',
        className: 'px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800'
      };
}