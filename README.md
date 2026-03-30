# Formulario de Confirmacao - Jantar

Pagina de confirmacao com:
- Nome completo
- Selecao PF/PJ
- CPF ou CNPJ dinamico (com mascara e validacao)
- Celular/WhatsApp (com mascara e validacao)
- Selecao de acompanhante
- Dados completos do acompanhante quando aplicavel
- Termo de concordancia obrigatorio
- Envio para Firebase Firestore

## 1) Configurar Firebase

1. Crie um projeto no Firebase (ou use um existente).
2. Ative o Firestore Database.
3. No console do Firebase, pegue as credenciais Web App.
4. Abra o arquivo `assets/js/app.js` e preencha o objeto firebaseConfig:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

## 2) Rodar localmente

Opcao A: abrir o index.html direto no navegador.
Opcao B (recomendado): usar uma extensao como Live Server no VS Code.

## Estrutura de Pastas

- `index.html` (formulario publico)
- `assets/css/` (estilos)
- `assets/js/` (scripts)
- `pages/admin/` (login, painel admin, painel TI e gestao de cargos)
- `img/` (imagens)

## 3) Colecao no Firestore

Os registros sao salvos na colecao:
- confirmacoes_jantar

## 4) Validacoes implementadas

- Nome completo: minimo nome + sobrenome.
- CPF: mascara e validacao de digitos verificadores.
- CNPJ: mascara e validacao de digitos verificadores.
- Celular: mascara BR e validacao de 11 digitos (com nono digito).
- Acompanhante: campos obrigatorios e validados quando selecionado "sim".
- Termos: envio bloqueado ate aceitar os termos.

## 5) Bloqueio Automático de Confirmações

### Como Funciona

O sistema bloqueia automaticamente as confirmações após uma data/hora especificada. Por padrão, o bloqueio ocorre em **20/03/2026 às 12:00**.

### Dados Armazenados

As configurações de bloqueio são armazenadas no Firestore no documento `config/sistema`:

```
{
  blockDate: "YYYY-MM-DD",      // Data de bloqueio
  blockTime: "HH:MM",           // Hora de bloqueio
  blockMessage: "mensagem",     // Mensagem customizada
  updatedAt: "ISO datetime"     // Timestamp da atualização
}
```

### Mensagem Padrão de Bloqueio

