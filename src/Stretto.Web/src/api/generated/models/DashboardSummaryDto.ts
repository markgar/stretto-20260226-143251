/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpcomingEventDto } from './UpcomingEventDto';
import type { RecentActivityItem } from './RecentActivityItem';
export type DashboardSummaryDto = {
  programYearId: string | null;
  programYearName: string | null;
  upcomingEvents: Array<UpcomingEventDto>;
  recentActivity: Array<RecentActivityItem>;
};
