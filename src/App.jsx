
import React, { useState } from 'react';
import {
    AppBar,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel,
    Select,
    MenuItem,
    InputLabel,
    Checkbox,
    FormGroup,
    Box,
    CssBaseline,
    OutlinedInput,
    Chip,
    Toolbar,
    Link
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';

// Componente principal da aplicação
const App = () => {
    // Estados principais
    const [itensJSON, definirItensJSON] = useState([]); // Itens lidos do JSON
    const [colunas, definirColunas] = useState([]); // Nomes das colunas
    const [tipoOperacao, definirTipoOperacao] = useState('UPDATE'); // Tipo de operação SQL
    const [nomeTabela, definirNomeTabela] = useState(''); // Nome da tabela
    const [colunasChave, definirColunasChave] = useState([]); // Colunas chave para WHERE
    const [colunasIgnoradas, definirColunasIgnoradas] = useState(new Set()); // Colunas a ignorar
    const [sqlGerado, definirSqlGerado] = useState(''); // SQL gerado
    const [registros, definirRegistros] = useState([]); // Log de operações
    const [arquivoCarregado, definirArquivoCarregado] = useState(false); // Controle de arquivo carregado

    // Adiciona mensagem ao log
    const adicionarRegistro = (mensagem) => {
        definirRegistros(logsAnteriores => [`[${new Date().toLocaleTimeString()}] ${mensagem}`, ...logsAnteriores]);
    };

    // Reseta o estado da interface
    const reiniciarInterface = () => {
        definirItensJSON([]);
        definirColunas([]);
        definirArquivoCarregado(false);
        definirSqlGerado('');
    };

    // Handler para seleção de arquivo JSON
    const aoSelecionarArquivo = (evento) => {
        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                const items = dados?.results?.[0]?.items;
                if (!items || items.length === 0) {
                    throw new Error("A estrutura 'results[0].items' não foi encontrada ou está vazia no JSON.");
                }

                adicionarRegistro(`Arquivo "${arquivo.name}" carregado.`);
                definirItensJSON(items);
                // Extrai as colunas únicas mantendo a ordem de aparição no JSON
                const colunasNaOrdem = Array.from(new Set(items.flatMap(item => Object.keys(item))));
                definirColunas(colunasNaOrdem);
                adicionarRegistro(`Colunas encontradas: ${colunasNaOrdem.length}`);
                definirColunasChave([]);
                definirColunasIgnoradas(new Set());
                definirArquivoCarregado(true);
                definirSqlGerado('');
            } catch (erro) {
                adicionarRegistro(`Erro: ${erro.message}`);
                alert(`Erro ao ler arquivo: ${erro.message}`);
                reiniciarInterface();
            }
        };
        leitor.readAsText(arquivo);
    };
    

    // Alterna seleção de coluna ignorada
    const aoMudarColunaIgnorada = (coluna) => {
        const novoConjunto = new Set(colunasIgnoradas);
        novoConjunto.has(coluna) ? novoConjunto.delete(coluna) : novoConjunto.add(coluna);
        definirColunasIgnoradas(novoConjunto);
    };

    // Geração do SQL ao submeter formulário
    const aoSubmeterFormulario = (evento) => {
        evento.preventDefault();
        adicionarRegistro('--- Iniciando Geração de SQL ---');
        const arrayIgnorados = Array.from(colunasIgnoradas);
        const comandosSQL = tipoOperacao === 'UPDATE'
            ? gerarInstrucoesUpdate(nomeTabela, colunasChave, arrayIgnorados)
            : gerarInstrucoesInsert(nomeTabela, arrayIgnorados);

        if (comandosSQL.length === 0) {
            adicionarRegistro('Nenhuma instrução SQL foi gerada.');
            alert('Nenhuma instrução SQL foi gerada com os critérios fornecidos.');
            return;
        }
        const conteudoSQL = comandosSQL.join('\n\n');
        definirSqlGerado(conteudoSQL);
        adicionarRegistro(`${comandosSQL.length} instruções geradas com sucesso.`);
    };

    // Copia o SQL gerado para a área de transferência
    const aoCopiar = () => {
        if (!sqlGerado) return;
        navigator.clipboard.writeText(sqlGerado).then(() => {
            adicionarRegistro('Conteúdo copiado para a área de transferência.');
            alert('SQL copiado com sucesso!');
        }).catch(err => {
            adicionarRegistro(`Erro ao copiar: ${err}`);
        });
    };

    // Formata valor para SQL (trata string longa, null, número)
    const formatarValorSQL = (valor, limite = 4000) => {
        if (valor === null || typeof valor === 'undefined') return 'NULL';
        if (typeof valor === 'number') return valor;
        const strValor = String(valor);
        const escaparAspas = (texto) => texto.replace(/'/g, "''");
        if (strValor.length <= limite) return `'${escaparAspas(strValor)}'`;
        adicionarRegistro(`Campo de texto longo detectado. Dividindo em partes de ${limite} caracteres.`);
        const partes = [];
        for (let i = 0; i < strValor.length; i += limite) {
            partes.push(strValor.substring(i, i + limite));
        }
        const partesFormatadas = partes.map(parte => `'${escaparAspas(parte)}'`);
        return partesFormatadas.join(' || ');
    };

    // Gera instruções INSERT
    const gerarInstrucoesInsert = (tblNome, colsIgnoradas) => {
        return itensJSON.flatMap(item => {
            const itemFiltrado = Object.fromEntries(Object.entries(item).filter(([chave]) => !colsIgnoradas.includes(chave)));
            if (Object.keys(itemFiltrado).length === 0) return [];
            const cols = Object.keys(itemFiltrado).join(', ');
            const vals = Object.values(itemFiltrado).map(v => formatarValorSQL(v, 4000)).join(', ');
            return [`INSERT INTO ${tblNome} (${cols}) VALUES (${vals});`];
        });
    };

    // Gera instruções UPDATE
    const gerarInstrucoesUpdate = (tblNome, colsChave, colsIgnoradas) => {
        const todasIgnoradas = [...colsIgnoradas, ...colsChave];
        
        return itensJSON.flatMap(item => {
            // Constrói a cláusula WHERE a partir das colunas de chave.
            const condicoesWhere = colsChave.map(col => {
                const valorChave = item[col];
                if (valorChave === null || typeof valorChave === 'undefined') {
                    return null; // Se qualquer parte da chave for nula, o item não pode ser atualizado de forma segura.
                }
                return `${col} = ${formatarValorSQL(valorChave)}`;
            });

            // Se alguma condição WHERE falhou (chave nula), pula este item.
            if (condicoesWhere.some(c => c === null) || condicoesWhere.length === 0) return [];

            // Filtra os campos que realmente serão atualizados.
            const camposUpdate = Object.fromEntries(Object.entries(item).filter(([chave]) => !todasIgnoradas.includes(chave)));
            if (Object.keys(camposUpdate).length === 0) return [];
            
            const clausulasSet = Object.entries(camposUpdate).map(([k, v]) => `${k} = ${formatarValorSQL(v, 4000)}`);

            if (clausulasSet.length > 0) {
                const clausulaSetCompleta = clausulasSet.join(', ');
                const clausulaWhereCompleta = condicoesWhere.join(' AND ');
                return [`UPDATE ${tblNome} SET ${clausulaSetCompleta} WHERE ${clausulaWhereCompleta};`];
            }
            
            return [];
        });
    };

    // Renderiza a interface da aplicação.
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <CodeIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Gerador de SQL Profissional
                    </Typography>
                </Toolbar>
            </AppBar>
            
            <Container component="main" maxWidth={false} sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1" gutterBottom>Gerador de Scripts SQL</Typography>
                        <Typography variant="subtitle1" color="text.secondary">Carregue um arquivo JSON e configure suas queries de forma rápida e intuitiva.</Typography>
                    </Box>

                    <form onSubmit={aoSubmeterFormulario}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>1. Configurações Iniciais</Typography>
                                <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                                    <Button variant="contained" component="label" fullWidth>
                                        Selecione o Arquivo JSON
                                        <input type="file" hidden accept=".json" onChange={aoSelecionarArquivo} />
                                    </Button>

                                    <FormControl fullWidth sx={{ mt: 3 }}>
                                        <FormLabel>Tipo de Operação</FormLabel>
                                        <RadioGroup row value={tipoOperacao} onChange={(e) => definirTipoOperacao(e.target.value)}>
                                            <FormControlLabel value="UPDATE" control={<Radio />} label="UPDATE" />
                                            <FormControlLabel value="INSERT" control={<Radio />} label="INSERT" />
                                        </RadioGroup>
                                    </FormControl>
                                    
                                    <TextField
                                        label="Nome da Tabela"
                                        value={nomeTabela}
                                        onChange={(e) => definirNomeTabela(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        required
                                        sx={{ mt: 2 }}
                                    />
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                {arquivoCarregado && (
                                    <>
                                        <Typography variant="h6" gutterBottom>2. Mapeamento de Colunas</Typography>
                                        <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                                            {tipoOperacao === 'UPDATE' && (
                                                <FormControl fullWidth sx={{ mb: 2 }}>
                                                    <InputLabel id="key-columns-label">Colunas Chave (p/ Update)</InputLabel>
                                                    <Select
                                                        labelId="key-columns-label"
                                                        multiple
                                                        value={colunasChave}
                                                        onChange={(e) => definirColunasChave(e.target.value)}
                                                        input={<OutlinedInput label="Colunas Chave (p/ Update)" />}
                                                        renderValue={(selected) => (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                {selected.map((value) => (
                                                                    <Chip key={value} label={value} />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    >
                                                        {colunas.map(col => (
                                                            <MenuItem key={col} value={col}>
                                                                <Checkbox checked={colunasChave.indexOf(col) > -1} />
                                                                <Typography>{col}</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                            <FormControl component="fieldset" fullWidth>
                                                <FormLabel>Colunas a Ignorar</FormLabel>
                                                <FormGroup sx={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', p: 1 }}>
                                                    {colunas.map(col => (
                                                        <FormControlLabel key={col} control={<Checkbox checked={colunasIgnoradas.has(col)} onChange={() => aoMudarColunaIgnorada(col)} />} label={col} />
                                                    ))}
                                                </FormGroup>
                                            </FormControl>
                                        </Paper>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                        
                        <Button type="submit" variant="contained" disabled={!arquivoCarregado} fullWidth sx={{ mt: 4, py: 1.5, fontSize: '1.1rem' }}>
                            Gerar Script SQL
                        </Button>
                    </form>
                </Paper>

                {sqlGerado && (
                    <Paper elevation={3} sx={{ mt: 4, borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #eee' }}>
                            <Typography variant="h5" component="h3">SQL Gerado</Typography>
                            <Button variant="outlined" onClick={aoCopiar}>Copiar</Button>
                        </Box>
                        <TextField
                            value={sqlGerado}
                            InputProps={{
                                readOnly: true,
                            }}
                            multiline
                            rows={12}
                            variant="filled"
                            fullWidth
                            sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }, '& .MuiInputBase-input': { overflowY: 'auto' } }}
                        />
                    </Paper>
                )}

                {registros.length > 0 && (
                     <Paper elevation={2} sx={{ mt: 4, p: 2, borderRadius: '12px' }}>
                        <Typography variant="h5" component="h3" sx={{ textAlign: 'center', mb: 2 }}>Log de Atividades</Typography>
                        <Box sx={{ background: '#222', color: '#eee', p: 2, borderRadius: '8px', height: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {registros.map((log, index) => <div key={index}>{log}</div>)}
                        </Box>
                    </Paper>
                )}
            </Container>

            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800] }}>
                <Container maxWidth="sm">
                    <Typography variant="body2" color="text.secondary" align="center">
                        {'© '}
                        <Link color="inherit" href="#">
                            STN
                        </Link>{' '}
                        {new Date().getFullYear()}
                        {'.'}
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};


export default App;
