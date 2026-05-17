import { Logger } from "../helpers/logger";
import InventoryItemEntity from "../database/inventoryItem";
import EquipmentItemEntity from "../database/equipmentItem";
import ItemEntity from "../database/item";

export interface InventorySlot {
  slotId: number;
  item: InventoryItemEntity | null;
  isEmpty: boolean;
}

export interface EquipmentSlot {
  slotId: number;
  item: EquipmentItemEntity | null;
  isEmpty: boolean;
  slotType: string;
}

export class InventorySystem {
  private logger: Logger;
  private inventories: Map<number, Map<number, InventoryItemEntity>> =
    new Map(); // characterId -> slotId -> item

  private equipment: Map<number, Map<number, EquipmentItemEntity>> = new Map(); // characterId -> slotId -> item
  private maxInventorySlots: number = 63;
  private maxWeight: number = 1000;

  constructor () {
    this.logger = new Logger("InventorySystem");
  }

  addItem (
    characterId: number,
    item: ItemEntity,
    quantity: number = 1
  ): boolean {
    const inventory = this.getInventory(characterId);

    // Try to stack with existing item
    for (const [slotId, inventoryItem] of inventory.entries()) {
      if (inventoryItem && inventoryItem.item?.itemId === item.itemId) {
        // Check if item can be stacked
        if (this.canStack(item)) {
          const maxStack = this.getMaxStack(item);
          const canAdd = Math.min(maxStack - inventoryItem.quantity, quantity);

          if (canAdd > 0) {
            inventoryItem.quantity += canAdd;
            quantity -= canAdd;

            if (quantity === 0) {
              this.logger.info(
                `Added ${canAdd} items to existing stack in slot ${slotId}`
              );
              return true;
            }
          }
        }
      }
    }

    // Find empty slot
    if (quantity > 0) {
      const emptySlot = this.findEmptySlot(characterId);
      if (emptySlot !== null) {
        const inventoryItem = new InventoryItemEntity();
        inventoryItem.slot = emptySlot;
        inventoryItem.item = item;
        inventoryItem.quantity = quantity;

        inventory.set(emptySlot, inventoryItem);
        this.logger.info(`Added ${quantity} items to new slot ${emptySlot}`);
        return true;
      }
    }

    this.logger.warn("Failed to add items - no inventory space");
    return false;
  }

  removeItem (
    characterId: number,
    slotId: number,
    quantity: number = 1
  ): boolean {
    const inventory = this.getInventory(characterId);
    const inventoryItem = inventory.get(slotId);

    if (!inventoryItem) {
      this.logger.warn(`No item in slot ${slotId}`);
      return false;
    }

    if (inventoryItem.quantity < quantity) {
      this.logger.warn(`Not enough items in slot ${slotId}`);
      return false;
    }

    inventoryItem.quantity -= quantity;

    if (inventoryItem.quantity === 0) {
      inventory.delete(slotId);
      this.logger.info(`Removed all items from slot ${slotId}`);
    } else {
      this.logger.info(`Removed ${quantity} items from slot ${slotId}`);
    }

    return true;
  }

  moveItem (characterId: number, fromSlot: number, toSlot: number): boolean {
    const inventory = this.getInventory(characterId);

    const fromItem = inventory.get(fromSlot);
    const toItem = inventory.get(toSlot);

    if (!fromItem) {
      this.logger.warn(`No item in source slot ${fromSlot}`);
      return false;
    }

    if (toItem) {
      // Try to stack
      if (
        fromItem.item?.itemId === toItem.item?.itemId &&
        this.canStackById(fromItem.item.itemId)
      ) {
        const maxStack = this.getMaxStackById(fromItem.item.itemId);
        const canStack = Math.min(
          maxStack - toItem.quantity,
          fromItem.quantity
        );

        if (canStack > 0) {
          toItem.quantity += canStack;
          fromItem.quantity -= canStack;

          if (fromItem.quantity === 0) {
            inventory.delete(fromSlot);
          }

          this.logger.info(
            `Stacked ${canStack} items from slot ${fromSlot} to ${toSlot}`
          );
          return true;
        }
      }

      // Swap items
      inventory.set(fromSlot, toItem);
      inventory.set(toSlot, fromItem);
      this.logger.info(`Swapped items between slots ${fromSlot} and ${toSlot}`);
      return true;
    } else {
      // Move to empty slot
      inventory.set(toSlot, fromItem);
      inventory.delete(fromSlot);
      this.logger.info(`Moved item from slot ${fromSlot} to ${toSlot}`);
      return true;
    }
  }

  equipItem (
    characterId: number,
    inventorySlot: number,
    equipSlot: number
  ): boolean {
    const inventory = this.getInventory(characterId);
    const inventoryItem = inventory.get(inventorySlot);

    if (!inventoryItem) {
      this.logger.warn(`No item in inventory slot ${inventorySlot}`);
      return false;
    }

    const charEquipment = this.getEquipment(characterId);
    const existingEquipment = charEquipment.get(equipSlot);

    // Unequip existing item
    if (existingEquipment) {
      this.unequipItem(characterId, equipSlot);
    }

    // Create equipment item
    const equipmentItem = new EquipmentItemEntity();
    equipmentItem.slot = equipSlot;
    equipmentItem.item = inventoryItem.item;
    equipmentItem.quantity = 1;

    charEquipment.set(equipSlot, equipmentItem);

    // Remove from inventory
    inventory.delete(inventorySlot);

    this.logger.info(
      `Equipped item from inventory slot ${inventorySlot} to equipment slot ${equipSlot}`
    );
    return true;
  }

