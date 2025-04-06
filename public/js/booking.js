// 预订系统状态
const bookingState = {
    checkInDate: null,
    checkOutDate: null,
    guestsCount: 2,
    selectedRoom: null,
    roomData: null,
    totalNights: 0,
    totalPrice: 0,
    formData: {
        name: '',
        phone: '',
        email: '',
        arrivalTime: '',
        specialRequests: ''
    }
};

// 调试模式 (打开可以在控制台看到更多日志)
const DEBUG = false;

// 调试日志函数
function debugLog(message, data) {
    if (DEBUG) {
        if (data) {
            console.log(`[DEBUG] ${message}`, data);
        } else {
            console.log(`[DEBUG] ${message}`);
        }
    }
}

// DOM 元素 - 初始化為空對象
let elements = {};

// 初始化DOM元素引用函數
function initDOMElements() {
    console.log('初始化DOM元素引用');
    
    // 獲取步驟元素
    const step1Content = document.querySelector('.booking-step.step-1') || document.querySelector('.booking-step:nth-child(1)');
    const step2Content = document.querySelector('.booking-step.step-2') || document.querySelector('.booking-step:nth-child(2)');
    const step3Content = document.querySelector('.booking-step.step-3') || document.querySelector('.booking-step:nth-child(3)');
    const step4Content = document.querySelector('.booking-step.step-4') || document.querySelector('.booking-step:nth-child(4)');
    
    // 如果找到的步驟元素沒有對應的類名，嘗試添加
    if (step1Content && !step1Content.classList.contains('step-1')) step1Content.classList.add('step-1');
    if (step2Content && !step2Content.classList.contains('step-2')) step2Content.classList.add('step-2');
    if (step3Content && !step3Content.classList.contains('step-3')) step3Content.classList.add('step-3');
    if (step4Content && !step4Content.classList.contains('step-4')) step4Content.classList.add('step-4');
    
    // 重新獲取，確保類名已更新
    elements = {
        // 步骤元素
        steps: {
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3'),
            step4: document.getElementById('step4'),
            step1Content: document.querySelector('.booking-step.step-1'),
            step2Content: document.querySelector('.booking-step.step-2'),
            step3Content: document.querySelector('.booking-step.step-3'),
            step4Content: document.querySelector('.booking-step.step-4')
        },
        // 第一步：日期选择
        dateRange: document.getElementById('date-range'),
        dateRangeClear: document.getElementById('date-range-clear'),
        guestsCount: document.getElementById('guests-count'),
        decreaseGuests: document.getElementById('decrease-guests'),
        increaseGuests: document.getElementById('increase-guests'),
        nightsSummary: document.getElementById('nights-summary'),
        toStep2Button: document.getElementById('to-step2'),
        // 第二步：房型选择
        loadingRooms: document.getElementById('loading-rooms'),
        availableRooms: document.getElementById('available-rooms'),
        roomSelectionError: document.getElementById('room-selection-error'),
        backToStep1Button: document.getElementById('back-to-step1'),
        toStep3Button: document.getElementById('to-step3'),
        // 第三步：客人信息
        bookingSummary: document.getElementById('booking-summary'),
        guestInfoForm: document.getElementById('guest-info-form'),
        guestName: document.getElementById('guest-name'),
        guestPhone: document.getElementById('guest-phone'),
        guestEmail: document.getElementById('guest-email'),
        arrivalTime: document.getElementById('arrival-time'),
        specialRequests: document.getElementById('special-requests'),
        acceptPolicy: document.getElementById('accept-policy'),
        policyLink: document.getElementById('policy-link'),
        formError: document.getElementById('form-error'),
        backToStep2Button: document.getElementById('back-to-step2'),
        toStep4Button: document.getElementById('to-step4'),
        // 第四步：完成预订
        bookingSuccess: document.getElementById('booking-success'),
        bookingError: document.getElementById('booking-error'),
        submitLoading: document.getElementById('submit-loading'),
        finalBookingDetails: document.getElementById('final-booking-details'),
        retryBooking: document.getElementById('retry-booking'),
        bookNowButton: document.getElementById('book-now-button'),
        navigationButtons: document.getElementById('navigation-buttons')
    };
    
    console.log('步驟元素初始化結果:', {
        step1Content: elements.steps.step1Content,
        navigationButtons: elements.navigationButtons,
        bookNowButton: elements.bookNowButton
    });
    
    return elements;
}

// 全局變量追踪當前步驟
let currentStep = 1;

// 初始化日期选择器
function initDatePickers() {
    // 确保加载指示器显示
    const loadingRoomData = document.getElementById('loading-room-data');
    const dateSelectionContainer = document.getElementById('date-selection-container');
    
    if (loadingRoomData) {
        loadingRoomData.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
    }
    
    if (dateSelectionContainer) {
        dateSelectionContainer.style.cssText = 'display: none !important;';
    }
    
    // 获取当前日期
    const today = new Date();
    
    // 創建日曆底部按鈕區域
    const calendarFooter = document.createElement('div');
    calendarFooter.className = 'flatpickr-footer';
    calendarFooter.innerHTML = `
        <button type="button" class="flatpickr-clear-btn">清除日期</button>
        <button type="button" class="flatpickr-close-btn">關閉</button>
    `;
    
    // 預加載房型可用性數據
    loadAvailabilityData(today, 60)
    .then(availabilityData => {
        debugLog('已加載房型可用性數據', availabilityData);
        
        // 確保等待至少1.5秒後再隱藏加載指示器（更好的用戶體驗）
        setTimeout(() => {
            // 隱藏加載指示器，顯示日期選擇界面
            if (loadingRoomData) {
                loadingRoomData.style.display = 'none';
            }
            
            if (dateSelectionContainer) {
                dateSelectionContainer.style.display = 'block';
            }
            
            // 初始化日期選擇器
            initFlatpickr(availabilityData, calendarFooter);
        }, 1500);
    })
    .catch(error => {
        console.error('加載房型可用性數據失敗:', error);
        
        // 確保等待至少1.5秒後再隱藏加載指示器
        setTimeout(() => {
            // 即使加載失敗也顯示日期選擇界面
            if (loadingRoomData) {
                loadingRoomData.style.display = 'none';
            }
            
            if (dateSelectionContainer) {
                dateSelectionContainer.style.display = 'block';
            }
            
            // 使用空數據初始化日期選擇器
            initFlatpickr({}, calendarFooter);
        }, 1500);
    });
}

