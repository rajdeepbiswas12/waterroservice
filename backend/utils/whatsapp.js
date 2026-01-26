const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// Send WhatsApp message
exports.sendWhatsAppMessage = async (to, message) => {
  if (!client) {
    console.log('Twilio not configured. Message would be sent:', message);
    return { success: false, message: 'WhatsApp not configured' };
  }

  try {
    const result = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${to}`,
      body: message
    });
    
    console.log('WhatsApp message sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return { success: false, message: error.message };
  }
};

// Send order assignment notification
exports.sendOrderAssignmentNotification = async (employee, order) => {
  const message = `🔔 New Order Assigned!\n\n` +
    `Order #${order.orderNumber}\n` +
    `Customer: ${order.customerName}\n` +
    `Service: ${order.serviceType}\n` +
    `Address: ${order.customerAddress}\n` +
    `Priority: ${order.priority.toUpperCase()}\n\n` +
    `Please check your dashboard for details.`;

  return await exports.sendWhatsAppMessage(employee.phone, message);
};

// Send order creation notification to admin
exports.sendOrderCreationNotification = async (adminPhone, order) => {
  const message = `📋 New Order Created!\n\n` +
    `Order #${order.orderNumber}\n` +
    `Customer: ${order.customerName}\n` +
    `Phone: ${order.customerPhone}\n` +
    `Service: ${order.serviceType}\n` +
    `Status: ${order.status.toUpperCase()}\n\n` +
    `Please assign an employee.`;

  return await exports.sendWhatsAppMessage(adminPhone, message);
};

// Send order status update notification
exports.sendOrderStatusNotification = async (phone, order) => {
  const message = `📬 Order Status Update!\n\n` +
    `Order #${order.orderNumber}\n` +
    `New Status: ${order.status.toUpperCase()}\n` +
    `Customer: ${order.customerName}\n\n` +
    `Thank you for using our service.`;

  return await exports.sendWhatsAppMessage(phone, message);
};
