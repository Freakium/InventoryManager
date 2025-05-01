(function () {

  const itemFormCollapse = new bootstrap.Collapse('#itemForm', {
    toggle: false
  });

  /*========================== AUTORUN ===========================*/

  // Initialize date/time picker input
  const dtp = flatpickr('.datepicker', {
    enableTime: true
  });

  addEventListener("load", (e) => {
    // Initial "Add Item" button in item list
    appendAddItemButton();

    // set to dark mode if system theme is dark
    if(window.matchMedia('(prefers-color-scheme: dark)').matches) {
      toggleTheme();
    }
  });

  /*======================= CRUD FUNCTIONS =======================*/

  /**
   * Call api to fetch list of items.
   */
  function dbFetchItems() {
    let items = api.fetchItems();

    // check if file has correct contents
    if(!items) {
      alertMessage('fileMessageArea', 'A problem occurred while loading file. Please make sure you are loading the correct inventory file.', 'danger');
      return;
    }

    renderItems(items);
  }

  /**
   * Call api to fetch a single item.
   * @param {*} id The id number of the item
   */
  function dbFetchItem(id) {
    let item = api.fetchItem(id);

    if(item) {
      populateItemFields(item);
      itemFormCollapse.show();
    }
    else {
      alertMessage('messageArea', 'A problem occurred while fetching item. Please try again later.', 'danger');
    }
  }

  /**
   * Call api to add a item.
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} quantity The quantity of the item
   */
  function dbAddItem(itemName, itemType, colour, itemDate, quantity) {
    let id = Date.now();

    if(api.addItem(id, itemName, itemType, colour, itemDate, quantity)) {
      // Add item to item list
      createItemCard(id, itemName, itemType, colour, itemDate, quantity);
      appendAddItemButton();

      // UI items
      itemFormCollapse.hide();
      alertMessage('messageArea', 'Item successfully added!', 'success', 3);
      document.getElementById('saveListBtn').classList.remove('d-none');
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
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} quantity The quantity of the item
   */
  function dbUpdateItem(id, itemName, itemType, colour, itemDate, quantity) {
    if(api.updateItem(id, itemName, itemType, colour, itemDate, quantity)) {
      updateItemCard(id, itemName, itemType, colour, itemDate, quantity);
      
      // UI items
      itemFormCollapse.hide();
      alertMessage('messageArea', 'Item successfully updated!', 'success', 3);
      document.getElementById('saveListBtn').classList.remove('d-none');
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

    if(api.deleteItem(id)) {
      document.getElementById(`item-${id}`).remove();

      // hide modal and hide item form
      let modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();
      itemFormCollapse.hide();

      alertMessage('messageArea', 'Item successfully deleted!', 'success', 3);
      document.getElementById('saveListBtn').classList.remove('d-none');
    }
    else {
      alertMessage('deleteModalMessageArea', errorMsg, 'danger');
    }
  }

  /**
   * Call api to fetch title of inventory list.
   */
  function dbFetchTitle() {
    let title = api.fetchTitle();

    // check if file has correct contents
    if(!title) {
      alertMessage('fileMessageArea', 'A problem occurred while loading file. Please make sure you are loading the correct inventory file.', 'danger');
      return;
    }

    document.getElementById('inventoryTitle').value = title;
  }

  /*====================== HELPER FUNCTIONS ======================*/

  /**
   * Renders all items as cards with an "Add Item" button appended to the end.
   * @param {*} items Array of items as JSON objects
   */
  function renderItems(items) {
    // sort by date
    items.sort((a, b) => {
      return new Date(b.itemDate) - new Date(a.itemDate);
    });

    items.forEach((item) => {
      createItemCard(item.id, item.name, item.type, item.colour, item.date, item.quantity);
    });

    appendAddItemButton();
  }

  /**
   * Fill the inputs of the form with a item's information.
   * @param {*} item A single item JSON object
   */
  function populateItemFields(item) {
    document.getElementById('itemOperation').innerHTML = "Update";

    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemType').value = item.type;
    document.getElementById('itemColour').value = item.colour;
    document.getElementById('itemQuantity').value = item.quantity;

    // parse date
    let date = new Date(item.date);
    let dateTime = date.toLocaleString();
    dtp.setDate(date);

    // show delete button
    document.getElementById('deleteItemBtn').classList.remove('d-none');
    document.getElementById('deleteItemBtn').setAttribute('onclick', `showDeleteModal(event, '${item.id}', '${item.name}', '${dateTime}');`);

    document.getElementById('itemName').focus();
  }

  /**
   * Adds a single item card to the item list.
   * @param {*} id The id number of the new item
   * @param {*} itemName Name of the item
   * @param {*} itemType The type of item
   * @param {*} colour The colour of the item (shown on header)
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} quantity The quantity of the item
   */
  function createItemCard(id, itemName, itemType, colour, itemDate, quantity) {
    let date = new Date(itemDate);
    let dateTime = date.toLocaleString();

    document.getElementById('item-list').innerHTML +=
      `<div class="col" id="item-${id}">
        <div class="card shadow h-100">
          <div class="card-header d-flex fw-bold text-white justify-content-between" id="${id}-header" style="background-color: ${colour}">
            <span class="d-flex align-items-center text-nowrap" id="${id}-itemName" title="Item Name">${itemName}</span>
            <button class="btn btn-sm btn-link" onclick="updateItemOperation('${id}');"><i class="bi bi-pencil-square"></i></button>
          </div>
          <div class="card-body bg-secondary-subtle">
            <div class="form-floating shadow mb-3">
              <input class="form-control mb-3" id="${id}-quantity" value="${quantity}" title="Quantity" disabled>
              <label for="floatingInput">Quantity</label>
            </div>
            <span class="badge bg-primary" id="${id}-itemType" title="Item Type">${itemType}</span>
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
   * @param {*} itemDate The item's set date in ISO format
   * @param {*} quantity The quantity of the item
   */
  function updateItemCard(id, itemName, itemType, colour, itemDate, quantity) {
    let date = new Date(itemDate);
    let dateTime = date.toLocaleString();

    document.getElementById(`${id}-itemName`).value = itemName;
    document.getElementById(`${id}-itemType`).innerHTML = itemType;
    document.getElementById(`${id}-quantity`).innerHTML = quantity;
    document.getElementById(`${id}-itemDate`).innerHTML = dateTime;

    // set header colour
    document.getElementById(`${id}-header`).style.backgroundColor = colour;
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
          <button class="btn btn-lg bg-body-tertiary text-primary h-100" title="Add Item" onclick="addItemOperation();">
            <i class="bi bi-plus-square"></i>
          </button>
        </div>
      </div>`;
  }

  /*====================== DISPLAY FUNCTIONS =====================*/

  // Displays an alert message
  // @id: id of the element
  // @message: message to display
  // @colour: bootstrap colour
  // @timer: time in seconds until automatic removal
  function alertMessage(id, message, colour, timer) {
    // error check
    if (typeof message != 'string' || typeof id != 'string' || id.length == 0)
      return;

    // reset the message display area
    if(message.length === 0) {
      document.getElementById(id).innerHTML = '<br>';
      return;
    }

    // set message
    let icon = colour === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle';
    let content =
      `<div class="alert alert-${colour} alert-dismissible fade show d-flex mx-auto shadow py-2" role="alert">
        <i class="${icon}"></i><span class="fw-bold mx-auto text-center">${message}</span>
        ${timer ? "" : `<button type="button" class="btn-close pt-1" data-bs-dismiss="alert" aria-label="Close"></button>`}
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

  /*====================== LISTENER FUNCTIONS ====================*/

  /**
   * Toggles the theme
   */
  window.toggleTheme = () => {
    const btn = document.getElementById('themeBtn');
    let html = document.documentElement;

    if(html.hasAttribute('data-bs-theme')) {
      html.removeAttribute('data-bs-theme');
      btn.innerHTML = `<i class="bi bi-moon-stars-fill"></i>`;
    }
    else {
      html.setAttribute('data-bs-theme', 'dark');
      btn.innerHTML = `<i class="bi bi-brightness-high-fill"></i>`;
    }
  },

  /**
   * Loads user uploaded database file
   */
  window.loadFile = () => {
    const file = document.getElementById('fileInput').files[0];
    if(file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;
        
        // Try to parse file content
        try {
          let parseInput = JSON.parse(fileContent);

          if(parseInput.items) {
            // reset any error messages and clear current inventory
            alertMessage('fileMessageArea', '');
            document.getElementById('item-list').innerHTML = '';

            // load file content
            api.loadInventory(parseInput);
            dbFetchTitle();
            dbFetchItems();
          }
          else {
            alertMessage('fileMessageArea', 'Error loading file. Inventory data not found.', 'danger');
          }
        }
        catch(e) {
          console.error(e);
          alertMessage('fileMessageArea', 'Error loading file. Could not read data.', 'danger');
        }
      };

      reader.readAsText(file);
    }
    else {
      alertMessage('fileMessageArea', 'An error occurred while loading file. Please try again later.', 'danger');
    }
  }

  /**
   * Save inventory as a text file
   */
  window.saveFile = () => {
    let inventory = api.fetchInventory();

    const file = new Blob([JSON.stringify(inventory)], { type: 'text/plain' });
    const link = document.getElementById('downloadLink');

    link.href = URL.createObjectURL(file);
    link.download = "inventory.txt";
    link.click();

    document.getElementById('saveListBtn').classList.add('d-none');
  }

  /**
   * Update title of inventory list
   * @param {*} el The HTML input element
   */
  window.setTitle = (el) => {
    if(!el.value) {
      el.value = "Inventory";
    }

    api.editTitle(el.value);
  }

  /**
   * Sets the form to "Add Item" mode.
   */
  window.addItemOperation = () => {
    document.getElementById('itemOperation').innerHTML = "Add";

    // clear inputs
    document.getElementById('itemId').value = "";
    document.getElementById('itemName').value = "";
    document.getElementById('itemType').value = "";
    document.getElementById('itemColour').value = "";
    document.getElementById('itemQuantity').value = "0";

    // clear datepicker
    dtp.clear();

    // hide delete button
    document.getElementById('deleteItemBtn').classList.add('d-none');
    document.getElementById('deleteItemBtn').removeAttribute('onclick');

    // show the item form
    itemFormCollapse.show();

    // set focus on name input
    document.getElementById('itemName').focus();
  }

  /**
   * Sets the form to "Update Item" mode.
   * @param {*} id The id of the item
   */
  window.updateItemOperation = (id) => {
    dbFetchItem(id);
  }

  /**
   * The form's Save button listener which determines whether it's an add or update item operation.
   * @param {*} event The form's event
   * @returns Validation error message
   */
  window.addOrUpdateItem = (event) => {
    event.preventDefault();

    let id = parseInt(event.target.itemId.value);
    let itemName = event.target.itemName.value;
    let itemType = event.target.itemType.value;
    let itemColour = event.target.itemColour.value;
    let itemDate = event.target.itemDate.value;
    let itemQuantity = event.target.itemQuantity.value;

    // Validations
    if (!itemName) {
      alertMessage('itemFormMessageArea', 'Please enter item name.', 'danger');
      return;
    }
    else if (!itemType) {
      alertMessage('itemFormMessageArea', 'Please enter item type.', 'danger');
      return;
    }
    else if (!itemColour) {
      alertMessage('itemFormMessageArea', 'Please select a colour.', 'danger');
      return;
    }
    else if (!itemDate) {
      alertMessage('itemFormMessageArea', 'Please select a date.', 'danger');
      return;
    }
    else if(itemQuantity !== "0" && !parseInt(itemQuantity)) {
      alertMessage('itemFormMessageArea', 'Please enter a valid quantity.', 'danger');
      return;
    }

    // parse date
    let date = new Date(itemDate);
    let dateSplit = date.toISOString().split('.');
    let dateTime = dateSplit[0] + 'Z';

    id > 0
      ? dbUpdateItem(id, itemName, itemType, itemColour, dateTime, itemQuantity)
      : dbAddItem(itemName, itemType, itemColour, dateTime, itemQuantity);
  }

  /**
   * Display the item deletion modal.
   * @param {*} event The form's event
   * @param {*} id The id of the item
   * @param {*} name The name of the item
   * @param {*} dateTime The items appointment date/time
   */
  window.showDeleteModal = (event, id, name, dateTime) => {
    event.preventDefault();

    document.getElementById('deleteModal').setAttribute('data-id', id);
    document.getElementById('deleteItemName').innerHTML = name;
    document.getElementById('deleteDateTime').innerHTML = dateTime;

    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteModal'));
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
   * Collapse the item form.
   * @param {*} event The form's event
   */
  window.closeItemForm = (event) => {
    event.preventDefault();
    itemFormCollapse.hide();
  }
})();
