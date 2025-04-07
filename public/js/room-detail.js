document.addEventListener('DOMContentLoaded', function() {
    // 獲取房型ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id') || 'standard'; // 默認為標準房型
    
    // 如果有房型ID，載入對應房型資訊
    if (roomId) {
        loadRoomDetails(roomId);
    }
    
    // 圖片畫廊功能
    setupGallery();
    
    // 設置預訂按鈕的href
    setupReserveButton(roomId);
});

// 房間狀態
const roomState = {
    roomId: '',
    price: 0
};

// 页面元素
const elements = {
    reserveRoomBtn: document.getElementById('reserve-room-btn')
};

/**
 * 載入房型詳細資訊
 */
function loadRoomDetails(roomId) {
    // 這裡可以透過API從後端獲取房型詳細資訊
    // 為了示範，我們使用模擬資料
    const roomData = {
        'standard': {
            name: '標準雙人房',
            price: 2800,
            capacity: '2位',
            beds: '1張大床',
            bath: '1間獨立衛浴',
            description: '舒適溫馨的雙人房，配備一張大床和現代化設施，適合情侶或單人入住。房間內陽光充足，面向美麗的花園景觀，是放鬆心情、享受寧靜時光的理想選擇。',
            images: [
                './assets/img/standard-room.jpg',
                './assets/img/room-detail-1.jpg',
                './assets/img/room-detail-2.jpg',
                './assets/img/room-detail-3.jpg',
                './assets/img/room-detail-4.jpg'
            ]
        },
        'deluxe': {
            name: '豪華家庭房',
            price: 4200,
            capacity: '4位',
            beds: '1張大床 + 2張單人床',
            bath: '1間獨立衛浴',
            description: '寬敞明亮的家庭房，配備一張大床和兩張單人床，適合家庭或朋友組合入住。房間設計時尚，配備齊全的設施，為您提供舒適的住宿體驗。',
            images: [
                './assets/img/deluxe-room.jpg',
                './assets/img/room-detail-1.jpg',
                './assets/img/room-detail-2.jpg',
                './assets/img/room-detail-3.jpg',
                './assets/img/room-detail-4.jpg'
            ]
        }
    };
    
    // 檢查房型是否存在
    if (!roomData[roomId]) {
        console.error('找不到對應的房型資訊');
        return;
    }
    
    // 更新頁面資訊
    const room = roomData[roomId];
    document.getElementById('room-name').textContent = room.name;
    document.getElementById('room-intro-title').textContent = `由寮 Laio經營的${room.name}`;
    document.getElementById('room-capacity').textContent = room.capacity;
    document.getElementById('room-beds').textContent = room.beds;
    document.getElementById('room-bath').textContent = room.bath;
    
    // 更新描述
    const descriptionElem = document.getElementById('room-description-text');
    if (descriptionElem && descriptionElem.querySelector('p')) {
        descriptionElem.querySelector('p').textContent = room.description;
    }
    
    // 更新主图
    document.getElementById('room-main-image').src = room.images[0];
    
    // 更新相册缩略图 - 瀑布流布局
    const galleryGrid = document.querySelector('.gallery-grid');
    
    // 清除旧的缩略图并保留主图
    const mainImage = document.querySelector('.gallery-main');
    const oldThumbnails = document.querySelectorAll('.gallery-thumb');
    oldThumbnails.forEach(thumb => thumb.remove());
    
    // 添加新的缩略图
    for (let i = 1; i < Math.min(room.images.length, 5); i++) {
        const imgElement = document.createElement('img');
        imgElement.src = room.images[i];
        imgElement.alt = `${room.name} 照片 ${i+1}`;
        imgElement.className = 'gallery-thumb';
        imgElement.setAttribute('data-index', i);
        galleryGrid.appendChild(imgElement);
    }
    
    // 儲存房間資訊
    roomState.roomId = roomId;
    roomState.price = room.price;
    
    // 设置图片交互
    setupGallery();
}

/**
 * 設置圖片畫廊功能
 */
function setupGallery() {
    const mainImage = document.getElementById('room-main-image');
    const thumbnails = document.querySelectorAll('.gallery-thumb');
    
    thumbnails.forEach((thumb) => {
        thumb.addEventListener('click', function() {
            // 交換主圖和縮圖
            const tempSrc = mainImage.src;
            mainImage.src = this.src;
            this.src = tempSrc;
        });
    });
}

/**
 * 設置預訂按鈕
 */
function setupReserveButton(roomId) {
    const apiRoomId = roomId === 'standard' ? 'LAO_S' : roomId === 'deluxe' ? 'LAO_L' : '';
    
    if (elements.reserveRoomBtn && apiRoomId) {
        elements.reserveRoomBtn.href = `./public/booking.html?roomId=${apiRoomId}`;
        console.log(`預訂按鈕已設置，指向：./public/booking.html?roomId=${apiRoomId}`);
    } else {
        console.warn('預訂按鈕設置失敗，可能找不到按鈕元素或房型ID無效');
    }
} 