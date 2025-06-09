(function () {

  // off canvas element for CRUD form
  const itemFormCanvas = new bootstrap.Offcanvas('#itemForm');

  // counts number of non-sort item drags before displaying help message
  let SORT_HELP_COUNTER = 4;

  // the selected currency
  let CURRENCY_SYMBOL = '$';

  /*========================== AUTORUN ===========================*/

  /**
   * Initialize date/time picker input
   */
  const dtp = flatpickr('.datepicker', {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    altInput: true,
    altFormat: "Y-m-d, h:i K"
  });

  /**
   * Run on load.
   */
  addEventListener("load", (e) => {
    // get data from localStorage
    loadFromStorage();

    // set to dark mode if system theme is dark
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      toggleTheme();
    }

    // Set up draggable item sorting
    $('#item-list').sortable({
      items: `.col:not('#addItemBtn')`,
      opacity: 0.8,
      placeholder: 'sortable-placeholder',
      tolerance: 'pointer',
      stop: function (event, ui) {
        let selected = ui.item[0];
        let itemList = api.fetchItems();

        // get item's previous index
        let selectedId = selected.id;
        let curIndex = itemList.findIndex(el => el.id.toString() === selectedId);
        if (curIndex > -1) {
          // get item's current index
          let sortIndex = [...document.getElementById('item-list').querySelectorAll('.col')].indexOf(selected);

          // item position unchanged
          if (sortIndex === curIndex) {
            if (!SORT_HELP_COUNTER) {
              alertMessage('messageArea', "If you are having issues scrolling on mobile, place your finger on an item's quantity box to scroll the page.", 'warning', 8);
              SORT_HELP_COUNTER = 4;
            }
            else {
              SORT_HELP_COUNTER--;
            }
          }
          // item position changed
          else {
            // update item position
            let item = itemList.splice(curIndex, 1)[0];
            itemList.splice(sortIndex, 0, item);
            api.updateItems(itemList);

            // reset SORT_HELP_COUNTER
            SORT_HELP_COUNTER = 4;
          }
        }
        else {
          alertMessage('messageArea', 'Sorting error. Item not found.', 'danger', 3);
        }
      }
    });
  });

  /**
   * During Add Item mode, focus on item name input once the offcanvas is completely open.
   */
  document.getElementById('itemForm').addEventListener('shown.bs.offcanvas', e => {
    const id = document.getElementById('itemId').value;
    if (!id) {
      document.getElementById('itemName').focus();
    }

    // always show the optionals
    let optional = bootstrap.Collapse.getInstance(document.getElementById('collapseOpt'));
    if(optional) {
      optional.show();
    }
  });
  
  /**
   * Closes navbar when user taps out of it on mobile.
   */
  document.getElementById('item-list').addEventListener('click', e => {
    let status = document.getElementById('navbarNav').classList.contains('show');
    if(status) {
      document.getElementById('navbarNavHamburger').click();
    }
  });

  /**
   * While the form help modal is open, set focus accordingly.
   */
  document.getElementById('formHelpModal').addEventListener('shown.bs.modal', e => {
    document.getElementById('formHelpModal').focus();
  });
  document.getElementById('formHelpModal').addEventListener('hidden.bs.modal', e => {
    document.getElementById('itemForm').focus();
  });

  /**
   * Listener to change currency symbol.
   */
  document.getElementById('currencySymbolSelect').addEventListener('change', e => {
    const selected = e.target.value;

    // update currency symbol
    updateCurrencySymbol(selected);
    api.editCurrency(selected);
  });

  /**
   * Listener to keep price input to two decimal places.
   */
  document.getElementById('itemPrice').addEventListener('change', e => {
    e.currentTarget.value = parseFloat(e.currentTarget.value).toFixed(2);
  });

  /*======================= CRUD FUNCTIONS =======================*/

  /**
   * Call api to fetch list of items.
   */
  function dbFetchItems(isFile = false) {
    let items = api.fetchItems();

    // check if file has correct contents
    if (!items && isFile) {
      alertMessage('messageArea', 'A problem occurred while loading file. Please make sure you are loading the correct inventory file.', 'danger', 3);
      return;
    }

    renderItems(items);
  }

  /**
   * Call api to fetch a single item.
   * @param {*} id The id number of the item
   * @param {*} isDuplicate Boolean for duplicate mode
   */
  function dbFetchItem(id, isDuplicate) {
    let item = api.fetchItem(id);

    // item found
    if (item.id) {
      // a duplicate has no id
      if (isDuplicate) {
        item.id = "";
      }

      populateItemFields(item, isDuplicate);
      alertMessage('itemFormMessageArea', '');
      itemFormCanvas.show();
    }
    else {
      console.error(id, api.fetchItems());
      alertMessage('messageArea', 'Item not found.', 'danger', 3);
    }
  }

  /**
   * Call api to add a item.
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} quantity The quantity of the item
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} price The optional price of the item
   * @param {*} weight The optional weight of the item
   * @param {*} weightUnit The optional weight unit
   */
  function dbAddItem(itemName, itemType, colour, quantity, itemDate, price, weight, weightUnit) {
    // create new id
    let id = Date.now();

    if (api.addItem(id, itemName, itemType, colour, quantity, itemDate, price, weight, weightUnit)) {
      // calculate total price of item
      let totalPrice = weight ? calculateWeightedTotal(price, weight) : price;

      // Add item to item list
      createItemCard(id, itemName, itemType, colour, quantity, itemDate, totalPrice);
      appendAddItemButton();
      calculateTotal();

      // UI items
      itemFormCanvas.hide();
      alertMessage('messageArea', 'Item successfully added!', 'success', 3);
    }
    else {
      alertMessage('itemFormMessageArea', 'A problem occurred while adding item. Please try again later.', 'danger');
    }
  }

  /**
   * Call api to update a item.
   * @param {*} id The id number of the item
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} quantity The quantity of the item
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} price The optional price of the item
   * @param {*} weight The optional weight of the item
   * @param {*} weightUnit The optional weight unit
   */
  function dbUpdateItem(id, itemName, itemType, colour, quantity, itemDate, price, weight, weightUnit) {
    if (api.updateItem(id, itemName, itemType, colour, quantity, itemDate, price, weight, weightUnit)) {
      // calculate total price of item
      let totalPrice = weight ? calculateWeightedTotal(price, weight) : price;

      updateItemCard(id, itemName, itemType, colour, quantity, itemDate, totalPrice);
      calculateTotal();

      // UI items
      itemFormCanvas.hide();
      alertMessage('messageArea', 'Item successfully updated!', 'success', 3);
    }
    else {
      alertMessage('itemFormMessageArea', 'A problem occurred while updating item. Please try again later.', 'danger');
    }
  }

  /**
   * Call api to delete a item.
   * @param {*} id The id number of the item
   */
  function dbDeleteItem(id) {
    let errorMsg = 'A problem occurred while deleting item. Please try again later.';

    if (api.deleteItem(id)) {
      document.getElementById(`${id}`).remove();
      calculateTotal();

      // hide modal and hide item form
      let modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();
      itemFormCanvas.hide();

      alertMessage('messageArea', 'Item successfully deleted!', 'success', 3);
    }
    else {
      alertMessage('deleteModalMessageArea', errorMsg, 'danger');
    }
  }

  /**
   * Call api to fetch title of inventory list.
   */
  function dbFetchTitle() {
    let title = api.fetchTitle() ?? 'Inventory';
    document.getElementById('inventoryTitle').value = title;
  }

  /**
   * Call api to fetch currency symbol.
   */
  function dbFetchCurrency() {
    let symbol = api.fetchCurrency() ?? '$';
    document.getElementById('currencySymbolSelect').value = symbol;
    updateCurrencySymbol(symbol);
  }

  /*====================== HELPER FUNCTIONS ======================*/

  /**
   * Renders all items as cards with an "Add Item" button appended to the end.
   * @param {*} items Array of items as JSON objects
   */
  function renderItems(items) {
    let total = 0;

    items.forEach((item) => {
      // calculate total price of item
      let totalPrice = item.weight ? calculateWeightedTotal(item.price, item.weight) : item.price;

      createItemCard(item.id, item.name, item.type, item.colour, item.quantity, item.date, totalPrice);

      // add to total
      let price = parseFloat(item.price);
      let quantity = parseInt(item.quantity);
      if (!isNaN(price)) {
        total += price * quantity;
      }
    });

    appendAddItemButton();
    displayTotal(total);
  }

  /**
   * Fill the inputs of the form with a item's information.
   * @param {*} item A single item JSON object
   * @param {*} isDuplicate Boolean for duplicate mode
   */
  function populateItemFields(item, isDuplicate) {
    // set header
    document.getElementById('itemOperation').innerHTML = isDuplicate ? "Duplicate" : "Update";

    // populate inputs
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemType').value = item.type;
    document.getElementById('itemColour').value = item.colour;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemPrice').value = item.price === 0 ? '' : parseFloat(item.price).toFixed(2);
    document.getElementById('itemWeight').value = item.weight === 0 ? '' : parseFloat(item.weight).toFixed(2);
    document.getElementById('itemWeightUnit').innerHTML = item.weightUnit ?? 'kg';

    // parse date
    let date = new Date(item.date);
    let dateTime = date.toLocaleString();
    dtp.setDate(date);

    if (isDuplicate) {
      document.getElementById('deleteItemBtn').classList.add('d-none');
      document.getElementById('deleteItemBtn').removeAttribute('onclick');
      formHeaderColour('warning');
    }
    else {
      document.getElementById('deleteItemBtn').classList.remove('d-none');
      document.getElementById('deleteItemBtn').setAttribute('onclick', `showDeleteModal(event, '${item.id}', '${item.name}', '${dateTime}');`);
      formHeaderColour('primary');
    }
  }

  /**
   * Adds a single item card to the item list.
   * @param {*} id The id number of the new item
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} quantity The quantity of the item
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} price The optional price of the item
   */
  function createItemCard(id, itemName, itemType, colour, quantity, itemDate, price) {
    const date = new Date(itemDate);
    const dateTime = date.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
    const totalPrice = currencyFormat(price ?? 0);

    document.getElementById('item-list').innerHTML +=
      `<div class="col" id="${id}">
        <div class="card shadow h-100">
          <div class="card-header d-flex fw-bold text-white justify-content-between" id="${id}-header" style="background-color: ${colour}">
            <span class="d-flex align-items-center text-nowrap" id="${id}-itemName" title="Item Name">${itemName}</span>
            <div>
              <button class="btn btn-sm btn-link" onclick="updateItemMode('${id}', true)" title="Duplicate"><i class="bi bi-copy"></i></button>
              <button class="btn btn-sm btn-link" onclick="updateItemMode('${id}')" title="Edit"><i class="bi bi-pencil-square"></i></button>
            </div>
          </div>
          <div class="card-body bg-secondary-subtle">
            <div class="d-flex justify-content-between mb-3">
              <span class="badge bg-primary" id="${id}-itemType" title="Item Type">${itemType}</span>
              <span class="badge bg-success badge-price${price ? '' : ' d-none'}" id="${id}-itemPrice" data-price="${price ?? 0}" data-quantity="${quantity}" title="Item Price">
                <span class="currency-symbol">${CURRENCY_SYMBOL}</span>${totalPrice}
              </span>
            </div>
            <div class="form-floating shadow">
              <input class="form-control" id="${id}-quantity" value="${quantity}" title="Quantity" disabled>
              <label for="floatingInput">Quantity</label>
            </div>
          </div>
          <div class="card-footer">
            <small class="text-body-secondary" id="${id}-itemDate" title="Appointment Date">${dateTime}</small>
          </div>
        </div>
      </div>`;
  }

  /**
   * Updates a item card in the item list with the latest information.
   * @param {*} id The id number of the new item
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} quantity The quantity of the item
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} price The optional price of the item
   */
  function updateItemCard(id, itemName, itemType, colour, quantity, itemDate, price) {
    const date = new Date(itemDate);
    const dateTime = date.toLocaleString();
    const totalPrice = currencyFormat(price ?? 0);

    document.getElementById(`${id}-itemName`).innerHTML = itemName;
    document.getElementById(`${id}-itemType`).innerHTML = itemType;
    document.getElementById(`${id}-quantity`).value = quantity;
    document.getElementById(`${id}-itemDate`).innerHTML = dateTime;

    // update price and display
    let priceEl = document.getElementById(`${id}-itemPrice`);
    priceEl.setAttribute('data-price', price);
    priceEl.setAttribute('data-quantity', quantity);
    priceEl.innerHTML = `<span class="currency-symbol">${CURRENCY_SYMBOL}</span>${totalPrice}`;
    price ? priceEl.classList.remove('d-none') : priceEl.classList.add('d-none');

    // set header colour
    document.getElementById(`${id}-header`).style.backgroundColor = colour;
  }

  /**
   * Calculates the total price of all items and shows/hides the total price display.
   * @param {*} newPrice New price to add to total
   */
  function calculateTotal(newPrice) {
    let total = 0;

    // fetch all prices from badge prices in DOM
    document.querySelectorAll('.badge-price').forEach((el) => {
      let price = parseFloat(el.getAttribute('data-price'));
      let quantity = parseInt(el.getAttribute('data-quantity'));
      if (!isNaN(price)) {
        total += price * quantity;
      }
    });

    // add new price to total
    if (newPrice) {
      total += newPrice;
    }

    displayTotal(total);
  }

  /**
   * Gets title and items from localStorage and renders items on screen.
   * @param {*} isFile Whether or not we are loading from an uploaded file
   */
  function loadFromStorage(isFile = false) {
    dbFetchItems(isFile);
    dbFetchTitle();
    dbFetchCurrency();
  }

  /**
   * Converts kilograms to pounds.
   * @param {*} kg The kilogram value
   * @returns The pound value to two decimal places
   */
  function kgToLb(kg) {
    const conversionFactor = 2.2046226218;
    return (kg * conversionFactor).toFixed(4);
  }

  /**
   * Converts pounds to kilograms.
   * @param {*} kg The pound value
   * @returns The kilogram value to two decimal places
   */
  function lbToKg(lb) {
    const conversionFactor = 0.45359237;
    return (lb * conversionFactor).toFixed(4);
  }

  /**
   * Calculates the price of an item according to the price per weight and total weight of the item.
   * @param {*} price The price of the item per weight
   * @param {*} weight The total weight of the item
   * @returns The price of the item
   */
  function calculateWeightedTotal(price, weight) {
    return (price * weight).toFixed(2);
  }

  /*====================== DISPLAY FUNCTIONS =====================*/

  /**
   * Displays an alert message.
   * @param {*} id id of the element
   * @param {*} message message to display
   * @param {*} colour bootstrap colour
   * @param {*} timer time in seconds until automatic removal
   * @returns 
   */
  function alertMessage(id, message, colour, timer) {
    // error check
    if (typeof message != 'string' || typeof id != 'string' || id.length == 0)
      return;

    // reset the message display area
    if (message.length === 0) {
      document.getElementById(id).innerHTML = '<br>';
      return;
    }

    // set message
    let icon = colour === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle';
    let content =
      `<div class="alert alert-${colour} alert-dismissible fade show d-flex shadow py-2" role="alert">
        <i class="${icon} me-2"></i><span class="fw-bold mx-auto text-center">${message}</span>
        <button type="button" class="btn-close pt-1" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;

    // display alert
    document.getElementById(id).innerHTML = content;

    // add timer
    if (timer) {
      setTimeout(() => {
        document.getElementById(id).innerHTML = "<br>";
      }, parseInt(timer) * 1000);
    }
  }

  /**
   * Clears all previous header colours and sets the item form header to designated colour.
   * @param {*} colour The designated colour
   */
  function formHeaderColour(colour) {
    document.getElementById('itemFormHeader').classList.remove('bg-primary-subtle', 'bg-success-subtle', 'bg-warning-subtle');
    document.getElementById('itemFormHeader').classList.add(`bg-${colour}-subtle`);
  }

  /**
   * Appends an 'Add Item' button to the end of the item list.
   */
  function appendAddItemButton() {
    let addBtn = document.getElementById('addItemBtn');
    if (addBtn) {
      addBtn.remove();
    }

    document.getElementById('item-list').innerHTML +=
      `<div class="col" id="addItemBtn">
        <div class="card shadow h-100">
          <button class="btn btn-lg bg-body-tertiary text-primary h-100" title="Add Item" onclick="addItemMode();">
            <i class="bi bi-plus-square"></i>
          </button>
        </div>
      </div>`;
  }

  /**
   * Display total price if applicable. Hides total price if 0.
   */
  function displayTotal(total) {
    if (total) {
      document.getElementById('totalAmount').innerHTML = `<span class="currency-symbol">${CURRENCY_SYMBOL}</span>${currencyFormat(total)}`;
      document.getElementById('totalArea').classList.remove('d-none');
    }
    else {
      document.getElementById('totalAmount').innerHTML = '';
      document.getElementById('totalArea').classList.add('d-none');
    }
  }

  /**
   * Converts a float number to US currency format.
   * @param {*} price The float price amount
   * @returns The formatted US currency amount
   */
  function currencyFormat(price) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2 });
  }

  /**
   * Updates all UI currency symbols.
   * @param {*} symbol The new currency symbol
   */
  function updateCurrencySymbol(symbol) {
    // change all instances of currency symbol
    document.querySelectorAll('.currency-symbol').forEach((el) => {
      el.innerHTML = symbol;
    });
  }

  /*====================== LISTENER FUNCTIONS ====================*/

  /**
   * Resets all data by clearing title and items.
   */
  window.clearData = () => {
    document.getElementById('item-list').innerHTML = '';
    localStorage.clear();
    loadFromStorage();

    // hide modal
    let modal = bootstrap.Modal.getInstance(document.getElementById('clearModal'));
    modal.hide();

    alertMessage('messageArea', 'Data cleared!', 'success', 3);
  }

  /**
   * Clicks the hidden file input to upload existing inventory list.
   */
  window.loadFileListener = () => {
    document.getElementById('fileInput').click();
  },

  /**
   * Loads user uploaded database file.
   */
  window.loadFile = () => {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;

        // Try to parse file content
        try {
          let parseInput = JSON.parse(fileContent);

          if (parseInput.items) {
            // reset UI elements and clear current inventory
            alertMessage('messageArea', '');
            itemFormCanvas.hide();
            document.getElementById('item-list').innerHTML = '';

            // load file content
            api.loadInventory(parseInput);
            loadFromStorage(true);
          }
          else {
            alertMessage('messageArea', 'Error loading file. Inventory data not found.', 'danger', 3);
          }
        }
        catch (e) {
          console.error(e);
          alertMessage('messageArea', 'Error loading file. Could not read data.', 'danger', 3);
        }
      };

      reader.readAsText(file);
    }
    else {
      alertMessage('messageArea', 'File not found.', 'danger', 3);
    }
  },

  /**
   * Save inventory as a text file.
   */
  window.saveFile = () => {
    let inventory = api.fetchInventory();

    // Validations
    if (!inventory.items.length) {
      alertMessage('messageArea', 'Save canceled. There are no items in the list.', 'danger', 3);
      return;
    }

    // fill null values
    if (!inventory.title) {
      inventory.title = document.getElementById('inventoryTitle').value;
    }
    if (!inventory.currency) {
      inventory.currency = document.getElementById('currencySymbolSelect').value;
    }

    const file = new Blob([JSON.stringify(inventory)], { type: 'text/plain' });
    const link = document.getElementById('downloadLink');

    link.href = URL.createObjectURL(file);
    link.download = "inventory.txt";
    link.click();
  },

  window.sortItems = (mode) => {
    if (!api.fetchItems().length) {
      alertMessage('messageArea', 'There are no items to sort.', 'danger', 3);
      return;
    }

    let sortedItems;
    switch (mode) {
      // alphabet (dsc)
      case '1':
        sortedItems = api.sortItemsByName(true);
        break;
      // type (asc)
      case '2':
        sortedItems = api.sortItemsByType();
        break;
      // type (dsc)
      case '3':
        sortedItems = api.sortItemsByType(true);
        break;
      // date (asc)
      case '4':
        sortedItems = api.sortItemsByDate();
        break;
      // date (dsc)
      case '5':
        sortedItems = api.sortItemsByDate(true);
      // quantity (asc)
      case '6':
        sortedItems = api.sortItemsByQuantity();
        break;
      // quantity (dsc)
      case '7':
        sortedItems = api.sortItemsByQuantity(true);
        break;
      // alphabet (asc)
      default:
        sortedItems = api.sortItemsByName();
    }

    document.getElementById('item-list').innerHTML = '';
    renderItems(sortedItems);
  },

  /**
   * Toggles the theme.
   */
  window.toggleTheme = () => {
    const btn = document.getElementById('themeBtn');
    let html = document.documentElement;

    if (html.hasAttribute('data-bs-theme')) {
      html.removeAttribute('data-bs-theme');
      btn.innerHTML = `<i class="bi bi-moon-stars-fill mx-2"></i>Dark Mode`;
    }
    else {
      html.setAttribute('data-bs-theme', 'dark');
      btn.innerHTML = `<i class="bi bi-brightness-high-fill mx-2"></i>Light Mode`;
    }
  },

  /**
   * Update title of inventory list.
   * @param {*} el The HTML input element
   */
  window.setTitle = (el) => {
    if (!el.value) {
      el.value = "Inventory";
    }

    api.editTitle(el.value);
  }

  /**
   * Sets the form to "Add Item" mode.
   */
  window.addItemMode = () => {
    document.getElementById('itemOperation').innerHTML = "Add";

    // clear inputs
    document.getElementById('itemId').value = "";
    document.getElementById('itemName').value = "";
    document.getElementById('itemType').value = "";
    document.getElementById('itemColour').value = "";
    document.getElementById('itemQuantity').value = "";
    document.getElementById('itemPrice').value = "";
    document.getElementById('itemWeight').value = "";
    document.getElementById('itemWeightUnit').innerHTML = "kg";

    // clear datepicker
    dtp.clear();

    // hide delete button
    document.getElementById('deleteItemBtn').classList.add('d-none');
    document.getElementById('deleteItemBtn').removeAttribute('onclick');

    // change header colour
    formHeaderColour('success');

    // reset message area
    alertMessage('itemFormMessageArea', '');

    // show the item form
    itemFormCanvas.show();
  }

  /**
   * Sets the form to "Update Item" mode.
   * @param {*} id The id of the item
   * @param {*} isDuplicate Boolean for duplicate mode
   */
  window.updateItemMode = (id, isDuplicate = false) => {
    dbFetchItem(id, isDuplicate);
  }

  /**
   * The form's Save button listener which determines whether it's an add or update item operation.
   * @param {*} event The HTML event
   * @returns Validation error message
   */
  window.addOrUpdateItem = (event) => {
    event.preventDefault();

    let id = parseInt(event.target.itemId.value);
    let itemName = event.target.itemName.value.trim();
    let itemType = event.target.itemType.value.trim();
    let itemColour = event.target.itemColour.value;
    let itemDate = event.target.itemDate.value;
    let weightUnit = document.getElementById('itemWeightUnit').innerHTML;

    // parsing
    let itemQuantity = event.target.itemQuantity.value;
    let parseQuantity = parseInt(itemQuantity);
    let itemPrice = event.target.itemPrice.value;
    let parsePrice = parseFloat(itemPrice);
    let itemWeight = event.target.itemWeight.value;
    let parseWeight = parseFloat(itemWeight);
    let date = new Date(itemDate);

    // Validations
    if (!itemName) {
      alertMessage('itemFormMessageArea', 'Please enter item name.', 'danger', 3);
      return;
    }
    else if (!itemType) {
      alertMessage('itemFormMessageArea', 'Please enter item type.', 'danger', 3);
      return;
    }
    else if (!itemColour) {
      alertMessage('itemFormMessageArea', 'Please select a colour.', 'danger', 3);
      return;
    }
    else if (isNaN(parseQuantity) && itemQuantity !== '') {
      alertMessage('itemFormMessageArea', 'Please enter a valid quantity.', 'danger', 3);
      return;
    }
    else if (itemDate && !date) {
      alertMessage('itemFormMessageArea', 'Please enter a valid date.', 'danger', 3);
      return;
    }
    else if (itemPrice && (isNaN(parsePrice) || parsePrice < 0)) {
      alertMessage('itemFormMessageArea', 'Please enter a valid price.', 'danger', 3);
      return;
    }
    else if (itemWeight && (isNaN(parseWeight) || parseWeight < 0)) {
      alertMessage('itemFormMessageArea', 'Please enter a valid weight.', 'danger', 3);
      return;
    }

    // make sure item name is unique
    let nameCheck = api.searchItems(itemName);
    if (nameCheck && nameCheck.id !== id) {
      let date = new Date(nameCheck.date);
      let dateTime = date.toLocaleString();
      alertMessage('itemFormMessageArea', `Item already exists and was added on <em>${dateTime}</em>`, 'danger', 4);
      return;
    }

    // if no date selected, use current date/time
    if (!itemDate) {
      date = new Date();
      date.setSeconds(0); // seconds are not needed
    }
    let dateSplit = date.toISOString().split('.');
    let dateTime = dateSplit[0] + 'Z';

    // if blank quantity, default to 1
    parseQuantity = itemQuantity === '' ? 1 : parseQuantity;

    // if blank price, default to 0
    parsePrice = itemPrice === '' ? 0 : parsePrice;
    
    // if blank weight, default to 0
    parseWeight = itemWeight === '' ? 0 : parseWeight;

    // add or update the item
    if (isNaN(id)) {
      dbAddItem(itemName, itemType, itemColour, parseQuantity, dateTime, parsePrice, parseWeight, weightUnit);
    }
    else {
      dbUpdateItem(id, itemName, itemType, itemColour, parseQuantity, dateTime, parsePrice, parseWeight, weightUnit);
    }
  }

  /**
   * Button listener for add/update form.
   */
  window.addUpdateSave = () => {
    document.getElementById('addUpdateForm').requestSubmit();
  }

  /**
   * Display the item deletion modal.
   * @param {*} event The HTML event
   * @param {*} id The id of the item
   * @param {*} name The name of the item
   * @param {*} dateTime The items appointment date/time
   */
  window.showDeleteModal = (event, id, name, dateTime) => {
    event.preventDefault();

    document.getElementById('deleteModal').setAttribute('data-id', id);
    document.getElementById('deleteItemName').innerHTML = name;
    document.getElementById('deleteDateTime').innerHTML = dateTime;

    let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteModal'));
    modal.show();
  }

  /**
   * Listener for the delete button in the delete item modal.
   */
  window.deleteItem = () => {
    let id = document.getElementById('deleteModal').getAttribute('data-id');
    dbDeleteItem(id);
  }

  /**
   * Toggles weight unit between kilograms and pounds.
   * @param {*} el The button element
   * @param {*} event The HTML event
   */
  window.toggleWeightUnit = (el, event) => {
    event.preventDefault();
    
    let currentUnit = el.innerHTML;
    let weightEl = document.getElementById('itemWeight');
    let weight = parseFloat(weightEl.value);

    el.innerHTML = el.innerHTML === 'kg' ? 'lb' : 'kg';
    if(isNaN(weight)) return;

    // convert lb to kg
    if(currentUnit === 'kg') {
      weightEl.value = kgToLb(weight);
    }
    // convert kg to lb
    else {
      weightEl.value = lbToKg(weight);
    }
  }

  /**
   * Display the form help modal.
   */
  window.formHelp = (event) => {
    event.preventDefault();

    let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('formHelpModal'));
    modal.show();
  }
})();
