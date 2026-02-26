/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * @param programYearId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDashboardSummary(
        programYearId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/summary',
            query: {
                'programYearId': programYearId,
            },
        });
    }
}
