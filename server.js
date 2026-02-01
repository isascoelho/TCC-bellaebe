const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();

/* =========================
   CONFIG
========================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   TESTE
========================= */
app.get("/ping", (req, res) => {
  res.send("pong");
});

/* =========================
   CADASTRO
========================= */
app.post("/cadastro", (req, res) => {
  let { nome, email, cpf, data_nascimento, fone, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  email = email.trim().toLowerCase();
  senha = senha.trim();

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
        console.error("Erro no cadastro:", err);
        return res.status(500).json({ error: "Erro ao cadastrar usuário" });
      }

      res.json({ success: true, id: result.insertId });
    }
  );
});

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  let { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha obrigatórios" });
  }

  // 🔥 NORMALIZAÇÃO DEFINITIVA
  email = email.trim().toLowerCase();
  senha = senha.trim();

  const sql = `
    SELECT ID, nome, email, foto
    FROM usuario
    WHERE LOWER(TRIM(email)) = ?
      AND TRIM(senha) = ?
    LIMIT 1
  `;

  db.query(sql, [email, senha], (err, result) => {
    if (err) {
      console.error("Erro no login:", err);
      return res.status(500).json({ error: "Erro no login" });
    }

    if (result.length === 0) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    res.json(result[0]);
  });
});


/* =========================
   USUÁRIO LOGADO
========================= */
app.get("/me/:id", (req, res) => {
  const sql = `
    SELECT nome, email, foto
    FROM usuario
    WHERE ID = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err || result.length === 0) {
      return res.json(null);
    }

    res.json(result[0]);
  });
});

/* =========================
   RECEITAS
========================= */

// LISTAR
app.get("/receitas", (req, res) => {
  db.query(
    "SELECT * FROM receita ORDER BY periodo DESC",
    (err, result) => {
      if (err) return res.status(500).json([]);
      res.json(result);
    }
  );
});

// BUSCAR POR ID
app.get("/receitas/:id", (req, res) => {
  db.query(
    "SELECT * FROM receita WHERE ID = ?",
    [req.params.id],
    (err, result) => {
      if (err || result.length === 0) return res.json(null);
      res.json(result[0]);
    }
  );
});

// CADASTRAR
app.post("/receitas", (req, res) => {
  const { valor, periodo, categoria, banco, periodicidade, descricao } = req.body;

  if (!valor || !periodo || !categoria || !banco) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.query(
    `INSERT INTO receita
     (valor, periodo, categoria, banco, periodicidade, descricao)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [valor, periodo, categoria, banco, periodicidade, descricao],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// ATUALIZAR
app.put("/receitas/:id", (req, res) => {
  const { valor, periodo, categoria, banco, periodicidade, descricao } = req.body;

  db.query(
    `UPDATE receita SET
     valor = ?, periodo = ?, categoria = ?, banco = ?, periodicidade = ?, descricao = ?
     WHERE ID = ?`,
    [valor, periodo, categoria, banco, periodicidade, descricao, req.params.id],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

// EXCLUIR
app.delete("/receitas/:id", (req, res) => {
  db.query(
    "DELETE FROM receita WHERE ID = ?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

/* =========================
   RESUMOS DE RECEITAS
========================= */

// TOTAL GERAL
app.get("/receitas/total", (req, res) => {
  db.query(
    "SELECT IFNULL(SUM(valor),0) AS total FROM receita",
    (err, result) => {
      if (err) return res.json({ total: 0 });
      res.json({ total: result[0].total });
    }
  );
});

// TOTAL DO MÊS
app.get("/receitas/total-mes", (req, res) => {
  db.query(
    `SELECT IFNULL(SUM(valor),0) AS total
     FROM receita
     WHERE MONTH(periodo) = MONTH(CURDATE())
       AND YEAR(periodo) = YEAR(CURDATE())`,
    (err, result) => {
      if (err) return res.json({ total: 0 });
      res.json({ total: result[0].total });
    }
  );
});

// ÚLTIMA RECEITA
app.get("/receitas/ultima", (req, res) => {
  db.query(
    "SELECT * FROM receita ORDER BY periodo DESC, ID DESC LIMIT 1",
    (err, result) => {
      if (err) return res.json(null);
      res.json(result[0] || null);
    }
  );
});

// SEMANA
app.get("/receitas/semana", (req, res) => {
  db.query(
    `SELECT DAYNAME(periodo) AS dia, SUM(valor) AS total
     FROM receita
     WHERE periodo >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DAYNAME(periodo)`,
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

/* =========================
   DESPESAS (placeholder)
========================= */
app.get("/despesas/total", (req, res) => {
  res.json({ total: 0 });
});


/* =========================
   DESPESAS
========================= */

// LISTAR DESPESAS
app.get("/despesas", (req, res) => {
  const sql = `
    SELECT
      ID,
      DATE_FORMAT(periodo, '%Y-%m-%d') AS periodo,
      valor,
      categoria,
      banco,
      descricao,
      parcelamento,
      situacao,
      periodicidade
    FROM despesa
    ORDER BY periodo DESC, ID DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("🔥 ERRO MYSQL /despesas:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});

// BUSCAR DESPESA POR ID
app.get("/despesas/:id", (req, res) => {
  db.query(
    "SELECT * FROM despesa WHERE ID = ?",
    [req.params.id],
    (err, result) => {
      if (err || result.length === 0) return res.json(null);
      res.json(result[0]);
    }
  );
});

// CADASTRAR DESPESA
app.post("/despesas", (req, res) => {
  const {
    valor,
    periodo,
    categoria,
    banco,
    parcelamento,
    situacao,
    periodicidade,
    descricao
  } = req.body;

  if (!valor || !periodo || !categoria || !banco || !situacao || !periodicidade) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.query(
    `INSERT INTO despesa
     (valor, periodo, categoria, banco, parcelamento, situacao, periodicidade, descricao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      valor,
      periodo,
      categoria,
      banco,
      parcelamento || false,
      situacao,
      periodicidade,
      descricao || null
    ],
    err => {
      if (err) {
        console.error("Erro ao salvar despesa:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

// ATUALIZAR DESPESA
app.put("/despesas/:id", (req, res) => {
  const {
    periodo,
    hora,
    valor,
    banco,
    parcelamento,
    situacao,
    periodicidade,
    descricao,
    obs
  } = req.body;

  db.query(
    `UPDATE despesa SET
      periodo = ?,
      hora = ?,
      valor = ?,
      banco = ?,
      parcelamento = ?,
      situacao = ?,
      periodicidade = ?,
      descricao = ?,
      obs = ?
     WHERE ID = ?`,
    [
      periodo,
      hora || null,
      valor,
      banco,
      parcelamento || false,
      situacao,
      periodicidade,
      descricao || null,
      obs || null,
      req.params.id
    ],
    err => {
      if (err) {
        console.error("Erro ao atualizar despesa:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

// EXCLUIR DESPESA
app.delete("/despesas/:id", (req, res) => {
  db.query(
    "DELETE FROM despesa WHERE ID = ?",
    [req.params.id],
    err => {
      if (err) {
        console.error("Erro ao excluir despesa:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

/* =========================
   AGENDA / PLANEJAMENTOS
========================= */

// LISTAR PLANEJAMENTOS DO USUÁRIO
app.get("/agenda/:usuarioId", (req, res) => {
  const sql = `
    SELECT
      ID,
      data_inc,
      data_pvst,
      valor_limite,
      valor_gasto,
      objetivo,
      obs
    FROM agenda
    WHERE codusuario = ?
    ORDER BY data_inc DESC
  `;

  db.query(sql, [req.params.usuarioId], (err, result) => {
    if (err) {
      console.error("Erro ao listar agenda:", err);
      return res.status(500).json([]);
    }
    res.json(result);
  });
});


// BUSCAR UM PLANEJAMENTO POR ID
app.get("/agenda/item/:id", (req, res) => {
  db.query(
    "SELECT * FROM agenda WHERE ID = ?",
    [req.params.id],
    (err, result) => {
      if (err || result.length === 0) return res.json(null);
      res.json(result[0]);
    }
  );
});


// CRIAR PLANEJAMENTO
app.post("/agenda", (req, res) => {
  const {
    data_inc,
    data_pvst,
    valor_limite,
    valor_gasto,
    objetivo,
    obs,
    codusuario
  } = req.body;

  if (!data_inc || !valor_limite || !objetivo || !codusuario) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  const sql = `
    INSERT INTO agenda
    (data_inc, data_pvst, valor_limite, valor_gasto, objetivo, obs, codusuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data_inc,
      data_pvst || null,
      valor_limite,
      valor_gasto || 0,
      objetivo,
      obs || null,
      codusuario
    ],
    err => {
      if (err) {
        console.error("Erro ao salvar planejamento:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});


// ATUALIZAR PLANEJAMENTO
// ATUALIZAR PLANEJAMENTO
app.put("/agenda/:id", (req, res) => {
  const {
    data_inc,
    data_pvst,
    valor_limite,
    valor_gasto,
    objetivo,
    obs
  } = req.body;

  if (!data_inc || !valor_limite || !objetivo) {
    return res.status(400).json({
      error: "Campos obrigatórios faltando para edição"
    });
  }

  const sql = `
    UPDATE agenda SET
      data_inc = ?,
      data_pvst = ?,
      valor_limite = ?,
      valor_gasto = ?,
      objetivo = ?,
      obs = ?
    WHERE ID = ?
  `;

  db.query(
    sql,
    [
      data_inc,
      data_pvst || null,
      valor_limite,
      valor_gasto || 0,
      objetivo,
      obs || null,
      req.params.id
    ],
    (err) => {
      if (err) {
        console.error("🔥 ERRO AO ATUALIZAR AGENDA:", err);
        return res.status(500).json({ error: true });
      }

      res.json({ success: true });
    }
  );
});


// EXCLUIR PLANEJAMENTO
app.delete("/agenda/:id", (req, res) => {
  db.query(
    "DELETE FROM agenda WHERE ID = ?",
    [req.params.id],
    err => {
      if (err) {
        console.error("Erro ao excluir planejamento:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});






















/* =========================
   SERVER
========================= */
app.listen(3000, () => {
  console.log("🚀 SmartCash rodando em http://localhost:3000");
});
