/**
 * Online Food Order Processing System
 * Queue Data Structure Implementation
 * 
 * Includes:
 * 1. Order Model
 * 2. Array-based Circular Queue (Fixed/Configurable Capacity with Overflow/Underflow)
 * 3. Linked-List Node-based Queue (Dynamic Expansion)
 * 4. Queue Audit Logger for Academic & Real-time Visualization
 */

// ==========================================
// 1. ORDER MODEL
// ==========================================
class Order {
  constructor({
    id,
    customerName,
    orderType = 'Dine-In',
    tableOrAddress = 'Table 1',
    items = [],
    notes = '',
    totalAmount = 0,
    totalPrepTime = 15 // in seconds for simulation
  }) {
    this.id = id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    this.customerName = customerName || 'Guest Customer';
    this.orderType = orderType; // 'Dine-In', 'Takeaway', 'Delivery'
    this.tableOrAddress = tableOrAddress;
    this.items = items;
    this.notes = notes;
    this.totalAmount = totalAmount;
    this.totalPrepTime = totalPrepTime; // simulated seconds
    this.remainingPrepTime = totalPrepTime;

    // Status: 'QUEUED' -> 'PREPARING' -> 'READY' -> 'COMPLETED' (or 'CANCELLED')
    this.status = 'QUEUED';
    this.createdAt = new Date();
    this.enqueuedAt = new Date();
    this.prepStartedAt = null;
    this.readyAt = null;
    this.completedAt = null;
    this.assignedChefId = null;

    // Memory simulation metadata (for DS Visualizer)
    this.memoryAddress = `0x${(Math.abs(this.hashCode(this.id)) % 0xFFFF).toString(16).padStart(4, '0').toUpperCase()}`;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  startPreparation(chefId = 'Chef 1') {
    this.status = 'PREPARING';
    this.prepStartedAt = new Date();
    this.assignedChefId = chefId;
  }

  markReady() {
    this.status = 'READY';
    this.readyAt = new Date();
    this.remainingPrepTime = 0;
  }

  markCompleted() {
    this.status = 'COMPLETED';
    this.completedAt = new Date();
  }

  getQueueWaitSeconds() {
    const end = this.prepStartedAt || new Date();
    return Math.max(0, Math.round((end - this.enqueuedAt) / 1000));
  }

  getTotalTurnaroundSeconds() {
    const end = this.completedAt || new Date();
    return Math.max(0, Math.round((end - this.enqueuedAt) / 1000));
  }
}

// ==========================================
// 2. ARRAY-BASED CIRCULAR QUEUE
// ==========================================
class CircularOrderQueue {
  constructor(capacity = 12) {
    this.capacity = capacity;
    this.queue = new Array(capacity).fill(null);
    this.front = -1;
    this.rear = -1;
    this.count = 0;
    this.logHistory = [];
    this.listeners = [];
  }

  // Subscribe to changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify() {
    this.listeners.forEach((cb) => cb(this));
  }

  // Check if queue is empty (Underflow condition)
  isEmpty() {
    return this.count === 0;
  }

  // Check if queue is full (Overflow condition)
  isFull() {
    return this.count === this.capacity;
  }

  // Current number of elements in the queue
  size() {
    return this.count;
  }

  getCapacity() {
    return this.capacity;
  }

  // ENQUEUE Operation: Adds an order to the rear of the queue
  // Time Complexity: O(1)
  // Space Complexity: O(1)
  enqueue(order) {
    if (this.isFull()) {
      const errorMsg = `QUEUE OVERFLOW ERROR: Queue is at maximum capacity (${this.capacity}). Order ${order.id} cannot be enqueued!`;
      this.logOperation('ENQUEUE_FAILED', order, errorMsg, 'OVERFLOW');
      return { success: false, error: 'OVERFLOW', message: errorMsg };
    }

    if (this.isEmpty()) {
      this.front = 0;
      this.rear = 0;
    } else {
      // Circular increment: (rear + 1) % capacity
      this.rear = (this.rear + 1) % this.capacity;
    }

    this.queue[this.rear] = order;
    this.count++;
    order.status = 'QUEUED';
    order.enqueuedAt = new Date();

    const logMsg = `ENQUEUE SUCCESS: Order [${order.id}] added at rear index [${this.rear}]. Queue size: ${this.count}/${this.capacity}`;
    this.logOperation('ENQUEUE', order, logMsg);
    this.notify();

    return { success: true, order, position: this.count, rearIndex: this.rear };
  }

