import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { AccountService } from '../_services/account.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private accountService: AccountService
  ) { }

  canActivate(route: ActivatedRouteSnapshot) {
    const account = this.accountService.accountValue;
    if (account) {
      return true;
    }
    this.router.navigate(['/account/login'], { queryParams: { returnUrl: route.url } });
    return false;
  }
}