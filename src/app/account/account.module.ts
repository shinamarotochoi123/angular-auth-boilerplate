import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';

@NgModule({
  declarations: [LayoutComponent, LoginComponent, RegisterComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: LayoutComponent, children: [
        { path: 'login', component: LoginComponent },
        { path: 'register', component: RegisterComponent }
      ]}
    ])
  ]
})
export class AccountModule { }