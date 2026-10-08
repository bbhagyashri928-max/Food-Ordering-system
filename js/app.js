/**
 * Online Food Order Processing System
 * Main Application Controller & Dual Portal Logic (User & Admin Dashboards)
 */

// Application State
let appState = {
  currentPortal: 'user', // 'user' or 'admin'
  userActiveTab: 'user-menu-tab',
  adminActiveTab: 'admin-kitchen-tab',
  queue: null,
  kitchen: null,
  cart: [],
  selectedCategory: 'all',
  trackedOrderId: null,
  visualizerMode: 'circular' // 'circular' or 'linked'
};

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initSystem();
  setupEventListeners();
  loadInitialDemoData();
  renderAll();
});

// ==========================================
// 1. INITIALIZATION & SETUP
// ==========================================
function initSystem() {
  // Initialize Circular Queue with capacity 10
  appState.queue = new CircularOrderQueue(10);

  // Initialize Kitchen with 2 workstations
  appState.kitchen = new KitchenManager(appState.queue, 2);

  // Subscribe UI renders to state changes
  appState.queue.subscribe(() => {
    renderQueueHeaderBadge();
    renderQueueVisualizer();
    renderKitchenQueuedList();
    renderTracker();
    renderAnalytics();
  });

  appState.kitchen.subscribe(() => {
    renderKitchenStations();
    renderOrderCompletionBoard();
    renderTracker();
    renderAnalytics();
    renderUserOrdersHistory();
    renderQueueHeaderBadge();
  });
}

function setupEventListeners() {
  // Sound Toggle Button
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = window.soundEffects.toggleMute();
      soundBtn.innerHTML = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
      soundBtn.classList.toggle('muted', isMuted);
      showToast(isMuted ? 'Audio effects muted' : 'Audio effects enabled', 'info');
    });
  }

  // Quick Preset Demo Buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetIndex = parseInt(btn.dataset.preset, 10);
      loadPresetOrder(presetIndex);
    });
  });

  // Category filter clicks
  document.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      appState.selectedCategory = chip.dataset.category;
      renderMenu();
    });
  });

  // Order Placement Form Submit
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleOrderPlacement();
    });
  }

  // Tracker Search Input
  const trackerInput = document.getElementById('tracker-search-input');
  const trackerBtn = document.getElementById('tracker-search-btn');
  if (trackerBtn && trackerInput) {
    trackerBtn.addEventListener('click', () => {
      const val = trackerInput.value.trim();
      if (val) {
        appState.trackedOrderId = val.toUpperCase();
        renderTracker();
      }
    });
    trackerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = trackerInput.value.trim();
        if (val) {
          appState.trackedOrderId = val.toUpperCase();
          renderTracker();
        }
      }
    });
  }

  // Kitchen Controls (Admin)
  const autoCookToggle = document.getElementById('auto-cook-toggle');
  if (autoCookToggle) {
    autoCookToggle.addEventListener('change', () => {
      const isAuto = appState.kitchen.toggleAutoProcess();
      showToast(`Kitchen Auto-Process: ${isAuto ? 'ON (Auto-Dispatch)' : 'OFF (Manual Mode)'}`, 'info');
    });
  }

  const manualCookBtn = document.getElementById('manual-cook-btn');
  if (manualCookBtn) {
    manualCookBtn.addEventListener('click', () => {
      handleCookNext();
    });
  }

  const adminCookBtn = document.getElementById('admin-cook-btn');
  if (adminCookBtn) {
    adminCookBtn.addEventListener('click', () => {
      handleCookNext();
    });
  }

  // Speed selector
  document.querySelectorAll('.speed-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.speed) {
        document.querySelectorAll('.speed-pill[data-speed]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.dataset.speed);
        appState.kitchen.setSimulationSpeed(speed);
        showToast(`Kitchen speed set to ${speed}x`, 'info');
      }
    });
  });

  // DS Visualizer Controls
  const manualEnqueueBtn = document.getElementById('ds-enqueue-btn');
  if (manualEnqueueBtn) {
    manualEnqueueBtn.addEventListener('click', () => handleManualEnqueue());
  }

  const manualDequeueBtn = document.getElementById('ds-dequeue-btn');
  if (manualDequeueBtn) {
    manualDequeueBtn.addEventListener('click', () => handleManualDequeue());
  }

  const manualPeekBtn = document.getElementById('ds-peek-btn');
  if (manualPeekBtn) {
    manualPeekBtn.addEventListener('click', () => handleManualPeek());
  }

  const overflowTestBtn = document.getElementById('ds-overflow-test-btn');
  if (overflowTestBtn) {
    overflowTestBtn.addEventListener('click', () => handleOverflowTest());
  }

  const underflowTestBtn = document.getElementById('ds-underflow-test-btn');
  if (underflowTestBtn) {
    underflowTestBtn.addEventListener('click', () => handleUnderflowTest());
  }

  // Visualizer Mode Toggle
  const circularModeBtn = document.getElementById('mode-circular-btn');
  const linkedModeBtn = document.getElementById('mode-linked-btn');
  if (circularModeBtn && linkedModeBtn) {
    circularModeBtn.addEventListener('click', () => {
      circularModeBtn.classList.add('active');
      linkedModeBtn.classList.remove('active');
      appState.visualizerMode = 'circular';
      renderQueueVisualizer();
    });
    linkedModeBtn.addEventListener('click', () => {
      linkedModeBtn.classList.add('active');
      circularModeBtn.classList.remove('active');
      appState.visualizerMode = 'linked';
      renderQueueVisualizer();
    });
  }

  // Capacity Slider
  const capSlider = document.getElementById('capacity-slider');
  const capValDisplay = document.getElementById('capacity-slider-val');
  if (capSlider && capValDisplay) {
    capSlider.addEventListener('input', (e) => {
      const newCap = parseInt(e.target.value, 10);
      capValDisplay.textContent = newCap;
      appState.queue.capacity = newCap;
      if (appState.queue.queue.length !== newCap) {
        // resize buffer
        const oldItems = appState.queue.toSequenceArray().map((s) => s.order);
        appState.queue.clear();
        appState.queue.capacity = newCap;
        oldItems.forEach((ord) => appState.queue.enqueue(ord));
      }
      renderQueueVisualizer();
      showToast(`Queue capacity set to ${newCap} slots`, 'info');
    });
  }

  // Clear Cart
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      appState.cart = [];
      renderCart();
      showToast('Cart emptied', 'info');
    });
  }

  // Reset System
  const resetSystemBtn = document.getElementById('reset-system-btn');
  if (resetSystemBtn) {
    resetSystemBtn.addEventListener('click', () => {
      if (confirm('Reset Queue and Kitchen state?')) {
        appState.queue.clear();
        appState.kitchen.initWorkstations();
        appState.kitchen.readyOrders = [];
        appState.kitchen.completedOrders = [];
        showToast('System reset successfully', 'info');
        renderAll();
      }
    });
  }

  // Reload Demo
  const adminReloadBtn = document.getElementById('admin-reload-btn');
  if (adminReloadBtn) {
    adminReloadBtn.addEventListener('click', () => {
      loadInitialDemoData();
      showToast('Sample demo orders reloaded into Queue!', 'success');
      renderAll();
    });
  }
}

