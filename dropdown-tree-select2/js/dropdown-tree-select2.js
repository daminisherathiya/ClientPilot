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

$(".dropdown-tree-select2")
  .select2({
    closeOnSelect: false,
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
      "span[data-id='" + selectedData.id + "']"
    );
    while ($ancestor) {
      ancestorText.push($ancestor.text());
      ancestorSet.add($ancestor.attr("data-id"));
      if ($ancestor.attr("data-parent-id")) {
        $ancestor = $dropdownContainer.find(
          "span[data-id='" + $ancestor.attr("data-parent-id") + "']"
        );
      } else {
        $ancestor = null;
      }
    }
    console.log(ancestorText);

    $dropdownContainer.find("span[data-id]").each(function () {
      const id = $(this).attr("data-id");
      const parentId = $(this).attr("data-parent-id");
      $(this).find("img").removeClass("rotate-180deg");

      if (parentId && !ancestorSet.has(id) && !ancestorSet.has(parentId)) {
        $(this).addClass("d-none");
      }
      if (ancestorSet.has(id)) {
        $(this).find("img").addClass("rotate-180deg");
      }
    });

    if (selectedData.numberOfChildren) {
      const numberOfHiddenChildren = $dropdownContainer.find(
        "span[data-parent-id='" + selectedData.id + "'].d-none"
      ).length;
      if (numberOfHiddenChildren) {
        $dropdownContainer
          .find("span[data-parent-id='" + selectedData.id + "']")
          .removeClass("d-none");
          $dropdownContainer.find(
            "span[data-id='" + selectedData.id + "'] img"
          ).addClass("rotate-180deg");
      } else {
        $dropdownContainer
          .find("span[data-parent-id='" + selectedData.id + "']")
          .addClass("d-none");
          $dropdownContainer.find(
            "span[data-id='" + selectedData.id + "'] img"
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
      .join(" <span>&gt;</span> ");
    $breadcrumb.html(breadcrumbHtml);
  });

// Function to format item display in dropdown
function formatItem(item) {
  if (!item.id) {
    return item.text;
  }

  const img = $("<img>", {
    class: "item-image",
    src: item.image,
  });
  const $item = $("<span>")
    .append(img)
    .append(item.text)
    .addClass("indent-" + item.numberOfAncestors)
    .attr("data-id", item.id)
    .attr("data-parent-id", item.parentId);

  if (item.numberOfChildren) {
    const arrow = $("<img>", {
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
