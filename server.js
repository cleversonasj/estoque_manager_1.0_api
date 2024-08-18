const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Armazenamento de arquivos via Multer
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = 'uploads/';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    })
});

// Banco de dados
const db = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: ''
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado ao banco de dados MySQL!');
});

app.use('/uploads', express.static('uploads'));

// Criar Produto
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, value, quantity, minQuantity } = req.body;
    const image = req.file ? req.file.filename : null;

    let errors = [];

    if (!name || name.trim() === '') errors.push('O nome é obrigatório.');
    if (!value || value.trim() === '') errors.push('O valor é obrigatório.');
    if (!quantity || isNaN(quantity)) errors.push('A quantidade atual é obrigatória.');
    if (!minQuantity || isNaN(minQuantity)) errors.push('A quantidade mínima é obrigatória.');

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const query = 'INSERT INTO produtos (name, value, quantity, minQuantity, image) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name.trim(), parseFloat(value.trim()), parseInt(quantity), parseInt(minQuantity), image], (err, results) => {
        if (err) {
            console.error('Erro ao adicionar produto: ', err);
            return res.status(500).send('Erro ao adicionar produto.');
        }
        res.status(201).send('Produto adicionado com sucesso!');
    });
});

// Editar Produto
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const { name, value, quantity, minQuantity } = req.body;
    const image = req.file ? req.file.filename : null;

    let errors = [];

    // Validação dos campos obrigatórios e se não estão preenchidos apenas com espaços
    if (!name || name.trim() === '') errors.push('O nome é obrigatório.');
    if (!value || value.trim() === '') errors.push('O valor é obrigatório.');
    if (!quantity || isNaN(quantity)) errors.push('A quantidade atual é obrigatória.');
    if (!minQuantity || isNaN(minQuantity)) errors.push('A quantidade mínima é obrigatória.');

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Atualizar o produto no banco de dados
    let query = 'UPDATE produtos SET name = ?, value = ?, quantity = ?, minQuantity = ?';
    let queryParams = [name.trim(), parseFloat(value.trim()), parseInt(quantity), parseInt(minQuantity)];

    if (image) {
        query += ', image = ?';
        queryParams.push(image);
    }

    query += ' WHERE id = ?';
    queryParams.push(productId);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao atualizar produto:', err);
            return res.status(500).json({ error: 'Erro ao atualizar produto' });
        }
        res.status(200).json({ message: 'Produto atualizado com sucesso' });
    });
});

// Buscar Produtos
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM produtos ORDER BY name ASC', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao buscar produtos, tente mais tarde!' });
            return;
        }
        res.json(results);
    });
});

// Excluir Produto
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    db.query('DELETE FROM produtos WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error('Erro ao excluir produto: ', err);
            return res.status(500).json({ error: 'Erro ao excluir produto.' });
        }
        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    });
});

// Registrar a entrada de Produtos
app.post('/api/products/:id/entrada', (req, res) => {
    const productId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || isNaN(quantity)) {
        return res.status(400).json({ error: 'Quantidade inválida!' });
    }

    const query = 'UPDATE produtos SET quantity = quantity + ? WHERE id = ?';
    db.query(query, [parseInt(quantity), productId], (err, results) => {
        if (err) {
            console.error('Erro ao registrar entrada: ', err);
            return res.status(500).json({ error: 'Erro ao registrar entrada.' });
        }
        res.status(200).json({ message: 'Entrada registrada com sucesso!' });
    });
});

// Registrar a saida de Produtos
app.post('/api/products/:id/saida', (req, res) => {
    const productId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || isNaN(quantity)) {
        return res.status(400).json({ error: 'Quantidade inválida!' });
    }

    // Verificar se a quantidade é suficiente
    db.query('SELECT quantity FROM produtos WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar produto:', err);
            return res.status(500).json({ error: 'Erro ao buscar produto.' });
        }

        if (results.length === 0 || results[0].quantity < quantity) {
            return res.status(400).json({ error: 'A quantidade informada é maior do que a quantidade em estoque.' });
        }

        const query = 'UPDATE produtos SET quantity = quantity - ? WHERE id = ?';
        db.query(query, [parseInt(quantity), productId], (err, results) => {
            if (err) {
                console.error('Erro ao registrar saída:', err);
                return res.status(500).json({ error: 'Erro ao registrar saída.' });
            }
            res.status(200).json({ message: 'Saída registrada com sucesso!' });
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}!`);
});
