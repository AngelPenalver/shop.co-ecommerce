// src/locations/locations.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
  imports: [
    HttpModule, 
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService], 
})
export class LocationsModule {}