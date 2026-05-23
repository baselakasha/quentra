import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private authStateChangedSource = new BehaviorSubject<boolean>(false);
  authStateChanged$ = this.authStateChangedSource.asObservable();

  private dataSyncedSource = new Subject<void>();
  dataSynced$ = this.dataSyncedSource.asObservable();

  notifyAuthStateChanged(): void {
    this.authStateChangedSource.next(true);
  }

  notifyDataSynced(): void {
    this.dataSyncedSource.next();
  }
}
