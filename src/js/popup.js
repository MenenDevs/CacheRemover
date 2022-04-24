$(document).ready(function () {
  console.log("doc ready");

  $("p").bind("click", function () {
    console.log("clicked");
  });
});
