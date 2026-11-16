import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { API_BASE_URL } from './api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = new AuthService();
  const token = authService.token();

  if (!token || !req.url.startsWith(API_BASE_URL)) {
    return next(req);
  }

  const authReq = req.clone({
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`,
    }),
  });

  return next(authReq);
};
