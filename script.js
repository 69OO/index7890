document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuContainer = document.querySelector('.mod-menu-container');
    const footer = document.querySelector('.mod-menu-footer');
    const headerBanner = document.querySelector('.header-banner');
    const headerCurrentTab = document.querySelector('.header-current-tab');
    const pageCounter = document.querySelector('.page-counter');

    // القوائم الفرعية المختلفة لكل خيار رئيسي
    const submenuMap = {
        self: [
            { text: "God Mode", type: "toggle", value: false },
            { text: "Invisible", type: "toggle", value: true },
            { text: "Super Jump", type: "toggle", value: false }
        ],
        online: [
            { text: "Show All Players", type: "toggle", value: true },
            { text: "Block Messages", type: "toggle", value: false }
        ],
        combat: [
            { text: "No Recoil", type: "toggle", value: false },
            { text: "Infinite Ammo", type: "toggle", value: true }
        ],
        visual: [
            { text: "Night Vision", type: "toggle", value: false },
            { text: "ESP", type: "toggle", value: false }
        ],
        vehicle: [
            { text: "God Car", type: "toggle", value: false },
            { text: "Rainbow Paint", type: "toggle", value: false }
        ],
        misc: [
            { text: "Fast Run", type: "toggle", value: false }
        ],
        destructive: [
            { text: "Explosive Ammo", type: "toggle", value: false }
        ],
        triggers: [
            { text: "Quick Event", type: "toggle", value: false }
        ],
        settings: [
            { text: "Show FPS", type: "toggle", value: true },
            { text: "Enable VSync", type: "toggle", value: false }
        ]
    };

    let currentTabKey = "self";

    // تفعيل التبويب عند الضغط
    tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tab.focus();
            tabContents.forEach(cont => cont.classList.remove('active'));
            const target = tab.dataset.tab + "-tab";
            const tabContent = document.getElementById(target)
            if(tabContent) tabContent.classList.add('active');
            currentTabKey = tab.dataset.tab;

            // تحديث اسم التبويب في الهيدر
            if (headerCurrentTab) {
                headerCurrentTab.textContent = tab.textContent.trim().split('\n')[0].trim().toUpperCase();
            }
            // تحديث العداد
            if (pageCounter) {
                pageCounter.textContent = `${idx + 1}/${tabs.length}`;
            }
        });
    });

    if (tabs.length > 0) tabs[0].click();

    // تنقل الأسهم في الرئيسية
    document.addEventListener('keydown', function(event) {
        if (!document.querySelector('.submenu-overlay')) {
            let tabsArr = Array.from(tabs);
            let currentActiveIndex = tabsArr.findIndex(tab => tab.classList.contains('active'));
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (currentActiveIndex < tabsArr.length - 1) {
                    tabsArr[currentActiveIndex + 1].click();
                    tabsArr[currentActiveIndex + 1].focus();
                }
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (currentActiveIndex > 0) {
                    tabsArr[currentActiveIndex - 1].click();
                    tabsArr[currentActiveIndex - 1].focus();
                }
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                showSubMenu(currentTabKey);
            }
        }
    });
    // ----------- تحريك المنيو بالماوس (Drag & Move) -----------
