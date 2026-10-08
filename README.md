# 🍔 Online Food Order Processing System
### Data Structures Mini Project — Queue Data Structure (FIFO)

An interactive, high-performance **Online Food Order Processing System** that manages incoming customer orders using the **Queue Data Structure**. Orders are placed, prepared, and dispatched in strict First-In-First-Out (FIFO) chronological sequence.

Includes both an **Interactive Web Application** and a **Standalone CLI Terminal Application**, complete with unit tests and academic documentation.

---

## 🌟 Dual Dashboard Architecture

The system features two dedicated portals switchable via the top navigation bar:

### 👤 1. Customer Dashboard (User Portal)
- **Digital Menu & Cart:** Browse categorized menu items, search food, customize quantities, and add notes.
- **Out-of-Stock Awareness:** Reflects live menu stock availability set by Admin.
- **One-Click Demo Presets:** Rapidly populate cart with gourmet items to evaluate the queue.
- **$\mathcal{O}(1)$ Queue Enqueue:** Orders are enqueued at the **Rear** of the Queue with an assigned wait position.
- **Live Status Tracker:** Interactive timeline tracking:
  $$\text{Placed} \longrightarrow \text{In Queue (Position \#X)} \longrightarrow \text{Kitchen Cooking} \longrightarrow \text{Ready for Pickup} \longrightarrow \text{Completed}$$
- **My Order History & Receipts:** Review all personal past orders with printable receipt invoices.

### 🛡️ 2. Admin & Kitchen Console (Admin Portal)
- **Kitchen Display System (KDS):** Active chef workstations with live countdown progress bars and `⚡ Rush Complete`.
- **Queue Dispatcher:** Strict order line with manual or auto cook dispatching from the **Front** pointer.
- **Public Order Completion Board:** Dual-panel board showing *Now Preparing* and *Ready for Pickup* with pickup handover actions.
- **Queue DS Studio & Visualizer:**
  - Visual memory slots showing buffer indices, pointer locations ($\boldsymbol{\nabla}\text{ FRONT}$, $\boldsymbol{\Delta}\text{ REAR}$), and memory addresses.
  - Mode toggle: **Circular Array Queue** vs. **Linked List Queue**.
  - Interactive playground: Manual Enqueue, Dequeue, Peek, Test Overflow, and Test Underflow.
  - Live Chronological Audit Trail.
- **Menu Stock & Chef Capacity Controls:**
  - Toggle items In-Stock / 86'd (Out of Stock).
  - Adjust Queue Capacity slider (5 to 20 slots).
  - Adjust active chef count (1, 2, or 3 workstations).
- **Analytics & Restaurant Ledger:** Metrics on queued, cooking, revenue, turnaround times, and state reset.


---

## 🚀 How to Run the Project

### Option 1: Direct Browser Launch (Simplest & Instant)
No installations required! Simply double-click or open `index.html` in any web browser:
```bash
# Windows command line or File Explorer
start index.html
```

### Option 2: Local Web Server (Node.js)
The project includes a built-in, zero-dependency Node HTTP server:
```bash
node server.js
```
Then open your browser and navigate to:
```
http://localhost:3000/
```

### Option 3: Run the Python CLI Version
For terminal or command-line demonstrations:
```bash
python python/food_queue_system.py
```

### Option 4: Run the Automated Queue Test Suite
Execute the test script to verify FIFO ordering, capacity limits, and edge cases:
```bash
node test-queue.js
```

---

## 📂 Project Directory Structure

```
d:/DS mini project/
├── index.html                  # Main Web Application User Interface
├── server.js                   # Lightweight zero-dependency HTTP server
├── test-queue.js               # Automated Node.js Queue validation test suite
├── css/
│   ├── style.css              # Main design system, glassmorphism, responsive styles
│   └── queue-visualizer.css   # Queue visualizer, memory slots, pointers, animations
├── js/
│   ├── queue.js               # Pure Queue Data Structure (Circular & Linked FIFO)
│   ├── menu-data.js           # Food menu catalogue, prices, preparation times, presets
│   ├── audio.js               # Web Audio API sound synthesizer (chimes & alerts)
│   ├── kitchen.js             # Kitchen engine, cooking stations, FIFO dispatch loop
│   └── app.js                 # Central controller, tabs, tracker, modals, receipts
├── python/
│   └── food_queue_system.py   # Complete standalone Python CLI implementation
└── docs/
    └── PROJECT_REPORT.md      # Comprehensive Academic Project Report & Viva Q&A
```

---

## 🧠 Data Structure Complexity Summary

| Queue Operation | Time Complexity | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- |
| **`enqueue(order)`** | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Inserts at `rear` pointer; constant time. |
| **`dequeue()`** | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Pops from `front` pointer; constant time. |
| **`peek()`** | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Direct element lookup at `queue[front]`. |
| **`isEmpty()` / `isFull()`**| $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Checks count against bounds. |
| **`findOrder(id)`** | $\mathcal{O}(N)$ | $\mathcal{O}(1)$ | Linear scan through active queue elements. |

---

## 🎓 Academic Viva Questions Included
Refer to [PROJECT_REPORT.md](file:///d:/DS%20mini%20project/docs/PROJECT_REPORT.md) for the complete academic report, flowcharts, pseudocode, and answers to top viva-voce questions asked by university examiners!
