import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map, catchError, of } from 'rxjs'; // Importar 'of' de rxjs
import { AxiosError } from 'axios';

interface GeoNamesChild {
  geonameId: number;
  name: string;
  countryName?: string; // Para países
  countryCode?: string; // Para países
  fcode?: string; // Para estados (ADM1)
  adminCode1?: string; // Para estados
  fcl?: string; // Para ciudades (P)
  // ... cualquier otro campo que uses o esperes
}

interface GeoNamesResponse {
  geonames?: GeoNamesChild[]; // Hacer geonames opcional
  // Podría haber otros campos como 'totalResultsCount'
}

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);
  private readonly geonamesUsername: string;
  private readonly geonamesBaseUrl = 'http://api.geonames.org';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    const usernameFromConfig =
      this.configService.get<string>('GEONAMES_USERNAME');
    if (!usernameFromConfig) {
      this.logger.error(
        'Configuration error: GEONAMES_USERNAME environment variable is missing.'
      );
      throw new Error(
        'Configuration error: GEONAMES_USERNAME environment variable is missing.'
      );
    }
    this.geonamesUsername = usernameFromConfig;
  }

  //Get all countries
  async getCountries(): Promise<any[]> {
    const url = `${this.geonamesBaseUrl}/countryInfoJSON?username=${this.geonamesUsername}`;
    this.logger.log(`Fetching countries from: ${url}`);
    try {
      const data = await firstValueFrom(
        this.httpService.get<GeoNamesResponse>(url).pipe(
          map((res) => res.data.geonames || []),
          catchError(this.handleError('fetch countries'))
        )
      );
      return data.map((c) => ({
        geonameId: c.geonameId,
        name: c.countryName,
        iso2: c.countryCode,
      }));
    } catch (error) {
      this.logger.error(
        `Unexpected error in getCountries: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  //Get all states by country
  async getStatesByCountry(countryGeonameId: number | string): Promise<any[]> {
    if (
      !countryGeonameId ||
      countryGeonameId === 0 ||
      countryGeonameId === '0'
    ) {
      this.logger.warn(
        `getStatesByCountry called with invalid geonameId: ${countryGeonameId}. Returning empty array.`
      );
      return [];
    }

    const url = `${this.geonamesBaseUrl}/childrenJSON?geonameId=${countryGeonameId}&username=${this.geonamesUsername}`;
    this.logger.log(
      `Fetching states for country ${countryGeonameId} from: ${url}`
    );
    try {
      const data = await firstValueFrom(
        this.httpService.get<GeoNamesResponse>(url).pipe(
          map((res) => res.data.geonames || []),
          catchError(
            this.handleError(`fetch states for geonameId ${countryGeonameId}`)
          )
        )
      );
      return data
        .filter((s) => s.fcode === 'ADM1')
        .map((s) => ({
          geonameId: s.geonameId,
          name: s.name,
          iso2: s.adminCode1,
        }));
    } catch (error) {
      this.logger.error(
        `Unexpected error in getStatesByCountry (${countryGeonameId}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  //Get all cities by state
  async getCitiesByState(stateGeonameId: number | string): Promise<any[]> {
    if (!stateGeonameId || stateGeonameId === 0 || stateGeonameId === '0') {
      this.logger.warn(
        `getCitiesByState called with invalid geonameId: ${stateGeonameId}. Returning empty array.`
      );
      return [];
    }
    const url = `${this.geonamesBaseUrl}/childrenJSON?geonameId=${stateGeonameId}&username=${this.geonamesUsername}`;
    this.logger.log(`Fetching cities for state ${stateGeonameId} from: ${url}`);
    try {
      const data = await firstValueFrom(
        this.httpService.get<GeoNamesResponse>(url).pipe(
          map((res) => res.data.geonames || []),
          catchError(
            this.handleError(`fetch cities for geonameId ${stateGeonameId}`)
          )
        )
      );
      return data
        .filter((c) => c.fcl === 'P')
        .map((c) => ({
          geonameId: c.geonameId,
          name: c.name,
        }));
    } catch (error) {
      this.logger.error(
        `Unexpected error in getCitiesByState (${stateGeonameId}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private handleError(operation: string) {
    return (error: AxiosError) => {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const responseData = error.response?.data as any;
      let message = `Failed to ${operation}.`;

      if (responseData && responseData.status && responseData.status.message) {
        message = `GeoNames API Error: ${responseData.status.message} (Operation: ${operation})`;
        this.logger.error(`${message} - Status: ${responseData.status.value}`);
      } else {
        this.logger.error(
          `GeoNames API HTTP Error during ${operation}: ${status} ${error.message}`,
          error.stack
        );
        if (status === HttpStatus.UNAUTHORIZED) {
          message = 'GeoNames authentication failed. Check GEONAMES_USERNAME.';
        } else if (status === HttpStatus.FORBIDDEN) {
          // Otro posible error de autenticación o autorización
          message =
            'GeoNames access forbidden. Check API key permissions or usage limits.';
        } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
          message = 'GeoNames API rate limit reached.';
        } else if (status === HttpStatus.NOT_FOUND) {
          message = `Resource not found for ${operation}. Check geonameId.`;
        }
      }
      throw new HttpException(
        { message, geonamesError: responseData?.status },
        status
      );
    };
  }
}
