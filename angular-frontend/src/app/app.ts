import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, finalize, timer } from 'rxjs';
import { FormsModule } from '@angular/forms'; // <-- IMPORT THIS
import { CommonModule } from '@angular/common'; // <-- Also good to import this for directives like @if

// --- DATA MODELS ---
interface User {
  id: number;
  name: string;
  email: string;
}

interface Policy {
  id: number;
  policyNumber: string;
  policyType: string;
  premium: number;
}

// --- TOASTER MODEL ---
interface Toaster {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true, // For standalone components, imports are declared here
  imports: [
    CommonModule,  // Provides Angular directives like @if, @for
    FormsModule    // Provides template-driven form features like [(ngModel)]
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  // --- STATE MANAGEMENT WITH SIGNALS ---
  page = signal<'home' | 'users' | 'policies'>('home');
  users = signal<User[]>([]);
  policies = signal<Policy[]>([]);
  
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Toaster notification signal
  toaster = signal<Toaster>({ message: '', type: 'success', isVisible: false });

  // Form field properties
  newUserName = '';
  newUserEmail = '';
  newPolicyNumber = '';
  newPolicyType = '';
  newPolicyPremium: number | null = null;

  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1';

  // --- NAVIGATION ---
  navigateTo(newPage: 'home' | 'users' | 'policies') {
    this.page.set(newPage);
    this.error.set(null);

    if (newPage === 'users') this.fetchUsers();
    if (newPage === 'policies') this.fetchPolicies();
  }

  // --- DATA FETCHING ---
  fetchUsers() {
    this.isLoading.set(true);
    this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoading.set(false))
    ).subscribe(data => this.users.set(data));
  }

  fetchPolicies() {
    this.isLoading.set(true);
    this.http.get<Policy[]>(`${this.API_URL}/policies`).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoading.set(false))
    ).subscribe(data => this.policies.set(data));
  }

  // --- DATA CREATION ---
  addUser() {
    if (!this.newUserName || !this.newUserEmail) return;

    const newUser = { name: this.newUserName, email: this.newUserEmail };
    this.isLoading.set(true);
    this.http.post<User>(`${this.API_URL}/users`, newUser).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoading.set(false))
    ).subscribe(createdUser => {
      this.users.update(current => [...current, createdUser]);
      this.showToaster(`User '${createdUser.name}' added successfully!`, 'success');
      this.newUserName = '';
      this.newUserEmail = '';
    });
  }

  addPolicy() {
    if (!this.newPolicyNumber || !this.newPolicyType || this.newPolicyPremium === null) return;
    
    const newPolicy = {
      policyNumber: this.newPolicyNumber,
      policyType: this.newPolicyType,
      premium: this.newPolicyPremium
    };
    this.isLoading.set(true);
    this.http.post<Policy>(`${this.API_URL}/policies`, newPolicy).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoading.set(false))
    ).subscribe(createdPolicy => {
      this.policies.update(current => [...current, createdPolicy]);
      this.showToaster(`Policy '${createdPolicy.policyNumber}' added successfully!`, 'success');
      this.newPolicyNumber = '';
      this.newPolicyType = '';
      this.newPolicyPremium = null;
    });
  }

  // --- TOASTER & ERROR HANDLING ---
  private showToaster(message: string, type: 'success' | 'error') {
    this.toaster.set({ message, type, isVisible: true });
    // Hide the toaster after 3 seconds
    timer(3000).subscribe(() => {
      this.toaster.update(current => ({ ...current, isVisible: false }));
    });
  }
  
  private handleError = (error: HttpErrorResponse) => {
    this.isLoading.set(false);
    const errorMessage = `Failed to connect to the server. (Error: ${error.status})`;
    this.error.set(errorMessage);
    this.showToaster('An error occurred. Please check the console.', 'error');
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

