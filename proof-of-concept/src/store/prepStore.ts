import { create } from 'zustand';
import { PrepStore, PrepTask, PrepChecklist, ShopOrder, ShopOrderItem } from '../types';

export const usePrepStore = create<PrepStore>((set) => ({
  tasks: [],
  checklists: [],
  shopOrders: [],

  // Task management
  addTask: (task) =>
    set((state) => {
      const now = new Date().toISOString();
      const newTask: PrepTask = {
        id: `task-${Date.now()}`,
        projectId: task.projectId || '',
        title: task.title || 'Untitled Task',
        category: task.category || 'other',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        createdDate: now,
        lastModifiedDate: now,
        ...task,
      };
      return { tasks: [...state.tasks, newTask] };
    }),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, ...updates, lastModifiedDate: new Date().toISOString() }
          : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  // Checklist management
  addChecklist: (checklist) =>
    set((state) => {
      const now = new Date().toISOString();
      const newChecklist: PrepChecklist = {
        id: `checklist-${Date.now()}`,
        projectId: checklist.projectId || '',
        name: checklist.name || 'Untitled Checklist',
        items: checklist.items || [],
        createdDate: now,
        lastModifiedDate: now,
        ...checklist,
      };
      return { checklists: [...state.checklists, newChecklist] };
    }),

  updateChecklist: (id, updates) =>
    set((state) => ({
      checklists: state.checklists.map((c) =>
        c.id === id
          ? { ...c, ...updates, lastModifiedDate: new Date().toISOString() }
          : c
      ),
    })),

  deleteChecklist: (id) =>
    set((state) => ({
      checklists: state.checklists.filter((c) => c.id !== id),
    })),

  toggleChecklistItem: (checklistId, itemId) =>
    set((state) => ({
      checklists: state.checklists.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: c.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: !item.completed,
                      completedDate: !item.completed ? new Date().toISOString() : undefined,
                    }
                  : item
              ),
              lastModifiedDate: new Date().toISOString(),
            }
          : c
      ),
    })),

  // Shop order management
  addShopOrder: (order) =>
    set((state) => {
      const now = new Date().toISOString();
      const newOrder: ShopOrder = {
        id: `order-${Date.now()}`,
        projectId: order.projectId || '',
        orderDate: order.orderDate || now,
        status: order.status || 'draft',
        items: order.items || [],
        createdDate: now,
        lastModifiedDate: now,
        ...order,
      };
      return { shopOrders: [...state.shopOrders, newOrder] };
    }),

  updateShopOrder: (id, updates) =>
    set((state) => ({
      shopOrders: state.shopOrders.map((o) =>
        o.id === id
          ? { ...o, ...updates, lastModifiedDate: new Date().toISOString() }
          : o
      ),
    })),

  deleteShopOrder: (id) =>
    set((state) => ({
      shopOrders: state.shopOrders.filter((o) => o.id !== id),
    })),

  addOrderItem: (orderId, item) =>
    set((state) => ({
      shopOrders: state.shopOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: [
                ...o.items,
                {
                  id: `item-${Date.now()}`,
                  description: item.description || '',
                  quantity: item.quantity || 1,
                  received: false,
                  ...item,
                } as ShopOrderItem,
              ],
              lastModifiedDate: new Date().toISOString(),
            }
          : o
      ),
    })),

  updateOrderItem: (orderId, itemId, updates) =>
    set((state) => ({
      shopOrders: state.shopOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
              lastModifiedDate: new Date().toISOString(),
            }
          : o
      ),
    })),

  deleteOrderItem: (orderId, itemId) =>
    set((state) => ({
      shopOrders: state.shopOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.filter((item) => item.id !== itemId),
              lastModifiedDate: new Date().toISOString(),
            }
          : o
      ),
    })),
}));
