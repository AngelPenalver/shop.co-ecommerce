import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import { firstValueFrom, map, catchError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);
    private readonly geonamesUsername: string;
    private readonly geonamesBaseUrl = 'http://api.geonames.org';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.geonamesUsername = this.configService.get<string>('GEONAMES_USERNAME') ?? (() => {
            throw new Error('Configuration error: GEONAMES_USERNAME environment variable is missing.');
        })();
        if (!this.geonamesUsername) {
            throw new Error('Configuration error: GEONAMES_USERNAME environment variable is missing.');
        }
    }

    // --- Método para Países ---
    async getCountries(): Promise<any[]> { 
        const url = `${this.geonamesBaseUrl}/countryInfoJSON?username=${this.geonamesUsername}`;
        try {
            const response = await firstValueFrom(
                this.httpService.get<{ geonames: any[] }>(url).pipe(
                    map(res => res.data.geonames), 
                    catchError(this.handleError('fetch countries'))
                )
            );
             return response.map(c => ({
                 geonameId: c.geonameId,
                 name: c.countryName,
                 iso2: c.countryCode,
             }));
        } catch (error) {
           this.logger.error(`Error in getCountries: ${error.message}`);
           throw error; 
        }
    }

    async getStatesByCountry(countryGeonameId: number | string): Promise<any[]> {
        const url = `${this.geonamesBaseUrl}/childrenJSON?geonameId=${countryGeonameId}&username=${this.geonamesUsername}`;
         try {
            const response = await firstValueFrom(
                this.httpService.get<{ geonames: any[] }>(url).pipe(
                    map(res => res.data.geonames),
                    catchError(this.handleError(`fetch states for geonameId ${countryGeonameId}`))
                )
            );
            return response
                .filter(s => s.fcode === 'ADM1') 
                .map(s => ({
                    geonameId: s.geonameId,
                    name: s.name,
                    iso2: s.adminCode1, 
                }));
        } catch (error) {
           this.logger.error(`Error in getStatesByCountry (${countryGeonameId}): ${error.message}`);
           throw error;
        }
    }

    // --- Método para Ciudades ---
    async getCitiesByState(stateGeonameId: number | string): Promise<any[]> {
         const url = `${this.geonamesBaseUrl}/childrenJSON?geonameId=${stateGeonameId}&username=${this.geonamesUsername}`; //&featureClass=P
          try {
             const response = await firstValueFrom(
                 this.httpService.get<{ geonames: any[] }>(url).pipe(
                     map(res => res.data.geonames),
                     catchError(this.handleError(`fetch cities for geonameId ${stateGeonameId}`))
                 )
             );
             return response
                 .filter(c => c.fcl === 'P') 
                 .map(c => ({
                     geonameId: c.geonameId,
                     name: c.name,
                     // ...
                 }));
         } catch (error) {
            this.logger.error(`Error in getCitiesByState (${stateGeonameId}): ${error.message}`);
            throw error;
         }
    }

    // Helper para manejo de errores de Axios
    private handleError(operation: string) {
        return (error: AxiosError) => {
            this.logger.error(`GeoNames API Error during ${operation}: ${error.response?.status} ${error.message}`);
            const status = error.response?.status || HttpStatus.SERVICE_UNAVAILABLE;
            let message = `Failed to ${operation}`;
            if (status === HttpStatus.UNAUTHORIZED) { // Podría ser por username inválido
                message = 'GeoNames authentication failed. Check username.';
            } else if (status === HttpStatus.TOO_MANY_REQUESTS) { // Límite alcanzado
                 message = 'GeoNames API limit reached.';
            }
            throw new HttpException(message, status);
        };
    }
}