// 计算入住晚数
function calculateNights(startDate, endDate) {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// 更新日期选择标题
function updateDateSelectionTitle(nights) {
    const dateSelectionTitle = document.querySelector('.date-selection-title');
    if (dateSelectionTitle) {
        dateSelectionTitle.textContent = `${nights}晚`;
        dateSelectionTitle.style.display = 'block';
    } else {
        const dateContainer = document.querySelector('.date-picker-container');
        const titleElem = document.createElement('div');
        titleElem.className = 'date-selection-title';
        titleElem.textContent = `${nights}晚`;
        dateContainer.parentNode.insertBefore(titleElem, dateContainer);
    }
}

// 預載房型可用性數據
function loadAvailabilityData(startDate, numberOfDays) {
    // 创建结束日期 (开始日期 + numberOfDays天)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + numberOfDays);
    
    // 格式化日期
    const checkIn = formatDateYMD(startDate);
    const checkOut = formatDateYMD(endDate);
    
    // 控制台输出调试信息
    console.log(`预加载房型可用性数据: 开始日期=${checkIn}, 结束日期=${checkOut}`);
    
    // 返回Promise
    return fetch(`https://script.google.com/macros/s/AKfycbw1_qm99-hav0GKPTcZNdlOawoUU2o62w5gS2Jv5DbLdTepcpXspuAcsEfp7aLz7sbB/exec?action=checkAvailabilityCalendar&checkIn=${checkIn}&checkOut=${checkOut}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.availabilityData) {
                return data.availabilityData;
            } else {
                console.error('获取房型可用性数据出错:', data.error);
                return {};
            }
        })
        .catch(error => {
            console.error('API调用错误:', error);
            return {};
        });
}

// 更新日期单元格，显示房型可用性
function updateDayElement(dayElem, dateStr, availabilityData) {
    // 检查是否有该日期的可用性数据
    if (availabilityData && availabilityData[dateStr]) {
        const dateData = availabilityData[dateStr];
        
        // 创建显示可用性的元素
        const availabilityElem = document.createElement('div');
        availabilityElem.className = 'room-availability-indicator';
        
        let content = '';
        let allRoomsUnavailable = true;
        
        // 检查不同房型的可用性
        if (dateData.LAO_S !== undefined) {
            const available = parseInt(dateData.LAO_S);
            if (available > 0) {
                content += `<span class="std-room">${available}</span>`;
                allRoomsUnavailable = false;
            } else {
                content += `<span class="no-room">0</span>`;
            }
        }
        
        if (dateData.LAO_L !== undefined) {
            const available = parseInt(dateData.LAO_L);
            if (available > 0) {
                content += `<span class="lux-room">${available}</span>`;
                allRoomsUnavailable = false;
            } else {
                content += `<span class="no-room">0</span>`;
            }
        }
        
        if (content) {
            availabilityElem.innerHTML = content;
            dayElem.appendChild(availabilityElem);
            
            // 如果所有房型都没有可用房间，则添加禁用样式
            if (allRoomsUnavailable) {
                dayElem.classList.add('flatpickr-disabled');
            }
        }
    }
}

// 更新住宿天数摘要
function updateNightsSummary() {
    const { checkInDate, checkOutDate, guestsCount } = bookingState;
    
    if (checkInDate && checkOutDate) {
        // 计算住宿天数
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // 更新状态
        bookingState.totalNights = nights;
        
        // 更新摘要信息
        elements.nightsSummary.innerHTML = `
            <p>
                <strong>入住日期:</strong> ${formatDate(checkInDate)} | 
                <strong>退房日期:</strong> ${formatDate(checkOutDate)} | 
                <strong>住宿天数:</strong> ${nights}晚 | 
                <strong>入住人数:</strong> ${guestsCount}人
            </p>
        `;
    } else if (checkInDate) {
        elements.nightsSummary.innerHTML = `
            <p>
                <strong>入住日期:</strong> ${formatDate(checkInDate)} | 
                请选择退房日期
            </p>
        `;
    } else {
        elements.nightsSummary.innerHTML = `
            <p>请选择入住和退房日期</p>
        `;
    }
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}年${month}月${day}日`;
}

// 验证第一步
function validateStep1() {
    const { checkInDate, checkOutDate } = bookingState;
    
    if (checkInDate && checkOutDate) {
        elements.toStep2Button.disabled = false;
    } else {
        elements.toStep2Button.disabled = true;
    }
}

// 加载可用房型
function loadAvailableRooms() {
    // 显示加载指示器
    if (elements.loadingRooms) {
        elements.loadingRooms.style.display = 'flex';
    }
    
    if (elements.availableRooms) {
        elements.availableRooms.innerHTML = '';
    }
    
    if (elements.roomSelectionError) {
        elements.roomSelectionError.style.display = 'none';
    }
    
    // 重置选中的房型
    bookingState.selectedRoom = null;
    
    const checkInDateStr = formatDateYMD(bookingState.checkInDate);
    const checkOutDateStr = formatDateYMD(bookingState.checkOutDate);
    
    // API端點
    const apiEndpoint = 'https://script.google.com/macros/s/AKfycbw1_qm99-hav0GKPTcZNdlOawoUU2o62w5gS2Jv5DbLdTepcpXspuAcsEfp7aLz7sbB/exec';
    
    // 使用純 fetch 方式獲取數據（使用 no-cors 模式）
    console.log(`獲取房型數據：${checkInDateStr} 至 ${checkOutDateStr}`);
    
    // 創建URL
    const apiUrl = `${apiEndpoint}?action=checkAvailability&checkIn=${checkInDateStr}&checkOut=${checkOutDateStr}`;
    
    // 使用傳統XMLHttpRequest來發送請求，避免跨域問題
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    
    // 設置超時時間
    xhr.timeout = 10000; // 10秒超時
    
    // 監聽載入完成事件
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
            try {
                // 嘗試解析JSON響應
                const data = JSON.parse(xhr.responseText);
                processAvailabilityData(data);
            } catch (e) {
                console.error('解析房型數據失敗:', e);
                handleApiError();
            }
        } else {
            console.error('API請求失敗:', xhr.status);
            handleApiError();
        }
    };
    
    // 監聽錯誤事件
    xhr.onerror = function() {
        console.error('API請求錯誤');
        handleApiError();
    };
    
    // 監聽超時事件
    xhr.ontimeout = function() {
        console.error('API請求超時');
        handleApiError();
    };
    
    // 發送請求
    try {
        xhr.send();
    } catch (e) {
        console.error('發送API請求時出錯:', e);
        handleApiError();
    }
    
    // API錯誤處理函數
    function handleApiError() {
        // 隱藏加載指示器
        if (elements.loadingRooms) {
            elements.loadingRooms.style.display = 'none';
        }
        
        // 顯示錯誤信息
        if (elements.availableRooms) {
            elements.availableRooms.innerHTML = `
                <div class="api-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>無法獲取房型數據</h3>
                    <p>很抱歉，無法連接到伺服器獲取房型信息。</p>
                    <p>請稍後再試，或直接聯絡我們預訂：</p>
                    <p class="contact"><i class="fas fa-phone"></i> +886 12345678</p>
                    <button id="retry-load-rooms" class="retry-btn">重試</button>
                </div>
            `;
            
            // 添加重試按鈕事件
            const retryButton = document.getElementById('retry-load-rooms');
            if (retryButton) {
                retryButton.addEventListener('click', loadAvailableRooms);
            }
        }
    }
    
    // 處理可用性數據的函數
    function processAvailabilityData(data) {
        // 隱藏加載指示器
        if (elements.loadingRooms) {
            elements.loadingRooms.style.display = 'none';
        }
        
        if (data.success && data.availability && Array.isArray(data.availability)) {
            console.log('獲取到房型數據:', data.availability);
            
            // 保存可用房型數據
            const enhancedRooms = enhanceRoomData(data.availability);
            bookingState.roomData = enhancedRooms;
            
            // 過濾可用房型
            const availableRooms = filterAvailableRooms(enhancedRooms);
            
            if (availableRooms.length === 0) {
                // 沒有可用房型
                if (elements.availableRooms) {
                    elements.availableRooms.innerHTML = `
                        <div class="no-rooms-message">
                            <p>該日期範圍內沒有可用房型</p>
                            <p>請嘗試選擇其他日期</p>
                        </div>
                    `;
                }
            } else {
                // 渲染可用房型列表
                renderAvailableRooms(availableRooms);
            }
        } else {
            console.error('獲取可用房型失敗:', data.error || '未知錯誤');
            
            if (elements.availableRooms) {
                elements.availableRooms.innerHTML = `
                    <div class="no-rooms-message">
                        <p>獲取可用房型時發生錯誤</p>
                        <p>請稍後重試</p>
                    </div>
                `;
            }
        }
    }
}

function formatDateYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 过滤可用房型
function filterAvailableRooms(rooms) {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    // 過濾出有可用房間的房型
    return rooms.filter(room => room.available > 0);
}

// 渲染可用房型
function renderAvailableRooms(rooms) {
    // 檢查DOM元素和房間數據是否有效
    if (!elements.availableRooms || !rooms || !Array.isArray(rooms)) {
        console.error('無法渲染房間：元素不存在或房間數據無效');
        return;
    }
    
    // 判断是否有可用房型
    if (rooms.length === 0) {
        elements.availableRooms.innerHTML = `
            <div class="no-rooms-message">
                <p>抱歉，沒有符合您要求的房型可供預訂。請嘗試調整入住日期。</p>
            </div>
        `;
        return;
    }
    
    // 更新状态
    bookingState.roomData = rooms;
    
    // 生成房型卡片HTML
    const roomsHTML = rooms.map(room => {
        return `
            <div class="room-card" data-room-id="${room.id}">
                <div class="room-image">
                    <img src="${room.imageUrl || './assets/img/room-placeholder.jpg'}" alt="${room.name}" loading="lazy">
                </div>
                <div class="room-card-header">
                    <h3>${room.name}</h3>
                </div>
                <div class="room-card-body">
                    <ul class="room-features">
                        ${room.features.map(feature => `
                            <li><i class="${feature.icon}"></i> ${feature.text}</li>
                        `).join('')}
                    </ul>
                    <p class="room-price">NT$ ${room.price} /晚</p>
                    <p class="room-availability">${room.available}間可用</p>
                </div>
            </div>
        `;
    }).join('');
    
    // 更新DOM
    elements.availableRooms.innerHTML = roomsHTML;
    
    // 添加房型选择事件监听
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            // 移除其他卡片的选中状态
            roomCards.forEach(c => c.classList.remove('selected'));
            
            // 添加当前卡片的选中状态
            card.classList.add('selected');
            
            // 更新选中的房型
            const roomId = card.getAttribute('data-room-id');
            bookingState.selectedRoom = roomId;
            
            // 计算总价
            calculateTotalPrice();
            
            // 激活下一步按钮
            elements.toStep3Button.disabled = false;
            
            // 隐藏错误信息
            if (elements.roomSelectionError) {
                elements.roomSelectionError.style.display = 'none';
            }
        });
    });
}

