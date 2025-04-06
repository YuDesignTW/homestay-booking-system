# 悠然民宿预订系统

基于Google Sheets和Google Apps Script的简易民宿预订系统，包含前端展示网站和后端预订管理功能。

## 系统概述

悠然民宿预订系统主要包含以下功能：

1. 民宿主页展示（首页、关于我们、房型介绍等）
2. 在线预订系统
   - 选择入住/退房日期
   - 选择房型
   - 填写预订信息
   - 提交预订
3. 后台预订管理（基于Google Sheets）
   - 房间信息管理
   - 预订记录管理
   - 可用性管理

## 技术栈

- 前端：HTML, CSS, JavaScript
- 后端：Google Apps Script
- 数据存储：Google Sheets

## 设置步骤

### 1. 创建Google Sheets

首先，创建一个Google Sheets文件，包含以下工作表：

#### RoomInfo（房间信息表）

| 列名 | 描述 |
|------|------|
| id | 房型ID（如 standard, deluxe） |
| name | 房型名称（如 标准双人房, 豪华家庭房） |
| price | 价格（每晚） |
| maxGuests | 最大容纳人数 |
| totalRooms | 该类型的总房间数 |
| description | 房型描述 |
| features | 房型特点（可使用JSON格式存储） |

#### Bookings（预订表）

| 列名 | 描述 |
|------|------|
| bookingId | 预订ID |
| bookingDate | 预订日期（下单时间） |
| roomId | 房型ID |
| checkInDate | 入住日期 |
| checkOutDate | 退房日期 |
| nights | 住宿晚数 |
| guests | 入住人数 |
| totalPrice | 总价格 |
| guestName | 客人姓名 |
| guestPhone | 联系电话 |
| guestEmail | 电子邮箱 |
| arrivalTime | 预计抵达时间 |
| specialRequests | 特殊要求或备注 |
| status | 预订状态（待确认/已确认/已取消） |

#### Availability（可用性表）

| 列名 | 描述 |
|------|------|
| date | 日期 |
| standard | 标准双人房可用数量 |
| deluxe | 豪华家庭房可用数量 |
| suite | 行政套房可用数量 |
| ... | 其他房型... |

### 2. 设置Google Apps Script

1. 在Google Sheets中，点击"扩展程序" > "Apps Script"
2. 将 `src/google-apps-script.js` 中的代码复制到编辑器中
3. 更新脚本中的 `SPREADSHEET_ID` 变量为您的Google Sheets的ID
4. 保存脚本
5. 点击"部署" > "新建部署"
6. 选择类型为"Web 应用"
7. 设置以下选项：
   - 执行脚本的方式：以自己的身份
   - 有权访问的用户：任何人
8. 点击"部署"并授权应用程序
9. 复制生成的Web应用URL，此URL将用于前端与Google Sheets通信

### 3. 配置前端代码

1. 在 `public/js/booking.js` 文件中，找到以下代码段：

```javascript
// 模拟发送数据到Google Sheets
// 在实际项目中，这里应该调用Google Apps Script Web App的API
setTimeout(() => {
    // 模拟成功提交
    const success = Math.random() > 0.2; // 80%概率成功
    
    // 隐藏加载动画
    elements.submitLoading.style.display = 'none';
    
    if (success) {
        // 显示成功信息
        elements.bookingSuccess.style.display = 'block';
        
        // 更新最终预订详情
        updateFinalBookingDetails(bookingData);
    } else {
        // 显示错误信息
        elements.bookingError.style.display = 'block';
    }
}, 2000);
```

将此代码修改为实际调用Google Apps Script Web App的代码：

