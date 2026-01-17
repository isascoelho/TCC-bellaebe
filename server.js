const express = require("express");
const db = require("./db");

const app = express();

// 👇 OBRIGATÓRIO
app.use(express.json());

const path = require("path");

app.use(express.static(__dirname));

app.get("/ping", (req, res) => {
  res.send("pong");
});

// ROTA DE CADASTRO
app.post("/cadastro", (req, res) => {
  console.log("📥 DADOS RECEBIDOS NO BACKEND:", req.body);

  const {
    nome,
    email,
    cpf,
    data_nascimento,
    fone,
    senha
  } = req.body;

  if (!nome || !email || !cpf || !data_nascimento || !fone || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  const sql = `
    INSERT INTO usuario
    (nome, email, cpf, data_nascimento, fone, senha)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, email, cpf, data_nascimento, fone, senha],
    (err, result) => {
      if (err) {
        console.error("❌ ERRO MYSQL:", err);
        return res.status(500).json({ error: "Erro ao cadastrar usuário" });
      }

      res.json({ success: true, id: result.insertId });
    }
  );
});



// ROTA DE TESTE (USER)
app.get("/user", (req, res) => {
  const sql = `
    SELECT ID, nome, email, foto
    FROM usuario
    LIMIT 1
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      return res.json(null);
    }

    res.json(result[0]);
  });
});


app.get("/me", (req, res) => {
  const sql = `
    SELECT nome, email, foto
    FROM usuario
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (result.length === 0) {
      return res.json(null);
    }

    res.json(result[0]);
  });
});

//ROTA DE LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  const sql = `
    SELECT id, nome, email, foto
    FROM usuario
    WHERE email = ? AND senha = ?
  `;

  db.query(sql, [email, senha], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Erro no login" });
    }

    if (result.length === 0) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    res.json(result[0]);
  });
});

app.get("/me/:id", (req, res) => {
  const sql = `
    SELECT nome, email, foto
    FROM usuario
    WHERE id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json(null);
    }

    res.json(result[0]);
  });
});

// SERVIDOR
app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
