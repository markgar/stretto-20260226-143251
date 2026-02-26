/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardSummaryDto } from '../models/DashboardSummaryDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * @param programYearId
     * @returns DashboardSummaryDto OK
     * @throws ApiError
     */
    public static getApiDashboardSummary(
        programYearId?: string,
    ): CancelablePromise<DashboardSummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/summary',
            query: {
                programYearId,
            },
        });
    }
}
