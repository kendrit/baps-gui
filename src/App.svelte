<script>
	import ProductTile from './ProductTile.svelte';
	export let name;
	export let apikey;
	let tempapikey;
	let showKey = false;
	let editing = false;
	function saveApiKey() {
		showKey = true;
		editing = false;
		apikey = tempapikey;
	}
	function editApiKey() {
		editing = true;
	}
	function showOrHideApiKey() {
		showKey = !showKey;
	}
</script>

<main>
	<h1 class="header"><strong>BAPS-GUI</strong></h1>
	<div class="header subheader">
		<h2 class="header subheader">A GUI FOR <strong>r/BUILDAPCSALES</strong></h2>
		<h3>
			<strong>
				Your current API key: </strong>{showKey ? apikey : " "} 
				<button hidden={!apikey} on:click={showOrHideApiKey}>{showKey ? "HIDE" : "SHOW"}</button>
			<button on:click={editApiKey}>EDIT</button>
		</h3>
	</div>
	{#if editing}
		<div class="api-key header">
			<input type="text" bind:value={tempapikey}/>
			<button on:click={saveApiKey}>SAVE</button>
		</div>
	{/if}
	<h2 class="header">AVAILABLE PRODUCTS:</h2>
	<ProductTile />
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
</style>