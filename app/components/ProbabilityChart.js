"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProbabilityChart({ data, teamName }) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        hide={true}
                        padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                        hide={false}
                        domain={[0, 1]}
                        tickFormatter={(value) => `R$${value.toFixed(2)}`}
                        stroke="#666675"
                        fontSize={12}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a20',
                            border: '1px solid #292932',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value) => [`R$ ${value.toFixed(2)}`, teamName]}
                        labelStyle={{ color: '#a0a0b0' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#00e676"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
