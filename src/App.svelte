<script>
	import ProductTile from './ProductTile.svelte';
	import ProductTileGrid from './ProductTileGrid.svelte';
	export let name;
	export let filters = [];
	let dark = false;
	function lightSwitch() {
		window.document.body.classList.toggle('dark-mode')
	}
</script>

<main>
	<h1 class="header"><strong>BAPS-GUI</strong><button on:click={lightSwitch}>dark mode</button></h1>
	<div class="header subheader">
		<h2 class="header subheader">A GUI FOR <strong>r/BUILDAPCSALES</strong></h2>
	</div>
	<h2 class="header">AVAILABLE PRODUCTS:</h2>
	<ProductTileGrid/>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: auto;
	}

	.header {
		display: block;
		text-align: left;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	h2 {
		color: #ff3e00;
		font-size: 2em;
		font-weight: 100;
	}

	h3 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 1em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	:global(body) {
		background-color: #ffffff;
		color: #555;
		transition: background-color 0.3s
	}
	:global(body.dark-mode) {
		background-color: #222;
		color: #ff3e00;
	}
</style>