// ==========================================
// 2. PORTAL & TAB SWITCHING
// ==========================================
function switchPortal(portal) {
  appState.currentPortal = portal;

  const userContainer = document.getElementById('portal-user');
  const adminContainer = document.getElementById('portal-admin');
  const btnUser = document.getElementById('btn-portal-user');
  const btnAdmin = document.getElementById('btn-portal-admin');
  const indicatorText = document.getElementById('role-indicator-text');

  if (portal === 'user') {
    if (userContainer) userContainer.classList.add('active-portal');
    if (adminContainer) adminContainer.classList.remove('active-portal');
    if (btnUser) btnUser.classList.add('active');
    if (btnAdmin) btnAdmin.classList.remove('active');
    if (indicatorText) indicatorText.innerHTML = 'Active View: <strong>Customer Dashboard</strong>';
    renderMenu();
    renderCart();
    renderTracker();
    renderUserOrdersHistory();
  } else {
    if (adminContainer) adminContainer.classList.add('active-portal');
    if (userContainer) userContainer.classList.remove('active-portal');
    if (btnAdmin) btnAdmin.classList.add('active');
    if (btnUser) btnUser.classList.remove('active');
    if (indicatorText) indicatorText.innerHTML = 'Active View: <strong>Admin & Kitchen Console</strong>';
    renderKitchenStations();
    renderKitchenQueuedList();
    renderOrderCompletionBoard();
    renderQueueVisualizer();
    renderAdminInventory();
    renderAnalytics();
  }
}

function switchUserTab(tabId) {
  appState.userActiveTab = tabId;
  const userPortal = document.getElementById('portal-user');
  if (!userPortal) return;

  userPortal.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  userPortal.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  if (tabId === 'user-tracker-tab') renderTracker();
  if (tabId === 'user-history-tab') renderUserOrdersHistory();
}

function switchAdminTab(tabId) {
  appState.adminActiveTab = tabId;
  const adminPortal = document.getElementById('portal-admin');
  if (!adminPortal) return;

  adminPortal.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  adminPortal.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  if (tabId === 'admin-kitchen-tab') {
    renderKitchenStations();
    renderKitchenQueuedList();
    renderOrderCompletionBoard();
  }
  if (tabId === 'admin-ds-tab') renderQueueVisualizer();
  if (tabId === 'admin-inventory-tab') renderAdminInventory();
  if (tabId === 'admin-analytics-tab') renderAnalytics();
}

function setAdminChefCount(count) {
  appState.kitchen.setWorkstationCount(count);
  const ind = document.getElementById('active-chefs-indicator');
  if (ind) ind.textContent = `${count} Parallel Chefs`;

  document.querySelectorAll('#portal-admin .speed-pills button').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent.includes(`${count} Chef`));
  });

  renderKitchenStations();
  showToast(`Active kitchen stations set to ${count} chefs`, 'info');
}

