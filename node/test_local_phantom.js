//直接使用phantom进行测试

var page = require('webpage').create();

//var url = 'https://www.baidu.com/';
var urls = ['http://ac.qq.com/ComicView/index/id/505430/cid/868', 'http://ac.qq.com/ComicView/index/id/505430/cid/867'];
var count = 0;
var current = 0;

page.viewportSize = {width: 725, height: 1000};
page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.109 Safari/537.36";

page.onLoadStarted = function() {
  //console.log('Now loading a new page...');
};

page.onLoadFinished = function(status) {
  //console.log('Status: ' + status);
};

page.onConsoleMessage = function (msg) {
	console.log(msg);
	if (msg.indexOf('DONE') != -1) {
		run();
	}
}

function render() {
	page.render('test.png');
	phantom.exit();
}

function getPage (url) {
	page.open(url, function () {
		page.evaluate(function () {
			var img_count = Number(document.querySelector('.comic-ft').innerHTML.split('/')[1]);
			var scroll_ele = document.querySelector('#mainView');
			var scroll_height = Number(scroll_ele.scrollHeight);
			var interval_id = '';
			var scrolled = 0;
			var img_arr = [];

			function finished () {
				var imgs = document.querySelectorAll('img');
				var count = 0;
				for (var i in imgs) {
					if (imgs[i] && imgs[i].getAttribute) {
						var img_src = imgs[i].getAttribute('src');
						if (img_src.indexOf('buid=15017') != -1) {
							img_arr.push(img_src);
							count++;
						}
					}
				}
				//console.log(count+'/'+img_count);
				return count == img_count;
			}

			function autoScroll () {
				scrolled += 100;
				scroll_ele.scrollTop = scrolled;
				//console.log('scrollTop: '+scrolled+' scroll_height: '+scroll_height);
				if (Number(scrolled) >= scroll_height) {
					clearInterval(interval_id);
					if (finished()) {
						console.log(img_arr);
						console.log('DONE');
					} else {
						setTimeout(check, 0);
					}
				}
			}

			function check () {
				//console.log('start checking:');
				scrolled = 0;
				img_arr = [];
				interval_id = setInterval(autoScroll, 40);
			}

			setTimeout(check, 0);
		});
	});
}

function run () {
	if (urls.length) {
		var url = urls.shift();
		getPage(url);
	} else {
		phantom.exit();
	}
}

run();