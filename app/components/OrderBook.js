"use client";
import React, { useState, useEffect } from 'react';
import styles from './OrderBook.module.css';

export default function OrderBook({ match, selectedSide }) {
    const [asks, setAsks] = useState([]);
    const [bids, setBids] = useState([]);

    // Mock data generator for order book
    const generateOrders = (basePrice, isBuy) => {
        const orders = [];
        let currentPrice = basePrice;
        for (let i = 0; i < 5; i++) {
            // Price variations
            const priceStep = 0.01;
            currentPrice = isBuy ? currentPrice - priceStep : currentPrice + priceStep;

            // Volume variations
            const quantity = Math.floor(Math.random() * 5000) + 100;

            orders.push({ price: currentPrice, quantity });
        }
        return orders;
    };

    const teamName = selectedSide === 'home' ? match.homeTeam : match.awayTeam;
    const basePrice = selectedSide === 'home' ? match.homePrice : match.awayPrice;

    // Removed sync declaration to avoid conflict with state

    useEffect(() => {
        // Generate mock bids (Buys) and Asks (Sells) around the current price
        // This is now Client-Side only, preventing hydration mismatch
        setAsks(generateOrders(basePrice, false).reverse());
        setBids(generateOrders(basePrice, true));
    }, [basePrice, selectedSide]); // Re-run if props change

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Livro de Ofertas ({teamName})</h3>

            <div className={styles.tableHeader}>
                <span>Preço</span>
                <span>Quantidade</span>
                <span>Total</span>
            </div>

            <div className={styles.scrollArea}>
                {/* Asks (Sells) - Red/Orange */}
                <div className={styles.asks}>
                    {asks.map((order, i) => (
                        <div key={`ask-${i}`} className={styles.row}>
                            <span className={styles.priceAsk}>R$ {order.price.toFixed(2)}</span>
                            <span className={styles.qty}>{order.quantity}</span>
                            <span className={styles.total}>R$ {(order.price * order.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <div className={styles.depthBarAsk} style={{ width: `${(order.quantity / 5000) * 100}%` }}></div>
                        </div>
                    ))}
                </div>

                {/* Current Spread/Price Indicator */}
                <div className={styles.spread}>
                    <span className={styles.spreadLabel}>Último Preço: R$ {basePrice.toFixed(2)}</span>
                </div>

                {/* Bids (Buys) - Green */}
                <div className={styles.bids}>
                    {bids.map((order, i) => (
                        <div key={`bid-${i}`} className={styles.row}>
                            <span className={styles.priceBid}>R$ {order.price.toFixed(2)}</span>
                            <span className={styles.qty}>{order.quantity}</span>
                            <span className={styles.total}>R$ {(order.price * order.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <div className={styles.depthBarBid} style={{ width: `${(order.quantity / 5000) * 100}%` }}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
