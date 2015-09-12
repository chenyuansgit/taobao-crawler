function DeepTrim(obj) {
  for (var prop in obj) {
    var value = obj[prop], type = typeof value;
    if (value != null && (type == "string" || type == "object") && obj.hasOwnProperty(prop)) {
      if (type == "object") {
        DeepTrim(obj[prop]);
      } else {
        obj[prop] = obj[prop].trim();
      }
    }
  }
}

function GoNextPage() {
  $(".page-next")[0].click();
}


function main() {

  var targetRegex = /qudao.gongxiao.tmall.com/;
  if (!targetRegex.test(document.location.href)) {
    console.log("redirecting...");
    return;
  }
  
  console.log("recording...");

  var items = $("#J_InviteList").find('tbody').find('.item');
  var data = [];
  for (var i = 0, max = items.length; i < max; i++) {
    var tds = $(items[i]).children();
    data.push({
      user_id     : $(tds[0]).children(':first').html(),
      user_link   : $(tds[0]).children(':first').attr('href'),
      user_icon   : $(tds[0]).children(':first').next().html(),
      level       : $(tds[1]).html(),
      rate        : $(tds[2]).html(),
      open_date   : $(tds[3]).html(),
      type        : $(tds[4]).html(),
      invite_date : $(tds[5]).html(),
      invite_mode : $(tds[6]).html(),
      invite_stat : $(tds[7]).children(':first').html()
    });
  }
  DeepTrim(data);
  alert(JSON.stringify(data));

  // gen message
  var pageNum = $(".page-cur").html();
  var ack = pageNum >= '2' ? 'end' : 'ongoing';  // nocommit
  var message = {type : "info", page : pageNum, ack : ack};

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
