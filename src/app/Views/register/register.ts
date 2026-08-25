import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
	private readonly router = inject(Router);
	private readonly randomCharacters = Math.random().toString(36).slice(2, 8);

	readonly registerForm = this.formBuilder.nonNullable.group({
		firstName: [`User-${this.randomCharacters}`, [Validators.required, Validators.minLength(2)]],
		lastName: [`Test-${this.randomCharacters}`, [Validators.required, Validators.minLength(2)]],
		email: [`${this.randomCharacters}@test.com`, [Validators.required, Validators.email]],
		password: ['totototo', [Validators.required, Validators.minLength(8)]],
		phone: ['0600000000', Validators.required],
		birthday: ['2000-01-01', Validators.required],
		address: [`${this.randomCharacters} street`, Validators.required],
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
		details.firstName = this.registerForm.controls.firstName.value;
		details.lastName = this.registerForm.controls.lastName.value;
		details.email = this.registerForm.controls.email.value;
		details.password = this.registerForm.controls.password.value;
		details.phone = this.registerForm.controls.phone.value;
		details.birthday = new Date(this.registerForm.controls.birthday.value);
		details.address = this.registerForm.controls.address.value;

		this.isLoading = true;
		this.errorMessage = '';
		this.successMessage = '';

		this.registerService
			.register(details)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: () => {
					this.successMessage = 'Your account has been created.';
					void this.router.navigate(['/login']);
				},
				error: () => (this.errorMessage = 'Unable to create your account. Please try again.'),
			});
	}
}
