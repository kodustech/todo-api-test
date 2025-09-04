import { Response, NextFunction } from 'express';
import { ApiRequest } from '../models/Api';
export declare function authenticate(req: ApiRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: ApiRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map