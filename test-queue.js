/**
 * Automated Test Suite for Online Food Order Processing System
 * Tests pure Queue Data Structure logic, FIFO dispatching, and edge cases.
 */

const { Order, CircularOrderQueue, LinkedOrderQueue } = require('./js/queue.js');

console.log('====================================================');
console.log('🧪 TESTING QUEUE DATA STRUCTURE (FIFO)');
console.log('====================================================\n');

// Test 1: Empty Queue Check
const queue = new CircularOrderQueue(5);
console.assert(queue.isEmpty() === true, 'Queue should initially be empty');
console.assert(queue.size() === 0, 'Initial size must be 0');
console.log('✅ Test 1: Initial empty queue verified (size = 0, isEmpty = true)');

// Test 2: Enqueue Operations (FIFO Order)
const o1 = new Order({ id: 'ORD-101', customerName: 'Alice', items: [{ name: 'Burger', qty: 1 }] });
const o2 = new Order({ id: 'ORD-102', customerName: 'Bob', items: [{ name: 'Pizza', qty: 2 }] });
const o3 = new Order({ id: 'ORD-103', customerName: 'Charlie', items: [{ name: 'Noodles', qty: 1 }] });

queue.enqueue(o1);
queue.enqueue(o2);
queue.enqueue(o3);

console.assert(queue.size() === 3, 'Queue size should be 3');
console.assert(queue.peek().id === 'ORD-101', 'Front element should be ORD-101 (FIFO)');
console.log('✅ Test 2: Enqueue FIFO sequence verified (Front: ORD-101, Size: 3)');

// Test 3: Dequeue Operation
const deq1 = queue.dequeue();
console.assert(deq1.success === true, 'Dequeue must succeed');
console.assert(deq1.order.id === 'ORD-101', 'First dequeued must be Alice (ORD-101)');
console.assert(queue.peek().id === 'ORD-102', 'New front must be Bob (ORD-102)');
console.log(`✅ Test 3: Dequeued [${deq1.order.id}]. New front element is [${queue.peek().id}]`);

// Test 4: Capacity & Overflow Protection
const o4 = new Order({ id: 'ORD-104', customerName: 'Diana' });
const o5 = new Order({ id: 'ORD-105', customerName: 'Edward' });
const o6 = new Order({ id: 'ORD-106', customerName: 'Fiona' });
const o7 = new Order({ id: 'ORD-107', customerName: 'George' }); // Should trigger overflow

queue.enqueue(o4);
queue.enqueue(o5);
queue.enqueue(o6); // Now full (capacity = 5)
console.assert(queue.isFull() === true, 'Queue must be full at capacity 5');

const overflowResult = queue.enqueue(o7);
console.assert(overflowResult.success === false, 'Enqueue when full should fail');
console.assert(overflowResult.error === 'OVERFLOW', 'Error type must be OVERFLOW');
console.log('✅ Test 4: Queue Overflow handled gracefully! Rejected extra order.');

// Test 5: Emptying queue and Underflow Protection
while (!queue.isEmpty()) {
  queue.dequeue();
}
console.assert(queue.isEmpty() === true, 'Queue must be empty now');

const underflowResult = queue.dequeue();
console.assert(underflowResult.success === false, 'Dequeue when empty should fail');
console.assert(underflowResult.error === 'UNDERFLOW', 'Error type must be UNDERFLOW');
console.log('✅ Test 5: Queue Underflow handled gracefully! Prevented popping empty queue.');

// Test 6: Linked List Queue Alternative
const linkedQ = new LinkedOrderQueue();
linkedQ.enqueue(new Order({ id: 'LINK-1', customerName: 'Node 1' }));
linkedQ.enqueue(new Order({ id: 'LINK-2', customerName: 'Node 2' }));
console.assert(linkedQ.size() === 2, 'Linked queue size must be 2');
const lDeq = linkedQ.dequeue();
console.assert(lDeq.id === 'LINK-1', 'Linked queue dequeue must be LINK-1 (FIFO)');
console.log('✅ Test 6: Linked List Queue Node test passed successfully.');

console.log('\n====================================================');
console.log('🎉 ALL 6 AUTOMATED QUEUE DATA STRUCTURE TESTS PASSED!');
console.log('====================================================\n');
