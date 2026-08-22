import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
	selector: 'app-chatroom',
	imports: [ReactiveFormsModule],
	templateUrl: './chat.html',
	// styleUrl: './chat.scss',
})
export class Chatroom {
	private readonly formBuilder = inject(FormBuilder);

	readonly messageForm = this.formBuilder.nonNullable.group({
		message: ['', [Validators.required]],
	});

	submitted = false;

	onSubmit(): void {
		this.submitted = true;

		if (this.messageForm.invalid) {
			this.messageForm.markAllAsTouched();
			return;
		}
	}
}
