/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateProgramYearRequest } from '../models/CreateProgramYearRequest';
import type { UpdateProgramYearRequest } from '../models/UpdateProgramYearRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProgramYearsService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProgramYears(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program-years',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProgramYears(
        requestBody?: CreateProgramYearRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program-years',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProgramYears1(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program-years/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiProgramYears(
        id: string,
        requestBody?: UpdateProgramYearRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/program-years/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProgramYearsArchive(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program-years/{id}/archive',
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
    public static postApiProgramYearsActivate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program-years/{id}/activate',
            path: {
                'id': id,
            },
        });
    }
}
