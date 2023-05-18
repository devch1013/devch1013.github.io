<footer>
	<div class="footer-body">
		<div class="footer-names">
			<p class="text kr-name">박찬혁</p>
			<p class="text en-name">ChanHyuk Park</p>
		</div>

		<div class="footer-links">
			<div class="link-box">
				<img src="/icons/email.png" alt="" />
				<span class="text link">devch1013@gmail.com</span>
			</div>
			<div class="space-box" />
			<div onclick="location.href='https://github.com/devch1013'" class="link-box">
				<img src="/icons/github.png" alt="" />
				<span class="text link">github.com/devch1013</span>
			</div>
		</div>
	</div>
</footer>

<style>
	footer {
		height: 210px;
		width: 100%;
		background-color: #212121;
	}

	.footer-body {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.footer-names {
		flex: 1.5;
		padding-left: 8vw;
	}

	.footer-links {
		flex: 1;
		padding-right: 8vw;
	}

	.kr-name {
		font-size: 3.8em;
		font-weight: bold;
	}

	.en-name {
		font-size: 2em;
		font-weight: bold;
		padding-left: 30px;
		padding-top: 5px;
	}

	p {
		margin: 0;
	}

	img {
		width: 50px;
		margin-right: 20px;
	}

	.link-box {
		display: flex;
		align-items: center;
	}

	.space-box {
		height: 30px;
	}

	.link-box:last-child {
		cursor: pointer;
	}

	.link {
		font-weight: 600;
		font-size: 2em;
	}
</style>
