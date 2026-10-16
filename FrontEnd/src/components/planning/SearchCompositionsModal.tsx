//src/components/planning/SearchCompositionsModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import {
  searchCompositions,
  getCompositionDetail,
  clearSearchResults,
  clearCompositionDetail,
} from '@/lib/redux/slices/planningSlice';
import { SearchPlanningQuery, CompositionItem } from '@/lib/services/planningService';
import { X, Search, ChevronDown, ChevronUp, AlertCircle, FileText, Database, MapPin, Loader2 } from 'lucide-react';

interface SearchCompositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchCompositionsModal = ({ isOpen, onClose }: SearchCompositionsModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchResults, searchLoading, searchError, compositionDetail, compositionLoading } =
    useSelector((state: RootState) => state.planning);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedComposition, setSelectedComposition] = useState<string | null>(null);

  const limit = 10;

  const formatCurrency = (value: any) => {
    const num = Number(String(value || '0').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number.isFinite(num) ? num : 0
    );
  };

  const handleSearch = async () => {
    setPage(1);
    setSelectedComposition(null);

    const query: SearchPlanningQuery = {
      q: searchTerm || undefined,
      summaryOnly: true,
      page: 1,
      limit,
    };

    await dispatch(searchCompositions(query));
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);

    const query: SearchPlanningQuery = {
      q: searchTerm || undefined,
      summaryOnly: true,
      page: nextPage,
      limit,
    };

    const result = await dispatch(searchCompositions(query));
    if (searchCompositions.rejected.match(result)) {
      setPage(page);
    }
  };

  const handleExpandComposition = async (item: CompositionItem) => {
    if (selectedComposition === item._id) {
      // Toggle: fechar se já está aberto
      setSelectedComposition(null);
      dispatch(clearCompositionDetail());
    } else {
      // Abrir novo
      setSelectedComposition(item._id);
      await dispatch(
        getCompositionDetail({
          codigoComposicao: item.codigoComposicao,
          query: {
            isGlobal: item.isGlobal,
            state: item.state,
            referenceMonth: item.referenceMonth,
            referenceYear: item.referenceYear,
          },
        })
      );
    }
  };

  const handleClose = () => {
    dispatch(clearSearchResults());
    dispatch(clearCompositionDetail());
    setSearchTerm('');
    setPage(1);
    setSelectedComposition(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch, onClose]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  const compositions = searchResults?.items || [];
  const totalResults = searchResults?.total || 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Pesquisar Composições</h2>
          <button
            onClick={handleClose}
            aria-label="Fechar busca de composições"
            className="p-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Barra de Pesquisa */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Buscar por descrição, código, insumo..."
                className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="h-11 px-6 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searchLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando
                </>
              ) : (
                'Pesquisar'
              )}
            </button>
          </div>

          {/* Erro */}
          {searchError && (
            <div className="mb-6 p-4 bg-st-critical-bg border border-st-critical-border rounded-md flex items-center gap-3 text-st-critical">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{searchError}</p>
            </div>
          )}

          {/* Contagem de Resultados */}
          {searchResults && !searchLoading && (
            <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {totalResults} resultado(s) encontrado(s)
            </div>
          )}

          {/* Lista de Composições */}
          <div className="space-y-3">
            {compositions.length === 0 && !searchLoading && searchResults && (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhuma composição encontrada com os termos informados.</p>
              </div>
            )}

            {searchLoading && compositions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto block mb-4" />
                <p>Carregando composições...</p>
              </div>
            )}

            {compositions.map((composition) => (
              <div key={composition._id} className="border border-border bg-card rounded-md shadow-sm overflow-hidden transition-all">

                {/* Linha Principal (Header do Acordeão) */}
                <button
                  onClick={() => handleExpandComposition(composition)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {composition.codigoComposicao}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary-bg text-primary uppercase font-bold rounded-md tracking-wider">
                        {composition.grupo}
                      </span>
                      {composition.isGlobal ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-foreground border border-border uppercase font-bold rounded-md tracking-wider flex items-center gap-1">
                          <Database className="w-3 h-3" /> SINAPI
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary-bg text-primary border border-primary-border uppercase font-bold rounded-md tracking-wider">
                          CUSTOMIZADA
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {composition.descricao}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                      <span><strong>Unid:</strong> {composition.unidade}</span>
                      <span className="text-foreground"><strong>Custo:</strong> {formatCurrency(composition.custo)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {composition.state}</span>
                    </div>
                  </div>

                  <div className="text-muted-foreground p-2.5 rounded-md hover:bg-muted">
                    {selectedComposition === composition._id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Detalhe Expandido */}
                {selectedComposition === composition._id && (
                  <div className="bg-muted/10 border-t border-border p-5">
                    {compositionLoading && (
                      <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                        <span className="text-xs">Carregando detalhamento...</span>
                      </div>
                    )}

                    {compositionDetail && !compositionLoading && (
                      <div className="space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">

                        {/* Resumo */}
                        <div className="bg-background p-4 rounded-md border border-border shadow-sm">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Resumo Analítico</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Código</span>
                              <p className="font-semibold text-foreground">{compositionDetail.summary.codigoComposicao}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Tipo</span>
                              <p className="font-semibold text-foreground">{compositionDetail.summary.tipo || 'COMPOSIÇÃO'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Unidade de Medida</span>
                              <p className="font-semibold text-foreground">{compositionDetail.summary.unidade}</p>
                              {/* <p className="font-semibold text-foreground">{composition.unidade}</p> */}
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Custo Unitário Total</span>
                              <p className="font-bold text-primary">{formatCurrency(compositionDetail.summary.custo)}</p>
                              {/* <p className="font-bold text-primary">R$ {formatCurrency(composition.custo)}</p> */}
                            </div>
                          </div>
                        </div>

                        {/* Insumos */}
                        {compositionDetail.items.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                              Composição de Insumos ({compositionDetail.items.length})
                            </h4>
                            <div className="space-y-2">
                              {compositionDetail.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-background rounded-md border border-border shadow-sm gap-3"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground leading-tight">
                                      {item.descricao}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.insumo && `Cód. Insumo: ${item.insumo}`}
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right shrink-0 bg-muted/30 p-2 rounded-md border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-0.5">
                                      {item.coeficiente || 1} {item.unidade}
                                    </p>
                                    {/* <p className="text-sm font-bold text-foreground">
                                      R$ {formatCurrency(item.custo)}
                                    </p> */}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Carregar Mais */}
          {compositions.length > 0 && compositions.length < totalResults && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={searchLoading}
                className="min-h-11 px-6 bg-secondary text-secondary-foreground border border-border rounded-md text-sm font-bold hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
              >
                {searchLoading ? 'Carregando...' : 'Carregar mais resultados'}
              </button>
            </div>
          )}
        </div>

        {/* Footer / Botão Fechar */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/10">
          <button
            onClick={handleClose}
            className="min-h-11 px-6 bg-transparent border border-border text-foreground hover:bg-muted rounded-md text-sm font-bold transition-colors"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};