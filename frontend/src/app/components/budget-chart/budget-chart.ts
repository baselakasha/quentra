import { Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget } from '../../types/budget.types';
import Chart from 'chart.js/auto';
import { DropdownComponent } from '../dropdown';
import { DropdownItemComponent } from '../dropdown-item';

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, DropdownItemComponent],
  templateUrl: './budget-chart.html',
  styleUrl: './budget-chart.scss'
})
export class BudgetChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() budgets: Budget[] = [];
  @Input() loading: boolean = true;
  
  chart: Chart | null = null;
  selectedBudgets: Record<string, boolean> = {};
  searchTerm: string = '';
  filteredBudgets: Budget[] = [];
  
  constructor() {}
  
  ngOnInit(): void {
    this.setChartDefaults();
    this.filterBudgets();
  }
  
  // Filter budgets based on search term
  filterBudgets(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBudgets = [...this.budgets];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredBudgets = this.budgets.filter(budget => 
        budget.name.toLowerCase().includes(searchTermLower)
      );
    }
  }
  
  initializeSelectedBudgets(): void {
    // Reset selected budgets
    this.selectedBudgets = {};
    
    // Select all budgets by default
    this.budgets.forEach(budget => {
      if (budget.id !== undefined) {
        this.selectedBudgets[budget.id] = true;
      }
    });
    
    // Initialize filtered budgets
    this.filteredBudgets = [...this.budgets];
  }
  
  ngAfterViewInit(): void {
    // Initialize chart after the view is initialized and data is loaded
    if (!this.loading && this.budgets.length > 0) {
      this.initializeSelectedBudgets();
      this.createChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // When budgets data changes, update selections and recreate the chart
    if (changes['budgets']) {
      if (this.budgets.length > 0) {
        this.initializeSelectedBudgets();
        this.filterBudgets(); // Update filtered budgets
      }
      
      if (!changes['budgets'].firstChange) {
        setTimeout(() => {
          this.createChart();
        }, 100);
      }
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
    
    // Filter budgets based on selection
    const filteredBudgets = this.budgets.filter(budget => 
      budget.id !== undefined && this.selectedBudgets[budget.id]
    );
    
    if (filteredBudgets.length === 0) {
      // No budgets selected, clear the chart
      this.chart = null;
      return;
    }
    
    // Prepare data for the chart - only showing selected budgets
    const labels = filteredBudgets.map(budget => budget.name);
    
    const incomeData = filteredBudgets.map(budget => 
      this.hasMonthlyIncome(budget) ? Number(budget.monthlyIncome!) : 0
    );
    
    const spendingData = filteredBudgets.map(budget => this.getTotalSpent(budget));
    const savingsData = filteredBudgets.map(budget => this.getSavings(budget));
    
    // Debug log to check data
    console.log('Chart Data:', {
      labels,
      incomeData,
      spendingData,
      savingsData
    });
    
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
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Actual Spending',
            data: spendingData,
            borderColor: '#ef476f',
            backgroundColor: 'rgba(241, 70, 104, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Actual Savings',
            data: savingsData,
            borderColor: '#48c774',
            backgroundColor: 'rgba(72, 199, 116, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
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
    return budget.monthlyIncome !== undefined && budget.monthlyIncome !== null && Number(budget.monthlyIncome) > 0;
  }
  
  // Calculate total spent for a budget
  getTotalSpent(budget: Budget): number {
    if (!budget.categories) return 0;
    const total = budget.categories.reduce((sum, category) => {
      const spent = Number(category.spentAmount) || 0;
      return sum + spent;
    }, 0);
    return total;
  }
  
  // Calculate savings for a budget
  getSavings(budget: Budget): number {
    if (!this.hasMonthlyIncome(budget)) return 0;
    const income = Number(budget.monthlyIncome!);
    const spent = this.getTotalSpent(budget);
    return income - spent;
  }
  
  // Toggle budget selection
  toggleBudgetSelection(budgetId: string | undefined): void {
    if (budgetId === undefined) return;
    
    this.selectedBudgets[budgetId] = !this.selectedBudgets[budgetId];
    
    // Update chart with new selection
    this.createChart();
  }
  
  // Check if all budgets are selected
  areAllBudgetsSelected(): boolean {
    return this.budgets.every(budget => 
      budget.id !== undefined && this.selectedBudgets[budget.id]
    );
  }
  
  // Toggle all budgets selection
  toggleAllBudgets(): void {
    const selectAll = !this.areAllBudgetsSelected();
    
    this.budgets.forEach(budget => {
      if (budget.id !== undefined) {
        this.selectedBudgets[budget.id] = selectAll;
      }
    });
    
    // Update chart with new selection
    this.createChart();
  }
  
  // Get a label showing how many budgets are selected
  getSelectedBudgetsLabel(): string {
    const selectedCount = Object.values(this.selectedBudgets).filter(v => v).length;
    const totalCount = this.budgets.length;
    
    if (selectedCount === 0) {
      return 'No budgets selected';
    } else if (selectedCount === totalCount) {
      return 'All budgets';
    } else {
      return `${selectedCount} of ${totalCount} budgets`;
    }
  }
}
