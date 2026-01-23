"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: string;
    type: 'income' | 'expense';
    category: string;
    source: string;
    transaction_date: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/transactions", {
                    params: {
                        user_id: "b8b8984a-0782-4e36-b5ad-ce42ae297d1b", // Hardcoded for demo
                        limit: 100
                    }
                });
                setTransactions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">交易紀錄</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>近期帳務</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>日期</TableHead>
                                <TableHead>描述</TableHead>
                                <TableHead>分類</TableHead>
                                <TableHead>來源</TableHead>
                                <TableHead className="text-right">金額</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        載入中...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        目前沒有交易紀錄
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            {format(new Date(tx.transaction_date), "yyyy-MM-dd")}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {tx.category || 'Uncategorized'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-muted-foreground text-xs">
                                            {tx.source}
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
