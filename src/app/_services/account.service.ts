import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export class Account {
  id?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  jwtToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountSubject: BehaviorSubject<Account | null>;
  public account: Observable<Account | null>;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.accountSubject = new BehaviorSubject<Account | null>(null);
    this.account = this.accountSubject.asObservable();
  }

  public get accountValue() {
    return this.accountSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/accounts/authenticate`, { email, password })
      .pipe(map(account => {
        this.accountSubject.next(account);
        return account;
      }));
  }

  logout() {
    this.accountSubject.next(null);
    this.router.navigate(['/account/login']);
  }

  register(account: any) {
    return this.http.post(`${environment.apiUrl}/accounts/register`, account);
  }

  verifyEmail(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/verify-email`, { token });
  }

  forgotPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/accounts/forgot-password`, { email });
  }

  validateResetToken(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/validate-reset-token`, { token });
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post(`${environment.apiUrl}/accounts/reset-password`, { token, password, confirmPassword });
  }

  getAll() {
    return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
  }

  getById(id: string) {
    return this.http.get<Account>(`${environment.apiUrl}/accounts/${id}`);
  }

  create(params: any) {
    return this.http.post(`${environment.apiUrl}/accounts`, params);
  }

  update(id: string, params: any) {
    return this.http.put(`${environment.apiUrl}/accounts/${id}`, params)
      .pipe(map((account: any) => {
        if (account.id == this.accountValue?.id) {
          account = { ...this.accountValue, ...account };
          this.accountSubject.next(account);
        }
        return account;
      }));
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/accounts/${id}`);
  }
}