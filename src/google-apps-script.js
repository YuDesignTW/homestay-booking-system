/**
 * 悠然民宿预订系统 Google Apps Script
 * 
 * 此脚本用于处理民宿预订系统与Google Sheets的交互
 * 包括：
 * 1. 查询房型和可用性信息
 * 2. 提交新预订
 * 3. 生成简单的报表和统计
 */

// 获取房间信息表和预订表
const SPREADSHEET_ID = '19qDShtvweagHh5CH8cL5X6C5OEWQnnUzhq7i-y6x_XU';
const ROOM_INFO_SHEET_NAME = 'RoomInfo';
const BOOKINGS_SHEET_NAME = 'Bookings';
const AVAILABILITY_SHEET_NAME = 'Availability';

/**
 * 处理Web请求的主函数
 */
function doGet(e) {
  // 设置CORS headers，允许来自任何来源的请求
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // 解析请求参数
  const params = e.parameter;
  const action = params.action;
  
  // 根据请求的操作类型执行相应的函数
  let result = {};
  
  try {
    switch(action) {
      case 'getRoomInfo':
        result = getRoomInfo();
        break;
      case 'checkAvailability':
        result = checkAvailability(params.checkIn, params.checkOut);
        break;
      case 'checkAvailabilityCalendar':
        result = checkAvailabilityCalendar(params.checkIn, params.checkOut);
        break;
      case 'getBooking':
        result = getBooking(params.bookingId);
        break;
      default:
        result = { error: '无效的操作请求' };
    }
  } catch(error) {
    result = { error: error.toString() };
    Logger.log('doGet处理错误: ' + error.toString());
  }
  
  // 返回JSON结果
  const jsonOutput = JSON.stringify(result);
  output.setContent(jsonOutput);
  
  // 记录最终返回的结果，用于调试
  Logger.log('API返回结果: ' + jsonOutput);
  
  return output;
}

/**
 * 处理POST请求（用于提交预订）
 */
function doPost(e) {
  // 设置CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  let result = {};
  
  try {
    // 解析请求参数
    const params = JSON.parse(e.postData.contents);
    
    // 验证必要字段是否存在
    if(!params.action) {
      throw new Error('缺少操作类型');
    }
    
    // 根据请求的操作类型执行相应的函数
    switch(params.action) {
      case 'submitBooking':
        result = submitBooking(params);
        break;
      case 'updateBooking':
        result = updateBooking(params);
        break;
      case 'cancelBooking':
        result = cancelBooking(params.bookingId);
        break;
      default:
        result = { error: '无效的操作请求' };
    }
  } catch(error) {
    result = { error: error.toString() };
    Logger.log('doPost处理错误: ' + error.toString());
  }
  
  // 返回JSON结果
  const jsonOutput = JSON.stringify(result);
  output.setContent(jsonOutput);
  
  // 记录最终返回的结果，用于调试
  Logger.log('API返回结果: ' + jsonOutput);
  
  return output;
}

/**
 * 获取所有房型信息
 */
function getRoomInfo() {
  try {
    Logger.log('开始获取房型信息');
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ROOM_INFO_SHEET_NAME);
    if (!sheet) {
      Logger.log('找不到房型信息表: ' + ROOM_INFO_SHEET_NAME);
      return { success: false, error: '找不到房型信息表' };
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('获取到房型表行数: ' + data.length);
    
    if (data.length <= 1) {
      Logger.log('房型表为空或只有表头');
      return { success: true, roomTypes: [] };
    }
    
    // 提取表头和数据行
    const headers = data[0];
    const rows = data.slice(1);
    
    Logger.log('房型表头: ' + JSON.stringify(headers));
    
    // 将数据转换为对象数组
    const roomTypes = rows.map(row => {
      const room = {};
      headers.forEach((header, index) => {
        room[header] = row[index];
      });
      return room;
    });
    
    Logger.log('转换后房型数: ' + roomTypes.length);
    
    // 附加一些调试信息
    roomTypes.forEach((room, index) => {
      Logger.log(`房型 ${index+1}: ID=${room.roomId || room.id}, 名称=${room.roomName || room.name}`);
    });
    
    return { success: true, roomTypes };
  } catch (error) {
    Logger.log('获取房型信息时出错: ' + error.toString());
    return { success: false, error: '获取房型信息时出错: ' + error.toString() };
  }
}