Quando o formulário está bloqueado, exibe:
> O tempo de confirmação acabou :( A confirmação de presença foi encerrada. Caso tenha alguma dúvida, entre em contato com: 19 99246-2193

## 6) Pagina de Administracao TI (pages/admin/adm_ti.html) - TOTALMENTE CONFIGURAVEL

### 🎛️ Tudo é Configurável!

A página adm_ti permite alterar **TODAS** as configurações do sistema através de 5 abas:

#### 📅 ABA 1: EVENTO
- **Título do Evento** - Nome do evento
- **Data do Evento** - Formato: YYYY-MM-DD
- **Hora do Evento** - Formato: HH:MM
- **Local do Evento** - Nome do local
- **URL do Google Maps** - Link completo do mapa

*Estas mudanças são refletidas imediatamente na página de confirmação (index.html)*

#### 🔒 ABA 2: BLOQUEIO
- **Data de Bloqueio** - Quando encerrar as confirmações
- **Hora de Bloqueio** - Horário específico
- **Mensagem de Bloqueio** - Texto customizado quando formulário bloqueia
- **Botão "Restaurar Padrões"** - Volta TODAS as configurações aos valores iniciais

#### 📞 ABA 3: CONTATO
- **Telefone de Suporte** - WhatsApp/Telefone para dúvidas
- Este telefone é mencionado na mensagem de bloqueio padrão

#### 👤 ABA 4: ADMINISTRAÇÃO
- **Emails Autorizados** - Lista de emails que podem acessar adm_ti
- Um email por linha
- Emails sãoautomaticamente convertidos para lowercase
- Qualquer pessoa pode fazer login com email de admin no sistema - será redirecionada se não está na lista autorizada

#### 💬 ABA 5: MENSAGENS
- **Mensagem de Sucesso** - Exibida quando confirmação é enviada
- **Termos de Participação** - Texto que convidado deve aceitar
- Suporta quebra de linhas

### Dados Armazenados no Firestore

Tudo é salvo em: `config/sistema`

```
{
  // Evento
  eventTitle: string,
  eventDate: "YYYY-MM-DD",
  eventTime: "HH:MM",
  eventLocation: string,
  eventMapsUrl: string,
  
  // Bloqueio
  blockDate: "YYYY-MM-DD",
  blockTime: "HH:MM",
  blockMessage: string,
  
  // Contato
  supportPhone: string,
  
  // Administração
  allowedAdminEmails: [string],
  
  // Mensagens
  successMessage: string,
  termsText: string,
  
  // Metadados
  updatedAt: ISO datetime
}
```

### Valores Padrão

Se nenhuma configuração for salva, o sistema usa estes valores:

```js
{
  eventTitle: "Celebração dos 65 anos da ACIA",
  eventDate: "2026-03-26",
  eventTime: "19:00",
  eventLocation: "Villa Americana",
  eventMapsUrl: "https://www.google.com/maps/...",
  blockDate: "2026-03-20",
  blockTime: "12:00",
  blockMessage: "O tempo de confirmação acabou :(\nA confirmação de presença foi encerrada.\nCaso tenha alguma dúvida, entre em contato com: 19 99246-2193",
  supportPhone: "19 99246-2193",
  allowedAdminEmails: ["admin@acia.com.br"],
  successMessage: "Sua participação foi registrada. Vai ser uma noite inesquecível...",
  termsText: "Ao participar deste jantar, você confirma que..."
}
```

### Acesso

1. Clique em "⚙ Configuracoes do Sistema" no painel principal (pages/admin/admin.html)
2. Faça login com uma conta de administrador (padrão: admin@acia.com.br)
3. Edite qualquer configuração nas abas
4. Clique em "Salvar" na aba correspondente
5. As mudanças são aplicadas imediatamente em todo o sistema

### Fluxo de Configuração

```
Usuario faz login -> Vai para adm_ti -> Edita configuracoes -> Clica Salvar
                                              ↓
                                    Firestore recebe dados
                                              ↓
                                    index.html carrega config
                                              ↓
                                    Página atualiza dinamicamente
```

### Exemplo de Uso

Para mudar a data do evento:
1. Va para **pages/admin/adm_ti.html** -> Aba **Evento**
2. Altere "Data do Evento" para a nova data
3. Clique "Salvar Evento"
4. Pronto! A página de confirmação (index.html) já mostra a nova data

## 7) Gestao de Cargos (pages/admin/cargos.html)

- Lista todos os confirmados.
- Cada confirmado possui o botao "Aplicar cargo" com modal de selecao.
- Cargos disponiveis:
  - Autoridades (dourado)
  - Homenageados (verde citrico)
  - Ex-presidentes (vermelho)
  - Patrocinadores (lilas)
  - Diretoria (azul-marinho)
- Botao "Cadastrar novo" com os mesmos campos do formulario original e campo extra de cargo.
- O painel principal de administracao mostra contagem por cargo e badge de cargo ao lado do nome.

## 8) QR Code e Envio de E-mail

### Como Funciona

Quando um convidado confirma presença (sem acompanhante), o sistema:
1. Gera um token aleatório seguro (24 bytes, hexadecimal)
2. Salva o token no banco de dados junto com os dados do convidado
3. Envia um e-mail com o QR Code para o endereço informado
4. O QR Code contém um link para verificação: `https://seusite/verify?token=TOKEN`

### Dados Armazenados

No Firestore, cada confirmação agora inclui:

```
{
  // ... outros campos
  email: "email@exemplo.com",
  qrCodeToken: "a1b2c3d4e5f6...",
  qrCodeUsed: false,
  qrCodeUsedAt: null,
  companion: {
    // ... dados do acompanhante
    qrCodeToken: "...",
    qrCodeUsed: false,
    qrCodeUsedAt: null
  }
}
```

### Painel Admin - Leitor de QRCode

O painel de administração (pages/admin/admin.html) agora inclui:
- **Leitor de QRCode via câmera**: Abre a câmera do dispositivo para escanear QR Codes
- **Entrada manual de token**: Possibilidade de digitar o token manualmente
- **Verificação em tempo real**: Ao escanear, o sistema verifica automaticamente no banco de dados
- **Check-in automático**: Se o QR Code for válido e não utilizado, registra o check-in automaticamente

### Deploy das Cloud Functions

Para que o envio de e-mail funcione, é necessário fazer o deploy das Cloud Functions:

```bash
# 1. Instale o Firebase CLI
npm install -g firebase-tools

# 2. Faça login
firebase login

# 3. Deploy das funções
firebase deploy --only functions
```

### Configuração de SMTP

As configurações de SMTP estão em `functions/index.js`:

```js
const SMTP_CONFIG = {
    host: 'mail.acia.com.br',
    port: 587,
    secure: false,
    auth: {
        user: 'confirmacao@acia.com.br',
        pass: 'c9bHtdLgFaB9XwM4zuUK'
    }
};
```

### Segurança do Token

- Tokens são gerados usando `crypto.getRandomValues()` (24 bytes aleatórios)
- Não são sequenciais ou previsíveis
- Cada convidado (e acompanhante) tem seu próprio token
- QR Code pode ser usado apenas uma vez
- Após uso, registra o horário de entrada


