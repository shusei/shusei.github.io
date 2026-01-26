"use client";

import { useState } from "react";
import axios from "axios";
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [mapping, setMapping] = useState<any>(null);
    const [pdfTransactions, setPdfTransactions] = useState<any[] | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMapping(null);
            setPdfTransactions(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setMapping(null);
        setPdfTransactions(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", "b8b8984a-0782-4e36-b5ad-ce42ae297d1b");

        try {
            if (file.name.endsWith(".csv")) {
                const res = await axios.post("http://localhost:3002/api/import/analyze", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setMapping(res.data.suggestion);
                toast.success("CSV 分析完成", { description: "AI 已自動對應欄位" });
            } else if (file.name.endsWith(".pdf")) {
                const res = await axios.post("http://localhost:3002/api/import/pdf", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setPdfTransactions(res.data.transactions);
                toast.success("PDF 分析完成", { description: `共找到 ${res.data.transactions.length} 筆交易` });
            } else {
                toast.error("不支援的檔案格式");
            }
        } catch (err) {
            console.error(err);
            toast.error("分析失敗", { description: "請確認檔案格式" });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleImportCsv = async () => {
        if (!file || !mapping) return;
        setImporting(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", "b8b8984a-0782-4e36-b5ad-ce42ae297d1b");
        formData.append("mapping", JSON.stringify(mapping));

        try {
            await axios.post("http://localhost:3002/api/import/start", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("匯入任務已開始", { description: "系統將在背景處理您的檔案" });
            setFile(null);
            setMapping(null);
        } catch (err) {
            console.error(err);
            toast.error("匯入失敗");
        } finally {
            setImporting(false);
        }
    };

    const handleSavePdf = async () => {
        if (!pdfTransactions) return;
        setImporting(true);

        try {
            let successCount = 0;
            // Simple loop for now. In production, use a bulk endpoint.
            for (const tx of pdfTransactions) {
                try {
                    await axios.post("http://localhost:3002/api/transactions", {
                        user_id: "b8b8984a-0782-4e36-b5ad-ce42ae297d1b",
                        ...tx
                    });
                    successCount++;
                } catch (e) {
                    console.error("Failed to save tx", tx, e);
                }
            }
            toast.success("匯入完成", { description: `成功儲存 ${successCount} 筆交易` });
            setFile(null);
            setPdfTransactions(null);
        } catch (err) {
            console.error(err);
            toast.error("儲存失敗");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">智慧匯入</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Area */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. 上傳檔案 (CSV / PDF)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition">
                            {file && file.name.endsWith('.pdf') ? (
                                <FileText className="w-10 h-10 text-red-500 mb-4" />
                            ) : (
                                <FileSpreadsheet className="w-10 h-10 text-green-500 mb-4" />
                            )}
                            <p className="text-sm text-muted-foreground mb-4">
                                支援銀行對帳單 (CSV) 或電子帳單 (PDF)
                            </p>
                            <input
                                type="file"
                                accept=".csv,.pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-sky-50 file:text-sky-700
                                hover:file:bg-sky-100"
                            />
                        </div>

                        {file && (
                            <Button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full"
                            >
                                {analyzing ? "AI 分析中..." : "開始分析"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* CSV Mapping Preview */}
                {mapping && (
                    <Card className="border-sky-200 bg-sky-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-sky-700">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                2. 確認 CSV 欄位
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>系統欄位</TableHead>
                                        <TableHead>CSV 欄位 (AI 建議)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(mapping).map(([key, value]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium capitalize">{key}</TableCell>
                                            <TableCell>{String(value)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Button
                                onClick={handleImportCsv}
                                disabled={importing}
                                className="w-full bg-sky-600 hover:bg-sky-700"
                            >
                                {importing ? "匯入中..." : "確認並匯入 CSV"}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* PDF Preview */}
                {pdfTransactions && (
                    <Card className="border-sky-200 bg-sky-50/30 col-span-2 md:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center text-sky-700">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                2. 確認 PDF 交易內容
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>日期</TableHead>
                                            <TableHead>描述</TableHead>
                                            <TableHead>金額</TableHead>
                                            <TableHead>分類</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pdfTransactions.map((tx, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{tx.date}</TableCell>
                                                <TableCell>{tx.description}</TableCell>
                                                <TableCell className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    {tx.amount}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{tx.category}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <Button
                                onClick={handleSavePdf}
                                disabled={importing}
                                className="w-full bg-sky-600 hover:bg-sky-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {importing ? "儲存中..." : `確認並儲存 (${pdfTransactions.length} 筆)`}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
