// src/common/middleware/mongo-sanitize.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';


@Injectable()
export class MongoSanitizeMiddleware implements NestMiddleware {

  private readonly FORBIDDEN_KEYS = /^\$|\./;

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body) {
      req.body = this.sanitize(req.body);
    }

    // Sanitize route params
    if (req.params) {
      req.params = this.sanitize(req.params);
    }

  
    next();
  }

  private sanitize<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item)) as unknown as T;
    }

    const sanitized: Record<string, any> = {};

    for (const key of Object.keys(obj as Record<string, any>)) {
  
      if (this.FORBIDDEN_KEYS.test(key)) {
        console.warn(`[MongoSanitize] Blocked suspicious key: "${key}"`);
        continue; // skip this key
      }
      sanitized[key] = this.sanitize((obj as Record<string, any>)[key]);
    }

    return sanitized as T;
  }
}