```javascript
// 发送数据到Google Sheets
fetch('您的Google Apps Script Web App URL', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        action: 'submitBooking',
        ...bookingData
    }),
})
.then(response => response.json())
.then(data => {
    // 隐藏加载动画
    elements.submitLoading.style.display = 'none';
    
    if (data.success) {
        // 显示成功信息
        elements.bookingSuccess.style.display = 'block';
        
        // 使用返回的bookingId更新bookingData
        bookingData.booking_id = data.bookingId;
        
        // 更新最终预订详情
        updateFinalBookingDetails(bookingData);
    } else {
        // 显示错误信息
        elements.bookingError.style.display = 'block';
        
        // 可选：显示具体错误信息
        if (data.error) {
            const errorElement = document.createElement('p');
            errorElement.textContent = `错误：${data.error}`;
            elements.bookingError.appendChild(errorElement);
        }
    }
})
.catch(error => {
    console.error('Error:', error);
    // 隐藏加载动画
    elements.submitLoading.style.display = 'none';
    // 显示错误信息
    elements.bookingError.style.display = 'block';
});
```

2. 同样，在 `loadAvailableRooms` 函数中，将模拟数据替换为实际API调用：

```javascript
// 加载可用房型
function loadAvailableRooms() {
    // 显示加载动画
    elements.loadingRooms.style.display = 'flex';
    elements.availableRooms.innerHTML = '';
    
    const { checkInDate, checkOutDate } = bookingState;
    
    // 格式化日期为YYYY-MM-DD
    const checkIn = formatDateYMD(checkInDate);
    const checkOut = formatDateYMD(checkOutDate);
    
    // 调用Google Apps Script Web App获取实时数据
    fetch(`您的Google Apps Script Web App URL?action=checkAvailability&checkIn=${checkIn}&checkOut=${checkOut}`)
    .then(response => response.json())
    .then(data => {
        // 隐藏加载动画
        elements.loadingRooms.style.display = 'none';
        
        if (data.success && data.availability) {
            // 渲染可用房型
            renderAvailableRooms(data.availability);
        } else {
            // 显示错误信息
            elements.availableRooms.innerHTML = `
                <div class="no-rooms-message">
                    <p>抱歉，获取房型信息时出错。请稍后重试。</p>
                    <p>${data.error || ''}</p>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // 隐藏加载动画
        elements.loadingRooms.style.display = 'none';
        // 显示错误信息
        elements.availableRooms.innerHTML = `
            <div class="no-rooms-message">
                <p>抱歉，获取房型信息时出错。请稍后重试。</p>
            </div>
        `;
    });
}

// 格式化日期为YYYY-MM-DD
function formatDateYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

## 使用说明

### 民宿主页

1. 使用浏览器打开 `index.html` 文件
2. 浏览民宿信息（首页、关于我们、房型等）
3. 点击"立即预订"按钮进入预订页面

### 预订系统

预订流程包含四个步骤：

1. **选择日期**：
   - 选择入住日期和退房日期
   - 指定入住人数
   - 点击"查看可用房型"

2. **选择房型**：
   - 浏览可用的房型选项
   - 选择心仪的房型
   - 点击"填写信息"

3. **填写信息**：
   - 输入客人姓名、联系电话、电子邮箱等信息
   - 选择预计抵达时间
   - 填写特殊要求或备注（如有）
   - 阅读并接受取消政策
   - 点击"确认预订"

4. **完成预订**：
   - 查看预订确认信息
   - 记录预订号
   - 等待确认邮件

### 管理预订

1. 打开您的Google Sheets文件
2. 在"Bookings"表中可以看到所有预订记录
3. 可以手动更新预订状态（从"待确认"改为"已确认"）
4. "RoomInfo"表用于管理房型信息
5. "Availability"表显示每日的房间可用情况

## 注意事项

- 本系统仅用于演示目的，实际使用需要进一步完善和安全设置
- 使用Google Apps Script有调用配额限制，大量并发请求可能会受到限制
- 确保Google Sheets和Apps Script有足够的访问权限
- 在实际部署中，建议增加更严格的数据验证和错误处理

## 进一步改进方向

- 添加管理员登录和管理界面
- 实现自动化电子邮件通知
- 整合支付系统
- 添加房间照片管理
- 实现促销价格和季节性定价
- 增加预订历史和会员系统 