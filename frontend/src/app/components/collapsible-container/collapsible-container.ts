import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collapsible-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collapsible-container.html',
  styleUrl: './collapsible-container.scss'
})
export class CollapsibleContainerComponent {
  @Input() isExpanded: boolean = false;
  @Input() title: string = '';
  @Input() isPinned: boolean = false;
  @Input() headerClass: string = '';
  @Input() bodyClass: string = '';
  @Input() showToggleIcon: boolean = true;
  
  @Output() toggleExpand = new EventEmitter<boolean>();
  
  @ContentChild('headerContent') headerContent!: TemplateRef<any>;
  @ContentChild('headerActions') headerActions!: TemplateRef<any>;
  @ContentChild('bodyContent') bodyContent!: TemplateRef<any>;
  
  toggle() {
    this.isExpanded = !this.isExpanded;
    this.toggleExpand.emit(this.isExpanded);
  }
}
