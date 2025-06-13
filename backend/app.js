const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ...existing routes and middleware...

app.use('/api/orders', require('./routes/orderRoutes'));

// ...rest of the file...
