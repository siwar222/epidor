import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ContentComponent } from './components/content/content.component';
import { ContentBottomComponent } from './components/content/content-bottom/content-bottom.component';
import { ContentMainComponent } from './components/content/content-main/content-main.component';
import { ContentTopComponent } from './components/content/content-top/content-top.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AgvComponent } from './components/agv/agv.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
  
    AgvComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ContentComponent,
    ContentBottomComponent,
    ContentMainComponent,
    ContentTopComponent,
    ModalModule.forRoot()
  ],
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
