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
      user_id     : $(tds[0]).children(':first').html(),
//      user_link   : 'http:' + $(tds[0]).children(':first').attr('href'),
//      user_icon   : $(tds[0]).children(':first').next().html(),
//      level       : $(tds[1]).html(),
      rate        : $(tds[2]).html(),
      open_date   : $(tds[3]).html(),
      type        : $(tds[4]).html(),
      invite_date : $(tds[5]).html(),
      invite_mode : $(tds[6]).html(),
      invite_stat : $(tds[7]).children(':first').html()
    });
  }
  DeepTrim(json);

  //var csv = JSON2CSV(json);
  //alert(csv);
  //console.log(csv);
  //window.open( "data:application/csv;charset=ansi," + encodeURI(csv));
  
  //var csv = JSON2CSV(json);
  //var blob = new Blob([csv]);
  // location.href = window.URL.createObjectURL(blob);

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
