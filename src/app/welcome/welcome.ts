import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.router.navigate(['/signup']);
      }, 2000);
    }
  }
}
