const Cart = require('../models/Cart');
const InventoryService = require('../services/inventoryService');
const { v4: uuidv4 } = require('uuid');

const getOrCreateCart = async (userId, sessionToken) => {
    let cart = null;

    if (userId) {
        cart = await Cart.findOne({ userId });
    }

    if (!cart && sessionToken) {
        cart = await Cart.findOne({ sessionToken });
    }

    if (!cart) {
        const finalToken = sessionToken || `sess_${uuidv4()}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days TTL

        cart = await Cart.create({
            userId: userId || null,
            sessionToken: finalToken,
            items: [],
            expiresAt
        });
    }

    return cart;
};

/**
 * UC-3: Get active cart
 */
const getCart = async (req, res) => {
    try {
        const sessionToken = req.headers['x-session-token'] || req.query?.session_token || req.body?.session_token;
        const userId = req.userId || null;

        const cart = await getOrCreateCart(userId, sessionToken);

        let subtotal = 0;
        const formattedItems = cart.items.map(item => {
            const lineSubtotal = parseFloat((item.price * item.quantity).toFixed(2));
            subtotal += lineSubtotal;
            return {
                cart_item_id: item._id,
                variant_id: item.variantId,
                product_id: item.productId,
                product_title: item.productTitle,
                sku: item.sku,
                price: item.price,
                attributes: item.attributes,
                quantity: item.quantity,
                line_subtotal: lineSubtotal,
                added_at: item.addedAt
            };
        });

        res.json({
            cart_id: cart._id,
            session_token: cart.sessionToken,
            items: formattedItems,
            item_count: formattedItems.reduce((acc, it) => acc + it.quantity, 0),
            subtotal: parseFloat(subtotal.toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add item to cart
 */
const addItemToCart = async (req, res) => {
    try {
        const { variant_id, quantity = 1 } = req.body;
        const sessionToken = req.headers['x-session-token'] || req.body.session_token;
        const userId = req.userId || null;

        if (!variant_id || quantity <= 0) {
            return res.status(400).json({ error: 'Valid variant_id and positive quantity required' });
        }

        const found = await InventoryService.findVariant(variant_id);
        if (!found || !found.variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }

        const available = await InventoryService.getAvailableStock(found.variant._id.toString());
        if (available < quantity) {
            return res.status(400).json({ error: `Only ${available} items available in stock` });
        }

        const cart = await getOrCreateCart(userId, sessionToken);

        const existingItem = cart.items.find(it => it.variantId === found.variant._id.toString() || it.sku === found.variant.sku);
        if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (available < newQty) {
                return res.status(400).json({ error: `Cannot add more than available stock (${available})` });
            }
            existingItem.quantity = newQty;
        } else {
            cart.items.push({
                variantId: found.variant._id.toString(),
                productId: found.product._id,
                productTitle: found.product.title,
                sku: found.variant.sku,
                price: found.variant.price,
                attributes: found.variant.attributes || {},
                quantity
            });
        }

        await cart.save();
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update quantity of item in cart
 */
const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const sessionToken = req.headers['x-session-token'] || req.body.session_token;
        const userId = req.userId || null;

        const cart = await getOrCreateCart(userId, sessionToken);
        const item = cart.items.id(id);
        if (!item) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        if (quantity <= 0) {
            cart.items.pull(id);
        } else {
            const available = await InventoryService.getAvailableStock(item.variantId);
            if (available < quantity) {
                return res.status(400).json({ error: `Requested quantity exceeds available stock (${available})` });
            }
            item.quantity = quantity;
        }

        await cart.save();
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Remove item from cart
 */
const removeCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionToken = req.headers['x-session-token'] || req.query.session_token;
        const userId = req.userId || null;

        const cart = await getOrCreateCart(userId, sessionToken);
        cart.items.pull(id);
        await cart.save();
        return getCart(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Clear cart
 */
const clearCart = async (req, res) => {
    try {
        const sessionToken = req.headers['x-session-token'] || req.query.session_token;
        const userId = req.userId || null;

        const cart = await getOrCreateCart(userId, sessionToken);
        cart.items = [];
        await cart.save();
        res.json({ message: 'Cart cleared', items: [], subtotal: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
