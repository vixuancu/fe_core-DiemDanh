// import { PAGING } from "../constants/paging.constant";
// import { ErrorModel } from "./error.model";



export class ApiError extends Error {
    statusCode: number;
    errMsg?: string;

    constructor(
        statusCode: number,
        errCode: string,
        errMsg?: string,
    ) {
        super(errCode);
        this.statusCode = statusCode;
        this.errMsg = errMsg;
    }

    static BadRequest(errCode: string, errMsg?: string) {
        return new ApiError(400, errCode, errMsg);
    }

    static Unauthorized(errCode: string, errMsg?: string) {
        return new ApiError(401, errCode, errMsg);
    }

    static Forbidden(errCode: string, errMsg?: string) {
        return new ApiError(403, errCode, errMsg);
    }

    static NotFound(errCode: string, errMsg?: string) {
        return new ApiError(404, errCode, errMsg);
    }

    static TooManyRequests(errCode: string, errMsg?: string) {
        return new ApiError(429, errCode, errMsg);
    }

    static InternalServer(errCode: string, errMsg?: string) {
        return new ApiError(500, errCode, errMsg);
    }
}

export class BaseResponse<T> {
    data?: T | null;

    constructor(data?: T | null) {
        this.data = data ?? null;
    }
}

export class SuccessResponse<T> extends BaseResponse<T> {
    constructor(data?: T) {
        super(data);
    }
}

// export class ErrorResponse extends BaseResponse<ErrorModel> {
//     constructor(data: ErrorModel) {
//         super(data);
//     }
// }

// export class PagingResponse<T> extends BaseResponse<T[]> {
//     constructor(items: T[], noOfRows: number, page: number, pageSize: number) {
//         pageSize = pageSize > 0 ? pageSize : PAGING.DEFAULT_PAGE_SIZE;
//         if (PAGING.PAGE_SIZE_OPTIONS.indexOf(pageSize) === -1) {
//             pageSize = PAGING.DEFAULT_PAGE_SIZE;
//         }
//         const noOfPages = Math.ceil(noOfRows / pageSize);
//         super(items, {
//             page,
//             pageSize,
//             noOfRows,
//             noOfPages,
//         });
//     }
// }
