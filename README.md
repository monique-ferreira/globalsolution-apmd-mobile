# Controle de Missão Espacial — Mobile

Aplicativo React Native com Expo para controle de missão espacial.

## Integrantes
- Monique Ferreira dos Anjos — RM 558262
- Rafael Augusto Oliveira Silva — RM 555154
- Tiago Brito Nário — RM 558248

## Tecnologias
- React Native 0.81.5
- Expo ~54.0.33
- TypeScript 5.9
- Axios (requisições HTTP)

## Como executar

```bash
npm install
npm start
```

> O backend deve estar rodando em `http://localhost:8080`.
> Para Android Emulator, altere o BASE_URL em `src/services/api.ts` para `http://10.0.2.2:8080`.
> Para dispositivo físico, use o IP da sua máquina (ex: `http://192.168.1.100:8080`).

## Funcionalidades

- **Aba Sensores**: lista sensores + gauge animado de leitura + cadastro via POST
- **Aba Eventos**: timeline de eventos operacionais + cadastro via POST
- **Aba Alertas**: alertas críticos com barra de nível + cadastro via POST

Todos os dados são carregados via GET e salvos via POST na API backend.
