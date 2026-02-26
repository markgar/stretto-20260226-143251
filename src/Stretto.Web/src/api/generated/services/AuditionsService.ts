/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAuditionDateRequest } from '../models/CreateAuditionDateRequest';
import type { UpdateSlotNotesRequest } from '../models/UpdateSlotNotesRequest';
import type { UpdateSlotStatusRequest } from '../models/UpdateSlotStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditionsService {
    /**
     * @param programYearId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAuditionDates(
        programYearId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audition-dates',
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
    public static postApiAuditionDates(
        requestBody?: CreateAuditionDateRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/audition-dates',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAuditionDates1(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audition-dates/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiAuditionDates(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/audition-dates/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param slotId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiAuditionDatesSlotsStatus(
        id: string,
        slotId: string,
        requestBody?: UpdateSlotStatusRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/audition-dates/{id}/slots/{slotId}/status',
            path: {
                'id': id,
                'slotId': slotId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param slotId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiAuditionDatesSlotsNotes(
        id: string,
        slotId: string,
        requestBody?: UpdateSlotNotesRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/audition-dates/{id}/slots/{slotId}/notes',
            path: {
                'id': id,
                'slotId': slotId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
