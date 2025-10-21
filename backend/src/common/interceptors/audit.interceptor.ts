import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const traceId = uuidv4();

    // Store trace ID in request
    request.traceId = traceId;

    const action = `${request.method} ${request.route?.path || request.url}`;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        // Success - log audit
        if (user && this.shouldAudit(action)) {
          await this.logAudit({
            companyId: user.companyId,
            userId: user.id,
            action: this.extractAction(request),
            objectType: this.extractObjectType(request),
            objectId: this.extractObjectId(request, data),
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            result: 'SUCCESS',
            traceId,
          });
        }
      }),
      catchError(async (error) => {
        // Error - log audit
        if (user && this.shouldAudit(action)) {
          await this.logAudit({
            companyId: user.companyId,
            userId: user.id,
            action: this.extractAction(request),
            objectType: this.extractObjectType(request),
            objectId: this.extractObjectId(request),
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            result: 'FAILED',
            errorMsg: error.message,
            traceId,
          });
        }
        throw error;
      }),
    );
  }

  private shouldAudit(action: string): boolean {
    // Skip GET requests (read-only operations)
    return !action.startsWith('GET');
  }

  private extractAction(request: any): string {
    const method = request.method;
    const path = request.route?.path || '';

    if (path.includes('/auth/login')) return 'LOGIN';
    if (path.includes('/auth/logout')) return 'LOGOUT';
    if (path.includes('/payments') && method === 'POST') return 'CREATE_PAYMENT';
    if (path.includes('/payments') && method === 'PUT') return 'UPDATE_PAYMENT';
    if (path.includes('/payments') && method === 'DELETE') return 'DELETE_PAYMENT';
    if (path.includes('/sign')) return 'SIGN_PAYMENT';
    if (path.includes('/send')) return 'SEND_PAYMENT';

    return `${method}_${path.split('/')[1]?.toUpperCase() || 'UNKNOWN'}`;
  }

  private extractObjectType(request: any): string | null {
    const path = request.route?.path || '';

    if (path.includes('/payments')) return 'Payment';
    if (path.includes('/users')) return 'User';
    if (path.includes('/accounts')) return 'Account';

    return null;
  }

  private extractObjectId(request: any, data?: any): string | null {
    return request.params?.id || data?.id || null;
  }

  private async logAudit(data: any) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}
