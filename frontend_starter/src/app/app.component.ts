import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  constructor(private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle("Portail D'application");
  }
}
