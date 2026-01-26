import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-google-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer style="width: 100%; height: 400px; border-radius: 8px;"></div>
  `,
  styles: []
})
export class GoogleMapComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude: number = 0;
  @Input() longitude: number = 0;
  @Input() address: string = '';
  @Input() zoom: number = 15;

  map: any;
  marker: any;

  ngOnInit() {
    // Wait for map container to be ready
    setTimeout(() => this.initMap(), 100);
  }

  ngOnChanges() {
    if (this.map && this.latitude && this.longitude) {
      this.updateMap();
    }
  }

  initMap() {
    if (typeof google === 'undefined' || !google.maps) {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    if (!this.mapContainer) {
      return;
    }

    const position = { lat: this.latitude || 0, lng: this.longitude || 0 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: position,
      zoom: this.zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });

    if (this.latitude && this.longitude) {
      this.marker = new google.maps.Marker({
        position: position,
        map: this.map,
        title: this.address || 'Service Location',
        animation: google.maps.Animation.DROP
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 10px;">
          <h3 style="margin: 0 0 5px 0;">${this.address || 'Service Location'}</h3>
          <p style="margin: 0; color: #666;">Lat: ${this.latitude.toFixed(6)}, Lng: ${this.longitude.toFixed(6)}</p>
        </div>`
      });

      this.marker.addListener('click', () => {
        infoWindow.open(this.map, this.marker);
      });
    }
  }

  updateMap() {
    const position = { lat: this.latitude, lng: this.longitude };
    
    this.map.setCenter(position);
    
    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new google.maps.Marker({
      position: position,
      map: this.map,
      title: this.address || 'Service Location',
      animation: google.maps.Animation.DROP
    });
  }
}
