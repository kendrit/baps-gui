<script>
	import ProductTile from './ProductTile.svelte';
	import ProductTileGrid from './ProductTileGrid.svelte';
	import Fa from 'svelte-fa/src/fa.svelte';
	import {faSun} from '@fortawesome/free-solid-svg-icons/index.es';
	export let name;
	let dark = false;
	function lightSwitch() {
		window.document.body.classList.toggle('dark-mode')
	}
</script>

<main>
	<h1 class="header"><strong>BAPS-GUI</strong><button on:click={lightSwitch}><Fa icon={faSun}/></button></h1>
	<div class="header subheader">
	<h2 class="header subheader">A GUI FOR <a href="https://www.reddit.com/r/buildapcsales"><strong>r/BUILDAPCSALES</strong></a></h2>
	</div>
	<ProductTileGrid/>
</main>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: auto;
		transition: color 0.3s;
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}

	main::-webkit-scrollbar {
		display: none;
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

	button {
		background-color: transparent;
		border-width: 0;
		color: #ff3e00;
	}

	button:hover {
		background-color: #ff3e00;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	:global(body) {
		background-color: #222;
		color: #ff3e00;
		transition: background-color 0.3s
	}
	:global(body.dark-mode) {
		background-color: #fff;
		color: #555;
	}
	:global(.product-tile-container.dark-mode) {
		background-color: #fff;
	}

</style>