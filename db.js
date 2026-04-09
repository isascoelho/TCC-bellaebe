const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "230508Isa%",
  database: "smartcash"
});

db.connect(err => {
  if (err) {
    console.error("❌ Erro ao conectar no MySQL:", err);
  } else {
    console.log("✅ MySQL conectado com sucesso!");
  }
});

module.exports = db;