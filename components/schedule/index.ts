// Schedule Module Component Exports
// Centralized exports for all schedule-related components

// Calendar Views
export { CalendarWeekView, CalendarWeekTimelineView } from './CalendarWeekView'
export { CalendarMonthView, MiniCalendar, CalendarYearView } from './CalendarMonthView'

// Shift Components
export { ShiftCard, ShiftIndicator, ShiftListItem } from './ShiftCard'
export { ShiftTemplateManager } from './ShiftTemplateManager'

// Availability
export { AvailabilityManager, WeeklyAvailabilityGrid } from './AvailabilityManager'

// Swap/Trade
export { ShiftSwapDialog, SwapRequestList } from './ShiftSwapDialog'

// Publish Workflow
export { PublishWorkflow } from './PublishWorkflow'

// Re-export types for convenience
export type {
  Shift,
  ShiftTemplate,
  Schedule,
  ShiftAssignment,
  Availability,
  ShiftSwapRequest,
  CalendarView,
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  ShiftStatus,
  ScheduleStatus,
  SwapRequestStatus,
  AvailabilityType,
  RecurrencePattern,
  ShiftType,
} from '@/types/schedule'
