<script>
	import { formatDate } from '$lib/utils';
	// import * as config from '$lib/config';

	export let data;
</script>

<div class="post-list">
	<div class="category">
		<p>All</p>
		<p>AI</p>
	</div>
	{#each data.posts as post}
		<div class="posts">
			<a href="blog/{post.slug}" class="title">{post.title}</a>
			<p class="date">{formatDate(post.date)}</p>
			<p class="description">{post.description}</p>
		</div>
		<hr />
	{/each}
	<!-- <div class="posts" />
	<hr />
	<div class="posts" />
	<hr />
	<div class="posts" />
	<hr />
	<div class="posts" />
	<hr />
	<div class="posts" />
	<hr />
	<div class="posts" />
	<hr />
	<div class="posts" /> -->
</div>

<style>
	.posts {
		width: 100%;
		height: 200px;
		background-color: #ffffff;
	}

	.post-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 800px;
		margin: auto;
	}

	hr {
		margin-top: 15px;
		margin-bottom: 15px;
		width: 100%;
		left: 10%;
		border-color: #000000;
	}

	.category {
		display: flex;
		width: 100%;
		margin-top: 50px;
	}

	.category p {
		margin-left: 30px;
		font-family: 'Pretendard';
		font-style: normal;
		font-size: 1.3em;
		color: #000000;
		text-decoration: underline;
	}
</style>
