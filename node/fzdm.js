//静态页面抓取：从风之动漫上抓取火星异种

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var base_url = 'http://www.fzdm.com/manhua/47/';
var start_path = './start.js';
var page = Number(fs.readFileSync(start_path, 'utf-8'));
console.log(`Page: ${page}`);
var end = 175;
//var end = 53;
var num = 0;
var gap = 300;

function getPage (url) {
	return new Promise((resolve, reject) => {
		var opts = {
			url: url,
			timeout: 1000,
			headers: {
				'Accept': '*/*',
				'Accept-Encoding': 'gzip, deflate, sdch',
				'Accept-Language': 'en,zh-CN',
			},
			gzip: true,
		};

		request(opts, (err, response, body) => {
			if (err || response.statusCode == 404) {
				console.log(`page: ${opts.url} failed body:${body}`);
				reject();
				return;
			}
			try {
				var $ = cheerio.load(body);
				var img_src = $('#mhpic').attr().src;
				if (img_src.indexOf('http') == -1) {
					img_src = 'http:' + img_src;
				}
				getPic(img_src).then(() => {
					resolve();
				}, () => {
					setTimeout(run, gap);
				});
			} catch (e) {
				console.log(e);
				resolve();
			}
		});
	});
}

function getPic (url) {
	return new Promise((resolve, reject) => {
		var opts = {
			url: url,
			encoding: null,
			timeout: 1000,
			headers: {
				'Accept': '*/*',
				'Accept-Encoding': 'gzip, deflate, sdch',
				'Accept-Language': 'en,zh-CN',
			}
		};

		request(opts, (err, response, body) => {
			if (response && response.statusCode == 404) {
				console.log(`pic: ${opts.url} failed body:${body}`);
				resolve();
				return;
			}
			if (err || !response || response.headers['content-type'].indexOf('image') == -1) {
				console.log(`pic: ${opts.url} failed body:${body}`);
				reject();
				return;
			}
			var dir_path = `pics/${page}`;
			try {
				fs.accessSync(dir_path, fs.R_OK | fs.W_OK);
			} catch (e) {
				fs.mkdirSync(dir_path)
			}

			var pic_path = `${dir_path}/${num}.jpg`;
			fs.writeFileSync(pic_path, body);
			console.log(`pic: ${opts.url} saved!`);
			resolve();
		});
	});
}

function run () {
	if (page <= end) {
		getPage(`${base_url}${page}/index_${num}.html`).then(() => {
			num++;
			setTimeout(run, gap);
		}, () => {
			num = 0;
			page++;
			console.log(`Page: ${page}`);
			fs.writeFileSync(start_path, page);
			setTimeout(run, gap);
		});
	}
}

run();