$(document).ready(function () {
  $(".expand-collapse").on("click", function () {
    $(this).toggleClass("active");
    $(this).closest("tr").toggleClass("active");
    $(this).closest("tr").next().toggleClass("d-none");
  });
});
