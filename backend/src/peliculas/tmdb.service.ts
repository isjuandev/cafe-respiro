import { Injectable, Logger } from '@nestjs/common';

export interface TmdbMovieResult {
  id: number;
  titulo: string;
  originalTitulo?: string;
  anio?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);

  private get apiKey(): string | undefined {
    return process.env.TMDB_API_KEY;
  }

  isEnabled(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async searchMovies(query: string): Promise<{ enabled: boolean; results: TmdbMovieResult[] }> {
    if (!this.isEnabled()) {
      return { enabled: false, results: [] };
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { enabled: true, results: [] };
    }

    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(
        trimmed
      )}&language=es-MX&include_adult=false`;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        this.logger.warn(`TMDB API error ${res.status}: ${await res.text()}`);
        return { enabled: true, results: [] };
      }

      const data = await res.json();
      const results: TmdbMovieResult[] = (data.results || []).slice(0, 8).map((item: any) => {
        const anio = item.release_date ? parseInt(item.release_date.split('-')[0], 10) : null;
        return {
          id: item.id,
          titulo: item.title,
          originalTitulo: item.original_title,
          anio: Number.isNaN(anio) ? null : anio,
          sinopsis: item.overview || null,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        };
      });

      return { enabled: true, results };
    } catch (e) {
      this.logger.warn(`Error al consultar TMDB API: ${e}`);
      return { enabled: true, results: [] };
    }
  }
}
