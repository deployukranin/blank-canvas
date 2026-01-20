import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, RotateCcw, Search, AlertTriangle, CheckCircle, Upload, Download, FileText } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  getBlockedWords, 
  addBlockedWord, 
  removeBlockedWord, 
  resetToDefaultBlockedWords,
  moderateContent,
  importBlockedWords,
  exportBlockedWords,
  type ImportResult
} from '@/lib/content-moderation';

const AdminModeracao = () => {
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<{ isBlocked: boolean; blockedWords: string[] } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setBlockedWords(getBlockedWords());
  }, []);

  const filteredWords = blockedWords.filter(word => 
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    
    const word = newWord.toLowerCase().trim();
    if (blockedWords.includes(word)) {
      toast({
        title: 'Palavra já existe',
        description: 'Esta palavra já está na lista de bloqueio.',
        variant: 'destructive',
      });
      return;
    }

    addBlockedWord(word);
    setBlockedWords(getBlockedWords());
    setNewWord('');
    
    toast({
      title: 'Palavra adicionada',
      description: `"${word}" foi adicionada à lista de bloqueio.`,
    });
  };

  const handleRemoveWord = (word: string) => {
    removeBlockedWord(word);
    setBlockedWords(getBlockedWords());
    
    toast({
      title: 'Palavra removida',
      description: `"${word}" foi removida da lista de bloqueio.`,
    });
  };

  const handleReset = () => {
    resetToDefaultBlockedWords();
    setBlockedWords(getBlockedWords());
    
    toast({
      title: 'Lista restaurada',
      description: 'A lista de palavras bloqueadas foi restaurada ao padrão.',
    });
  };

  const handleImportFromText = () => {
    if (!importText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Cole ou digite as palavras para importar.',
        variant: 'destructive',
      });
      return;
    }

    const result = importBlockedWords(importText, importMode);
    setImportResult(result);
    setBlockedWords(getBlockedWords());
    
    toast({
      title: 'Importação concluída',
      description: `${result.added} palavras adicionadas, ${result.duplicates} duplicadas ignoradas.`,
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const content = exportBlockedWords();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palavras-bloqueadas.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Lista exportada',
      description: `${blockedWords.length} palavras exportadas com sucesso.`,
    });
  };

  const resetImportDialog = () => {
    setImportText('');
    setImportResult(null);
    setImportMode('merge');
  };

  const handleTestContent = () => {
    if (!testContent.trim()) return;
    const result = moderateContent(testContent);
    setTestResult(result);
  };

  return (
    <AdminLayout title="Moderação Automática">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Moderação Automática</h1>
          <p className="text-muted-foreground">
            Gerencie palavras bloqueadas para filtrar conteúdo inapropriado automaticamente
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Blocked Words Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Palavras Bloqueadas</h2>
                </div>
                <Badge variant="secondary">{blockedWords.length} palavras</Badge>
              </div>

              {/* Add new word */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Adicionar palavra ou frase..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                />
                <Button onClick={handleAddWord} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar palavra..."
                  className="pl-10"
                />
              </div>

              {/* Words list */}
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {filteredWords.length > 0 ? (
                  filteredWords.map((word, index) => (
                    <motion.div
                      key={word}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 group"
                    >
                      <span className="text-sm font-mono">{word}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleRemoveWord(word)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'Nenhuma palavra encontrada' : 'Lista vazia'}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Dialog open={importDialogOpen} onOpenChange={(open) => {
                    setImportDialogOpen(open);
                    if (!open) resetImportDialog();
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2">
                        <Upload className="w-4 h-4" />
                        Importar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Importar Lista de Palavras</DialogTitle>
                        <DialogDescription>
                          Importe palavras de um arquivo .txt ou cole diretamente. Uma palavra por linha ou separadas por vírgula.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* File upload */}
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".txt,.csv"
                            onChange={handleFileImport}
                            className="hidden"
                          />
                          <Button 
                            variant="outline" 
                            className="w-full gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText className="w-4 h-4" />
                            Selecionar arquivo (.txt, .csv)
                          </Button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">ou cole abaixo</span>
                          </div>
                        </div>

                        {/* Text area for paste */}
                        <textarea
                          value={importText}
                          onChange={(e) => {
                            setImportText(e.target.value);
                            setImportResult(null);
                          }}
                          placeholder="palavra1&#10;palavra2&#10;palavra3&#10;&#10;ou: palavra1, palavra2, palavra3"
                          className="w-full h-32 p-3 rounded-lg bg-muted/30 border border-border resize-none text-sm font-mono"
                        />

                        {/* Import mode */}
                        <div className="flex gap-2">
                          <Button 
                            variant={importMode === 'merge' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setImportMode('merge')}
                          >
                            Mesclar
                          </Button>
                          <Button 
                            variant={importMode === 'replace' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setImportMode('replace')}
                          >
                            Substituir tudo
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {importMode === 'merge' 
                            ? 'Adiciona novas palavras mantendo as existentes' 
                            : 'Substitui toda a lista pelas palavras importadas'}
                        </p>

                        {/* Import result */}
                        {importResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Resultado da importação</span>
                            </div>
                            <ul className="text-xs space-y-1 text-muted-foreground">
                              <li>✓ {importResult.added} palavras adicionadas</li>
                              {importResult.duplicates > 0 && (
                                <li>⊘ {importResult.duplicates} duplicadas (ignoradas)</li>
                              )}
                              {importResult.invalid > 0 && (
                                <li>✗ {importResult.invalid} inválidas (muito curtas)</li>
                              )}
                            </ul>
                          </motion.div>
                        )}

                        <Button 
                          onClick={handleImportFromText}
                          className="w-full"
                          disabled={!importText.trim()}
                        >
                          Importar Palavras
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleExport} className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                </div>

                <Button variant="outline" onClick={handleReset} className="w-full gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Restaurar padrão
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Test Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h2 className="font-semibold">Testar Moderação</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Teste como a moderação automática funciona digitando um texto abaixo.
              </p>

              <div className="space-y-4">
                <textarea
                  value={testContent}
                  onChange={(e) => {
                    setTestContent(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="Digite um texto para testar a moderação..."
                  className="w-full h-32 p-3 rounded-lg bg-muted/30 border border-border resize-none text-sm"
                />

                <Button onClick={handleTestContent} className="w-full">
                  Testar Conteúdo
                </Button>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      testResult.isBlocked 
                        ? 'bg-destructive/10 border border-destructive/30' 
                        : 'bg-green-500/10 border border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.isBlocked ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="font-semibold text-destructive">Conteúdo Bloqueado</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-green-500">Conteúdo Aprovado</span>
                        </>
                      )}
                    </div>
                    
                    {testResult.isBlocked && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Palavras encontradas: </span>
                          {testResult.blockedWords.map((word, i) => (
                            <Badge key={i} variant="destructive" className="mr-1 text-xs">
                              {word}
                            </Badge>
                          ))}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </GlassCard>

            {/* Instructions */}
            <GlassCard className="p-6 mt-6">
              <h3 className="font-semibold mb-3">Como funciona</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Palavras e frases são verificadas automaticamente ao criar ideias ou comentários
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Conteúdo com palavras bloqueadas é impedido de ser publicado
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  A verificação não diferencia maiúsculas de minúsculas
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Frases completas também podem ser bloqueadas
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminModeracao;
