/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventType } from './EventType';
export type CreateEventRequest = {
    projectId?: string;
    type?: EventType;
    date?: string;
    startTime?: string;
    durationMinutes?: number;
    venueId?: string | null;
};

