//src/components/dashboard/settings/StorageManagement.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    HardDrive, FileText, Image as ImageIcon, File,
    Trash2, ExternalLink, AlertTriangle, Loader2, ArrowUpDown
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axiosInstance from "@/lib/api/axiosInstance";

// Limites fixos em Bytes
const LIMITS = {
    FREE: 500 * 1024 * 1024,       // 500 MB
    PRO: 50 * 1024 * 1024 * 1024,  // 50 GB
    ENTERPRISE: 500 * 1024 * 1024 * 1024, // 500 GB
};

interface FileAsset {
    _id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
}

type SortKey = 'fileName' | 'mimeType' | 'sizeBytes' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function StorageManagement() {
    const currentOrg = useSelector(selectCurrentOrg);

    const orgId = typeof currentOrg?.organizationId === "object"
        ? (currentOrg.organizationId as any)._id
        : currentOrg?.organizationId;

    const orgRole = currentOrg?.role || 'MEMBER';
    const orgPlan = (typeof currentOrg?.organizationId === "object" ? (currentOrg.organizationId as any).plan : 'FREE') as keyof typeof LIMITS;

    const [assets, setAssets] = useState<FileAsset[]>([]);
    const [storageUsed, setStorageUsed] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Estado de Ordenação da Tabela
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'createdAt',
        direction: 'desc'
    });

    const storageLimit = LIMITS[orgPlan] || LIMITS.FREE;

    // Busca os arquivos e o uso total no Back-end
    const fetchStorageData = async () => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            // Esta rota ainda vamos criar no NestJS no próximo passo!
            const response = await axiosInstance.get(`/storage/assets`);
            setAssets(response.data.assets);
            setStorageUsed(response.data.storageUsed);
        } catch (error) {
            console.error("Erro ao buscar dados de armazenamento:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStorageData();
    }, [orgId]);

    // Função utilitária para formatar Bytes em MB, GB
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // Lógica de Ordenação
    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedAssets = useMemo(() => {
        const sortableItems = [...assets];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [assets, sortConfig]);

    // Lógica de Exclusão
    const handleDelete = async (asset: FileAsset, e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que a linha seja clicada e abra o link

        if (orgRole === 'MEMBER') {
            return alert("Apenas administradores podem excluir arquivos do acervo.");
        }

        const confirmDelete = window.confirm(
            `ATENÇÃO: Você está prestes a excluir definitivamente o arquivo "${asset.fileName}".\n\n` +
            `Se este arquivo estiver anexado a algum Parecer Técnico ou Diário de Obra, o link será quebrado e ele deixará de aparecer no sistema para todos os usuários.\n\n` +
            `Deseja realmente continuar?`
        );

        if (!confirmDelete) return;

        try {
            setIsDeleting(asset._id);
            await axiosInstance.delete(`/storage/assets/${asset._id}`, {
                headers: { 'x-org-role': orgRole }
            });

            // Atualiza a tela instantaneamente
            setAssets(prev => prev.filter(item => item._id !== asset._id));
            setStorageUsed(prev => Math.max(0, prev - asset.sizeBytes));

        } catch (error) {
            console.error("Erro ao excluir arquivo:", error);
            alert("Falha ao excluir o arquivo.");
        } finally {
            setIsDeleting(null);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    // Cálculos da Barra de Progresso
    const usagePercentage = Math.min(100, (storageUsed / storageLimit) * 100);
    const isNearLimit = usagePercentage > 85;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 border border-border rounded-md bg-card">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Calculando espaço em disco...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-5 border border-border rounded-md bg-card shadow-sm">

            {/* HEADER E PROGRESS BAR */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${isNearLimit ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Gerenciador de Armazenamento</h3>
                            <p className="text-sm text-muted-foreground">Consumo do plano <span className="font-bold uppercase">{orgPlan}</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black tracking-tight">{formatBytes(storageUsed, 0)}</span>
                        <span className="text-sm text-muted-foreground font-medium"> / {formatBytes(storageLimit, 0)}</span>
                    </div>
                </div>

                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${isNearLimit ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${usagePercentage}%` }}
                    />
                </div>

                {isNearLimit && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Você está se aproximando do limite de armazenamento. Exclua arquivos antigos ou faça upgrade de plano.
                    </div>
                )}
            </div>

            {/* TABELA DE ARQUIVOS */}
            <div className="border border-border rounded-md overflow-hidden bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                            <tr>
                                <th onClick={() => handleSort('fileName')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors group">
                                    <div className="flex items-center gap-1">Arquivo <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th onClick={() => handleSort('mimeType')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors group w-24">
                                    <div className="flex items-center gap-1">Tipo <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th onClick={() => handleSort('sizeBytes')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors group w-32">
                                    <div className="flex items-center gap-1">Tamanho <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th onClick={() => handleSort('createdAt')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors group w-40">
                                    <div className="flex items-center gap-1">Data de Envio <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold text-right w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-medium">
                                        Nenhum arquivo armazenado na nuvem ainda.
                                    </td>
                                </tr>
                            ) : (
                                sortedAssets.map((asset) => (
                                    <tr
                                        key={asset._id}
                                        onClick={() => window.open(asset.fileUrl, '_blank')}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                                            {getFileIcon(asset.mimeType)}
                                            <span className="truncate max-w-[200px] md:max-w-xs" title={asset.fileName}>
                                                {asset.fileName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs uppercase tracking-wider">
                                            {asset.mimeType.split('/')[1] || 'FILE'}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-foreground">
                                            {formatBytes(asset.sizeBytes)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                                    title="Abrir arquivo"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>

                                                {(orgRole === 'OWNER' || orgRole === 'ADMIN') && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(asset, e)}
                                                        disabled={isDeleting === asset._id}
                                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                        title="Excluir arquivo permanentemente"
                                                    >
                                                        {isDeleting === asset._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}