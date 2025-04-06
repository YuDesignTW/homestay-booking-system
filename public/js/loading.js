// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const loadingOverlay = document.getElementById('loading-overlay');
    const enterButton = document.getElementById('enter-button');
    const layer01 = document.getElementById('layer-01');
    const layer02 = document.getElementById('layer-02');
    const layer03 = document.getElementById('layer-03');
    
    // 页面加载时显示loading页面
    document.body.style.overflow = 'hidden'; // 禁止滚动
    
    // 应用视差效果的通用函数
    function applyParallax(x, y) {
        if (loadingOverlay.classList.contains('hidden')) return;
        
        // 获取窗口尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 计算偏移量，降低数值以减小移动幅度
        const xOffset = (x - windowWidth / 2) / 50;
        const yOffset = (y - windowHeight / 2) / 50;
        
        // 应用不同强度的视差效果，降低最大移动幅度
        layer01.style.transform = `translate(${xOffset * 1.8}px, ${yOffset * 1.8}px)`;
        layer02.style.transform = `translate(${xOffset * 1.2}px, ${yOffset * 1.2}px)`;
        layer03.style.transform = `translate(${xOffset * 0.5}px, ${yOffset * 0.5}px)`;
    }
    
    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        applyParallax(e.clientX, e.clientY);
    });
    
    // 触摸设备的视差效果
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length === 0) return;
        applyParallax(e.touches[0].clientX, e.touches[0].clientY);
    });
    
    // 设备倾斜视差效果（针对移动设备）
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(e) {
            if (loadingOverlay.classList.contains('hidden')) return;
            
            // 获取设备的倾斜角度
            const beta = Math.min(Math.max(e.beta, -45), 45); // 前后倾斜
            const gamma = Math.min(Math.max(e.gamma, -45), 45); // 左右倾斜
            
            // 将角度转换为偏移量
            const xOffset = (gamma / 45) * 10;
            const yOffset = (beta / 45) * 10;
            
            // 应用不同强度的视差效果
            layer01.style.transform = `translate(${xOffset * 1.8}px, ${yOffset * 1.8}px)`;
            layer02.style.transform = `translate(${xOffset * 1.2}px, ${yOffset * 1.2}px)`;
            layer03.style.transform = `translate(${xOffset * 0.5}px, ${yOffset * 0.5}px)`;
        });
    }
    
    // 按钮点击事件
    enterButton.addEventListener('click', function() {
        // 添加上滑动画
        loadingOverlay.classList.add('slide-up');
        
        // 动画结束后隐藏loading页面
        setTimeout(function() {
            loadingOverlay.classList.add('hidden');
            document.body.style.overflow = ''; // 恢复滚动
        }, 1000);
    });
    
    // 预加载图片
    (function preloadImages() {
        const images = [
            './assets/Hero/01.png',
            './assets/Hero/02.png',
            './assets/Hero/03.png'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    })();
}); 