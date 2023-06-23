<script>
	export let data;
	console.log(data);
	console.log('helleo');
</script>

<h1>{data.meta.title}</h1>
<!-- <div>{@html data.content}</div> -->
<div class="prose">
	<svelte:component this={data.content} />
</div>
