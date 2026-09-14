# ERP Vaccinar TI

Sistema de controle de contas a pagar para a empresa Vaccinar, focado no departamento de TI.

## Funcionalidades

- **Autenticação**: Login com Firebase Auth
- **Gestão de Contas**: Adicionar, editar, remover notas de serviço e produto
- **Filtros**: Por mês, filial e busca por texto
- **Ações**: Enviar e-mails para processamento, aprovação de valores altos, replicar para próximo mês
- **Importação CSV**: Importar dados de notas via arquivo CSV
- **Relatórios**: Totais pendentes e enviados

## Estrutura do Projeto

- `index.html`: Interface principal
- `style.css`: Estilos CSS
- `app.js`: Ponto de entrada da aplicação
- `auth.js`: Gerenciamento de autenticação
- `data.js`: Operações com Firebase Database
- `ui.js`: Funções de interface e eventos
- `utils.js`: Utilitários (formatação, validação, parsing)
- `config.js`: Configurações e constantes

## Como Executar

1. Clone o repositório
2. Inicie um servidor local na pasta do projeto: `python -m http.server 8000`
3. Acesse `http://localhost:8000` no navegador

> Não abra `index.html` diretamente pelo sistema de arquivos (`file://`). O projeto usa módulos ES e imports do Firebase, que exigem uma origem HTTP para funcionar corretamente.

## Configuração Firebase

As configurações estão em `config.js`. Para produção, considere mover para variáveis de ambiente.

## Melhorias Implementadas

- Refatoração em módulos ES6
- Tratamento de erros
- Validação de entrada (valores, datas)
- Indicadores de carregamento
- Configurações centralizadas
- Importação CSV funcional

## Tecnologias

- HTML5, CSS3, JavaScript ES6
- Firebase (Auth, Realtime Database)
- Font Awesome para ícones