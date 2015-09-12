function GoNextPage() {
  $(".page-next")[0].click();
}

function IsCurrentLastPage() {
  // in page: 465
  //<a class="page-next" href="#" onclick="gotoPages.call(this,466);return false;" data-spm-anchor-id="a1z0g.47.0.0"><span>下一页</span></a>
  //
  // in page: 466
  // <span class="page-end"><span>下一页</span></span>
  // do sth to see whether we're at last page
  return $(".page-end").length != 0;
}

function IsDistributorDetailPage(url) {
  var regex = /distributor_detail.htm/;
  return regex.test(url);
}

// Helper method to parse the title tag from the response.
function getTitle(text) {
  return text.match('<title>(.*)?</title>')[1];
}

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

function FormatJSON(data) {
  return {
      用户名   : data.username,
      淘宝链接 : data.tblink,
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
  var tblink = 'https:' + $(tds[0]).children(':first').attr('href');
  var tbicon = $(tds[0]).children(':first').next().html();
  var info = {
    username    : username,
    tblink      : tblink,
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

function ExtractInfoFromUserPage(dom) {
  var div = $('.distributor-detail', dom).first();
  var dd = $('dt:contains("其他信息")', div).next();
  var ul = $(dd).children(':first');
  var wrap = function(elem) {
    if (elem != null && elem !== undefined) {
      return elem.nodeValue;
    } else {
      return '';
    }
  }
  var lis = $(ul).children();
  var info = {
    shop_link   : 'https:' + $(lis[0]).children(':first').next().attr('href'),
    contact     : wrap($(lis[1]).children()[0].nextSibling),
    phone_num_1 : wrap($(lis[2]).children()[0].nextSibling),
    phone_num_2 : wrap($(lis[3]).children()[0].nextSibling),
    email       : wrap($(lis[4]).children(':first').next().html()),
    alipay      : wrap($(lis[5]).children()[0].nextSibling)
  };
  return info;
}

function SendInviteList(json) {
  // gen message
  var pageNum = parseInt($(".page-cur").html(), 10);
  // var ack = pageNum >= 50 ? 'end' : 'ongoing';  // nocommit
  var ack = IsCurrentLastPage() ? 'end' : 'ongoing';

  var message = {
    type : "info", 
    data : json,
    ack  : ack
  };

  chrome.runtime.sendMessage(message, function(response) {
    if (response && response.ack) {
      if (response.ack == "got") {
        console.log("check next page");
        setTimeout(GoNextPage(), 3000);
      } else if (response.ack == 'done') {
        console.log("crawling done");
      }
    } else {
      console.log("info response missing");
    }
  });
}


function PageRequestChain(json, items, step) {
  console.log("chain on " + step);
  if (step == items.length) {
    DeepTrim(json);
    SendInviteList(json);
    return;
  }

  var info = ExtractInfoFromInviteList(items[step]);
  if (!IsDistributorDetailPage(info.tblink)) {
    PageRequestChain(json, items, step + 1);
    return;
  }

  var url = info.tblink;
  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }
  xhr.onload = function() {
    var text = xhr.responseText;
    var title = getTitle(text);
    console.log('Response from CORS request to ' + url + ': ' + title);
    if (title != "供销平台") {
      console.log('ERROR: Page redirect to shop url, useless');
      return;
    }
    var dom = $.parseHTML(text);
    var additional_info = ExtractInfoFromUserPage(dom);
    for (var attr in additional_info) {
      info[attr] = additional_info[attr]
    }
    json.push(FormatJSON(info));
    PageRequestChain(json, items, step + 1);
  };

  xhr.onerror = function() {
    console.log('Woops, there was an error making the request.');
    PageRequestChain(json, items, step + 1);
  };

  xhr.send();
}


function main() {

  var targetRegex = /qudao.gongxiao.tmall.com/;
  if (!targetRegex.test(document.location.href)) {
    console.log("will redirect soon...");
    return;
  }
  
  console.log("recording...");

  var items = $("#J_InviteList").find('tbody').find('.item');
  var json = [];

  PageRequestChain(json, items, 0);
}

main();
