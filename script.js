document.addEventListener('DOMContentLoaded', () => {
    const itemNomeInput = document.getElementById('item-nome');
    const itemValorInput = document.getElementById('item-valor');
    const itemQuantidadeInput = document.getElementById('item-quantidade');
    const adicionarItemBtn = document.getElementById('adicionar-item-btn');
    const itensContainer = document.getElementById('itens-container');
    const totalGeralSpan = document.getElementById('total-geral');
    const exportarPdfBtn = document.getElementById('exportar-pdf-btn');
    const compartilharBtn = document.getElementById('compartilhar-btn');
    const salvarListaBtn = document.getElementById('salvar-lista-btn');
    const importarListaBtn = document.getElementById('importar-lista-btn');
    const importarListaInput = document.getElementById('importar-lista-input');
    const limparListaBtn = document.getElementById('limpar-lista-btn'); // Novo botão

    let listaDeCompras = JSON.parse(localStorage.getItem('listaDeCompras')) || [];

    // --- Funções Auxiliares de UX/UI ---
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Função para criar e exibir um modal genérico
    const showModal = (title, contentHTML, actionsHTML = '') => {
        let modal = document.getElementById('app-modal');
        // Se o modal já existe e está visível, force o fechamento antes de criar um novo
        if (modal && modal.classList.contains('show')) {
            modal.classList.remove('show');
            modal.remove(); // Remove imediatamente o modal anterior para evitar conflitos de ID/eventos
        }

        modal = document.createElement('div');
        modal.id = 'app-modal'; // Mantém o ID único
        modal.classList.add('modal');
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h3>${title}</h3>
                ${contentHTML}
                <div class="modal-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
        modal.style.display = 'flex'; // Garante que o display é flex para centralização
        setTimeout(() => modal.classList.add('show'), 10); // Adiciona classe para animação

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300); // Esconde e remove após a animação
        };

        // Adiciona um listener genérico para botões com as classes de ação para fechar o modal
        const actionButtons = modal.querySelectorAll('.confirm-btn, .cancel-btn, .danger-btn, .confirm-delete-btn, .confirm-clear-btn, .confirm-edit-btn');
        actionButtons.forEach(button => {
            // Remove qualquer listener anterior para evitar duplicação ou conflitos
            button.onclick = null; 
            button.onclick = (event) => {
                event.stopPropagation(); // Previne que o clique se propague para o background do modal
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300); // Esconde e remove após a animação
            };
        });

        // Se NÃO houver botões de ação explícitos, permite fechar clicando fora do modal
        // Isso evita que modais de aviso simples fiquem presos sem um botão "OK"
        const modalActionsDiv = modal.querySelector('.modal-actions');
        if (!modalActionsDiv || modalActionsDiv.children.length === 0) {
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                }
            };
        } else {
            // Se houver botões de ação, o clique fora NÃO deve fechar o modal
            modal.onclick = null;
        }

        return modal; // Retorna o modal para que se possa adicionar listeners específicos se necessário
    };

    // --- Renderização da Lista ---
    const renderizarLista = () => {
        itensContainer.innerHTML = '';
        let totalGeral = 0;

        if (listaDeCompras.length === 0) {
            itensContainer.innerHTML = '<p style="text-align: center; color: var(--light-text-color); margin-top: 20px; padding: 20px; background-color: #e9ecef; border-radius: 8px;">Sua lista está vazia! Que tal adicionar o primeiro item e começar a organizar suas compras?</p>';
        }

        listaDeCompras.forEach((item, index) => {
            const precoTotal = item.valor * item.quantidade;
            totalGeral += precoTotal;

            const itemCard = document.createElement('div');
            itemCard.classList.add('item-card');
            itemCard.setAttribute('data-index', index);

            itemCard.innerHTML = `
                <div class="item-info">
                    <strong>${item.nome}</strong>
                    <p>Valor Unitário: ${formatCurrency(item.valor)}</p>
                    <p>Quantidade: ${item.quantidade}</p>
                    <p>Preço Total: ${formatCurrency(precoTotal)}</p>
                </div>
                <div class="item-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            `;
            itensContainer.appendChild(itemCard);
        });

        totalGeralSpan.textContent = formatCurrency(totalGeral);
        localStorage.setItem('listaDeCompras', JSON.stringify(listaDeCompras));
    };

    // --- Adicionar Item ---
    adicionarItemBtn.addEventListener('click', () => {
        const nome = itemNomeInput.value.trim();
        const valor = parseFloat(itemValorInput.value);
        const quantidade = parseInt(itemQuantidadeInput.value);

        if (nome && !isNaN(valor) && valor >= 0 && !isNaN(quantidade) && quantidade >= 1) {
            listaDeCompras.push({ nome, valor, quantidade });
            renderizarLista();
            itemNomeInput.value = '';
            itemValorInput.value = '';
            itemQuantidadeInput.value = '';
            itemNomeInput.focus();
        } else {
            // Este modal não possui um botão de "OK" que precisa ser clicado para fechar, então a lógica padrão do showModal é suficiente
            showModal(
                'Ops! Algo deu errado!',
                '<p>Por favor, preencha todos os campos corretamente.</p><p>O nome do item não pode ser vazio, e o valor unitário e a quantidade devem ser números válidos maiores que zero.</p>',
                '<button class="confirm-btn">Entendi</button>'
            );
        }
    });

    // --- Editar e Excluir Itens (com Modais) ---
    itensContainer.addEventListener('click', (event) => {
        const target = event.target;
        const itemCard = target.closest('.item-card');

        if (!itemCard) return;

        const index = parseInt(itemCard.getAttribute('data-index'));

        if (target.classList.contains('delete-btn') || target.parentElement.classList.contains('delete-btn')) {
            // Modal de Confirmação de Exclusão
            const confirmModal = showModal(
                'Confirmar Exclusão',
                `<p>Você tem certeza que deseja remover **"${listaDeCompras[index].nome}"** da sua lista?</p><p style="color: var(--danger-color); font-weight: bold;">Essa ação não poderá ser desfeita.</p>`,
                `<button class="danger-btn confirm-delete-btn"><i class="fas fa-trash-alt"></i> Sim, Excluir</button>
                 <button class="cancel-btn"><i class="fas fa-times"></i> Cancelar</button>`
            );
            
            confirmModal.querySelector('.confirm-delete-btn').onclick = () => {
                listaDeCompras.splice(index, 1);
                renderizarLista();
                confirmModal.classList.remove('show');
                setTimeout(() => confirmModal.remove(), 300);
            };
            confirmModal.querySelector('.cancel-btn').onclick = () => {
                confirmModal.classList.remove('show');
                setTimeout(() => confirmModal.remove(), 300);
            };

        } else if (target.classList.contains('edit-btn') || target.parentElement.classList.contains('edit-btn')) {
            const item = listaDeCompras[index];

            // Modal de Edição de Item
            const editModal = showModal(
                'Editar Item',
                `
                <div style="text-align: left;">
                    <label for="edit-nome">Nome do Item:</label>
                    <input type="text" id="edit-nome" value="${item.nome}" required>
                    <label for="edit-valor">Valor Unitário (R$):</label>
                    <input type="number" id="edit-valor" value="${item.valor}" min="0" step="0.01" required>
                    <label for="edit-quantidade">Quantidade:</label>
                    <input type="number" id="edit-quantidade" value="${item.quantidade}" min="1" required>
                </div>
                `,
                `
                <button class="confirm-edit-btn"><i class="fas fa-save"></i> Salvar Alterações</button>
                <button class="cancel-btn"><i class="fas fa-times"></i> Cancelar</button>
                `
            );

            const editNome = editModal.querySelector('#edit-nome');
            const editValor = editModal.querySelector('#edit-valor');
            const editQuantidade = editModal.querySelector('#edit-quantidade');

            editModal.querySelector('.confirm-edit-btn').onclick = () => {
                const novoNome = editNome.value.trim();
                const novoValor = parseFloat(editValor.value);
                const novaQuantidade = parseInt(editQuantidade.value);

                if (novoNome && !isNaN(novoValor) && novoValor >= 0 && !isNaN(novaQuantidade) && novaQuantidade >= 1) {
                    item.nome = novoNome;
                    item.valor = novoValor;
                    item.quantidade = novaQuantidade;
                    renderizarLista();
                    editModal.classList.remove('show');
                    setTimeout(() => editModal.remove(), 300);
                } else {
                    // Aviso dentro do modal de edição, não precisa de novo modal completo
                    alert('Dados inválidos. Por favor, preencha todos os campos corretamente.');
                }
            };
            editModal.querySelector('.cancel-btn').onclick = () => {
                editModal.classList.remove('show');
                setTimeout(() => editModal.remove(), 300);
            };
        }
    });

    // --- Função para Limpar Toda a Lista ---
    limparListaBtn.addEventListener('click', () => {
        if (listaDeCompras.length === 0) {
            showModal(
                'Lista Vazia',
                '<p>Sua lista de compras já está vazia. Não há itens para limpar!</p>',
                '<button class="confirm-btn">Ok</button>'
            );
            return;
        }

        const confirmClearModal = showModal(
            'Limpar Toda a Lista?',
            `<p>Você está prestes a **excluir TODOS** os itens da sua lista de compras.</p><p style="color: var(--danger-color); font-weight: bold;">Essa ação é irreversível!</p><p>Deseja continuar?</p>`,
            `<button class="danger-btn confirm-clear-btn"><i class="fas fa-trash-alt"></i> Sim, Limpar Tudo</button>
             <button class="cancel-btn"><i class="fas fa-times"></i> Cancelar</button>`
        );
        
        confirmClearModal.querySelector('.confirm-clear-btn').onclick = () => {
            listaDeCompras = [];
            renderizarLista();
            confirmClearModal.classList.remove('show');
            setTimeout(() => { // Espera o modal de confirmação fechar
                confirmClearModal.remove();
                showModal( // Então mostra o modal de sucesso
                    'Lista Limpa!',
                    '<p>Sua lista de compras foi esvaziada com sucesso. Comece uma nova agora!</p>',
                    '<button class="confirm-btn">Perfeito!</button>'
                );
            }, 300);
        };
        confirmClearModal.querySelector('.cancel-btn').onclick = () => {
            confirmClearModal.classList.remove('show');
            setTimeout(() => confirmClearModal.remove(), 300);
        };
    });

    // --- Exportar para PDF (Estilo Cupom Fiscal Aprimorado) ---
    exportarPdfBtn.addEventListener('click', async () => {
        if (listaDeCompras.length === 0) {
            showModal(
                'Lista Vazia',
                '<p>Não há itens na sua lista para gerar um PDF. Adicione alguns itens primeiro!</p>',
                '<button class="confirm-btn">Ok</button>'
            );
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let y = margin;
        const lineHeight = 7;
        const fontSize = 10;
        const smallFontSize = 8;
        const couponWidth = 80; // Largura do cupom fiscal em mm

        const startX = (pageWidth - couponWidth) / 2;

        doc.setFont('Courier');

        // Cabeçalho
        doc.setFontSize(14);
        doc.text("Minha Lista de Compras", pageWidth / 2, y, { align: 'center' });
        y += lineHeight * 1.5;

        doc.setFontSize(smallFontSize);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
        y += lineHeight * 1.5;

        doc.setLineWidth(0.5);
        doc.line(startX, y, startX + couponWidth, y);
        y += lineHeight;

        // Títulos das colunas
        doc.setFontSize(fontSize);
        doc.text("Item", startX + 5, y);
        doc.text("Qtd", startX + couponWidth * 0.5, y, { align: 'right' });
        doc.text("Valor Un.", startX + couponWidth * 0.75, y, { align: 'right' });
        doc.text("Total", startX + couponWidth - 5, y, { align: 'right' });
        y += lineHeight;

        doc.line(startX, y, startX + couponWidth, y);
        y += lineHeight;

        // Itens da lista
        let totalGeralPdf = 0;
        listaDeCompras.forEach(item => {
            const precoTotal = item.valor * item.quantidade;
            totalGeralPdf += precoTotal;

            doc.setFontSize(fontSize);
            doc.text(item.nome, startX + 5, y);
            doc.text(item.quantidade.toString(), startX + couponWidth * 0.5, y, { align: 'right' });
            doc.text(item.valor.toFixed(2), startX + couponWidth * 0.75, y, { align: 'right' });
            doc.text(precoTotal.toFixed(2), startX + couponWidth - 5, y, { align: 'right' });
            y += lineHeight;
        });

        y += lineHeight;
        doc.line(startX, y, startX + couponWidth, y);
        y += lineHeight;

        // Total Geral
        doc.setFontSize(12);
        doc.text("TOTAL GERAL:", startX + couponWidth * 0.6, y, { align: 'right' });
        doc.text(formatCurrency(totalGeralPdf), startX + couponWidth - 5, y, { align: 'right' });
        y += lineHeight * 2;

        // Rodapé aprimorado
        doc.setFontSize(smallFontSize);
        doc.text("Feito com amor pela Minha Lista de Compras", pageWidth / 2, y, { align: 'center' });

        doc.save('minha_lista_de_compras.pdf');
    });

    // --- Compartilhar nas Redes Sociais (Modal) ---
    compartilharBtn.addEventListener('click', () => {
        showModal(
            'Compartilhe sua Lista de Compras!',
            `
            <p>Facilite a vida de seus amigos e familiares. Com a "Minha Lista de Compras", organizar o supermercado nunca foi tão fácil!</p>
            <div class="social-share-buttons">
                <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('Crie suas listas de compras de forma inteligente e economize tempo no supermercado! Experimente "Minha Lista de Compras": https://minhalistadecompras-omega.vercel.app/')}" target="_blank" class="whatsapp-btn" aria-label="Compartilhar no WhatsApp"><i class="fab fa-whatsapp"></i></a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://minhalistadecompras-omega.vercel.app/')}&quote=${encodeURIComponent('Crie suas listas de compras de forma inteligente e economize tempo no supermercado! Experimente "Minha Lista de Compras".')}" target="_blank" class="facebook-btn" aria-label="Compartilhar no Facebook"><i class="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Crie suas listas de compras de forma inteligente e economize tempo no supermercado! #MinhaListaDeCompras #SupermercadoInteligente')}&url=${encodeURIComponent('https://minhalistadecompras-omega.vercel.app/')}" target="_blank" class="twitter-btn" aria-label="Compartilhar no Twitter"><i class="fab fa-twitter"></i></a>
                <a href="mailto:?subject=${encodeURIComponent('Minha Lista de Compras Inteligente')}&body=${encodeURIComponent('Olá! Encontrei este aplicativo incrível para organizar listas de supermercado. É muito fácil de usar e ajuda a economizar tempo. Experimente: https://minhalistadecompras-omega.vercel.app/')}" class="email-btn" aria-label="Compartilhar por Email"><i class="fas fa-envelope"></i></a>
            </div>
            `
        );
    });

    // --- Salvar Lista (Exportar como JSON) com Tutorial Modal ---
    salvarListaBtn.addEventListener('click', () => {
        if (listaDeCompras.length === 0) {
            showModal(
                'Lista Vazia',
                '<p>Sua lista está vazia. Não há itens para salvar em um arquivo.</p>',
                '<button class="confirm-btn">Entendi</button>'
            );
            return;
        }

        const tutorialModal = showModal(
            'Salvar sua Lista: Como funciona?',
            `
            <p>Ao salvar sua lista, você cria um arquivo no seu dispositivo. Este arquivo é perfeito para:</p>
            <div class="tutorial-step">
                <h4>1. Acessar depois:</h4>
                <p>Abra sua lista em qualquer computador ou celular, mantendo seus dados sempre com você.</p>
            </div>
            <div class="tutorial-step">
                <h4>2. Compartilhar com outros:</h4>
                <p>Envie o arquivo para amigos ou familiares. Eles podem importar e até editar a lista facilmente.</p>
            </div>
            <p>É como ter uma cópia de segurança da sua lista, pronta para ser usada a qualquer momento!</p>
            `,
            `<button id="entendi-salvar-btn" class="confirm-btn"><i class="fas fa-check-circle"></i> Entendi, Salvar Lista Agora</button>`
        );

        tutorialModal.querySelector('#entendi-salvar-btn').onclick = () => {
            const dataStr = JSON.stringify(listaDeCompras, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'minha_lista_de_compras.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            tutorialModal.classList.remove('show');
            setTimeout(() => { // Espera o modal de tutorial fechar
                tutorialModal.remove();
                showModal( // Então mostra o modal de sucesso
                    'Lista Salva!',
                    `<p>Sua lista foi salva com sucesso como **"minha_lista_de_compras.json"**!</p>
                     <p>Você pode encontrá-la na sua pasta de downloads.</p>`,
                    '<button class="confirm-btn">Obrigado!</button>'
                );
            }, 300);
        };
    });

    // --- Importar Lista (Importar JSON) ---
    importarListaBtn.addEventListener('click', () => {
        importarListaInput.click();
    });

    importarListaInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedList = JSON.parse(e.target.result);
                    if (Array.isArray(importedList) && importedList.every(item => item.nome && typeof item.valor === 'number' && typeof item.quantidade === 'number')) {
                        const importOptionsModal = showModal(
                            'Importar Lista',
                            `<p>Sua lista importada contém **${importedList.length}** item(ns).</p>
                             <p>Deseja substituir sua lista atual ou adicionar estes itens à sua lista?</p>`,
                            `
                            <button id="replace-list-btn" class="danger-btn"><i class="fas fa-sync-alt"></i> Substituir Lista Atual</button>
                            <button id="add-to-list-btn" class="confirm-btn"><i class="fas fa-plus-circle"></i> Adicionar à Lista Existente</button>
                            <button class="cancel-btn"><i class="fas fa-times"></i> Cancelar</button>
                            `
                        );
                        
                        importOptionsModal.querySelector('#replace-list-btn').onclick = () => {
                            listaDeCompras = importedList;
                            renderizarLista();
                            importOptionsModal.classList.remove('show');
                            setTimeout(() => { // Espera o modal de opções fechar
                                importOptionsModal.remove();
                                showModal('Sucesso!', '<p>Lista substituída com sucesso!</p>', '<button class="confirm-btn">Ok</button>');
                            }, 300);
                        };
                        importOptionsModal.querySelector('#add-to-list-btn').onclick = () => {
                            listaDeCompras = [...listaDeCompras, ...importedList];
                            renderizarLista();
                            importOptionsModal.classList.remove('show');
                            setTimeout(() => { // Espera o modal de opções fechar
                                importOptionsModal.remove();
                                showModal('Sucesso!', '<p>Itens adicionados à sua lista!</p>', '<button class="confirm-btn">Ok</button>');
                            }, 300);
                        };
                        importOptionsModal.querySelector('.cancel-btn').onclick = () => {
                            importOptionsModal.classList.remove('show');
                            setTimeout(() => importOptionsModal.remove(), 300);
                        };
                    } else {
                        showModal(
                            'Erro ao Importar',
                            '<p>O arquivo JSON selecionado é inválido ou está em um formato incorreto.</p><p>Por favor, selecione um arquivo de lista de compras válido exportado pelo aplicativo.</p>',
                            '<button class="confirm-btn">Entendi</button>'
                        );
                    }
                } catch (error) {
                    showModal(
                        'Erro ao Ler Arquivo',
                        `<p>Ocorreu um erro ao tentar ler o arquivo: **${error.message}**</p><p>Certifique-se de que é um arquivo JSON válido.</p>`,
                        '<button class="confirm-btn">Ok</button>'
                    );
                    console.error('Erro ao parsear JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    });

    // Inicializa a lista ao carregar a página
    renderizarLista();
});