<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
</script>

<svelte:head>
	<title>Authentication · SubREST</title>
	<meta name="description" content="SubREST email login, verification, and SMTP configuration." />
</svelte:head>

<h1>Authentication</h1>
<p>
	End-user accounts use PocketBase <code>users</code> with
	<strong>email verification required before login</strong>
	(<code>authRule: verified = true</code>).
</p>

<ol>
	<li>Header <strong>Login</strong> → <code>/login</code> (login + register tabs)</li>
	<li>Register creates an unverified user and the app sends a branded verification email</li>
	<li>User opens <code>/verify?token=…</code> → account becomes usable</li>
	<li>Login sets an HTTP-only <code>pb_auth</code> cookie</li>
</ol>

<div class="mb-6">
	<Button href="/login" size="sm">
		<Icon icon="lucide:log-in" class="size-3.5 shrink-0" />
		Go to login
	</Button>
</div>

<h2>SMTP (app outbound)</h2>
<p>
	Verification mail is sent by the <strong>SvelteKit app</strong> (not PocketBase templates). Configure:
</p>
<table>
	<thead>
		<tr>
			<th>Variable</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>SMTP_HOST</code></td>
			<td>e.g. <code>smtp.mx.cloudflare.net</code></td>
		</tr>
		<tr>
			<td><code>SMTP_PORT</code></td>
			<td><code>465</code> (TLS) or <code>587</code></td>
		</tr>
		<tr>
			<td><code>SMTP_USER</code> / <code>PASSWORD</code></td>
			<td>SMTP credentials</td>
		</tr>
		<tr>
			<td><code>SMTP_FROM</code></td>
			<td>e.g. <code>SubREST &lt;noreply@your-domain&gt;</code></td>
		</tr>
		<tr>
			<td><code>AUTH_VERIFICATION_SECRET</code></td>
			<td>HMAC secret for verify links (long random)</td>
		</tr>
	</tbody>
</table>
<p>
	<code>SMTP_FROM</code> must use a domain you’re allowed to send from (SPF/DKIM on your DNS).
</p>

<h2>Local notes</h2>
<p>
	Without SMTP env, registration still creates the user but sending the verification email will fail
	until mail is configured. Restart PocketBase after pulling so the email-verification migration
	applies.
</p>
