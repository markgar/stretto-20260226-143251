/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SetAttendanceStatusRequest } from '../models/SetAttendanceStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AttendanceService {
    /**
     * @param eventId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiEventsAttendance(
        eventId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/events/{eventId}/attendance',
            path: {
                'eventId': eventId,
            },
        });
    }
    /**
     * @param eventId
     * @param memberId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiEventsAttendance(
        eventId: string,
        memberId: string,
        requestBody?: SetAttendanceStatusRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/events/{eventId}/attendance/{memberId}',
            path: {
                'eventId': eventId,
                'memberId': memberId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param eventId
     * @returns any OK
     * @throws ApiError
     */
    public static postApiCheckin(
        eventId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/checkin/{eventId}',
            path: {
                'eventId': eventId,
            },
        });
    }
    /**
     * @param eventId
     * @returns any OK
     * @throws ApiError
     */
    public static putApiEventsAttendanceMeExcused(
        eventId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/events/{eventId}/attendance/me/excused',
            path: {
                'eventId': eventId,
            },
        });
    }
}