// ==========================================
// 3. MENU & CART LOGIC
// ==========================================
function renderMenu() {
  const container = document.getElementById('menu-grid');
  if (!container) return;

  const filteredItems = appState.selectedCategory === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter((item) => item.category === appState.selectedCategory);

  container.innerHTML = filteredItems.map((item) => {
    const inCartItem = appState.cart.find((c) => c.item.id === item.id);
    const cartQty = inCartItem ? inCartItem.qty : 0;
    const isAvailable = item.inStock !== false;

    return `
      <div class="menu-card ${!isAvailable ? 'out-of-stock' : ''}" data-id="${item.id}">
        <div class="food-image-wrapper">
          <img src="${item.image || ''}" alt="${item.name}" class="food-card-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="food-emoji-fallback" style="display: none;">
            <span class="food-emoji">${item.emoji}</span>
          </div>
          <div class="food-img-overlay"></div>
          <div class="card-badge ${item.isSpicy ? 'spicy' : ''} ${item.isVeg ? 'veg' : ''}">
            ${!isAvailable ? 'SOLD OUT' : (item.badge || (item.isVeg ? 'Veg' : 'Non-Veg'))}
          </div>
          <span class="food-category-chip-floating">${item.emoji}</span>
        </div>
        <div class="card-details">
          <div class="card-title-row">
            <h3 class="food-title">${item.name}</h3>
            <span class="food-price">$${item.price.toFixed(2)}</span>
          </div>
          <p class="food-desc">${item.description}</p>
          <div class="card-meta">
            <span class="meta-tag">⏱️ ~${item.prepTime}s prep</span>
            <span class="meta-tag">⭐ ${item.rating}</span>
          </div>
          <div class="card-action-row">
            ${!isAvailable ? `
              <button class="add-to-cart-btn btn-disabled" disabled style="opacity: 0.5; cursor: not-allowed; background: rgba(244,63,94,0.15); color: #fb7185; border-color: rgba(244,63,94,0.3);">
                <span>🚫 Out of Stock</span>
              </button>
            ` : (cartQty > 0 ? `
              <div class="qty-control-group">
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
                <span class="qty-display">${cartQty}</span>
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
              </div>
            ` : `
              <button class="add-to-cart-btn" onclick="addToCart('${item.id}')">
                <span>+ Add to Order</span>
              </button>
            `)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(itemId) {
  const item = MENU_ITEMS.find((m) => m.id === itemId);
  if (!item || item.inStock === false) return;

  const existing = appState.cart.find((c) => c.item.id === itemId);
  if (existing) {
    existing.qty++;
  } else {
    appState.cart.push({ item, qty: 1 });
  }

  if (window.soundEffects) window.soundEffects.ensureContext();
  renderMenu();
  renderCart();
  showToast(`Added ${item.name} to cart`, 'info');
}

function updateCartItemQty(itemId, delta) {
  const index = appState.cart.findIndex((c) => c.item.id === itemId);
  if (index === -1) return;

  appState.cart[index].qty += delta;
  if (appState.cart[index].qty <= 0) {
    appState.cart.splice(index, 1);
  }

  renderMenu();
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items-list');
  const cartEmptyState = document.getElementById('cart-empty-state');
  const cartFooter = document.getElementById('cart-footer');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const subtotalEl = document.getElementById('cart-subtotal');
  const taxEl = document.getElementById('cart-tax');
  const totalEl = document.getElementById('cart-total');
  const prepEstEl = document.getElementById('cart-est-prep');

  const totalItemCount = appState.cart.reduce((sum, c) => sum + c.qty, 0);
  cartCountBadges.forEach((b) => (b.textContent = totalItemCount));

  if (!cartContainer) return;

  if (appState.cart.length === 0) {
    if (cartEmptyState) cartEmptyState.style.display = 'flex';
    if (cartContainer) cartContainer.innerHTML = '';
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  if (cartEmptyState) cartEmptyState.style.display = 'none';
  if (cartFooter) cartFooter.style.display = 'block';

  let subtotal = 0;
  let maxPrep = 8;

  cartContainer.innerHTML = appState.cart.map(({ item, qty }) => {
    const itemTotal = item.price * qty;
    subtotal += itemTotal;
    if (item.prepTime > maxPrep) maxPrep = item.prepTime;

    return `
      <div class="cart-item-row">
        <div class="cart-item-thumb">
          <img src="${item.image || ''}" alt="${item.name}" class="cart-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
          <span class="cart-item-emoji" style="${item.image ? 'display:none;' : ''}">${item.emoji}</span>
        </div>
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${item.price.toFixed(2)} × ${qty} = $${itemTotal.toFixed(2)}</span>
        </div>
        <div class="cart-item-stepper">
          <button class="step-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
          <span class="step-val">${qty}</span>
          <button class="step-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
  if (prepEstEl) prepEstEl.textContent = `~${maxPrep + Math.min(10, totalItemCount * 2)}s`;
}

function loadPresetOrder(presetIndex) {
  const preset = PRESET_ORDERS[presetIndex];
  if (!preset) return;

  appState.cart = [];
  preset.itemIds.forEach((id) => {
    const item = MENU_ITEMS.find((m) => m.id === id);
    if (item && item.inStock !== false) {
      appState.cart.push({ item, qty: 1 });
    }
  });

  const nameInput = document.getElementById('cust-name');
  const typeSelect = document.getElementById('order-type');
  const tableInput = document.getElementById('table-input');
  const notesInput = document.getElementById('order-notes');

  if (nameInput) nameInput.value = preset.customer;
  if (typeSelect) typeSelect.value = preset.type;
  if (tableInput) tableInput.value = preset.table;
  if (notesInput) notesInput.value = preset.notes;

  renderMenu();
  renderCart();
  showToast(`Loaded preset order: "${preset.name}"`, 'success');
}

// ==========================================
// 4. ORDER PLACEMENT (ENQUEUE)
// ==========================================
function handleOrderPlacement() {
  if (appState.cart.length === 0) {
    showToast('Please add items to your cart before placing an order!', 'warning');
    return;
  }

  const nameInput = document.getElementById('cust-name');
  const typeSelect = document.getElementById('order-type');
  const tableInput = document.getElementById('table-input');
  const notesInput = document.getElementById('order-notes');

  const customerName = nameInput ? nameInput.value.trim() : 'Guest';
  const orderType = typeSelect ? typeSelect.value : 'Dine-In';
  const tableOrAddress = tableInput ? tableInput.value.trim() : 'Counter';
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!customerName) {
    showToast('Please enter customer name!', 'warning');
    if (nameInput) nameInput.focus();
    return;
  }

  const subtotal = appState.cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const totalAmount = subtotal * 1.05;
  const maxPrepTime = Math.max(...appState.cart.map((c) => c.item.prepTime));
  const totalPrepTime = maxPrepTime + Math.min(12, appState.cart.length * 2);

  const orderItems = appState.cart.map((c) => ({
    id: c.item.id,
    name: c.item.name,
    price: c.item.price,
    qty: c.qty,
    emoji: c.item.emoji,
    image: c.item.image || ''
  }));

  const newOrder = new Order({
    customerName,
    orderType,
    tableOrAddress,
    items: orderItems,
    notes,
    totalAmount,
    totalPrepTime
  });

  const enqueueResult = appState.queue.enqueue(newOrder);

  if (!enqueueResult.success) {
    if (enqueueResult.error === 'OVERFLOW') {
      if (window.soundEffects) window.soundEffects.playWarning();
      showModal('Queue Overflow Warning', `
        <div class="alert-box danger">
          <strong>⚠️ QUEUE OVERFLOW!</strong>
          <p>The queue is full (${appState.queue.getCapacity()}/${appState.queue.getCapacity()}). Please wait until orders are prepared before taking new ones!</p>
        </div>
      `);
      return;
    }
  }

  if (window.soundEffects) window.soundEffects.playEnqueue();

  appState.cart = [];
  renderCart();
  renderMenu();

  if (nameInput) nameInput.value = '';
  if (notesInput) notesInput.value = '';

  appState.trackedOrderId = newOrder.id;
  showOrderSuccessModal(newOrder, enqueueResult.position);
}

function showOrderSuccessModal(order, queuePosition) {
  const modalBody = `
    <div class="success-order-modal">
      <div class="success-icon">🎉</div>
      <h2 class="success-title">Order Placed Successfully!</h2>
      <p class="success-subtitle">Your order has been <strong>ENQUEUED</strong> into the processing queue.</p>

      <div class="order-token-card">
        <span class="token-label">YOUR ORDER ID</span>
        <span class="token-id">${order.id}</span>
        <div class="token-pos-badge">Position #${queuePosition} in Waiting Queue</div>
      </div>

      <div class="order-summary-box">
        <div class="summary-line"><span>Customer:</span> <strong>${order.customerName}</strong></div>
        <div class="summary-line"><span>Type:</span> <strong>${order.orderType} (${order.tableOrAddress})</strong></div>
        <div class="summary-line"><span>Items:</span> <strong>${order.items.reduce((s, i) => s + i.qty, 0)} items ($${order.totalAmount.toFixed(2)})</strong></div>
        <div class="summary-line"><span>Est. Prep Time:</span> <strong>~${order.totalPrepTime} seconds</strong></div>
        <div class="summary-line"><span>DS Memory Slot:</span> <code>${order.memoryAddress}</code></div>
      </div>

      <div class="modal-action-row">
        <button class="btn btn-primary" onclick="closeModal(); switchUserTab('user-tracker-tab');">
          📍 Track Live Status
        </button>
        <button class="btn btn-secondary" onclick="closeModal(); switchPortal('admin'); switchAdminTab('admin-ds-tab');">
          🛡️ View in Admin DS Studio
        </button>
      </div>
    </div>
  `;
  showModal('Order Confirmation', modalBody);
}

// ==========================================
// 5. KITCHEN DISPLAY SYSTEM & DISPATCH
// ==========================================
function renderKitchenStations() {
  const container = document.getElementById('kitchen-stations-grid');
  if (!container) return;

  container.innerHTML = appState.kitchen.workstations.map((station) => {
    const isCooking = station.status === 'COOKING' && station.currentOrder;
    const order = station.currentOrder;

    return `
      <div class="chef-station-card ${isCooking ? 'busy' : 'idle'}">
        <div class="station-header">
          <div class="station-title">
            <span class="chef-icon">${isCooking ? '👨‍🍳' : '💤'}</span>
            <div>
              <h4>${station.name}</h4>
              <span class="station-status-pill ${isCooking ? 'cooking' : 'idle'}">
                ${isCooking ? '🔥 COOKING' : 'IDLE / READY'}
              </span>
            </div>
          </div>
          ${isCooking ? `
            <button class="rush-btn" onclick="appState.kitchen.rushCompleteOrder(${station.id})" title="Instant Complete for Demo">
              ⚡ Rush
            </button>
          ` : ''}
        </div>

        ${isCooking ? `
          <div class="station-order-body">
            <div class="station-order-id-row">
              <span class="order-id-badge">${order.id}</span>
              <span class="customer-tag">${order.customerName}</span>
            </div>
            <div class="station-items-list">
              ${order.items.map((it) => `<span class="station-item-chip">${it.emoji} ${it.name} × ${it.qty}</span>`).join('')}
            </div>

            <div class="cooking-progress-wrapper">
              <div class="progress-labels">
                <span>Cooking Progress</span>
                <span class="countdown-text">${Math.ceil(order.remainingPrepTime)}s remaining (${station.progressPercent}%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${station.progressPercent}%"></div>
              </div>
            </div>
          </div>
        ` : `
          <div class="station-idle-body">
            <p>Station is free. Ready for next order from queue...</p>
          </div>
        `}
      </div>
    `;
  }).join('');
}

function renderKitchenQueuedList() {
  const container = document.getElementById('kitchen-waiting-list');
  const countEl = document.getElementById('waiting-queue-count');
  if (!container) return;

  const sequence = appState.queue.toSequenceArray();
  if (countEl) countEl.textContent = sequence.length;

  if (sequence.length === 0) {
    container.innerHTML = `
      <div class="empty-list-placeholder">
        <span>✅</span>
        <p>No orders waiting in queue. All caught up!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sequence.map(({ order, position, isFront }) => {
    return `
      <div class="queued-order-row ${isFront ? 'next-in-line' : ''}">
        <div class="pos-badge">#${position}</div>
        <div class="queued-order-details">
          <div class="row-top">
            <strong>${order.id}</strong> — <span>${order.customerName}</span>
            ${isFront ? '<span class="front-badge">NEXT TO COOK (FRONT)</span>' : ''}
          </div>
          <div class="row-sub">
            <span>${order.items.map((i) => `${i.emoji} ${i.qty}x`).join(' ')}</span>
            <span>• Est. ${order.totalPrepTime}s</span>
            <span>• In line: ${order.getQueueWaitSeconds()}s</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOrderCompletionBoard() {
  const cookingListEl = document.getElementById('board-cooking-list');
  const activeStations = appState.kitchen.workstations.filter((w) => w.status === 'COOKING');

  if (cookingListEl) {
    if (activeStations.length === 0) {
      cookingListEl.innerHTML = `<div class="board-empty">None currently cooking</div>`;
    } else {
      cookingListEl.innerHTML = activeStations.map((w) => `
        <div class="board-order-ticket preparing">
          <span class="ticket-id">${w.currentOrder.id}</span>
          <span class="ticket-cust">${w.currentOrder.customerName}</span>
          <div class="ticket-bar">
            <div class="bar-fill" style="width: ${w.progressPercent}%"></div>
          </div>
        </div>
      `).join('');
    }
  }

  const readyListEl = document.getElementById('board-ready-list');
  const readyCountEl = document.getElementById('ready-orders-count');
  const readyOrders = appState.kitchen.readyOrders;

  if (readyCountEl) readyCountEl.textContent = readyOrders.length;

  if (readyListEl) {
    if (readyOrders.length === 0) {
      readyListEl.innerHTML = `<div class="board-empty">No orders waiting for pickup</div>`;
    } else {
      readyListEl.innerHTML = readyOrders.map((order) => `
        <div class="board-order-ticket ready">
          <div class="ticket-top">
            <span class="ticket-id ready-glow">${order.id}</span>
            <span class="ticket-type">${order.orderType}</span>
          </div>
          <span class="ticket-cust">${order.customerName} (${order.tableOrAddress})</span>
          <div class="ticket-actions">
            <button class="btn btn-sm btn-success" onclick="handleMarkCompleted('${order.id}')">
              ✅ Hand Over / Picked Up
            </button>
            <button class="btn btn-sm btn-outline" onclick="openReceiptModal('${order.id}')">
              🧾 Receipt
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

function handleCookNext() {
  const res = appState.kitchen.cookNextInQueue();
  if (res.success) {
    showToast(`Chef assigned next order [${res.order.id}] from queue!`, 'success');
  } else if (res.reason === 'QUEUE_EMPTY') {
    showToast('Waiting queue is currently empty!', 'warning');
  } else if (res.reason === 'ALL_CHEFS_BUSY') {
    showToast('All chef stations are currently busy cooking!', 'warning');
  }
}

function handleMarkCompleted(orderId) {
  const completedOrder = appState.kitchen.completeOrder(orderId);
  if (completedOrder) {
    showToast(`Order [${orderId}] successfully completed and delivered!`, 'success');
    renderUserOrdersHistory();
  }
}

// ==========================================
// 6. LIVE STATUS TRACKER
// ==========================================
function renderTracker() {
  const container = document.getElementById('tracker-result-container');
  const emptyPrompt = document.getElementById('tracker-empty-prompt');
  const recentChipsContainer = document.getElementById('tracker-recent-chips');

  if (recentChipsContainer) {
    const allActiveOrders = [
      ...appState.queue.toSequenceArray().map((s) => s.order),
      ...appState.kitchen.workstations.filter((w) => w.currentOrder).map((w) => w.currentOrder),
      ...appState.kitchen.readyOrders,
      ...appState.kitchen.completedOrders.slice(0, 3)
    ];

    recentChipsContainer.innerHTML = allActiveOrders.map((ord) => `
      <button class="chip-order ${appState.trackedOrderId === ord.id ? 'active' : ''}" onclick="selectTrackedOrder('${ord.id}')">
        ${ord.id} (${ord.status})
      </button>
    `).join('');
  }

  if (!appState.trackedOrderId) {
    if (emptyPrompt) emptyPrompt.style.display = 'block';
    if (container) container.style.display = 'none';
    return;
  }

  const lookup = appState.kitchen.findAnyOrder(appState.trackedOrderId);
  if (!lookup) {
    if (emptyPrompt) emptyPrompt.style.display = 'none';
    if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div class="alert-box danger">
          <h3>Order "${appState.trackedOrderId}" Not Found</h3>
          <p>Please check the Order ID and try again, or click one of the order chips above.</p>
        </div>
      `;
    }
    return;
  }

  if (emptyPrompt) emptyPrompt.style.display = 'none';
  if (container) container.style.display = 'block';

  const { order, state } = lookup;

  const isStep1Done = true;
  const isStep2Active = state === 'QUEUED';
  const isStep2Done = state === 'PREPARING' || state === 'READY' || state === 'COMPLETED';
  const isStep3Active = state === 'PREPARING';
  const isStep3Done = state === 'READY' || state === 'COMPLETED';
  const isStep4Active = state === 'READY';
  const isStep4Done = state === 'COMPLETED';
  const isStep5Done = state === 'COMPLETED';

  container.innerHTML = `
    <div class="tracker-card">
      <div class="tracker-header">
        <div>
          <span class="status-indicator-badge ${state.toLowerCase()}">${state}</span>
          <h2>Order ${order.id}</h2>
          <p class="tracker-cust-info">For: <strong>${order.customerName}</strong> (${order.orderType} • ${order.tableOrAddress})</p>
        </div>
        <button class="btn btn-sm btn-outline" onclick="openReceiptModal('${order.id}')">
          🧾 View Receipt
        </button>
      </div>

      <div class="stepper-horizontal">
        <div class="step-item ${isStep1Done ? 'completed' : ''}">
          <div class="step-circle">✓</div>
          <div class="step-content">
            <span class="step-title">Order Placed</span>
            <span class="step-time">Received</span>
          </div>
        </div>
        <div class="step-connector ${isStep2Done ? 'filled' : (isStep2Active ? 'animating' : '')}"></div>

        <div class="step-item ${isStep2Done ? 'completed' : (isStep2Active ? 'active' : '')}">
          <div class="step-circle">${isStep2Done ? '✓' : (isStep2Active ? '2' : '2')}</div>
          <div class="step-content">
            <span class="step-title">In Queue</span>
            <span class="step-time">${isStep2Active ? lookup.details : 'Enqueued'}</span>
          </div>
        </div>
        <div class="step-connector ${isStep3Done ? 'filled' : (isStep3Active ? 'animating' : '')}"></div>

        <div class="step-item ${isStep3Done ? 'completed' : (isStep3Active ? 'active' : '')}">
          <div class="step-circle">${isStep3Done ? '✓' : (isStep3Active ? '👨‍🍳' : '3')}</div>
          <div class="step-content">
            <span class="step-title">Kitchen Prep</span>
            <span class="step-time">${isStep3Active ? lookup.details : (isStep3Done ? 'Cooked' : 'Waiting')}</span>
          </div>
        </div>
        <div class="step-connector ${isStep4Done ? 'filled' : (isStep4Active ? 'animating' : '')}"></div>

        <div class="step-item ${isStep4Done ? 'completed' : (isStep4Active ? 'active' : '')}">
          <div class="step-circle">${isStep4Done ? '✓' : (isStep4Active ? '🔔' : '4')}</div>
          <div class="step-content">
            <span class="step-title">Ready for Pickup</span>
            <span class="step-time">${isStep4Active ? 'At Counter!' : (isStep4Done ? 'Picked' : 'Pending')}</span>
          </div>
        </div>
        <div class="step-connector ${isStep5Done ? 'filled' : ''}"></div>

        <div class="step-item ${isStep5Done ? 'completed' : ''}">
          <div class="step-circle">${isStep5Done ? '✨' : '5'}</div>
          <div class="step-content">
            <span class="step-title">Completed</span>
            <span class="step-time">${isStep5Done ? 'Fulfilled' : 'Final Step'}</span>
          </div>
        </div>
      </div>

      <div class="live-status-callout ${state.toLowerCase()}">
        <span class="callout-icon">${
          state === 'QUEUED' ? '⏳' :
          state === 'PREPARING' ? '🍳' :
          state === 'READY' ? '🔔' : '🎉'
        }</span>
        <div>
          <h4>${
            state === 'QUEUED' ? 'Waiting in Queue' :
            state === 'PREPARING' ? 'Currently Sizzling in Kitchen' :
            state === 'READY' ? 'Ready for Pickup / Delivery Dispatch!' : 'Order Complete!'
          }</h4>
          <p>${lookup.details}</p>
        </div>
      </div>

      <div class="tracker-items-summary">
        <h4>Order Items (${order.items.reduce((s, i) => s + i.qty, 0)})</h4>
        <div class="tracker-items-grid">
          ${order.items.map((i) => `
            <div class="item-summary-card">
              ${i.image ? `<img src="${i.image}" alt="${i.name}" class="tracker-item-thumb" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span style="display:none;">${i.emoji}</span>` : `<span>${i.emoji}</span>`}
              <div>
                <strong>${i.name}</strong>
                <span>Qty: ${i.qty} • $${(i.price * i.qty).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function selectTrackedOrder(orderId) {
  appState.trackedOrderId = orderId;
  const input = document.getElementById('tracker-search-input');
  if (input) input.value = orderId;
  renderTracker();
}

// User History Table
function renderUserOrdersHistory() {
  const tbody = document.getElementById('user-orders-tbody');
  if (!tbody) return;

  const allUserOrders = [
    ...appState.kitchen.readyOrders,
    ...appState.kitchen.completedOrders
  ];

  if (allUserOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No completed orders yet. Place an order to see your receipts!</td></tr>`;
    return;
  }

  tbody.innerHTML = allUserOrders.map((o) => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.orderType} (${o.tableOrAddress})</td>
      <td>${o.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}</td>
      <td><strong>$${o.totalAmount.toFixed(2)}</strong></td>
      <td>${o.getTotalTurnaroundSeconds()}s</td>
      <td><span class="status-indicator-badge ${o.status.toLowerCase()}">${o.status}</span></td>
      <td>
        <button class="btn btn-xs btn-outline" onclick="openReceiptModal('${o.id}')">
          🧾 Receipt
        </button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// 7. QUEUE DS STUDIO & VISUALIZER
// ==========================================
function renderQueueVisualizer() {
  const container = document.getElementById('queue-visualizer-container');
  const modeLabel = document.getElementById('visualizer-mode-label');
  const frontIndexEl = document.getElementById('ds-front-val');
  const rearIndexEl = document.getElementById('ds-rear-val');
  const sizeValEl = document.getElementById('ds-size-val');
  const capacityValEl = document.getElementById('ds-capacity-val');
  const auditLogsEl = document.getElementById('ds-audit-logs');

  if (frontIndexEl) frontIndexEl.textContent = appState.queue.front;
  if (rearIndexEl) rearIndexEl.textContent = appState.queue.rear;
  if (sizeValEl) sizeValEl.textContent = `${appState.queue.size()}`;
  if (capacityValEl) capacityValEl.textContent = `${appState.queue.getCapacity()}`;

  if (!container) return;

  if (appState.visualizerMode === 'circular') {
    if (modeLabel) modeLabel.textContent = 'Array-Based Circular Queue';
    renderCircularBufferView(container);
  } else {
    if (modeLabel) modeLabel.textContent = 'Linked List Node-Based Queue';
    renderLinkedListNodeView(container);
  }

  if (auditLogsEl) {
    if (appState.queue.logHistory.length === 0) {
      auditLogsEl.innerHTML = `<div class="log-empty">No queue operations executed yet.</div>`;
    } else {
      auditLogsEl.innerHTML = appState.queue.logHistory.slice(0, 10).map((log) => `
        <div class="log-row ${log.status.toLowerCase()}">
          <span class="log-time">${log.timestamp}</span>
          <span class="log-badge ${log.operation.toLowerCase()}">${log.operation}</span>
          <span class="log-msg">${log.message}</span>
          <span class="log-complexity">${log.complexity}</span>
        </div>
      `).join('');
    }
  }
}

function renderCircularBufferView(container) {
  const rawSlots = appState.queue.getRawBuffer();

  container.innerHTML = `
    <div class="circular-buffer-grid">
      ${rawSlots.map((slot) => {
        const order = slot.order;
        const isOccupied = slot.isOccupied;

        return `
          <div class="queue-slot-card ${isOccupied ? 'occupied' : 'empty'} ${slot.isFront ? 'is-front' : ''} ${slot.isRear ? 'is-rear' : ''}" id="slot-${slot.index}">
            <div class="slot-pointers">
              ${slot.isFront ? '<span class="pointer-tag front-tag">▼ FRONT</span>' : ''}
              ${slot.isRear ? '<span class="pointer-tag rear-tag">▲ REAR</span>' : ''}
            </div>

            <div class="slot-index-badge">Index [${slot.index}]</div>

            ${isOccupied ? `
              <div class="slot-order-content">
                <span class="slot-order-id">${order.id}</span>
                <span class="slot-cust">${order.customerName}</span>
                <span class="slot-mem">Addr: ${order.memoryAddress}</span>
                <div class="slot-meta">
                  <span>${order.items.reduce((s, i) => s + i.qty, 0)} items</span>
                  <span>⏱️ ${order.totalPrepTime}s</span>
                </div>
              </div>
            ` : `
              <div class="slot-empty-content">
                <span class="empty-label">NULL / FREE</span>
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLinkedListNodeView(container) {
  const sequence = appState.queue.toSequenceArray();

  if (sequence.length === 0) {
    container.innerHTML = `
      <div class="linked-empty">
        <p>Linked List Queue is Empty (head = null, tail = null)</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="linked-nodes-ribbon">
      <div class="head-pointer-marker">HEAD ➜</div>
      ${sequence.map((item, idx) => {
        const isHead = idx === 0;
        const isTail = idx === sequence.length - 1;

        return `
          <div class="linked-node-wrapper">
            <div class="node-box ${isHead ? 'is-head' : ''} ${isTail ? 'is-tail' : ''}">
              <div class="node-header">
                <span>Node #${item.position}</span>
                <code>${item.order.memoryAddress}</code>
              </div>
              <div class="node-body">
                <strong>${item.order.id}</strong>
                <span>${item.order.customerName}</span>
              </div>
              <div class="node-next-pointer">
                <span>next: ${isTail ? 'NULL' : '➜'}</span>
              </div>
            </div>
            ${!isTail ? '<div class="node-arrow">⟶</div>' : '<div class="tail-pointer-marker">⟵ TAIL</div>'}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function handleManualEnqueue() {
  const name = prompt('Customer Name for manual enqueue test:', 'Walk-in Customer');
  if (!name) return;

  const testOrder = new Order({
    customerName: name,
    orderType: 'Takeaway',
    tableOrAddress: 'Test Bench',
    items: [{ id: 'BUR-01', name: 'Test Burger', price: 10.0, qty: 1, emoji: '🍔' }],
    totalAmount: 10.0,
    totalPrepTime: 12
  });

  const res = appState.queue.enqueue(testOrder);
  if (res.success) {
    if (window.soundEffects) window.soundEffects.playEnqueue();
    showToast(`Order [${testOrder.id}] enqueued at Rear index [${res.rearIndex}]!`, 'success');
  } else {
    if (window.soundEffects) window.soundEffects.playWarning();
    showToast(`Cannot enqueue: ${res.message}`, 'error');
  }
}

function handleManualDequeue() {
  const res = appState.queue.dequeue();
  if (res.success) {
    if (window.soundEffects) window.soundEffects.playDequeue();
    showToast(`Dequeued Order [${res.order.id}] from Front index [${res.frontIndex}]!`, 'success');
  } else {
    if (window.soundEffects) window.soundEffects.playWarning();
    showToast(`Queue Underflow: ${res.message}`, 'error');
  }
}

function handleManualPeek() {
  const frontOrder = appState.queue.peek();
  if (frontOrder) {
    showToast(`Peek: Front element is [${frontOrder.id}] (${frontOrder.customerName})`, 'info');
    const slotEl = document.getElementById(`slot-${appState.queue.front}`);
    if (slotEl) {
      slotEl.classList.add('peek-highlight');
      setTimeout(() => slotEl.classList.remove('peek-highlight'), 1800);
    }
  } else {
    showToast('Peek: Queue is empty! (front = -1)', 'warning');
  }
}

function handleOverflowTest() {
  const cap = appState.queue.getCapacity();
  let added = 0;
  while (!appState.queue.isFull()) {
    const o = new Order({
      customerName: `Overflow Test #${appState.queue.size() + 1}`,
      items: [{ id: 'BUR-01', name: 'Burger', price: 9.99, qty: 1, emoji: '🍔' }],
      totalAmount: 9.99
    });
    appState.queue.enqueue(o);
    added++;
  }

  const rejectedOrder = new Order({ customerName: 'Rejected Order', items: [] });
  appState.queue.enqueue(rejectedOrder);

  if (window.soundEffects) window.soundEffects.playWarning();
  showToast(`Simulated Overflow! Added ${added} orders. Capacity full (${cap}/${cap}). Extra order rejected.`, 'warning');
}

function handleUnderflowTest() {
  appState.queue.clear();
  appState.queue.dequeue();
  if (window.soundEffects) window.soundEffects.playWarning();
  showToast('Simulated Underflow! Attempted to pop empty queue. Protected gracefully.', 'error');
}

// ==========================================
// 8. ADMIN INVENTORY & STOCK MANAGEMENT
// ==========================================
function renderAdminInventory() {
  const container = document.getElementById('admin-inventory-grid');
  if (!container) return;

  container.innerHTML = MENU_ITEMS.map((item) => {
    const inStock = item.inStock !== false;

    return `
      <div class="inventory-card ${!inStock ? 'out-of-stock' : ''}">
        <div class="inv-left">
          <div class="inv-thumb-wrap">
            <img src="${item.image || ''}" alt="${item.name}" class="inv-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
            <span class="inv-emoji" style="${item.image ? 'display:none;' : ''}">${item.emoji}</span>
          </div>
          <div class="inv-details">
            <h4>${item.name}</h4>
            <span>$${item.price.toFixed(2)} • ${item.category}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: ${inStock ? 'var(--emerald-success)' : 'var(--rose-danger)'};">
            ${inStock ? 'In Stock' : '86\'d'}
          </span>
          <label class="stock-toggle-switch">
            <input type="checkbox" ${inStock ? 'checked' : ''} onchange="handleStockToggle('${item.id}')">
            <span class="slider-switch"></span>
          </label>
        </div>
      </div>
    `;
  }).join('');
}

function handleStockToggle(itemId) {
  if (window.toggleItemStock) {
    const isNowInStock = window.toggleItemStock(itemId);
    showToast(`Item updated to ${isNowInStock ? 'In Stock' : 'Out of Stock'}`, 'info');
    renderMenu();
    renderAdminInventory();
  }
}

// ==========================================
// 9. ANALYTICS & LEDGER
// ==========================================
function renderAnalytics() {
  const metrics = appState.kitchen.getMetrics();

  const statQueued = document.getElementById('stat-queued');
  const statCooking = document.getElementById('stat-cooking');
  const statReady = document.getElementById('stat-ready');
  const statCompleted = document.getElementById('stat-completed');
  const statRevenue = document.getElementById('stat-revenue');
  const statAvgWait = document.getElementById('stat-avg-wait');
  const completedTableBody = document.getElementById('completed-orders-tbody');

  if (statQueued) statQueued.textContent = metrics.totalQueued;
  if (statCooking) statCooking.textContent = metrics.totalPreparing;
  if (statReady) statReady.textContent = metrics.totalReady;
  if (statCompleted) statCompleted.textContent = metrics.totalCompleted;
  if (statRevenue) statRevenue.textContent = `$${metrics.totalRevenue}`;
  if (statAvgWait) statAvgWait.textContent = `${metrics.avgTurnaround}s`;

  if (completedTableBody) {
    if (appState.kitchen.completedOrders.length === 0) {
      completedTableBody.innerHTML = `
        <tr><td colspan="7" class="text-center py-4">No completed orders recorded yet.</td></tr>
      `;
    } else {
      completedTableBody.innerHTML = appState.kitchen.completedOrders.map((o) => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td>${o.orderType}</td>
          <td>${o.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}</td>
          <td>$${o.totalAmount.toFixed(2)}</td>
          <td>${o.getTotalTurnaroundSeconds()}s</td>
          <td>
            <button class="btn btn-xs btn-outline" onclick="openReceiptModal('${o.id}')">
              🧾 Receipt
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

function renderQueueHeaderBadge() {
  const badge = document.getElementById('header-queue-badge');
  if (badge) {
    const qSize = appState.queue ? appState.queue.size() : 0;
    badge.textContent = `Queue: ${qSize} orders`;
    badge.classList.toggle('has-items', qSize > 0);
  }
}

// Initial Realistic Orders
function loadInitialDemoData() {
  appState.queue.clear();
  appState.kitchen.initWorkstations();
  appState.kitchen.readyOrders = [];
  appState.kitchen.completedOrders = [];

  const order1 = new Order({
    id: 'ORD-1001',
    customerName: 'Marcus Vance',
    orderType: 'Dine-In',
    tableOrAddress: 'Table 3',
    items: [
      { id: 'BUR-01', name: 'Truffle Smash Cheeseburger', price: 12.99, qty: 1, emoji: '🍔' },
      { id: 'BEV-01', name: 'Iced Caramel Cloud Macchiato', price: 4.95, qty: 1, emoji: '☕' }
    ],
    totalAmount: 17.94,
    totalPrepTime: 16
  });

  const order2 = new Order({
    id: 'ORD-1002',
    customerName: 'Sarah Jenkins',
    orderType: 'Takeaway',
    tableOrAddress: 'Takeaway Counter',
    items: [
      { id: 'PIZ-02', name: 'Smoked Pepperoni & Hot Honey', price: 15.99, qty: 1, emoji: '🍕' }
    ],
    totalAmount: 15.99,
    totalPrepTime: 18
  });

  appState.kitchen.assignOrderToStation(appState.kitchen.workstations[0], order1);
  appState.kitchen.assignOrderToStation(appState.kitchen.workstations[1], order2);
  appState.kitchen.workstations[0].elapsedSeconds = 9;
  appState.kitchen.workstations[1].elapsedSeconds = 4;

  const order3 = new Order({
    id: 'ORD-1000',
    customerName: 'Liam Hemsworth',
    orderType: 'Dine-In',
    tableOrAddress: 'Table 7',
    items: [
      { id: 'ASI-01', name: 'Tokyo Teriyaki Chicken Rice Bowl', price: 13.95, qty: 1, emoji: '🍚' },
      { id: 'BEV-02', name: 'Sparkling Dragonfruit Lemonade', price: 4.25, qty: 1, emoji: '🍹' }
    ],
    totalAmount: 18.2,
    totalPrepTime: 15
  });
  order3.markReady();
  appState.kitchen.readyOrders.push(order3);

  const order0 = new Order({
    id: 'ORD-0999',
    customerName: 'Olivia Rodrigo',
    orderType: 'Takeaway',
    tableOrAddress: 'Order #0999',
    items: [
      { id: 'BUR-02', name: 'Crispy Peri-Peri Chicken Burger', price: 10.49, qty: 1, emoji: '🍗' },
      { id: 'DES-01', name: 'Warm Belgian Molten Lava Cake', price: 6.95, qty: 1, emoji: '🍫' }
    ],
    totalAmount: 17.44,
    totalPrepTime: 14
  });
  order0.markReady();
  order0.markCompleted();
  appState.kitchen.completedOrders.push(order0);

  const order4 = new Order({
    id: 'ORD-1003',
    customerName: 'Aarav Patel',
    orderType: 'Dine-In',
    tableOrAddress: 'Table 12',
    items: [
      { id: 'BUR-02', name: 'Crispy Peri-Peri Chicken Burger', price: 10.49, qty: 1, emoji: '🍗' },
      { id: 'DES-02', name: 'Churros with Dulce de Leche', price: 5.8, qty: 1, emoji: '🥨' }
    ],
    totalAmount: 16.29,
    totalPrepTime: 14
  });

  const order5 = new Order({
    id: 'ORD-1004',
    customerName: 'Emily Watson',
    orderType: 'Online Delivery',
    tableOrAddress: '42 Pine Street, Apt 3B',
    items: [
      { id: 'PIZ-01', name: 'Margherita di Bufala', price: 13.5, qty: 2, emoji: '🍕' }
    ],
    totalAmount: 27.0,
    totalPrepTime: 20
  });

  const order6 = new Order({
    id: 'ORD-1005',
    customerName: 'Daniel Craig',
    orderType: 'Dine-In',
    tableOrAddress: 'Table 5',
    items: [
      { id: 'ASI-02', name: 'Spicy Sichuan Dan Dan Noodles', price: 12.5, qty: 1, emoji: '🍜' },
      { id: 'BEV-03', name: 'Ceremonial Matcha Oat Latte', price: 5.2, qty: 1, emoji: '🍵' }
    ],
    totalAmount: 17.7,
    totalPrepTime: 13
  });

  appState.queue.enqueue(order4);
  appState.queue.enqueue(order5);
  appState.queue.enqueue(order6);

  appState.trackedOrderId = 'ORD-1003';
}

function renderAll() {
  renderMenu();
  renderCart();
  renderQueueHeaderBadge();
  renderKitchenStations();
  renderKitchenQueuedList();
  renderOrderCompletionBoard();
  renderTracker();
  renderUserOrdersHistory();
  renderQueueVisualizer();
  renderAdminInventory();
  renderAnalytics();
}

// ==========================================
// 10. MODALS, RECEIPTS & TOASTS
// ==========================================
function showModal(title, contentHtml) {
  const modalOverlay = document.getElementById('app-modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-body-content');

  if (modalTitle) modalTitle.textContent = title;
  if (modalContent) modalContent.innerHTML = contentHtml;
  if (modalOverlay) modalOverlay.style.display = 'flex';
}

function closeModal() {
  const modalOverlay = document.getElementById('app-modal-overlay');
  if (modalOverlay) modalOverlay.style.display = 'none';
}

function openReceiptModal(orderId) {
  const lookup = appState.kitchen.findAnyOrder(orderId);
  if (!lookup) {
    showToast(`Order ${orderId} not found!`, 'warning');
    return;
  }

  const o = lookup.order;
  const subtotal = o.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = subtotal * 0.05;

  const content = `
    <div class="receipt-container" id="printable-receipt">
      <div class="receipt-header">
        <h3 class="receipt-brand">🍔 GOURMET FOOD LAB</h3>
        <p>124 University Avenue, Campus Mall</p>
        <p>Tel: +1 (555) 948-2231</p>
        <div class="receipt-divider">--------------------------------</div>
      </div>

      <div class="receipt-meta">
        <div><span>Order:</span> <strong>${o.id}</strong></div>
        <div><span>Date:</span> <span>${o.createdAt.toLocaleDateString()} ${o.createdAt.toLocaleTimeString()}</span></div>
        <div><span>Customer:</span> <span>${o.customerName}</span></div>
        <div><span>Type:</span> <span>${o.orderType} (${o.tableOrAddress})</span></div>
        <div><span>Status:</span> <strong class="text-emerald">${o.status}</strong></div>
      </div>

      <div class="receipt-divider">--------------------------------</div>
      <div class="receipt-items-table">
        ${o.items.map((it) => `
          <div class="receipt-item-row">
            <span>${it.name} x${it.qty}</span>
            <span>$${(it.price * it.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="receipt-divider">--------------------------------</div>

      <div class="receipt-totals">
        <div class="row"><span>Subtotal:</span> <span>$${subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Tax (5%):</span> <span>$${tax.toFixed(2)}</span></div>
        <div class="row total-bold"><span>GRAND TOTAL:</span> <span>$${o.totalAmount.toFixed(2)}</span></div>
      </div>

      <div class="receipt-footer">
        <p>Data Structure: Circular Queue</p>
        <p>Turnaround: ${o.getTotalTurnaroundSeconds()} seconds</p>
        <p class="thank-you">*** THANK YOU FOR YOUR ORDER! ***</p>
      </div>

      <div class="receipt-print-actions">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;

  showModal(`Receipt - ${o.id}`, content);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// Window global bindings
window.switchPortal = switchPortal;
window.switchUserTab = switchUserTab;
window.switchAdminTab = switchAdminTab;
window.setAdminChefCount = setAdminChefCount;
window.handleStockToggle = handleStockToggle;
window.addToCart = addToCart;
window.updateCartItemQty = updateCartItemQty;
window.loadPresetOrder = loadPresetOrder;
window.handleMarkCompleted = handleMarkCompleted;
window.openReceiptModal = openReceiptModal;
window.closeModal = closeModal;
window.selectTrackedOrder = selectTrackedOrder;
