/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateSlotNotesRequest } from '../models/UpdateSlotNotesRequest';
import type { UpdateSlotStatusRequest } from '../models/UpdateSlotStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditionSlotsService {
    /**
     * @param auditionDateId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAuditionSlots(
        auditionDateId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audition-slots',
            query: {
                'auditionDateId': auditionDateId,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiAuditionSlotsStatus(
        id: string,
        requestBody?: UpdateSlotStatusRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/audition-slots/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiAuditionSlotsNotes(
        id: string,
        requestBody?: UpdateSlotNotesRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/audition-slots/{id}/notes',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
