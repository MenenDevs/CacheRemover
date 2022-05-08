var url;

function removeRowAll(trNode) {
  let trNext = trNode.next();
  while (trNext.length > 0) {
    if (trNext.attr("type") != "domain") {
      removeOneCookie(trNext);
    }

    trNext.remove();
    trNext = trNode.next();
  }

  trNode.remove();
}

function removeRowDomain(trNode) {
  let trPrev = trNode.prev();
  let trNext = trNode.next();
  while (trNext.length > 0 && trNext.attr("type") != "domain") {
    removeOneCookie(trNext);
    trNext.remove();
    trNext = trNode.next();
  }

  trNode.remove();
  if (trNext.length == 0) {
    // no more cookies underneath
    if (trPrev.attr("type") == "all") {
      // if no more cookies at all
      trPrev.remove(); // remove "All cookies" row
    }
  }
}

function removeRowCookie(trNode) {
  removeOneCookie(trNode);

  let trPrev = trNode.prev();
  let trNext = trNode.next();
  trNode.remove();
  haveNextDomain = trNext.length != 0 && trNext.attr("type") == "domain";
  if (trPrev.length > 0 && trPrev.attr("type") == "domain" && (trNext.length == 0 || haveNextDomain)) {
    let trPrevPrev = trPrev.prev();
    trPrev.remove(); // remove domain row
    if (trPrevPrev.length > 0 && trPrevPrev.attr("type") == "all" && !haveNextDomain) {
      trPrevPrev.remove(); // remove "All cookies" row
    }
  }
}

function removeOneCookie(trNode) {
  let domain = trNode.attr("domain");
  let path = trNode.attr("path");
  let name = trNode.attr("name");
  chrome.cookies.remove({ url: url.protocol + "//" + domain + path, name: name });
  console.log("removing " + domain + path + name);
}

function collapseClicked(event) {
  let target = $(event.target);
  let tr = target.parent().parent();
  let collapse = target.hasClass("open");

  if (tr.attr("type") == "domain") {
    collapseDomain(tr, collapse);
  } else {
    collapseAll(tr, collapse);
  }
  collapseButton(target, collapse);
}

function collapseAll(trNode, collapse) {
  console.log(collapse ? "collapse" : "open");
  let trNext = trNode.next();
  while (trNext.length > 0) {
    if (trNext.attr("type") == "domain") {
      collapseDomain(trNext, collapse);
      collapseButton(trNext.find(".collapsable"), collapse);
      if (collapse) {
        trNext.addClass("hidden");
      } else {
        trNext.removeClass("hidden");
      }
    }
    trNext = trNext.next();
  }
}

function collapseDomain(trNode, collapse) {
  console.log(collapse ? "collapse" : "open");
  let trNext = trNode.next();
  while (trNext.length > 0 && trNext.attr("type") != "domain") {
    if (collapse) {
      trNext.addClass("hidden");
    } else {
      trNext.removeClass("hidden");
    }
    trNext = trNext.next();
  }
}

function collapseButton(button, collapse) {
  if (collapse) {
    button.removeClass("open");
  } else {
    button.addClass("open");
  }
}

$(document).ready(function () {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    url = new URL(tabs[0].url);
    let domain = url.hostname;
    domain = domain.replace("www", "");
    console.log("domain: " + domain);

    // get all cookies and build table
    chrome.cookies.getAll({ domain: domain }, function (cookies) {
      if (cookies.length > 0) {
        //sort by name
        cookies.sort((a, b) => a.name.localeCompare(b.name));
        console.log(cookies);

        // group by domain
        let cookiesByDomain = {};
        for (const index in cookies) {
          const cookie = cookies[index];
          if (cookiesByDomain[cookie.domain]) {
            cookiesByDomain[cookie.domain].push(cookie);
          } else {
            cookiesByDomain[cookie.domain] = [cookie];
          }
        }
        console.log(cookiesByDomain);

        let cookiesDiv = $(".cookies");

        // create row for "All cookies"
        let tr = $("<tr/>", { class: "all", type: "all" });
        let td0 = $("<td/>");
        let buttonCollapse = $("<button/>", { class: "collapsable open" });
        buttonCollapse.appendTo(td0);
        td0.appendTo(tr);
        $("<td/>", { html: "All cookies", colspan: 2 }).appendTo(tr);
        let td2 = $("<td/>");
        let buttonDelete = $("<input/>", { type: "image", src: "../images/delete.svg" });
        buttonDelete.appendTo(td2);
        td2.appendTo(tr);
        tr.appendTo(cookiesDiv);

        buttonCollapse.bind("click", collapseClicked);

        buttonDelete.bind("click", function (event) {
          let target = $(event.target);
          let trAll = target.parent().parent();
          removeRowAll(trAll);
        });

        for (const index in cookiesByDomain) {
          const cookiesVec = cookiesByDomain[index];

          // create row for this domain
          let tr = $("<tr/>", { class: "domain", type: "domain", name: index });
          $("<td/>").appendTo(tr);
          let td0 = $("<td/>");
          let buttonCollapse = $("<button/>", { class: "collapsable" });
          buttonCollapse.appendTo(td0);
          td0.appendTo(tr);
          $("<td/>", { class: "domainName", html: index }).appendTo(tr);
          let td2 = $("<td/>");
          let buttonDelete = $("<input/>", { type: "image", src: "../images/delete.svg" });
          buttonDelete.appendTo(td2);
          td2.appendTo(tr);
          tr.appendTo(cookiesDiv);

          buttonCollapse.bind("click", collapseClicked);

          buttonDelete.bind("click", function (event) {
            let target = $(event.target);
            let trDomain = target.parent().parent();
            removeRowDomain(trDomain);
          });

          // create row for each cookie from this domain
          for (let i = 0; i < cookiesVec.length; i++) {
            const cookie = cookiesVec[i];
            let tr = $("<tr/>", { class: "cookie hidden", type: "cookie", domain: cookie.domain, path: cookie.path, name: cookie.name });
            $("<td/>").appendTo(tr); //first column is for button on "All cookies" row
            $("<td/>").appendTo(tr); //second column is for button on domain rows
            $("<td/>", { class: "name", html: cookie.name }).appendTo(tr);
            let td2 = $("<td/>");
            let buttonDelete = $("<input/>", { type: "image", src: "../images/delete.svg" });
            buttonDelete.appendTo(td2);
            td2.appendTo(tr);
            tr.appendTo(cookiesDiv);

            buttonDelete.bind("click", function (event) {
              let target = $(event.target);
              let trCookie = target.parent().parent();
              removeRowCookie(trCookie);
            });
          }
        }
      }
    });
  });
});
