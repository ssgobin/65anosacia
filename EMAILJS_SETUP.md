# Configuração do EmailJS (Gratuito)

O sistema agora usa **EmailJS** para enviar os e-mails com QR Code - sem custos mensais!

## Passo a Passo

### 1. Criar conta no EmailJS
1. Acesse https://www.emailjs.com/
2. Clique em "Sign Up Free"
3. Cadastre-se com seu e-mail

### 2. Configurar Serviço de E-mail
1. No painel do EmailJS, vá em **Email Services**
2. Clique em **Add New Service** (ex: Gmail, SMTP personalizado)
3. Configure com as credenciais SMTP:
   - **Host:** mail.acia.com.br
   - **Port:** 587
   - **User:** confirmacao@acia.com.br
   - **Password:** c9bHtdLgFaB9XwM4zuUK
4. Salve e copie o **Service ID** (ex: `service_xxxxx`)

### 3. Criar Template de E-mail
1. Vá em **Email Templates**
2. Clique em **Create New Template**
3. Use este modelo:

```
Olá {{to_name}},

Sua confirmação de presença foi registrada com sucesso!

{{message_html}}

---
ACIA 65 Anos
```

4. Salve e copie o **Template ID** (ex: `template_xxxxx`)

### 4. Configurar no Código
Abra `assets/js/app.js` e替换:

```javascript
const emailData = {
    service_id: 'SEU_SERVICE_ID_AQUI',
    template_id: 'SEU_TEMPLATE_ID_AQUI', 
    user_id: 'SEU_PUBLIC_KEY_AQUI',
    template_params: { ... }
};
```

Para encontrar seu **Public Key**, vá em **Account** > **API Keys**

## Limites do Plano Gratuito
- **200 e-mails por mês**
- 1 serviço de e-mail
- 2 templates
- Sem cartão necessário

## Alternativa: Resend (Também Gratuito)
Se preferir, pode usar https://resend.com com o plano gratuito (3.000 e-mails/mês).

## Testando
Após configurar, faça um teste:
1. Preencha o formulário de convite
2. Confirme presença
3. Verifique se o e-mail com QR Code chegou
