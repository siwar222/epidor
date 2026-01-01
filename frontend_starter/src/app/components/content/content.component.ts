import { Component } from '@angular/core';
import { ContentBottomComponent } from './content-bottom/content-bottom.component';
import { ContentMainComponent } from './content-main/content-main.component';
import { ContentTopComponent } from './content-top/content-top.component';
import { TokenCheckService } from '../../services/tokenCheck.service';


@Component({
  selector: 'app-content',
  standalone: true,
  templateUrl: './content.component.html',
  styleUrl: './content.component.css',
  imports: [ContentBottomComponent, ContentMainComponent, ContentTopComponent]
})
export class ContentComponent {
  constructor(private tokenCheckService: TokenCheckService) { }
}
