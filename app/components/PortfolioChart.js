"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PortfolioChart({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#292932" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#666675', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        minTickGap={30}
                    />
                    <YAxis
                        hide={false}
                        tickFormatter={(value) => `R$${value}`}
                        stroke="#666675"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a20',
                            border: '1px solid #292932',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#00e676' }}
                        formatter={(value) => [`R$ ${value.toFixed(2)}`, "Saldo"]}
                        labelStyle={{ color: '#a0a0b0', marginBottom: '4px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#00e676"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
