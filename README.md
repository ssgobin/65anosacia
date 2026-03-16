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
4. Abra o arquivo app.js e preencha o objeto firebaseConfig:

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
