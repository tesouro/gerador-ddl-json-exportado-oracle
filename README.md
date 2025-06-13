# Gerador DDL a partir de JSON exportado do Oracle

> Gere scripts SQL (INSERT/UPDATE) facilmente a partir de arquivos JSON exportados do Oracle, com interface web moderna em React + Material UI.

Acesse em: https://tesouro.github.io/gerador-ddl-json-exportado-oracle/

## Visão Geral

Este projeto é uma aplicação web que permite importar arquivos JSON exportados do Oracle (estrutura `results[0].items`) e gerar scripts SQL para popular ou atualizar tabelas do banco de dados. Ideal para DBAs, desenvolvedores e analistas que precisam transformar dados exportados em comandos SQL rapidamente.

## Funcionalidades

- Upload de arquivos JSON exportados do Oracle
- Detecção automática das colunas
- Escolha entre geração de scripts `INSERT` ou `UPDATE`
- Seleção da coluna chave para `UPDATE`
- Seleção de colunas a serem ignoradas
- Visualização e cópia do SQL gerado
- Log de atividades para rastreabilidade

## Tecnologias Utilizadas

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Material UI (MUI)](https://mui.com/)

## Como Usar

1. **Instale as dependências:**
   ```bash
   npm install
   ```
2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
3. **Acesse no navegador:**
   Abra [http://localhost:5173](http://localhost:5173)
4. **Carregue seu arquivo JSON:**
   - Clique em "Selecione o Arquivo JSON" e escolha o arquivo exportado do Oracle.
   - Configure as opções desejadas (tipo de operação, coluna chave, colunas a ignorar).
   - Clique em "Gerar Script SQL".
   - Copie o SQL gerado para uso no seu banco de dados.

## Estrutura esperada do JSON

O arquivo deve conter a estrutura:

```json
{
  "results": [
    {
      "items": [
        { "coluna1": "valor", "coluna2": 123, ... },
        ...
      ]
    }
  ]
}
```

## Scripts Disponíveis

- `npm run dev` — Inicia o servidor de desenvolvimento
- `npm run build` — Gera a versão de produção
- `npm run preview` — Visualiza a build de produção localmente
- `npm run lint` — Executa o linter

## Licença

MIT
