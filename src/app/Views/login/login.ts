import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
	selector: 'app-login',
	imports: [ReactiveFormsModule],
	templateUrl: './login.html',
	styleUrl: './login.scss',
})
export class LoginView {
	private readonly formBuilder = inject(FormBuilder);

	readonly loginForm = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
	});

	submitted = false;

	onSubmit(): void {
		this.submitted = true;

		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}
	}
}