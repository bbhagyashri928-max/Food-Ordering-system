#!/usr/bin/env python3
"""
================================================================================
ONLINE FOOD ORDER PROCESSING SYSTEM USING QUEUE DATA STRUCTURE
Data Structures Mini Project (FIFO - First-In-First-Out)
================================================================================
Description:
    A complete console and object-oriented implementation of an Online Food Order
    Processing System managing incoming customer orders using a Queue Data Structure.
    Orders are strictly processed in the chronological order they are received (FIFO).
    Supports:
    1. Order Placement (Enqueue operation)
    2. Kitchen Preparation & Dispatch (Dequeue operation)
    3. Live Status Tracking (Search and Stepped timeline)
    4. Order Completion Display (Public Board)
    5. Circular Queue & Underflow/Overflow Protection
================================================================================
"""

import time
import random
from datetime import datetime

# ANSI Color Codes for Rich Terminal Output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GRAY = "\033[90m"


# ==============================================================================
# 1. ORDER CLASS (DATA ENTITY)
# ==============================================================================
class Order:
    def __init__(self, customer_name, items, order_type="Dine-In", table_or_addr="Table 1"):
        self.order_id = f"ORD-{random.randint(1000, 9999)}"
        self.customer_name = customer_name
        self.items = items  # list of tuples: (item_name, price, qty)
        self.order_type = order_type
        self.table_or_addr = table_or_addr
        
        # Calculate total price
        self.subtotal = sum(price * qty for _, price, qty in items)
        self.tax = self.subtotal * 0.05
        self.total_amount = round(self.subtotal + self.tax, 2)
        
        # Status Lifecycle: QUEUED -> PREPARING -> READY -> COMPLETED
        self.status = "QUEUED"
        self.enqueued_at = datetime.now()
        self.prep_started_at = None
        self.ready_at = None
        self.completed_at = None
        self.assigned_chef = None

    def start_cooking(self, chef_name):
        self.status = "PREPARING"
        self.prep_started_at = datetime.now()
        self.assigned_chef = chef_name

    def mark_ready(self):
        self.status = "READY"
        self.ready_at = datetime.now()

    def mark_completed(self):
        self.status = "COMPLETED"
        self.completed_at = datetime.now()

    def get_summary(self):
        items_str = ", ".join(f"{name} (x{qty})" for name, _, qty in self.items)
        return (
            f"[{self.order_id}] {self.customer_name} | {self.order_type} ({self.table_or_addr}) | "
            f"Items: {items_str} | Total: ${self.total_amount:.2f} | Status: {self.status}"
        )


