import { ApiKeyService } from './api-key.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { MailService } from './mail.service';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { SubtitleService } from './subtitle.service';
import { TmdbService } from './tmdb.service';

export class Services {
	auth() {
		return new AuthService();
	}

	mail() {
		return new MailService();
	}

	tmdb() {
		return new TmdbService();
	}

	cache() {
		return new CacheService();
	}

	subtitles() {
		return new SubtitleService();
	}

	stripe() {
		return new StripeService();
	}

	subscriptions() {
		return new SubscriptionService();
	}

	apiKeys() {
		return new ApiKeyService();
	}
}
