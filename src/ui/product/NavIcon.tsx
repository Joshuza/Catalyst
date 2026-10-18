/** Original line icons; navigation names remain readable text. */
const paths: Record<string, string> = {
  briefing: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  create: 'M12 5v14M5 12h14',
  calendar:
    'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4M17 2v4M3 9h18M7 13h2M13 13h4M7 17h2',
  inbox: 'M4 4h16v16H4ZM4 13h5l1 3h4l1-3h5M8 8h8',
  tasks: 'm3 6 2 2 3-4M11 6h10M3 13l2 2 3-4M11 13h10M11 20h10',
  reading:
    'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3ZM12 6v15M6 8h3M15 8h3M6 12h3M15 12h3',
  goals: 'M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5M12 12l8-8M16 4h4v4',
  itineraries:
    'M5 5h14v5a2 2 0 0 0 0 4v5H5v-5a2 2 0 0 0 0-4ZM15 5v3M15 11v2M15 16v3',
  finance: 'M4 5h16v14H4ZM4 9h16M15 13h5M7 15h3',
  receipts: 'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 7h6M9 11h6M9 15h3',
  food: 'M5 3v6a3 3 0 0 0 6 0V3M8 3v18M18 21V3c-4 3-4 9 0 9',
  transit: 'M5 3h14v14H5ZM5 8h14M8 17l-2 4M16 17l2 4M8 13h1M15 13h1',
  outdoors: 'm2 20 7-15 5 9 3-5 5 11ZM6 12h6M16 14h4',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  habits:
    'M7 8a6 6 0 0 1 11-2l2 2M20 3v5h-5M17 16a6 6 0 0 1-11 2l-2-2M4 21v-5h5',
  audio: 'M4 15v-4a8 8 0 0 1 16 0v4M4 12h3v8H4ZM17 12h3v8h-3',
  contacts:
    'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21v-3a7 7 0 0 1 14 0v3ZM19 4a3 3 0 0 1 0 6',
  pet: 'M8 13c2-4 6-4 8 0l3 4c1 4-4 5-7 3-3 2-8 1-7-3ZM5 7h1v3H5ZM9 3h1v4H9ZM14 3h1v4h-1ZM18 7h1v3h-1',
  screen: 'M3 4h18v13H3ZM8 21h8M12 17v4',
  reset: 'M4 10a8 8 0 1 1 0 5M4 4v6h6M12 7v5l3 2',
  research: 'M4 4h6v6H4ZM14 4h6v10h-6ZM4 14h6v6H4ZM14 18h6v2h-6',
  records: 'M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h6',
  profile:
    'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',
  connections:
    'm10 7 2-2a5 5 0 0 1 7 7l-2 2M14 17l-2 2a5 5 0 0 1-7-7l2-2M8 16l8-8',
};
export function NavIcon({ page }: { page: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[page] ?? paths['briefing']} />
    </svg>
  );
}
