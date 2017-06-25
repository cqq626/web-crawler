//动态页面抓取：从腾讯漫画上抓取海贼王

var phantom = require('phantom');
var request = require('request');
var fs = require('fs');
var async = require('async');
var ph, ph_page;
var base_url = 'http://ac.qq.com/ComicView/index/id/505430/cid';  //海贼王地址
var user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.109 Safari/537.36';
var img_arr = []; //每一话的图片地址
var limit = 5;  //并行下载的图片数
var gap = 200;  //每次访问网页的延时，控制访问频率
var start_path = './start.js'; 
var start = Number(fs.readFileSync(start_path, 'utf-8'));  //记录当前访问到多少话
var end = 600;  //记录当前访问到多少话结束
var title;   //记录当前页面对应多少话 (经实验发现有的链接为失效链接，也就是说具体是xx话与链接数字不是完全对等，如.../cid/400可能对应397话之类的)

// 初始化phantom
function initPhantom () {
  return new Promise((resolve, reject) => {
    phantom.create().then((ph_local) => {
      ph = ph_local;
      return ph.createPage();
    }).then((page) => {
        ph_page = page;
        ph_page.property('viewportSize', {width: 725, height: 1000}).then(() => { //设置浏览器大小
          ph_page.setting('userAgent', user_agent).then(() => { //设置userAgent，不同userAgent(如：手机和PC等)返回页面不一样
            ph_page.on('onConsoleMessage', function (msg) { //phantom与nodejs通信
              if (msg.indexOf('INVALID') != -1) { //当前网页非法
                start++;
                setTimeout(run, gap);
                return;
              }
              if (msg.indexOf('TITLE') != -1) { //获取当前是多少话
                title = msg.split(':')[1];
              }
              if (msg.indexOf('INFO') != -1) {  //调试输出
                console.log(msg);
              }
              if (msg.indexOf('SRC') != -1) {   //获取图片对应的地址
                var datas = msg.slice(4).split(',');
                img_arr[Number(datas[0])] = datas[1];
              }
              if (msg.indexOf('DONE') != -1) {  //页面解析完毕，开始获取图片
                getPic();
              }
            })
            resolve();
          });
        });
    }).catch((e) => {
      console.log(e);
      reject();
    });
  });
}

// 解析页面
function getPage (url) {
  console.log(`request ${url}...`);
  ph_page.open(url).then(function (status) {
    img_arr = [];
    console.log(`request status: ${status}`);
    ph_page.evaluate(function () {
      var dom = document.querySelector('.comic-ft');  //表示当前页为x话所在容器
      if (!dom) {
        console.log('INVALID');
        return;
      }

      var img_count = Number(dom.innerHTML.split('/')[1]);  //获取当前话有多少页
      var scroll_ele = document.querySelector('#mainView'); //获取漫画图片所在的容器
      var scroll_height = Number(scroll_ele.scrollHeight);  //获取容器长度
      var interval_id = '';
      var scrolled = 0;

      // 检查当前话所有页是否已全部加载
      function finished () {  
        var imgs = document.querySelectorAll('img');
        var count = 0;
        for (var i in imgs) {
          if (imgs[i] && imgs[i].getAttribute) {
            var img_src = imgs[i].getAttribute('src');
            if (img_src.indexOf('buid=15017') != -1) {  //检查是否为有效页
              var index = Number(imgs[i].parentElement.querySelector('.comic-ft').innerHTML.split('/')[0]);
              console.log('SRC:'+index+','+img_src);
              count++;
            }
          }
        }
        console.log('[INFO] '+count+'/'+img_count);
        return count == img_count;
      }

      // 自动往下滚动，触发脚本加载图片
      function autoScroll () {
        scrolled += 100;
        scroll_ele.scrollTop = scrolled;
        //console.log('[INFO] '+'scrollTop: '+scrolled+' scroll_height: '+scroll_height);
        if (Number(scrolled) >= scroll_height) {
          clearInterval(interval_id);
          if (finished()) {
            console.log('[INFO] DONE');
          } else {
            setTimeout(check, 0);
          }
        }
      }

      // 开始解析
      function check () {
        console.log('[INFO] start checking:');
        scrolled = 0;
        interval_id = setInterval(autoScroll, 40);
      }

      //获取当前是第几话
      var name = document.querySelector('.title-comicHeading').innerHTML.split(' ')[0];
      var reg = /([\d]+)/;
      var title = reg.exec(name)[1];
      console.log('TITLE:' + title);

      setTimeout(check, 0);
    });
  }, function (err) {
    console.log(`getPage err: ${err}`);
  });
}

// 获取漫画图片
function getPic () {
  var img_failed = [];
  console.log(`getPic: ${img_arr.length}`)
  async.eachOfLimit(img_arr, limit, function (img_url, index, callback) {
    if (!img_url) {
      callback();
      return;
    }
    request({
      url: img_url,
      encoding: null
    }, (err, res, body) => {
      if (err) {
        console.log(`${index}: ${img_url} error! ${JSON.stringify(err)}`);
        img_failed[index] = img_url;
        callback();
        return;
      }
      console.log(`${index}: ${img_url} saved!`);
      fs.writeFileSync(`pics/${title}/${index}.jpg`, body);
      callback();
    });
  }, function () {
    if (img_failed.length) {  //获取失败的图片重新请求
      img_arr = img_failed;
      setTimeout(getPic, 0);
    } else {
      start++;
      setTimeout(run, gap);
    }
  });
}

// 启动
function run () {
  if (start <= end) {
    var dir_path = `pics/${start}`;
    try {
      fs.accessSync(dir_path, fs.R_OK | fs.W_OK);
    } catch (e) {
      fs.mkdirSync(dir_path)
    }
    fs.writeFileSync(start_path, start);
    console.log(`Page: ${start}`);
    getPage(`${base_url}/${start}`);
  } else {
    ph.exit();
  }
}

function init () {
  initPhantom().then(() => {
    console.log('init ok');
    setTimeout(run, 0);
  });
}

init();