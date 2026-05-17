import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { Alert } from '../_models/alert';
import { AlertService } from '../_services/alert.service';

@Component({
  selector: 'alert',
  templateUrl: './alert.component.html',
  standalone: false
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input() id = 'default-alert';
  alerts: Alert[] = [];
  private alertSubscription!: Subscription;
  private routeSubscription!: Subscription;

  constructor(private router: Router, private alertService: AlertService) {}

  ngOnInit() {
    this.alertSubscription = this.alertService.onAlert(this.id)
      .subscribe((alert: Alert) => {
        if (!alert.message) {
          this.alerts = this.alerts.filter(x => x.keepAfterRouteChange);
          this.alerts.forEach(x => delete x.keepAfterRouteChange);
          return;
        }
        this.alerts.push(alert);
        if (alert.autoClose) setTimeout(() => this.removeAlert(alert), 3000);
      });
    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) this.alertService.clear(this.id);
    });
  }

  ngOnDestroy() {
    this.alertSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  removeAlert(alert: Alert): void {
    this.alerts = this.alerts.filter(x => x !== alert);
  }
}