/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddLinkRequest } from '../models/AddLinkRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectMaterialsService {
    /**
     * @param projectId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProjectsLinks(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{projectId}/links',
            path: {
                'projectId': projectId,
            },
        });
    }
    /**
     * @param projectId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProjectsLinks(
        projectId: string,
        requestBody?: AddLinkRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/{projectId}/links',
            path: {
                'projectId': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param projectId
     * @param linkId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProjectsLinks(
        projectId: string,
        linkId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{projectId}/links/{linkId}',
            path: {
                'projectId': projectId,
                'linkId': linkId,
            },
        });
    }
    /**
     * @param projectId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProjectsDocuments(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{projectId}/documents',
            path: {
                'projectId': projectId,
            },
        });
    }
    /**
     * @param projectId
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProjectsDocuments(
        projectId: string,
        formData?: {
            file?: Blob;
            title?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/{projectId}/documents',
            path: {
                'projectId': projectId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param projectId
     * @param documentId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProjectsDocumentsDownload(
        projectId: string,
        documentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{projectId}/documents/{documentId}/download',
            path: {
                'projectId': projectId,
                'documentId': documentId,
            },
        });
    }
    /**
     * @param projectId
     * @param documentId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProjectsDocuments(
        projectId: string,
        documentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{projectId}/documents/{documentId}',
            path: {
                'projectId': projectId,
                'documentId': documentId,
            },
        });
    }
}
