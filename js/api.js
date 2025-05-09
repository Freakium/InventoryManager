const api = (function () {

  // initiate inventory
  let inventory = {
    title: 'Inventory',
    items: []
  };

  return {

    /**
     * Loads existing inventory
     */
    loadInventory(inv) {
      inventory = inv;
    },

    /**
     * Get entire contents of inventory (title, items)
     * @returns Entire contents of inventory
     */
    fetchInventory() {
      return inventory;
    },
    
    /**
     * Fetches a list of all items.
     * @returns array of items as JSON objects
     */
    fetchItems: () => {
      return [...inventory.items];
    },

    /**
     * Fetches a specific item.
     * @param {*} id The id number of the item
     * @returns item
     */
    fetchItem: (id) => {
      return {...inventory.items.find(el => el.id == id)};
    },

    /**
     * Fetches the title of the inventory list.
     */
    fetchTitle: () => {
      return inventory.title;
    },
    
    /**
     * Edits the title of the inventory list.
     * @param {*} name The new title name
     */
    editTitle: (name) => {
      inventory.title = name;
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
      const index = inventory.items.findIndex(el => el.id === id);
      if(index !== -1) {
        return false;
      }

      inventory.items.push({
        id,
        name,
        type,
        colour,
        quantity,
        date,
        price
      });

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
      const index = inventory.items.findIndex(el => el.id === id);
      if(index === -1) {
        return false;
      }

      inventory.items[index] = {
        id,
        name,
        type,
        colour,
        quantity,
        date,
        price
      };

      return true;
    },

    /**
     * Update entire inventory of items.
     * @param {*} items The item list
     */
    updateItems: (items) => {
      inventory.items = items;
    },

    /**
     * Delete an item from the item list.
     * @param {*} id The id number of the item
     * @returns boolean response
     */
    deleteItem: (id) => {
      const index = inventory.items.findIndex(el => el.id == id);
      if (index !== -1) {
        inventory.items.splice(index, 1);
        return true;
      }
      else {
        return false;
      }
    },

    /**
     * Search item names and returns the first match.
     * @param {*} searchTerm The string to compare item names to
     * @returns The first match if found
     */
    searchItems: (searchTerm) => {
      let result = inventory.items.find(item => item.name.toLowerCase() === searchTerm.toLowerCase());
      return result;
    },

    /**
     * Sort inventory by name followed by type.
     * @returns The sorted inventory
     */
    sortItemsByAlpha: () => {
      inventory.items.sort((a,b) => a.name.localeCompare(b.name) || a.type.localeCompare(b.type));
      return [...inventory.items];
    },

    /**
     * Sort inventory by type followed by name.
     * @returns The sorted inventory
     */
    sortItemsByType: () => {
      inventory.items.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      return [...inventory.items];
    },

    /**
     * Sort inventory by date first followed by type then by name.
     * @returns The sorted inventory
     */
    sortItemsByDate: () => {
      inventory.items.sort((a,b) => new Date(a.date) - new Date(b.date) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      return [...inventory.items];
    }
  }
})();