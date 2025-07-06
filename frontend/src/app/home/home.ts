import { Component } from '@angular/core';
import { NotebookComponent } from '../components/notebook/notebook';

@Component({
  selector: 'app-home',
  imports: [NotebookComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
