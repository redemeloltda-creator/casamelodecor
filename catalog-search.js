document.addEventListener("DOMContentLoaded", function () {

    const input = document.getElementById("busca-produto");
    const resultadosContainer = document.getElementById("resultados-catalogo");
    const semResultados = document.getElementById("sem-resultados");

    // Lista de produtos do catálogo
    const produtos = [
        {
            nome: "Cesta Presenteável",
            descricao: "Ideal para datas especiais",
            imagem: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48",
            link: "https://wa.me/5538999140400?text=Tenho interesse na Cesta Presenteável",
            tags: ["cesta", "presente", "datas especiais"]
        },
        {
            nome: "Kit Café",
            descricao: "Elegante e funcional",
            imagem: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb",
            link: "https://wa.me/5538999140400?text=Tenho interesse no Kit Café",
            tags: ["café", "kit", "cozinha"]
        },
        {
            nome: "Kit Aromático",
            descricao: "Perfume e conforto para o ambiente",
            imagem: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
            link: "https://wa.me/5538999140400?text=Tenho interesse no Kit Aromático",
            tags: ["aroma", "perfume", "ambiente", "cheiro"]
        },
        {
            nome: "Caneca Presente",
            descricao: "Perfeita para surpreender",
            imagem: "https://images.unsplash.com/photo-1512909006721-3d6018887383",
            link: "https://wa.me/5538999140400?text=Tenho interesse na Caneca Presente",
            tags: ["caneca", "xícara", "presente"]
        }
    ];

    input.addEventListener("input", function () {

        const termo = input.value.toLowerCase().trim();
        resultadosContainer.innerHTML = "";

        if (termo === "") {
            semResultados.hidden = true;
            return;
        }

        const filtrados = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(termo) ||
            produto.descricao.toLowerCase().includes(termo) ||
            produto.tags.some(tag => tag.includes(termo))
        );

        if (filtrados.length === 0) {
            semResultados.hidden = false;
            return;
        }

        semResultados.hidden = true;

        filtrados.forEach(produto => {
            const item = document.createElement("div");
            item.classList.add("resultado-item");

            item.innerHTML = `
                <img src="${produto.imagem}" class="resultado-thumb" alt="${produto.nome}">
                <div class="resultado-detalhes">
                    <h4>${produto.nome}</h4>
                    <p>${produto.descricao}</p>
                    <a href="${produto.link}" target="_blank" class="resultado-cta">
                        Consultar
                    </a>
                </div>
            `;

            resultadosContainer.appendChild(item);
        });

    });

});