// 计算总价
function calculateTotalPrice() {
    const { selectedRoom, totalNights, roomData } = bookingState;
    
    // 如果尚未选择房型或尚未计算住宿天数，则返回
    if (!selectedRoom || totalNights === 0) {
        return;
    }
    
    // 找到选中的房型
    const room = roomData.find(r => r.id === selectedRoom);
    
    // 计算总价
    const totalPrice = room.price * totalNights;
    
    // 更新状态
    bookingState.totalPrice = totalPrice;
}

// 更新预订摘要
function updateBookingSummary() {
    const { 
        checkInDate, 
        checkOutDate, 
        totalNights, 
        guestsCount, 
        selectedRoom, 
        totalPrice,
        roomData
    } = bookingState;
    
    // 找到选中的房型
    const room = roomData.find(r => r.id === selectedRoom);
    
    // 生成摘要HTML
    const summaryHTML = `
        <h3 class="booking-summary-title">预订详情</h3>
        <div class="booking-summary-item">
            <span>房型:</span>
            <span>${room.name}</span>
        </div>
        <div class="booking-summary-item">
            <span>入住日期:</span>
            <span>${formatDate(checkInDate)}</span>
        </div>
        <div class="booking-summary-item">
            <span>退房日期:</span>
            <span>${formatDate(checkOutDate)}</span>
        </div>
        <div class="booking-summary-item">
            <span>住宿天数:</span>
            <span>${totalNights}晚</span>
        </div>
        <div class="booking-summary-item">
            <span>入住人数:</span>
            <span>${guestsCount}人</span>
        </div>
        <div class="booking-summary-item">
            <span>每晚价格:</span>
            <span>NT$ ${room.price}</span>
        </div>
        <div class="booking-summary-total">
            <span>总价:</span>
            <span>NT$ ${totalPrice}</span>
        </div>
    `;
    
    // 更新DOM
    elements.bookingSummary.innerHTML = summaryHTML;
}

// 验证表单
function validateForm() {
    const name = elements.guestName.value.trim();
    const phone = elements.guestPhone.value.trim();
    const email = elements.guestEmail.value.trim();
    const acceptPolicy = elements.acceptPolicy.checked;
    
    // 检查必填字段是否已填写
    if (!name || !phone || !email || !acceptPolicy) {
        elements.formError.style.display = 'block';
        return false;
    }
    
    // 检查电子邮件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        elements.formError.innerHTML = '<p>请输入有效的电子邮箱地址</p>';
        elements.formError.style.display = 'block';
        return false;
    }
    
    // 隐藏错误信息
    elements.formError.style.display = 'none';
    
    // 更新表单数据
    bookingState.formData = {
        name: name,
        phone: phone,
        email: email,
        arrivalTime: elements.arrivalTime.value,
        specialRequests: elements.specialRequests.value.trim()
    };
    
    return true;
}

// 提交预订
function submitBooking() {
    // 檢查必要元素是否存在
    if (!elements.bookingSuccess || !elements.bookingError || !elements.submitLoading) {
        console.error('提交預訂失敗：缺少必要的DOM元素');
        return;
    }
    
    // 显示加载动画
    elements.bookingSuccess.style.display = 'none';
    elements.bookingError.style.display = 'none';
    elements.submitLoading.style.display = 'flex';
    
    // 获取选中的房型数据
    const selectedRoomData = bookingState.roomData.find(r => r.id === bookingState.selectedRoom);
    if (!selectedRoomData) {
        console.error('提交預訂失敗：找不到選中的房型數據');
        elements.submitLoading.style.display = 'none';
        elements.bookingError.style.display = 'block';
        return;
    }
    
    // 准备要发送到Google Sheets的数据
    const bookingData = {
        booking_id: generateBookingId(),
        booking_date: formatDate(new Date()),
        room_id: bookingState.selectedRoom,
        room_name: selectedRoomData.name,
        check_in_date: formatDate(bookingState.checkInDate),
        check_out_date: formatDate(bookingState.checkOutDate),
        nights: bookingState.totalNights,
        guests: bookingState.guestsCount,
        total_price: bookingState.totalPrice,
        guest_name: bookingState.formData.name,
        guest_phone: bookingState.formData.phone,
        guest_email: bookingState.formData.email,
        arrival_time: bookingState.formData.arrivalTime,
        special_requests: bookingState.formData.specialRequests,
        status: '待確認'
    };
    
    // API端點
    const apiEndpoint = 'https://script.google.com/macros/s/AKfycbw1_qm99-hav0GKPTcZNdlOawoUU2o62w5gS2Jv5DbLdTepcpXspuAcsEfp7aLz7sbB/exec';
    
    // 使用XMLHttpRequest發送數據
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiEndpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // 設置超時時間
        xhr.timeout = 15000; // 15秒超時
        
        // 處理回應
        xhr.onload = function() {
            // 隱藏加載動畫
            elements.submitLoading.style.display = 'none';
            
            if (xhr.status >= 200 && xhr.status < 400) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success) {
                        // 顯示成功信息
                        elements.bookingSuccess.style.display = 'block';
                        
                        // 使用返回的bookingId更新bookingData
                        if (response.bookingId) {
                            bookingData.booking_id = response.bookingId;
                        }
                        
                        // 更新最終預訂詳情
                        updateFinalBookingDetails(bookingData);
                    } else {
                        // 顯示錯誤信息
                        elements.bookingError.style.display = 'block';
                        
                        // 顯示具體錯誤信息
                        if (response.error && elements.bookingError.querySelector('.error-message')) {
                            elements.bookingError.querySelector('.error-message').textContent = `錯誤：${response.error}`;
                        } else if (response.error) {
                            const errorElement = document.createElement('p');
                            errorElement.className = 'error-message';
                            errorElement.textContent = `錯誤：${response.error}`;
                            elements.bookingError.appendChild(errorElement);
                        }
                    }
                } catch (e) {
                    console.error('解析響應失敗:', e);
                    handleDirectSubmitSuccess(bookingData);
                }
            } else {
                // 當接收到非2xx狀態碼時，嘗試讓訂單作為臨時成功處理
                if (xhr.status === 0) {
                    // 可能是CORS問題，嘗試假設成功提交
                    console.warn('接收到空狀態碼響應，可能是CORS問題，嘗試直接處理預訂');
                    handleDirectSubmitSuccess(bookingData);
                } else {
                    console.error('伺服器響應錯誤:', xhr.status, xhr.statusText);
                    handleBookingError();
                }
            }
        };
        
        // 處理錯誤
        xhr.onerror = function() {
            console.error('預訂提交網絡錯誤');
            // 當出現網絡錯誤，我們仍然嘗試讓訂單成功
            handleDirectSubmitSuccess(bookingData);
        };
        
        // 處理超時
        xhr.ontimeout = function() {
            console.error('預訂提交超時');
            handleDirectSubmitSuccess(bookingData);
        };
        
        // 日誌記錄將要發送的數據
        console.log('準備提交預訂數據:', {
            action: 'submitBooking',
            ...bookingData
        });
        
        // 發送請求
        xhr.send(JSON.stringify({
            action: 'submitBooking',
            ...bookingData
        }));
    } catch (error) {
        console.error('預訂提交錯誤:', error);
        handleDirectSubmitSuccess(bookingData);
    }
}