# ==============================================================================
# 2. CIRCULAR QUEUE DATA STRUCTURE (FIFO)
# ==============================================================================
class CircularOrderQueue:
    """
    Circular Queue implementation using a fixed-size array buffer.
    Maintains front and rear pointers to achieve O(1) Enqueue and Dequeue operations.
    """
    def __init__(self, capacity=10):
        self.capacity = capacity
        self.queue = [None] * capacity
        self.front = -1
        self.rear = -1
        self.count = 0

    def is_empty(self):
        """Returns True if queue contains zero orders (Underflow condition)"""
        return self.count == 0

    def is_full(self):
        """Returns True if queue has reached capacity (Overflow condition)"""
        return self.count == self.capacity

    def size(self):
        """Returns the number of active waiting orders"""
        return self.count

    def enqueue(self, order):
        """
        Adds an incoming order to the rear of the queue.
        Time Complexity: O(1)
        """
        if self.is_full():
            print(f"{Colors.RED}⚠️ QUEUE OVERFLOW! Max queue capacity ({self.capacity}) reached. Order rejected!{Colors.RESET}")
            return False

        if self.is_empty():
            self.front = 0
            self.rear = 0
        else:
            self.rear = (self.rear + 1) % self.capacity

        self.queue[self.rear] = order
        self.count += 1
        order.status = "QUEUED"
        order.enqueued_at = datetime.now()
        return True

    def dequeue(self):
        """
        Removes and returns the order from the front of the queue.
        Time Complexity: O(1)
        """
        if self.is_empty():
            print(f"{Colors.RED}⚠️ QUEUE UNDERFLOW! Cannot dequeue from an empty order queue.{Colors.RESET}")
            return None

        order = self.queue[self.front]
        self.queue[self.front] = None

        if self.front == self.rear:
            # Last element was dequeued; reset pointers
            self.front = -1
            self.rear = -1
        else:
            self.front = (self.front + 1) % self.capacity

        self.count -= 1
        return order

    def peek(self):
        """
        Inspects the front order without removing it.
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self.queue[self.front]

    def find_order(self, order_id):
        """
        Searches for an order in the queue by ID.
        Time Complexity: O(N)
        """
        if self.is_empty():
            return None, -1

        curr = self.front
        position = 1
        for _ in range(self.count):
            order = self.queue[curr]
            if order and order.order_id.upper() == order_id.upper():
                return order, position
            curr = (curr + 1) % self.capacity
            position += 1
        return None, -1

    def get_all_orders_in_sequence(self):
        """Returns list of active orders in FIFO order (Front to Rear)"""
        if self.is_empty():
            return []
        res = []
        curr = self.front
        for _ in range(self.count):
            if self.queue[curr]:
                res.append(self.queue[curr])
            curr = (curr + 1) % self.capacity
        return res

    def display_queue_memory(self):
        """Displays internal memory array representation showing front and rear pointers"""
        print(f"\n{Colors.CYAN}--- QUEUE INTERNAL BUFFER (Capacity: {self.capacity}) ---{Colors.RESET}")
        print(f"Front Pointer: [{self.front}] | Rear Pointer: [{self.rear}] | Size: {self.count}/{self.capacity}\n")
        
        row_indices = []
        row_slots = []
        row_pointers = []
        
        for i in range(self.capacity):
            ptr = ""
            if i == self.front and i == self.rear:
                ptr = "F/R"
            elif i == self.front:
                ptr = "FRNT"
            elif i == self.rear:
                ptr = "REAR"
            else:
                ptr = "    "
            
            val = self.queue[i].order_id if self.queue[i] else "EMPTY"
            row_indices.append(f"[{i:^5}]")
            row_slots.append(f"|{val:^7}|")
            row_pointers.append(f" {ptr:^7} ")

        print("Indices:  " + " ".join(row_indices))
        print("Slots:    " + " ".join(row_slots))
        print("Pointers: " + " ".join(row_pointers))
        print()


# ==============================================================================
# 3. RESTAURANT KITCHEN MANAGER
# ==============================================================================
class RestaurantKitchenSystem:
    def __init__(self, queue_capacity=10):
        self.order_queue = CircularOrderQueue(capacity=queue_capacity)
        self.cooking_stations = [
            {"id": 1, "chef": "Chef Marco", "order": None},
            {"id": 2, "chef": "Chef Elena", "order": None}
        ]
        self.ready_orders = []
        self.completed_orders = []

    def place_order(self, customer_name, items, order_type="Dine-In", table="Table 1"):
        order = Order(customer_name, items, order_type, table)
        success = self.order_queue.enqueue(order)
        if success:
            pos = self.order_queue.size()
            print(f"\n{Colors.GREEN}✅ Order Placed Successfully!{Colors.RESET}")
            print(f"   Order ID: {Colors.BOLD}{order.order_id}{Colors.RESET}")
            print(f"   Customer: {order.customer_name} ({order.order_type})")
            print(f"   Total: ${order.total_amount:.2f}")
            print(f"   Position in Queue: #{pos}")
            return order
        return None

    def process_next_order(self):
        """Dequeues next order in FIFO sequence and assigns to an idle chef"""
        if self.order_queue.is_empty():
            print(f"\n{Colors.YELLOW}ℹ️ No orders in waiting queue.{Colors.RESET}")
            return None

        # Find idle chef
        idle_station = next((s for s in self.cooking_stations if s["order"] is None), None)
        if not idle_station:
            print(f"\n{Colors.YELLOW}⚠️ All chef workstations are busy. Complete a cooking order first!{Colors.RESET}")
            return None

        order = self.order_queue.dequeue()
        order.start_cooking(idle_station["chef"])
        idle_station["order"] = order

        print(f"\n{Colors.CYAN}🍳 Order [{order.order_id}] DEQUEUED from front of queue and assigned to {idle_station['chef']}!{Colors.RESET}")
        return order

    def finish_cooking(self, station_id=1):
        """Finishes cooking at specified workstation and moves order to READY FOR PICKUP"""
        station = next((s for s in self.cooking_stations if s["id"] == station_id), None)
        if not station or station["order"] is None:
            print(f"\n{Colors.YELLOW}ℹ️ Station #{station_id} has no active cooking order.{Colors.RESET}")
            return None

        order = station["order"]
        order.mark_ready()
        self.ready_orders.append(order)
        station["order"] = None

        print(f"\n{Colors.GREEN}🔔 Order [{order.order_id}] is READY FOR PICKUP at Counter!{Colors.RESET}")
        return order

    def complete_pickup(self, order_id):
        """Customer picks up the ready order"""
        for i, order in enumerate(self.ready_orders):
            if order.order_id.upper() == order_id.upper():
                order.mark_completed()
                self.completed_orders.append(order)
                del self.ready_orders[i]
                print(f"\n{Colors.GREEN}✨ Order [{order.order_id}] delivered and marked COMPLETED!{Colors.RESET}")
                return order

        print(f"\n{Colors.RED}❌ Order ID [{order_id}] not found in ready orders list.{Colors.RESET}")
        return None

    def track_order(self, order_id):
        """Tracks the exact state and position of an order"""
        order_id = order_id.strip().upper()
        
        # 1. Check in Queue
        order, pos = self.order_queue.find_order(order_id)
        if order:
            print(f"\n{Colors.YELLOW}📍 STATUS: WAITING IN QUEUE{Colors.RESET}")
            print(f"   Order ID: {order.order_id} | Customer: {order.customer_name}")
            print(f"   Queue Position: #{pos} in line")
            print(f"   Total Amount: ${order.total_amount:.2f}")
            return

        # 2. Check cooking stations
        for s in self.cooking_stations:
            if s["order"] and s["order"].order_id.upper() == order_id:
                print(f"\n{Colors.CYAN}📍 STATUS: CURRENTLY PREPARING{Colors.RESET}")
                print(f"   Order ID: {s['order'].order_id} | Customer: {s['order'].customer_name}")
                print(f"   Assigned Station: {s['chef']}")
                return

        # 3. Check Ready
        for o in self.ready_orders:
            if o.order_id.upper() == order_id:
                print(f"\n{Colors.GREEN}📍 STATUS: READY FOR PICKUP!{Colors.RESET}")
                print(f"   Order ID: {o.order_id} | Customer: {o.customer_name}")
                print(f"   Location: Pickup Counter (Freshly Prepared)")
                return

        # 4. Check Completed
        for o in self.completed_orders:
            if o.order_id.upper() == order_id:
                print(f"\n{Colors.BLUE}📍 STATUS: COMPLETED{Colors.RESET}")
                print(f"   Order ID: {o.order_id} | Customer: {o.customer_name}")
                print(f"   Delivered and Archived.")
                return

        print(f"\n{Colors.RED}❌ Order ID [{order_id}] not found in the system.{Colors.RESET}")

    def display_kds_board(self):
        """Displays public order board and kitchen summary"""
        print(f"\n{Colors.BOLD}{'='*60}")
        print(f"{'📢 RESTAURANT ORDER STATUS & KITCHEN DISPLAY':^60}")
        print(f"{'='*60}{Colors.RESET}")

        print(f"\n{Colors.YELLOW}🔥 CHEF COOKING WORKSTATIONS:{Colors.RESET}")
        for s in self.cooking_stations:
            curr = s["order"].get_summary() if s["order"] else "IDLE (Ready for next order)"
            print(f"  • {s['chef']}: {curr}")

        print(f"\n{Colors.CYAN}⏳ WAITING IN QUEUE ({self.order_queue.size()} orders):{Colors.RESET}")
        seq = self.order_queue.get_all_orders_in_sequence()
        if not seq:
            print("  (Queue is currently empty)")
        else:
            for idx, ord_item in enumerate(seq, 1):
                front_tag = f" {Colors.GREEN}[NEXT IN LINE - FRONT]{Colors.RESET}" if idx == 1 else ""
                print(f"  #{idx}. [{ord_item.order_id}] {ord_item.customer_name} ({ord_item.order_type}){front_tag}")

        print(f"\n{Colors.GREEN}✅ READY FOR PICKUP ({len(self.ready_orders)} orders):{Colors.RESET}")
        if not self.ready_orders:
            print("  (No orders currently waiting for pickup)")
        else:
            for ord_item in self.ready_orders:
                print(f"  • {Colors.BOLD}[{ord_item.order_id}]{Colors.RESET} for {ord_item.customer_name} ({ord_item.table_or_addr})")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")


# ==============================================================================
# 4. INTERACTIVE CLI MENU
# ==============================================================================
def load_sample_data(system):
    system.place_order("Alice Johnson", [("Truffle Smash Burger", 12.99, 1), ("Iced Coffee", 4.95, 1)], "Dine-In", "Table 4")
    system.place_order("Bob Smith", [("Pepperoni Pizza", 15.99, 1)], "Takeaway", "Counter")
    system.place_order("Charlie Brown", [("Teriyaki Bowl", 13.95, 2)], "Delivery", "Suite 201")
    # Cook Alice's order
    system.process_next_order()

def main():
    system = RestaurantKitchenSystem(queue_capacity=8)
    load_sample_data(system)

    while True:
        print(f"\n{Colors.BOLD}{Colors.YELLOW}===================================================={Colors.RESET}")
        print(f"{Colors.BOLD}   ONLINE FOOD ORDER SYSTEM - QUEUE DS MINI PROJECT{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.YELLOW}===================================================={Colors.RESET}")
        print("1. 🍔 Place New Customer Order (Enqueue)")
        print("2. 🍳 Cook Next Order from Queue (Dequeue)")
        print("3. 🔔 Mark Cooking Order as Ready (Chef Station Complete)")
        print("4. ✅ Handover / Complete Order Pickup")
        print("5. 🔍 Track Order Status by ID")
        print("6. 📢 View Public Order Completion Display (KDS)")
        print("7. 🔬 Inspect Queue Internal Memory Buffer (Front & Rear)")
        print("8. 🧪 Run Automated Queue DS Edge-Case Tests")
        print("9. 🚪 Exit Program")
        print(f"{Colors.YELLOW}----------------------------------------------------{Colors.RESET}")

        choice = input("Select an option (1-9): ").strip()

        if choice == "1":
            name = input("Enter Customer Name: ").strip() or "Guest"
            print("\nQuick Item Combos:")
            print("  a) Burger & Drink ($17.94)")
            print("  b) Artisan Pizza Feast ($15.99)")
            print("  c) Asian Bowl Combo ($18.20)")
            combo = input("Select combo (a/b/c) or press Enter for custom: ").strip().lower()
            
            if combo == "b":
                items = [("Artisan Pizza", 15.99, 1)]
            elif combo == "c":
                items = [("Asian Bowl Combo", 18.20, 1)]
            else:
                items = [("Burger & Drink", 17.94, 1)]

            order_type = input("Order Type (1: Dine-In, 2: Takeaway, 3: Delivery) [1]: ").strip()
            type_map = {"1": "Dine-In", "2": "Takeaway", "3": "Delivery"}
            table = input("Table Number or Address [Table 1]: ").strip() or "Table 1"

            system.place_order(name, items, type_map.get(order_type, "Dine-In"), table)

        elif choice == "2":
            system.process_next_order()

        elif choice == "3":
            st_id = input("Which Chef Station finished? (1: Chef Marco, 2: Chef Elena) [1]: ").strip()
            system.finish_cooking(2 if st_id == "2" else 1)

        elif choice == "4":
            ord_id = input("Enter Order ID to mark picked up: ").strip()
            system.complete_pickup(ord_id)

        elif choice == "5":
            ord_id = input("Enter Order ID to track: ").strip()
            system.track_order(ord_id)

        elif choice == "6":
            system.display_kds_board()

        elif choice == "7":
            system.order_queue.display_queue_memory()

        elif choice == "8":
            print(f"\n{Colors.CYAN}🧪 RUNNING AUTOMATED QUEUE STRESS & UNDERFLOW/OVERFLOW TESTS...{Colors.RESET}")
            test_q = CircularOrderQueue(capacity=3)
            print(f"Queue empty check: {test_q.is_empty()} (Expected True)")
            test_q.enqueue(Order("Test 1", []))
            test_q.enqueue(Order("Test 2", []))
            test_q.enqueue(Order("Test 3", []))
            print(f"Queue full check: {test_q.is_full()} (Expected True)")
            print("Attempting 4th enqueue to test Overflow:")
            test_q.enqueue(Order("Test 4", []))
            print("Dequeuing elements:")
            while not test_q.is_empty():
                print(f"  Dequeued: {test_q.dequeue().customer_name}")
            print("Attempting Dequeue on empty to test Underflow:")
            test_q.dequeue()
            print(f"{Colors.GREEN}✅ All edge-case tests executed successfully!{Colors.RESET}")

        elif choice == "9":
            print("\nThank you for using the Online Food Order Processing System. Goodbye!\n")
            break
        else:
            print("\nInvalid choice. Please enter a number between 1 and 9.")


if __name__ == "__main__":
    main()
