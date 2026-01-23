"use client";

import { useState } from "react";
import axios from "axios";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
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

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [mapping, setMapping] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMapping(null); // Reset mapping on new file
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", "b8b8984a-0782-4e36-b5ad-ce42ae297d1b"); // Hardcoded

        try {
            const res = await axios.post("http://localhost:3000/api/import/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setMapping(res.data.suggestion);
            toast.success("分析完成", { description: "AI 已自動對應欄位" });
        } catch (err) {
            console.error(err);
            toast.error("分析失敗", { description: "請確認 CSV 格式" });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleImport = async () => {
        if (!file || !mapping) return;
        setImporting(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", "b8b8984a-0782-4e36-b5ad-ce42ae297d1b");
        formData.append("mapping", JSON.stringify(mapping));

        try {
            await axios.post("http://localhost:3000/api/import/start", formData, {
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

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">智慧匯入</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Area */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. 上傳 CSV 檔案</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition">
                            <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                                支援標準 CSV 格式 (銀行對帳單、Excel 匯出)
                            </p>
                            <input
                                type="file"
                                accept=".csv"
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

                {/* Mapping Preview */}
                {mapping && (
                    <Card className="border-sky-200 bg-sky-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-sky-700">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                2. 確認欄位對應
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
                                onClick={handleImport}
                                disabled={importing}
                                className="w-full bg-sky-600 hover:bg-sky-700"
                            >
                                {importing ? "匯入中..." : "確認並匯入"}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
