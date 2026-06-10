const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");
const fs = require("fs");
const multer = require("multer");


const app = express();

const uploadDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.session.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Arquivo inválido"));
    }
  }
});

/* =========================
   CONFIG
========================= */
app.use(express.json());

app.use(session({
  secret: "smartcash-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
  }
}));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   AUTH MIDDLEWARE
========================= */
function auth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

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
  cpf = (cpf || "").replace(/\D/g, "").trim();

  const sql = `
    INSERT INTO usuario
    (nome, email, cpf, data_nascimento, fone, senha)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, email, cpf, data_nascimento || null, fone || null, senha], err => {
    if (err) {
      console.error("Erro no cadastro:", err);
      return res.status(500).json({ error: "Erro ao cadastrar usuário" });
    }

    res.json({ success: true });
  });
});

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  let { cpf, senha } = req.body;

  cpf = cpf.replace(/\D/g, "").trim();
  senha = senha.trim();

  console.log("CPF recebido:", cpf);
  console.log("Senha recebida:", senha);

  const sql = `
    SELECT ID, nome, email, foto
    FROM usuario
    WHERE cpf = ?
      AND TRIM(senha) = ?
    LIMIT 1
  `;

  db.query(sql, [cpf, senha], (err, result) => {
    if (err) return res.status(500).json({ error: "Erro no login" });
    if (!result.length) {
      return res.status(401).json({ error: "CPF ou senha inválidos" });
    }

    req.session.userId = result[0].ID;
    res.json(result[0]);
  });
});

/* =========================
   USUÁRIO LOGADO
========================= */
app.get("/me", auth, (req, res) => {
  db.query(
    "SELECT ID, nome, email, cpf, data_nascimento, fone, sexo, endereco, vinculo, foto FROM usuario WHERE ID = ?",
    [req.session.userId],
    (err, result) => {
      if (err || !result.length) return res.status(500).json(null);
      res.json(result[0]);
    }
  );
});

app.put("/me", auth, (req, res) => {
  const { field, value } = req.body;
  const permitidos = ["cpf", "data_nascimento", "fone", "email", "sexo", "endereco", "vinculo"];

  if (!permitidos.includes(field)) {
    return res.status(400).json({ error: "Campo inválido" });
  }

  let finalValue = value;
  if (field === "cpf") {
    finalValue = value.replace(/\D/g, "");
  }

  db.query(
    `UPDATE usuario SET ${field} = ? WHERE ID = ?`,
    [finalValue, req.session.userId],
    err => {
      if (err) {
        console.error("Erro ao atualizar usuário:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

/* =========================
   RECEITAS
========================= */

app.get("/receitas/total", auth, (req, res) => {
  db.query(
    "SELECT IFNULL(SUM(valor),0) AS total FROM receita WHERE idusuario = ?",
    [req.session.userId],
    (err, result) => {
      if (err) return res.json({ total: 0 });
      res.json({ total: result[0].total });
    }
  );
});

app.get("/receitas/total-mes", auth, (req, res) => {
  db.query(
    `
    SELECT IFNULL(SUM(valor),0) AS total
    FROM receita
    WHERE idusuario = ?
      AND MONTH(periodo) = MONTH(CURDATE())
      AND YEAR(periodo) = YEAR(CURDATE())
    `,
    [req.session.userId],
    (err, result) => {
      if (err) {
        console.error("Erro ao buscar total de receitas do mês:", err);
        return res.json({ total: 0 });
      }
      res.json({ total: result[0]?.total || 0 });
    }
  );
});

app.get("/receitas/ultima", auth, (req, res) => {
  db.query(
    `
    SELECT *
    FROM receita
    WHERE idusuario = ?
    ORDER BY periodo DESC, ID DESC
    LIMIT 1
    `,
    [req.session.userId],
    (err, result) => {
      if (err || !result.length) return res.json(null);
      res.json(result[0]);
    }
  );
});

app.get("/receitas/semana", auth, (req, res) => {
  db.query(
    `
    SELECT
      DAYNAME(periodo) AS dia,
      SUM(valor) AS total
    FROM receita
    WHERE idusuario = ?
      AND periodo >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DAYNAME(periodo)
    `,
    [req.session.userId],
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

app.get("/receitas/relatorio", auth, (req, res) => {
  const { inicio, fim } = req.query;

  if (!inicio || !fim) {
    return res.status(400).json([]);
  }

  const sql = `
    SELECT
      periodo,
      categoria,
      valor
    FROM receita
    WHERE idusuario = ?
      AND periodo BETWEEN ? AND ?
    ORDER BY periodo ASC
  `;

  db.query(sql, [req.session.userId, inicio, fim], (err, result) => {
    if (err) {
      console.error("Erro relatório receitas:", err);
      return res.json([]);
    }
    res.json(result);
  });
});

// ✅ ANTES de /receitas/:id
app.get("/receitas/meses", auth, (req, res) => {
  db.query(
    `SELECT DISTINCT DATE_FORMAT(periodo, '%Y-%m') as mes 
     FROM receita 
     WHERE idusuario = ? 
     ORDER BY mes DESC`,
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      res.json(result.map(r => r.mes));
    }
  );
});

app.get("/receitas/:id", auth, (req, res) => {
  db.query(
    "SELECT * FROM receita WHERE ID = ? AND idusuario = ? LIMIT 1",
    [req.params.id, req.session.userId],
    (err, result) => {
      if (err || !result.length) return res.json(null);
      res.json(result[0]);
    }
  );
});

app.get("/receitas", auth, (req, res) => {
  db.query(
    "SELECT * FROM receita WHERE idusuario = ? ORDER BY periodo DESC",
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json([]);
      res.json(result);
    }
  );
});

app.post("/receitas", auth, (req, res) => {
  const { valor, periodo, categoria, banco, periodicidade, descricao } = req.body;

  const sql = `
    INSERT INTO receita
    (valor, periodo, categoria, banco, periodicidade, descricao, idusuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      valor,
      periodo,
      categoria,
      banco,
      periodicidade || null,
      descricao || null,
      req.session.userId
    ],
    err => {
      if (err) {
        console.error("ERRO AO SALVAR RECEITA:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

app.put("/receitas/:id", auth, (req, res) => {
  const { valor, periodo, categoria, banco, periodicidade, descricao } = req.body;

  db.query(
    `
    UPDATE receita SET
      valor = ?,
      periodo = ?,
      categoria = ?,
      banco = ?,
      periodicidade = ?,
      descricao = ?
    WHERE ID = ? AND idusuario = ?
    `,
    [
      valor,
      periodo,
      categoria || null,
      banco || null,
      periodicidade || null,
      descricao || null,
      req.params.id,
      req.session.userId
    ],
    err => {
      if (err) {
        console.error("Erro ao atualizar receita:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

app.delete("/receitas/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM receita WHERE ID = ? AND idusuario = ?",
    [req.params.id, req.session.userId],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

/* =========================
   DESPESAS
========================= */

app.get("/despesas/total", auth, (req, res) => {
  db.query(
    "SELECT IFNULL(SUM(valor),0) AS total FROM despesa WHERE idusuario = ?",
    [req.session.userId],
    (err, result) => {
      if (err) return res.json({ total: 0 });
      res.json({ total: result[0].total });
    }
  );
});

app.get("/despesas/total-mes", auth, (req, res) => {
  db.query(
    `
    SELECT IFNULL(SUM(valor),0) AS total
    FROM despesa
    WHERE idusuario = ?
      AND MONTH(periodo) = MONTH(CURDATE())
      AND YEAR(periodo) = YEAR(CURDATE())
    `,
    [req.session.userId],
    (err, result) => {
      if (err) {
        console.error("Erro ao buscar total de despesas do mês:", err);
        return res.json({ total: 0 });
      }
      res.json({ total: result[0]?.total || 0 });
    }
  );
});

app.get("/despesas/ultima", auth, (req, res) => {
  db.query(
    `
    SELECT *
    FROM despesa
    WHERE idusuario = ?
    ORDER BY periodo DESC, ID DESC
    LIMIT 1
    `,
    [req.session.userId],
    (err, result) => {
      if (err || !result.length) return res.json(null);
      res.json(result[0]);
    }
  );
});

app.get("/despesas/semana", auth, (req, res) => {
  db.query(
    `
    SELECT
      DAYNAME(periodo) AS dia,
      SUM(valor) AS total
    FROM despesa
    WHERE idusuario = ?
      AND periodo >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DAYNAME(periodo)
    `,
    [req.session.userId],
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

app.get("/despesas/relatorio", auth, (req, res) => {
  const { inicio, fim } = req.query;

  if (!inicio || !fim) {
    return res.status(400).json([]);
  }

  const sql = `
    SELECT
      periodo,
      categoria,
      SUM(valor) AS total
    FROM despesa
    WHERE idusuario = ?
      AND periodo BETWEEN ? AND ?
    GROUP BY periodo, categoria
    ORDER BY periodo ASC
  `;

  db.query(
    sql,
    [req.session.userId, inicio, fim],
    (err, result) => {
      if (err) {
        console.error("Erro relatório despesas:", err);
        return res.json([]);
      }
      res.json(result);
    }
  );
});

// ✅ ANTES de /despesas/:id
app.get("/despesas/meses", auth, (req, res) => {
  db.query(
    `SELECT DISTINCT DATE_FORMAT(periodo, '%Y-%m') as mes 
     FROM despesa 
     WHERE idusuario = ? 
     ORDER BY mes DESC`,
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      res.json(result.map(r => r.mes));
    }
  );
});

app.get("/despesas/:id", auth, (req, res) => {
  db.query(
    "SELECT * FROM despesa WHERE ID = ? AND idusuario = ? LIMIT 1",
    [req.params.id, req.session.userId],
    (err, result) => {
      if (err || !result.length) return res.json(null);
      res.json(result[0]);
    }
  );
});

app.get("/despesas", auth, (req, res) => {
  db.query(
    "SELECT * FROM despesa WHERE idusuario = ? ORDER BY periodo DESC",
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json([]);
      res.json(result);
    }
  );
});

app.post("/despesas", auth, (req, res) => {
  const {
    periodo,
    hora,
    valor,
    parcelamento,
    situacao,
    periodicidade,
    categoria,
    banco,
    descricao,
    obs
  } = req.body;

  if (!periodo || !valor || !situacao || !periodicidade) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.query(
    `
    INSERT INTO despesa
    (periodo, hora, valor, parcelamento, situacao, periodicidade, categoria, banco, descricao, obs, idusuario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      periodo,
      hora || null,
      valor,
      parcelamento || false,
      situacao,
      periodicidade,
      categoria || null,
      banco || null,
      descricao || null,
      obs || null,
      req.session.userId
    ],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

app.put("/despesas/:id", auth, (req, res) => {
  const {
    periodo,
    hora,
    valor,
    parcelamento,
    situacao,
    periodicidade,
    categoria,
    banco,
    descricao,
    obs
  } = req.body;

  if (!periodo || !valor || !situacao || !periodicidade) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.query(
    `
    UPDATE despesa SET
      periodo = ?,
      hora = ?,
      valor = ?,
      parcelamento = ?,
      situacao = ?,
      periodicidade = ?,
      categoria = ?,
      banco = ?,
      descricao = ?,
      obs = ?
    WHERE ID = ? AND idusuario = ?
    `,
    [
      periodo,
      hora || null,
      valor,
      parcelamento || false,
      situacao,
      periodicidade,
      categoria || null,
      banco || null,
      descricao || null,
      obs || null,
      req.params.id,
      req.session.userId
    ],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

app.delete("/despesas/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM despesa WHERE ID = ? AND idusuario = ?",
    [req.params.id, req.session.userId],
    err => {
      if (err) return res.status(500).json({ error: true });
      res.json({ success: true });
    }
  );
});

/* =========================
   AGENDA
========================= */
app.get("/agenda", auth, (req, res) => {
  db.query(
    "SELECT * FROM agenda WHERE codusuario = ? ORDER BY data_inc DESC",
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json([]);
      res.json(result);
    }
  );
});

app.post("/agenda", auth, (req, res) => {
  const {
    objetivo,
    data_inc,
    data_pvst,
    valor_limite,
    valor_gasto,
    obs
  } = req.body;

  if (!objetivo || !data_inc || isNaN(valor_limite)) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  const sql = `
    INSERT INTO agenda
    (objetivo, data_inc, data_pvst, valor_limite, valor_gasto, obs, codusuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      objetivo,
      data_inc,
      data_pvst || null,
      Number(valor_limite),
      Number(valor_gasto) || 0,
      obs || null,
      req.session.userId
    ],
    err => {
      if (err) {
        console.error("🔥 ERRO AO SALVAR AGENDA:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

app.put("/agenda/:id", auth, (req, res) => {
  const {
    objetivo,
    data_inc,
    data_pvst,
    valor_limite,
    valor_gasto,
    obs
  } = req.body;

  if (!objetivo || !data_inc || valor_limite === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  const sql = `
    UPDATE agenda SET
      objetivo = ?,
      data_inc = ?,
      data_pvst = ?,
      valor_limite = ?,
      valor_gasto = ?,
      obs = ?
    WHERE ID = ? AND codusuario = ?
  `;

  db.query(
    sql,
    [
      objetivo,
      data_inc,
      data_pvst || null,
      valor_limite,
      valor_gasto || 0,
      obs || null,
      req.params.id,
      req.session.userId
    ],
    err => {
      if (err) {
        console.error("🔥 ERRO AO ATUALIZAR AGENDA:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

app.delete("/agenda/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM agenda WHERE ID = ? AND codusuario = ?",
    [req.params.id, req.session.userId],
    err => {
      if (err) {
        console.error("Erro ao excluir agenda:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard/resumo", auth, (req, res) => {
  const userId = req.session.userId;

  db.query(
    "SELECT IFNULL(SUM(valor), 0) AS totalReceitas FROM receita WHERE idusuario = ?",
    [userId],
    (err, receitasResult) => {
      if (err) {
        console.error("Erro ao buscar total de receitas:", err);
        return res.status(500).json({ error: true });
      }

      const totalReceitas = Number(receitasResult[0].totalReceitas || 0);

      db.query(
        "SELECT IFNULL(SUM(valor), 0) AS totalDespesas FROM despesa WHERE idusuario = ?",
        [userId],
        (err, despesasResult) => {
          if (err) {
            console.error("Erro ao buscar total de despesas:", err);
            return res.status(500).json({ error: true });
          }

          const totalDespesas = Number(despesasResult[0].totalDespesas || 0);
          const saldo = totalReceitas - totalDespesas;

          db.query(
            `
            SELECT *
            FROM receita
            WHERE idusuario = ?
            ORDER BY periodo DESC, ID DESC
            LIMIT 1
            `,
            [userId],
            (err, ultimaReceitaResult) => {
              if (err) {
                console.error("Erro ao buscar última receita:", err);
                return res.status(500).json({ error: true });
              }

              db.query(
                `
                SELECT *
                FROM despesa
                WHERE idusuario = ?
                ORDER BY periodo DESC, ID DESC
                LIMIT 1
                `,
                [userId],
                (err, ultimaDespesaResult) => {
                  if (err) {
                    console.error("Erro ao buscar última despesa:", err);
                    return res.status(500).json({ error: true });
                  }

                  res.json({
                    totalReceitas,
                    totalDespesas,
                    saldo,
                    ultimaReceita: ultimaReceitaResult[0] || null,
                    ultimaDespesa: ultimaDespesaResult[0] || null
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

/* =========================
   FOTO
========================= */
app.post("/me/foto", auth, upload.single("foto"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  const caminhoFoto = `/uploads/${req.file.filename}`;

  db.query(
    "UPDATE usuario SET foto = ? WHERE ID = ?",
    [caminhoFoto, req.session.userId],
    err => {
      if (err) {
        console.error("Erro ao salvar foto:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true, foto: caminhoFoto });
    }
  );
});
/*Deletar foto*/
app.delete("/me/foto", auth, (req, res) => {
  db.query(
    "UPDATE usuario SET foto = NULL WHERE ID = ?",
    [req.session.userId],
    err => {
      if (err) {
        console.error("Erro ao remover foto:", err);
        return res.status(500).json({ error: true });
      }
      res.json({ success: true });
    }
  );
});
/*alterar senha*/
app.put("/me/senha", auth, (req, res) => {
  const { senhaAtual, senhaNova } = req.body; // ← era novaSenha, agora senhaNova

  if (!senhaAtual || !senhaNova) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.query(
    "SELECT ID FROM usuario WHERE ID = ? AND TRIM(senha) = ?",
    [req.session.userId, senhaAtual.trim()],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      if (!result.length) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      db.query(
        "UPDATE usuario SET senha = ? WHERE ID = ?",
        [senhaNova.trim(), req.session.userId],
        err => {
          if (err) return res.status(500).json({ error: true });
          res.json({ success: true });
        }
      );
    }
  );
});


/* =========================
   RECUPERAR SENHA
========================= */
app.post("/recuperar-senha/verificar", (req, res) => {
  let { cpf } = req.body;
  cpf = (cpf || "").replace(/\D/g, "").trim();

  if (!cpf) return res.status(400).json({ error: "CPF obrigatório" });

  db.query(
    "SELECT ID FROM usuario WHERE cpf = ? LIMIT 1",
    [cpf],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      if (!result.length) return res.status(404).json({ error: "CPF não encontrado" });
      res.json({ success: true });
    }
  );
});

app.post("/recuperar-senha/redefinir", (req, res) => {
  let { cpf, novaSenha } = req.body;
  cpf = (cpf || "").replace(/\D/g, "").trim();
  novaSenha = (novaSenha || "").trim();

  if (!cpf || !novaSenha) return res.status(400).json({ error: "Campos obrigatórios" });

  db.query(
    "UPDATE usuario SET senha = ? WHERE cpf = ?",
    [novaSenha, cpf],
    (err, result) => {
      if (err) return res.status(500).json({ error: true });
      if (result.affectedRows === 0) return res.status(404).json({ error: "CPF não encontrado" });
      res.json({ success: true });
    }
  );
});

/* =========================
   LOGOUT / EXCLUIR CONTA
========================= */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.delete("/me", auth, (req, res) => {
  const id = req.session.userId;

  db.query("DELETE FROM agenda WHERE codusuario = ?", [id], err => {
    if (err) return res.status(500).json({ error: true });

    db.query("DELETE FROM receita WHERE idusuario = ?", [id], err => {
      if (err) return res.status(500).json({ error: true });

      db.query("DELETE FROM despesa WHERE idusuario = ?", [id], err => {
        if (err) return res.status(500).json({ error: true });

        db.query("DELETE FROM usuario WHERE ID = ?", [id], err => {
          if (err) return res.status(500).json({ error: true });

          req.session.destroy(() => {
            res.json({ success: true });
          });
        });
      });
    });
  });
});

/* =========================
   SERVER
========================= */
app.listen(3000, () => {
  console.log("🚀 Fintly rodando em http://localhost:3000");
});