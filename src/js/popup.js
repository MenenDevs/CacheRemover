$(document).ready(function () {
  var url;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    url = new URL(tabs[0].url);
    var domain = url.hostname;
    console.log("domain: " + domain);

    $("#domain").html(domain);

    chrome.cookies.getAll({ domain: domain }, function (cookies) {
      cookies.sort((a, b) => a.name.localeCompare(b.name));
      console.log(cookies);
      let cookiesDiv = $(".cookies");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        let tr = $("<tr/>", { name: cookie.name });
        $("<td/>", { class: "name", html: cookie.name }).appendTo(tr);
        let td2 = $("<td/>");
        let buttonDelete = $("<input/>", { type: "image", src: "../images/delete.svg" });
        buttonDelete.appendTo(td2);
        td2.appendTo(tr);
        tr.appendTo(cookiesDiv);

        buttonDelete.bind("click", function (event) {
          let target = $(event.target);
          let tr = target.parent().parent();
          let name = tr.attr("name");
          chrome.cookies.remove({ url: url + "/" /*.path*/, name: name });
          tr.remove();
        });
      }
    });
  });

  $("#deleteAll").bind("click", function (event) {
    let inputs = $("tr > td > input");
    for (let i = 0; i < inputs.length; i++) {
      let input = $(inputs[i]);
      let tr = input.parent().parent();
      let name = tr.attr("name");
      chrome.cookies.remove({ url: url + "/" /*.path*/, name: name });
      tr.remove();
    }
  });
});
