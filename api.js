const api = (function () {

  /**
   * Get inventory items from localStorage and parse it into JSON.
   */
  function getItemsFromLocalStorage() {
    const items = localStorage.getItem('items');
    const parseItems = JSON.parse(items);
    return parseItems ?? [];
  }

  /**
   * Stringify JSON items and save to localStorage.
   * @param {*} items List of inventory items
   */
  function saveItemsToLocalStorage(items) {
    const stringItems = JSON.stringify(items);
    localStorage.setItem('items', stringItems);
  }

  return {

    /**
     * Loads existing inventory.
     */
    loadInventory(inv) {
      localStorage.setItem('title', inv.title);
      localStorage.setItem('currency', inv.currency);
      saveItemsToLocalStorage(inv.items);
    },

    /**
     * Get entire contents of inventory (title, items).
     * @returns Entire contents of inventory
     */
    fetchInventory() {
      const title = localStorage.getItem('title');
      const currency = localStorage.getItem('currency');
      const items = getItemsFromLocalStorage();

      const inventory = {
        title,
        currency,
        items
      };

      return inventory;
    },

    /**
     * Fetches a list of all items.
     * @returns array of items as JSON objects
     */
    fetchItems: () => {
      return getItemsFromLocalStorage();
    },

    /**
     * Fetches a specific item.
     * @param {*} id The id number of the item
     * @returns item
     */
    fetchItem: (id) => {
      const items = getItemsFromLocalStorage();
      return items.find(el => el.id == id);
    },

    /**
     * Fetches the title of the inventory list.
     */
    fetchTitle: () => {
      return localStorage.getItem('title');
    },

    /**
     * Edits the title of the inventory list.
     * @param {*} name The new title name
     */
    editTitle: (name) => {
      localStorage.setItem('title', name);
    },

    /**
     * Fetches the currency symbol.
     */
    fetchCurrency: () => {
      return localStorage.getItem('currency');
    },

    /**
     * Edits the currency symbol.
     * @param {*} symbol The currency symbol
     */
    editCurrency: (symbol) => {
      localStorage.setItem('currency', symbol);
    },

    /**
     * Add a item to the item list.
     * @param {*} id The id number of the new item
     * @param {*} name Name of the item
     * @param {*} type The type of item
     * @param {*} colour Colour of the item
     * @param {*} quantity The quantity of the item
     * @param {*} date The item's scheduled date in ISO format
     * @param {*} price The optional price of the item
     * @returns operation status
     */
    addItem: (id, name, type, colour, quantity, date, price) => {
      let items = getItemsFromLocalStorage();
      const index = items.findIndex(el => el.id === id);
      if (index !== -1) {
        return false;
      }

      // add new item to array
      items.push({
        id,
        name,
        type,
        colour,
        quantity,
        date,
        price
      });

      // update localStorage
      saveItemsToLocalStorage(items);

      return true;
    },

    /**
     * Update a item in the item list.
     * @param {*} id The id number of the new item
     * @param {*} name Name of the item
     * @param {*} type The type of item
     * @param {*} colour Colour of the item
     * @param {*} quantity The quantity of the item
     * @param {*} date The item's scheduled date in ISO format
     * @param {*} price The optional price of the item
     * @returns operation status
     */
    updateItem: (id, name, type, colour, quantity, date, price) => {
      let items = getItemsFromLocalStorage();
      const index = items.findIndex(el => el.id === id);
      if (index === -1) {
        return false;
      }

      // update item in array
      items[index] = {
        id,
        name,
        type,
        colour,
        quantity,
        date,
        price
      };

      // update localStorage
      saveItemsToLocalStorage(items);

      return true;
    },

    /**
     * Update entire inventory of items.
     * @param {*} items The item list
     */
    updateItems: (items) => {
      saveItemsToLocalStorage(items);
    },

    /**
     * Delete an item from the item list.
     * @param {*} id The id number of the item
     * @returns boolean response
     */
    deleteItem: (id) => {
      let items = getItemsFromLocalStorage();
      const index = items.findIndex(el => el.id == id);
      if (index === -1) {
        return false;
      }
      else {
        items.splice(index, 1);

        // update localStorage
        saveItemsToLocalStorage(items);

        return true;
      }
    },

    /**
     * Search item names and returns the first match.
     * @param {*} searchTerm The string to compare item names to
     * @returns The first match if found
     */
    searchItems: (searchTerm) => {
      let items = getItemsFromLocalStorage();
      let result = items.find(item => item.name.toLowerCase() === searchTerm.toLowerCase());
      return result;
    },

    /**
     * Sort inventory by name followed by type.
     * @param {*} isDescending Whether or not to sort descending
     * @returns The sorted inventory
     */
    sortItemsByName: (isDescending = false) => {
      let items = getItemsFromLocalStorage();
      items.sort((a, b) => isDescending ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name) || a.type.localeCompare(b.type));
      return items;
    },

    /**
     * Sort inventory by type followed by name.
     * @param {*} isDescending Whether or not to sort descending
     * @returns The sorted inventory
     */
    sortItemsByType: (isDescending = false) => {
      let items = getItemsFromLocalStorage();
      items.sort((a, b) => isDescending ? b.type.localeCompare(a.type) : a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      return items;
    },

    /**
     * Sort inventory by date first followed by type then by name.
     * @param {*} isDescending Whether or not to sort descending
     * @returns The sorted inventory
     */
    sortItemsByDate: (isDescending = false) => {
      let items = getItemsFromLocalStorage();
      items.sort((a, b) => isDescending ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date) ||
        a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      return items;
    },

    /**
     * Sort inventory by quantity first followed by type then by name.
     * @param {*} isDescending Whether or not to sort descending
     * @returns The sorted inventory
     */
    sortItemsByQuantity: (isDescending = false) => {
      let items = getItemsFromLocalStorage();
      items.sort((a, b) => isDescending ? b.quantity - a.quantity : a.quantity - b.quantity || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      return items;
    }
  }
})();