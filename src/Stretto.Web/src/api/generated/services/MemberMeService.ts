/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateMemberProfileRequest } from '../models/UpdateMemberProfileRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MemberMeService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiMembersMe(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/members/me',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiMembersMe(
        requestBody?: UpdateMemberProfileRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/members/me',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
