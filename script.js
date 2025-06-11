document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content'); // Assuming you still have these for content display
    const menuContainer = document.querySelector('.mod-menu-container');
    const headerCurrentTab = document.querySelector('.header-current-tab');
    const versionInfo = document.querySelector('.version-info');
    const pageCounter = document.querySelector('.page-counter');

    // --- Tab Switching & Header Update --- 
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (headerCurrentTab) {
                // Use the text content of the tab's span for the header
                const tabNameSpan = tab.querySelector('span:not(.arrow)');
                headerCurrentTab.textContent = tabNameSpan ? tabNameSpan.textContent.toUpperCase() : 'HOME';
            }

            // Update page counter
            if (pageCounter) {
                pageCounter.textContent = `${index + 1}/${tabs.length}`;
            }

            // Handle tab content display (if you have separate content areas)
            const targetContentId = tab.dataset.tab; // e.g., data-tab="self-content"
            if (targetContentId) {
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetContentId) {
                        content.classList.add('active');
                    }
                });
            } else {
                // If no specific content area, maybe hide all or show a default
                tabContents.forEach(content => content.classList.remove('active'));
            }
        });
    });

    // --- Menu Controls (Close - No explicit button in new design, handled by ESC/Lua) --- 
    // Close button logic might be removed if not present in new HTML
    // const closeBtn = document.getElementById('close-btn'); 
    // if (closeBtn) { ... }

    // --- Vehicle Spawning (Example - adapt to your actual content structure) --- 
    // This part needs to be adapted if your new design has different input fields/buttons
    // For now, let's assume you might add these later within a tab's content area.
    // const spawnVehicleBtn = document.getElementById('spawn-vehicle-btn');
    // const vehicleNameInput = document.getElementById('vehicle-name-input');
    // if (spawnVehicleBtn && vehicleNameInput) { ... }

    // --- Weapon Giving (Example - adapt) ---
    // const giveWeaponBtn = document.getElementById('give-weapon-btn');
    // const weaponNameInput = document.getElementById('weapon-name-input');
    // if (giveWeaponBtn && weaponNameInput) { ... }

    // --- Generic Action Buttons (Example - adapt) ---
    // This would apply to buttons within your tab content sections
    // document.querySelectorAll('.option-button[data-action]').forEach(button => { ... });

    // --- Toggle Switches (Example - adapt) ---
    // document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => { ... });

    // --- Status Message System (Footer - can be used for brief messages) --- 
    function showStatus(message, type = 'info') { // types: info, success, warning, danger
        if (!versionInfo) return; // Using versionInfo as a placeholder for status temporarily
        const originalText = versionInfo.textContent;
        versionInfo.textContent = message;
        // Add class for styling if needed: versionInfo.className = `version-info status-${type}`;
        setTimeout(() => {
            versionInfo.textContent = originalText;
            // versionInfo.className = 'version-info';
        }, 3000);
    }

    // --- NUI Message Handling (From Lua to JS) --- 
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!menuContainer) return;

        if (data.action === 'openMenu') {
            menuContainer.style.display = 'flex';
            // Activate the first tab by default when opening
            if (tabs.length > 0) {
                tabs[0].click();
            }
            // showStatus('Menu opened.', 'info'); // Optional status message
        } else if (data.action === 'closeMenu') {
            menuContainer.style.display = 'none';
        } else if (data.action === 'statusUpdate') {
            showStatus(data.message, data.type || 'info');
        } else if (data.action === 'setActiveTab') { // New action to set tab from Lua
            const tabToActivate = Array.from(tabs).find(t => t.dataset.tabIdentifier === data.tabId);
            if (tabToActivate) {
                tabToActivate.click();
            }
        }
        // Add more event handlers as needed
    });

    // --- Helper to Post Messages to NUI (JS to Lua) --- 
    function postNuiMessage(data) {
        if (typeof GetParentResourceName === 'function') {
            fetch(`https://gre/${data.action}`, { // Ensure 'gre' matches your resource name
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(data),
            }).then(resp => {
                if (!resp.ok) {
                    // Try to get error message from response body if possible
                    return resp.json().catch(() => ({ status: 'error', message: `HTTP error ${resp.status}` })).then(errData => {
                        throw new Error(errData.message || `HTTP error ${resp.status}`);
                    });
                }
                return resp.json();
            }).then(respData => {
                if (respData.status === 'ok') {
                    // console.log(`NUI Message Sent: ${data.action}, Response:`, respData);
                } else {
                    // console.error(`NUI Message Error: ${respData.message}`);
                    showStatus(respData.message || 'Unknown NUI error', 'danger');
                }
            }).catch(error => {
                // console.error('NUI Fetch Error:', error);
                showStatus(`NUI Error: ${error.message}`, 'danger');
            });
        } else {
            console.log('Simulating NUI Message (not in FiveM):', data);
            // Simulate some actions for browser testing
            if (data.action === 'closeMenu') console.log('Menu close simulated.');
            else showStatus(`Simulated action: ${data.action}`, 'info');
        }
    }

    // --- Keyboard Shortcuts --- 
    document.addEventListener('keydown', (event) => {
        if (!menuContainer || menuContainer.style.display === 'none') return;

        if (event.key === 'Escape') {
            postNuiMessage({ action: 'closeMenu' });
        }
        // Add more shortcuts like ArrowUp/ArrowDown for tab navigation
        let currentActiveIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentActiveIndex < tabs.length - 1) {
                tabs[currentActiveIndex + 1].click();
            }
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentActiveIndex > 0) {
                tabs[currentActiveIndex - 1].click();
            }
        }
        // Potentially 'Enter' to select/confirm an option within a tab if content is interactive
    });

    // --- Draggable Menu (Using the header) ---
    let isDragging = false;
    let offsetX, offsetY;
    const draggableHeader = document.querySelector('.mod-menu-header'); // The entire header is draggable

    if (draggableHeader && menuContainer) {
        draggableHeader.addEventListener('mousedown', (e) => {
            // Prevent dragging if clicking on an interactive element within header (if any)
            // if (e.target.closest('button')) return;
            isDragging = true;
            offsetX = e.clientX - menuContainer.offsetLeft;
            offsetY = e.clientY - menuContainer.offsetTop;
            menuContainer.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !menuContainer) return;
        menuContainer.style.left = `${e.clientX - offsetX}px`;
        menuContainer.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (menuContainer) menuContainer.style.cursor = 'default';
            document.body.style.userSelect = '';
        }
    });

    // --- Initial Setup --- 
    if (tabs.length > 0) {
        tabs[0].click(); // Activate the first tab and update header/counter
    }
    if (versionInfo) {
        // Example: Set initial version text - this could also come from Lua
        // versionInfo.textContent = 'Version: Beta | 24hrs ago (pls report bugs)';
    }

    // For debugging in browser without FiveM environment
    if (typeof GetParentResourceName === 'undefined') {
        console.log('Running in browser mode. NUI messages will be simulated.');
        if (menuContainer) menuContainer.style.display = 'flex';
        // Mock GetParentResourceName for testing postNuiMessage's if block
        // window.GetParentResourceName = () => 'gre'; 
    }

    
    // Clear any existing timeout
    if (statusMessageTimeout) {
        clearTimeout(statusMessageTimeout);
    }
    
    // Set message and style based on type
    statusElement.textContent = message;
    statusElement.className = 'status-message';
    
    switch(type) {
        case 'success':
            statusElement.style.color = 'var(--success-color)';
            break;
        case 'warning':
            statusElement.style.color = 'var(--warning-color)';
            break;
        case 'error':
            statusElement.style.color = 'var(--danger-color)';
            break;
        default: // info
            statusElement.style.color = 'var(--text-light)';
    }
    
    // Clear message after 3 seconds
    statusMessageTimeout = setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
});

