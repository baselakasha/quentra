import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';
import { Category } from '../../types/budget.types';

// Register Chart.js components
Chart.register(PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-spending-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spending-chart.html',
  styleUrl: './spending-chart.scss'
})
export class SpendingChartComponent implements OnChanges, AfterViewInit {
  @Input() categories: Category[] = [];
  @ViewChild('spendingChart') spendingChartCanvas!: ElementRef;
  
  spendingChart: Chart | null = null;

  constructor() {}
  
  ngAfterViewInit() {
    this.initSpendingChart();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['categories']) {
      // Always update when categories change
      setTimeout(() => {
        this.updateChart();
      }, 0);
    }
  }
  
  // Initialize spending pie chart
  initSpendingChart() {
    setTimeout(() => {
      if (this.spendingChartCanvas && this.categories && this.categories.length > 0) {
        const ctx = this.spendingChartCanvas.nativeElement.getContext('2d');
        
        if (this.spendingChart) {
          this.spendingChart.destroy();
        }
        
        this.spendingChart = new Chart(ctx, {
          type: 'pie',
          data: this.getChartData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#ffffff'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.raw as number;
                    const percentage = (value / this.getTotalSpent() * 100).toFixed(1);
                    return `${label}: £${value.toFixed(2)} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }, 0);
  }
  
  // Prepare chart data from categories
  getChartData() {
    const labels = this.categories?.map(cat => cat.name) || [];
    const data = this.categories?.map(cat => cat.spentAmount) || [];
    
    // Generate colors for each category
    const colors = this.generateChartColors(labels.length);
    
    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    };
  }
  
  // Generate a nice color palette for the chart with semi-transparency
  generateChartColors(count: number) {
    const baseColors = [
      'rgba(255, 99, 132, 0.7)', // #FF6384 with alpha
      'rgba(54, 162, 235, 0.7)', // #36A2EB with alpha
      'rgba(255, 206, 86, 0.7)', // #FFCE56 with alpha
      'rgba(75, 192, 192, 0.7)', // #4BC0C0 with alpha
      'rgba(153, 102, 255, 0.7)', // #9966FF with alpha
      'rgba(255, 159, 64, 0.7)', // #FF9F40 with alpha
      'rgba(138, 194, 73, 0.7)', // #8AC249 with alpha
      'rgba(234, 85, 69, 0.7)', // #EA5545 with alpha
      'rgba(244, 106, 155, 0.7)', // #F46A9B with alpha
      'rgba(239, 154, 154, 0.7)'  // #EF9A9A with alpha
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
  
  // Update chart when data changes
  updateChart() {
    if (this.categories && this.categories.length > 0) {
      if (this.spendingChart) {
        this.spendingChart.data = this.getChartData();
        this.spendingChart.update();
      } else {
        this.initSpendingChart();
      }
    } else if (this.spendingChart) {
      // If there are no categories but we have a chart, destroy it
      this.spendingChart.destroy();
      this.spendingChart = null;
    }
  }
  
  // Calculate total spent
  getTotalSpent(): number {
    if (!this.categories || this.categories.length === 0) return 0;
    return this.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  }
}
