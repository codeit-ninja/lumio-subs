import { CacheService } from './cache.service';
import { SubtitleService } from './subtitle.service';
import { TmdbService } from './tmdb.service';

export class Services {
	tmdb() {
		return new TmdbService();
	}

	cache() {
		return new CacheService();
	}

	subtitles() {
		return new SubtitleService();
	}
}
