/**
 * Online Food Order Processing System
 * Kitchen Dispatcher & Cooking Workstations (Queue Engine)
 */

class KitchenManager {
  constructor(orderQueue, workstationCount = 2) {
    this.orderQueue = orderQueue;
    this.workstationCount = workstationCount;
    this.workstations = [];
    this.readyOrders = [];
    this.completedOrders = [];
    this.autoProcess = true; // Auto dequeue when chef is free
    this.simSpeed = 1.0; // 1x, 2x, 5x speed multiplier
    this.listeners = [];
    this.timerInterval = null;

    this.initWorkstations();
    this.startEngine();
  }

  initWorkstations() {
    const chefNames = ['Chef Marco (Grill Station)', 'Chef Elena (Wok & Oven)', 'Chef Antonio (Assembly)'];
    this.workstations = [];
    for (let i = 0; i < this.workstationCount; i++) {
      this.workstations.push({
        id: i + 1,
        name: chefNames[i] || `Chef Station ${i + 1}`,
        currentOrder: null,
        progressPercent: 0,
        elapsedSeconds: 0,
        targetSeconds: 0,
        status: 'IDLE' // 'IDLE', 'COOKING'
      });
    }
  }

  setWorkstationCount(count) {
    this.workstationCount = Math.max(1, Math.min(3, count));
    // Re-initialize while keeping active orders if possible
    const oldActive = this.workstations.filter((w) => w.currentOrder).map((w) => w.currentOrder);
    this.initWorkstations();
    oldActive.forEach((order, idx) => {
      if (this.workstations[idx]) {
        this.assignOrderToStation(this.workstations[idx], order);
      } else {
        // If reduced count, mark ready or return
        order.markReady();
        this.readyOrders.unshift(order);
      }
    });
    this.notify();
  }

  setSimulationSpeed(multiplier) {
    this.simSpeed = Math.max(0.5, Math.min(10, multiplier));
    this.notify();
  }

  toggleAutoProcess() {
    this.autoProcess = !this.autoProcess;
    if (this.autoProcess) {
      this.checkAndAssignWork();
    }
    this.notify();
    return this.autoProcess;
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify() {
    this.listeners.forEach((cb) => cb(this));
  }

  // Periodic kitchen clock
  startEngine() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const tickRateMs = 250; // 4 updates per second for smooth progress bars

    this.timerInterval = setInterval(() => {
      this.tick(tickRateMs / 1000);
    }, tickRateMs);
  }

  tick(deltaSeconds) {
    const effectiveDelta = deltaSeconds * this.simSpeed;
    let stateChanged = false;

    // 1. Advance all active cooking stations
    this.workstations.forEach((station) => {
      if (station.status === 'COOKING' && station.currentOrder) {
        station.elapsedSeconds += effectiveDelta;
        station.currentOrder.remainingPrepTime = Math.max(
          0,
          station.targetSeconds - station.elapsedSeconds
        );

        station.progressPercent = Math.min(
          100,
          Math.round((station.elapsedSeconds / station.targetSeconds) * 100)
        );

        if (station.elapsedSeconds >= station.targetSeconds) {
          // Food is cooked! Order is Ready!
          this.finishCooking(station);
          stateChanged = true;
        } else {
          stateChanged = true;
        }
      }
    });

    // 2. If auto-processing is ON, check if idle stations can take next orders in queue
    if (this.autoProcess && !this.orderQueue.isEmpty()) {
      const idleStation = this.workstations.find((w) => w.status === 'IDLE');
      if (idleStation) {
        this.cookNextInQueue(idleStation);
        stateChanged = true;
      }
    }

    if (stateChanged) {
      this.notify();
    }
  }

  // Dequeue and send to cooking station
  cookNextInQueue(specificStation = null) {
    if (this.orderQueue.isEmpty()) {
      return { success: false, reason: 'QUEUE_EMPTY' };
    }

    const station = specificStation || this.workstations.find((w) => w.status === 'IDLE');
    if (!station) {
      return { success: false, reason: 'ALL_CHEFS_BUSY' };
    }

    // QUEUE DEQUEUE
    const dequeueResult = this.orderQueue.dequeue();
    if (!dequeueResult.success) {
      return { success: false, reason: dequeueResult.error };
    }

    const order = dequeueResult.order;
    this.assignOrderToStation(station, order);

    if (window.soundEffects) {
      window.soundEffects.playDequeue();
    }

    this.notify();
    return { success: true, order, station };
  }

