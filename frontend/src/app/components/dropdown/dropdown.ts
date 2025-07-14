import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrls: ['./dropdown.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DropdownComponent {
  @Input() id = 'dropdown';
  @Input() label = '';
  @Input() icon = '';
  @Input() buttonClass = 'is-light';
  @Input() alignRight = false;
  @Input() isActive = false;
  @Output() itemSelected = new EventEmitter<void>();

  toggle(event: Event): void {
    event.stopPropagation();
    this.isActive = !this.isActive;
  }

  @HostListener('document:click')
  clickOutside(): void {
    if (this.isActive) {
      this.isActive = false;
    }
  }
}
