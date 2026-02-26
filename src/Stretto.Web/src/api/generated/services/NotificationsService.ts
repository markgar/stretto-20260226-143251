/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SendAssignmentAnnouncementRequest } from '../models/SendAssignmentAnnouncementRequest';
import type { SendAuditionAnnouncementRequest } from '../models/SendAuditionAnnouncementRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * @param programYearId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiNotificationsAssignmentRecipients(
        programYearId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/assignment-recipients',
            query: {
                'programYearId': programYearId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiNotificationsAssignmentAnnouncement(
        requestBody?: SendAssignmentAnnouncementRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/assignment-announcement',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param auditionDateId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiNotificationsAuditionRecipients(
        auditionDateId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/audition-recipients',
            query: {
                'auditionDateId': auditionDateId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiNotificationsAuditionAnnouncement(
        requestBody?: SendAuditionAnnouncementRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/audition-announcement',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