// 直接處理預訂成功函數（當API提交失敗但我們仍想讓用戶體驗到預訂成功）
function handleDirectSubmitSuccess(bookingData) {
    // 隱藏加載動畫
    if (elements.submitLoading) {
        elements.submitLoading.style.display = 'none';
    }
    
    // 顯示成功信息
    if (elements.bookingSuccess) {
        elements.bookingSuccess.style.display = 'block';
        
        // 顯示警告信息（預訂尚未確認）
        const warningElement = document.createElement('div');
        warningElement.className = 'booking-warning';
        warningElement.innerHTML = `
            <p class="warning-message">
                <i class="fas fa-exclamation-triangle"></i>
                由於連接問題，您的預訂資料尚未發送到我們的系統。請聯絡我們確認您的預訂。
            </p>
        `;
        elements.bookingSuccess.insertBefore(warningElement, elements.bookingSuccess.querySelector('.booking-details'));
        
        // 更新最終預訂詳情
        updateFinalBookingDetails(bookingData);
    }
}

// 處理預訂錯誤的輔助函數
function handleBookingError() {
    // 隱藏加載動畫
    if (elements.submitLoading) {
        elements.submitLoading.style.display = 'none';
    }
    
    // 顯示錯誤信息
    if (elements.bookingError) {
        elements.bookingError.style.display = 'block';
        
        // 添加錯誤詳情
        if (elements.bookingError.querySelector('.error-message')) {
            elements.bookingError.querySelector('.error-message').textContent = `提交預訂時發生錯誤。請稍後重試。`;
        } else {
            const errorElement = document.createElement('p');
            errorElement.className = 'error-message';
            errorElement.textContent = `提交預訂時發生錯誤。請稍後重試。`;
            elements.bookingError.appendChild(errorElement);
        }
    }
}

