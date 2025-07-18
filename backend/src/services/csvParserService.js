// backend/src/services/csvParserService.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('../config/db');

/**
 * Parses a CSV file and saves order data to the database.
 * @param {string} filePath - The path to the uploaded CSV file.
 * @param {number} userId - The ID of the user uploading the data.
 * @returns {Promise<object>} - An object containing the count of processed orders and items.
 */
const parseAndSaveOrders = async (filePath, userId) => {
    return new Promise((resolve, reject) => {
        const ordersToCreate = [];
        const orderItemsToCreate = [];
        let orderCount = 0;
        let itemCount = 0;
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // --- Basic Data Mapping (Adjust based on actual CSV columns) ---
                // This is a common structure for food delivery CSVs.
                // You might need to adjust column names based on Swiggy/Zomato exports.
                
                const orderDateStr = row['Order Date'] || row['Date'] || '';
                const restaurantName = row['Restaurant'] || row['Restaurant Name'] || 'Unknown Restaurant';
                const totalAmountStr = row['Total Amount'] || row['Order Total'] || '0';
                const itemName = row['Item Name'] || row['Item'] || 'Unknown Item';
                const quantityStr = row['Quantity'] || '1';
                const priceStr = row['Item Price'] || row['Price'] || '0'; // Price per item
                
                // Data Cleaning and Type Conversion
                const orderDate = new Date(orderDateStr);
                const totalAmount = parseFloat(totalAmountStr.replace(/[^0-9.-]+/g, "")); // Remove currency symbols
                const quantity = parseInt(quantityStr, 10);
                const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, "")); // Remove currency symbols
                
                // Validate parsed data
                if (isNaN(orderDate.getTime()) || isNaN(totalAmount) || totalAmount < 0 || !restaurantName) {
                    console.warn(`Skipping malformed order row: ${JSON.stringify(row)}`);
                    return; // Skip this row if essential data is missing or invalid
                }
                
                // Prepare order data (we'll link items after creating the order)
                ordersToCreate.push({
                    userId,
                    orderDate,
                    restaurant: restaurantName,
                    totalAmount,
                    items: [{
                        itemName,
                        quantity,
                        price
                    }]
                });
            })
            .on('end', async () => {
                try {
                    // Group order items by restaurant and date to form distinct orders
                    // This assumes that all items from the same restaurant on the same date
                    // belong to a single order. You might need a unique order ID from the CSV
                    // if it provides one to make this more robust.
                    const distinctOrders = {};
                    
                    ordersToCreate.forEach(tempOrder => {
                        const key = `${tempOrder.restaurant}-${tempOrder.orderDate.toISOString().split('T')[0]}`;
                        if (!distinctOrders[key]) {
                            distinctOrders[key] = {
                                userId: tempOrder.userId,
                                orderDate: tempOrder.orderDate,
                                restaurant: tempOrder.restaurant,
                                totalAmount: 0, // Will sum up later
                                items: [],
                            };
                        }
                        distinctOrders[key].totalAmount += tempOrder.totalAmount; // Summing up amounts to match distinct order
                        distinctOrders[key].items.push(...tempOrder.items);
                    });
                    
                    // Batch create orders and their items
                    for (const orderKey in distinctOrders) {
                        const orderData = distinctOrders[orderKey];
                        const createdOrder = await prisma.order.create({
                            data: {
                                userId: orderData.userId,
                                orderDate: orderData.orderDate,
                                restaurant: orderData.restaurant,
                                totalAmount: orderData.totalAmount,
                                // Nest connect/create for order items if you have them uniquely identified per order in CSV.
                                // For simplicity here, we'll create them directly with the orderId.
                            }
                        });
                        orderCount++;
                        
                        // Prepare order items for batch creation
                        const itemsForThisOrder = orderData.items.map(item => ({
                            orderId: createdOrder.id,
                            itemName: item.itemName,
                            quantity: item.quantity,
                            price: item.price,
                        }));
                        await prisma.orderItem.createMany({
                            data: itemsForThisOrder,
                            skipDuplicates: true, // Optional: useful if re-uploading identical data
                        });
                        itemCount += itemsForThisOrder.length;
                    }
                    
                    // Clean up the uploaded file
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                    
                    resolve({ orderCount, itemCount });
                    
                } catch (error) {
                    console.error('Error saving data to database:', error);
                    // Clean up the uploaded file even on database error
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting file after DB error:', err);
                    });
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('Error parsing CSV:', error);
                // Clean up the uploaded file on parsing error
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file after CSV parsing error:', err);
                });
                reject(error);
            });
    });
};

module.exports = {
    parseAndSaveOrders,
};