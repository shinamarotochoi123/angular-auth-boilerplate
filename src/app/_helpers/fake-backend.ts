import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

import { AlertService } from '../_services/alert.service';
import { Role } from '../_models/role';

const accountsKey = 'angular-auth-boilerplate-accounts';
let accounts: any[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  constructor(private alertService: AlertService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, headers, body } = request;
    const alertService = this.alertService;

    return handleRoute();

    function handleRoute() {
      switch (true) {
        case url.endsWith('/accounts/authenticate') && method === 'POST':
          return authenticate();
        case url.endsWith('/accounts/register') && method === 'POST':
          return register();
        case url.endsWith('/accounts/verify-email') && method === 'POST':
          return verifyEmail();
        case url.endsWith('/accounts/forgot-password') && method === 'POST':
          return forgotPassword();
        case url.endsWith('/accounts/reset-password') && method === 'POST':
          return resetPassword();
        case url.endsWith('/accounts') && method === 'GET':
          return getAccounts();
        case url.match(/\/accounts\/\d+$/) && method === 'GET':
          return getAccountById();
        case url.endsWith('/accounts') && method === 'POST':
          return createAccount();
        case url.match(/\/accounts\/\d+$/) && method === 'PUT':
          return updateAccount();
        case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
          return deleteAccount();
        default:
          return next.handle(request);
      }
    }

    function authenticate() {
      const { email, password } = body;
      const account = accounts.find(x => x.email === email && x.password === password && x.isVerified);
      if (!account) return error('Email or password is incorrect');
      return ok({
        ...basicDetails(account),
        jwtToken: generateJwtToken(account)
      });
    }

    function register() {
      const account = body;

      if (accounts.find(x => x.email === account.email)) {
        alertService.info(`
          <h2>Email Already Registered</h2>
          <p>Your email ${account.email} is already registered.</p>
          <p><strong>NOTE:</strong> This is a fake backend. A real backend would send a real email.</p>
        `);
        return ok();
      }

      account.id = accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
      account.role = account.id === 1 ? Role.Admin : Role.User;
      account.dateCreated = new Date().toISOString();
      account.verificationToken = new Date().getTime().toString();
      account.isVerified = false;
      account.refreshTokens = [];
      delete account.confirmPassword;
      accounts.push(account);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      const verifyUrl = `${location.origin}/verify-email?token=${account.verificationToken}`;
      
      setTimeout(() => {
        alertService.info(`
          <h2>Verification Email (Fake Backend)</h2>
          <p>Thanks for registering ${account.firstName}!</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
          <p><strong>NOTE:</strong> This is a fake backend. A real backend would send a real email.</p>
        `);
      }, 1000);

      return ok();
    }

    function verifyEmail() {
      const { token } = body;
      const account = accounts.find(x => x.verificationToken === token);
      if (!account) return error('Verification failed');
      account.isVerified = true;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok();
    }

    function forgotPassword() {
      const { email } = body;
      const account = accounts.find(x => x.email === email);
      if (!account) return ok();
      
      account.resetToken = new Date().getTime().toString();
      account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      
      const resetUrl = `${location.origin}/reset-password?token=${account.resetToken}`;
      
      setTimeout(() => {
        alertService.info(`
          <h2>Reset Password Email (Fake Backend)</h2>
          <p>Please click the link to reset your password (valid for 1 day):</p>
          <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
          <p><strong>NOTE:</strong> This is a fake backend. A real backend would send a real email.</p>
        `);
      }, 1000);
      
      return ok();
    }

    function resetPassword() {
      const { token, password } = body;
      const account = accounts.find(x => x.resetToken === token && new Date() < new Date(x.resetTokenExpires));
      if (!account) return error('Invalid token');
      account.password = password;
      account.isVerified = true;
      delete account.resetToken;
      delete account.resetTokenExpires;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok();
    }

    function getAccounts() {
      if (!isAuthenticated()) return unauthorized();
      return ok(accounts.map(x => basicDetails(x)));
    }

    function getAccountById() {
      if (!isAuthenticated()) return unauthorized();
      const account = accounts.find(x => x.id === idFromUrl());
      if (account.id !== currentAccount()?.id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }
      return ok(basicDetails(account));
    }

    function createAccount() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      const account = body;
      if (accounts.find(x => x.email === account.email)) {
        return error(`Email ${account.email} is already registered`);
      }
      account.id = accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
      account.dateCreated = new Date().toISOString();
      account.isVerified = true;
      account.refreshTokens = [];
      delete account.confirmPassword;
      accounts.push(account);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok();
    }

    function updateAccount() {
      if (!isAuthenticated()) return unauthorized();
      const params = body;
      const account = accounts.find(x => x.id === idFromUrl());
      if (account.id !== currentAccount()?.id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }
      if (!params.password) delete params.password;
      delete params.confirmPassword;
      Object.assign(account, params);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok(basicDetails(account));
    }

    function deleteAccount() {
      if (!isAuthenticated()) return unauthorized();
      const account = accounts.find(x => x.id === idFromUrl());
      if (account.id !== currentAccount()?.id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }
      accounts = accounts.filter(x => x.id !== idFromUrl());
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok();
    }

    // Helper functions
    function ok(body?: any) {
      return of(new HttpResponse({ status: 200, body })).pipe(delay(500));
    }

    function error(message: string) {
      return throwError(() => ({ error: { message } })).pipe(materialize(), delay(500), dematerialize());
    }

    function unauthorized() {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } })).pipe(materialize(), delay(500), dematerialize());
    }

    function basicDetails(account: any) {
      const { id, title, firstName, lastName, email, role, isVerified } = account;
      return { id, title, firstName, lastName, email, role, isVerified };
    }

    function isAuthenticated() {
      return !!currentAccount();
    }

    function isAuthorized(role: any) {
      const account = currentAccount();
      return account?.role === role;
    }

    function idFromUrl() {
      const urlParts = url.split('/');
      return parseInt(urlParts[urlParts.length - 1]);
    }

    function currentAccount() {
      const authHeader = headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer fake-jwt-token')) return;
      const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
      const tokenExpired = Date.now() > (jwtToken.exp * 1000);
      if (tokenExpired) return;
      return accounts.find(x => x.id === jwtToken.id);
    }

    function generateJwtToken(account: any) {
      const tokenPayload = { exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000), id: account.id };
      return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
    }
  }
}

export const fakeBackendProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};