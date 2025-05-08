// src/locations/locations.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({ summary: 'Get all country' })
  @ApiResponse({ status: 200, description: 'Country found' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @Get('/countries')
  async getCountries() {
    return this.locationsService.getCountries();
  }

  @ApiOperation({ summary: 'Get all State' })
  @ApiResponse({ status: 200, description: 'State found' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @Get('/states/:countryGeonameId')
  async getStates(
    @Param('countryGeonameId', ParseIntPipe) countryGeonameId: number
  ) {
    return this.locationsService.getStatesByCountry(countryGeonameId);
  }

  @ApiOperation({ summary: 'Get all Cities' })
  @ApiResponse({ status: 200, description: 'Cities found' })
  @ApiResponse({ status: 404, description: 'Cities not found' })
  @Get('/cities/:stateGeonameId')
  async getCities(
    @Param('stateGeonameId', ParseIntPipe) stateGeonameId: number
  ) {
    return this.locationsService.getCitiesByState(stateGeonameId);
  }
}
