import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private authStateChangedSource = new BehaviorSubject<boolean>(false);
  authStateChanged$ = this.authStateChangedSource.asObservable();

  notifyAuthStateChanged(): void {
    this.authStateChangedSource.next(true);
  }
}
