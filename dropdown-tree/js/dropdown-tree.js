(function ($) {
  'use strict';

  const setDropdownTreeBreadcrumb = ($item) => {
    const breadcrumbItems = [];
    const $dropdownTree = $item.closest('.dropdown-tree.select-menu');

    while (1) {
      breadcrumbItems.push($item.find('div span:first').text());

      const $options = $item.closest('.options');
      if ($options.length) {
        $item = $options.prev();
      }

      if ($item.hasClass('root-select-btn')) {
        break;
      }
    }
    breadcrumbItems.push('Category');

    const $breadcrumb = $dropdownTree.find('.service-breadcrumb');
    $breadcrumb.empty();
    breadcrumbItems.reverse().forEach(breadcrumbItem => {
      let $li = $('<li>').addClass('breadcrumb-item ps-2').text(breadcrumbItem);
      $breadcrumb.append($li);
    });
  };

  $(document).ready(function () {
    // Toggle the dropdown list upon clicking on the dropdown
    $('.dropdown-tree.select-menu, .dropdown-tree .select-menu').each(function () {
      const $menu = $(this);
      $menu.find('.select-btn:first').click(function () {
        $menu.toggleClass('active');
        $menu.find('.options:first').toggleClass('d-none');
        $menu.find('.arrow-down:first').toggleClass('rotated-180deg');
      });
    });

    // In the item list dropdowns, allow keeping only one chain of dropdowns open at a time and set item breadcrumb
    $('.dropdown-tree.select-menu .items-list .select-btn').each(function () {
      const $btn1 = $(this);

      $btn1.click(function () {
        $btn1.closest('.dropdown-tree.select-menu').find('.items-list .select-btn').each(function () {
          const $btn2 = $(this);

          if ($btn1.is($btn2)) {
            return;
          }

          const $optionsDiv = $btn2.next();
          if ($optionsDiv.hasClass('options') && $optionsDiv.has($btn1).length) {
            return;
          }

          const $menu = $btn2.closest('.select-menu');
          $menu.removeClass('active');
          $menu.find('.options:first').addClass('d-none');
          $menu.find('.arrow-down:first').removeClass('rotated-180deg');
        });

        setDropdownTreeBreadcrumb($btn1);
      });
    });

    // Select an item
    $('.dropdown-tree.select-menu .items-list .item-name').each(function () {
      const $itemName = $(this);
      $itemName.click(function () {
        const $dropdownTree = $itemName.closest('.dropdown-tree.select-menu');
        $dropdownTree.find('.selected-item').text($itemName.text().trim())
          .removeClass('text-dusty-gray');

        $dropdownTree.toggleClass('active')
          .find('.options:first').toggleClass('d-none')
          .find('.arrow-down:first').toggleClass('rotated-180deg');
      });
    });
  });
})(jQuery);