  assignOrderToStation(station, order) {
    order.startPreparation(station.name);
    station.currentOrder = order;
    station.status = 'COOKING';
    station.targetSeconds = order.totalPrepTime || 15;
    station.elapsedSeconds = 0;
    station.progressPercent = 0;
  }

  // Order finishes cooking -> Moves to READY
  finishCooking(station) {
    const order = station.currentOrder;
    if (!order) return;

    order.markReady();
    this.readyOrders.unshift(order);

    // Free the workstation
    station.currentOrder = null;
    station.status = 'IDLE';
    station.progressPercent = 0;
    station.elapsedSeconds = 0;

    if (window.soundEffects) {
      window.soundEffects.playOrderReady();
    }

    // Try immediately pulling next order from queue
    if (this.autoProcess && !this.orderQueue.isEmpty()) {
      this.cookNextInQueue(station);
    }
  }

  // Instant finish for demonstration / testing
  rushCompleteOrder(stationId) {
    const station = this.workstations.find((w) => w.id === stationId);
    if (station && station.status === 'COOKING' && station.currentOrder) {
      station.elapsedSeconds = station.targetSeconds;
      this.finishCooking(station);
      this.notify();
    }
  }

  // Mark an order as picked up / completed by customer or delivery
  completeOrder(orderId) {
    const index = this.readyOrders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      const order = this.readyOrders.splice(index, 1)[0];
      order.markCompleted();
      this.completedOrders.unshift(order);

      if (window.soundEffects) {
        window.soundEffects.playOrderCompleted();
      }

      this.notify();
      return order;
    }
    return null;
  }

  // Find order across all states (Queued, Preparing, Ready, Completed)
  findAnyOrder(orderId) {
    if (!orderId) return null;
    const cleanId = orderId.trim().toUpperCase();

    // 1. Check in Queue
    const inQueue = this.orderQueue.findOrder(cleanId);
    if (inQueue) {
      return {
        order: inQueue.order,
        state: 'QUEUED',
        position: inQueue.positionInQueue,
        details: `Position #${inQueue.positionInQueue} in waiting queue`
      };
    }

    // 2. Check in Kitchen Stations (Preparing)
    for (const station of this.workstations) {
      if (station.currentOrder && station.currentOrder.id.toUpperCase() === cleanId) {
        return {
          order: station.currentOrder,
          state: 'PREPARING',
          station: station.name,
          progress: station.progressPercent,
          remaining: Math.ceil(station.currentOrder.remainingPrepTime),
          details: `Cooking at ${station.name} (${station.progressPercent}%)`
        };
      }
    }

    // 3. Check Ready Orders
    const ready = this.readyOrders.find((o) => o.id.toUpperCase() === cleanId);
    if (ready) {
      return {
        order: ready,
        state: 'READY',
        details: 'Order is freshly prepared and ready for pickup at Counter!'
      };
    }

    // 4. Check Completed Orders
    const completed = this.completedOrders.find((o) => o.id.toUpperCase() === cleanId);
    if (completed) {
      return {
        order: completed,
        state: 'COMPLETED',
        details: 'Order completed and delivered to customer.'
      };
    }

    return null;
  }

  // Analytics Metrics
  getMetrics() {
    const totalQueued = this.orderQueue.size();
    const totalPreparing = this.workstations.filter((w) => w.status === 'COOKING').length;
    const totalReady = this.readyOrders.length;
    const totalCompleted = this.completedOrders.length;

    const totalRevenue = this.completedOrders.reduce((sum, o) => sum + o.totalAmount, 0) +
      this.readyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const avgTurnaround = this.completedOrders.length > 0
      ? Math.round(
          this.completedOrders.reduce((acc, o) => acc + o.getTotalTurnaroundSeconds(), 0) /
          this.completedOrders.length
        )
      : 0;

    return {
      totalQueued,
      totalPreparing,
      totalReady,
      totalCompleted,
      totalRevenue: totalRevenue.toFixed(2),
      avgTurnaround
    };
  }
}

if (typeof window !== 'undefined') {
  window.KitchenManager = KitchenManager;
}
