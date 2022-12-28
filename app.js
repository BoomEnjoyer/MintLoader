const express = require("express");
const hbs = require('express-handlebars');
const path = require('path');
const panel = require("./panel/panel");
const config = require("./config");
const api = require("./api/api");

const start = process.argv.slice(2)[0];
const port = 80;

const app = express();

app.engine('hbs', hbs.engine({
    extname: '.hbs',
    partialsDir: [
        'panel/views/partials/'
    ],
    helpers: {},
    defaultLayout: false
}));

app.set("view engine", 'hbs');
app.set('views', path.join(__dirname, 'panel', 'views'));
app.use(express.static(path.join(__dirname, 'panel', 'public')));

if (start == 'maintenance') {
    app.get('/*', async (req, res) => {
        res.render('maintenance')
    })
} else {
    app.use('/api', api);
    app.use('/panel', panel);
    app.listen(port, () => {
        console.log(`Application successfully started on port ${port}`)
    })
}