  unequipItem (characterId: number, equipSlot: number): boolean {
    const charEquipment = this.getEquipment(characterId);
    const equipmentItem = charEquipment.get(equipSlot);

    if (!equipmentItem) {
      this.logger.warn(`No item in equipment slot ${equipSlot}`);
      return false;
    }

    // Find empty inventory slot
    const emptySlot = this.findEmptySlot(characterId);
    if (emptySlot === null) {
      this.logger.warn("No empty inventory slot to unequip item");
      return false;
    }

    // Create inventory item
    const inventory = this.getInventory(characterId);
    const inventoryItem = new InventoryItemEntity();
    inventoryItem.slot = emptySlot;
    inventoryItem.item = equipmentItem.item;
    inventoryItem.quantity = equipmentItem.quantity;

    inventory.set(emptySlot, inventoryItem);
    charEquipment.delete(equipSlot);

    this.logger.info(
      `Unequipped item from ${equipSlot} to inventory slot ${emptySlot}`
    );
    return true;
  }

  getInventory (characterId: number): Map<number, InventoryItemEntity> {
    if (!this.inventories.has(characterId)) {
      this.inventories.set(characterId, new Map());
    }
    return this.inventories.get(characterId)!;
  }

  getEquipment (characterId: number): Map<number, EquipmentItemEntity> {
    if (!this.equipment.has(characterId)) {
      this.equipment.set(characterId, new Map());
    }
    return this.equipment.get(characterId)!;
  }

  getInventorySlot (
    characterId: number,
    slotId: number
  ): InventoryItemEntity | null {
    const inventory = this.getInventory(characterId);
    return inventory.get(slotId) || null;
  }

  getEquipmentSlot (
    characterId: number,
    equipSlot: number
  ): EquipmentItemEntity | null {
    const equipment = this.getEquipment(characterId);
    return equipment.get(equipSlot) || null;
  }

  getAllInventorySlots (characterId: number): InventorySlot[] {
    const inventory = this.getInventory(characterId);
    const slots: InventorySlot[] = [];

    for (let i = 0; i < this.maxInventorySlots; i++) {
      const item = inventory.get(i);
      slots.push({
        slotId: i,
        item: item || null,
        isEmpty: !item
      });
    }

    return slots;
  }

  getAllEquipmentSlots (characterId: number): EquipmentSlot[] {
    const equipment = this.getEquipment(characterId);
    const slots: EquipmentSlot[] = [];

    for (const [slotId, item] of equipment.entries()) {
      slots.push({
        slotId,
        item: item || null,
        isEmpty: !item,
        slotType: this.getSlotTypeName(slotId)
      });
    }

    return slots;
  }

  private getSlotTypeName (slotId: number): string {
    const slotTypes = [
      "right_hand",
      "left_hand",
      "head",
      "body",
      "hands",
      "feet",
      "back"
    ];
    return slotTypes[slotId] || `slot_${slotId}`;
  }

  findEmptySlot (characterId: number): number | null {
    const inventory = this.getInventory(characterId);

    for (let i = 0; i < this.maxInventorySlots; i++) {
      if (!inventory.has(i)) {
        return i;
      }
    }

    return null;
  }

  getEmptySlotCount (characterId: number): number {
    let count = 0;
    const inventory = this.getInventory(characterId);

    for (let i = 0; i < this.maxInventorySlots; i++) {
      if (!inventory.has(i)) {
        count++;
      }
    }

    return count;
  }

  getItemCount (characterId: number, itemId: number): number {
    const inventory = this.getInventory(characterId);
    let count = 0;

    for (const item of inventory.values()) {
      if (item.item?.itemId === itemId) {
        count += item.quantity;
      }
    }

    return count;
  }

  hasItem (characterId: number, itemId: number, quantity: number = 1): boolean {
    return this.getItemCount(characterId, itemId) >= quantity;
  }

  private canStack (item: ItemEntity): boolean {
    // Most items can be stacked, except equipment
    return !this.isEquipment(item);
  }

  private canStackById (_itemId: number): boolean {
    // Simplified check - would need item database lookup
    return true;
  }

  private isEquipment (_item: ItemEntity): boolean {
    // Simplified check - would need item database lookup
    return false;
  }

  private getMaxStack (item: ItemEntity): number {
    // Stack size depends on item type
    if (this.isEquipment(item)) {
      return 1;
    }

    // Consumables and materials can stack higher
    return 99;
  }

  private getMaxStackById (_itemId: number): number {
    // Simplified - would need item database lookup
    return 99;
  }

  removeCharacter (characterId: number): void {
    this.inventories.delete(characterId);
    this.equipment.delete(characterId);
    this.logger.info(`Removed inventory for character ${characterId}`);
  }

  getMaxInventorySlots (): number {
    return this.maxInventorySlots;
  }

  setMaxInventorySlots (slots: number): void {
    this.maxInventorySlots = slots;
    this.logger.info(`Max inventory slots set to ${slots}`);
  }

  getMaxWeight (): number {
    return this.maxWeight;
  }

  setMaxWeight (weight: number): void {
    this.maxWeight = weight;
    this.logger.info(`Max weight set to ${weight}`);
  }

  getStats (): {
    totalCharacters: number;
    totalItems: number;
    totalEquipment: number;
    averageItemsPerCharacter: number;
  } {
    let totalItems = 0;
    let totalEquipment = 0;

    for (const inventory of this.inventories.values()) {
      totalItems += inventory.size;
    }

    for (const equipment of this.equipment.values()) {
      totalEquipment += equipment.size;
    }

    const totalCharacters = this.inventories.size;
    const averageItems = totalCharacters > 0 ? totalItems / totalCharacters : 0;

    return {
      totalCharacters,
      totalItems,
      totalEquipment,
      averageItemsPerCharacter: averageItems
    };
  }

  clear (): void {
    this.inventories.clear();
    this.equipment.clear();
    this.logger.info("Inventory system cleared");
  }
}
