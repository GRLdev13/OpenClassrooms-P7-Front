import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
	selector: 'app-register',
	imports: [ReactiveFormsModule],
	templateUrl: './register.html',
	styleUrl: './register.scss',
})
export class RegisterView {
	private readonly formBuilder = inject(FormBuilder);

	readonly registerForm = this.formBuilder.nonNullable.group({
		firstName: ['', [Validators.required, Validators.minLength(2)]],
		lastName: ['', [Validators.required, Validators.minLength(2)]],
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
	});

	submitted = false;

	onSubmit(): void {
		this.submitted = true;

		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}
	}
}
