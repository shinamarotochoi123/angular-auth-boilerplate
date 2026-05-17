import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class Account {
  id?: string;
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
    return this.http.post<any>(`/accounts/authenticate`, { email, password })
      .pipe(map(account => {
        this.accountSubject.next(account);
        return account;
      }));
  }

  logout() {
    this.accountSubject.next(null);
    this.router.navigate(['/account/login']);
  }

  register(account: Account) {
    return this.http.post(`/accounts/register`, account);
  }
}