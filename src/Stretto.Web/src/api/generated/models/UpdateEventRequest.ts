/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventType } from './EventType';
export type UpdateEventRequest = {
    type: EventType;
    date: string;
    startTime: string;
    durationMinutes: number;
    venueId?: string | null;
};

