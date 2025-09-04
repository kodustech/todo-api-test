import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../models/Api';
export declare function requestId(req: ApiRequest, res: Response, next: NextFunction): void;
export declare function extractIdempotencyKey(req: ApiRequest, res: Response, next: NextFunction): void;
export declare function corsHandler(req: Request, res: Response, next: NextFunction): void;
export declare function errorHandler(error: Error, req: ApiRequest, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: ApiRequest, res: Response): void;
export declare function requestLogger(req: ApiRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=common.d.ts.map