<nav>
	<div class="navbar-top">
		<span class="navbar-title text">ChanHyuk's Log</span>
		<div class="navbar-btn">
			<a href="/" class="navbar-btn-text text">Home</a>
			<a href="/blog" class="navbar-btn-text text">Blog</a>
		</div>
	</div>
</nav>
<slot />
<footer>
	<div class="footer-body">
		<div class="footer-names">
			<p class="text kr-name">박찬혁</p>
			<p class="text">ChanHyuk Park</p>
		</div>

		<div class="footer-links">
			<p class="text">박찬혁</p>
		</div>
	</div>
</footer>

<style>
	:global(body) {
		margin: 0;
		background-color: #979797;
	}

	:global(.test-box) {
		border: 2px solid black;
	}

	:global(.text) {
		font-family: 'Pretendard';
		font-style: normal;
		color: #ffffff;
	}
	.navbar-top {
		background-color: #212121;
		height: 80px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.navbar-title {
		font-weight: 700;
		font-size: 40px;
		margin-left: 30px;
	}

	.navbar-btn-text {
		font-weight: 500;
		font-size: 25px;
		margin-left: 30px;
	}

	.navbar-btn {
		margin-right: 100px;
		display: flex;
		width: 300px;
		justify-content: space-between;
	}

	footer {
		height: 210px;
		width: 100%;
		background-color: #212121;
	}

	.footer-body {
		display: flex;
	}

	.footer-names {
		flex: 2;
	}

	.footer-links {
		flex: 1;
	}

	.kr-name {
		font-size: 3em;
		font-weight: bold;
	}

	p {
		margin: 0;
	}
</style>
