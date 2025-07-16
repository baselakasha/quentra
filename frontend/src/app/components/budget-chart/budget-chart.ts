import { Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Budget } from '../../types/budget.types';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-chart.html',
  styleUrl: './budget-chart.scss'
})
export class BudgetChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() budgets: Budget[] = [];
  @Input() loading: boolean = true;
  
  chart: Chart | null = null;
  
  constructor() {}
  
  ngOnInit(): void {
    this.setChartDefaults();
  }
  
  ngAfterViewInit(): void {
    // Initialize chart after the view is initialized and data is loaded
    if (!this.loading && this.budgets.length > 0) {
      this.createChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // When budgets data changes, recreate the chart
    if (changes['budgets'] && !changes['budgets'].firstChange) {
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
    
    // When loading state changes to false, create the chart
    if (changes['loading'] && !changes['loading'].currentValue && this.budgets.length > 0) {
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
  }
  
  ngOnDestroy(): void {
    // Clean up chart when component is destroyed
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  // Set global chart defaults for white text
  private setChartDefaults(): void {
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
  }
  
  // Create a chart showing income, spending, and savings for each budget
  createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    
    const canvas = document.getElementById('budgetChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Prepare data for the chart - only showing individual budgets, no totals
    const labels = this.budgets.map(budget => budget.name);
    
    const incomeData = this.budgets.map(budget => 
      this.hasMonthlyIncome(budget) ? budget.monthlyIncome! : 0
    );
    
    const spendingData = this.budgets.map(budget => this.getTotalSpent(budget));
    const savingsData = this.budgets.map(budget => this.getSavings(budget));
    
    // Create the chart
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monthly Income',
            data: incomeData,
            borderColor: '#3273dc',
            backgroundColor: 'rgba(50, 115, 220, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Actual Spending',
            data: spendingData,
            borderColor: '#ef476f',
            backgroundColor: 'rgba(241, 70, 104, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Actual Savings',
            data: savingsData,
            borderColor: '#48c774',
            backgroundColor: 'rgba(72, 199, 116, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'white',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '£' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white',
              font: {
                size: 12
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white',
              callback: function(value) {
                return '£' + value;
              }
            }
          }
        }
      }
    });
  }
  
  // Helper methods for chart data
  
  // Check if a budget has monthly income set
  hasMonthlyIncome(budget: Budget): boolean {
    return budget.monthlyIncome !== undefined && budget.monthlyIncome !== null && budget.monthlyIncome > 0;
  }
  
  // Calculate total spent for a budget
  getTotalSpent(budget: Budget): number {
    if (!budget.categories) return 0;
    return budget.categories.reduce((total, category) => total + (category.spentAmount || 0), 0);
  }
  
  // Calculate savings for a budget
  getSavings(budget: Budget): number {
    if (!this.hasMonthlyIncome(budget)) return 0;
    return budget.monthlyIncome! - this.getTotalSpent(budget);
  }
}
