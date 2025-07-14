import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown-item',
  templateUrl: './dropdown-item.html',
  styleUrls: ['./dropdown-item.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DropdownItemComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() isDanger = false;
  @Output() selected = new EventEmitter<void>();

  onClick(event: Event): void {
    event.stopPropagation();
    this.selected.emit();
  }
}
