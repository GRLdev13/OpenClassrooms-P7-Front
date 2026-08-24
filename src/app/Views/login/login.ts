import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

	readonly loginForm = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
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

		this.loginService
			.login(credentials)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: () => (this.successMessage = 'You are signed in.'),
				error: () => (this.errorMessage = 'Unable to sign in. Check your details and try again.'),
			});
	}
}
