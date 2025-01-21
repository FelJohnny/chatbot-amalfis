require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env

const app = require("./app.js"); // Importa a aplicação Express

const PORT = 3000;
const https = require("https");

// const fs = require('fs');

// const httpsOptions = {
//     key: fs.readFileSync('/etc/letsencrypt/live/cliente.amalfis.com.br/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/cliente.amalfis.com.br/fullchain.pem')
// };

// const server = https.createServer(httpsOptions,app);

app.listen(PORT, () => {
  console.log("servidor de aplicação ligado na porta " + PORT);
});
