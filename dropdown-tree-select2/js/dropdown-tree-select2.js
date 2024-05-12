function setUpItemsMap(items, itemsMap) {
  items.forEach((item) => {
    itemsMap[item.id] = item;
  });
}

function addNumberOfAncestorsAndNumberOfChildren(items, itemsMap) {
  items.forEach((item) => {
    item.numberOfAncestors = 0;
    item.numberOfChildren = 0;
  });

  const countAncestors = (item) => {
    let count = 0;
    let currentItem = item;

    while (currentItem.parentId) {
      count++;
      currentItem = itemsMap[currentItem.parentId];
    }

    return count;
  };

  items.forEach((item) => {
    item.numberOfAncestors = countAncestors(item);
    if (item.parentId) {
      itemsMap[item.parentId].numberOfChildren++;
    }
  });
}

function collectAncestors(item, itemsMap, ancestorSet) {
  if (item.parentId && !ancestorSet.has(item.parentId)) {
    ancestorSet.add(item.parentId);
    collectAncestors(itemsMap[item.parentId], itemsMap, ancestorSet);
  }
}

function filterEntries(searchTerm, data, itemsMap) {
  const filteredData = data.filter((item) =>
    item.text.toLowerCase().includes(searchTerm)
  );

  const ancestorSet = new Set();
  filteredData.forEach((item) => {
    ancestorSet.add(item.id);
    collectAncestors(item, itemsMap, ancestorSet);
  });

  return data.filter((item) => ancestorSet.has(item.id));
}
let dataCache = {};
$(".dropdown-tree-select2")
  .select2({
    placeholder: "Enter a device",
    closeOnSelect: false,
    selectionCssClass: 'dropdown-tree-select2-selection border-input',
    dropdownCssClass: 'dropdown-tree-select2-dropdown dropdown-tree-select2-devices-dropdown',
    ajax: {
      url: "https://client-pilot-default-rtdb.firebaseio.com/phones.json",
      dataType: "json",
      delay: 100,
      data: function (params) {
        return {
          q: params.term,
        };
      },
      processResults: function (data, params) {
        // console.log("data", data);

        const itemsMap = {};
        setUpItemsMap(data, itemsMap);

        // Remove filterEntries once the API itself returns the filtered data
        const filteredData = filterEntries(
          params.term ? params.term.toLowerCase() : "",
          data,
          itemsMap
        );
        // console.log("filteredData", filteredData);

        addNumberOfAncestorsAndNumberOfChildren(
          filteredData,
          itemsMap,
          itemsMap
        );
        // console.log("filteredData with addNumberOfAncestorsAndNumberOfChildren", filteredData);

        return { results: filteredData };
      },
      transport: function (params, success, failure) {
        var $request;
        var term = params.data.q || "";
        if (term in dataCache) {
          // If the data is cached, return the cached data
          success(dataCache[term]);
          return;
        }

        // If the data is not cached, make the AJAX request
        $request = $.ajax(params);
        $request.then(function (data) {
          // Store the data in cache
          dataCache[term] = data;
          success(data);
        });
        $request.fail(failure);
        return $request;
      },
      cache: true,
    },
    templateResult: formatItem,
    templateSelection: formatItemSelection,
  })
  .on("select2:selecting", function (e) {
    const selectedData = e.params.args.data;
    var $dropdownContainer = $(this).data("select2").$dropdown;

    const ancestorText = [];
    const ancestorSet = new Set();
    let $ancestor = $dropdownContainer.find(
      "div[data-id='" + selectedData.id + "']"
    );
    while ($ancestor) {
      ancestorText.push($ancestor.text());
      ancestorSet.add($ancestor.attr("data-id"));
      if ($ancestor.attr("data-parent-id")) {
        $ancestor = $dropdownContainer.find(
          "div[data-id='" + $ancestor.attr("data-parent-id") + "']"
        );
      } else {
        $ancestor = null;
      }
    }
    console.log(ancestorText);

    $dropdownContainer.find("div[data-id]").each(function () {
      const id = $(this).attr("data-id");
      const parentId = $(this).attr("data-parent-id");
      $(this).find("img.arrow-down").removeClass("rotate-180deg");

      if (parentId && !ancestorSet.has(id) && !ancestorSet.has(parentId)) {
        $(this).addClass("d-none");
      }
      if (ancestorSet.has(id)) {
        $(this).find("img.arrow-down").addClass("rotate-180deg");
      }
    });

    if (selectedData.numberOfChildren) {
      const numberOfHiddenChildren = $dropdownContainer.find(
        "div[data-parent-id='" + selectedData.id + "'].d-none"
      ).length;
      if (numberOfHiddenChildren) {
        $dropdownContainer
          .find("div[data-parent-id='" + selectedData.id + "']")
          .removeClass("d-none");
        $dropdownContainer.find(
          "div[data-id='" + selectedData.id + "'] img.arrow-down"
        ).addClass("rotate-180deg");
      } else {
        $dropdownContainer
          .find("div[data-parent-id='" + selectedData.id + "']")
          .addClass("d-none");
        $dropdownContainer.find(
          "div[data-id='" + selectedData.id + "'] img.arrow-down"
        ).removeClass("rotate-180deg");
      }
      e.preventDefault();
    }

    $dropdownContainer.find(".breadcrumb").remove();
    const $breadcrumb = $('<div class="breadcrumb"></div>').prependTo(
      $dropdownContainer.find(".select2-results__options")
    );
    const breadcrumbHtml = ancestorText
      .reverse()
      .map(function (text) {
        return "<span>" + text + "</span>";
      })
      .join(" <span class='px-2'>&gt;</span> ");
    $breadcrumb.html(breadcrumbHtml);
  });

// Function to format item display in dropdown
function formatItem(item) {
  if (!item.id) {
    return item.text;
  }

  const img = $("<img>", {
    class: "item-image me-4",
    src: item.image,
  });
  const $item1 = $("<div>", {
    class: "py-2"
  })
    .append(img)
    .append(item.text);
  const $item = $("<div>", {
    class: "d-flex justify-content-between"
  })
    .append($item1)
    .addClass("indent-" + item.numberOfAncestors)
    .attr("data-id", item.id)
    .attr("data-parent-id", item.parentId);

  if (item.numberOfChildren) {
    const arrow = $("<img>", {
      class: "arrow-down roted-0deg",
      src: "./images/arrow-down.svg",
    });
    $item.append(arrow);
  }

  if (item.parentId) {
    $item.addClass("d-none");
  }

  return $item;
}

// Function to format item display in the selection
function formatItemSelection(item) {
  return item.text;
}
