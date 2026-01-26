import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

declare var google: any;

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './address-autocomplete.component.html',
  styleUrl: './address-autocomplete.component.scss'
})
export class AddressAutocompleteComponent implements OnInit {
  @ViewChild('addressInput') addressInput!: ElementRef;
  @Input() placeholder: string = 'Enter address';
  @Input() label: string = 'Address';
  @Input() initialValue: string = '';
  @Output() addressSelected = new EventEmitter<{
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }>();

  address: string = '';

  ngOnInit() {
    this.address = this.initialValue;
  }

  ngAfterViewInit() {
    this.initAutocomplete();
  }

  initAutocomplete() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      setTimeout(() => this.initAutocomplete(), 500);
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      {
        types: ['address'],
        componentRestrictions: { country: ['in', 'us', 'uk'] }
      }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        return;
      }

      const addressComponents: any = {};
      place.address_components.forEach((component: any) => {
        const type = component.types[0];
        addressComponents[type] = component.long_name;
      });

      const addressData = {
        address: place.formatted_address,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        city: addressComponents.locality || addressComponents.administrative_area_level_2 || '',
        state: addressComponents.administrative_area_level_1 || '',
        country: addressComponents.country || '',
        postalCode: addressComponents.postal_code || ''
      };

      this.address = place.formatted_address;
      this.addressSelected.emit(addressData);
    });
  }
}
