<script lang="ts">
	import { Button } from 'svelte-akui';

	interface Props {
		/** Called when the user asks to build and download their map. */
		onbuild: () => void;
		/** Disables the button while a build is already running. */
		busy?: boolean;
	}

	let { onbuild, busy = false }: Props = $props();
</script>

<div class="build-controls">
	<Button variant="accent" size="large" onclick={onbuild} disabled={busy}>
		Build Custom GeoJSON
	</Button>
</div>
