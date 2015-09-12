var byClass;
byClass = document.getElementsByClassName("page-cur");
console.assert(byClass.length == 1, "page no. missing?");
var pageNum = byClass[0].innerHTML;
alert(pageNum);
var ack = pageNum == '2' ? 'end' : 'ongoing';

// gen message
var message = {type : "info", page : pageNum, ack : ack};

chrome.runtime.sendMessage(message, function(response) {
  if (response && response.ack) {
    if (response.ack == "got") {
      var byClass = document.getElementsByClassName("page-next");
      console.assert(byClass.length == 1, "button missing?");
      var nextPage = byClass[0];
      nextPage.click()
      console.log("go next page");
    } else if (response.ack == 'done') {
      console.log("crawling done");
    }
  } else {
    console.log("info response missing");
  }
});
