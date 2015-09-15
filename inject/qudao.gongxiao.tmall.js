// Analyze each distributor link, and silently crawl data
// from the distributor detail page.
//
// Automatically click next page, and exchange info with 
// background page (background.js)
//
// When the pages are exhausted, the background script will
// invoke a download request. To store invitation data.
//
// TODO:
// 1. auth code 
// 2. XHR fail to load with 200 stat
//

function DEBUG(msg) {
  console.log("[" + TimestampNoDate() + "] " + msg);
}

function ShouldStop() {
  //var pageNum = parseInt($(".page-cur").html(), 10);
  //return pageNum >= 2;
  return IsCurrentLastPage();
}

function GoPrevPage() {
  $(".page-prev")[0].click();
}

function GoNextPage() {
  $(".page-next")[0].click();
}

function GoPage(num) {
  if (! (num === parseInt(num, 10))) return;
  var js = 'gotoPages.call(this,'+ num +');return false;'
  $(".page-next").attr('onclick', js);
  $(".page-next")[0].click();
}


function IsCurrentLastPage() {
  // sample: 
  // in page: 465
  //<a class="page-next" href="#" onclick="gotoPages.call(this,466);return false;" data-spm-anchor-id="a1z0g.47.0.0"><span>下一页</span></a>
  //
  // in page: 466
  // <span class="page-end"><span>下一页</span></span>
  return $(".page-end").length != 0;
}

function IsInvitationPage(url) {
  var regex = /qudao.gongxiao.tmall.com/;
  return regex.test(url);
}

function IsDistributorDetailPage(url) {
  var regex = /distributor_detail.htm/;
  return regex.test(url);
}

function IsAuthPage(url) {
  // sample:
  // http://alisec.tmall.com/checkcodev3.php?v=4&ip=222.77.166.244&sign=b2a1c5babb9d1b849b1d5586696509f8&app=wagbridge&how=A1&http_referer=https://gongxiao.tmall.com//supplier/user/distributor_detail.htm?spm=a1z0g.47.1000518.76.SWpCIl&distributorId=10261192?
  // http://alisec.tmall.com/checkcodev3.php?v=4&ip=222.77.166.244&sign=b2a1c5babb9d1b849b1d5586696509f8&app=wagbridge&how=A1&http_referer=https://gongxiao.tmall.com//supplier/user/distributor_detail.htm?spm=a1z0g.47.1000518.61.SWpCIl&distributorId=10392544?
  var regex = /alisec.tmall.com/;
  return regex.test(url);
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

function ExtractInfoFromInviteList(dom) {
  var tds = $(dom).children();
  var username = $(tds[0]).children(':first').html();
  var detail_link = 'https:' + $(tds[0]).children(':first').attr('href');
  var tbicon = $(tds[0]).children(':first').next().html();
  var info = {
    username    : username,
    detail_link : detail_link,
    tbicon      : tbicon,
    level       : $(tds[1]).html(),
    rate        : $(tds[2]).html(),
    open_date   : $(tds[3]).html(),
    type        : $(tds[4]).html(),
    invite_date : $(tds[5]).html(),
    invite_mode : $(tds[6]).html(),
    invite_stat : $(tds[7]).children(':first').html()
  };
  return info;
}

function ExtractInfoFromDistributorPage(dom) {
  var div = $('.distributor-detail', dom).first();
  var dd = $('dt:contains("其他信息")', div).next();
  var ul = $(dd).children(':first');
  var text_wrap = function(elem) {
    if (elem != null && elem !== undefined) {
      return elem.nodeValue;
    } else {
      return '';
    }
  };
  var url_wrap = function(elem) {
    if (elem != null && elem !== undefined) {
      return 'https://' + elem.trim();
    } else {
      return '';
    }
  };
  var lis = $(ul).children();
  var info = {
    shop_link   : url_wrap($(lis[0]).children(':first').next().html()),
    contact     : text_wrap($(lis[1]).children()[0].nextSibling),
    phone_num_1 : text_wrap($(lis[2]).children()[0].nextSibling),
    phone_num_2 : text_wrap($(lis[3]).children()[0].nextSibling),
    email       : $(lis[4]).children(':first').next().html(),
    alipay      : text_wrap($(lis[5]).children()[0].nextSibling)
  };
  return info;
}

function SendInviteList(json) {
  var ack = ShouldStop() ? 'end' : 'ongoing';
  var pageNum = parseInt($(".page-cur").html(), 10);

  var message = {
    type : "info", 
    data : json,
    page : pageNum,
    ack  : ack
  };

  chrome.runtime.sendMessage(message, function(response) {
    if (response && response.ack) {
      if (response.ack == "got") {
        DEBUG("check next page");
        setTimeout(GoNextPage, 300 + Math.floor(Math.random() * 300));
      } else if (response.ack == 'done') {
        DEBUG("crawling done");
      }
    } else {
      DEBUG("info response missing");
    }
  });
}

function PageRequestChain(json, items, step) {
  DEBUG("chain on " + step);
  if (step == items.length) {
    DeepTrim(json);
    SendInviteList(json);
    return;
  }

  var info = ExtractInfoFromInviteList(items[step]);
  if (!IsDistributorDetailPage(info.detail_link)) {
    PageRequestChain(json, items, step + 1);
    return;
  }

  var url = info.detail_link;
  var xhr = CreateCORSRequest('GET', url);
  if (!xhr) {
    DEBUG('CORS not supported');
    return;
  }
  /*
  xhr.onreadystatechange = function() {
    var url = xhr.responseURL;
    DEBUG('url=' + url + ' stat=' + xhr.readyState + ' status=' + xhr.status);
  }
  */
  var delay = 200 + Math.floor(Math.random() * 200);

  xhr.onload = function() {
    var url = xhr.responseURL;
    var text = xhr.responseText;
    if (IsAuthPage(url)) {
      DEBUG("auth required, redirect to: " + url);
      document.location.href = url;
      return;
    }
    var dom = $.parseHTML(text);
    var additional_info = ExtractInfoFromDistributorPage(dom);
    DEBUG('Response from CORS request to ' + url + ': ' + additional_info.contact);
    for (var attr in additional_info) {
      info[attr] = additional_info[attr];
    }
    json.push(FormatJSON(info));
    setTimeout(function(){PageRequestChain(json, items, step + 1)}, delay);
  };

  xhr.onerror = function() {
    var url = xhr.responseURL;
    DEBUG('Woops, there was an error making the request: ' + url);
    setTimeout(function(){PageRequestChain(json, items, step + 1)}, delay);
  };

  xhr.send();
}

// Background remembers last page, so it is always safe to close 
// this content page
function DetermineStartPage() {
  var pageNum = parseInt($(".page-cur").html(), 10);

  var message = {
    type : "page", 
    page : pageNum
  };

  chrome.runtime.sendMessage(message, function(response) {
    if (response && response.page) {
      var lastMissingPage = response.page;
      DEBUG('on page=' + pageNum + ' lastMissing=' + lastMissingPage);

      if ( pageNum == lastMissingPage ||
          (pageNum < lastMissingPage && IsCurrentLastPage())) {  // the list might be truncated when crawling
        var items = $("#J_InviteList").find('tbody').find('.item');
        var json = [];
        PageRequestChain(json, items, 0);
      } else {
        GoPage(lastMissingPage);  // might go ahead, might go back
      }
    }
  });
}


function main() {
  if (!IsInvitationPage(document.location.href)) {
    DEBUG("will redirect soon...");
    return;
  }
  DEBUG("recording...");
  window.scrollTo(0,document.body.scrollHeight);  // to see pageNo.
  DetermineStartPage();
}


main();