(function() {
    const menu = document.querySelector('.mod-menu-container');
    const header = menu.querySelector('.mod-menu-header');
    let isDragging = false, offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        // احسب الفرق بين مكان الماوس وأعلى يسار المنيو
        offsetX = e.clientX - menu.getBoundingClientRect().left;
        offsetY = e.clientY - menu.getBoundingClientRect().top;
        menu.style.transition = "none";
        document.body.style.userSelect = "none";
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            menu.style.left = x + "px";
            menu.style.top = y + "px";
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        menu.style.transition = "";
        document.body.style.userSelect = "";
    });
})();

    // القائمة الفرعية
    function showSubMenu(tabKey) {
        removeSubmenu();

        const submenu = document.createElement('div');
        submenu.className = 'submenu-overlay';

        // صورة الهيدر فقط (بدون نص أو ترويسة)
        const submenuHeaderBanner = document.createElement('div');
        submenuHeaderBanner.className = 'submenu-header-banner';
        const bannerImg = document.createElement('img');
        // استخدم نفس صورة القائمة الرئيسية
        bannerImg.src = headerBanner ? headerBanner.src : '';
        bannerImg.alt = 'banner';
        submenuHeaderBanner.appendChild(bannerImg);
        submenu.appendChild(submenuHeaderBanner);

        // خيارات القائمة (من الجدول حسب التبويب)
        const optionsList = document.createElement('ul');
        optionsList.className = 'submenu-options-list';
        const optionsArr = submenuMap[tabKey] || [];
        optionsArr.forEach((opt, i) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'submenu-option-btn';
            btn.tabIndex = 0;
            btn.innerHTML = `
                <span class="submenu-option-label">${opt.text}</span>
                ${opt.type === "toggle" ? createSwitch(opt.value, `toggle-${tabKey}-${i}`) : ""}
            `;
            if (i === 0) btn.classList.add('active');
            btn.dataset.index = i;
            li.appendChild(btn);
            optionsList.appendChild(li);
        });
        submenu.appendChild(optionsList);

        // الفوتر
        if (footer) {
            const submenuFooter = footer.cloneNode(true);
            submenuFooter.classList.add('submenu-footer');
            submenu.appendChild(submenuFooter);
        }

        document.body.appendChild(submenu);
        document.addEventListener('keydown', submenuKeyHandler);
        submenu.querySelector('.submenu-option-btn.active').focus();

        menuContainer.style.display = 'none';

        // تفعيل/تعطيل السويتش عند الضغط عليه (بالماوس)
        submenu.querySelectorAll('.switch input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', function() {
                // هنا ممكن تضيف كود يحفظ القيمة أو يرسلها للباك إند
            });
        });
    }

    function createSwitch(checked, id) {
        return `
          <label class="switch">
            <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
            <span class="slider"></span>
          </label>
        `;
    }

    function removeSubmenu() {
        const existing = document.querySelector('.submenu-overlay');
        if (existing) {
            existing.remove();
            document.removeEventListener('keydown', submenuKeyHandler);
            menuContainer.style.display = '';
            const currentTab = document.querySelector('.tab-btn.active');
            if (currentTab) currentTab.focus();
        }
    }

    // تنقل الأسهم داخل القائمة الفرعية
    function submenuKeyHandler(e) {
        const submenu = document.querySelector('.submenu-overlay');
        if (!submenu) return;
        const options = Array.from(submenu.querySelectorAll('.submenu-option-btn'));
        let activeIndex = options.findIndex(btn => btn.classList.contains('active'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIndex < options.length - 1) {
                options[activeIndex].classList.remove('active');
                options[activeIndex + 1].classList.add('active');
                options[activeIndex + 1].focus();
            }
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIndex > 0) {
                options[activeIndex].classList.remove('active');
                options[activeIndex - 1].classList.add('active');
                options[activeIndex - 1].focus();
            }
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (activeIndex !== -1) {
                // إذا كان الخيار فيه سويتش، فعل السويتش
                const switchInput = options[activeIndex].querySelector('input[type="checkbox"]');
                if (switchInput) switchInput.checked = !switchInput.checked;
            }
        }
        if (e.key === 'ArrowLeft' || e.key === 'Escape') {
            removeSubmenu();
        }   }
        // أضف هذا في نهاية script.js
const menu = document.getElementById('mainMenu');
const toggleBtn = document.getElementById('toggleMenuBtn');
toggleBtn.addEventListener('click', function() {
    if(menu.style.display === 'none') {
        menu.style.display = '';
    } else {
        menu.style.display = 'none';
    }
});
