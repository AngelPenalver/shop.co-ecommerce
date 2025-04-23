// src/locations/locations.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'; // Importa ParseIntPipe
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('/countries')
  async getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('/states/:countryGeonameId') 
  async getStates(
    @Param('countryGeonameId', ParseIntPipe) countryGeonameId: number
  ) {
    return this.locationsService.getStatesByCountry(countryGeonameId);
  }

  @Get('/cities/:stateGeonameId')
  async getCities(
    @Param('stateGeonameId', ParseIntPipe) stateGeonameId: number 
    ) {
    return this.locationsService.getCitiesByState(stateGeonameId);
  }
}