  // DEQUEUE Operation: Removes and returns the order at the front of the queue
  // Time Complexity: O(1)
  // Space Complexity: O(1)
  dequeue() {
    if (this.isEmpty()) {
      const errorMsg = `QUEUE UNDERFLOW ERROR: Cannot dequeue from an empty queue!`;
      this.logOperation('DEQUEUE_FAILED', null, errorMsg, 'UNDERFLOW');
      return { success: false, error: 'UNDERFLOW', message: errorMsg };
    }

    const dequeuedOrder = this.queue[this.front];
    this.queue[this.front] = null; // Clear reference for visualization
    const oldFront = this.front;

    if (this.front === this.rear) {
      // Last remaining element was dequeued; reset queue pointers
      this.front = -1;
      this.rear = -1;
    } else {
      // Circular increment: (front + 1) % capacity
      this.front = (this.front + 1) % this.capacity;
    }

    this.count--;

    const logMsg = `DEQUEUE SUCCESS: Order [${dequeuedOrder.id}] removed from front index [${oldFront}]. New front: [${this.front}]. Remaining: ${this.count}`;
    this.logOperation('DEQUEUE', dequeuedOrder, logMsg);
    this.notify();

    return { success: true, order: dequeuedOrder, frontIndex: oldFront };
  }

  // PEEK / FRONT Operation: Returns the element at the front without removing it
  // Time Complexity: O(1)
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.queue[this.front];
  }

  // Search for an order by ID in the queue
  // Time Complexity: O(N)
  findOrder(orderId) {
    if (this.isEmpty()) return null;

    let curr = this.front;
    let pos = 1;
    for (let i = 0; i < this.count; i++) {
      const order = this.queue[curr];
      if (order && order.id.toLowerCase() === orderId.toLowerCase()) {
        return { order, positionInQueue: pos, index: curr };
      }
      curr = (curr + 1) % this.capacity;
      pos++;
    }
    return null;
  }

  // Return orders in logical FIFO sequence (from front to rear)
  toSequenceArray() {
    if (this.isEmpty()) return [];
    const seq = [];
    let curr = this.front;
    for (let i = 0; i < this.count; i++) {
      if (this.queue[curr]) {
        seq.push({
          order: this.queue[curr],
          index: curr,
          position: i + 1,
          isFront: curr === this.front,
          isRear: curr === this.rear
        });
      }
      curr = (curr + 1) % this.capacity;
    }
    return seq;
  }

  // Return raw array buffer (showing nulls, occupied slots, front & rear)
  getRawBuffer() {
    return this.queue.map((item, idx) => ({
      index: idx,
      order: item,
      isFront: idx === this.front,
      isRear: idx === this.rear,
      isOccupied: item !== null
    }));
  }

  // Reset / Clear Queue
  clear() {
    this.queue = new Array(this.capacity).fill(null);
    this.front = -1;
    this.rear = -1;
    this.count = 0;
    this.logOperation('CLEAR', null, 'Queue was reset to empty state.');
    this.notify();
  }

  // Internal Audit Log Recorder
  logOperation(operation, order, message, status = 'SUCCESS') {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      operation, // 'ENQUEUE', 'DEQUEUE', 'PEEK', 'OVERFLOW', 'UNDERFLOW'
      orderId: order ? order.id : 'N/A',
      customerName: order ? order.customerName : 'N/A',
      message,
      status,
      front: this.front,
      rear: this.rear,
      size: this.count,
      capacity: this.capacity,
      complexity: 'O(1)'
    };
    this.logHistory.unshift(logEntry);
    if (this.logHistory.length > 50) this.logHistory.pop();
  }
}

// ==========================================
// 3. LINKED-LIST NODE-BASED QUEUE
// (Alternative implementation for DS comparative evaluation)
// ==========================================
class QueueNode {
  constructor(order) {
    this.data = order;
    this.next = null;
    this.nodeId = `NODE-${Math.floor(100 + Math.random() * 900)}`;
  }
}

class LinkedOrderQueue {
  constructor() {
    this.head = null; // Front
    this.tail = null; // Rear
    this.length = 0;
  }

  isEmpty() {
    return this.length === 0;
  }

  size() {
    return this.length;
  }

  // O(1) Time Complexity
  enqueue(order) {
    const newNode = new QueueNode(order);
    if (this.isEmpty()) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.length++;
    return newNode;
  }

  // O(1) Time Complexity
  dequeue() {
    if (this.isEmpty()) return null;
    const removedNode = this.head;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    }
    this.length--;
    return removedNode.data;
  }

  peek() {
    return this.head ? this.head.data : null;
  }

  toNodeList() {
    const nodes = [];
    let curr = this.head;
    let pos = 1;
    while (curr) {
      nodes.push({
        nodeId: curr.nodeId,
        order: curr.data,
        position: pos++,
        hasNext: curr.next !== null
      });
      curr = curr.next;
    }
    return nodes;
  }
}

// Export for browser and Node.js environments
if (typeof window !== 'undefined') {
  window.Order = Order;
  window.CircularOrderQueue = CircularOrderQueue;
  window.LinkedOrderQueue = LinkedOrderQueue;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Order, CircularOrderQueue, LinkedOrderQueue, QueueNode };
}