// 生成预订ID
function generateBookingId() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BK${timestamp}${random}`;
}

// 更新最终预订详情
function updateFinalBookingDetails(bookingData) {
    const detailsHTML = `
        <h3>预订号: ${bookingData.booking_id}</h3>
        <p><strong>房型:</strong> ${bookingData.room_name}</p>
        <p><strong>入住日期:</strong> ${bookingData.check_in_date}</p>
        <p><strong>退房日期:</strong> ${bookingData.check_out_date}</p>
        <p><strong>住宿天数:</strong> ${bookingData.nights}晚</p>
        <p><strong>入住人数:</strong> ${bookingData.guests}人</p>
        <p><strong>总价:</strong> NT$ ${bookingData.total_price}</p>
        <p><strong>预订状态:</strong> ${bookingData.status}</p>
    `;
    
    elements.finalBookingDetails.innerHTML = detailsHTML;
}

// 初始化步驟導航
function initStepNavigation() {
    // 設置初始步驟
    goToStep(1);
}

// 更新按鈕狀態
function updateButtonState() {
    // 根據當前步驟設置按鈕狀態
    switch (currentStep) {
        case 1:
            // 第一步：只有選擇了日期才能繼續
            if (elements.toStep2Button) {
                elements.toStep2Button.disabled = !bookingState.checkInDate || !bookingState.checkOutDate;
            }
            break;
        case 2:
            // 第二步：只有選擇了房型才能繼續
            if (elements.toStep3Button) {
                elements.toStep3Button.disabled = !bookingState.selectedRoom;
            }
            break;
        case 3:
            // 第三步：表單驗證在點擊按鈕時進行
            if (elements.toStep4Button) {
                elements.toStep4Button.disabled = false;
            }
            break;
        case 4:
            // 第四步：沒有下一步按鈕
            break;
    }
}

// 跳轉到指定步驟
function goToStep(stepNumber) {
    // 檢查步驟元素
    const steps = document.querySelectorAll('.booking-step');
    if (steps.length === 0) {
        console.error('找不到步驟元素，無法切換步驟');
        return;
    }
    
    // 檢查目標步驟是否存在
    let targetStep = document.querySelector(`.booking-step.step-${stepNumber}`);
    
    // 如果找不到，嘗試使用索引
    if (!targetStep && steps.length >= stepNumber) {
        targetStep = steps[stepNumber - 1];
    }
    
    if (!targetStep) {
        console.error(`找不到目標步驟 ${stepNumber}`);
        return;
    }
    
    // 隱藏所有步驟
    steps.forEach(step => {
        step.style.display = 'none';
    });
    
    // 顯示指定步驟
    targetStep.style.display = 'block';
    
    // 更新進度條
    const progressSteps = document.querySelectorAll('.progress-step');
    if (progressSteps.length > 0) {
        // 更新進度條狀態
        progressSteps.forEach((step, index) => {
            // 清除所有狀態
            step.classList.remove('active', 'completed');
            
            // 索引+1等於步驟號
            const stepIdx = index + 1;
            
            // 將當前步驟標記為active
            if (stepIdx === stepNumber) {
                step.classList.add('active');
            } 
            // 將之前的步驟標記為completed
            else if (stepIdx < stepNumber) {
                step.classList.add('completed');
            }
        });
    }
    
    // 更新當前步驟
    currentStep = stepNumber;
    
    // 管理導航按鈕顯示
    const navButtons = {
        backToStep1: document.getElementById('back-to-step1'),
        toStep2: document.getElementById('to-step2'),
        backToStep2: document.getElementById('back-to-step2'),
        toStep3: document.getElementById('to-step3'),
        toStep4: document.getElementById('to-step4'),
        bookNowButton: document.getElementById('book-now-button'),
        navigationButtons: document.getElementById('navigation-buttons')
    };
    
    // 隱藏所有導航按鈕
    Object.entries(navButtons).forEach(([key, button]) => {
        if (button && key !== 'bookNowButton' && key !== 'navigationButtons') {
            button.style.display = 'none';
        }
    });
    
    // 根據當前步驟顯示按鈕
    switch (stepNumber) {
        case 1:
            if (navButtons.toStep2) navButtons.toStep2.style.display = 'block';
            break;
        case 2:
            if (navButtons.backToStep1) navButtons.backToStep1.style.display = 'block';
            if (navButtons.toStep3) navButtons.toStep3.style.display = 'block';
            break;
        case 3:
            if (navButtons.backToStep2) navButtons.backToStep2.style.display = 'block';
            if (navButtons.toStep4) navButtons.toStep4.style.display = 'block';
            break;
    }
    
    // 設置導航和預訂按鈕容器的顯示狀態
    if (navButtons.bookNowButton && navButtons.navigationButtons) {
        if (stepNumber === 4) {
            navButtons.bookNowButton.style.display = 'block';
            navButtons.navigationButtons.style.display = 'none';
        } else {
            navButtons.bookNowButton.style.display = 'none';
            navButtons.navigationButtons.style.display = 'flex';
        }
    }
    
    // 控制按鈕可用性
    updateButtonState();
}

// 房型數據擴展函數 - 添加默認圖片和特性
function enhanceRoomData(rooms) {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    // 定義房型特定圖片
    const roomImages = {
        'LAO_S': './assets/img/standard-room.jpg',
        'LAO_L': './assets/img/deluxe-room.jpg'
    };
    
    // 定義房型特定特性
    const roomFeatures = {
        'LAO_S': [
            { icon: 'fas fa-user-friends', text: '2人入住' },
            { icon: 'fas fa-bed', text: '1張雙人床' },
            { icon: 'fas fa-bath', text: '獨立衛浴' },
            { icon: 'fas fa-wifi', text: '免費WiFi' }
        ],
        'LAO_L': [
            { icon: 'fas fa-users', text: '4人入住' },
            { icon: 'fas fa-bed', text: '2張雙人床' },
            { icon: 'fas fa-bath', text: '豪華衛浴' },
            { icon: 'fas fa-wifi', text: '免費WiFi' },
            { icon: 'fas fa-tv', text: '50吋電視' }
        ]
    };
    
    // 標準特性，用於沒有特定特性的房型
    const standardFeatures = [
        { icon: 'fas fa-user-friends', text: '標準入住' },
        { icon: 'fas fa-bed', text: '舒適床鋪' },
        { icon: 'fas fa-bath', text: '衛浴設施' },
        { icon: 'fas fa-wifi', text: '免費WiFi' }
    ];
    
    // 為每個房間添加圖片和特性
    return rooms.map(room => ({
        ...room,
        image: room.image || roomImages[room.id] || './assets/img/placeholder-room.jpg',
        imageUrl: room.imageUrl || roomImages[room.id] || './assets/img/placeholder-room.jpg',
        features: room.features && room.features.length > 0 ? 
                 room.features : 
                 roomFeatures[room.id] || standardFeatures
    }));
}

// 应用初始化
function initApp() {
    try {
        // 確保DOM元素已初始化
        if (!elements.steps || !elements.steps.step1Content) {
            initDOMElements();
        }
        
        if (!elements.steps.step1Content) {
            return false;
        }
        
        initStepNavigation();
        initDatePickers();
        initEventListeners();
        
        return true;
    } catch (error) {
        console.error('初始化过程中发生错误:', error);
        return false;
    }
}

// 等待DOM加載完成
document.addEventListener('DOMContentLoaded', function() {
    // 先顯示加載指示器
    const loadingRoomData = document.getElementById('loading-room-data');
    const dateSelectionContainer = document.getElementById('date-selection-container');
    
    if (loadingRoomData) {
        loadingRoomData.style.cssText = 'display: flex !important; visibility: visible; opacity: 1;';
    }
    
    if (dateSelectionContainer) {
        dateSelectionContainer.style.display = 'none';
    }
    
    // 檢查DOM元素是否存在
    let retryCount = 0;
    const maxRetries = 5;
    
    function checkAndInit() {
        const stepElements = document.querySelectorAll('.booking-step');
        
        if (stepElements.length === 0 && retryCount < maxRetries) {
            // 如果找不到步驟元素，重試
            retryCount++;
            const timeout = retryCount * 200; // 每次增加等待時間
            setTimeout(checkAndInit, timeout);
            return;
        }
        
        // 檢查並修復步驟元素的class屬性
        if (stepElements.length > 0) {
            stepElements.forEach((el, index) => {
                const stepClass = `step-${index + 1}`;
                if (!el.classList.contains(stepClass)) {
                    el.classList.add(stepClass);
                }
            });
        }
        
        // 初始化應用
        initDOMElements();
        const success = initApp();
        
        if (!success && retryCount < maxRetries) {
            // 如果初始化失敗，重試
            retryCount++;
            const timeout = retryCount * 200;
            setTimeout(checkAndInit, timeout);
        }
    }
    
    // 確保加載指示器顯示一段時間
    setTimeout(function() {
        checkAndInit();
    }, 500);
});

// 初始化事件监听
function initEventListeners() {
    // 增减人数按钮
    if (elements.decreaseGuests && elements.guestsCount) {
        elements.decreaseGuests.addEventListener('click', () => {
            const currentCount = parseInt(elements.guestsCount.value);
            if (currentCount > 1) {
                elements.guestsCount.value = currentCount - 1;
                bookingState.guestsCount = currentCount - 1;
                updateNightsSummary();
            }
        });
    }
    
    if (elements.increaseGuests && elements.guestsCount) {
        elements.increaseGuests.addEventListener('click', () => {
            const currentCount = parseInt(elements.guestsCount.value);
            if (currentCount < 10) {
                elements.guestsCount.value = currentCount + 1;
                bookingState.guestsCount = currentCount + 1;
                updateNightsSummary();
            }
        });
    }
    
    // 步骤按钮
    if (elements.toStep2Button) {
        elements.toStep2Button.addEventListener('click', () => {
            // 加载可用房型
            loadAvailableRooms();
            
            // 显示第二步
            goToStep(2);
        });
    }
    
    if (elements.backToStep1Button) {
        elements.backToStep1Button.addEventListener('click', () => {
            goToStep(1);
        });
    }
    
    if (elements.toStep3Button) {
        elements.toStep3Button.addEventListener('click', () => {
            // 检查是否已选择房型
            if (!bookingState.selectedRoom) {
                if (elements.roomSelectionError) {
                    elements.roomSelectionError.style.display = 'block';
                }
                return;
            }
            
            // 更新预订摘要
            updateBookingSummary();
            
            // 显示第三步
            goToStep(3);
        });
    }
    
    if (elements.backToStep2Button) {
        elements.backToStep2Button.addEventListener('click', () => {
            goToStep(2);
        });
    }
    
    if (elements.toStep4Button) {
        elements.toStep4Button.addEventListener('click', () => {
            // 验证表单
            if (!validateForm()) {
                return;
            }
            
            // 提交预订
            submitBooking();
            
            // 显示第四步
            goToStep(4);
        });
    }
    
    if (elements.retryBooking) {
        elements.retryBooking.addEventListener('click', () => {
            // 重新提交预订
            submitBooking();
        });
    }
    
    // 添加返回首頁按鈕事件
    const backToHomeBtn = document.querySelector('.book-now-btn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
    
    // 监听来自父窗口的消息（房型选择）
    window.addEventListener('message', event => {
        if (event.data && event.data.type === 'select-room') {
            const roomType = event.data.roomType;
            
            // 如果当前不在第一步，则忽略
            if (currentStep !== 1) {
                return;
            }
            
            // 嘗試預選日期（今天和明天）
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // 模擬點擊日期輸入框以顯示日期選擇器
            if (elements.dateRange) {
                elements.dateRange.click();
                
                // 等待日期選擇器初始化完成
                setTimeout(() => {
                    // 選擇今天和明天作為入住和退房日期範圍
                    const datePicker = elements.dateRange._flatpickr;
                    if (datePicker) {
                        datePicker.setDate([today, tomorrow]);
                        
                        // 更新狀態
                        bookingState.checkInDate = today;
                        bookingState.checkOutDate = tomorrow;
                        updateNightsSummary();
                        validateStep1();
                        
                        // 跳轉到第二步
                        if (elements.toStep2Button) {
                            elements.toStep2Button.click();
                        }
                        
                        // 等待房型加載完成
                        setTimeout(() => {
                            // 查找匹配的房型
                            const roomCards = document.querySelectorAll('.room-card');
                            roomCards.forEach(card => {
                                const roomNameElem = card.querySelector('h3');
                                if (roomNameElem && roomNameElem.textContent === roomType) {
                                    // 模擬點擊該房型
                                    card.click();
                                }
                            });
                        }, 2000); // 給加載房型預留時間
                    }
                }, 500);
            }
        }
    });
}

// 初始化Flatpickr日期選擇器
function initFlatpickr(availabilityData, calendarFooter) {
    // 檢測是否為移動裝置
    const isMobile = window.innerWidth < 768;
    
    // 通用配置
    const datePickerConfig = {
        locale: 'zh',
        dateFormat: 'Y/m/d',
        disableMobile: true,
        showMonths: isMobile ? 1 : 2,
        mode: "range",
        animate: true,
        static: true,
        nextArrow: '<svg viewBox="0 0 32 32"><path fill="#222" d="m12 4 1.41 1.41L6.83 12H28v2H6.83l6.59 6.59L12 22 2 12l10-8z" transform="rotate(180 15 12)"></path></svg>',
        prevArrow: '<svg viewBox="0 0 32 32"><path fill="#222" d="m12 4 1.41 1.41L6.83 12H28v2H6.83l6.59 6.59L12 22 2 12l10-8z"></path></svg>',
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            // 创建日期数字的容器
            const dayNumberElem = document.createElement('span');
            dayNumberElem.className = 'dayNumber';
            dayNumberElem.textContent = dayElem.textContent;
            dayElem.textContent = '';
            dayElem.appendChild(dayNumberElem);
            
            // 获取当前日期
            const currentDate = new Date(dayElem.dateObj);
            const dateStr = formatDateYMD(currentDate);
            
            // 显示房型可用性
            updateDayElement(dayElem, dateStr, availabilityData);
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 0) {
                // 清空日期範圍
                elements.dateRange.value = '';
                
                // 更新状态
                bookingState.checkInDate = null;
                bookingState.checkOutDate = null;
                
                // 更新摘要
                updateNightsSummary();
                validateStep1();
                
                // 隱藏清除按鈕
                elements.dateRangeClear.style.display = 'none';
                
                // 隐藏日期选择标题
                const dateSelectionTitle = document.querySelector('.date-selection-title');
                if (dateSelectionTitle) {
                    dateSelectionTitle.style.display = 'none';
                }
                
                return;
            }
            
            if (selectedDates.length === 1) {
                // 只选择了入住日期
                const checkIn = selectedDates[0];
                
                // 更新入住日期
                bookingState.checkInDate = checkIn;
                elements.dateRange.value = formatDate(checkIn).replace('年', '/').replace('月', '/').replace('日', '') + ' - 選擇退房日期';
                
                // 显示清除按钮
                elements.dateRangeClear.style.display = 'flex';
                
            } else if (selectedDates.length === 2) {
                // 选择了入住和退房日期
                const checkIn = selectedDates[0];
                const checkOut = selectedDates[1];
                
                // 更新状态
                bookingState.checkInDate = checkIn;
                bookingState.checkOutDate = checkOut;
                
                // 更新输入框值
                const checkInStr = formatDate(checkIn).replace('年', '/').replace('月', '/').replace('日', '');
                const checkOutStr = formatDate(checkOut).replace('年', '/').replace('月', '/').replace('日', '');
                elements.dateRange.value = checkInStr + ' - ' + checkOutStr;
                
                // 显示清除按钮
                elements.dateRangeClear.style.display = 'flex';
                
                // 更新晚数标题
                const nights = calculateNights(checkIn, checkOut);
                updateDateSelectionTitle(nights);
                
                // 更新住宿天数摘要
                updateNightsSummary();
                
                // 验证步骤1
                validateStep1();
                
                // 自动关闭日历
                setTimeout(() => {
                    instance.close();
                }, 500);
            }
        },
        onOpen: function(selectedDates, dateStr, instance) {
            // 將底部按鈕添加到日曆
            if (!document.querySelector('.flatpickr-footer')) {
                const calendarContainer = instance.calendarContainer;
                calendarContainer.appendChild(calendarFooter);

                // 綁定底部按鈕事件
                calendarContainer.querySelector('.flatpickr-clear-btn').addEventListener('click', function() {
                    instance.clear();
                });
                
                calendarContainer.querySelector('.flatpickr-close-btn').addEventListener('click', function() {
                    instance.close();
                });
            }
            
            // 更新底部按鈕文本
            const clearBtn = instance.calendarContainer.querySelector('.flatpickr-clear-btn');
            const closeBtn = instance.calendarContainer.querySelector('.flatpickr-close-btn');
            clearBtn.textContent = '清除日期';
            closeBtn.textContent = '關閉';
            
            // 移動裝置上優化日曆容器
            if (window.innerWidth < 768) {
                instance.calendarContainer.classList.add('mobile-optimized');
                
                // 確保日曆容器在移動裝置上展開到最大寬度
                const rContainer = instance.calendarContainer.querySelector('.flatpickr-rContainer');
                if (rContainer) {
                    rContainer.style.width = '100%';
                }
                
                // 優化日曆天數容器
                const daysContainer = instance.calendarContainer.querySelector('.dayContainer');
                if (daysContainer) {
                    daysContainer.style.width = '100%';
                    daysContainer.style.minWidth = '100%';
                    daysContainer.style.maxWidth = '100%';
                }
                
                // 優化週天顯示
                const weekdays = instance.calendarContainer.querySelector('.flatpickr-weekdays');
                if (weekdays) {
                    weekdays.style.width = '100%';
                }
            }
        },
        onReady: function(selectedDates, dateStr, instance) {
            // 確保日曆置中對齊
            instance.calendarContainer.style.margin = '0 auto';
            
            // 修復日期指示器位置
            setTimeout(() => {
                const days = instance.calendarContainer.querySelectorAll('.flatpickr-day');
                days.forEach(day => {
                    const indicator = day.querySelector('.room-availability-indicator');
                    if (indicator) {
                        indicator.style.top = '28px';
                    }
                });
            }, 100);
        }
    };
    
    // 初始化日期範圍選擇器
    const datePicker = flatpickr(elements.dateRange, datePickerConfig);
    
    // 創建元素用於顯示晚數
    const dateContainer = document.querySelector('.date-picker-container');
    const nightsTitle = document.createElement('div');
    nightsTitle.className = 'date-selection-title';
    nightsTitle.style.display = 'none'; // 默認隱藏
    dateContainer.parentNode.insertBefore(nightsTitle, dateContainer);
    
    // 添加清除按鈕事件
    elements.dateRangeClear.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡，避免觸發日期選擇器
        datePicker.clear();
        elements.dateRangeClear.style.display = 'none';
    });
    
    // 監聽視窗大小變化，重新初始化日期選擇器
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== isMobile) {
            // 視窗大小跨越斷點，重新初始化日期選擇器
            datePicker.destroy();
            initDatePickers();
        }
    });
} 