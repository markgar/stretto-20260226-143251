/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuditionSignUpRequest } from '../models/AuditionSignUpRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PublicAuditionsService {
    /**
     * @param auditionDateId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiPublicAuditions(
        auditionDateId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/public/auditions/{auditionDateId}',
            path: {
                'auditionDateId': auditionDateId,
            },
        });
    }
    /**
     * @param slotId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiPublicAuditionsSignup(
        slotId: string,
        requestBody?: AuditionSignUpRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/public/auditions/{slotId}/signup',
            path: {
                'slotId': slotId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
