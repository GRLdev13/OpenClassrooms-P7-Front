import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { login } from '../../Dtos/login.dto';
import { LoginService } from '../../Services/login.service';

@Component({
	selector: 'app-login',
	imports: [ReactiveFormsModule],
	templateUrl: './login.html',
	styleUrl: './login.scss',
})
export class LoginView {
	private readonly formBuilder = inject(FormBuilder);
	private readonly loginService = inject(LoginService);
	private readonly router = inject(Router);

	readonly loginForm = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
		isAdmin: false,
	});

	submitted = false;
	isLoading = false;
	errorMessage = '';
	successMessage = '';

	onSubmit(): void {
		this.submitted = true;

		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		const credentials = new login();
		credentials.email = this.loginForm.controls.email.value;
		credentials.password = this.loginForm.controls.password.value;

		this.isLoading = true;
		this.errorMessage = '';
		this.successMessage = '';

		const loginRequest = this.loginForm.controls.isAdmin.value
			? this.loginService.loginAdmin(credentials)
			: this.loginService.login(credentials);

		loginRequest
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: (response) => {
					const email = credentials.email.trim();

					if (typeof window !== 'undefined') {
						window.localStorage.setItem('user', JSON.stringify({
							id: email,
							name: email,
							email,
							isAdmin: this.loginForm.controls.isAdmin.value,
						}));

						if (response.token) {
							window.localStorage.setItem('token', response.token);
						}
					}

					this.successMessage = 'You are signed in.';
					void this.router.navigate(['/chatroom']);
				},
				error: () => (this.errorMessage = 'Unable to sign in. Check your details and try again.'),
			});
	}
}
