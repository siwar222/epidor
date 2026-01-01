import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContentComponent } from './components/content/content.component';
import { AuthGuard } from './services/auth.guard';
import { AgvComponent } from './components/agv/agv.component';
import { SessionComponent } from './components/agv/session/session.component';
import { VisitComponent } from './components/agv/visit/visit';
import { VisitorsComponent } from './components/agv/visitors/visitors';
import { VisitTypesComponent } from './components/agv/visit-types/visit-types';


const routes: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: ContentComponent,
        children: [
            { path: '', component: AgvComponent },
            { path: 'agv', component: AgvComponent },
            { path: 'agv/session', component: SessionComponent },
            { path: 'agv/visit', component: VisitComponent },
            { path: 'agv/visitors', component: VisitorsComponent },
            { path: 'agv/visit-types', component: VisitTypesComponent },
            { path: ':userId', component: AgvComponent },
            

        ]
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
