function setBreadcrumb($dropdownContainer, ancestorTextList){
  const $breadcrumb = $dropdownContainer.find(".breadcrumb");
  const breadcrumbHtml = ancestorTextList
    .reverse()
    .map(function (text) {
      return "<span>" + text + "</span>";
    })
    .join(" <span class='px-2'>&gt;</span> ");
  $breadcrumb.html(breadcrumbHtml);
}

function getBorderItem(numberOfAncestors, type = "first") {
  let $item = null;

  if (type === "first") {
    $item = $("<div>", {
      class: "vertical-line start-horizontal-line horizontal-line ps-0"
    }).append($item);
  } else if (type === "last") {
    $item = $("<div>", {
      class: "vertical-line end-horizontal-line horizontal-line ps-0"
    }).append($item);
  } else if (type === "middle") {
    $item = $("<div>", {
      class: "vertical-line horizontal-line ps-0"
    }).append($item);
  } else {  // leaf
    $item = $("<div>", {
      class: "ps-3 ps-lg-5"
    }).append($item);
  }

  for (let i = 0; i < numberOfAncestors; i++) {
    $item = $("<div>", {
      class: "vertical-line ps-3 ps-lg-5"
    }).append($item);
  }

  $item.addClass("position-absolute left-0");

  return $item;
}

function setUpItemsMap(items, itemsMap) {
  items.forEach((item) => {
    itemsMap[item.id] = item;
  });
}

function addNumberOfAncestorsAndNumberOfChildren(items, itemsMap) {
  const rootId = "-1";

  items.forEach((item) => {
    item.numberOfAncestors = 0;
    item.numberOfChildren = 0;
    item.firstChildId = null;
    item.lastChildId = null;
    item.isFirstChild = false;
    item.isLastChild = false;
    item.parentIsFirstChild = false;
    item.parentIsLastChild = false;
  });
  itemsMap[rootId] = {
    firstChildId: null,
    lastChildId: null,
    parentIsFirstChild: false,
    parentIsLastChild: false,
  };

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
    if (!itemsMap[item.parentId || rootId]) {
      console.log(item);
    }
    if (!itemsMap[item.parentId || rootId].firstChildId) {
      itemsMap[item.parentId || rootId].firstChildId = item.id;
      item.isFirstChild = true;
    }
    itemsMap[item.parentId || rootId].lastChildId = item.id;
  });
  items.forEach((item) => {
    if (item.id === itemsMap[item.parentId || rootId].lastChildId) {
      item.isLastChild = true;
    }
  });
  items.forEach((item) => {
    if (itemsMap[item.parentId || rootId].isFirstChild) {
      itemsMap[item.id].parentIsFirstChild = true;
    }
    if (itemsMap[item.parentId || rootId].isLastChild) {
      itemsMap[item.id].parentIsLastChild = true;
    }
  });
  delete itemsMap[rootId];
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
    width: "100%",
    placeholder: "Enter a device",
    // closeOnSelect: false,
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
        setBreadcrumb($(this.container.$dropdown), ["Category"]);
        // console.log("dataCache", dataCache);
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
        const term = params.data.q || "";
        const cacheId = params.url;

        if (cacheId in dataCache) {
          success(dataCache[cacheId]);
          return;
        }

        const $request = $.ajax(params);
        $request.then(function (data) {
          dataCache[cacheId] = data;
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
  .on("select2:open", function (e) {
    var $searchField = $(".select2-search__field");
    $searchField.prop("placeholder", "Search for a device");

    var $dropdownContainer = $(this).data("select2").$dropdown;
    $dropdownContainer.find(".breadcrumb").remove();
    const $breadcrumb = $('<div class="breadcrumb">Category</div>').prependTo(
      $dropdownContainer.find(".select2-results")
    );
  })
  .on("select2:selecting", function (e) {
    const selectedData = e.params.args.data;
    var $dropdownContainer = $(this).data("select2").$dropdown;

    const ancestorTextList = [];
    const ancestorSet = new Set();
    let $ancestor = $dropdownContainer.find(
      "div[data-id='" + selectedData.id + "']"
    );
    while ($ancestor) {
      ancestorTextList.push($ancestor.text());
      ancestorSet.add($ancestor.attr("data-id"));
      if ($ancestor.attr("data-parent-id")) {
        $ancestor = $dropdownContainer.find(
          "div[data-id='" + $ancestor.attr("data-parent-id") + "']"
        );
      } else {
        $ancestor = null;
      }
    }
    ancestorTextList.push("Category");
    // console.log(ancestorTextList);

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

    setBreadcrumb($dropdownContainer, ancestorTextList);
  });

// Function to format item display in dropdown
function formatItem(item) {
  if (!item.id) {
    return item.text;
  }

  const $itemImg = $("<img>", {
    class: "item-image me-4",
    src: item.image,
  });
  const $itemInfo = $("<div>", {
    class: "py-2"
  })
    .append($itemImg)
    .append(item.text);

  const $itemInfoAndArrow = $("<div>", {
    class: "d-flex justify-content-between"
  }).append($itemInfo);
  if (item.numberOfChildren) {
    const arrow = $("<img>", {
      class: "arrow-down roted-0deg",
      src: "./images/arrow-down.svg",
    });
    const $imgDiv = $("<div>", {
      class: "d-flex justify-content-center align-items-center",
    }).append(arrow);
    $itemInfoAndArrow.append($imgDiv);
  }

  const $item = $("<div>", {
    class: "position-relative"
  })
    .append($itemInfoAndArrow)
    .addClass("indent-" + item.numberOfAncestors)
    .attr("data-id", item.id)
    .attr("data-parent-id", item.parentId);

  if (item.numberOfChildren) {
    if (!(item.isFirstChild && item.isLastChild)) {
      if (item.isFirstChild) {
        $item.prepend(getBorderItem(item.numberOfAncestors, "first"));
      } else if (item.isLastChild) {
        $item.prepend(getBorderItem(item.numberOfAncestors, "last"));
      } else {
        $item.prepend(getBorderItem(item.numberOfAncestors, "middle"));
      }
    }
  } else {
    if (!(item.parentIsFirstChild && item.parentIsLastChild)) {
      $item.prepend(getBorderItem(item.numberOfAncestors - (item.parentIsLastChild ? 1 : 0), "leaf"));
    }
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
