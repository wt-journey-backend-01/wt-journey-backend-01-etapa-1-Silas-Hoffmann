const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas GET
app.get('/api/lanches', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'data', 'lanches.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return res.status(500).json({ erro: 'Erro ao acessar os lanches' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.status(200).json(jsonData.lanches);
        } catch (e) {
            console.error('Erro ao interpretar o JSON:', e);
            res.status(500).json({ erro: 'Erro ao processar os dados' });
        }
    });
});

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/sugestao', (req, res) => {
    const nome = req.query.nome;
    const ingredientes = req.query.ingredientes;

    if (!nome || !ingredientes) {
        return res.status(400).send('Parametros nome e ingredientes sao obrigatorios');
    }

    const listaIngredientes = ingredientes.split(',').map(i => i.trim());
    const filePath = path.join(__dirname, 'public', 'data', 'lanches.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return res.status(500).send('Erro no servidor ao acessar os dados.');
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            console.error('Erro ao fazer parse do JSON:', e);
            return res.status(500).send('Erro ao processar os dados existentes.');
        }

        const novaSugestao = {
            nome: nome,
            ingredientes: listaIngredientes
        };

        jsonData.sugestoes.push(novaSugestao);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), 'utf8', (err) => {
            if (err) {
                console.error('Erro ao salvar a sugestão:', err);
                return res.status(500).send('Erro ao salvar a sugestão.');
            }

            const html = `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="/css/style.css">
                <title>Obrigado pela sugestão</title>
            </head>
            <body>
            <div id="sugest">
                <h1>Obrigado pela sua sugestão!</h1>
                <div class="left">
                    <p><strong>Nome do lanche:</strong> ${nome}</p>
                    <p><strong>Ingredientes:</strong></p>
                    <ul>
                        ${listaIngredientes.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
                <button class="btn" onclick="window.location.href='/'">Voltar para o cardápio</button>
            </div>
            </body>
            </html>
            `;

            res.status(200).send(html);
        });
    });
});

// Funcao necessaria para processar as query strings de contato
function processarContato(dados, res) {
    const { nome, email, assunto, mensagem } = dados;

    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).send('Todos os campos sao obrigatorios.');
    }

    const novoContato = { nome, email, assunto, mensagem };
    const filePath = path.join(__dirname, 'public', 'data', 'lanches.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erro ao acessar os dados.');
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch {
            jsonData = {};
        }
        if (!Array.isArray(jsonData['cliente-contatos'])) {
            jsonData['cliente-contatos'] = [];
        }

        jsonData['cliente-contatos'].push(novoContato);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), 'utf8', err => {
            if (err) return res.status(500).send('Erro ao salvar os dados.');

            res.send(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <title>Contato enviado</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <h1>Obrigado pelo seu contato, ${nome}!</h1>
                    <p>Suas informações foram recebidas com sucesso.</p>
                    <button class="btn" onclick="window.location.href='/'">Voltar</button>
                </body>
                </html>
            `);
        });
    });
}

app.get('/contato', (req, res) => {
    const { nome, email, assunto, mensagem } = req.query;

    if (nome && email && assunto && mensagem) {
        return processarContato({ nome, email, assunto, mensagem }, res);
    }

    res.status(200).sendFile(path.join(__dirname, 'views', 'contato.html'));
});

// Rotas POST
app.post('/contato', (req, res) => {
    processarContato(req.body, res);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor da DevBurger rodando em http://localhost:${port}`);
});
