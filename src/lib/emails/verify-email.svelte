<script lang="ts">
	import {
		Body,
		Button,
		Container,
		Head,
		Hr,
		Html,
		Link,
		Preview,
		Section,
		Text
	} from '@better-svelte-email/components';

	interface Props {
		name?: string | null;
		verifyUrl?: string;
	}

	let { name = null, verifyUrl = 'http://127.0.0.1:5180/verify?token=preview-token' }: Props =
		$props();

	const greeting = $derived(name?.trim() || 'there');
</script>

<Html>
	<Head />
	<Preview preview="Verify your SubREST email" />
	<Body
		style="background-color: #09090b; margin: 0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
	>
		<Container
			style="background-color: #18181b; border-radius: 12px; margin: 0 auto; padding: 40px 32px; max-width: 480px;"
		>
			<Section>
				<Text
					as="h1"
					style="color: #f4f4f5; font-size: 24px; font-weight: 700; line-height: 32px; margin: 0 0 16px;"
				>
					Verify your email
				</Text>
				<Text style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin: 0 0 8px;">
					Hi {greeting},
				</Text>
				<Text style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin: 0 0 28px;">
					Thanks for signing up for SubREST. Click the button below to verify your email and
					activate your account.
				</Text>
				<Button
					href={verifyUrl}
					pX={24}
					pY={12}
					style="background-color: #7c3aed; border-radius: 8px; color: #ffffff; font-size: 15px; font-weight: 600; text-align: center;"
				>
					Verify email
				</Button>
				<Text style="color: #71717a; font-size: 13px; line-height: 20px; margin: 28px 0 0;">
					If the button doesn’t work, copy and paste this link into your browser:
				</Text>
				<Text style="font-size: 13px; line-height: 20px; margin: 8px 0 0; word-break: break-all;">
					<Link href={verifyUrl} style="color: #a78bfa; text-decoration: underline;">
						{verifyUrl}
					</Link>
				</Text>
				<Hr style="border-color: #27272a; margin: 32px 0;" />
				<Text style="color: #71717a; font-size: 12px; line-height: 18px; margin: 0;">
					If you didn’t create a SubREST account, you can safely ignore this email. This link
					expires in 24 hours.
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
