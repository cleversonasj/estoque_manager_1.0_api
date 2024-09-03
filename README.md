# Estoque Manager 1.0 API

### Projeto de API para ser usado pelo [projeto](https://github.com/cleversonasj/estoque_manager_1.0).

Projeto desenvolvido em Node.js

Foi utilizado o banco de dados MYSQL para fazer uso da API. Favor alterar os dados de conexões com o banco dentro do projeto, criar uma tabela chamada "produtos" através da query:

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    minQuantity INT NOT NULL,
    image VARCHAR(255) NULL
);


