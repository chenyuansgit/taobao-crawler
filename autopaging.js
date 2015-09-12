function GoNextPage() {
  $(".page-next")[0].click();
}

function IsLastPage() {
  // do sth to see whether we're at last page
}


function main() {

  var targetRegex = /qudao.gongxiao.tmall.com/;
  if (!targetRegex.test(document.location.href)) {
    console.log("redirecting...");
    return;
  }
  
  console.log("recording...");

  var items = $("#J_InviteList").find('tbody').find('.item');
  var json = [];
  for (var i = 0, max = items.length; i < max; i++) {
    var tds = $(items[i]).children();
    json.push({
      用户名     : $(tds[0]).children(':first').html(),
//      淘宝链接   : 'http:' + $(tds[0]).children(':first').attr('href'),
//      旺旺图标   : $(tds[0]).children(':first').next().html(),
//      信用等级   : $(tds[1]).html(),
      好评率      : $(tds[2]).html(),
      开店时间    : $(tds[3]).html(),
      主营类目    : $(tds[4]).html(),
      邀请时间    : $(tds[5]).html(),
      邀请模式    : $(tds[6]).html(),
      邀请状态    : $(tds[7]).children(':first').html()
    });
  }
  DeepTrim(json);

  // gen message
  var pageNum = $(".page-cur").html();
  var ack = pageNum >= '1' ? 'end' : 'ongoing';  // nocommit
  var message = {
    type : "info", 
    data : json,
    page : pageNum,
    ack  : ack};

  chrome.runtime.sendMessage(message, function(response) {
    if (response && response.ack) {
      if (response.ack == "got") {
        GoNextPage();
        console.log("go next page");
      } else if (response.ack == 'done') {
        console.log("crawling done");
      }
    } else {
      console.log("info response missing");
    }
  });
}

main();
