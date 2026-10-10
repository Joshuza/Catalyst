import { lazy } from 'react';
export const BriefingPage = lazy(() =>
  import('./BriefingPage').then((module) => ({
    default: module.BriefingPage,
  })),
);
export const ProfilePage = lazy(() =>
  import('./ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
export const FinancePage = lazy(() =>
  import('./FinancePage').then((module) => ({
    default: module.FinancePage,
  })),
);
export const ReceiptsPage = lazy(() =>
  import('./ReceiptsPage').then((module) => ({
    default: module.ReceiptsPage,
  })),
);
export const CalendarPage = lazy(() =>
  import('./CalendarPage').then((module) => ({
    default: module.CalendarPage,
  })),
);
export const InboxPage = lazy(() =>
  import('./InboxPage').then((module) => ({
    default: module.InboxPage,
  })),
);
export const TasksPage = lazy(() =>
  import('./TasksPage').then((module) => ({
    default: module.TasksPage,
  })),
);
export const FoodPage = lazy(() =>
  import('./FoodPage').then((module) => ({ default: module.FoodPage })),
);
export const TransitPage = lazy(() =>
  import('./TransitPage').then((module) => ({
    default: module.TransitPage,
  })),
);
export const OutdoorsPage = lazy(() =>
  import('./OutdoorsPage').then((module) => ({
    default: module.OutdoorsPage,
  })),
);
export const ContactsPage = lazy(() =>
  import('./ContactsPage').then((module) => ({
    default: module.ContactsPage,
  })),
);
export const PetPage = lazy(() =>
  import('./PetPage').then((module) => ({ default: module.PetPage })),
);
export const ScreenPage = lazy(() =>
  import('./ScreenPage').then((module) => ({
    default: module.ScreenPage,
  })),
);
export const ReadingPage = lazy(() =>
  import('./ReadingPage').then((module) => ({
    default: module.ReadingPage,
  })),
);
export const ResetPage = lazy(() =>
  import('./ResetPage').then((module) => ({
    default: module.ResetPage,
  })),
);
export const ConnectionsPage = lazy(() =>
  import('./ConnectionsPage').then((module) => ({
    default: module.ConnectionsPage,
  })),
);
export const Terminal = lazy(() =>
  import('./Terminal').then((module) => ({ default: module.Terminal })),
);
export const ResearchPage = lazy(() =>
  import('./ResearchPage').then((m) => ({ default: m.ResearchPage })),
);
export const GoalsPage = lazy(() =>
  import('./GoalsPage').then((m) => ({ default: m.GoalsPage })),
);
export const HealthPage = lazy(() =>
  import('./HealthPage').then((m) => ({ default: m.HealthPage })),
);
export const HabitsPage = lazy(() =>
  import('./HabitsPage').then((m) => ({ default: m.HabitsPage })),
);
export const AudioPage = lazy(() =>
  import('./AudioPage').then((m) => ({ default: m.AudioPage })),
);
export const ItineraryPage = lazy(() =>
  import('./ItineraryPage').then((m) => ({ default: m.ItineraryPage })),
);
