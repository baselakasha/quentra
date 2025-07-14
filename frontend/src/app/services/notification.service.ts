import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor() {}

  /**
   * Show a success notification
   * @param message The message to display
   * @param title Optional title
   */
  success(message: string, title: string = 'Success'): void {
    this.showNotification(title, message, 'success');
  }

  /**
   * Show an error notification
   * @param message The error message to display
   * @param title Optional title
   */
  error(message: string, title: string = 'Error'): void {
    this.showNotification(title, message, 'error');
  }

  /**
   * Show a warning notification
   * @param message The warning message to display
   * @param title Optional title
   */
  warning(message: string, title: string = 'Warning'): void {
    this.showNotification(title, message, 'warning');
  }

  /**
   * Show an info notification
   * @param message The info message to display
   * @param title Optional title
   */
  info(message: string, title: string = 'Information'): void {
    this.showNotification(title, message, 'info');
  }

  /**
   * Show a confirmation dialog
   * @param options Configuration object
   * @returns Promise that resolves to the user's choice
   */
  async confirm(options: {
    title?: string,
    text: string,
    confirmButtonText?: string,
    cancelButtonText?: string,
    icon?: SweetAlertIcon
  }): Promise<boolean> {
    const result = await Swal.fire({
      title: options.title || 'Confirm Action',
      text: options.text,
      icon: options.icon || 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: options.confirmButtonText || 'Yes',
      cancelButtonText: options.cancelButtonText || 'Cancel'
    });

    return result.isConfirmed;
  }

  /**
   * Show a toast notification
   * @param message The message to display
   * @param type The type of toast
   */
  toast(message: string, type: SweetAlertIcon = 'success'): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  /**
   * Private method to show notifications
   */
  private showNotification(title: string, text: string, icon: SweetAlertIcon): void {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6'
    });
  }
}
