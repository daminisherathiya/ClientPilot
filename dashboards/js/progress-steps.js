$(document).ready(function () {
  $(".navigation .circle").each(function (index) {
    $(this).on("click", function () {
      var navigatioSteps = $(".navigation ul li div");

      navigatioSteps.removeClass("active prev");
      navigatioSteps.find("div span").removeClass("d-none");
      navigatioSteps.find("div img").addClass("d-none");

      navigatioSteps.slice(0, index).addClass("prev");
      navigatioSteps.slice(0, index).find("div span").addClass("d-none");
      navigatioSteps.slice(0, index).find("div img").removeClass("d-none");

      navigatioSteps.slice(0, index + 1).addClass("active");

      $(".progress div").css("width", (index / (navigatioSteps.length - 1)) * 100 + "%");

      $("#steps-content-container").children().addClass("d-none");
      $("#steps-content-container").children().eq(index).removeClass("d-none");
    });
  });
});