// Send data to FiveM
function sendData(data) {
    // Check if we're in FiveM context
    if (window.invokeNative) {
        // Use FiveM's fetch API to send data to the resource
        fetch('https://gre/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(data)
        }).catch(error => {
            console.error('Error sending data to FiveM:', error);
        });
    } else {
        // We're not in FiveM, log for debugging
        console.log('Data that would be sent to FiveM:', data);
    }
}

// Receive message from FiveM
function receiveMessage(event) {
    const data = event.data;
    
    // Handle different message types
    if (data.type === 'status') {
        showStatusMessage(data.message, data.messageType || 'info');
    } else if (data.type === 'vehicle_spawned') {
        showStatusMessage(`Vehicle spawned: ${data.model}`, 'success');
    } else if (data.type === 'error') {
        showStatusMessage(`Error: ${data.message}`, 'error');
    }
    
    console.log('Received message from FiveM:', data);
}

// For testing in browser
function simulateFiveMMessage(messageData) {
    window.dispatchEvent(new MessageEvent('message', {
        data: messageData
    }));
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // ESC key to close menu
    if (event.key === 'Escape') {
        closeMenu();
    }
    
    // Tab key to cycle through tabs
    if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        const tabs = ['vehicles', 'weapons', 'player', 'world', 'misc'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        switchTab(tabs[nextIndex]);
    }
    
    // Shift+Tab to cycle backwards
    if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        const tabs = ['vehicles', 'weapons', 'player', 'world', 'misc'];
        const currentIndex = tabs.indexOf(activeTab);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        switchTab(tabs[prevIndex]);
    }
});

// Make the menu draggable
let isDragging = false;
let dragOffsetX, dragOffsetY;

document.querySelector('.mod-menu-header').addEventListener('mousedown', function(e) {
    // Only allow dragging from the header, not from the buttons
    if (e.target.tagName !== 'BUTTON') {
        isDragging = true;
        const container = document.querySelector('.mod-menu-container');
        const rect = container.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
    }
});

document.addEventListener('mousemove', function(e) {
    if (isDragging) {
        const container = document.querySelector('.mod-menu-container');
        container.style.left = (e.clientX - dragOffsetX) + 'px';
        container.style.top = (e.clientY - dragOffsetY) + 'px';
        container.style.transform = 'none'; // Remove the transform to allow precise positioning
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
});

// Prevent text selection during dragging
document.querySelector('.mod-menu-header').addEventListener('selectstart', function(e) {
    e.preventDefault();
});