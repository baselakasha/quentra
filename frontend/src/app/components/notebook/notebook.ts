import { Component, Input, AfterViewInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notebook.html',
  styleUrl: './notebook.scss'
})
export class NotebookComponent implements AfterViewInit {
  @Input() title: string = '';
  @Input() showSidePunches: boolean = true;
  @Input() centerContent: boolean = true;
  @Input() fullWidth: boolean = false;
  @Input() fixedHeight: boolean = false;
  
  sidePunches: number[] = [];
  private minPunches = 5;
  private maxPunches = 15;
  private punchSpacing = 4; // rem

  
  constructor(private el: ElementRef) {}
  
  ngAfterViewInit() {
    setTimeout(() => this.calculatePunches(), 0);
  }
  
  @HostListener('window:resize')
  onResize() {
    this.calculatePunches();
  }
  
  private calculatePunches() {
    // Skip calculation if side punches are hidden
    if (!this.showSidePunches) {
      this.sidePunches = [];
      return;
    }
    
    const containerElement = this.el.nativeElement.querySelector('.book__container');
    if (!containerElement) return;
    
    // If fixed height is used, we can calculate based on viewport height
    let containerHeight;
    if (this.fixedHeight) {
      containerHeight = window.innerHeight * 0.8; // 80vh
    } else {
      containerHeight = containerElement.offsetHeight;
    }
    
    const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    
    const containerHeightRem = containerHeight / remSize;
    
    const topMargin = 6;  // Increased top margin
    const bottomMargin = 6;  // Increased bottom margin
    
    const availableHeight = containerHeightRem - (topMargin + bottomMargin);
    const numberOfPunches = Math.min(
      this.maxPunches,
      Math.max(
        this.minPunches, 
        Math.floor(availableHeight / this.punchSpacing)
      )
    );
    
    this.sidePunches = [];
    
    if (numberOfPunches >= 2) {
      for (let i = 0; i < numberOfPunches; i++) {
        const position = topMargin + (i * (availableHeight / (numberOfPunches - 1)));
        this.sidePunches.push(parseFloat(position.toFixed(1)));
      }
    } else {
      this.sidePunches.push(parseFloat((containerHeightRem / 2).toFixed(1)));
    }
  }
}
