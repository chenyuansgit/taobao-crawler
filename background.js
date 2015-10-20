// "Server scripts", every time user clicks the extension icon,
// it will spawn a crawler page (content page / gongxiao.qudao.js)
// to collect distributor information
//
// The collected data will be store to disk, with csv format.
//
// TODO:
// 1. if there's already a script crawling, don't start another one
//    / reload that script?
// 2. when last page is reached, and no file generated?

var USERNAME="<enter your default username here>"
var PASSWORD="<enter your password here, reversed order"

var inviteList = [];
var gotPages = {};
//var lastPage = 2;  // debug only
var lastPage = 0;

var historyLimit = 100;
var lastQueue = [];
var lastDict = {};
var curQueue = [];

function DEBUG(msg) {
  console.log("[" + TimestampNoDate() + "] " + msg);
}

function FormatJSON(data) {
  return {
      用户名   : data.username,
      信息链接 : data.detail_link,
      旺旺图标 : data.tbicon,
      信用等级 : data.level,
      好评率   : data.rate,
      开店时间 : data.open_date,
      主营类目 : data.type,
      邀请时间 : data.invite_date,
      邀请模式 : data.invite_mode,
      邀请状态 : data.invite_stat,
      分销商店铺 : data.shop_link,
      联系人     : data.contact,
      电话号码   : data.phone_num_1,
      手机号码   : data.phone_num_2,
      电子邮件   : data.email,
      支付宝帐号 : data.alipay
  };
}

function CompressList(contentArray) {
  return [JSONC.compress({a:contentArray.join('\n')})];
}

function DecompressList(contentArray) {
  if (contentArray.length == 0) return [];
  return JSONC.decompress(contentArray[0]).a.split('\n');
}

function SaveAs(text, filename) {
  var BOM = "\uFEFF";
  var blob = new Blob([BOM + text], { type: "text/csv;charset=utf-8" });
  var href = window.URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url      : href,
    filename : filename,
    saveAs   : true
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  var chromeRegex = /^chrome:\/\/:?/;
  var loginRegex = /login.taobao.com/;
  var targetURL = "http://qudao.gongxiao.tmall.com/supplier/user/invitation_list.htm?spm=a1z0g.27.1000495.4.mmNUmY";
  if (loginRegex.test(tab.url)) {
    alert("请先登录");
  } else if (chromeRegex.test(tab.url)) {
    chrome.tabs.create({ url: targetURL });
  } else {
    chrome.tabs.getSelected(null, function(selected){
      chrome.tabs.update(selected.id, { url: targetURL });
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // The request page will always ask for page first, then send info
  if (request.type == "page") {
    var page = request.page;
    //DEBUG("check page: " + page);
    if ((! (page in gotPages)) && page < lastPage) {
      lastPage = page - 1;
    }
    //DEBUG("last missing page: " + (lastPage + 1));
    sendResponse({page : lastPage + 1}); 
  } else if (request.type == 'info') {
    // will never get dup page, unless:
    // 1. the sender has to stop crawling,
    //    e.g. the last page is already met
    // (add to this list for new conditions)

    // determine whether to crawl current page
    var page = request.page;
    var data = request.data;
    var dup = false;
    if (page in gotPages) {
      dup = true;
      DEBUG("dup: " + page);
    }
    gotPages[page] = data.length;
    lastPage = Math.max(lastPage, page);

    DEBUG("fetch page: " + page);
    DEBUG("num fetched:" + data.length);

    // determine whether data is already dup with queue
    var all_fetched = true;
    for (var i = 0, max = data.length; i < max; i++) {
      var key = data[i].username;
      if (!(key in lastDict)) {
        all_fetched = false;
        break;
      }
    }
    all_fetched = all_fetched && (data.length > 0);

    if (all_fetched) {
      DEBUG("all data is already fetched last time... should stop");
      gotPages[page + 1] = -1;  // bogus number, this prevents next crawling
      lastPage += 10000;        // set as a big number
    } else {
      inviteList = inviteList.concat(data);
      for (var i = 0, max = data.length; i < max; i++) {
        var key = data[i].username;
        curQueue.push(key);
      }
    }
    DEBUG("total fetched:" + inviteList.length);  // nocommit

    if (request.ack == "end") {
      sendResponse({ack: "done"});
      if (inviteList.length > 0) {
        var formatted = inviteList.map(function(e){return FormatJSON(e)});
        var inviteData = JSON2CSV(formatted);
        var logData = Object2ListText(gotPages);
        var suffix = TimestampFilename();

        SaveAs(inviteData, 'invite.' + suffix  + '.csv');
      //SaveAs(logData, 'log.' + suffix + '.txt');
      }
      curQueue.splice(historyLimit, curQueue.length);
      chrome.storage.sync.set({
        datacache: CompressList(curQueue)
      }, function() {});
    } else {
      sendResponse({ack: "got"});
    }
  }
});

// initialize options data

chrome.storage.sync.get({
  username: USERNAME,
  password: NaiveReverse(PASSWORD),
  showpass: false,
  datacache: []  // used to store last seen userids, and avoid dup crawling
}, function(items) {
  lastQueue = DecompressList(items.datacache); 
  for (var i = 0, max = lastQueue.length; i < max; i++) {
    lastDict[lastQueue[i]] = true;
  }
  DEBUG('username=' + items.username);
  DEBUG('datacache=' + lastQueue);
  DEBUG('compress size: ' + StringBytes(''+items.datacache));
  DEBUG('decompress size: ' + StringBytes(''+lastQueue));
  chrome.storage.sync.set({
    username: items.username,
    password: items.password,
    showpass: items.showpass,
    datacache: items.datacache
  }, function() {
  });
});
