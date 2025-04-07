// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取取消政策模态窗口元素
    const policyModal = document.getElementById('policy-modal');
    const policyLink = document.getElementById('cancellation-policy');
    const closeButton = document.querySelector('.close-button');
    
    // 点击取消政策链接时显示模态窗口
    if (policyLink) {
        policyLink.addEventListener('click', function(e) {
            e.preventDefault();
            policyModal.style.display = 'flex';
        });
    }
    
    // 点击关闭按钮关闭模态窗口
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            policyModal.style.display = 'none';
        });
    }
    
    // 点击模态窗口外部区域关闭模态窗口
    window.addEventListener('click', function(e) {
        if (e.target === policyModal) {
            policyModal.style.display = 'none';
        }
    });
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 导航栏滚动效果
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // 动态更新页脚年份
    const yearSpan = document.querySelector('.footer-bottom p');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.innerHTML = yearSpan.innerHTML.replace('2025', currentYear);
    }
    
    // 預訂按鈕點擊事件 - 只處理指向錨點的按鈕
    const bookingBtns = document.querySelectorAll('.btn-secondary[href^="#"]');
    bookingBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const roomType = this.closest('.room-card').querySelector('h3').textContent;
            const bookingSection = document.querySelector('#booking');
            
            // 滚动到预订区域
            if (bookingSection) {
                window.scrollTo({
                    top: bookingSection.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // 如果有iframe，可以尝试将房型信息传递给预订表单
                const bookingFrame = document.getElementById('booking-frame');
                if (bookingFrame && bookingFrame.contentWindow) {
                    setTimeout(() => {
                        try {
                            bookingFrame.contentWindow.postMessage({
                                type: 'select-room',
                                roomType: roomType
                            }, '*');
                        } catch (error) {
                            console.error('无法向iframe发送消息', error);
                        }
                    }, 1000);
                }
            }
        });
    });
}); 