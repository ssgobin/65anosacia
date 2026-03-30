# Configuração do Template EmailJS

## Problema
O HTML está aparecendo como texto puro no email.

## Solução usando Code Editor

### Passo 1: Acesse o template no EmailJS
1. Vá em **Email Templates**
2. Clique no seu template `template_jn73jw2`
3. Clique em **Code Editor** (ícone de `< >`)

### Passo 2: Configure o código
No Code Editor, substitua tudo por:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 10px 0;">🎉 Confirmação de Presença</h1>
            <p style="color: #666666; font-size: 16px; margin: 0;">Olá {{to_name}},</p>
            <p style="color: #666666; font-size: 16px; margin: 10px 0 0 0;">Sua confirmação foi registrada com sucesso!</p>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #f8f8f8; border-radius: 8px;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
                Em caso de dúvidas, entre em contato com a organização do evento.
            </p>
        </div>
    </div>
</body>
</html>
```

### Passo 3: Adicione o QR Code
Para incluir o QR Code dinamicamente, você tem duas opções:

#### Opção A: Usar Attachment (recomendado)
No EmailJS, configure um attachment dynamics:
1. Clique em **Attachment** no menu do template
2. Adicione: `{{qr_code}}`
3. No seu JavaScript, passe o QR Code como base64 ou URL

#### Opção B: Usar Image Embed
1. No Code Editor, adicione onde quer que o QR Code apareça:
```html
<img src="{{qr_image}}" alt="QR Code" style="max-width: 250px; height: auto; margin: 20px 0;">
```

2. No JavaScript, mude o envio para incluir a imagem:
```javascript
template_params: {
    to_email: email,
    to_name: guestName,
    qr_image: qrCodeDataUrl  // URL base64 da imagem
}
```

### Passo 4: Salve e Teste
1. Clique em **Save**
2. Faça um teste pelo seu site

---

## Resumo das Alterações Needed

### No JavaScript (app.js):
Se quiser usar Opção B (imagem inline), mude de `message_html` para `qr_image`:

```javascript
template_params: {
    to_email: email,
    to_name: guestName,
    qr_image: qrCodeDataUrl
}
```

### No EmailJS:
- Use Code Editor
- Copie o HTML do template acima
- Configure o campo To como `{{to_email}}`
- Salve
