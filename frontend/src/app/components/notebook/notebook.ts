import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notebook.html',
  styleUrl: './notebook.scss'
})
export class NotebookComponent {
  @Input() title: string = '';
}
