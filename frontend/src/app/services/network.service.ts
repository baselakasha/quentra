import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private _online$ = new BehaviorSubject<boolean>(navigator.onLine);
  readonly online$ = this._online$.asObservable();

  constructor() {
    window.addEventListener('online',  () => this._online$.next(true));
    window.addEventListener('offline', () => this._online$.next(false));
  }

  get isOnline(): boolean { return this._online$.getValue(); }
}
