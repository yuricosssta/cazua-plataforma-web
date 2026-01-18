export const markdownExample = () => {
  const example = `# Exemplo de Markdown

Este é um exemplo de como você pode usar **Markdown** para formatar seu conteúdo.

## Cabeçalhos

Use \`#\` para criar cabeçalhos. Quanto mais \`#\`, menor o cabeçalho.

### Cabeçalho de Nível 3
#### Cabeçalho de Nível 4

## Ênfase

Você pode adicionar *itálico* ou **negrito** ao seu texto.

- *Itálico* com um asterisco ou _sublinhado_ com um sublinhado.
- **Negrito** com dois asteriscos ou __sublinhado__ com dois sublinhados.
- ***Negrito e itálico*** com três asteriscos.

## Listas

### Lista Não Ordenada
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Lista Ordenada
1. Primeiro item
2. Segundo item
3. Terceiro item

## Links e Imagens

Você pode adicionar [links](https://www.example.com) e imagens:

![Exemplo de Imagem](https://via.placeholder.com/150)

## Blocos de Código

Para adicionar blocos de código, use três crases (\`\`\`):

\`\`\`javascript
function exemplo() {
  console.log("Olá, mundo!");
}
\`\`\`

## Citações

> Este é um bloco de citação.
>
> Você pode adicionar várias linhas aqui.

## Tabelas

| Cabeçalho 1 | Cabeçalho 2 |
|-------------|-------------|
| Linha 1, Coluna 1 | Linha 1, Coluna 2 |
| Linha 2, Coluna 1 | Linha 2, Coluna 2 |

---

Sinta-se à vontade para experimentar e criar seu próprio conteúdo usando Markdown!
`;
  return example;
};