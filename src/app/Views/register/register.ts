import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { register } from '../../Dtos/register.dto';
import { RegisterService } from '../../Services/register.service';

@Component({
	selector: 'app-register',
	imports: [ReactiveFormsModule],
	templateUrl: './register.html',
	styleUrl: './register.scss',
})
export class RegisterView {
	private readonly formBuilder = inject(FormBuilder);
	private readonly registerService = inject(RegisterService);

	readonly registerForm = this.formBuilder.nonNullable.group({
		firstName: ['', [Validators.required, Validators.minLength(2)]],
		lastName: ['', [Validators.required, Validators.minLength(2)]],
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
	});

	submitted = false;
	isLoading = false;
	errorMessage = '';
	successMessage = '';

	onSubmit(): void {
		this.submitted = true;

		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		const details = new register();
		details.first_name = this.registerForm.controls.firstName.value;
		details.last_name = this.registerForm.controls.lastName.value;
		details.email = this.registerForm.controls.email.value;
		details.password = this.registerForm.controls.password.value;

		this.isLoading = true;
		this.errorMessage = '';
		this.successMessage = '';

		this.registerService
			.register(details)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: () => (this.successMessage = 'Your account has been created.'),
				error: () => (this.errorMessage = 'Unable to create your account. Please try again.'),
			});
	}
}
