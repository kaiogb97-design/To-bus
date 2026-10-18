# Tô Bus App — Android APK via GitHub Actions

Este repositório já está preparado para transformar a interface HTML/CSS/JS do Tô Bus em um APK Android usando GitHub Actions.

## Como gerar o APK no GitHub

1. Crie um repositório novo no GitHub.
2. Envie **todo o conteúdo desta pasta para a raiz do repositório** (não envie apenas a pasta `to-bus`).
3. Abra a aba **Actions** no repositório.
4. Selecione **Build Android APK**.
5. Toque em **Run workflow** e confirme.
6. Aguarde a compilação terminar.
7. Abra a execução concluída e, em **Artifacts**, baixe `to-bus-apk`.
8. Extraia o ZIP do artifact: dentro dele estará `app-debug.apk`.

O APK gerado é uma versão de teste (debug), adequada para instalar manualmente no Android e apresentar o projeto.

## Estrutura

- `index.html`, `css/`, `js/`, `assets/`: projeto web original.
- `app/src/main/assets/www/`: cópia usada dentro do aplicativo Android.
- `app/`: projeto Android nativo que abre a interface em WebView.
- `.github/workflows/build-apk.yml`: automação que compila o APK no GitHub.

## Atualizando a interface

Ao alterar o projeto web original, copie as versões atualizadas de `index.html`, `css/`, `js/` e `assets/` para `app/src/main/assets/www/` antes de gerar um novo APK.
