import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { AlertService } from '../_services/alert.service';
import { MustMatch } from '../_helpers/must-match.validator';

@Component({
  templateUrl: './register.component.html',
  standalone: false
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) return;

    this.submitting = true;
    this.accountService.register(this.form.value)
      .subscribe({
        next: () => {
          this.alertService.success('Registration successful', { keepAfterRouteChange: true });
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.submitting = false;
        }
      });
  }
}