/**
 * 检查指定日期范围内的房型可用性
 */
function checkAvailability(checkInDate, checkOutDate) {
  // 验证日期
  if(!checkInDate || !checkOutDate) {
    Logger.log('入住或退房日期为空');
    return { error: '入住和退房日期不能为空' };
  }
  
  try {
    // 详细的日志输出用于调试
    Logger.log('检查可用性: 入住=' + checkInDate + '(' + typeof checkInDate + '), 退房=' + checkOutDate + '(' + typeof checkOutDate + ')');
    
    // 尝试多种方式转换日期格式
    let checkIn, checkOut;
    
    try {
      // 首先尝试标准的Date对象构造
      checkIn = new Date(checkInDate);
      checkOut = new Date(checkOutDate);
      
      // 验证日期是否有效
      if(isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        Logger.log('标准日期构造失败，尝试解析日期字符串');
        
        // 尝试解析YYYY-MM-DD格式
        if(typeof checkInDate === 'string' && checkInDate.includes('-')) {
          const parts = checkInDate.split('-');
          if(parts.length === 3) {
            checkIn = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
        
        if(typeof checkOutDate === 'string' && checkOutDate.includes('-')) {
          const parts = checkOutDate.split('-');
          if(parts.length === 3) {
            checkOut = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      }
    } catch(e) {
      Logger.log('日期转换出错: ' + e.toString());
      return { error: '日期格式无效: ' + e.toString() };
    }
    
    // 再次验证日期
    if(isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      Logger.log('无法解析有效日期');
      return { error: '无法解析有效日期' };
    }
    
    Logger.log('转换后日期: 入住=' + checkIn + ', 退房=' + checkOut);
    
    // 获取房型信息
    const roomInfoResult = getRoomInfo();
    if(!roomInfoResult.success || !roomInfoResult.roomTypes) {
      Logger.log('获取房型信息失败: ' + JSON.stringify(roomInfoResult));
      return { error: '获取房型信息失败' };
    }
    
    const roomInfo = roomInfoResult.roomTypes;
    Logger.log('获取到房型信息: ' + JSON.stringify(roomInfo));
    
    // 获取可用性表
    const availabilitySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(AVAILABILITY_SHEET_NAME);
    if(!availabilitySheet) {
      Logger.log('找不到可用性表: ' + AVAILABILITY_SHEET_NAME);
      return { error: '找不到可用性表' };
    }
    
    const availabilityData = availabilitySheet.getDataRange().getValues();
    
    // 提取表头和数据行
    const headers = availabilityData[0];
    const rows = availabilityData.slice(1);
    
    Logger.log('可用性表头: ' + JSON.stringify(headers));
    Logger.log('可用性数据行数: ' + rows.length);
    
    // 查找日期范围内的可用性
    const availability = [];
    
    // 遍历所有房型
    roomInfo.forEach(room => {
      const roomId = room.roomId || room.id;
      const roomName = room.roomName || room.name;
      const roomPrice = room.price;
      const roomMaxGuests = room.maxGuests;
      
      Logger.log('处理房型: ' + roomId + ' - ' + roomName);
      
      // 找到房型对应的列索引
      const columnIndex = headers.indexOf(roomId);
      if(columnIndex === -1) {
        Logger.log('找不到房型对应列: ' + roomId);
        return; // 找不到对应的房型列
      }
      
      Logger.log('找到房型列索引: ' + columnIndex);
      
      // 计算该房型在日期范围内的最小可用数量
      let minAvailable = Infinity;
      
      // 遍历日期范围
      for(let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const dateString = Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd');
        
        Logger.log('检查日期: ' + dateString);
        
        // 在可用性表中查找对应日期的行
        let found = false;
        for(let i = 0; i < rows.length; i++) {
          const rowDate = rows[i][0];
          
          // 确保rowDate是日期类型
          let rowDateStr = '';
          if(rowDate instanceof Date) {
            rowDateStr = Utilities.formatDate(rowDate, 'GMT+8', 'yyyy-MM-dd');
          } else if(typeof rowDate === 'string') {
            // 尝试解析字符串日期 (格式可能是 "2025/05/01" 或其他)
            try {
              // 处理常见的日期格式 yyyy/MM/dd
              let parts = rowDate.split('/');
              if(parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // 月份是0-11
                const day = parseInt(parts[2]);
                const parsedDate = new Date(year, month, day);
                rowDateStr = Utilities.formatDate(parsedDate, 'GMT+8', 'yyyy-MM-dd');
                Logger.log('解析日期字符串成功: ' + rowDate + ' -> ' + rowDateStr);
              } else {
                // 尝试标准日期解析
                const parsedDate = new Date(rowDate);
                rowDateStr = Utilities.formatDate(parsedDate, 'GMT+8', 'yyyy-MM-dd');
              }
            } catch(e) {
              Logger.log('无法解析日期字符串: ' + rowDate + ', 错误: ' + e.toString());
              continue;
            }
          }
          
          Logger.log('比较日期: ' + dateString + ' vs ' + rowDateStr);
          
          if(rowDateStr === dateString) {
            let available = 0;
            
            // 确保获取的可用数量是数字
            const availValue = rows[i][columnIndex];
            if(typeof availValue === 'number') {
              available = availValue;
            } else if(typeof availValue === 'string') {
              available = parseInt(availValue) || 0;
            }
            
            Logger.log('找到日期 ' + dateString + ' 的可用数量: ' + available);
            minAvailable = Math.min(minAvailable, available);
            found = true;
            break;
          }
        }
        
        if(!found) {
          Logger.log('找不到日期: ' + dateString);
          // 如果找不到日期，假设默认可用数量
          const totalRooms = room.totalRooms || 0;
          Logger.log('使用默认可用数量: ' + totalRooms);
          minAvailable = Math.min(minAvailable, totalRooms);
        }
      }
      
      Logger.log('房型 ' + roomId + ' 的最小可用数量: ' + minAvailable);
      
      // 如果有可用房间，则添加到结果中
      if(minAvailable > 0 && minAvailable !== Infinity) {
        // 添加房型特性(features)数据
        let features = [];
        if(roomId === 'LAO_S') {
          features = [
            { icon: 'fas fa-user', text: '2人' },
            { icon: 'fas fa-bed', text: '1张大床' },
            { icon: 'fas fa-bath', text: '独立卫浴' },
            { icon: 'fas fa-wifi', text: '免费Wi-Fi' }
          ];
        } else if(roomId === 'LAO_L') {
          features = [
            { icon: 'fas fa-users', text: '4人' },
            { icon: 'fas fa-bed', text: '1张大床 + 2张单人床' },
            { icon: 'fas fa-bath', text: '独立卫浴' },
            { icon: 'fas fa-wifi', text: '免费Wi-Fi' },
            { icon: 'fas fa-tv', text: '50寸液晶电视' }
          ];
        }
        
        availability.push({
          id: roomId,
          name: roomName,
          price: roomPrice,
          maxGuests: roomMaxGuests,
          available: minAvailable,
          features: features
        });
      }
    });
    
    Logger.log('最终可用房型数: ' + availability.length);
    if(availability.length === 0) {
      Logger.log('警告: 没有找到可用房型!');
    }
    
    return { 
      success: true, 
      checkIn: checkInDate, 
      checkOut: checkOutDate, 
      availability: availability 
    };
  } catch(error) {
    Logger.log('检查可用性时出错: ' + error.toString());
    return { 
      success: false,
      error: '检查可用性时出错: ' + error.toString(),
      availability: []
    };
  }
}

/**
 * 提交新预订
 */
function submitBooking(bookingData) {
  try {
    // 验证必要字段
    const requiredFields = ['checkInDate', 'checkOutDate', 'roomId', 'guestName', 'guestPhone', 'guestEmail'];
    for(const field of requiredFields) {
      if(!bookingData[field]) {
        return { error: `缺少必要字段: ${field}` };
      }
    }
    
    // 检查此时间段是否有可用房间
    const availabilityCheck = checkAvailability(bookingData.checkInDate, bookingData.checkOutDate);
    if(availabilityCheck.error) {
      return availabilityCheck;
    }
    
    const roomAvailability = availabilityCheck.availability.find(room => room.id === bookingData.roomId);
    if(!roomAvailability || roomAvailability.available <= 0) {
      return { error: '所选房型在此日期范围内已无可用房间' };
    }
    
    // 生成预订ID
    const bookingId = 'BK' + new Date().getTime().toString().slice(-6) + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // 准备要写入的预订数据
    const bookingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const headers = bookingSheet.getRange(1, 1, 1, bookingSheet.getLastColumn()).getValues()[0];
    
    // 创建要添加的行数据
    const newRow = [];
    
    // 保证数据按正确的列顺序添加
    headers.forEach((header) => {
      switch(header) {
        case 'bookingId':
          newRow.push(bookingId);
          break;
        case 'bookingDate':
          newRow.push(new Date());
          break;
        case 'status':
          newRow.push('待确认');
          break;
        default:
          // 从提交的数据中找到相应的字段值
          const field = bookingData[header] || '';
          newRow.push(field);
      }
    });
    
    // 添加新行
    bookingSheet.appendRow(newRow);
    
    // 更新可用性表
    updateAvailability(bookingData.roomId, bookingData.checkInDate, bookingData.checkOutDate, -1);
    
    // 发送确认邮件（如果有需要）
    sendConfirmationEmail(bookingData, bookingId);
    
    return { 
      success: true, 
      message: '预订成功！', 
      bookingId 
    };
  } catch(error) {
    return { error: '提交预订时出错: ' + error.toString() };
  }
}

/**
 * 取消预订
 */
function cancelBooking(bookingId) {
  try {
    if(!bookingId) {
      return { error: '缺少预订ID' };
    }
    
    // 查找预订记录
    const bookingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = bookingSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到预订ID和状态的列索引
    const bookingIdIndex = headers.indexOf('bookingId');
    const statusIndex = headers.indexOf('status');
    const roomIdIndex = headers.indexOf('roomId');
    const checkInIndex = headers.indexOf('checkInDate');
    const checkOutIndex = headers.indexOf('checkOutDate');
    
    if(bookingIdIndex === -1 || statusIndex === -1) {
      return { error: '预订表格格式不正确' };
    }
    
    // 查找预订记录行
    let rowIndex = -1;
    for(let i = 1; i < data.length; i++) {
      if(data[i][bookingIdIndex] === bookingId) {
        rowIndex = i + 1; // +1 因为表行号从1开始
        break;
      }
    }
    
    if(rowIndex === -1) {
      return { error: '找不到对应预订记录' };
    }
    
    // 检查当前状态是否已是取消
    if(data[rowIndex-1][statusIndex] === '已取消') {
      return { message: '该预订已经被取消' };
    }
    
    // 更新预订状态为"已取消"
    bookingSheet.getRange(rowIndex, statusIndex + 1).setValue('已取消');
    
    // 更新房间可用性（恢复被占用的房间）
    const roomId = data[rowIndex-1][roomIdIndex];
    const checkInDate = data[rowIndex-1][checkInIndex];
    const checkOutDate = data[rowIndex-1][checkOutIndex];
    
    if(roomId && checkInDate && checkOutDate) {
      updateAvailability(roomId, checkInDate, checkOutDate, 1);
    }
    
    return { success: true, message: '预订已成功取消' };
  } catch(error) {
    return { error: '取消预订时出错: ' + error.toString() };
  }
}

/**
 * 获取单个预订的详细信息
 */
function getBooking(bookingId) {
  try {
    if(!bookingId) {
      return { error: '缺少预订ID' };
    }
    
    // 查找预订记录
    const bookingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = bookingSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到预订ID的列索引
    const bookingIdIndex = headers.indexOf('bookingId');
    
    if(bookingIdIndex === -1) {
      return { error: '预订表格格式不正确' };
    }
    
    // 查找对应的预订行
    let bookingRow = null;
    for(let i = 1; i < data.length; i++) {
      if(data[i][bookingIdIndex] === bookingId) {
        bookingRow = data[i];
        break;
      }
    }
    
    if(!bookingRow) {
      return { error: '找不到对应预订记录' };
    }
    
    // 将行数据转换为对象
    const booking = {};
    headers.forEach((header, index) => {
      booking[header] = bookingRow[index];
    });
    
    return { success: true, booking };
  } catch(error) {
    return { error: '获取预订信息时出错: ' + error.toString() };
  }
}

/**
 * 更新可用性表
 * @param {string} roomId - 房型ID
 * @param {string} checkInDate - 入住日期
 * @param {string} checkOutDate - 退房日期
 * @param {number} change - 变化量（-1表示预订，+1表示取消）
 */
function updateAvailability(roomId, checkInDate, checkOutDate, change) {
  try {
    const availabilitySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(AVAILABILITY_SHEET_NAME);
    const data = availabilitySheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到房型对应的列索引
    const columnIndex = headers.indexOf(roomId);
    if(columnIndex === -1) {
      throw new Error('找不到对应的房型列');
    }
    
    // 转换日期
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // 遍历日期范围内的每一天
    for(let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateString = Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd');
      
      // 查找日期行
      let rowIndex = -1;
      for(let i = 1; i < data.length; i++) {
        const rowDate = data[i][0];
        if(rowDate instanceof Date && Utilities.formatDate(rowDate, 'GMT+8', 'yyyy-MM-dd') === dateString) {
          rowIndex = i + 1; // +1 因为表行号从1开始
          break;
        }
      }
      
      if(rowIndex === -1) {
        // 如果找不到日期行，则添加新行
        const newRow = Array(headers.length).fill('');
        newRow[0] = new Date(d);
        
        // 获取该房型的总房间数
        const roomInfoSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ROOM_INFO_SHEET_NAME);
        const roomData = roomInfoSheet.getDataRange().getValues();
        const roomHeaders = roomData[0];
        const roomIdIndex = roomHeaders.indexOf('roomId') !== -1 ? roomHeaders.indexOf('roomId') : roomHeaders.indexOf('id');
        const totalRoomsIndex = roomHeaders.indexOf('totalRooms');
        
        let defaultValue = 0;
        if(totalRoomsIndex !== -1 && roomIdIndex !== -1) {
          for(let i = 1; i < roomData.length; i++) {
            if(roomData[i][roomIdIndex] === roomId) {
              defaultValue = roomData[i][totalRoomsIndex];
              break;
            }
          }
        }
        
        newRow[columnIndex] = defaultValue + change;
        availabilitySheet.appendRow(newRow);
      } else {
        // 更新现有行
        const currentValue = data[rowIndex-1][columnIndex];
        const newValue = typeof currentValue === 'number' ? currentValue + change : change;
        availabilitySheet.getRange(rowIndex, columnIndex + 1).setValue(Math.max(0, newValue));
      }
    }
    
    return true;
  } catch(error) {
    Logger.log('更新可用性时出错: ' + error.toString());
    return false;
  }
}

/**
 * 发送预订确认邮件
 */
function sendConfirmationEmail(bookingData, bookingId) {
  try {
    const { guestName, guestEmail, roomId, checkInDate, checkOutDate } = bookingData;
    
    // 获取房型信息
    const roomInfoSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ROOM_INFO_SHEET_NAME);
    const roomData = roomInfoSheet.getDataRange().getValues();
    const roomHeaders = roomData[0];
    const roomIdIndex = roomHeaders.indexOf('roomId') !== -1 ? roomHeaders.indexOf('roomId') : roomHeaders.indexOf('id');
    const roomNameIndex = roomHeaders.indexOf('roomName') !== -1 ? roomHeaders.indexOf('roomName') : roomHeaders.indexOf('name');
    
    let roomName = roomId;
    if(roomIdIndex !== -1 && roomNameIndex !== -1) {
      for(let i = 1; i < roomData.length; i++) {
        if(roomData[i][roomIdIndex] === roomId) {
          roomName = roomData[i][roomNameIndex];
          break;
        }
      }
    }
    
    // 准备邮件内容
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const subject = `悠然民宿 - 预订确认 (预订号: ${bookingId})`;
    
    const body = `
      亲爱的 ${guestName}，

      感谢您选择悠然民宿！您的预订已成功提交，目前状态为"待确认"。
      我们将尽快审核您的预订，并在确认后通知您。

      预订详情:
      -------------------------------------
      预订号: ${bookingId}
      房型: ${roomName}
      入住日期: ${Utilities.formatDate(checkIn, 'GMT+8', 'yyyy年MM月dd日')}
      退房日期: ${Utilities.formatDate(checkOut, 'GMT+8', 'yyyy年MM月dd日')}
      住宿晚数: ${nights}晚
      
      如果您有任何问题或需要修改预订，请联系我们:
      电话: +886 12345678
      邮箱: info@youranHomestay.com

      期待您的光临！

      悠然民宿团队
    `;
    
    // 发送邮件
    MailApp.sendEmail({
      to: guestEmail,
      subject: subject,
      body: body
    });
    
    return true;
  } catch(error) {
    Logger.log('发送确认邮件时出错: ' + error.toString());
    return false;
  }
}

/**
 * 检查日期范围内每一天的房型可用性（用于日历显示）
 */
function checkAvailabilityCalendar(checkInDate, checkOutDate) {
  // 验证日期
  if(!checkInDate || !checkOutDate) {
    return { error: '入住和退房日期不能为空' };
  }
  
  try {
    // 日志输出用于调试
    Logger.log('获取日历可用性: 开始=' + checkInDate + ', 结束=' + checkOutDate);
    
    // 转换日期格式
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // 获取可用性表
    const availabilitySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(AVAILABILITY_SHEET_NAME);
    const availabilityData = availabilitySheet.getDataRange().getValues();
    
    // 提取表头和数据行
    const headers = availabilityData[0];
    const rows = availabilityData.slice(1);
    
    // 查找所有房型列的索引
    const roomIndices = {};
    headers.forEach((header, index) => {
      if(header && header !== 'date') {
        roomIndices[header] = index;
      }
    });
    
    Logger.log('找到房型索引: ' + JSON.stringify(roomIndices));
    
    // 初始化结果对象
    const result = {};
    
    // 遍历日期范围内的每一天
    for(let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateString = Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd');
      
      // 初始化当前日期的可用性数据
      result[dateString] = {};
      
      // 在可用性表中查找对应日期的行
      let rowFound = false;
      for(let i = 0; i < rows.length; i++) {
        const rowDate = rows[i][0];
        let rowDateStr = '';
        
        // 确保rowDate是日期类型
        if(rowDate instanceof Date) {
          rowDateStr = Utilities.formatDate(rowDate, 'GMT+8', 'yyyy-MM-dd');
        } else if(typeof rowDate === 'string') {
          try {
            const parsedDate = new Date(rowDate);
            rowDateStr = Utilities.formatDate(parsedDate, 'GMT+8', 'yyyy-MM-dd');
          } catch(e) {
            continue;
          }
        }
        
        // 如果找到匹配的日期行
        if(rowDateStr === dateString) {
          // 为每个房型获取可用数量
          Object.keys(roomIndices).forEach(roomId => {
            const columnIndex = roomIndices[roomId];
            result[dateString][roomId] = rows[i][columnIndex] || 0;
          });
          
          rowFound = true;
          break;
        }
      }
      
      // 如果在表中找不到该日期，则默认所有房型为0
      if(!rowFound) {
        Object.keys(roomIndices).forEach(roomId => {
          result[dateString][roomId] = 0;
        });
      }
    }
    
    return {
      success: true,
      availabilityData: result
    };
    
  } catch(error) {
    Logger.log('获取日历可用性时出错: ' + error.toString());
    return { error: '获取日历可用性时出错: ' + error.toString() };
  }
}

/**
 * 测试函数，用于在部署前测试脚本
 */
function test() {
  // 测试获取房型信息
  const roomInfo = getRoomInfo();
  Logger.log('房型信息: ' + JSON.stringify(roomInfo));
  
  // 测试检查可用性
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const checkInStr = Utilities.formatDate(today, 'GMT+8', 'yyyy-MM-dd');
  const checkOutStr = Utilities.formatDate(tomorrow, 'GMT+8', 'yyyy-MM-dd');
  
  const availability = checkAvailability(checkInStr, checkOutStr);
  Logger.log('可用性检查: ' + JSON.stringify(availability));
} 