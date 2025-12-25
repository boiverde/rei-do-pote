# Visão do Projeto: Rei do Pote (BolaOBr)

> **Essência**: Um **Fantasy Game** com mecânicas de **Mercado de Predição**, operando com a transparência de uma exchange (estilo Kalshi) e a emoção de disputas diretas (X1).

Este documento serve como a "Constituição" do projeto. Todas as futuras implementações, refatorações e designs devem respeitar os pilares abaixo.

---

## 1. Identidade Central

### "Não é Casa de Apostas, é um Game"
Embora envolva previsões e dinheiro, a experiência do usuário deve ser a de um **jogador**.
-   **Vocabulário**: Use termos como "Jogar", "Disputar", "Ranking", "Conquistas", "Desafio". Evite "Apostar" ou "Azar".
-   **Visual**: A interface deve remeter a jogos modernos (e-sports, apps premium) e não a planilhas de odds tradicionais.

### O Modelo Híbrido (Kalshi + X1)
-   **O Motor (Kalshi)**: O sistema funciona como um Order Book (Livro de Ofertas). O preço é definido pela oferta e demanda dos usuários, não pela "casa". Transparência total.
-   **O Social (X1)**: A funcionalidade de desafio direto (X1) é fundamental. Permite que amigos joguem contra amigos, criando viralidade e competição pessoal.

## 2. Pilares de Design (Aesthetic)

### "Premium & Imersivo"
O design não pode ser genérico. Ele deve causar impacto ("WOW effect").
-   **Estilo**: Dark Mode, Cores Vibrantes (Neon Green/Gold), Glassmorphism (vidro fosco), Animações fluídas.
-   **Sensação**: O app deve parecer "vivo". Micro-interações ao clicar, carregar ou transitar entre telas são obrigatórias.

## 3. Inspirações

-   **Kalshi**: Pela estrutura de mercado e seriedade dos dados.
-   **Fantasy Games (ex: Cartola)**: Pelo engajamento, ligas e sentimento de comunidade.
-   **Fintechs Modernas (ex: Nubank, Inter)**: Pela facilidade de uso, clareza e confiança na UI.

---

## 4. Regras de Ouro (Não Quebrar)

1.  **Nunca parecer amador**: Se um componente parece "básico demais", ele precisa ser melhorado.
2.  **O Usuário tem Controle**: Seja no Order Book ou no X1, o usuário deve sentir que suas decisões importam.
3.  **Transparência**: Regras claras, taxas claras, liquidez visível.
